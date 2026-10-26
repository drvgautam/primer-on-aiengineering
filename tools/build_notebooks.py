#!/usr/bin/env python3
"""Generate code/notebooks/NN-<slug>.ipynb from content/NN-<slug>.mdx.

usage: python tools/build_notebooks.py [slug ...] [--check]

Every Python block of a guide becomes a code cell, byte for byte, preceded by the guide paragraph
that introduces it and grouped under the guide's section headings. Notebooks are never edited by
hand: change the guide, then regenerate.

Outputs already in a notebook are kept for every cell whose source is unchanged, so regenerating
never discards a verified run. tools/verify_notebooks.py --write refreshes them.

--check   regenerate in memory and exit 1 if any committed notebook differs (outputs ignored)
"""
import json
import re
import sys
from pathlib import Path

import nbformat
from nbformat.v4 import new_code_cell, new_markdown_cell, new_notebook

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from mdxparse import frontmatter, parse  # noqa: E402

NOTEBOOKS = ROOT / "code" / "notebooks"

# Shared modules in code/guides/ and the guide that builds each one.
MODULE_GUIDE = {"tinygpt": 5, "world": 7, "finetune": 8, "preference": 9, "inference": 10, "tools": 11, "rag": 12}

SETUP = '''\
# Setup: run this cell first. It makes the repository's code/ folder the working directory, so
# every block below runs exactly as printed in the guide ("run from the repository root").
import os, subprocess, sys
from pathlib import Path

REPO = "https://github.com/{repo}"
if "google.colab" in sys.modules and not any((p / "code" / "notebooks").is_dir() for p in [Path.cwd(), *Path.cwd().parents]):
    subprocess.run(["git", "clone", "--depth", "1", REPO, "/content/primer-on-aiengineering"], check=True)
    os.chdir("/content/primer-on-aiengineering")
    pins = [l.strip() for l in open("code/requirements.txt") if l.split("==")[0] in ("numpy", "tiktoken", "torch")]
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", *pins,
                    "--extra-index-url", "https://download.pytorch.org/whl/cpu"], check=True)

here = Path.cwd().resolve()
code_dir = next(p / "code" for p in [here, *here.parents] if (p / "code" / "notebooks").is_dir())
os.chdir(code_dir)

# The guide's outputs were produced with these versions, on CPU. Others may differ in the last digits.
import numpy, tiktoken, torch
pins = dict(l.strip().split("==") for l in open("requirements.txt") if l.split("==")[0] in ("numpy", "tiktoken", "torch"))
for name, mod in (("numpy", numpy), ("tiktoken", tiktoken), ("torch", torch)):
    have = mod.__version__.split("+")[0]
    note = "" if have == pins[name] else f"  <- the guide used {{pins[name]}}; outputs may differ slightly (on Colab, restart the runtime and rerun this cell)"
    print(f"{{name:9}} {{have}}{{note}}")
print("working directory:", Path(code_dir.parent.name) / "code")

# %%gpt2 marks blocks the guide shows but doesn't run, because they need GPT-2 small's 548 MB weights.
# To run them, download the weights as series/running-example.py explains, then set:
#     os.environ["PRIMER_RUN_GPT2"] = "1"
from IPython.core.magic import register_cell_magic

@register_cell_magic
def gpt2(line, cell):
    if os.environ.get("PRIMER_RUN_GPT2") == "1":
        get_ipython().run_cell(cell)
    else:
        print("Skipped: needs GPT-2 weights (see the setup cell to enable).")
'''

KNOWN_TAG = re.compile(r"</?(figure|figcaption|details|summary)\b[^>]*>")
BARE_ANGLE = re.compile(r"<(?=[A-Za-z/])")


def site_url(release):
    owner, name = release["repo"].split("/")
    return f"https://{owner}.github.io/{name}/"


def released(release):
    return [g for part in release["parts"] for g in part["guides"]]


def title(entry):
    """A guide's short title, the part before the colon: "Neural networks"."""
    src = (ROOT / "content" / f"{entry['guide']:02d}-{entry['slug']}.mdx").read_text()
    return frontmatter(src)["title"].split(":")[0]


def markdown(text):
    """MDX prose → notebook markdown: drop known tags, escape stray angle brackets outside code."""
    text = KNOWN_TAG.sub("", text)
    parts = re.split(r"(`[^`]*`)", text)
    return "".join(p if p.startswith("`") else BARE_ANGLE.sub("&lt;", p) for p in parts).strip()


