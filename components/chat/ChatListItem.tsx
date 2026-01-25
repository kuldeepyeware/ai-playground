"use client";

import Link from "next/link";
import { MessageSquare, Trash2 } from "lucide-react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface ChatListItemProps {
  chat: {
    id: string;
    title: string | null;
    createdAt: Date;
  };
  isActive: boolean;
  onDelete: (e: React.MouseEvent, chatId: string) => void;
}

export function ChatListItem({
  chat,
  isActive,
  onDelete,
}: ChatListItemProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarMenuItem>
      <div className='relative group flex items-center min-w-0'>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className={`${
            isActive ? "bg-(--background-secondary)" : ""
          } flex-1 min-w-0 pr-8`}>
          <Link
            href={`/chat/${chat.id}`}
            className='flex items-center gap-2 min-w-0 w-full'>
            <MessageSquare className='shrink-0' />
            <span className='flex-1 truncate min-w-0 text-ellipsis overflow-hidden'>
              {chat.title || `Chat ${chat.id.slice(0, 8)}`}
            </span>
          </Link>
        </SidebarMenuButton>

        {/* Delete button */}
        {!isCollapsed && (
          <button
            onClick={(e) => onDelete(e, chat.id)}
            className='absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-(--background-secondary) text-(--text-muted) hover:text-(--error) transition-colors shrink-0 z-10'
            aria-label='Delete chat'>
            <Trash2 className='h-3.5 w-3.5 cursor-pointer' />
          </button>
        )}
      </div>
    </SidebarMenuItem>
  );
}
