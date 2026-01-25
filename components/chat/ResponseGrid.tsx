"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowUp, Hash, DollarSign } from "lucide-react";
import { StreamingResponse } from "@/components/chat/StreamingResponse";
import { formatCost } from "@/lib/pricing";
import { PROVIDERS } from "@/constants/providers";
import type { Prompt } from "@/types/chat";

interface ResponseGridProps {
  prompt: Prompt;
  chatId: string;
  isStreaming: boolean;
  onStreamComplete: (promptId: string, provider: string) => void;
}

export function ResponseGrid({
  prompt,
  chatId,
  isStreaming,
  onStreamComplete,
}: ResponseGridProps) {
  // Show streaming responses if currently streaming
  if (isStreaming) {
    return (
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <StreamingResponse
          provider='openai'
          prompt={prompt.content}
          promptId={prompt.id}
          chatId={chatId}
          onComplete={() => onStreamComplete(prompt.id, "openai")}
        />
        <StreamingResponse
          provider='anthropic'
          prompt={prompt.content}
          promptId={prompt.id}
          chatId={chatId}
          onComplete={() => onStreamComplete(prompt.id, "anthropic")}
        />
        <StreamingResponse
          provider='xai'
          prompt={prompt.content}
          promptId={prompt.id}
          chatId={chatId}
          onComplete={() => onStreamComplete(prompt.id, "xai")}
        />
      </div>
    );
  }

  // Show saved responses - always show all 3 providers
  // Create a map of responses by provider for quick lookup
  const responsesByProvider = new Map(
    (prompt.responses || []).map((r) => [r.provider, r]),
  );

  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-3 auto-rows-fr'>
      {PROVIDERS.map((provider, index) => {
        const response = responsesByProvider.get(provider.id);
        const hasResponse = !!response;

        return (
          <motion.div
            key={provider.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.1,
              ease: "easeOut",
            }}
            className='flex flex-col h-full rounded-xl border border-(--border-secondary) bg-(--background-secondary) overflow-hidden'>
            <div
              className='px-4 py-3 border-b border-(--border-secondary) shrink-0'
              style={{
                borderLeftColor: provider.color,
                borderLeftWidth: "4px",
              }}>
              <div className='flex items-center gap-2'>
                <div
                  className='w-2 h-2 rounded-full'
                  style={{
                    backgroundColor: provider.color,
                  }}
                />
                <h3 className='font-semibold text-(--text-primary)'>
                  {provider.name}
                </h3>
              </div>
            </div>
            <div className='flex flex-col flex-1 p-4 min-h-[200px]'>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className='flex-1 text-(--text-primary) whitespace-pre-wrap wrap-break-word'>
                {!hasResponse ? (
                  <div className='flex items-center justify-center h-full text-(--text-muted) italic'>
                    No response available
                  </div>
                ) : response.status === "error" ? (
                  <div className='text-(--error) text-sm bg-(--error)/10 rounded-lg p-3 border border-(--error)/20'>
                    <div className='font-medium mb-1'>Error</div>
                    {response.error ||
                      "An error occurred while generating response"}
                  </div>
                ) : (
                  response.content
                )}
              </motion.div>

              {/* Metrics: Tokens and Cost - Sticks to bottom */}
              <AnimatePresence>
                {hasResponse && response.status === "success" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className='mt-auto pt-3 border-t border-(--border-secondary) shrink-0 space-y-2'>
                    {/* Token info - one line, equal width */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                      className='flex items-center gap-1.5 text-[10px] w-full min-w-0'>
                      {/* Prompt Tokens */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: 0.6 }}
                        className='flex items-center justify-center gap-1 px-1.5 py-1 rounded-md bg-(--background-secondary)/50 border border-(--border-secondary)/50 flex-1 min-w-0 overflow-hidden'>
                        <ArrowDown className='h-3 w-3 text-(--text-muted) shrink-0' />
                        <span className='text-(--text-muted) shrink-0'>
                          Prompt:
                        </span>
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.7 }}
                          className='text-(--text-primary) font-medium truncate min-w-0'>
                          {response.promptTokens?.toLocaleString() || 0}
                        </motion.span>
                      </motion.div>

                      {/* Completion Tokens */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: 0.65 }}
                        className='flex items-center justify-center gap-1 px-1.5 py-1 rounded-md bg-(--background-secondary)/50 border border-(--border-secondary)/50 flex-1 min-w-0 overflow-hidden'>
                        <ArrowUp className='h-3 w-3 text-(--text-muted) shrink-0' />
                        <span className='text-(--text-muted) shrink-0'>
                          Comp:
                        </span>
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.75 }}
                          className='text-(--text-primary) font-medium truncate min-w-0'>
                          {response.completionTokens?.toLocaleString() || 0}
                        </motion.span>
                      </motion.div>

                      {/* Total Tokens */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: 0.7 }}
                        className='flex items-center justify-center gap-1 px-1.5 py-1 rounded-md bg-(--background-secondary)/50 border border-(--border-secondary)/50 flex-1 min-w-0 overflow-hidden'>
                        <Hash className='h-3 w-3 text-(--text-muted) shrink-0' />
                        <span className='text-(--text-muted) shrink-0'>
                          Total:
                        </span>
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.8 }}
                          className='text-(--text-primary) font-medium truncate min-w-0'>
                          {(
                            (response.promptTokens || 0) +
                            (response.completionTokens || 0)
                          ).toLocaleString()}
                        </motion.span>
                      </motion.div>
                    </motion.div>

                    {/* Cost - separate line below, aligned to right */}
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.85 }}
                      className='flex justify-end'>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.9 }}
                        className='flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 text-[10px]'>
                        <DollarSign className='h-3 w-3 text-primary shrink-0' />
                        <span className='text-(--text-muted)'>Cost:</span>
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 1 }}
                          className='text-primary font-medium'>
                          {response.cost !== undefined
                            ? formatCost(response.cost)
                            : "$0.0000"}
                        </motion.span>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
