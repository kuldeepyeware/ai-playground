"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowUp, Hash, DollarSign } from "lucide-react";
import { StreamingResponse } from "@/components/chat/StreamingResponse";
import { formatCost } from "@/lib/pricing";
import { PROVIDERS } from "@/constants/providers";
import type { Prompt } from "@/types/chat";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { decryptMessage } from "@/lib/crypto";

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  xai: "xAI",
};

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
  const { user } = useUser();
  const [decryptedPrompt, setDecryptedPrompt] = useState<string | null>(null);
  const [decryptedResponses, setDecryptedResponses] = useState<
    Map<string, string>
  >(new Map());
  const [isDecrypting, setIsDecrypting] = useState(true);

  // Decrypt prompt content
  useEffect(() => {
    async function decryptPromptContent() {
      setIsDecrypting(true);
      if (user?.id) {
        // Check if content looks like base64 (could be encrypted)
        // Encrypted data is valid base64 without spaces
        const hasSpacesOrNewlines = /\s/.test(prompt.content);
        const looksLikeBase64 =
          !hasSpacesOrNewlines &&
          prompt.content.length >= 16 && // Minimum reasonable base64 length
          /^[A-Za-z0-9+/=]+$/.test(prompt.content);

        if (looksLikeBase64) {
          // Content appears encrypted, try to decrypt it
          try {
            const text = await decryptMessage(prompt.content, user.id);
            // Check if decryption failed (returns error message)
            if (text && text.includes("[Decryption Failed")) {
              // Decryption failed - content might be plaintext that looks encrypted
              // or there's a key mismatch. Fall back to showing original content.
              if (process.env.NODE_ENV === "development") {
                console.debug("Decryption failed, using original content (may be plaintext)");
              }
              setDecryptedPrompt(prompt.content);
            } else {
              setDecryptedPrompt(text);
            }
          } catch (error) {
            // If decryption throws, show original content
            // This is expected if content is actually plaintext
            if (process.env.NODE_ENV === "development") {
              console.debug("Decryption exception, using original content:", error);
            }
            setDecryptedPrompt(prompt.content);
          }
        } else {
          // Content doesn't look encrypted (has spaces/newlines or is short), display as-is
          // This handles optimistic updates and plaintext content
          setDecryptedPrompt(prompt.content);
        }
      } else {
        // No user ID, assume plaintext
        setDecryptedPrompt(prompt.content);
      }
      setIsDecrypting(false);
    }
    decryptPromptContent();
  }, [prompt.content, user?.id]);

  // Decrypt all responses
  useEffect(() => {
    async function decryptAllResponses() {
      if (!user?.id || !prompt.responses) return;

      const decrypted = new Map<string, string>();
      for (const response of prompt.responses) {
        if (response.status === "success" && response.content) {
          try {
            const text = await decryptMessage(response.content, user.id);
            decrypted.set(response.provider, text);
          } catch (error) {
            console.error(`Error decrypting response for ${response.provider}:`, error);
            decrypted.set(response.provider, response.content); // Fallback
          }
        }
      }
      setDecryptedResponses(decrypted);
    }
    decryptAllResponses();
  }, [prompt.responses, user?.id]);

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
                {isCurrentlyStreaming ? (
                  // Wait for decryption before starting stream to ensure AI gets plaintext
                  isDecrypting || decryptedPrompt === null ? (
                    <div className='flex items-center justify-center h-full text-(--text-muted) italic'>
                      Preparing...
                    </div>
                  ) : (
                    <StreamingResponse
                      provider={provider.id}
                      prompt={decryptedPrompt}
                      promptId={prompt.id}
                      chatId={chatId}
                      onComplete={() => onStreamComplete(prompt.id, provider.id)}
                      inline={true}
                    />
                  )
                ) : !hasResponse ? (
                  <div className='flex items-center justify-center h-full text-(--text-muted) italic'>
                    {isStreaming ? "Preparing..." : "No response available"}
                  </div>
                ) : response.status === "error" ? (
                  <div className='text-(--error) text-sm bg-(--error)/10 rounded-lg p-3 border border-(--error)/20'>
                    {response.error || "An error occurred"}
                  </div>
                ) : (
                  /* We remove the entrance animation here so the text doesn't 'pop' twice */
                  <span>
                    {decryptedResponses.get(response.provider) || response.content}
                  </span>
                )}
              </div>

              {/* Metrics Section - This is the only part that should animate in */}
              <AnimatePresence>
                {hasResponse && response.status === "success" && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='mt-auto pt-3 border-t border-(--border-secondary) shrink-0 space-y-2'>
                    <div className='flex items-center gap-1.5 text-[10px] w-full min-w-0'>
                      <MetricBadge
                        icon={<ArrowDown className='h-3 w-3' />}
                        label='Prompt'
                        value={response.promptTokens}
                      />
                      <MetricBadge
                        icon={<ArrowUp className='h-3 w-3' />}
                        label='Comp'
                        value={response.completionTokens}
                      />
                      <MetricBadge
                        icon={<Hash className='h-3 w-3' />}
                        label='Total'
                        value={
                          (response.promptTokens || 0) +
                          (response.completionTokens || 0)
                        }
                      />
                    </div>

                    <div className='flex justify-end'>
                      <div className='flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 text-[10px]'>
                        <DollarSign className='h-3 w-3 text-primary shrink-0' />
                        <span className='text-(--text-muted)'>Cost:</span>
                        <span className='text-primary font-medium'>
                          {response.cost !== undefined
                            ? formatCost(response.cost)
                            : "$0.0000"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
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
