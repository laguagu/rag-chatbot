"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Loader2, Search } from "lucide-react";
import { motion } from "motion/react";

export function RagStatusBar({
  phase,
}: {
  phase?: "retrieving" | "done" | "error";
}) {
  if (!phase) return null;

  const map = {
    retrieving: {
      text: "Haetaan relevantteja dokumentteja…",
      icon: Search,
      className:
        "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
    },
    done: {
      text: "Vastaus valmis",
      icon: CheckCircle2,
      className:
        "bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200",
    },
    error: {
      text: "Virhe RAG-prosessissa",
      icon: AlertTriangle,
      className:
        "bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/50 dark:to-red-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200",
    },
  } as const;

  const cfg = map[phase];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "p-4 border rounded-xl flex items-center gap-3 shadow-sm",
        cfg.className,
      )}
    >
      <div className="flex-shrink-0">
        {phase === "retrieving" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </div>
      <div className="flex-1">
        <span className="font-medium">{cfg.text}</span>
      </div>
      {phase === "retrieving" && (
        <div className="flex-shrink-0">
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-current opacity-60"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
