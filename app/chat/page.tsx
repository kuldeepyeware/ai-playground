"use client";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { PromptInput } from "@/components/common/PromptInput";
import { motion } from "framer-motion";

const ChatIndexPage = () => {
  return (
    <div className='min-h-screen bg-background'>
      <SidebarProvider>
        <ChatSidebar />
        <SidebarInset>
          {/* Mobile trigger button - sticky on left */}
          <div className='fixed top-4 left-4 z-50 md:hidden'>
            <SidebarTrigger className='h-10 w-10 rounded-lg bg-(--background-secondary) border border-(--border-secondary) shadow-lg hover:bg-(--background-secondary)/80' />
          </div>

          <main className='relative flex flex-col h-screen w-full overflow-hidden'>
            {/* Center content */}
            <div className='flex-1 flex flex-col items-center justify-center p-4'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='w-full max-w-4xl'>
                <div className='flex flex-col items-center justify-center space-y-8'>
                  <div className='text-center space-y-4'>
                    <h1 className='text-4xl font-bold text-(--text-primary)'>
                      How can I help you today?
                    </h1>
                    <p className='text-lg text-(--text-secondary)'>
                      Ask anything and compare responses from multiple AI models
                    </p>
                  </div>

                  {/* Prompt input centered */}
                  <div className='w-full'>
                    <PromptInput />
                  </div>
                </div>
              </motion.div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};

export default ChatIndexPage;
