"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowUp, Hash, DollarSign } from "lucide-react";
import { StreamingResponse } from "@/components/chat/StreamingResponse";
import { formatCost } from "@/lib/pricing";
import { PROVIDERS } from "@/constants/providers";
import type { Prompt } from "@/types/chat";

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  xai: "xAI",
};

interface ResponseMetadata {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

interface ResponseGridProps {
  prompt: Prompt;
  chatId: string;
  isStreaming: boolean;
  onStreamComplete: (promptId: string, provider: string, metadata?: ResponseMetadata) => void;
}

export function ResponseGrid({
  prompt,
  chatId,
  isStreaming,
  onStreamComplete,
}: ResponseGridProps) {
  const [metadataByProvider, setMetadataByProvider] = useState<Map<string, ResponseMetadata>>(new Map());
  const responsesByProvider = new Map(
    (prompt.responses || []).map((r) => [r.provider, r]),
  );

  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-3 auto-rows-fr'>
      {PROVIDERS.map((provider) => {
        const response = responsesByProvider.get(provider.id);
        const hasResponse = !!response;

        // This specific provider is currently streaming
        const isCurrentlyStreaming = isStreaming && !hasResponse;

        return (
          <div
            key={provider.id}
            className='flex flex-col h-full rounded-xl border border-(--border-secondary) bg-(--background-secondary) overflow-hidden'>
            {/* Header - Stays static to prevent blinking */}
            <div
              className='px-4 py-3 border-b border-(--border-secondary) shrink-0'
              style={{
                borderLeftColor: provider.color,
                borderLeftWidth: "4px",
              }}>
              <div className='flex items-center gap-2'>
                <div
                  className='w-2 h-2 rounded-full'
                  style={{ backgroundColor: provider.color }}
                />
                <div className='flex flex-col'>
                  <span className='text-xs text-(--text-muted) font-medium'>
                    {PROVIDER_DISPLAY_NAMES[provider.id] || provider.id}
                  </span>
                  <h3 className='font-semibold text-(--text-primary) leading-tight'>
                    {provider.name}
                  </h3>
                </div>
              </div>
            </div>

            <div className='flex flex-col flex-1 p-4 min-h-[200px]'>
              <div className='flex-1 text-(--text-primary) whitespace-pre-wrap wrap-break-word'>
                {!hasResponse ? (
                  <StreamingResponse
                    provider={provider.id}
                    prompt={prompt.content}
                    promptId={prompt.id}
                    chatId={chatId}
                    onComplete={(content, metadata) => {
                      if (metadata) {
                        setMetadataByProvider(prev => {
                          const newMap = new Map(prev);
                          newMap.set(provider.id, metadata);
                          return newMap;
                        });
                      }
                      onStreamComplete(prompt.id, provider.id, metadata);
                    }}
                    inline={true}
                  />
                ) : response.status === "error" ? (
                  <div className='text-(--error) text-sm bg-(--error)/10 rounded-lg p-3 border border-(--error)/20'>
                    {response.error || "An error occurred"}
                  </div>
                ) : (
                  <span>{response.content}</span>
                )}
              </div>

              <AnimatePresence>
                {(hasResponse && response.status === "success") || metadataByProvider.has(provider.id) ? (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='mt-auto pt-3 border-t border-(--border-secondary) shrink-0 space-y-2'>
                    {(() => {
                      const meta = hasResponse && response.status === "success" 
                        ? {
                            promptTokens: response.promptTokens || 0,
                            completionTokens: response.completionTokens || 0,
                            totalTokens: (response.promptTokens || 0) + (response.completionTokens || 0),
                            cost: response.cost || 0,
                          }
                        : metadataByProvider.get(provider.id)!;
                      
                      return (
                        <>
                          <div className='flex items-center gap-1.5 text-[10px] w-full min-w-0'>
                            <MetricBadge
                              icon={<ArrowDown className='h-3 w-3' />}
                              label='Prompt'
                              value={meta.promptTokens}
                            />
                            <MetricBadge
                              icon={<ArrowUp className='h-3 w-3' />}
                              label='Comp'
                              value={meta.completionTokens}
                            />
                            <MetricBadge
                              icon={<Hash className='h-3 w-3' />}
                              label='Total'
                              value={meta.totalTokens}
                            />
                          </div>

                          <div className='flex justify-end'>
                            <div className='flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 text-[10px]'>
                              <DollarSign className='h-3 w-3 text-primary shrink-0' />
                              <span className='text-(--text-muted)'>Cost:</span>
                              <span className='text-primary font-medium'>
                                {formatCost(meta.cost)}
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper to keep code clean and prevent re-renders
function MetricBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
}) {
  return (
    <div className='flex items-center justify-center gap-1 px-1.5 py-1 rounded-md bg-(--background-secondary)/50 border border-(--border-secondary)/50 flex-1 min-w-0 overflow-hidden'>
      <span className='text-(--text-muted) shrink-0'>{icon}</span>
      <span className='text-(--text-muted) shrink-0'>{label}:</span>
      <span className='text-(--text-primary) font-medium truncate'>
        {value?.toLocaleString() || 0}
      </span>
    </div>
  );
}
