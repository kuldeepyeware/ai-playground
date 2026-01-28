"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { Chat } from "@/types/chat";

export async function getUserChats() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { error: "Unauthorized", chats: [] };
    }

    const chats = await prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 50, // Limit to 50 most recent chats
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { error: null, chats };
  } catch (error) {
    console.error("Error fetching chats:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to fetch chats",
      chats: [],
    };
  }
}

export async function getChatById(
  chatId: string,
): Promise<{ error: string | null; chat: Chat | null }> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { error: "Unauthorized", chat: null };
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId, // Ensure user owns this chat
      },
      include: {
        prompts: {
          orderBy: { createdAt: "asc" },
          include: {
            responses: {
              orderBy: { id: "asc" },
            },
          },
        },
      },
    });

    if (!chat) {
      return { error: "Chat not found", chat: null };
    }

    return { error: null, chat: chat as Chat };
  } catch (error) {
    console.error("Error fetching chat:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to fetch chat",
      chat: null,
    };
  }
}

export async function deleteChat(chatId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Verify chat belongs to user
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId,
      },
    });

    if (!chat) {
      return { error: "Chat not found" };
    }

    // Delete chat (cascade will delete prompts and responses)
    await prisma.chat.delete({
      where: { id: chatId },
    });

    revalidatePath("/chat");
    revalidatePath(`/chat/${chatId}`);
    return { error: null };
  } catch (error) {
    console.error("Error deleting chat:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to delete chat",
    };
  }
}
