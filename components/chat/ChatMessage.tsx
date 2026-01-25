"use client";

import { motion } from "framer-motion";

interface ChatMessageProps {
  content: string;
  isUser?: boolean;
}

export function ChatMessage({ content, isUser = false }: ChatMessageProps) {
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
        <p className='whitespace-pre-wrap wrap-break-word'>{content}</p>
      </div>
    </motion.div>
  );
}
