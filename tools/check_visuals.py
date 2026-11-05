#!/usr/bin/env python3
"""Check each one-page visual guide against its guide. CI fails on any miss.

usage: python tools/check_visuals.py [slug ...]      (after node tools/build-visuals.mjs)

Reads dist/visuals/NN-<slug>.report.json (written by tools/build-visuals.mjs) and the PDF:
  1. numbers    every number in the sheet's words appears in the guide (prose, code or output);
                parts marked data-free (series strip, links, version) are skipped
  2. terms      every highlighted term (data-term) is in the glossary up to this guide
  3. one page   the PDF has exactly one page, and no panel overflows its box or the sheet
  4. legibility no text below 9 pt at A3, and no chart label outside its panel
  5. contrast   all text meets WCAG AA against its background
  6. brevity    the sheet's words, labels included, stay within WORD_BUDGET: it's an overview
                (drawings of characters, marked data-chars, are not words)
  7. citations  none on the sheet ("et al.", an author-year reference): they belong to the guide
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from alignment import glossary_terms, numbers, term_ok  # noqa: E402

DIST = ROOT / "dist" / "visuals"
WORD_BUDGET = 450
CITATION = re.compile(r"\bet al\b|\b[A-Z][a-z]+,? (?:\(|\[)?(?:19|20)\d\d\b")


def check(entry):
    n, slug = entry["guide"], entry["slug"]
    name = f"{n:02d}-{slug}"
    report_path = DIST / f"{name}.report.json"
    if not report_path.exists():
        return None
    r = json.loads(report_path.read_text())
    src = (ROOT / "content" / f"{name}.mdx").read_text()
    problems = []

    stray = sorted(numbers(r["text"]) - numbers(src))
    if stray:
        problems.append("numbers not in the guide: " + ", ".join(f"{v:g}" for v in stray))

    terms = glossary_terms(n)
    bad = sorted({t for t in r["terms"] if not term_ok(t, terms)})
    if bad:
        problems.append("terms not in the glossary up to this guide: " + ", ".join(bad))

    words = len(re.findall(r"[A-Za-z0-9][\w'’.,%×-]*", r["words"]))
    if words > WORD_BUDGET:
        problems.append(f"{words} words, over the budget of {WORD_BUDGET}")
    cites = sorted({m.group(0) for m in CITATION.finditer(r["text"])})
    if cites:
        problems.append("citations on the sheet: " + ", ".join(cites))

    info = subprocess.run(["pdfinfo", str(DIST / f"{name}.pdf")], capture_output=True, text=True).stdout
    pages = int(re.search(r"Pages:\s+(\d+)", info).group(1))
    if pages != 1:
        problems.append(f"the PDF has {pages} pages, not 1")
    for key, what in [("overflow", "overflow"), ("small", "text below 9 pt"), ("clipped", "labels outside their panel"),
                      ("contrast", "contrast below WCAG AA")]:
        if r[key]:
            problems.append(f"{what}: " + "; ".join(r[key][:6]) + (" ..." if len(r[key]) > 6 else ""))
    return name, problems, r["minFontPt"], words


def main():
    release = json.loads((ROOT / "release.json").read_text())
    wanted = set(sys.argv[1:])
    failed = seen = 0
    for g in (g for part in release["parts"] for g in part["guides"]):
        if wanted and g["slug"] not in wanted:
            continue
        res = check(g)
        if res is None:
            continue
        seen += 1
        name, problems, smallest, words = res
        print(f"{name}: {'PASS' if not problems else 'FAIL'} (smallest text {smallest} pt, {words} words)")
        for p in problems:
            print("  - " + p)
        failed += bool(problems)
    if not seen:
        print("no visual guides built (run node tools/build-visuals.mjs)")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
