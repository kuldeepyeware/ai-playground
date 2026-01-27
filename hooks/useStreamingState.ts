import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { OptimisticPrompt, Prompt } from "@/types/chat";

export function useStreamingState(chatId: string) {
  const queryClient = useQueryClient();
  const [streamingPromptIds, setStreamingPromptIds] = useState<Set<string>>(
    new Set(),
  );
  const [optimisticPrompt, setOptimisticPrompt] =
    useState<OptimisticPrompt | null>(null);
  const completedStreamsRef = useRef<Map<string, Set<string>>>(new Map());
  const streamingStartedRef = useRef<Set<string>>(new Set());
  const isFirstPromptRef = useRef<Map<string, boolean>>(new Map());

  // Reset tracking when chat ID changes
  useEffect(() => {
    streamingStartedRef.current = new Set();
    completedStreamsRef.current = new Map();
    isFirstPromptRef.current = new Map();

    return () => {
      streamingStartedRef.current = new Set();
      completedStreamsRef.current = new Map();
      isFirstPromptRef.current = new Map();
    };
  }, [chatId]);

  const isStreaming = streamingPromptIds.size > 0;

  const handlePromptSubmit = (promptId: string, promptContent: string) => {
    setOptimisticPrompt({ id: promptId, content: promptContent });

    streamingStartedRef.current.add(promptId);
    setStreamingPromptIds((prev) => new Set(prev).add(promptId));

    completedStreamsRef.current.set(promptId, new Set());

    const currentChat = queryClient.getQueryData<{ prompts: Prompt[] } | null>([
      "get-chat",
      chatId,
    ]);

    const isFirstPrompt =
      !currentChat || (currentChat.prompts && currentChat.prompts.length === 0);
    isFirstPromptRef.current.set(promptId, isFirstPrompt);

    if (currentChat) {
      const promptExists = currentChat.prompts.some((p) => p.id === promptId);
      if (!promptExists) {
        queryClient.setQueryData<{ prompts: Prompt[] }>(["get-chat", chatId], {
          ...currentChat,
          prompts: [
            ...currentChat.prompts,
            {
              id: promptId,
              content: promptContent,
              responses: [],
            },
          ],
        });
      }
    } else {
      queryClient.setQueryData<{ id: string; prompts: Prompt[] }>(
        ["get-chat", chatId],
        {
          id: chatId,
          prompts: [
            {
              id: promptId,
              content: promptContent,
              responses: [],
            },
          ],
        },
      );
    }
  };

  const handleStreamComplete = (promptId: string, provider: string) => {
    if (!completedStreamsRef.current.has(promptId)) {
      completedStreamsRef.current.set(promptId, new Set());
    }

    completedStreamsRef.current.get(promptId)!.add(provider);

    if (completedStreamsRef.current.get(promptId)!.size === 3) {
      setStreamingPromptIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(promptId);
        return newSet;
      });

      // Refetch chat data to get the saved responses
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["get-chat", chatId] });
      }, 1000);

      const isFirstPrompt = isFirstPromptRef.current.get(promptId) ?? false;

      if (isFirstPrompt) {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["get-chats"] });
        }, 500);
      }
    }
  };

  const startStreamingForPrompts = (promptIds: string[]) => {
    promptIds.forEach((promptId) => {
      streamingStartedRef.current.add(promptId);
      if (!completedStreamsRef.current.has(promptId)) {
        completedStreamsRef.current.set(promptId, new Set());
      }
    });

    setStreamingPromptIds((prev) => {
      const newSet = new Set(prev);
      promptIds.forEach((id) => newSet.add(id));
      return newSet;
    });
  };

  const clearOptimisticPromptIfMatches = (promptId: string) => {
    if (optimisticPrompt?.id === promptId) {
      setOptimisticPrompt(null);
    }
  };

  return {
    streamingPromptIds,
    optimisticPrompt,
    isStreaming,
    streamingStartedRef,
    handlePromptSubmit,
    handleStreamComplete,
    startStreamingForPrompts,
    clearOptimisticPromptIfMatches,
  };
}
