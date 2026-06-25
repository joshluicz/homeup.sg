#!/usr/bin/env python3
"""Build lib/data/playbook-final-10-articles.json from the final 10-article docx."""
from __future__ import annotations

import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCX = ROOT / "scripts/source/final-10-playbook-articles.docx"
OUT = ROOT / "lib/data/playbook-final-10-articles.json"

META = [
    {
        "num": 1,
        "slug": "how-much-will-you-net-from-selling-your-hdb-2026-calculator-guide",
        "title": "How Much Will You Net From Selling Your HDB? (2026 Calculator + Guide)",
        "thumbnail": "/images/playbook/articles/article-hdb-sales-calculator.png",
        "topic": "upgraders",
        "category": "selling",
        "featured": True,
    },
    {
        "num": 2,
        "slug": "hdb-mop-what-happens-when-your-5-years-are-up",
        "title": "HDB MOP: What Happens When Your 5 Years Are Up — And What To Do Next",
        "thumbnail": "/images/playbook/articles/article-hdb-mop.png",
        "topic": "upgraders",
        "category": "selling",
        "featured": True,
        "quick_answer": (
            "When your HDB Minimum Occupation Period ends, you can sell on the open market, rent out "
            "your flat, upgrade to private property, or stay put. The sequence of your next move — "
            "especially sell-first versus buy-first — determines ABSD exposure, loan eligibility, and "
            "how much cash you actually have to work with."
        ),
    },
    {
        "num": 3,
        "slug": "hdb-to-condo-the-exact-step-by-step-upgrade-process-in-singapore-2026",
        "title": "HDB to Condo: The Exact Step-by-Step Upgrade Process in Singapore (2026)",
        "thumbnail": "/images/playbook/articles/article-hdb-to-condo-2026.png",
        "topic": "upgraders",
        "category": "process",
        "featured": True,
    },
    {
        "num": 4,
        "slug": "absd-2026-5-legal-ways-to-reduce-or-avoid-it",
        "title": "ABSD Singapore 2026: What It Costs and 5 Legal Ways to Reduce It",
        "thumbnail": "/images/playbook/articles/article-absd-2026-5-legal-ways.png",
        "topic": "upgraders",
        "category": "tips",
        "featured": True,
    },
    {
        "num": 5,
        "slug": "decoupling-property-singapore-does-it-make-sense",
        "title": "Property Decoupling Explained: Costs, Risks, and When It Actually Makes Sense",
        "thumbnail": "/images/playbook/articles/article-decoupling-does-it-make-sense.png",
        "topic": "upgraders",
        "category": "process",
        "featured": False,
    },
    {
        "num": 6,
        "slug": "bridging-loans-in-singapore-when-you-need-one",
        "title": "Bridging Loans in Singapore: When You Need One (And When You Don't)",
        "thumbnail": "/images/playbook/articles/article-bridging-loans.png",
        "topic": "upgraders",
        "category": "tips",
        "featured": True,
    },
    {
        "num": 7,
        "slug": "upgrade-guide-hdb-vs-condo-which-is-better-for-you",
        "title": "HDB vs Condo in Singapore: The Real Numbers Behind the Upgrade Decision",
        "thumbnail": "/images/playbook/articles/article-upgrade-guide-hdb-vs-condo.png",
        "topic": "upgraders",
        "category": "tips",
        "featured": True,
    },
    {
        "num": 8,
        "slug": "agent-commission-fixed-fee-vs-2-percent-singapore",
        "title": "Property Agent Commission Singapore: Fixed Fee vs 2% — What You Actually Pay",
        "thumbnail": "/images/playbook/articles/article-agent-commission-fixed-fee-vs-2.png",
        "topic": "condo_tips",
        "category": "selling",
        "featured": False,
    },
    {
        "num": 9,
        "slug": "hdb-owners-should-you-upgrade-in-2026-singapore",
        "title": "Should HDB Owners Upgrade in 2026? What the Numbers Say Right Now",
        "thumbnail": "/images/playbook/articles/article-hdb-owners-upgrade-2026.png",
        "topic": "upgraders",
        "category": "process",
        "featured": True,
    },
    {
        "num": 10,
        "slug": "buy-condo-with-cpf-rules-limits-mistakes-singapore",
        "title": "Using CPF to Buy a Condo in Singapore: Rules, Limits, and Common Mistakes",
        "thumbnail": "/images/playbook/articles/article-buy-condo-with-cpf.png",
        "topic": "buying_first",
        "category": "buying",
        "featured": True,
    },
]

SECTION_RE = re.compile(
    r"^(Quick Answer|Introduction|How HomeUP Approaches This|How HomeUp Approaches This|Conclusion|Final Thoughts|FAQ)\b",
    re.I,
)


def is_question_heading(line: str) -> bool:
    t = line.strip()
    if not t or t.startswith("#"):
        return False
    if t.lower().startswith("q:"):
        return False
    return t.endswith("?") and 12 <= len(t) <= 180 and t[0].isupper()


def is_skip_line(line: str) -> bool:
    return bool(re.match(r"^(Primary keyword|Secondary keywords|Target:|AI draft|HomeUp\.sg)", line, re.I))


def extract_quick_answer(first: str) -> str | None:
    m = re.match(r"^Quick Answer\s*(.+)$", first, re.I | re.S)
    return m.group(1).strip() if m else None


