"use client";

import { ExternalLink, FileText, Globe } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export function RagSourceChips({
  sources,
}: {
  sources: Array<{
    sourceId: string;
    title: string;
    url?: string;
    similarity?: number;
  }>;
}) {
  if (!sources?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="p-4 border rounded-xl bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
        <h4 className="font-semibold text-green-900 dark:text-green-100">Lähteet</h4>
        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200">
          {sources.length}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <AnimatePresence>
          {sources.map((s, idx) => {
            const domain = (() => {
              try {
                return s.url ? new URL(s.url).hostname.replace(/^www\./, "") : undefined;
              } catch {
                return undefined;
              }
            })();
            return (
              <motion.a
                key={`${s.sourceId}-${idx}`}
                href={s.url || "#"}
                target={s.url ? "_blank" : undefined}
                rel="noreferrer"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: idx * 0.03 }}
                className="group relative overflow-hidden rounded-lg border bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border-green-200/70 dark:border-green-800/60 text-green-900 dark:text-green-100 transition-all duration-200 hover:shadow-sm"
                title={s.title}
              >
                <div className="flex items-center gap-2 p-3">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/40 text-[11px] font-semibold text-green-700 dark:text-green-200">
                    {idx + 1}
                  </span>
                  <div className="flex-shrink-0 text-green-700 dark:text-green-300">
                    {s.url ? (
                      <Globe className="h-3.5 w-3.5" />
                    ) : (
                      <FileText className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-sm leading-snug">
                      {s.title}
                    </div>
                    {domain && (
                      <div className="truncate text-xs text-green-700/70 dark:text-green-200/70">
                        {domain}
                      </div>
                    )}
                  </div>
                  {typeof s.similarity === "number" && (
                    <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-mono">
                      {Math.round(s.similarity * 100)}%
                    </span>
                  )}
                  {s.url && (
                    <ExternalLink className="ml-1 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-green-300/50 to-transparent dark:via-green-700/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.a>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
