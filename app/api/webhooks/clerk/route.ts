import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { ClerkWebhookEvent } from "@/types/webhook";
import { getPrimaryEmail } from "@/helpers/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let event: ClerkWebhookEvent;
  try {
    event = (await verifyWebhook(request)) as ClerkWebhookEvent;
  } catch (error) {
    console.error("Invalid signature", error);
    return NextResponse.json(
      {
        error: "Invalid signature",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400 },
    );
  }

  const { data, type } = event;
  const email = getPrimaryEmail(data);
  const name =
    [data.first_name, data.last_name].filter(Boolean).join(" ") || null;

  switch (type) {
    case "user.created":
    case "user.updated": {
      await prisma.user.upsert({
        where: { id: data.id },
        update: {
          email,
          name,
          imageUrl: data.image_url || null,
        },
        create: {
          id: data.id,
          email,
          name,
          imageUrl: data.image_url || null,
        },
      });
      break;
    }
    case "user.deleted": {
      await prisma.user.delete({
        where: { id: data.id },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
