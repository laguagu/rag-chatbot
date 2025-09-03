import { cn } from "@/lib/utils";
import { SparklesIcon } from "lucide-react";
import { motion } from "motion/react";
import { memo, type ReactNode } from "react";
import { Markdown } from "./markdown";

interface SourceItem {
  url?: string;
  filename?: string;
}

interface MessageProps {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
  children?: ReactNode;
  sources?: SourceItem[];
}

function linkifyCitationsStrict(text: string, sources?: SourceItem[]) {
  if (!sources || sources.length === 0) return text;
  const linked = text.replace(/\[Source\s+(\d+)\]/g, (match, numStr) => {
    const idx = Number(numStr) - 1;
    if (!Number.isFinite(idx) || idx < 0 || idx >= sources.length) return match;
    const s = sources[idx];
    const href =
      s.url ||
      (s.filename
        ? `/api/files/get?filename=${encodeURIComponent(s.filename)}`
        : "");
    if (!href) return match;
    return `[Source ${numStr}](${href})`;
  });
  // Ensure adjacent links have a space between them, e.g. ")[" -> ") ["
  return linked.replace(/\)\[/g, ") [");
}

function PureMessage({
  role,
  content,
  isLoading,
  children,
  sources,
}: MessageProps) {
  const isUser = role === "user";
  const display = linkifyCitationsStrict(content, sources);

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl items-baseline"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className={cn("flex gap-4 w-full", isUser && "flex-row-reverse")}>
        {!isUser && (
          <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
            <SparklesIcon size={14} />
          </div>
        )}

        <div className={cn("flex flex-col gap-2 ", isUser && "items-end")}>
          {display && (
            <div
              className={cn(
                "flex flex-col gap-4",
                isUser
                  ? "bg-primary text-primary-foreground px-3 py-2 rounded-xl"
                  : "",
                isLoading && "opacity-50",
              )}
            >
              <Markdown>{display}</Markdown>
            </div>
          )}
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export const Message = memo(PureMessage, (prevProps, nextProps) => {
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.content !== nextProps.content) return false;
  if ((prevProps.sources?.length || 0) !== (nextProps.sources?.length || 0))
    return false;
  if (prevProps.children !== nextProps.children) return false;
  return true;
});

export const ThinkingMessage = () => {
  return (
    <motion.div
      className="w-full mx-auto max-w-3xl"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.2 }}
    >
      <div className="flex gap-4 items-center">
        <div className="w-8 h-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 ">
          <span className="text-muted-foreground animate-pulse">
            Thinking...
          </span>
        </div>
      </div>
    </motion.div>
  );
};
