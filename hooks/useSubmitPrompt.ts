import { useMutation } from "@tanstack/react-query";
import { generateId } from "@/lib/id-generator";

interface SubmitPromptOptions {
  onSuccess?: (promptId: string) => void;
  onError?: (error: string) => void;
}

interface SubmitPromptVariables {
  promptText: string;
  promptId?: string;
}

export function useSubmitPrompt(chatId: string, options?: SubmitPromptOptions) {
  return useMutation({
    mutationFn: async ({ promptText, promptId }: SubmitPromptVariables) => {
      if (!chatId) {
        throw new Error("Chat ID is required");
      }

      if (!promptText.trim()) {
        throw new Error("Prompt cannot be empty");
      }

      // Generate promptId if not provided
      // The API route will handle saving the prompt to the database
      return promptId || generateId();
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
