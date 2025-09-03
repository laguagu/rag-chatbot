import { Button } from "@/components/ui/button";
import { FileText, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface AttachmentListProps {
  attachments: File[];
  onRemove: (index: number) => void;
}

export function AttachmentList({ attachments, onRemove }: AttachmentListProps) {
  if (attachments.length === 0) return null;

  const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes)) return "";
    const units = ["B", "KB", "MB", "GB"] as const;
    let i = 0;
    let v = bytes;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
  };

  return (
    <div className="mt-2 space-y-2">
      <AnimatePresence initial={false}>
        {attachments.map((file, index) => {
          // Create a stable key that includes file properties to avoid React confusion
          const stableKey = `${file.name}-${file.size}-${file.lastModified}-${index}`;

          return (
            <motion.div
              key={stableKey}
              layout
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { type: "spring", stiffness: 300, damping: 24 },
              }}
              exit={{
                opacity: 0,
                y: -6,
                scale: 0.98,
                transition: { duration: 0.15 },
              }}
              whileHover={{ scale: 1.01 }}
              className="flex items-center gap-3 p-2 pr-1 bg-slate-50/90 dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow transition"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                <FileText className="h-4 w-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-700 dark:text-slate-200 truncate">
                  {file.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {formatBytes(file.size)}
                </div>
              </div>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200">
                {file.name.split(".").pop()?.toUpperCase() || "FILE"}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove(index);
                }}
                className="h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="h-3 w-3" />
              </Button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
