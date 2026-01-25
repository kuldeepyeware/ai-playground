import { useMutation } from "@tanstack/react-query";
import { submitPrompt } from "@/actions/chat";

interface SubmitPromptOptions {
  onSuccess?: (promptId: string) => void;
  onError?: (error: string) => void;
}

export function useSubmitPrompt(chatId: string, options?: SubmitPromptOptions) {
  return useMutation({
    mutationFn: async (promptText: string) => {
      if (!chatId) {
        throw new Error("Chat ID is required");
      }

      if (!promptText.trim()) {
        throw new Error("Prompt cannot be empty");
      }

      const result = await submitPrompt(chatId, promptText);
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.promptId) {
        throw new Error("Failed to create prompt");
      }

      return result.promptId;
    },
    onSuccess: (promptId) => {
      // Don't invalidate queries here - let the streaming completion handle it
      // This prevents duplicate fetches and race conditions
      options?.onSuccess?.(promptId);
    },
    onError: (error: Error) => {
      options?.onError?.(error.message);
    },
  });
}
