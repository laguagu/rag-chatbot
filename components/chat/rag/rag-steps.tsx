"use client";

import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Binary,
  CheckCircle2,
  Clock,
  ListChecks,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export type UiStep = {
  id?: string;
  label: string;
  detail?: string;
  status?: "pending" | "running" | "done" | "error";
  progress?: number;
  startTime?: number;
  endTime?: number;
};

const iconFor = (label: string) => {
  const lower = label.toLowerCase();
  if (lower.includes("hyde")) return Sparkles;
  if (lower.includes("embed")) return Binary;
  if (lower.includes("search")) return Search;
  if (lower.includes("source")) return ListChecks;
  return Sparkles;
};

const formatDuration = (startTime?: number, endTime?: number) => {
  if (!startTime) return null;
  const duration = (endTime || Date.now()) - startTime;
  return `${(duration / 1000).toFixed(1)}s`;
};

export function RagStepTimeline({ steps }: { steps: UiStep[] }) {
  if (!steps?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="p-4 border rounded-xl bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h4 className="font-semibold text-amber-900 dark:text-amber-100">
            Process steps ({steps.filter((s) => s.status === "done").length}/
            {steps.length})
          </h4>
        </div>
        <div className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
          Live status
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {steps.map((s, i) => {
            const Icon = iconFor(s.label);
            const duration = formatDuration(s.startTime, s.endTime);

            return (
              <motion.div
                key={s.id || i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-amber-100/80 dark:border-amber-900/80 shadow-sm backdrop-blur"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {s.status === "done" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : s.status === "error" ? (
                    <AlertCircle className="h-5 w-5 text-rose-600" />
                  ) : s.status === "running" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                  ) : (
                    <Icon className="h-5 w-5 text-amber-600/60" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-amber-900 dark:text-amber-100 truncate">
                      {s.label}
                    </div>
                    {duration && (
                      <div className="text-xs text-amber-700 dark:text-amber-300 flex-shrink-0">
                        {duration}
                      </div>
                    )}
                  </div>

                  {s.detail && (
                    <div className="text-sm text-amber-800/80 dark:text-amber-200/80 mt-1">
                      {s.detail}
                    </div>
                  )}

                  <div className="mt-2">
                    <div className="h-2 rounded-full bg-amber-200/60 dark:bg-amber-800/50 overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full transition-all duration-500 ease-out",
                          s.status === "done"
                            ? "bg-emerald-500"
                            : s.status === "error"
                              ? "bg-rose-500"
                              : "bg-gradient-to-r from-amber-500 to-orange-500",
                        )}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(Math.max(s.progress ?? (s.status === "done" ? 100 : s.status === "running" ? 60 : 0), 5), 100)}%`,
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
