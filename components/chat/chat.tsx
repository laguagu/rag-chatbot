"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowBigRight } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import type { RagUIMessage } from "@/ai/types";
import { saveModelId } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { useScrollToBottom } from "@/lib/hooks/useScrollToBottom";

import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import { RAGFiles } from "./rag-files";

export function Chat({
  id,
  initialMessages = [],
  selectedModelId,
}: {
  id: string;
  initialMessages?: RagUIMessage[];
  selectedModelId: string;
}) {
  const [phase, setPhase] = useState<
    "retrieving" | "done" | "error" | undefined
  >();
  const [currentModelId, setCurrentModelId] = useState<string>(selectedModelId);
  const [input, setInput] = useState("");
  const [isRAGFilesVisible, setIsRAGFilesVisible] = useState(false);
  // Auto control steps overlay: visible when thinking
  // SSR-safe defaults; hydrate from localStorage after mount to avoid hydration mismatch
  const [showStepsOverlay, setShowStepsOverlay] = useState<boolean>(true);
  const [minSimilarity, setMinSimilarity] = useState<number>(0.3);

  const {
    containerRef,
    showScrollButton,
    setIsAutoScrollEnabled,
    scrollToBottom,
    handleScroll,
    scrollOnUpdate,
  } = useScrollToBottom<HTMLDivElement>();

  const { messages, sendMessage, status, stop, setMessages } =
    useChat<RagUIMessage>({
      id: `${id}-${currentModelId}`,
      transport: new DefaultChatTransport({
        api: "/api/chat",
      }),
      onData: (part) => {
        if (part && part.type === "data-status") {
          const data = (part as { data?: { phase?: typeof phase } }).data;
          if (data?.phase) setPhase(data.phase);
        }
      },
    });

  useEffect(() => {
    const handler = () => {
      // Force reconfigure transport body with latest selection
      // We rely on useChat creating a new transport instance when options change via key
      setCurrentModelId((m) => m);
    };
    if (typeof window !== "undefined")
      window.addEventListener("rag-selection-change", handler);
    return () => {
      if (typeof window !== "undefined")
        window.removeEventListener("rag-selection-change", handler);
    };
  }, []);

  // Hydrate user preferences from localStorage after mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawSteps = window.localStorage.getItem("rag:showSteps");
      if (rawSteps != null) setShowStepsOverlay(rawSteps === "true");
    } catch {}
    try {
      const rawSim = window.localStorage.getItem("rag:minSimilarity");
      if (rawSim != null) setMinSimilarity(Number(rawSim));
    } catch {}
  }, []);

  useEffect(() => {
    if (initialMessages?.length && messages.length === 0)
      setMessages(initialMessages);
    scrollOnUpdate();
  }, [messages, scrollOnUpdate, initialMessages, setMessages]);

  const handleModelChange = async (modelId: string) => {
    setCurrentModelId(modelId);
    await saveModelId(modelId);
  };

  const hasMessages = messages.length > 0;
  const isLoading = status === "submitted" || status === "streaming";

  const handleSend = () => {
    if (!input.trim()) return;
    const selectedDocIds =
      typeof window !== "undefined"
        ? (window as any).__ragSelectedDocIds || []
        : [];
    void sendMessage(
      { text: input },
      { body: { id, modelId: currentModelId, selectedDocIds, minSimilarity } },
    );
    setInput("");
  };

  return (
    <div className="flex flex-col w-full h-dvh overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <ChatHeader
        modelId={currentModelId}
        onModelChange={handleModelChange}
        onReset={() => {
          setMessages([]);
          setPhase(undefined);
          setInput("");
        }}
        isLoading={isLoading}
        minSimilarity={minSimilarity}
        onMinSimilarityChange={(v) => {
          setMinSimilarity(v);
          if (typeof window !== "undefined")
            window.localStorage.setItem("rag:minSimilarity", String(v));
        }}
        onToggleSteps={() => {
          setShowStepsOverlay((prev) => {
            const next = !prev;
            if (typeof window !== "undefined")
              window.localStorage.setItem("rag:showSteps", String(next));
            return next;
          });
        }}
        stepsOpen={showStepsOverlay}
      />

      {!hasMessages ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-1 flex-col items-center justify-center gap-8 px-4"
        >
          <div className="text-center space-y-4 max-w-2xl pb-2">
            <h2 className="text-2xl font-semibold text-primary">
              What can I help you with?
            </h2>
          </div>

          <div className="w-full max-w-2xl">
            <ChatInput
              input={input}
              isLoading={isLoading}
              onSubmit={handleSend}
              onChange={(e) => setInput(e.target.value)}
              onStop={stop}
              isRAGFilesVisible={isRAGFilesVisible}
              setIsRAGFilesVisible={setIsRAGFilesVisible}
              key={`input-${currentModelId}-hero`}
            />
          </div>
        </motion.div>
      ) : (
        <>
          <div className="flex-1 overflow-hidden relative">
            <div
              ref={containerRef}
              onScroll={handleScroll}
              className="h-full overflow-y-auto [overflow-anchor:none]"
            >
              <div className="max-w-4xl mx-auto py-6 px-4">
                <ChatMessages
                  messages={messages as any}
                  isLoading={isLoading}
                  phase={phase}
                  showStepsOverlay={showStepsOverlay}
                />
              </div>
            </div>

            {showScrollButton && (
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  setIsAutoScrollEnabled(true);
                  scrollToBottom();
                }}
                className="absolute bottom-4 right-4 rounded-full shadow-lg bg-white/90 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-700"
                aria-label="Scroll to bottom"
                title="Scroll to bottom"
              >
                <ArrowBigRight className="h-4 w-4 rotate-90" />
              </Button>
            )}
          </div>

          <div className="shrink-0 p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700">
            <div className="max-w-4xl mx-auto">
              <ChatInput
                input={input}
                isLoading={isLoading}
                onSubmit={handleSend}
                onChange={(e) => setInput(e.target.value)}
                onStop={stop}
                isRAGFilesVisible={isRAGFilesVisible}
                setIsRAGFilesVisible={setIsRAGFilesVisible}
                key={`input-${currentModelId}-footer`}
              />
            </div>
          </div>
        </>
      )}

      <RAGFiles
        isVisible={isRAGFilesVisible}
        onClose={() => setIsRAGFilesVisible(false)}
      />
    </div>
  );
}
