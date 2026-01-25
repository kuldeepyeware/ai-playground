"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Plus, Clock } from "lucide-react";
import { useGetUserChats } from "@/hooks/useGetUsersChats";
import { useDeleteChat } from "@/hooks/useDeleteChat";
import { ChatSidebarHeader } from "./SidebarHeader";
import { ChatListItem } from "./ChatListItem";
import { ChatListSkeleton } from "./ChatListSkeleton";
import { UserSection } from "./UserSection";
import { DeleteChatDialog } from "./DeleteChatDialog";

export function ChatSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const { data: chats = [], isLoading } = useGetUserChats();

  const deleteChatMutation = useDeleteChat({
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    },
  });

  const handleNewChat = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    router.push("/chat");
  };

  const handleDeleteClick = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setChatToDelete(chatId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (chatToDelete) {
      deleteChatMutation.mutate(chatToDelete);
    }
  };

  // Check if any chat is active (pathname is /chat/[id], not just /chat)
  const isChatActive = pathname.startsWith("/chat/") && pathname !== "/chat";

  return (
    <Sidebar collapsible='icon'>
      <ChatSidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* New Chat Button */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNewChat();
                  }}
                  type='button'
                  className={`py-5 cursor-pointer transition-colors pointer-events-auto ${
                    !isChatActive ? "bg-(--background-secondary)" : ""
                  }`}
                  tooltip='New Chat'
                  aria-label='New Chat'>
                  <Plus />
                  <span>New Chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>

          {/* Loading State - Skeleton */}
          {isLoading && <ChatListSkeleton />}

          {/* Your History Section */}
          {!isLoading && chats.length > 0 && (
            <>
              <SidebarGroupLabel className='flex items-center gap-x-2 mb-2 mt-2'>
                <div className='flex items-center justify-center rounded-full bg-(--background-secondary)'>
                  <Clock className='h-3.5 w-3.5 text-(--text-secondary)' />
                </div>
                <span className='text-xs font-medium text-(--text-secondary)'>
                  Your Chats
                </span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {chats.map((chat) => {
                    const isActive = pathname === `/chat/${chat.id}`;
                    return (
                      <ChatListItem
                        key={chat.id}
                        chat={chat}
                        isActive={isActive}
                        onDelete={handleDeleteClick}
                      />
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </>
          )}
        </SidebarGroup>
      </SidebarContent>

      <UserSection />

      <DeleteChatDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setChatToDelete(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteChatMutation.isPending}
      />
    </Sidebar>
  );
}
