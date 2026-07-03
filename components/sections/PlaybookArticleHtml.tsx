"use client";

import DOMPurify from "isomorphic-dompurify";

type Props = { html: string };

/**
 * Renders rich HTML produced by the WYSIWYG article editor.
 * Content is sanitised with DOMPurify before being injected.
 */
export function PlaybookArticleHtml({ html }: Props) {
  if (!html?.trim()) return null;

  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "del",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "blockquote", "hr",
      "a", "img",
      "span", "div",
      "table", "thead", "tbody", "tr", "th", "td",
      "code", "pre",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "target", "rel", "style", "class"],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/)/i,
    // Force all external links to open safely
    ADD_ATTR: ["target"],
  });

  return (
    <div
      className="playbook-article-body playbook-article-html max-w-none"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
