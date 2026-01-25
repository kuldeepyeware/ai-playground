import { streamText, APICallError } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getModelConfig,
  GATEWAY_MODELS,
  type Provider,
} from "@/lib/adapters/gateway";
import { prisma } from "@/lib/db";
import { calculateCost } from "@/lib/pricing";
import { isAbortError, MODEL_NAMES } from "@/helpers/submit";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt, promptId } = body;

  if (!prompt || !promptId) {
    return NextResponse.json(
      { error: "Prompt and promptId are required" },
      { status: 400 },
    );
  }

  // Verify chat and prompt in parallel
  const [chat, promptRecord] = await Promise.all([
    prisma.chat.findFirst({
      where: {
        id: chatId,
        userId,
      },
      select: { id: true }, // Only select id to reduce data transfer
    }),
    prisma.prompt.findFirst({
      where: {
        id: promptId,
        chatId,
      },
      select: { id: true }, // Only select id to reduce data transfer
    }),
  ]);

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  if (!promptRecord) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  // Get provider from query params
  const { searchParams } = new URL(request.url);
  const providerParam = searchParams.get("provider");
  const provider = providerParam as Provider;

  // Validate provider
  if (!["openai", "anthropic", "xai"].includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  // Check if we already have a response for this prompt/provider combo
  // This prevents duplicate responses on retry/page refresh
  const existingResponse = await prisma.response.findFirst({
    where: { promptId, provider },
    select: { id: true, status: true, content: true }, // Only select needed fields
  });

  if (existingResponse) {
    if (existingResponse.status === "success" && existingResponse.content) {
      return new Response(existingResponse.content, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // If it was an error, let it retry
    if (existingResponse.status === "error") {
      await prisma.response.delete({ where: { id: existingResponse.id } });
    }
  }

  const config = getModelConfig(provider);
  const startTime = Date.now();

  try {
    const result = streamText({
      model: config.model,
      prompt,
      abortSignal: request.signal, // Pass the request's abort signal to gracefully handle client disconnects
      onFinish: async ({ text, usage }) => {
        if (request.signal.aborted) {
          return;
        }

        // Save response to database
        const latency = Date.now() - startTime;
        const promptTokens = usage?.inputTokens ?? 0;
        const completionTokens = usage?.outputTokens ?? 0;

        // Calculate cost using the pricing key
        const pricingKey = GATEWAY_MODELS[provider].pricingKey;
        const cost = calculateCost(pricingKey, promptTokens, completionTokens);

        try {
          await prisma.response.create({
            data: {
              promptId,
              model: MODEL_NAMES[provider],
              provider,
              content: text,
              latency,
              promptTokens,
              completionTokens,
              totalTokens: promptTokens + completionTokens,
              cost,
              status: "success",
            },
          });
        } catch (dbError) {
          // Ignore database errors if connection was reset
          if (!isAbortError(dbError)) {
            console.error("Error saving response:", dbError);
          }
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    // If client disconnected, just return silently
    if (isAbortError(error) || request.signal.aborted) {
      return new Response(null, { status: 499 }); // Client Closed Request
    }

    let errorMessage = "Unknown error";
    let statusCode = 500;

    if (error instanceof APICallError) {
      errorMessage = error.message;
      statusCode = error.statusCode || 500;

      // Handle rate limiting specifically
      if (statusCode === 429) {
        errorMessage = "Rate limited. Please wait and try again.";
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