def parse_faq(paras: list[str]) -> list[dict[str, str]]:
    text = "\n\n".join(paras)
    items: list[dict[str, str]] = []
    for m in re.finditer(r"Q:\s*([\s\S]+?)\s+A:\s*([\s\S]+?)(?=\s*Q:|$)", text, re.I):
        q, a = m.group(1).strip(), m.group(2).strip()
        if q and a:
            items.append({"q": q, "a": a})
    return items


def convert_article(body_paras: list[str], fallback_quick: str | None = None) -> tuple[str, list[dict[str, str]]]:
    paras = [p for p in body_paras if p.strip()]
    while paras and is_skip_line(paras[0]):
        paras.pop(0)

    quick = ""
    intro_paras: list[str] = []
    sections: list[tuple[str, list[str]]] = []
    homeup = ""
    conclusion = ""
    faq_items: list[dict[str, str]] = []

    i = 0
    if paras and extract_quick_answer(paras[0]) is not None:
        quick = extract_quick_answer(paras[0]) or ""
        i = 1

    current_section: str | None = None
    current_body: list[str] = []
    mode = "intro"

    def flush_section() -> None:
        nonlocal current_section, current_body
        if current_section and current_body:
            sections.append((current_section, current_body[:]))
        current_section = None
        current_body = []

    while i < len(paras):
        p = paras[i].strip()
        if not p:
            i += 1
            continue

        sec = SECTION_RE.match(p)
        if sec:
            label = sec.group(1).lower()
            rest = p[sec.end() :].strip()
            if label == "quick answer":
                if rest:
                    quick = (quick + " " + rest).strip() if quick else rest
                mode = "intro"
                flush_section()
            elif label == "introduction":
                if rest:
                    intro_paras.append(rest)
                mode = "intro"
                flush_section()
            elif label.startswith("how homeup"):
                flush_section()
                mode = "homeup"
                if rest:
                    homeup = rest
            elif label in ("conclusion", "final thoughts"):
                flush_section()
                mode = "conclusion"
                if rest:
                    conclusion = rest
            elif label == "faq":
                flush_section()
                mode = "faq"
            i += 1
            continue

        if mode == "faq" or p == "FAQ":
            faq_items = parse_faq(paras[i:])
            break

        if mode == "homeup":
            homeup = (homeup + "\n\n" + p).strip() if homeup else p
            i += 1
            continue
        if mode == "conclusion":
            conclusion = (conclusion + "\n\n" + p).strip() if conclusion else p
            i += 1
            continue

        if is_question_heading(p):
            flush_section()
            current_section = p
            current_body = []
            mode = "section"
            i += 1
            continue

        if mode == "section":
            current_body.append(p)
        else:
            intro_paras.append(p)
        i += 1

    flush_section()

    if not quick and fallback_quick:
        quick = fallback_quick

    parts: list[str] = []
    if quick:
        parts.append("Quick Answer:\n\n" + quick)
    if intro_paras:
        parts.append("Introduction:\n\n" + "\n\n".join(intro_paras))

    for title, body in sections:
        parts.append(f"## {title}\n\n" + "\n\n".join(body))

    if homeup:
        parts.append("How HomeUp Approaches This:\n\n" + homeup)
    if conclusion:
        parts.append("Conclusion:\n\n" + conclusion)
    if faq_items:
        faq_text = "\n\n".join([f"Q: {it['q']} A: {it['a']}" for it in faq_items])
        parts.append("FAQ:\n\n" + faq_text)

    return "\n\n".join(parts).strip(), faq_items


def read_docx_paragraphs(path: Path) -> list[str]:
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml")
    root = ET.fromstring(xml)
    paras: list[str] = []
    for p in root.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
        texts = [
            t.text or ""
            for t in p.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t")
        ]
        paras.append("".join(texts).strip())
    return paras


def main() -> None:
    paras = read_docx_paragraphs(DOCX)
    starts = [i for i, p in enumerate(paras) if re.match(r"^Article \d+:", p)]
    articles_out: list[dict] = []

    for meta in META:
        idx = meta["num"] - 1
        start = starts[idx]
        end = starts[idx + 1] if idx + 1 < len(starts) else len(paras)
        body = [p for p in paras[start + 1 : end] if p and not re.match(r"^#\d+ Edited by", p)]
        article, faq = convert_article(body, meta.get("quick_answer"))
        desc_match = re.search(r"Introduction:\n\n(.{80,220}?[\.\!])", article, re.S)
        if not desc_match:
            desc_match = re.search(r"Quick Answer:\n\n(.{80,220}?[\.\!])", article, re.S)
        desc = desc_match.group(1).replace("\n", " ").strip() if desc_match else meta["title"]

        tags = (
            ["HDB", "upgrade"]
            if meta["topic"] == "upgraders"
            else (["Condo", "buying"] if meta["topic"] == "buying_first" else ["Property", "tips"])
        )

        articles_out.append(
            {
                **{k: v for k, v in meta.items() if k != "quick_answer"},
                "description": desc,
                "meta_description": desc,
                "article": article,
                "faq": faq,
                "tags": tags,
                "content_kind": "article",
            }
        )

    OUT.write_text(json.dumps(articles_out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({len(articles_out)} articles)")


if __name__ == "__main__":
    main()
