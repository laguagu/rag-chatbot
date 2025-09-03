"use client";

import { cn } from "@/lib/utils";
import type { UIMessage as MessageType } from "ai";
import { ChevronUpIcon, MinusCircle, PaperclipIcon, PlusCircle } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Message, ThinkingMessage } from "./message";
import { RagSourceChips } from "./rag/rag-sources";
import { RagStepTimeline, type UiStep } from "./rag/rag-steps";

interface ChatMessagesProps {
  messages: MessageType[];
  isLoading: boolean;
  phase?: "retrieving" | "done" | "error";
  showStepsOverlay?: boolean;
  onHideSteps?: () => void;
}

export function ChatMessages({
  messages,
  isLoading,
  phase,
  showStepsOverlay,
  onHideSteps,
}: ChatMessagesProps) {
  const [expandedSources, setExpandedSources] = useState<Set<string>>(
    new Set(),
  );

  // ---- helpers ----
  function getMessageText(message: MessageType): string {
    const parts = (message as any).parts;
    if (!Array.isArray(parts)) return (message as any).content || "";

    return parts
      .filter((p) => p?.type === "text" && p.text)
      .map((p) => p.text)
      .join("");
  }

  function getMessageSources(message: MessageType) {
    const parts = (message as any).parts || [];

    return parts
      .filter((p: any) => p?.type?.startsWith("source"))
      .map((p: any) => ({
        title: p.title,
        url: p.url,
        similarity: p.providerMetadata?.rag?.similarity,
      }));
  }

  function getMessageRagSteps(message: MessageType): UiStep[] {
    const parts = (message as any).parts || [];

    return parts
      .filter((p: any) => p?.type === "data-step")
      .map((p: any) => ({
        id: p.id,
        label: p.data?.label || "Step",
        detail: p.data?.detail,
        status: p.data?.status || "done",
        progress: p.data?.progress,
        startTime: p.data?.startedAt,
        endTime: p.data?.finishedAt,
      }));
  }

  function finalizeSteps(steps: UiStep[]): UiStep[] {
    if (phase !== "done") return steps;

    return steps.map((step, idx) =>
      idx === steps.length - 1 && step.status !== "done"
        ? {
            ...step,
            status: "done",
            progress: 100,
            endTime: step.endTime ?? Date.now(),
          }
        : step,
    );
  }

  const last = messages[messages.length - 1];
  const lastText = last ? getMessageText(last) : "";
  const isLastMessageFromUser = last?.role === "user";

  // “Empty assistant” = no text yet
  const isLastAssistantEmpty = last?.role === "assistant" && !lastText;

  const showThinkingMessage =
    isLoading && (isLastMessageFromUser || isLastAssistantEmpty);

  const toggleSources = (messageId: string) => {
    const next = new Set(expandedSources);
    next.has(messageId) ? next.delete(messageId) : next.add(messageId);
    setExpandedSources(next);
  };

  // Steps are shown in overlay; no per-message toggle anymore

  return (
    <div
      className={cn(
        "flex flex-col",
        "w-full h-full",
        "space-y-6",
        messages.length === 0 ? "justify-center" : "justify-start",
      )}
    >
      {/* Floating steps overlay (toggleable) */}
      {(() => {
        const lastAssistant = [...messages]
          .reverse()
          .find((m) => m.role === "assistant");
        const raw = lastAssistant
          ? getMessageRagSteps(lastAssistant as any)
          : [];
        const overlaySteps = finalizeSteps(raw);
        const shouldShow = !!showStepsOverlay && overlaySteps.length > 0;
        if (!shouldShow) return null;
        return (
          <div className="fixed right-4 top-20 z-30 w-[440px] max-h-[70vh] overflow-y-auto overflow-x-hidden overscroll-contain">
            <div className="relative">
              <button
                onClick={onHideSteps}
                className="absolute -right-2 -top-2 z-10 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 shadow p-1 text-slate-600 hover:text-slate-900"
                aria-label="Close process steps"
              >
                <ChevronUpIcon className="h-4 w-4 rotate-45" />
              </button>
              <RagStepTimeline steps={overlaySteps} />
            </div>
          </div>
        );
      })()}
      {messages.map((message: MessageType, index) => {
        const text = getMessageText(message);
        const sources = getMessageSources(message);
        // steps are rendered in a global overlay, not inside messages

        // Hide assistant message until it has text or sources are expanded (avoid empty bubble)
        if (message.role === "assistant" && !text) {
          const isExpanded = expandedSources.has(message.id);
          if (!isExpanded) return null;
        }

        const isSourcesExpanded = expandedSources.has(message.id);

        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.35 }}
          >
            <Message
              role={message.role as "user" | "assistant"}
              content={text}
              isLoading={false}
              sources={getMessageSources(message).map((s: any) => ({ url: s.url, filename: s.title }))}
            >
              {/* “Attached file:” tag */}
              {typeof text === "string" &&
                text.startsWith("Attached file:") && (
                  <div className="flex items-center mt-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-400">
                    <PaperclipIcon className="h-4 w-4 mr-2" />
                    {text.replace("Attached file: ", "")}
                  </div>
                )}

              {/* Process steps are rendered as an overlay (not inside message). */}

              {/* Sources — prominent display with toggle */}
              {sources.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium">Sources</span>
                      <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-[11px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                        {sources.length}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleSources(message.id)}
                      className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                      {isSourcesExpanded ? (
                        <>
                          <MinusCircle className="h-4 w-4" /> Hide
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-4 w-4" /> Show
                        </>
                      )}
                    </button>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: isSourcesExpanded ? 1 : 0, height: isSourcesExpanded ? "auto" : 0 }}
                    transition={{ duration: 0.25 }}
                    className="mt-3"
                  >
                    {isSourcesExpanded && (
                      <RagSourceChips
                        sources={sources.map((s: any, idx: number) => ({
                          sourceId: `${message.id}-${idx}`,
                          title: s.title || s.url || `Source ${idx + 1}`,
                          url: s.url,
                          similarity: s.similarity,
                        }))}
                      />
                    )}
                  </motion.div>
                </div>
              )}
            </Message>
          </motion.div>
        );
      })}

      {showThinkingMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ThinkingMessage />
        </motion.div>
      )}
    </div>
  );
}
