"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

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

export async function getChatById(chatId: string) {
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

    return { error: null, chat };
  } catch (error) {
    console.error("Error fetching chat:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to fetch chat",
      chat: null,
    };
  }
}

export async function submitPrompt(chatId: string, prompt: string, providedPromptId?: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { error: "Unauthorized", promptId: null };
    }

    if (!prompt.trim()) {
      return { error: "Prompt cannot be empty", promptId: null };
    }

    const result = await prisma.$transaction(async (tx) => {
      const chat = await tx.chat.findFirst({
        where: {
          id: chatId,
          userId,
        },
        select: { id: true, title: true },
      });

      if (!chat) {
        throw new Error("Chat not found");
      }

      const promptId = providedPromptId || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`);

      const createdPrompt = await tx.prompt.upsert({
        where: { id: promptId },
        create: {
          id: promptId,
          chatId,
          content: prompt,
        },
        update: {},
      });

      const updateData: { updatedAt: Date; title?: string } = {
        updatedAt: new Date(),
      };

      if (!chat.title) {
        updateData.title =
          prompt.slice(0, 50) + (prompt.length > 50 ? "..." : "");
      }

      await tx.chat.update({
        where: { id: chatId },
        data: updateData,
      });

      return { promptId: createdPrompt.id };
    });

    return { error: null, promptId: result.promptId };
  } catch (error) {
    console.error("Error submitting prompt:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to submit prompt",
      promptId: null,
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
