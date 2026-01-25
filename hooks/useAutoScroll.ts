import { useRef, useEffect, useCallback } from "react";

export function useAutoScroll(isStreaming: boolean) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);
  const lastScrollHeightRef = useRef(0);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback((smooth = false) => {
    if (chatContainerRef.current) {
      if (smooth) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      } else {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    }
  }, []);

  // Detect if user manually scrolled up
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      userScrolledUpRef.current = !isNearBottom;
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll during streaming when content changes
  useEffect(() => {
    if (!isStreaming) {
      // Stop scrolling when streaming completes
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      return;
    }

    const container = chatContainerRef.current;
    if (!container) return;

    // Reset scroll state when new streaming starts
    userScrolledUpRef.current = false;
    lastScrollHeightRef.current = container.scrollHeight;

    // Use MutationObserver to detect content changes
    const observer = new MutationObserver(() => {
      // Only auto-scroll if user hasn't manually scrolled up
      if (!userScrolledUpRef.current) {
        const currentScrollHeight = container.scrollHeight;
        // Only scroll if content actually increased
        if (currentScrollHeight > lastScrollHeightRef.current) {
          scrollToBottom(true);
          lastScrollHeightRef.current = currentScrollHeight;
        }
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Also use a periodic check for smooth scrolling during rapid updates
    scrollIntervalRef.current = setInterval(() => {
      if (!userScrolledUpRef.current && container) {
        const currentScrollHeight = container.scrollHeight;
        if (currentScrollHeight > lastScrollHeightRef.current) {
          scrollToBottom(true);
          lastScrollHeightRef.current = currentScrollHeight;
        }
      }
    }, 100); // Check every 100ms

    return () => {
      observer.disconnect();
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [isStreaming, scrollToBottom]);

  return { chatContainerRef, scrollToBottom };
}
