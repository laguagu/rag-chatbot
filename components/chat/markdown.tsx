import { cn } from "@/lib/utils";
import { CheckIcon, ClipboardIcon } from "lucide-react";
import React, { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const useCopyToClipboard = () => {
  const [hasCopied, setHasCopied] = useState(false);

  const copy = useCallback((text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
      });
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  }, []);

  return { hasCopied, copy };
};

const CodeBlock = ({
  children,
  className,
  language,
}: {
  children: string;
  className?: string;
  language?: string;
}) => {
  const { hasCopied, copy } = useCopyToClipboard();

  return (
    <div className="relative my-4 group">
      <button
        onClick={() => copy(children)}
        className="absolute right-2 top-2 p-2 rounded-lg bg-zinc-700/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
        aria-label={hasCopied ? "Copied!" : "Copy code"}
      >
        {hasCopied ? (
          <>
            <CheckIcon className="h-4 w-4 text-green-400" />
            <span className="text-xs text-white">Copied!</span>
          </>
        ) : (
          <ClipboardIcon className="h-4 w-4 text-white" />
        )}
      </button>
      <pre
        className={cn(
          "p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-x-auto",
          "text-sm leading-relaxed font-mono",
          className,
        )}
      >
        <code className={language}>{children}</code>
      </pre>
    </div>
  );
};

const MarkdownComponents = {
  h1: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className={cn("mt-6 mb-4 text-2xl font-bold", className)} {...props} />
  ),
  h2: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className={cn("mt-5 mb-3 text-xl font-semibold", className)}
      {...props}
    />
  ),
  h3: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn("mt-4 mb-2 text-lg font-medium", className)} {...props} />
  ),
  h4: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4
      className={cn("mt-4 mb-2 text-base font-medium", className)}
      {...props}
    />
  ),
  h5: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h5 className={cn("mt-4 mb-2 text-sm font-medium", className)} {...props} />
  ),
  h6: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h6 className={cn("mt-4 mb-2 text-sm font-medium", className)} {...props} />
  ),
  code: ({
    className,
    inline,
    children,
    ...props
  }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) => {
    const match = /language-(\w+)/.exec(className || "");
    const codeString = String(children).replace(/\n$/, "");

    if (!inline && match) {
      return (
        <CodeBlock className={className} language={match[1]}>
          {codeString}
        </CodeBlock>
      );
    }

    return (
      <code
        className={cn(
          "px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-sm font-mono",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ className, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
    <pre className={cn("overflow-x-auto", className)} {...props} />
  ),
  p: ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn("leading-7 not-first:mt-4", className)} {...props} />
  ),
  ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className={cn("my-4 ml-6 list-disc marker:text-zinc-500", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      className={cn("my-4 ml-6 list-decimal marker:text-zinc-500", className)}
      {...props}
    />
  ),
  li: ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className={cn("mt-2", className)} {...props} />
  ),
  blockquote: ({
    className,
    ...props
  }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className={cn(
        "mt-4 border-l-4 border-zinc-300 pl-4 italic text-zinc-600 dark:border-zinc-700 dark:text-zinc-400",
        className,
      )}
      {...props}
    />
  ),
  a: ({
    className,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className={cn(
        "font-medium underline underline-offset-4 text-primary hover:text-primary/80",
        className,
      )}
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      {...props}
    />
  ),
  table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-4 w-full overflow-x-auto">
      <table className={cn("w-full border-collapse", className)} {...props} />
    </div>
  ),
  thead: ({
    className,
    ...props
  }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead
      className={cn("bg-zinc-50 dark:bg-zinc-800", className)}
      {...props}
    />
  ),
  tbody: ({
    className,
    ...props
  }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody
      className={cn("divide-y divide-zinc-200 dark:divide-zinc-700", className)}
      {...props}
    />
  ),
  tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr
      className={cn(
        "transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50",
        className,
      )}
      {...props}
    />
  ),
  th: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className={cn(
        "border border-zinc-200 px-4 py-2 text-left font-bold dark:border-zinc-700",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td
      className={cn(
        "border border-zinc-200 px-4 py-2 dark:border-zinc-700",
        className,
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) => (
    <hr
      className={cn("my-6 border-zinc-200 dark:border-zinc-800", className)}
      {...props}
    />
  ),
  img: ({
    className,
    alt,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img
      className={cn(
        "rounded-lg border border-zinc-200 dark:border-zinc-700",
        className,
      )}
      alt={alt}
      {...props}
    />
  ),
  sup: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <sup className={cn("align-super text-xs", className)} {...props} />
  ),
  sub: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <sub className={cn("align-sub text-xs", className)} {...props} />
  ),
  del: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <del className={cn("line-through", className)} {...props} />
  ),
};

interface MarkdownProps {
  children: string;
  className?: string;
}

const NonMemoizedMarkdown: React.FC<MarkdownProps> = ({
  children,
  className,
}) => {
  // Replace ASCII arrows outside code by a pre-pass split that preserves code blocks
  const preprocessed = React.useMemo(() => {
    // Simple state machine to avoid changing fenced code blocks
    const lines = children.split("\n");
    let inFence = false;
    let fenceMarker: string | null = null;
    const processed = lines.map((line) => {
      const fenceMatch = line.match(/^\s*(```|~~~)/);
      if (fenceMatch) {
        const marker = fenceMatch[1];
        if (!inFence) {
          inFence = true;
          fenceMarker = marker;
        } else if (marker === fenceMarker) {
          inFence = false;
          fenceMarker = null;
        }
        return line;
      }
      if (inFence) return line;
      // Replace only plain ASCII arrows, keep spacing readable
      return line.replace(/\s*->\s*/g, " → ");
    });
    return processed.join("\n");
  }, [children]);
  return (
    <div
      className={cn("prose prose-zinc dark:prose-invert max-w-none", className)}
    >
      <ReactMarkdown
        // Keep gfm enabled
        remarkPlugins={[remarkGfm]}
        components={MarkdownComponents}
      >
        {preprocessed}
      </ReactMarkdown>
    </div>
  );
};

export const Markdown = React.memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className,
);
