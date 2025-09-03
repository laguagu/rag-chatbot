"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink, FileText, Globe } from "lucide-react";
import { useMemo, useState } from "react";

type SourceItem = {
  sourceId: string;
  title: string;
  url?: string;
  similarity?: number;
  docId?: string;
  filename?: string;
  snippet?: string;
};

export function RagChatSectionSources({ sources }: { sources: SourceItem[] }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<SourceItem | null>(null);

  const items = useMemo(() => sources ?? [], [sources]);

  function onOpenItem(item: SourceItem) {
    setActive(item);
    setOpen(true);
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {items.map((s, idx) => {
          const domain = (() => {
            try {
              return s.url
                ? new URL(s.url).hostname.replace(/^www\./, "")
                : undefined;
            } catch {
              return undefined;
            }
          })();
          return (
            <button
              key={`${s.sourceId}-${idx}`}
              onClick={() => onOpenItem(s)}
              className="group relative overflow-hidden rounded-lg border bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border-green-200/70 dark:border-green-800/60 text-left text-green-900 dark:text-green-100 transition-all duration-200 hover:shadow-sm"
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
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          {active && (
            <div>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {active.url ? (
                    <Globe className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {active.title}
                </DialogTitle>
                <DialogDescription>
                  {active.docId ? (
                    <span className="text-xs text-slate-500">
                      docId: {active.docId}
                    </span>
                  ) : null}
                  {active.filename ? (
                    <span className="ml-2 text-xs text-slate-500">
                      filename: {active.filename}
                    </span>
                  ) : null}
                </DialogDescription>
              </DialogHeader>

              {active.snippet && (
                <pre className="mt-3 max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 dark:bg-slate-900/40 p-3 text-sm text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
                  {active.snippet}
                </pre>
              )}

              {active.url && (
                <a
                  href={active.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm text-green-700 dark:text-green-300 hover:underline"
                >
                  Open source <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
