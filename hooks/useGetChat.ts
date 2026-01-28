import { useQuery } from "@tanstack/react-query";
import { getChatById } from "@/actions/chat";
import type { Chat } from "@/types/chat";

export function useGetChat(chatId: string | undefined) {
  return useQuery<Chat | null>({
    queryKey: ["get-chat", chatId],
    queryFn: async () => {
      if (!chatId) {
        return null;
      }
      const result = await getChatById(chatId);
      if (result.error || !result.chat) {
        return null;
      }
      return result.chat as Chat;
    },
    enabled: !!chatId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous data during refetch to prevent blink
    refetchOnWindowFocus: false, // Don't refetch on window focus
    gcTime: 1000 * 60 * 10, // Keep data in cache for 10 minutes
    retry: false, // Don't retry on error - if chat doesn't exist, it won't exist on retry
  });
}
