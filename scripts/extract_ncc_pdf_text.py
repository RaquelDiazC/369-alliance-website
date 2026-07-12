"""
Extract clause-level full text from NCC 2022 Volume One PDF.

Strategy
--------
For each clause code we already know exists (from the structured CSVs),
search the cleaned PDF text for ALL occurrences of that code and pick
the BEST one — the one that looks most like a real clause definition.
A "real" definition typically:
  - is preceded/followed by the clause title from our master list
  - is followed by substantive prose (>= 200 chars before the next anchor)
  - contains anchor markers like "(1)", "must", "in accordance with", or
    a "20XX [legacy ref]" line.

Output:
  scripts/cache/ncc2022_vol1_pages.json   — page-by-page cleaned text
  scripts/cache/ncc2022_clause_texts.json — {code: {title, text, page, score}}
"""
from __future__ import annotations
import csv
import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

import fitz  # PyMuPDF

PDF      = Path(r"C:\2026\369 Alliance\1. Legislation\NCC\PDF\NCC-2022-Volume-One-PCD.pdf")
NCC_DIR  = Path(r"C:\2026\369 Alliance\1. Legislation\NCC")
CACHE    = Path(__file__).parent / "cache"
CACHE.mkdir(exist_ok=True)
PAGES_JSON   = CACHE / "ncc2022_vol1_pages.json"
CLAUSES_JSON = CACHE / "ncc2022_clause_texts.json"

FOOTER_RX = re.compile(
    r"(?m)^\s*(?:"
    r"Public Comment Draft"
    r"|NCC 2022 Volume One.*?"
    r"|Page \d+\s*"
    r"|Building Code of Australia\s*"
    r"|©.*Australian Building Codes Board.*"
    r"|Volume One.*?Building Code.*"
    r"|DRAFT"
    r")\s*$"
)

def clean_page(text: str) -> str:
    out = []
    for ln in text.split("\n"):
        if FOOTER_RX.match(ln):
            continue
        out.append(ln)
    return "\n".join(out)

def extract_pages(force=False) -> list[str]:
    if PAGES_JSON.exists() and not force:
        return json.loads(PAGES_JSON.read_text(encoding="utf-8"))
    print(f"[ ] Extracting + cleaning pages from {PDF.name} …")
    doc = fitz.open(PDF)
    pages = [clean_page(p.get_text()) for p in doc]
    doc.close()
    PAGES_JSON.write_text(json.dumps(pages), encoding="utf-8")
    print(f"[OK] Cached {len(pages)} pages -> {PAGES_JSON.name}")
    return pages

# ---------- Load every known clause code from the structured CSVs ----------
CSV_LINE = re.compile(r"^([A-Z]+\d*[A-Z]?\d*)\s+(.+)$")

def load_known_clauses() -> dict[str, str]:
    """Return {clause_code: canonical_title} from the 82 structured CSVs."""
    known = {}
    for f in sorted(NCC_DIR.glob("NCC_2022_Clauses_*.csv")):
        with open(f, encoding="utf-8") as fh:
            for row in csv.reader(fh):
                if not row:
                    continue
                line = row[0].lstrip("﻿").strip()
                if line.lower() == "label":
                    continue
                m = CSV_LINE.match(line)
                if m:
                    known[m.group(1).strip()] = m.group(2).strip()
    return known

# ---------- Scoring: how "real" is this occurrence of a code? ----------
ANCHOR_RX_TEMPLATE = r"(?<![A-Z0-9]){code}(?![A-Z0-9])"
SUBSTANCE_TOKENS = (
    " must ", " shall ", " is required", "in accordance with",
    "Performance Solution", "Deemed-to-Satisfy", "AS ", "AS/NZS ",
    "(1)", "(2)", "(3)", "(a)", "(b)", "(c)", "Application:",
    "Objective", "Functional Statement", "Verification",
)
TITLE_NEAR_DIST = 60   # chars