def units(src):
    """The guide body as a list of units: heading, para, math, code, output, details/summary markers."""
    blocks = {b["line"]: b for b in parse(src)}
    lines = src.splitlines()
    body = src[src.index("\n---\n", 4) + 5:] if src.startswith("---\n") else src
    start = len(lines) - len(body.splitlines())
    out, para, i = [], [], start

    def flush():
        if para:
            out.append({"kind": "para", "text": "\n".join(para)})
            para.clear()

    while i < len(lines):
        line = lines[i]
        s = line.strip()
        if s.startswith(("```", "~~~")):
            flush()
            b = blocks[i + 1]
            out.append({"kind": "code" if b["lang"] in ("python", "py") else b["lang"] or "text", "block": b})
            i += 1
            while lines[i].strip() != s[:3]:
                i += 1
        elif s == "$$":
            flush()
            j = next(k for k in range(i + 1, len(lines)) if lines[k].strip() == "$$")
            out.append({"kind": "math", "text": "\n".join(lines[i:j + 1])})
            i = j
        elif s.startswith("<figure"):
            flush()
            while "</figure>" not in lines[i]:
                i += 1
        elif s == "<details>":
            flush()
            out.append({"kind": "details"})
        elif s.startswith("<summary>"):
            out.append({"kind": "summary", "text": KNOWN_TAG.sub("", s)})
        elif s == "</details>":
            flush()
            out.append({"kind": "end-details"})
        elif re.match(r"#{1,6} ", s):
            flush()
            level = len(s) - len(s.lstrip("#"))
            out.append({"kind": "heading", "level": level, "text": s[level:].strip()})
        elif s.startswith("import ") and s.endswith('"') and not out:
            pass  # the guide's JSX imports of figure components
        elif not s:
            flush()
        else:
            para.append(line)
        i += 1
    flush()
    return out


def intro(prev):
    """The trailing prose that introduces a code block: back to and including its last paragraph."""
    take = []
    for u in reversed(prev):
        if u["kind"] == "math":
            take.insert(0, u["text"])
        elif u["kind"] == "para":
            take.insert(0, u["text"])
            break
        else:
            break
    return "\n\n".join(markdown(t) for t in take if not t.lstrip().startswith("|"))


