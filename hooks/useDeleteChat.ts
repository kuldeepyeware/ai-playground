import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteChat } from "@/actions/chat";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";

interface UseDeleteChatOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useDeleteChat(options?: UseDeleteChatOptions) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  return useMutation({
    mutationFn: async (chatId: string) => {
      const result = await deleteChat(chatId);
      if (result.error) {
        throw new Error(result.error);
      }
      return { chatId };
    },
    onSuccess: (data, chatId) => {
      // Invalidate queries to refresh the chat list
      queryClient.invalidateQueries({ queryKey: ["get-chats"] });

      // If we deleted the currently active chat, redirect to /chat
      if (chatId && pathname === `/chat/${chatId}`) {
        router.push("/chat");
      }

      // Show success toast
      toast.success("Chat deleted successfully");

      // Call custom onSuccess if provided
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      // Show error toast
      toast.error("Failed to delete chat", {
        description: error.message || "An unexpected error occurred",
      });

      // Call custom onError if provided
      options?.onError?.(error);
    },
  });
}