def score_occurrence(snippet: str, title: str) -> int:
    s = 0
    if title and title.lower() in snippet[:300].lower():
        s += 60
    # Look for "20XX legacy_ref" hint right after the code
    if re.search(r"\b20\d{2}\s+\w", snippet[:200]):
        s += 30
    # Substantive tokens
    for tok in SUBSTANCE_TOKENS:
        if tok in snippet:
            s += 5
    # Length bonus
    s += min(len(snippet), 2000) // 50
    return s

# ---------- For each known clause, find its best snippet ----------
def find_clauses(pages: list[str], known: dict[str, str]) -> dict[str, dict]:
    # Build one big text; remember page boundaries
    parts, offsets = [], [0]
    for p in pages:
        parts.append(p)
        parts.append("\n\n")
        offsets.append(offsets[-1] + len(p) + 2)
    full = "".join(parts)

    def offset_to_page(off):
        lo, hi = 0, len(offsets) - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if offsets[mid] <= off < offsets[mid + 1]:
                return mid + 1
            if off < offsets[mid]: hi = mid
            else:                  lo = mid + 1
        return lo + 1

    # Pre-compute all anchor positions across the document so we can find
    # the "next anchor" boundary fast (any clause-like code).
    GLOBAL_ANCHOR = re.compile(
        r"(?<![A-Z0-9])("
        r"S\d{1,3}C\d{1,3}"
        r"|[A-Z]\d{1,2}[A-Z]\d{1,3}"
        r")(?![A-Z0-9])"
    )
    anchors = [m.start() for m in GLOBAL_ANCHOR.finditer(full)]
    anchors_set = sorted(set(anchors))

    def next_anchor_after(pos: int) -> int:
        # binary search
        lo, hi = 0, len(anchors_set)
        while lo < hi:
            mid = (lo + hi) // 2
            if anchors_set[mid] <= pos: lo = mid + 1
            else:                       hi = mid
        return anchors_set[lo] if lo < len(anchors_set) else len(full)

    out: dict[str, dict] = {}
    for code, title in known.items():
        pat = re.compile(ANCHOR_RX_TEMPLATE.format(code=re.escape(code)))
        best = None
        for m in pat.finditer(full):
            start = m.end()
            end   = next_anchor_after(start)
            snippet = full[start:min(end, start + 6000)].strip()
            score = score_occurrence(snippet, title)
            if best is None or score > best["score"]:
                best = {
                    "score": score,
                    "page":  offset_to_page(m.start()),
                    "snippet_start": start,
                    "snippet": snippet,
                }
        if best is None:
            out[code] = {"title": title, "text": "", "page": None, "score": 0}
            continue
        # Cap text for Excel
        text = best["snippet"]
        text = re.sub(r"\n{3,}", "\n\n", text).strip()
        if len(text) > 12000:
            text = text[:12000] + "\n…[truncated]"
        out[code] = {
            "title": title,
            "text":  text,
            "page":  best["page"],
            "score": best["score"],
        }
    return out

def main():
    pages  = extract_pages(force=False)
    known  = load_known_clauses()
    print(f"[ ] {len(known)} known clause codes from structured CSVs")
    clauses = find_clauses(pages, known)
    CLAUSES_JSON.write_text(json.dumps(clauses, indent=2), encoding="utf-8")

    # Distribution
    dist = {"empty": 0, "short": 0, "medium": 0, "full": 0}
    for v in clauses.values():
        L = len(v["text"])
        if L < 50:     dist["empty"]  += 1
        elif L < 300:  dist["short"]  += 1
        elif L < 1500: dist["medium"] += 1
        else:          dist["full"]   += 1
    print(f"[OK] {len(clauses)} clauses → {CLAUSES_JSON.name}")
    print(f"     distribution: {dist}")
    # Samples
    for c in ["B1D2", "B1P1", "C2P1", "F2P1", "S26C3", "J3D2"]:
        if c in clauses:
            v = clauses[c]
            print(f"\n--- {c} {v['title']} (p.{v['page']}, score={v['score']}, {len(v['text'])} chars) ---")
            print(v["text"][:500])

if __name__ == "__main__":
    main()
