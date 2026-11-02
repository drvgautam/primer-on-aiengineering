#!/usr/bin/env python3
"""Check that each lecture deck agrees with its guide. CI fails on any miss.

usage: python tools/check_slides.py [slug ...]

For slides/decks/NN-<slug>.tex against content/NN-<slug>.mdx (and the generated inputs):
  1. sections   the deck's \\section titles are the guide's ## headings, in order
  2. figures    every figure of the guide is shown, every step of it
  3. code       no hand-typed code (verbatim, Verbatim, lstlisting); every \\primercode{L} is a
                Python block of the guide; every block of the guide is shown, unless the deck
                says `% primer: skip-code L <reason>`
  4. numbers    every number in the deck's own text appears somewhere in the guide (prose, code
                or output). Generated inputs, TikZ drawings, lengths, overlay specs and \\free{...}
                are skipped
  5. terms      every \\term{...} is a glossary term (or a declared synonym) introduced by this
                guide or an earlier one
  6. build      if the deck's .log files exist in slides/build/: no overfull box over 2 pt, no
                undefined reference, no missing character
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from mdxparse import parse  # noqa: E402

SLIDES = ROOT / "slides"
NUMBER = re.compile(r"(?<![\w.])(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d*\.\d+|\d+)")


def released(release):
    return [g for part in release["parts"] for g in part["guides"]]


def balanced(s, i):
    """Index just past the {...} group starting at s[i] == '{'."""
    depth = 0
    for j in range(i, len(s)):
        if s[j] == "{" and (j == 0 or s[j - 1] != "\\"):
            depth += 1
        elif s[j] == "}" and s[j - 1] != "\\":
            depth -= 1
            if depth == 0:
                return j + 1
    return len(s)


def drop_command(s, name, nargs, keep_last=False):
    """Remove \\name[opt]{a}{b}... (nargs groups); with keep_last, keep the last group's content."""
    out, i = [], 0
    pat = re.compile(r"\\" + name + r"(?![A-Za-z])")
    while True:
        m = pat.search(s, i)
        if not m:
            out.append(s[i:])
            return "".join(out)
        out.append(s[i:m.start()])
        j = m.end()
        if j < len(s) and s[j] == "[":
            j = s.index("]", j) + 1
        last = ""
        for _ in range(nargs):
            while j < len(s) and s[j] in " \n":
                j += 1
            if j < len(s) and s[j] == "{":
                k = balanced(s, j)
                last = s[j + 1:k - 1]
                j = k
        if keep_last:
            out.append(last)
        i = j


def strip_comments(tex):
    return "\n".join(re.sub(r"(?<!\\)%.*", "", line) for line in tex.splitlines())


def deck_text_for_numbers(tex):
    """The deck's own words and maths, with everything that isn't a claim removed."""
    tex = strip_comments(tex)
    tex = tex[tex.index("\\begin{document}"):]
    tex = re.sub(r"\\begin\{tikzpicture\}.*?\\end\{tikzpicture\}", " ", tex, flags=re.S)
    for name, n in [("free", 1), ("primercode", 1), ("primeroutput", 1), ("cellnote", 1), ("primercell", 1),
                    ("primerfigure", 1), ("primerfigonly", 2), ("figcredit", 1), ("vspace", 1), ("hspace", 1),
                    ("setcounter", 2), ("href", 1), ("nolinkurl", 1), ("column", 0), ("rule", 2)]:
        tex = drop_command(tex, name, n)
    tex = re.sub(r"<[\d\-,| a-z:]*>", " ", tex)                       # overlay specs <2->, <1| handout:0>
    tex = re.sub(r"\[[^\]\n]*\\(text|line|paper)(width|height)[^\]\n]*\]", " ", tex)
    tex = re.sub(r"\d*\.?\d+\s*\\(textwidth|textheight|linewidth|paperwidth|columnwidth)", " ", tex)
    tex = re.sub(r"\d*\.?\d+\s*(pt|mm|cm|em|ex)\b", " ", tex)
    tex = re.sub(r"primer[A-Za-z]+!\d+", " ", tex)                     # colour mixes
    tex = re.sub(r"\\begin\{(columns|frame|tabular)\}(\[[^\]]*\])?(\{[^}]*\})?", " ", tex)
    return tex


def numbers(text):
    out = set()
    for m in NUMBER.finditer(text):
        v = m.group(1).replace(",", "")
        try:
            out.add(float(v))
        except ValueError:
            pass
    return out