def build(entry, release, order):
    slug, n = entry["slug"], entry["guide"]
    src = (ROOT / "content" / f"{n:02d}-{slug}.mdx").read_text()
    fm = frontmatter(src)
    us = units(src)
    repo, branch = release["repo"], release.get("branch", "main")
    name = f"{n:02d}-{slug}.ipynb"
    read_url = entry.get("blog") or f"{site_url(release)}{slug}/"
    colab = f"https://colab.research.google.com/github/{repo}/blob/{branch}/code/notebooks/{name}"

    sections, current = [], None
    for u in us:
        if u["kind"] == "heading" and u["level"] == 2:
            current = u["text"]
            sections.append([current, 0])
        elif u["kind"] == "code" and sections:
            sections[-1][1] += 1
    n_code = sum(1 for u in us if u["kind"] == "code")
    n_out = sum(1 for u in us if u["kind"] == "code" and "expected" in u["block"])

    toc = "\n".join(f"- {t}" + (f" — {c} code cell{'s' * (c > 1)}" if c else " — no code") for t, c in sections)
    cells = [new_markdown_cell(
        f"# Guide {n}: {fm['title']}\n\n"
        f"*{fm.get('part', '')}* · [Read the guide]({read_url}) · "
        f"[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)]({colab})\n\n"
        f"This notebook holds every code block from Guide {n}, in the guide's order: {n_code} code cells, "
        f"{n_out} of which print an output the guide quotes. Each cell is preceded by the guide paragraph "
        "that introduces it, so you can keep the guide open beside the notebook. The saved outputs are the "
        "guide's; `tools/verify_notebooks.py` checks they still match.\n\n"
        "Run the setup cell first, then the cells in order: like the guide's blocks, they share variables.\n\n"
        f"**Sections of the guide**\n\n{toc}")]
    cells.append(new_code_cell(SETUP.format(repo=repo), metadata={"tags": ["setup"]}))

    pending_heading, prev, in_details, summary, first_code = None, [], False, "", True
    for idx, u in enumerate(us):
        k = u["kind"]
        if k == "heading":
            if u["level"] == 2:
                pending_heading, prev = u["text"], []
            elif u["level"] > 2:
                prev.append({"kind": "para", "text": f"**{u['text']}**"})
            continue
        if k == "details":
            in_details, summary = True, ""
            continue
        if k == "summary":
            summary = u["text"]
            continue
        if k == "end-details":
            in_details = False
            continue
        if k != "code":
            prev.append(u)
            continue

        b = u["block"]
        md = []
        if pending_heading:
            md.append(f"## {pending_heading}")
            pending_heading = None
        if in_details:
            md.append(f"> *Optional depth: from the guide's accordion \"{summary}\".*")
        text = intro(prev)
        if text:
            md.append(text)
        if b["flags"].get("varies"):
            md.append("> *This output depends on a training run, so on your processor, or with a different "
                      "number of threads, its last digits (and sometimes its text) can differ from the guide's.*")
        if b["flags"].get("fresh") and not first_code:
            md.append("> *The guide starts a clean session here: the next cell clears every variable, "
                      "as if you'd restarted the kernel (the working directory stays `code/`).*")
        for mod in sorted(set(re.findall(r"^\s*from\s+(\w+)\s+import", b["code"], re.M))):
            g = MODULE_GUIDE.get(mod)
            if g and g != n:
                link = order.get(g)
                where = f"[notebook {g:02d}]({link})" if link else f"Guide {g}"
                md.append(f"> *`guides/{mod}.py` holds the code built in Guide {g} ({where}).*")
        if md:
            cells.append(new_markdown_cell("\n\n".join(md)))
        if b["flags"].get("fresh") and not first_code:
            cells.append(new_code_cell("%reset -f", metadata={"tags": ["fresh-session"]}))
        code = b["code"].rstrip("\n")
        meta = {"primer": {"mdx_line": b["line"]}}
        tags = []
        if b["flags"].get("norun"):
            code = "%%gpt2\n" + code
            tags.append("needs-gpt2")
        if b["flags"].get("expect-error"):
            tags.append("raises-exception")
        if b["flags"].get("varies"):
            tags.append("varies")
        if "timeout" in b["flags"]:
            meta["primer"]["timeout"] = int(b["flags"]["timeout"])
        if tags:
            meta["tags"] = tags
        cells.append(new_code_cell(code, metadata=meta))
        prev, first_code = [], False

    i = [g["guide"] for g in released(release)].index(n)
    nav = []
    if i > 0:
        p = released(release)[i - 1]
        nav.append(f"← [Guide {p['guide']}: {title(p)}]({p['guide']:02d}-{p['slug']}.ipynb)")
    if i + 1 < len(released(release)):
        q = released(release)[i + 1]
        nav.append(f"[Guide {q['guide']}: {title(q)}]({q['guide']:02d}-{q['slug']}.ipynb) →")
    cells.append(new_markdown_cell(
        "---\n\n" + " · ".join(nav) + f"\n\nFound a cell that doesn't reproduce the guide? "
        f"[Open an issue](https://github.com/{repo}/issues/new?template=does-not-reproduce.yml)."))

    for j, c in enumerate(cells):
        c["id"] = f"{slug}-{j:03d}"
    nb = new_notebook(cells=cells, metadata={
        "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
        "language_info": {"name": "python"},
        "primer": {"guide": n, "slug": slug, "source": f"content/{n:02d}-{slug}.mdx"},
    })
    return name, nb


def key(nb):
    """What --check compares: cell types, sources and metadata, never outputs."""
    return [(c["cell_type"], c["source"], json.dumps(c.get("metadata", {}), sort_keys=True)) for c in nb["cells"]]


def main():
    args = sys.argv[1:]
    check = "--check" in args
    wanted = [a for a in args if not a.startswith("--")]
    release = json.loads((ROOT / "release.json").read_text())
    entries = released(release)
    order = {g["guide"]: f"{g['guide']:02d}-{g['slug']}.ipynb" for g in entries}
    NOTEBOOKS.mkdir(parents=True, exist_ok=True)
    stale = []
    for e in entries:
        if wanted and e["slug"] not in wanted:
            continue
        name, nb = build(e, release, order)
        path = NOTEBOOKS / name
        old = nbformat.read(path, as_version=4) if path.exists() else None
        if check:
            if old is None or key(old) != key(nb):
                stale.append(name)
            continue
        if old is not None:  # keep verified outputs for unchanged cells
            kept = {(c["id"], c["source"]): c for c in old["cells"] if c["cell_type"] == "code"}
            for c in nb["cells"]:
                if c["cell_type"] == "code" and (c["id"], c["source"]) in kept:
                    c["outputs"] = kept[(c["id"], c["source"])]["outputs"]
                    c["execution_count"] = kept[(c["id"], c["source"])]["execution_count"]
        nbformat.validate(nb)
        nbformat.write(nb, path)
        print(f"wrote code/notebooks/{name}")
    if check:
        if stale:
            print("out of date (run tools/build_notebooks.py): " + ", ".join(stale))
            sys.exit(1)
        print("notebooks match the guides")


if __name__ == "__main__":
    main()
