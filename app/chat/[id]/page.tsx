"use client";

import { use, useEffect, useState } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { PromptInput } from "@/components/common/PromptInput";
import { useGetChat } from "@/hooks/useGetChat";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ResponseGrid } from "@/components/chat/ResponseGrid";
import {
  LoadingState,
  ErrorState,
  ChatNotFoundState,
  EmptyState,
} from "@/components/chat/ChatStates";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { useStreamingState } from "@/hooks/useStreamingState";
import { useAutoDetectStreaming } from "@/hooks/useAutoDetectStreaming";
import { usePlaygroundStore } from "@/store/usePlaygroundStore";

const ChatPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const { data: chat, isLoading, error: chatError } = useGetChat(id);
  const { pendingPrompt, clearPendingPrompt } = usePlaygroundStore();
  const [hasStartedStreaming, setHasStartedStreaming] = useState(false);

  // Hooks for managing state
  const {
    streamingPromptIds,
    optimisticPrompt,
    isStreaming,
    streamingStartedRef,
    handlePromptSubmit,
    handleStreamComplete,
    startStreamingForPrompts,
    clearOptimisticPromptIfMatches,
  } = useStreamingState(id);

  const { chatContainerRef, scrollToBottom } = useAutoScroll(isStreaming);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (
      pendingPrompt &&
      pendingPrompt.chatId === id &&
      !hasStartedStreaming &&
      !isLoading &&
      pendingPrompt.isNew
    ) {
      handlePromptSubmit(pendingPrompt.promptId, pendingPrompt.content);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasStartedStreaming(true);
      clearPendingPrompt();
    }
  }, [
    id,
    pendingPrompt,
    hasStartedStreaming,
    isLoading,
    handlePromptSubmit,
    clearPendingPrompt,
  ]);

  // Auto-detect prompts without responses
  useAutoDetectStreaming({
    chat,
    isLoading,
    streamingStartedRef,
    startStreamingForPrompts,
    clearOptimisticPromptIfMatches,
    optimisticPrompt,
    scrollToBottom,
  });

  // Scroll to bottom when streaming prompts change
  useEffect(() => {
    scrollToBottom();
  }, [streamingPromptIds, scrollToBottom]);

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
            {/* Chat content area */}
            <div
              ref={chatContainerRef}
              className='flex-1 overflow-y-auto p-4 pb-36'>
              <div className='max-w-6xl mx-auto space-y-6'>
                {isLoading && !optimisticPrompt ? (
                  <LoadingState />
                ) : chatError && !optimisticPrompt ? (
                  <ErrorState error={chatError} />
                ) : !chat && !optimisticPrompt ? (
                  <ChatNotFoundState />
                ) : (
                  <>
                    {/* Render existing prompts and their responses */}
                    {chat?.prompts.map((prompt) => (
                      <div key={prompt.id} className='space-y-4'>
                        <ChatMessage content={prompt.content} isUser={true} />
                        <ResponseGrid
                          prompt={prompt}
                          chatId={id}
                          isStreaming={streamingPromptIds.has(prompt.id)}
                          onStreamComplete={handleStreamComplete}
                        />
                      </div>
                    ))}

                    {optimisticPrompt &&
                      !chat?.prompts.find(
                        (p) => p.id === optimisticPrompt.id,
                      ) && (
                        <div className='space-y-4'>
                          <ChatMessage
                            content={optimisticPrompt.content}
                            isUser={true}
                          />
                          <ResponseGrid
                            prompt={optimisticPrompt}
                            chatId={id}
                            isStreaming={streamingPromptIds.has(
                              optimisticPrompt.id,
                            )}
                            onStreamComplete={handleStreamComplete}
                          />
                        </div>
                      )}

                    {/* Show empty state only if no prompts and no optimistic prompt */}
                    {(!chat || chat.prompts.length === 0) &&
                      !optimisticPrompt && <EmptyState />}
                  </>
                )}
              </div>
            </div>

            {/* Input area - fixed at bottom */}
            {/* Show input even if chat doesn't exist yet (for new chats being created) */}
            {(chat || optimisticPrompt) && (
              <div className='absolute bottom-0 left-0 w-full bg-linear-to-t from-background via-background/80 to-transparent pb-1 pt-10 px-4'>
                <PromptInput
                  chatId={id}
                  onSubmit={handlePromptSubmit}
                  disabled={isStreaming}
                />
              </div>
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};

export default ChatPage;