def glossary_terms(top):
    md = (ROOT / "content" / "appendix" / "glossary.mdx").read_text()
    terms = set()
    for line in md.splitlines():
        if not line.startswith("|") or line.startswith("|---"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 4 or not re.search(r"\d", cells[3]):
            continue
        if int(re.search(r"\d+", cells[3]).group()) > top:
            continue
        terms.add(cells[0].lower())
        for syn in re.split(r"[;,]", cells[2]):
            syn = re.sub(r"\(.*?\)", "", syn).strip().lower()
            if syn and syn != "—":
                terms.add(syn)
    return terms


def term_ok(t, terms):
    t = re.sub(r"\\[a-z]+\{?|[{}$]", "", t).strip().lower()
    cands = {t, t.rstrip("s"), re.sub(r"\s*\(.*?\)", "", t)}
    return any(c in terms for c in cands)


def check(entry):
    n, slug = entry["guide"], entry["slug"]
    name = f"{n:02d}-{slug}"
    deck_path = SLIDES / "decks" / f"{name}.tex"
    if not deck_path.exists():
        return None
    tex = deck_path.read_text()
    src = (ROOT / "content" / f"{name}.mdx").read_text()
    body = strip_comments(tex)
    problems = []

    # 1. sections
    headings = [h.strip() for h in re.findall(r"^## (.+)$", src, re.M)]
    sections = []
    for m in re.finditer(r"\\section(?!\*)\s*(\[[^\]]*\])?\{", body):
        k = balanced(body, m.end() - 1)
        title = body[m.end():k - 1]
        title = re.sub(r"\\texorpdfstring\{(.*?)\}\{.*?\}", r"\1", title)
        sections.append(title.replace("\\&", "&").strip())
    if sections != headings:
        problems.append(f"sections: deck {sections}\n           guide {headings}")

    # 2. figures
    fig_json = SLIDES / "generated" / name / "figures.json"
    if fig_json.exists():
        steps = json.loads(fig_json.read_text())
        shown = {(int(k), s) for k in re.findall(r"\\primerfigure(?:\[[^\]]*\])?\{(\d+)\}", body)
                 for s in range(1, steps[int(k) - 1] + 1)}
        shown |= {(int(k), int(s)) for k, s in re.findall(r"\\primerfigonly(?:\[[^\]]*\])?\{(\d+)\}\{(\d+)\}", body)}
        missing = [f"Figure {k} step {s}" for k, c in enumerate(steps, 1) for s in range(1, c + 1) if (k, s) not in shown]
        if missing:
            problems.append("figures not shown: " + ", ".join(missing))
    else:
        problems.append("figures: slides/generated/<deck>/figures.json missing; run tools/export-figures.mjs")

    # 3. code
    if re.search(r"\\begin\{(verbatim|Verbatim|lstlisting|minted)\}|\\verb\b", body):
        problems.append("code: the deck types code by hand; use \\primercode{<line>}")
    lines = {b["line"] for b in parse(src) if b["lang"] in ("python", "py")}
    used = {int(x) for x in re.findall(r"\\primercode\{(\d+)\}", body)}
    skipped = {int(x) for x in re.findall(r"%\s*primer:\s*skip-code\s+(\d+)", tex)}
    if used - lines:
        problems.append(f"code: \\primercode lines that are not Python blocks of the guide: {sorted(used - lines)}")
    if lines - used - skipped:
        problems.append(f"code: guide blocks not shown (or declared skipped): {sorted(lines - used - skipped)}")
    for x in re.findall(r"\\(?:primeroutput|cellnote|primercell)\{(\d+)\}", body):
        if int(x) not in lines:
            problems.append(f"code: reference to guide line {x}, which is not a Python block")

    # 4. numbers
    allowed = numbers(src)
    stray = sorted(numbers(deck_text_for_numbers(tex)) - allowed)
    if stray:
        problems.append("numbers not in the guide: " + ", ".join(f"{v:g}" for v in stray))

    # 5. terms
    terms = glossary_terms(n)
    bad = []
    for m in re.finditer(r"\\term\{", body):
        t = body[m.end():balanced(body, m.end() - 1) - 1]
        if not term_ok(t, terms):
            bad.append(t)
    if bad:
        problems.append("terms not in the glossary up to this guide: " + ", ".join(bad))

    # 6. build hygiene
    for log in sorted((SLIDES / "build").glob(f"{name}-*.log")):
        text = log.read_text(errors="replace")
        over = [float(x) for x in re.findall(r"Overfull \\[hv]box \(([\d.]+)pt too", text)]
        if any(x > 2 for x in over):
            problems.append(f"{log.name}: {sum(x > 2 for x in over)} overfull box(es) over 2 pt")
        if re.search(r"undefined references|Reference .* undefined", text):
            problems.append(f"{log.name}: undefined references")
        if "Missing character" in text:
            problems.append(f"{log.name}: missing characters (a glyph the font lacks)")
    return name, problems


def main():
    release = json.loads((ROOT / "release.json").read_text())
    wanted = set(sys.argv[1:])
    failed, seen = 0, 0
    for g in released(release):
        if wanted and g["slug"] not in wanted:
            continue
        r = check(g)
        if r is None:
            continue
        seen += 1
        name, problems = r
        print(f"{name}: {'PASS' if not problems else 'FAIL'}")
        for p in problems:
            print("  - " + p)
        failed += bool(problems)
    if not seen:
        print("no decks found")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
