/**
 * Minimal, dependency-free Markdown renderer for chat replies.
 *
 * It escapes HTML first, so untrusted model output can never inject markup;
 * only the tags produced here are emitted. Supported syntax: fenced code
 * blocks, headings, (nested) unordered/ordered lists, bold, italic, inline
 * code and http(s) links — enough for the assistant's answers.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/(^|[^A-Za-z0-9_])_([^_\n]+)_/g, "$1<em>$2</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );
}

type ListItem = { text: string; children: Node[] };
type ListNode = { kind: "list"; type: "ul" | "ol"; items: ListItem[] };
type Node =
  | { kind: "p"; text: string }
  | { kind: "h"; level: number; text: string }
  | { kind: "code"; text: string }
  | ListState;

interface ListState {
  kind: "list";
  type: "ul" | "ol";
  indent: number;
  node: ListNode;
}

function serialize(node: Node): string {
  switch (node.kind) {
    case "p":
      return `<p>${node.text}</p>`;
    case "h":
      return `<h${node.level}>${node.text}</h${node.level}>`;
    case "code":
      return `<pre><code>${node.text}</code></pre>`;
    case "list": {
      const items = node.node.items
        .map(
          (item) =>
            `<li>${item.text}${item.children.map(serialize).join("")}</li>`,
        )
        .join("\n");
      return `<${node.type}>\n${items}\n</${node.type}>`;
    }
  }
}

export function renderMarkdown(input: string): string {
  const lines = escapeHtml(input.replace(/\r\n?/g, "\n")).split("\n");
  const nodes: Node[] = [];
  const stack: ListState[] = [];
  let paragraph: string[] = [];
  let code: string[] | null = null;

  const closeLists = () => {
    stack.length = 0;
  };
  const flushParagraph = () => {
    if (paragraph.length > 0) {
      nodes.push({ kind: "p", text: renderInline(paragraph.join("<br />")) });
      paragraph = [];
    }
  };
  const pushList = (type: "ul" | "ol", indent: number): ListState => {
    const node: ListNode = { kind: "list", type, items: [] };
    const state: ListState = { kind: "list", type, indent, node };
    const parent = stack.at(-1);
    if (parent) {
      const lastItem = parent.node.items.at(-1);
      lastItem?.children.push(state);
    } else {
      nodes.push(state);
    }
    stack.push(state);
    return state;
  };

  for (const line of lines) {
    if (code) {
      if (/^\s*```/.test(line)) {
        nodes.push({ kind: "code", text: code.join("\n") });
        code = null;
      } else {
        code.push(line);
      }
      continue;
    }

    if (/^\s*```/.test(line)) {
      flushParagraph();
      closeLists();
      code = [];
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      closeLists();
      continue;
    }

    const item = line.match(/^(\s*)(?:[-*+]|\d+\.)\s+(.*)$/);
    if (item) {
      flushParagraph();
      const indent = (item[1] ?? "").length;
      const type: "ul" | "ol" = /^\s*\d+\./.test(line) ? "ol" : "ul";
      const text = renderInline(item[2] ?? "");

      while (stack.length > 0 && indent < (stack.at(-1)?.indent ?? 0)) {
        stack.pop();
      }
      const top = stack.at(-1);
      if (top && indent === top.indent && top.type === type) {
        top.node.items.push({ text, children: [] });
      } else if (top && indent > top.indent) {
        pushList(type, indent).node.items.push({ text, children: [] });
      } else if (top && indent === top.indent) {
        stack.pop();
        pushList(type, indent).node.items.push({ text, children: [] });
      } else {
        pushList(type, indent).node.items.push({ text, children: [] });
      }
      continue;
    }

    const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      closeLists();
      const level = (heading[1] ?? "").length;
      nodes.push({ kind: "h", level, text: renderInline(heading[2] ?? "") });
      continue;
    }

    closeLists();
    paragraph.push(line);
  }

  if (code) nodes.push({ kind: "code", text: code.join("\n") });
  flushParagraph();
  closeLists();

  return nodes.map(serialize).join("\n");
}

export type MarkdownStyle = "text" | "bold" | "italic" | "code";

export interface MarkdownRun {
  text: string;
  style: MarkdownStyle;
}

export type MarkdownBlock =
  | { kind: "blank" }
  | { kind: "text"; runs: MarkdownRun[] }
  | { kind: "bullet"; indent: number; marker: string; runs: MarkdownRun[] }
  | {
      kind: "ordered";
      indent: number;
      marker: string;
      runs: MarkdownRun[];
    };

const INLINE_PATTERN =
  /`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*([^*]+)\*|_([^_]+)_/g;

function inlineRuns(text: string): MarkdownRun[] {
  const runs: MarkdownRun[] = [];
  let cursor = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      runs.push({ text: text.slice(cursor, index), style: "text" });
    }

    const [full, code, bold, strong, label, url, italic, emphasis] = match;
    if (code) runs.push({ text: code, style: "code" });
    else if (bold || strong) {
      runs.push({ text: bold ?? strong ?? "", style: "bold" });
    } else if (label && url) runs.push({ text: label, style: "text" });
    else runs.push({ text: italic ?? emphasis ?? "", style: "italic" });

    cursor = index + (full ?? "").length;
  }

  if (cursor < text.length) {
    runs.push({ text: text.slice(cursor), style: "text" });
  }

  return runs.filter((run) => run.text.length > 0);
}

export function parseMarkdownBlocks(input: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];

  for (const line of input.replace(/\r\n?/g, "\n").split("\n")) {
    if (line.trim() === "") {
      blocks.push({ kind: "blank" });
      continue;
    }

    const item = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
    if (item) {
      const marker = item[2] ?? "";
      blocks.push({
        kind: /^\d/.test(marker) ? "ordered" : "bullet",
        indent: (item[1] ?? "").length,
        marker,
        runs: inlineRuns(item[3] ?? ""),
      });
      continue;
    }

    blocks.push({ kind: "text", runs: inlineRuns(line) });
  }

  return blocks;
}
