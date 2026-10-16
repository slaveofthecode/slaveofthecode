import { describe, expect, test } from "bun:test";
import { renderMarkdown } from "../src/lib/markdown";

describe("renderMarkdown", () => {
  test("renders bold, italic and inline code", () => {
    expect(renderMarkdown("a **b** c *d* e `f`")).toBe(
      "<p>a <strong>b</strong> c <em>d</em> e <code>f</code></p>",
    );
  });

  test("renders an unordered list", () => {
    expect(renderMarkdown("- one\n- two")).toBe(
      "<ul>\n<li>one</li>\n<li>two</li>\n</ul>",
    );
  });

  test("renders nested lists inside the parent item", () => {
    expect(renderMarkdown("- a\n  - b\n  - c\n- d")).toBe(
      [
        "<ul>",
        "<li>a<ul>",
        "<li>b</li>",
        "<li>c</li>",
        "</ul></li>",
        "<li>d</li>",
        "</ul>",
      ].join("\n"),
    );
  });

  test("renders an ordered list", () => {
    expect(renderMarkdown("1. one\n2. two")).toBe(
      "<ol>\n<li>one</li>\n<li>two</li>\n</ol>",
    );
  });

  test("renders headings", () => {
    expect(renderMarkdown("## Title")).toBe("<h2>Title</h2>");
  });

  test("joins consecutive lines with a line break", () => {
    expect(renderMarkdown("one\ntwo")).toBe("<p>one<br />two</p>");
  });

  test("separates blocks on blank lines", () => {
    expect(renderMarkdown("one\n\ntwo")).toBe("<p>one</p>\n<p>two</p>");
  });

  test("escapes HTML so untrusted markup cannot render", () => {
    const html = renderMarkdown('<script>alert("x")</script> & <b>');
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
  });

  test("only links http(s) URLs", () => {
    expect(renderMarkdown("[site](https://example.com)")).toBe(
      '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">site</a></p>',
    );
    expect(renderMarkdown("[x](javascript:alert(1))")).toBe(
      "<p>[x](javascript:alert(1))</p>",
    );
  });

  test("renders fenced code blocks without escaping their tags", () => {
    expect(renderMarkdown("```\nconst a = 1;\n```")).toBe(
      "<pre><code>const a = 1;</code></pre>",
    );
  });
});
