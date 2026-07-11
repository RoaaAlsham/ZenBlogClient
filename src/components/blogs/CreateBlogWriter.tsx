"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useRef,
  useState,
} from "react";
import {
  insertImageMarkdown,
  insertLinkMarkdown,
  prefixBulletList,
  prefixHeading,
  prefixNumberedList,
  prefixQuote,
  wrapSelectionBold,
  wrapSelectionItalic,
} from "@/lib/markdownInsert";

type CreateBlogWriterProps = {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onContinue: () => void;
  titleError?: string;
  descriptionError?: string;
};

type UrlPanel = "image" | "link" | null;

const toolbarBtn =
  "rounded-md border border-zinc-200 px-2.5 py-1 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50";

export function CreateBlogWriter({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onContinue,
  titleError,
  descriptionError,
}: CreateBlogWriterProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [urlPanel, setUrlPanel] = useState<UrlPanel>(null);
  const [panelUrl, setPanelUrl] = useState("");

  const applyInsert = useCallback(
    (result: { value: string; selectionStart: number; selectionEnd: number }) => {
      onDescriptionChange(result.value);
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(result.selectionStart, result.selectionEnd);
      });
    },
    [onDescriptionChange],
  );

  function readSelection(ref: RefObject<HTMLTextAreaElement | null>) {
    const el = ref.current;
    return {
      value: description,
      selectionStart: el?.selectionStart ?? description.length,
      selectionEnd: el?.selectionEnd ?? description.length,
    };
  }

  function toggleUrlPanel(panel: Exclude<UrlPanel, null>) {
    setUrlPanel((current) => {
      if (current === panel) return null;
      setPanelUrl("");
      return panel;
    });
  }

  function handleBold() {
    applyInsert(wrapSelectionBold(readSelection(textareaRef)));
  }

  function handleItalic() {
    applyInsert(wrapSelectionItalic(readSelection(textareaRef)));
  }

  function handleHeading() {
    applyInsert(prefixHeading(readSelection(textareaRef)));
  }

  function handleQuote() {
    applyInsert(prefixQuote(readSelection(textareaRef)));
  }

  function handleBulletList() {
    applyInsert(prefixBulletList(readSelection(textareaRef)));
  }

  function handleNumberedList() {
    applyInsert(prefixNumberedList(readSelection(textareaRef)));
  }

  function handleInsertUrl() {
    const url = panelUrl.trim();
    if (!url || !urlPanel) return;
    const selection = readSelection(textareaRef);
    applyInsert(
      urlPanel === "image"
        ? insertImageMarkdown(selection, url)
        : insertLinkMarkdown(selection, url),
    );
    setPanelUrl("");
    setUrlPanel(null);
  }

  function handleBodyKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.metaKey || event.ctrlKey)) return;
    const key = event.key.toLowerCase();
    if (key === "b") {
      event.preventDefault();
      handleBold();
    } else if (key === "i") {
      event.preventDefault();
      handleItalic();
    }
  }

  function handleDescriptionChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onDescriptionChange(event.target.value);
  }

  return (
    <main className="flex min-h-full flex-1 flex-col bg-white">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-zinc-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex min-w-0 items-baseline gap-3">
          <Link
            href="/"
            className="font-serif text-xl font-bold tracking-tight text-zinc-900"
          >
            ZenBlog
          </Link>
          <span className="truncate text-sm text-zinc-400">Draft</span>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Continue
        </button>
      </header>

      <div className="mx-auto w-full max-w-[720px] flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <input
          type="text"
          name="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          dir="auto"
          placeholder="Title"
          aria-invalid={Boolean(titleError)}
          className="font-writer w-full border-0 bg-transparent text-4xl font-bold leading-tight text-zinc-900 outline-none placeholder:text-zinc-300"
        />
        {titleError ? (
          <p className="mt-2 text-sm text-red-600">{titleError}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleBold}
            className={`${toolbarBtn} font-bold`}
            title="Bold (Ctrl/Cmd+B)"
          >
            B
          </button>
          <button
            type="button"
            onClick={handleItalic}
            className={`${toolbarBtn} italic`}
            title="Italic (Ctrl/Cmd+I)"
          >
            I
          </button>
          <button
            type="button"
            onClick={handleHeading}
            className={toolbarBtn}
            title="Heading"
          >
            H
          </button>
          <button
            type="button"
            onClick={handleQuote}
            className={toolbarBtn}
            title="Quote"
          >
            “”
          </button>
          <button
            type="button"
            onClick={handleBulletList}
            className={toolbarBtn}
            title="Bullet list"
          >
            • List
          </button>
          <button
            type="button"
            onClick={handleNumberedList}
            className={toolbarBtn}
            title="Numbered list"
          >
            1. List
          </button>
          <button
            type="button"
            onClick={() => toggleUrlPanel("link")}
            className={toolbarBtn}
            title="Insert link"
          >
            Link
          </button>
          <button
            type="button"
            onClick={() => toggleUrlPanel("image")}
            className={toolbarBtn}
            title="Insert image URL"
          >
            Image
          </button>
        </div>

        {urlPanel ? (
          <div className="mt-3 flex flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:flex-row sm:items-center">
            <input
              type="url"
              value={panelUrl}
              onChange={(e) => setPanelUrl(e.target.value)}
              placeholder={
                urlPanel === "image"
                  ? "https://… image URL"
                  : "https://… link URL"
              }
              className="w-full flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleInsertUrl();
                }
              }}
            />
            <button
              type="button"
              onClick={handleInsertUrl}
              disabled={!panelUrl.trim()}
              className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Insert
            </button>
          </div>
        ) : null}

        <textarea
          ref={textareaRef}
          name="description"
          value={description}
          onChange={handleDescriptionChange}
          onKeyDown={handleBodyKeyDown}
          dir="auto"
          rows={16}
          placeholder="Tell your story…"
          aria-invalid={Boolean(descriptionError)}
          className="font-writer mt-4 w-full resize-y border-0 bg-transparent text-[20px] leading-8 text-zinc-800 outline-none placeholder:text-zinc-300"
        />
        {descriptionError ? (
          <p className="mt-2 text-sm text-red-600">{descriptionError}</p>
        ) : null}
      </div>
    </main>
  );
}
