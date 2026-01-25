import { useQuery } from "@tanstack/react-query";
import { getUserChats } from "@/actions/chat";

export function useGetUserChats() {
  return useQuery({
    queryKey: ["get-chats"],
    queryFn: async () => {
      try {
        const result = await getUserChats();
        return result.chats || [];
      } catch (error) {
        console.error("Error fetching chats:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous data during refetch to prevent blink
    refetchOnWindowFocus: false, // Don't refetch on window focus
    gcTime: 1000 * 60 * 10, // Keep data in cache for 10 minutes (formerly cacheTime)
  });
}
