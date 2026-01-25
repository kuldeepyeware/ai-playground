import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { OptimisticPrompt } from "@/types/chat";

export function useStreamingState(chatId: string) {
  const queryClient = useQueryClient();
  const [streamingPromptIds, setStreamingPromptIds] = useState<Set<string>>(
    new Set(),
  );
  const [optimisticPrompt, setOptimisticPrompt] =
    useState<OptimisticPrompt | null>(null);
  const completedStreamsRef = useRef<Map<string, Set<string>>>(new Map());
  const streamingStartedRef = useRef<Set<string>>(new Set());

  // Reset tracking when chat ID changes
  useEffect(() => {
    streamingStartedRef.current = new Set();
    completedStreamsRef.current = new Map();

    return () => {
      streamingStartedRef.current = new Set();
      completedStreamsRef.current = new Map();
    };
  }, [chatId]);

  const isStreaming = streamingPromptIds.size > 0;

  const handlePromptSubmit = (promptId: string, promptContent: string) => {
    // Show optimistic prompt immediately
    setOptimisticPrompt({ id: promptId, content: promptContent });

    // Mark as streaming
    streamingStartedRef.current.add(promptId);
    setStreamingPromptIds((prev) => new Set(prev).add(promptId));

    // Initialize completion tracking for this prompt
    completedStreamsRef.current.set(promptId, new Set());
  };

  const handleStreamComplete = (promptId: string, provider: string) => {
    if (!completedStreamsRef.current.has(promptId)) {
      completedStreamsRef.current.set(promptId, new Set());
    }

    completedStreamsRef.current.get(promptId)!.add(provider);

    // Check if all 3 providers completed for this prompt
    if (completedStreamsRef.current.get(promptId)!.size === 3) {
      // Invalidate and refetch queries to get saved responses
      queryClient.invalidateQueries({ queryKey: ["get-chat", chatId] });
      queryClient.invalidateQueries({ queryKey: ["get-chats"] });

      // Refetch and wait for completion to ensure data is loaded
      queryClient.refetchQueries({ queryKey: ["get-chat", chatId] }).then(() => {
        // Check if the prompt has responses in the updated chat data
        const updatedChat = queryClient.getQueryData([
          "get-chat",
          chatId,
        ]) as { prompts?: Array<{ id: string; responses?: unknown[] }> } | null;
        const promptHasResponses = updatedChat?.prompts?.find(
          (p) => p.id === promptId,
        )?.responses?.length;

        // Only remove from streaming state if responses are loaded
        // This prevents showing "No response available" during refetch
        if (promptHasResponses && promptHasResponses > 0) {
          // Remove from streaming state after data is confirmed loaded
          setStreamingPromptIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(promptId);
            return newSet;
          });

          // Clear optimistic prompt
          setOptimisticPrompt(null);

          // Cleanup completion tracking
          completedStreamsRef.current.delete(promptId);
        } else {
          // If responses aren't loaded yet, check again after a short delay
          setTimeout(() => {
            const retryChat = queryClient.getQueryData([
              "get-chat",
              chatId,
            ]) as { prompts?: Array<{ id: string; responses?: unknown[] }> } | null;
            const retryHasResponses = retryChat?.prompts?.find(
              (p) => p.id === promptId,
            )?.responses?.length;

            if (retryHasResponses && retryHasResponses > 0) {
              setStreamingPromptIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(promptId);
                return newSet;
              });
              setOptimisticPrompt(null);
              completedStreamsRef.current.delete(promptId);
            }
          }, 300);
        }
      });
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

  const clearOptimisticPromptIfMatches = (promptContent: string) => {
    if (optimisticPrompt?.content === promptContent) {
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
