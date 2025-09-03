"use client";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/utils";
import { FileIcon, LoaderIcon, TrashIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useOnClickOutside } from "usehooks-ts";

interface FileData {
  id: string;
  docId: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}
export function RAGFiles({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement | null>(
    null,
  ) as React.RefObject<HTMLDivElement>;
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const [deleteQueue, setDeleteQueue] = useState<string[]>([]);
  const {
    data: files = [],
    mutate,
    isLoading,
    error,
  } = useSWR<FileData[]>(isVisible ? "/api/files/list" : null, fetcher, {
    fallbackData: [],
    refreshInterval: 30000,
  });

  useOnClickOutside(drawerRef, onClose);

  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadQueue((prev) => [...prev, file.name]);
      const res = await fetch(`/api/files/upload`, {
        method: "POST",
        body: file,
        headers: { "x-filename": encodeURIComponent(file.name) },
      });
      if (!res.ok) throw new Error("upload failed");
      await mutate();
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadQueue((prev) => prev.filter((n) => n !== file.name));
    }
  };

  const handleFileDelete = async (filename: string) => {
    try {
      setDeleteQueue((p) => [...p, filename]);
      const res = await fetch(
        `/api/files/delete?filename=${encodeURIComponent(filename)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("delete failed");
      await mutate(
        files.filter((f) => f.filename !== filename),
        false,
      );
    } finally {
      setDeleteQueue((p) => p.filter((n) => n !== filename));
    }
  };

  const selectedDocIds = Object.entries(selected)
    .filter(([, v]) => v)
    .map(([k]) => k);

  // Expose selection to window for chat transport body
  if (typeof window !== "undefined") {
    (window as any).__ragSelectedDocIds = selectedDocIds;
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("rag-selection-change"));
    }
  }, [selectedDocIds.length]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={drawerRef}
            className="w-[600px] h-96 rounded-lg p-4 flex flex-col gap-4 bg-white dark:bg-zinc-800 shadow-2xl relative z-50"
            initial={{ y: "100%", scale: 0.9, opacity: 0 }}
            animate={{ y: "0%", scale: 1, opacity: 1 }}
            exit={{ y: "100%", scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
          >
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <div className="text-zinc-900 dark:text-zinc-300">
                  Manage Chatbot Memory Files
                </div>
                <span className="text-xs text-zinc-500">
                  PDF only (example)
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple={false}
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <FileIcon className="h-4 w-4" />
                Add file
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto border rounded-md">
              {isLoading && (
                <div className="flex items-center justify-center h-full">
                  <LoaderIcon className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              )}
              {!isLoading &&
                !error &&
                files?.length === 0 &&
                uploadQueue.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-sm text-zinc-500">
                    <FileIcon className="h-8 w-8 mb-2" />
                    <p>No uploaded files</p>
                  </div>
                )}
              {!isLoading &&
                !error &&
                files?.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 border-b dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!!selected[file.docId]}
                        onChange={(e) =>
                          setSelected((prev) => ({
                            ...prev,
                            [file.docId]: e.target.checked,
                          }))
                        }
                      />
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {file.filename}{" "}
                        <span className="text-xs text-zinc-400">
                          ({file.docId})
                        </span>
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFileDelete(file.filename)}
                      disabled={deleteQueue.includes(file.filename)}
                    >
                      {deleteQueue.includes(file.filename) ? (
                        <LoaderIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <TrashIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              {uploadQueue.map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-2 p-2 border-b dark:border-zinc-700 bg-blue-50 dark:bg-blue-900/20"
                >
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Uploading: {name}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-sm text-zinc-500">
              <span>{files?.length || 0} files</span>
              {(uploadQueue.length > 0 || deleteQueue.length > 0) && (
                <span className="animate-pulse">Processing...</span>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
