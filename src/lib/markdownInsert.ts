export type TextSelection = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

export type InsertResult = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

function wrapWith(
  { value, selectionStart, selectionEnd }: TextSelection,
  before: string,
  after: string = before,
): InsertResult {
  const selected = value.slice(selectionStart, selectionEnd);
  const wrapped = selected
    ? `${before}${selected}${after}`
    : `${before}${after}`;
  const next =
    value.slice(0, selectionStart) + wrapped + value.slice(selectionEnd);

  if (!selected) {
    return {
      value: next,
      selectionStart: selectionStart + before.length,
      selectionEnd: selectionStart + before.length,
    };
  }

  return {
    value: next,
    selectionStart,
    selectionEnd: selectionStart + wrapped.length,
  };
}

/** Expand selection to cover full lines so line prefixes apply cleanly. */
function expandToFullLines({
  value,
  selectionStart,
  selectionEnd,
}: TextSelection): TextSelection {
  let start = selectionStart;
  let end = selectionEnd;

  while (start > 0 && value[start - 1] !== "\n") {
    start -= 1;
  }

  if (end > start && value[end - 1] === "\n") {
    end -= 1;
  }
  while (end < value.length && value[end] !== "\n") {
    end += 1;
  }

  return { value, selectionStart: start, selectionEnd: end };
}

function prefixLines(
  selection: TextSelection,
  prefixForIndex: (index: number) => string,
): InsertResult {
  const { value, selectionStart, selectionEnd } = expandToFullLines(selection);
  const block = value.slice(selectionStart, selectionEnd);
  const lines = block.length === 0 ? [""] : block.split("\n");
  const prefixed = lines
    .map((line, index) => `${prefixForIndex(index)}${line}`)
    .join("\n");
  const next =
    value.slice(0, selectionStart) + prefixed + value.slice(selectionEnd);

  return {
    value: next,
    selectionStart,
    selectionEnd: selectionStart + prefixed.length,
  };
}

export function wrapSelectionBold(selection: TextSelection): InsertResult {
  return wrapWith(selection, "**");
}

export function wrapSelectionItalic(selection: TextSelection): InsertResult {
  return wrapWith(selection, "*");
}

export function prefixHeading(selection: TextSelection): InsertResult {
  return prefixLines(selection, () => "## ");
}

export function prefixQuote(selection: TextSelection): InsertResult {
  return prefixLines(selection, () => "> ");
}

export function prefixBulletList(selection: TextSelection): InsertResult {
  return prefixLines(selection, () => "- ");
}

export function prefixNumberedList(selection: TextSelection): InsertResult {
  return prefixLines(selection, (index) => `${index + 1}. `);
}

export function insertLinkMarkdown(
  { value, selectionStart, selectionEnd }: TextSelection,
  url: string,
): InsertResult {
  const trimmed = url.trim();
  const selected = value.slice(selectionStart, selectionEnd);
  const label = selected || "link";
  const markdown = `[${label}](${trimmed})`;
  const next =
    value.slice(0, selectionStart) + markdown + value.slice(selectionEnd);

  if (!selected) {
    return {
      value: next,
      selectionStart: selectionStart + 1,
      selectionEnd: selectionStart + 1 + label.length,
    };
  }

  return {
    value: next,
    selectionStart,
    selectionEnd: selectionStart + markdown.length,
  };
}

export function insertImageMarkdown(
  { value, selectionStart, selectionEnd }: TextSelection,
  url: string,
): InsertResult {
  const trimmed = url.trim();
  const markdown = `![Image](${trimmed})`;
  const next =
    value.slice(0, selectionStart) + markdown + value.slice(selectionEnd);
  const cursor = selectionStart + markdown.length;

  return {
    value: next,
    selectionStart: cursor,
    selectionEnd: cursor,
  };
}
