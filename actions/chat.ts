"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface CreateChatResult {
  error: string | null;
  chatId: string | null;
  promptId: string | null;
}

export async function createChat(
  initialPrompt?: string,
  providedChatId?: string,
): Promise<CreateChatResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { error: "Unauthorized", chatId: null, promptId: null };
    }

    // Create chat and optionally the first prompt in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create a new chat with provided ID
      const chat = await tx.chat.create({
        data: {
          id: providedChatId, // Use frontend-generated ID if provided
          userId: userId,
          title: initialPrompt
            ? initialPrompt.slice(0, 50) +
              (initialPrompt.length > 50 ? "..." : "")
            : null,
        },
      });

      let promptId: string | null = null;

      // If initial prompt provided, create it
      if (initialPrompt && initialPrompt.trim()) {
        const prompt = await tx.prompt.create({
          data: {
            chatId: chat.id,
            content: initialPrompt.trim(),
          },
        });
        promptId = prompt.id;
      }

      return { chatId: chat.id, promptId };
    });

    revalidatePath("/chat");
    revalidatePath(`/chat/${result.chatId}`);
    return { error: null, chatId: result.chatId, promptId: result.promptId };
  } catch (error) {
    console.error("Error creating chat:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to create chat",
      chatId: null,
      promptId: null,
    };
  }
}

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

export async function submitPrompt(chatId: string, prompt: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { error: "Unauthorized", promptId: null };
    }

    if (!prompt.trim()) {
      return { error: "Prompt cannot be empty", promptId: null };
    }

    // Verify chat belongs to user and create prompt in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Verify chat and get title status
      const chat = await tx.chat.findFirst({
        where: {
          id: chatId,
          userId,
        },
        select: { id: true, title: true }, // Only select needed fields
      });

      if (!chat) {
        throw new Error("Chat not found");
      }

      // Create prompt
      const createdPrompt = await tx.prompt.create({
        data: {
          chatId,
          content: prompt,
        },
      });

      // Update chat - combine title and updatedAt updates
      const updateData: { updatedAt: Date; title?: string } = {
        updatedAt: new Date(),
      };

      // Set title if it's the first prompt
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

    revalidatePath(`/chat/${chatId}`);
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
