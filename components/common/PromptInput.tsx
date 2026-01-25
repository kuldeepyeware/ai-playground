"use client";

import { motion } from "framer-motion";
import { usePlaygroundStore } from "../../store/usePlaygroundStore";
import { ArrowUpIcon, AlertCircle } from "lucide-react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createChat } from "@/actions/chat";
import { useSubmitPrompt } from "@/hooks/useSubmitPrompt";

interface PromptInputProps {
  chatId?: string;
  onSubmit?: (promptId: string, promptContent: string) => void;
  disabled?: boolean;
}

export function PromptInput({ chatId, onSubmit, disabled = false }: PromptInputProps) {
  const { prompt, setPrompt, isLoading, error } = usePlaygroundStore();
  const { isSignedIn, isLoaded } = useUser();
  const signInButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Always call the hook, but only use it if chatId exists
  const submitPromptMutation = useSubmitPrompt(chatId || "", {
    onSuccess: (promptId) => {
      const submittedPrompt = prompt;
      setPrompt("");
      setLocalError(null);
      onSubmit?.(promptId, submittedPrompt);
    },
    onError: (error) => {
      console.error("Error submitting prompt:", error);
      setLocalError(error);
    },
  });

  const triggerSignIn = () => {
    // Trigger sign-in modal by clicking the hidden button
    signInButtonRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Check if user is authenticated
    if (!isLoaded) {
      return; // Wait for auth to load
    }

    if (!isSignedIn) {
      // Trigger sign-in modal
      triggerSignIn();
      return;
    }

    // Check if prompt is empty
    if (!prompt.trim()) {
      return;
    }

    // If we're in a chat context, submit the prompt
    if (chatId) {
      submitPromptMutation.mutate(prompt);
      return;
    }

    // Otherwise, create a new chat WITH the prompt and redirect
    setIsCreatingChat(true);
    const currentPrompt = prompt.trim();
    
    try {
      const result = await createChat(currentPrompt);

      if (result.error || !result.chatId) {
        console.error("Failed to create chat:", result.error);
        setLocalError(result.error || "Failed to create chat");
        return;
      }

      // Clear prompt after successful creation
      setPrompt("");
      
      // Redirect to chat page with the new chat ID
      // The chat page will detect the pending prompt and auto-stream
      router.push(`/chat/${result.chatId}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      setLocalError(error instanceof Error ? error.message : "Failed to create chat");
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();

      // Check if user is authenticated
      if (!isLoaded) {
        return; // Wait for auth to load
      }

      if (!isSignedIn) {
        // Trigger sign-in modal
        triggerSignIn();
        return;
      }

      // Trigger form submit
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`w-full ${chatId ? "mb-0 pb-0" : ""}`}>
      {/* Hidden SignIn button to trigger modal */}
      <SignInButton mode='modal'>
        <button
          ref={signInButtonRef}
          style={{ display: "none" }}
          aria-hidden='true'
        />
      </SignInButton>

      <form
        onSubmit={handleSubmit}
        className={chatId ? "space-y-0" : "space-y-4"}>
        <div className='flex w-full justify-center'>
          <div className='relative w-full max-w-4xl'>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='How can I help you today?'
              disabled={
                disabled ||
                isLoading ||
                isCreatingChat ||
                (chatId ? submitPromptMutation.isPending : false)
              }
              rows={4}
              className='w-full resize-none rounded-xl border border-[--border-secondary] bg-(--background-secondary) px-4 py-3 text-(--text-primary) placeholder-[--secondary-text] transition-all shadow-[0_0_20px_rgba(62,58,53,0.3)] backdrop-blur-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-(--primary)/20 focus:shadow-[0_0_30px_rgba(62,58,53,0.5)] disabled:cursor-not-allowed disabled:opacity-50'
            />
            <div className='absolute bottom-3 right-3 flex items-center gap-2'>
              <div className='text-xs text-(--text-muted)'>
                <kbd className='rounded border border-border bg-background px-1.5 py-0.5 font-mono'>
                  ⌘
                </kbd>
                {" + "}
                <kbd className='rounded border border-border bg-background px-1.5 py-0.5 font-mono'>
                  Enter
                </kbd>
              </div>
              <button
                type='submit'
                disabled={
                  disabled ||
                  isLoading ||
                  isCreatingChat ||
                  (chatId ? submitPromptMutation.isPending : false) ||
                  !prompt.trim()
                }
                className='flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white transition-all hover:bg-(--primary-hover) disabled:cursor-not-allowed disabled:opacity-50'>
                {isLoading ||
                isCreatingChat ||
                (chatId ? submitPromptMutation.isPending : false) ? (
                  <svg
                    className='h-4 w-4 animate-spin'
                    fill='none'
                    viewBox='0 0 24 24'>
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                ) : (
                  <ArrowUpIcon className='h-4 w-4' />
                )}
              </button>
            </div>
          </div>
        </div>

        {(error || localError) && (
          <div className={`flex w-full justify-center ${chatId ? "mt-2" : ""}`}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className='flex w-full max-w-4xl items-center gap-2 rounded-lg border border-(--error)/20 bg-(--error)/10 px-4 py-3 text-sm text-(--error)'>
              <AlertCircle className='h-4 w-4 shrink-0' />
              <span>{localError || error}</span>
            </motion.div>
          </div>
        )}
      </form>
    </motion.section>
  );
}
