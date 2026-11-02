#!/usr/bin/env python3
"""Write the generated inputs of the lecture slides, from the synced guides and notebooks.

usage: python tools/build_slide_assets.py [slug ...]

For each released guide (or the slugs given), into slides/generated/NN-<slug>/:
  meta.tex        the guide's number, title, part and links (site, notebook, Colab)
  code-L<n>.tex   the Python block at guide line n, highlighted (Pygments, no -shell-escape)
  out-L<n>.tex    the output block the guide prints after it, verbatim
  cells.tex       \\primercell{<n>} -> the notebook's In [k] for that block
and slides/generated/pygments.tex, the highlighting macros in the site's colours.

Nothing here is typed by hand: code and outputs come from the guide (the house rule), and cell
numbers from the committed notebook, so a deck can't drift from either. Figures are exported
separately by tools/export-figures.mjs.
"""
import ast
import io
import json
import math
import sys
import tokenize
from pathlib import Path

from pygments import highlight
from pygments.formatters import LatexFormatter
from pygments.lexers import PythonLexer
from pygments.style import Style
from pygments.token import Comment, Keyword, Name, Number, Operator, String

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from mdxparse import frontmatter, parse  # noqa: E402

OUT = ROOT / "slides" / "generated"


class SiteStyle(Style):
    """The site's light syntax colours (app/globals.css, --hl-*)."""
    background_color = "#f6f5f1"
    styles = {
        Comment: "italic #8a8a94",
        Keyword: "#7c3aed",
        Keyword.Constant: "#7c3aed",
        Operator.Word: "#7c3aed",
        String: "#0f7b4a",
        Number: "#b45309",
        Name.Function: "#1d4ed8",
        Name.Builtin: "#1d4ed8",
        Name.Class: "#1d4ed8",
    }


FORMATTER = LatexFormatter(style=SiteStyle, commandprefix="PY", commandchars=True)


def released(release):
    return [g for part in release["parts"] for g in part["guides"]]


def site_url(release):
    owner, name = release["repo"].split("/")
    return f"https://{owner}.github.io/{name}/"


def tex_escape(s):
    rep = {"\\": r"\textbackslash{}", "&": r"\&", "%": r"\%", "$": r"\$", "#": r"\#", "_": r"\_",
           "{": r"\{", "}": r"\}", "~": r"\textasciitilde{}", "^": r"\textasciicircum{}"}
    return "".join(rep.get(c, c) for c in s)


def verbatim(text):
    """An output block as a fancyvrb Verbatim with no command characters: printed exactly."""
    return "\\begin{PrimerOut}\n" + text.rstrip("\n") + "\n\\end{PrimerOut}\n"


# Code sizes a slide can use, in points (11 pt Beamer: \\footnotesize, \\scriptsize, \\tiny), with
# how many characters fit across a full-width frame and how many lines fit down it. Measured for
# Source Code Pro at the theme's scale, inside the code frame's rule and margin.
SIZES = [("\\footnotesize", 76, 14), ("\\scriptsize", 86, 16), ("\\tiny", 115, 22)]


def comment_columns(code):
    """Line number (1-based) -> column where its trailing comment starts, via the tokenizer, so a
    '#' inside a string is never mistaken for one."""
    cols = {}
    try:
        for t in tokenize.generate_tokens(io.StringIO(code).readline):
            if t.type == tokenize.COMMENT:
                cols[t.start[0]] = t.start[1]
    except (tokenize.TokenError, IndentationError, SyntaxError):
        pass
    return cols


def comma_breaks(code):
    """Line number -> [(column just after a comma inside brackets, column to indent the rest to)].
    Only brackets opened on the same line count, so the continuation lines up under its bracket."""
    breaks, stack = {}, []
    try:
        for t in tokenize.generate_tokens(io.StringIO(code).readline):
            if t.type != tokenize.OP:
                continue
            if t.string in "([{":
                stack.append(t.start)
            elif t.string in ")]}" and stack:
                stack.pop()
            elif t.string == "," and stack and stack[-1][0] == t.start[0]:
                breaks.setdefault(t.start[0], []).append((t.end[1], stack[-1][1] + 1))
    except (tokenize.TokenError, IndentationError, SyntaxError):
        pass
    return breaks


def wrap(code, width):
    """Fit a block to `width` characters for display, without changing what it does:
    - a trailing comment's overflow continues on the next line as a comment at the same column;
    - a long line of code breaks after a comma inside brackets, the rest lined up under the
      bracket (Python joins such lines, so the block runs the same).
    Returns the text and how many lines are still too wide."""
    cols, breaks, out, wide = comment_columns(code), comma_breaks(code), [], 0
    for i, line in enumerate(code.split("\n"), 1):
        c = cols.get(i)
        if len(line) <= width:
            out.append(line)
            continue
        if c is not None and c <= width - 12:
            head, words = line[:c], line[c + 1:].strip().split(" ")
            pad = " " * c
            cur = head + "# " + words[0]
            for w in words[1:]:
                if len(cur) + 1 + len(w) > width:
                    out.append(cur.rstrip())
                    cur = pad + "# " + w
                else:
                    cur += " " + w
            out.append(cur.rstrip())
            continue
        if c is None and breaks.get(i):
            start, indent, pieces = 0, 0, []
            while len(line) - start + indent > width:
                fits = [(p, ind) for p, ind in breaks[i] if p > start and p - start + indent <= width]
                if not fits:
                    break
                p, ind = fits[-1]
                pieces.append(" " * indent + line[start:p].strip() if pieces else line[:p].rstrip())
                start, indent = p, ind
            pieces.append(" " * indent + line[start:].strip() if pieces else line)
            out.extend(pieces)
            wide += any(len(x) > width for x in pieces)
            continue
        out.append(line)
        wide += 1
    return "\n".join(out), wide


