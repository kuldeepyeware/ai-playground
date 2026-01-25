"use client";

import {
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export function ChatListSkeleton() {
  return (
    <SidebarGroupContent>
      <SidebarMenu>
        {[...Array(4)].map((_, index) => (
          <SidebarMenuItem key={index}>
            <div className='flex items-center gap-2 px-2 py-2'>
              <Skeleton className='h-4 w-4 rounded' />
              <Skeleton className='h-4 flex-1 rounded' />
            </div>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
  );
}
