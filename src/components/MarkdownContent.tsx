"use client";

import ReactMarkdown from "react-markdown";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  return (
    <div
      className={`markdown-body font-writer text-[20px] leading-8 text-zinc-700 ${className}`}
    >
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h2 className="mt-8 mb-3 text-3xl font-semibold tracking-tight text-zinc-900 first:mt-0">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h3 className="mt-7 mb-3 text-2xl font-semibold tracking-tight text-zinc-900 first:mt-0">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="mt-6 mb-2 text-xl font-semibold tracking-tight text-zinc-900 first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-4 leading-9 first:mt-0 last:mb-0">{children}</p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-900 underline underline-offset-2 transition hover:text-zinc-600"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="my-4 list-disc space-y-2.5 pl-6 marker:text-zinc-400">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-4 list-decimal space-y-2.5 pl-6 marker:text-zinc-400">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-9">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-zinc-300 pl-4 text-zinc-600 italic leading-9">
              {children}
            </blockquote>
          ),
          code: ({ className: codeClassName, children }) => {
            const isBlock = Boolean(codeClassName);
            if (isBlock) {
              return (
                <code className="font-mono text-[0.85em] text-zinc-100">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.875em] text-zinc-800">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-5 overflow-x-auto rounded-xl bg-zinc-900 p-4 text-sm leading-6 text-zinc-100">
              {children}
            </pre>
          ),
          hr: () => <hr className="my-8 border-zinc-200" />,
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-900">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          img: ({ src, alt }) =>
            src ? (
              // eslint-disable-next-line @next/next/no-img-element -- markdown image URLs are user-supplied
              <img
                src={src}
                alt={alt ?? ""}
                className="my-6 max-h-[480px] w-full max-w-full rounded-xl object-contain"
              />
            ) : null,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
