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

  await prisma.$transaction(async (tx) => {
    await tx.chat.upsert({
      where: { id: chatId },
      create: {
        id: chatId,
        userId: userId,
        title: prompt.slice(0, 50) + (prompt.length > 50 ? "..." : ""),
      },
      update: {
        updatedAt: new Date(),
      },
    });

    await tx.prompt.upsert({
      where: { id: promptId },
      create: {
        id: promptId,
        chatId: chatId,
        content: prompt,
      },
      update: {},
    });
  });

  // Get provider from query params
  const { searchParams } = new URL(request.url);
  const providerParam = searchParams.get("provider");
  const provider = providerParam as Provider;

  // Validate provider
  if (!["openai", "anthropic", "xai"].includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  // Optimized check: Only query if we might have a cached response
  // Uses composite index on [promptId, provider] for fast lookup
  const existingResponse = await prisma.response.findFirst({
    where: { promptId, provider },
    select: {
      id: true,
      status: true,
      content: true,
      promptTokens: true,
      completionTokens: true,
      totalTokens: true,
      cost: true,
    },
    // Use the composite index efficiently
    orderBy: { id: "desc" }, // Get most recent if multiple exist
  });

  if (existingResponse) {
    if (existingResponse.status === "success" && existingResponse.content) {
      // Return cached content in streaming format with metadata
      // Include metadata to match streaming response format
      const metadata = {
        promptTokens: existingResponse.promptTokens,
        completionTokens: existingResponse.completionTokens,
        totalTokens: existingResponse.totalTokens,
        cost: existingResponse.cost,
      };
      const metadataJson = JSON.stringify(metadata);
      const responseBody = `${existingResponse.content}\n\n__METADATA__${metadataJson}__METADATA__`;

      return new Response(responseBody, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // If it was an error, delete and allow retry (non-blocking)
    if (existingResponse.status === "error") {
      // Use deleteMany for better performance, fire and forget
      prisma.response
        .deleteMany({ where: { id: existingResponse.id } })
        .catch((err) => {
          if (!isAbortError(err)) {
            console.error("Error deleting failed response:", err);
          }
        });
    }
  }

  const config = getModelConfig(provider);
  const startTime = Date.now();
  let metadata: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  } | null = null;
  let metadataResolve:
    | ((value: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        cost: number;
      }) => void)
    | null = null;
  const metadataPromise = new Promise<{
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  }>((resolve) => {
    metadataResolve = resolve;
  });

  try {
    const result = streamText({
      model: config.model,
      prompt,
      abortSignal: request.signal,
      onFinish: async ({ text, usage }) => {
        if (request.signal.aborted) {
          return;
        }

        const latency = Date.now() - startTime;
        const promptTokens = usage?.inputTokens ?? 0;
        const completionTokens = usage?.outputTokens ?? 0;

        const pricingKey = GATEWAY_MODELS[provider].pricingKey;
        const cost = calculateCost(pricingKey, promptTokens, completionTokens);

        metadata = {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          cost,
        };

        if (metadataResolve) {
          metadataResolve(metadata);
        }

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
          if (!isAbortError(dbError)) {
            console.error("Error saving response:", dbError);
          }
        }
      },
    });

    const stream = result.toTextStreamResponse();
    const originalBody = stream.body;

    if (!originalBody) {
      return stream;
    }

    const reader = originalBody.getReader();
    const encoder = new TextEncoder();

    const newStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              try {
                const finalMetadata = await Promise.race([
                  metadataPromise,
                  new Promise<typeof metadata>((resolve) =>
                    setTimeout(() => resolve(metadata), 2000),
                  ),
                ]);

                if (finalMetadata) {
                  const metadataJson = JSON.stringify(finalMetadata);
                  controller.enqueue(
                    encoder.encode(
                      `\n\n__METADATA__${metadataJson}__METADATA__`,
                    ),
                  );
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
              } catch (e) {}
              controller.close();
              break;
            }
            controller.enqueue(value);
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(newStream, {
      headers: stream.headers,
    });
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
