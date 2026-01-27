"use client";

import Link from "next/link";
import { MessageSquare, Trash2 } from "lucide-react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { decryptMessage } from "@/lib/crypto";

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
  const { user } = useUser();
  const isCollapsed = state === "collapsed";
  const [decryptedTitle, setDecryptedTitle] = useState<string | null>(null);

  useEffect(() => {
    async function decryptTitle() {
      if (!chat.title) {
        setDecryptedTitle(null);
        return;
      }

      if (user?.id) {
        // Check if title looks like base64 (could be encrypted)
        // Titles are only 50 chars max, so we check for base64 pattern
        const hasSpacesOrNewlines = /\s/.test(chat.title);
        const looksLikeBase64 =
          !hasSpacesOrNewlines &&
          chat.title.length >= 16 && // Minimum reasonable base64 length
          /^[A-Za-z0-9+/=]+$/.test(chat.title);

        if (looksLikeBase64) {
          // Title looks like base64, try to decrypt it
          // Note: Titles might be truncated (50 chars), so decryption might fail
          // For old chats, the title is encrypted but truncated, so we can't decrypt it
          // For new chats, titles should be plaintext (created from decrypted prompts)
          try {
            const text = await decryptMessage(chat.title, user.id);
            if (text && !text.includes("[Decryption Failed")) {
              setDecryptedTitle(text);
              console.log("✅ Title decrypted successfully", {
                original: chat.title.substring(0, 30) + "...",
                decrypted: text.substring(0, 30) + "...",
              });
            } else {
              // Decryption failed - title might be truncated encrypted data
              // For old chats, we can't decrypt truncated titles
              // Show the encrypted title as-is (user can still identify it)
              console.warn("⚠️ Title decryption failed (might be truncated encrypted data):", {
                titleLength: chat.title.length,
                userId: user.id,
              });
              // Show encrypted title as-is for old chats
              setDecryptedTitle(chat.title);
            }
          } catch (error) {
            // If decryption throws, show original title
            console.error("❌ Title decryption exception:", {
              error,
              titleLength: chat.title.length,
              userId: user.id,
            });
            setDecryptedTitle(chat.title);
          }
        } else {
          // Title has spaces/newlines or doesn't look like base64, display as-is (plaintext)
          console.log("ℹ️ Title doesn't look encrypted, showing as-is:", {
            hasSpaces: hasSpacesOrNewlines,
            length: chat.title.length,
            preview: chat.title.substring(0, 30),
          });
          setDecryptedTitle(chat.title);
        }
      } else {
        // No user ID, assume plaintext
        console.warn("⚠️ No user ID available for title decryption");
        setDecryptedTitle(chat.title);
      }
    }
    decryptTitle();
  }, [chat.title, user?.id]);

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
              {decryptedTitle !== null
                ? decryptedTitle
                : chat.title || `Chat ${chat.id.slice(0, 8)}`}
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
