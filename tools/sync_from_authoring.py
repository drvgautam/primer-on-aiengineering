#!/usr/bin/env python3
"""Copy the released guides and their code from the authoring repo into this one.

usage: python3 tools/sync_from_authoring.py ../llm-guides [--skip-run]

What is released is decided by release.json. A guide is synced only if it has been through the
editorial pipeline (reviews/<slug>/summary.md exists) and, unless --skip-run, every Python block
still passes editors/scripts/run-code.py with the authoring repo's pinned interpreter.

Never copied: editors/, reviews/, briefs, the ledger, concepts, the running-example plan, fixtures.
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from mdxparse import frontmatter  # noqa: E402

FIGURE_IMPORT = re.compile(r'from\s+"\.\./components/figures/([\w-]+)"')
JSX_IMPORT = re.compile(r'from\s+"\./([\w-]+)"')
PY_IMPORT = re.compile(r"^\s*from\s+(\w+)\s+import", re.M)


def released(release):
    return [g for part in release["parts"] for g in part["guides"]]


def figure_closure(src_dir, names):
    """The figure components a guide imports, plus the shared files they import (stepped.jsx)."""
    todo, seen = list(names), set()
    while todo:
        n = todo.pop()
        if n in seen:
            continue
        seen.add(n)
        todo += JSX_IMPORT.findall((src_dir / f"{n}.jsx").read_text())
    return seen


def table_rows_up_to(md, max_guide, guide_col):
    """Keep a markdown file's tables, dropping rows introduced after max_guide."""
    out = []
    for line in md.splitlines():
        if line.startswith("|") and not line.startswith("|---"):
            cells = [c.strip() for c in line.strip("|").split("|")]
            m = re.search(r"(\d+)", cells[guide_col]) if len(cells) > guide_col else None
            if m and int(m.group(1)) > max_guide:
                continue
        out.append(line)
    return "\n".join(out)


def appendix(src, title, intro, max_guide, guide_col):
    """An appendix page from a series table: our own heading and intro, the authoring table."""
    md = src.read_text()
    # the tables only: the prose around them is written for the series' editors
    table = "\n".join(l for l in md.splitlines() if l.startswith("|"))
    return f"# {title}\n\n{intro}\n\n{table_rows_up_to(table, max_guide, guide_col)}\n"


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(2)
    src = Path(args[0]).resolve()
    skip_run = "--skip-run" in args
    release = json.loads((ROOT / "release.json").read_text())
    guides = released(release)
    py = src / ".venv/bin/python"

    problems, figures, modules = [], set(), set()
    for g in guides:
        slug = g["slug"]
        mdx = src / "content" / f"{slug}.mdx"
        if not (src / "reviews" / slug / "summary.md").exists():
            problems.append(f"{slug}: no reviews/{slug}/summary.md; the guide hasn't finished the pipeline")
            continue
        if not skip_run:
            print(f"running {slug} ...", flush=True)
            r = subprocess.run([str(py), "editors/scripts/run-code.py", str(mdx), "--python", str(py)],
                               cwd=src, capture_output=True, text=True)
            if r.returncode != 0:
                problems.append(f"{slug}: run-code.py failed\n{r.stdout[-1500:]}")
                continue
        text = mdx.read_text()
        if int(frontmatter(text)["guide"]) != g["guide"]:
            problems.append(f"{slug}: frontmatter guide number differs from release.json")
        figures |= set(FIGURE_IMPORT.findall(text))
        modules |= set(PY_IMPORT.findall(text))
    if problems:
        print("refusing to sync:\n" + "\n".join(problems))
        sys.exit(1)

    # guides: content/NN-<slug>.mdx; stale files from earlier syncs are removed
    for old in (ROOT / "content").glob("*.mdx"):
        old.unlink()
    for g in guides:
        shutil.copy2(src / "content" / f"{g['slug']}.mdx", ROOT / "content" / f"{g['guide']:02d}-{g['slug']}.mdx")

    # figures the released guides import, with their shared helpers
    fig_dst = ROOT / "components" / "figures"
    keep = figure_closure(src / "components" / "figures", figures)
    for old in fig_dst.glob("*.jsx"):
        if old.stem not in keep:
            old.unlink()
    for n in keep:
        dst = fig_dst / f"{n}.jsx"
        # print-mode edits live in this repo; never overwrite them with the authoring copy
        if n == "stepped" and dst.exists():
            continue
        shutil.copy2(src / "components" / "figures" / f"{n}.jsx", dst)

    # the series' modules the released guides import (and what those import), their seed scripts
    # and the checkpoints they name, laid out under code/ as the guides expect
    code = ROOT / "code"
    src_guides = src / "guides"
    available = {p.stem for p in src_guides.glob("*.py")}
    released_mdx = "".join((ROOT / "content" / f"{g['guide']:02d}-{g['slug']}.mdx").read_text() for g in guides)
    # imported, or named in the prose ("the same code is saved as `guides/world.py`")
    named_modules = set(re.findall(r"guides/(\w+)\.py", released_mdx))
    needed, todo = set(), [m for m in modules | named_modules if m in available]
    while todo:
        m = todo.pop()
        if m not in needed:
            needed.add(m)
            todo += [n for n in PY_IMPORT.findall((src_guides / f"{m}.py").read_text()) if n in available]
    # a seed script ships with its guide's module (finetune_seeds.py with finetune.py)
    needed |= {s for s in available if s.endswith("_seeds") and s[:-len("_seeds")] in needed}
    for old in (code / "guides").glob("*.py"):
        if old.stem not in needed:
            old.unlink()
    for m in needed:
        shutil.copy2(src_guides / f"{m}.py", code / "guides" / f"{m}.py")
    named = "".join((src_guides / f"{m}.py").read_text() for m in needed)
    named += released_mdx
    ckpts = [p for p in (src_guides / "checkpoints").glob("*.pt") if p.name in named]
    (code / "guides" / "checkpoints").mkdir(parents=True, exist_ok=True)
    for old in (code / "guides" / "checkpoints").glob("*.pt"):
        if old.name not in {p.name for p in ckpts}:
            old.unlink()
    for p in ckpts:
        shutil.copy2(p, code / "guides" / "checkpoints" / p.name)
    shutil.copy2(src / "series" / "running-example.py", code / "series" / "running-example.py")
    stdlib_or_pins = {"collections", "math", "torch", "numpy", "tiktoken", "random", "os", "sys", "re"}
    missing = sorted(m for m in modules - stdlib_or_pins if m not in available)

    # appendices: only the rows the released guides have introduced
    top = max(g["guide"] for g in guides)
    app = ROOT / "content" / "appendix"
    app.mkdir(exist_ok=True)
    (app / "glossary.mdx").write_text(appendix(
        src / "series" / "glossary.md", "Glossary",
        f"One term per concept, as used in Guides 1–{top}. Declared synonyms are other names you'll meet in the literature.",
        top, 3))
    (app / "notation.mdx").write_text(appendix(
        src / "series" / "notation.md", "Notation",
        "**Rows are tokens.** A sequence of $n$ tokens is a matrix with $n$ rows, so projections multiply on the right "
        "($Q = XW^Q$), matching PyTorch's `x @ W` layout.",
        top, 3))

    print(f"synced {len(guides)} guides, {len(keep)} figure files, "
          f"modules: {', '.join(sorted(needed)) or 'none'}, checkpoints: {', '.join(p.name for p in ckpts) or 'none'}")
    if missing:
        print("WARNING: guides import modules not found in guides/: " + ", ".join(missing))
        sys.exit(1)


if __name__ == "__main__":
    main()
