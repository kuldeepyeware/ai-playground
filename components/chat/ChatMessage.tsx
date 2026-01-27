"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { decryptMessage } from "@/lib/crypto";

interface ChatMessageProps {
  content: string;
  isUser?: boolean;
}

export function ChatMessage({ content, isUser = false }: ChatMessageProps) {
  const { user } = useUser();
  const [decryptedText, setDecryptedText] = useState<string | null>(null);

  useEffect(() => {
    async function performDecryption() {
      // Only decrypt user messages (prompts) - AI responses are handled separately
      if (isUser && user?.id) {
        // Check if content looks like base64 (could be encrypted)
        // Encrypted data is valid base64 without spaces/newlines
        // Plaintext usually has spaces, punctuation, or is shorter
        const hasSpacesOrNewlines = /\s/.test(content);
        const looksLikeBase64 =
          !hasSpacesOrNewlines &&
          content.length >= 16 && // Minimum reasonable base64 length
          /^[A-Za-z0-9+/=]+$/.test(content);
        
        if (looksLikeBase64) {
          // Content looks like base64, try to decrypt it
          try {
            const text = await decryptMessage(content, user.id);
            // Only use decrypted text if decryption succeeded
            if (text && !text.includes("[Decryption Failed")) {
              setDecryptedText(text);
              if (process.env.NODE_ENV === "development") {
                console.log("✅ Prompt decrypted successfully", {
                  originalLength: content.length,
                  decryptedLength: text.length,
                  preview: text.substring(0, 50),
                });
              }
            } else {
              // Decryption failed - log details for debugging
              console.error("❌ Prompt decryption failed:", {
                contentPreview: content.substring(0, 50),
                contentLength: content.length,
                userId: user.id,
                decryptedResult: text,
              });
              // Still show the encrypted content (better than error message)
              setDecryptedText(content);
            }
          } catch (error) {
            // If decryption throws, log the error
            console.error("❌ Prompt decryption exception:", {
              error,
              contentPreview: content.substring(0, 50),
              contentLength: content.length,
              userId: user.id,
            });
            setDecryptedText(content);
          }
        } else {
          // Content has spaces/newlines or doesn't look like base64, display as-is (plaintext)
          // This handles optimistic updates which are plaintext
          if (process.env.NODE_ENV === "development") {
            console.log("ℹ️ Prompt doesn't look encrypted, showing as-is:", {
              hasSpaces: hasSpacesOrNewlines,
              length: content.length,
              preview: content.substring(0, 50),
            });
          }
          setDecryptedText(content);
        }
      } else {
        // For AI responses, display as-is (they'll be decrypted in ResponseGrid)
        setDecryptedText(content);
      }
    }
    performDecryption();
  }, [content, isUser, user?.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? "bg-primary text-white"
            : "bg-(--background-secondary) text-(--text-primary) border border-(--border-secondary)"
        }`}>
        <p className='whitespace-pre-wrap wrap-break-word'>
          {decryptedText ?? "Decrypting..."}
        </p>
      </div>
    </motion.div>
  );
}