def same_program(a, b):
    """True when two versions of a block parse to the same syntax tree (comments don't count)."""
    try:
        return ast.dump(ast.parse(a)) == ast.dump(ast.parse(b))
    except SyntaxError:
        return a == b


def fit(code, out_lines):
    """The largest size at which the block fits a full-width frame, and the block wrapped for it.
    A wrap that changed the program (it never should) is dropped for the block as printed."""
    # First choice: the largest readable size (not \\tiny) at which nothing needs wrapping; then
    # the largest size at which the wrapped block fits.
    for no_wrap in (True, False):
        for size, width, height in SIZES[:-1] if no_wrap else SIZES:
            text, wide = wrap(code, width)
            if not same_program(code, text):
                text, wide = code, 1
            if no_wrap and text != code:
                continue
            if not wide and len(text.split("\n")) + out_lines + (2 if out_lines else 0) <= height:
                return size, text, True
    size, width, _ = SIZES[-1]
    text, _ = wrap(code, width)
    return size, text, False


def build(entry, release):
    n, slug = entry["guide"], entry["slug"]
    name = f"{n:02d}-{slug}"
    src = (ROOT / "content" / f"{name}.mdx").read_text()
    fm = frontmatter(src)
    dst = OUT / name
    dst.mkdir(parents=True, exist_ok=True)
    for old in [*dst.glob("code-L*.tex"), *dst.glob("out-L*.tex")]:   # figures are export-figures.mjs's
        old.unlink()

    repo, branch = release["repo"], release.get("branch", "main")
    nb_path = f"code/notebooks/{name}.ipynb"
    title, _, tagline = fm["title"].partition(": ")
    (dst / "meta.tex").write_text(
        f"\\def\\guidenum{{{n}}}\n"
        f"\\def\\guidetitle{{{tex_escape(title)}}}\n"
        f"\\def\\guidetagline{{{tex_escape(tagline)}}}\n"
        f"\\def\\guidepart{{{tex_escape(fm.get('part', ''))}}}\n"
        f"\\def\\guideurl{{{site_url(release)}{slug}/}}\n"
        f"\\def\\notebookurl{{https://github.com/{repo}/blob/{branch}/{nb_path}}}\n"
        f"\\def\\notebookname{{{name}.ipynb}}\n"
        f"\\def\\colaburl{{https://colab.research.google.com/github/{repo}/blob/{branch}/{nb_path}}}\n"
        f"\\def\\primerversion{{{release['version']}}}\n"
        f"\\def\\primertitle{{{tex_escape(release['title'])}}}\n"
    )

    blocks = [b for b in parse(src) if b["lang"] in ("python", "py")]
    for b in blocks:
        out_lines = len(b.get("expected", "").rstrip("\n").split("\n")) if "expected" in b else 0
        size, text, fits = fit(b["code"].rstrip("\n"), out_lines)
        if not fits:
            print(f"  {name} line {b['line']}: too tall or wide for one frame even at {size[1:]}; split it across frames")
        code = highlight(text, PythonLexer(), FORMATTER)
        # Pygments' Verbatim -> our environment, so the decks set its size and frame in one place
        code = (code.replace("\\begin{Verbatim}[commandchars=\\\\\\{\\}]", "\\begin{PrimerCode}")
                .replace("\\end{Verbatim}", "\\end{PrimerCode}"))
        # \\primerautosize: the size this block fits at, unless the frame set \\codesize itself
        (dst / f"code-L{b['line']}.tex").write_text(f"\\primerautosize{{{size}}}%\n" + code)
        if "expected" in b:
            (dst / f"out-L{b['line']}.tex").write_text(verbatim(b["expected"]))

    nb = json.loads((ROOT / nb_path).read_text())
    cells = [f"\\expandafter\\def\\csname primercell@{c['metadata']['primer']['mdx_line']}\\endcsname{{{c.get('execution_count') or '?'}}}"
             for c in nb["cells"]
             if c["cell_type"] == "code" and c["metadata"].get("primer", {}).get("mdx_line")]
    (dst / "cells.tex").write_text("\n".join(cells) + "\n")
    flags = {b["line"]: sorted(k for k in b["flags"] if k in ("norun", "varies", "fresh")) for b in blocks}
    (dst / "blocks.json").write_text(json.dumps({"blocks": flags}, indent=1))
    return name, len(blocks)


def main():
    release = json.loads((ROOT / "release.json").read_text())
    wanted = set(sys.argv[1:])
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "pygments.tex").write_text(FORMATTER.get_style_defs())
    # the whole series, released or not, for the "where we are" map: number/short title/released
    series = [(g["guide"], frontmatter((ROOT / "content" / f"{g['guide']:02d}-{g['slug']}.mdx").read_text())["title"], 1)
              for g in released(release)]
    series += [(u["guide"], u.get("title", u["slug"]), 0) for u in release.get("unreleased", [])]
    (OUT / "series.tex").write_text("\\def\\primerserieslist{" + ",".join(
        f"{n}/{tex_escape(t.split(':')[0])}/{r}" for n, t, r in sorted(series)) + "}\n")
    for g in released(release):
        if wanted and g["slug"] not in wanted:
            continue
        name, k = build(g, release)
        print(f"{name}: {k} code blocks")


if __name__ == "__main__":
    main()
