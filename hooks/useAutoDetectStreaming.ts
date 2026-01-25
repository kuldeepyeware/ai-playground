import { useEffect } from "react";
import type { Chat } from "@/types/chat";

interface UseAutoDetectStreamingProps {
  chat: Chat | null | undefined;
  isLoading: boolean;
  streamingStartedRef: React.RefObject<Set<string>>;
  startStreamingForPrompts: (promptIds: string[]) => void;
  clearOptimisticPromptIfMatches: (promptContent: string) => void;
  optimisticPrompt: { id: string; content: string } | null;
  scrollToBottom: () => void;
}

export function useAutoDetectStreaming({
  chat,
  isLoading,
  streamingStartedRef,
  startStreamingForPrompts,
  clearOptimisticPromptIfMatches,
  optimisticPrompt,
  scrollToBottom,
}: UseAutoDetectStreamingProps) {
  // Auto-detect prompts without responses and start streaming
  useEffect(() => {
    if (isLoading || !chat) return;

    const promptsWithoutResponses = chat.prompts.filter(
      (prompt) =>
        prompt.responses?.length === 0 &&
        !streamingStartedRef.current.has(prompt.id),
    );

    if (promptsWithoutResponses.length > 0) {
      const promptIds = promptsWithoutResponses.map((p) => p.id);
      startStreamingForPrompts(promptIds);

      // Clear optimistic prompt if it matches a real prompt
      if (optimisticPrompt) {
        const matchingPrompt = promptsWithoutResponses.find(
          (p) => p.content === optimisticPrompt.content,
        );
        if (matchingPrompt) {
          clearOptimisticPromptIfMatches(optimisticPrompt.content);
        }
      }

      scrollToBottom();
    }
  }, [
    chat,
    isLoading,
    optimisticPrompt,
    scrollToBottom,
    streamingStartedRef,
    startStreamingForPrompts,
    clearOptimisticPromptIfMatches,
  ]);
}
