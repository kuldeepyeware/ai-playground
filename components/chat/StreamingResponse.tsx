"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface StreamingResponseProps {
  provider: "openai" | "anthropic" | "xai";
  prompt: string;
  promptId: string;
  chatId: string;
  onComplete?: (content: string) => void;
}

const PROVIDER_CONFIG = {
  openai: {
    name: "GPT-4o",
    color: "#10A37F",
  },
  anthropic: {
    name: "Claude 3.5 Sonnet",
    color: "#D97706",
  },
  xai: {
    name: "Grok 3",
    color: "#3B82F6",
  },
};

// Parse error messages for user-friendly display
function parseErrorMessage(
  status: number,
  message: string,
): { title: string; description: string } {
  if (status === 429) {
    return {
      title: "Rate Limited",
      description: "Too many requests. Please wait a moment and try again.",
    };
  }
  if (status === 401) {
    return {
      title: "Authentication Error",
      description: "API key is invalid or missing.",
    };
  }
  if (status === 403) {
    return {
      title: "Access Denied",
      description: "You don't have permission to access this model.",
    };
  }
  if (status === 500 || status === 502 || status === 503) {
    return {
      title: "Service Unavailable",
      description:
        "The AI service is temporarily unavailable. Please try again.",
    };
  }
  if (message.includes("timeout") || message.includes("Timeout")) {
    return {
      title: "Request Timeout",
      description: "The request took too long. Please try again.",
    };
  }
  return {
    title: "Error",
    description: message || "An unexpected error occurred.",
  };
}

export function StreamingResponse({
  provider,
  prompt,
  promptId,
  chatId,
  onComplete,
}: StreamingResponseProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const hasStartedRef = useRef(false);
  const isStreamingRef = useRef(false);
  const isMountedRef = useRef(true);
  const config = PROVIDER_CONFIG[provider];

  const streamResponse = useCallback(async () => {
    // Prevent duplicate calls
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    isStreamingRef.current = true;

    setIsLoading(true);
    setError(null);
    setContent("");

    try {
      const response = await fetch(
        `/api/chat/${chatId}/submit?provider=${provider}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, promptId }),
          // Don't use AbortController here - let the request complete
          // The server will handle client disconnect gracefully
        },
      );

      // Check if component is still mounted - still call onComplete for cleanup
      if (!isMountedRef.current) {
        onComplete?.("");
        return;
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw {
          status: response.status,
          message: errorText || `HTTP ${response.status}`,
        };
      }

      if (!response.body) {
        throw { status: 0, message: "No response stream" };
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Check if component is still mounted - cancel but still call onComplete
          if (!isMountedRef.current) {
            reader.cancel();
            onComplete?.(fullContent);
            return;
          }

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          setContent(fullContent);
        }
      } catch (readError) {
        // Handle stream read errors gracefully
        if (!isMountedRef.current) {
          onComplete?.(fullContent);
          return;
        }
        throw readError;
      }

      isStreamingRef.current = false;

      if (isMountedRef.current) {
        setIsLoading(false);
      }
      // Always call onComplete to ensure proper cleanup, even if unmounted
      onComplete?.(fullContent);
    } catch (err: unknown) {
      isStreamingRef.current = false;

      // Check for abort errors - still call onComplete to ensure cleanup
      if (
        err instanceof Error &&
        (err.name === "AbortError" || err.message.includes("aborted"))
      ) {
        onComplete?.("");
        return;
      }

      // Don't update state if unmounted, but still call onComplete
      if (!isMountedRef.current) {
        onComplete?.("");
        return;
      }

      setIsLoading(false);

      const errorObj = err as { status?: number; message?: string };
      const status = errorObj.status || 0;
      const message =
        errorObj.message ||
        (err instanceof Error ? err.message : "Stream failed");

      setError(parseErrorMessage(status, message));

      // Still call onComplete even on error so the flow continues
      onComplete?.("");
    }
  }, [chatId, prompt, promptId, provider, onComplete]);

  useEffect(() => {
    isMountedRef.current = true;
    streamResponse();

    return () => {
      // Mark as unmounted to prevent state updates
      isMountedRef.current = false;
    };
  }, [streamResponse]);

  const handleRetry = () => {
    hasStartedRef.current = false;
    isStreamingRef.current = false;
    streamResponse();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='flex flex-col rounded-xl border border-(--border-secondary) bg-(--background-secondary) overflow-hidden'>
      {/* Header */}
      <div
        className='px-4 py-3 border-b border-(--border-secondary)'
        style={{ borderLeftColor: config.color, borderLeftWidth: "4px" }}>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div
              className='w-2 h-2 rounded-full animate-pulse'
              style={{
                backgroundColor: config.color,
                animation: isLoading
                  ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                  : "none",
              }}
            />
            <h3 className='font-semibold text-(--text-primary)'>
              {config.name}
            </h3>
          </div>
          {isLoading && (
            <div className='flex items-center gap-2 text-xs text-(--text-muted)'>
              <svg
                className='h-3 w-3 animate-spin'
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
              <span>Generating...</span>
            </div>
          )}
          {error && (
            <button
              onClick={handleRetry}
              className='flex items-center gap-1 text-xs text-(--text-muted) hover:text-(--text-primary) transition-colors'>
              <RefreshCw className='h-3 w-3' />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className='p-4 min-h-[200px]'>
        {error ? (
          <div className='flex flex-col gap-2'>
            <div className='flex items-start gap-2 text-(--error) bg-(--error)/10 rounded-lg p-3 border border-(--error)/20'>
              <AlertCircle className='h-4 w-4 mt-0.5 shrink-0' />
              <div>
                <div className='font-medium text-sm'>{error.title}</div>
                <div className='text-xs mt-1 opacity-80'>
                  {error.description}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className='text-(--text-primary) whitespace-pre-wrap wrap-break-word'>
            {content ||
              (isLoading ? (
                <div className='flex items-center gap-2 text-(--text-muted)'>
                  <span
                    className='inline-block w-2 h-2 bg-current rounded-full animate-bounce'
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className='inline-block w-2 h-2 bg-current rounded-full animate-bounce'
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className='inline-block w-2 h-2 bg-current rounded-full animate-bounce'
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              ) : (
                "No response"
              ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
