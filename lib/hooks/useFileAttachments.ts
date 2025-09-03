"use client";

import type React from "react";

import { useRef, useState } from "react";

export function useFileAttachments() {
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Simple duplicate prevention: don't add if exact same file already exists
    setAttachments((prev) => {
      const newFiles = files.filter(
        (newFile) =>
          !prev.some(
            (existing) =>
              existing.name === newFile.name &&
              existing.size === newFile.size &&
              existing.lastModified === newFile.lastModified,
          ),
      );
      return [...prev, ...newFiles];
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      // Guard against invalid index or already processed removal
      if (index < 0 || index >= prev.length) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearAttachments = () => {
    setAttachments([]);
  };

  return {
    attachments,
    fileInputRef,
    handleFileChange,
    removeAttachment,
    clearAttachments,
  };
}
