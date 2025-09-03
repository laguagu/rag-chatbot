"use client";

import type React from "react";

import { AttachmentList } from "@/components/chat/attachment-list";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFileAttachments } from "@/lib/hooks/useFileAttachments";
import { cn } from "@/lib/utils";
import { ArrowUp, Database, PaperclipIcon, Square } from "lucide-react";
import { useEffect, useRef } from "react";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onSubmit: (
    e?: { preventDefault?: () => void },
    options?: { attachments?: File[] },
  ) => void;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onStop: () => void;
  isRAGFilesVisible: boolean;
  setIsRAGFilesVisible: (visible: boolean) => void;
}

export function ChatInput({
  input,
  isLoading,
  onSubmit,
  onChange,
  onStop,
  isRAGFilesVisible,
  setIsRAGFilesVisible,
}: ChatInputProps) {
  const {
    attachments,
    fileInputRef,
    handleFileChange,
    removeAttachment,
    clearAttachments,
  } = useFileAttachments();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (
    e?: React.FormEvent | { preventDefault?: () => void },
    options?: { attachments?: File[] },
  ) => {
    e?.preventDefault?.();
    if (!isLoading && (input.trim() || attachments.length > 0)) {
      try {
        onSubmit(undefined, {
          ...(options ?? {}),
          attachments,
        });
      } finally {
        clearAttachments();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        Math.max(textareaRef.current.scrollHeight, 60),
        400,
      )}px`;
    }
  }, [input]);

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={cn(
            "flex flex-col rounded-2xl border-2 overflow-hidden transition-colors duration-200",
            "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-within:border-blue-500 dark:focus-within:border-blue-400",
          )}
        >
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className={cn(
                "min-h-[60px] w-full resize-none pr-14 pl-4 py-[14px] border-0 bg-transparent",
                "text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500",
                "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent",
                "focus:outline-hidden focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                isLoading && "opacity-50",
              )}
              rows={1}
            />
            <div className="absolute right-2 top-[14px]">
              {isLoading ? (
                <Button
                  type="button"
                  onClick={onStop}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Stop streaming"
                  title="Stop"
                >
                  <Square className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() && attachments.length === 0}
                  className="h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-colors duration-200"
                  aria-label="Send message"
                  title="Send"
                >
                  <ArrowUp className="h-4 w-4 text-white" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center px-4 py-2 border-t border-gray-200 dark:border-gray-700">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Attach files"
              title="Attach files"
            >
              <PaperclipIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setIsRAGFilesVisible(!isRAGFilesVisible)}
              className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ml-2"
              aria-label="Open RAG files"
              title="RAG files"
            >
              <Database className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </Button>
          </div>
        </div>
        <AttachmentList
          attachments={attachments}
          onRemove={(index) => removeAttachment(index)}
        />
      </form>
    </div>
  );
}
