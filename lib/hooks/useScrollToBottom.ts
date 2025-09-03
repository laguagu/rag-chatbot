import { useCallback, useEffect, useRef, useState } from "react";

export function useScrollToBottom<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const rafIdRef = useRef<number | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  const scheduleScrollToBottom = useCallback(() => {
    if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      // During streaming, prefer instant jumps to avoid jank from multiple smooth animations
      scrollToBottom(false);
    });
  }, [scrollToBottom]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;

    if (!container) return;

    const threshold = 100;
    // When the user is near the bottom, we keep auto-scroll on;
    // otherwise, we show a "scroll to bottom" button.
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold;

    setShowScrollButton(!isNearBottom);
    setIsAutoScrollEnabled(isNearBottom);
  }, []);

  // Scroll whenever auto-scroll is enabled.
  useEffect(() => {
    if (isAutoScrollEnabled) {
      // Use instant scroll when auto mode toggles on to avoid smooth chaining
      scrollToBottom(false);
    }
  }, [isAutoScrollEnabled, scrollToBottom]);

  // You could also export a function that forces a scroll on demand
  // when new data arrives (e.g., messages added).
  const scrollOnUpdate = useCallback(() => {
    if (isAutoScrollEnabled) {
      scheduleScrollToBottom();
    }
  }, [isAutoScrollEnabled, scheduleScrollToBottom]);

  return {
    containerRef,
    showScrollButton,
    isAutoScrollEnabled,
    setIsAutoScrollEnabled,
    scrollToBottom,
    handleScroll,
    scrollOnUpdate,
  };
}
