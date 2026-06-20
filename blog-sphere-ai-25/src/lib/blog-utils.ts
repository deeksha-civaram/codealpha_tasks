export function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base || "post"}-${rand}`;
}

export function readingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function excerptFrom(content: string, max = 180): string {
  const stripped = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length <= max ? stripped : stripped.slice(0, max - 1) + "…";
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Minimal markdown -> HTML (headings, bold, italic, code, blockquote, lists, links, paragraphs). */
export function renderMarkdown(md: string): string {
  if (!md) return "";
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Extract fenced code blocks
  const codeBlocks: string[] = [];
  md = md.replace(/```([\s\S]*?)```/g, (_m, code) => {
    codeBlocks.push(`<pre><code>${esc(code.replace(/^\n/, ""))}</code></pre>`);
    return `\u0000CODE${codeBlocks.length - 1}\u0000`;
  });

  const lines = md.split(/\n/);
  const out: string[] = [];
  let inList: "ul" | "ol" | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      let p = para.join(" ");
      p = inline(p);
      out.push(`<p>${p}</p>`);
      para = [];
    }
  };
  const closeList = () => {
    if (inList) {
      out.push(`</${inList}>`);
      inList = null;
    }
  };

  const inline = (s: string) =>
    esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer noopener">$1</a>')
      .replace(/\u0000CODE(\d+)\u0000/g, (_m, i) => codeBlocks[Number(i)] ?? "");

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) { flushPara(); closeList(); continue; }
    let m;
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
      flushPara(); closeList();
      const lvl = m[1].length;
      out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`);
      continue;
    }
    if (line.startsWith("> ")) {
      flushPara(); closeList();
      out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`);
      continue;
    }
    if ((m = line.match(/^[-*]\s+(.*)$/))) {
      flushPara();
      if (inList !== "ul") { closeList(); out.push("<ul>"); inList = "ul"; }
      out.push(`<li>${inline(m[1])}</li>`);
      continue;
    }
    if ((m = line.match(/^\d+\.\s+(.*)$/))) {
      flushPara();
      if (inList !== "ol") { closeList(); out.push("<ol>"); inList = "ol"; }
      out.push(`<li>${inline(m[1])}</li>`);
      continue;
    }
    if (line.startsWith("\u0000CODE")) {
      flushPara(); closeList();
      out.push(line.replace(/\u0000CODE(\d+)\u0000/g, (_x, i) => codeBlocks[Number(i)] ?? ""));
      continue;
    }
    para.push(line);
  }
  flushPara(); closeList();
  return out.join("\n");
}

export const CATEGORIES = [
  "Technology",
  "Programming",
  "AI",
  "Design",
  "Business",
  "Lifestyle",
] as const;

import DOMPurify from "isomorphic-dompurify";

/** Render markdown then sanitize the resulting HTML to prevent XSS. */
export function safeRenderMarkdown(md: string): string {
  const html = renderMarkdown(md);
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "code", "pre", "blockquote",
      "ul", "ol", "li", "h1", "h2", "h3", "h4", "a", "img", "hr",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "title"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}
