"""Code-block parser and output comparison for the guide MDX.

Vendored from the authoring repo's editors/scripts/run-code.py so the notebooks follow exactly
the conventions the guides were checked with. The info string after ```python:

  ```python               runs in the guide's current session (blocks share variables in order)
  ```python fresh         starts a new session (clean namespace) at this block
  ```python norun         shown to the reader, never executed
  ```python expect-error  must raise
  ```python timeout=120   per-session time limit in seconds (default 60)
  ```python varies        output depends on the processor and thread count (a training run):
                          it must run, but may print different digits than the guide
  ```output               immediately after a python block: the exact output the guide shows
"""
import math
import re

FENCE = re.compile(r"^(```|~~~)([^\n]*)\n(.*?)^\1[ \t]*$", re.M | re.S)
NUM = re.compile(r"^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$")
FRONTMATTER = re.compile(r"\A---\n(.*?)\n---\n", re.S)


def frontmatter(src):
    """The guide's frontmatter as a flat dict of strings (title, guide, slug, part)."""
    m = FRONTMATTER.match(src)
    data = {}
    if m:
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                data[k.strip()] = v.strip().strip('"')
    return data


def parse(src):
    """Every fenced block, in order, with python blocks carrying their `expected` output."""
    blocks = []
    for m in FENCE.finditer(src):
        info = m.group(2).strip().split()
        lang = info[0].lower() if info else ""
        flags = {f.split("=")[0]: (f.split("=")[1] if "=" in f else True) for f in info[1:]}
        line = src.count("\n", 0, m.start()) + 1
        blocks.append({"lang": lang, "flags": flags, "code": m.group(3), "line": line, "end": m.end(), "start": m.start()})
    # attach ```output blocks to the python block directly before them
    for prev, cur in zip(blocks, blocks[1:]):
        if cur["lang"] == "output" and prev["lang"] in ("python", "py") and src[prev["end"]:cur["start"]].strip() == "":
            prev["expected"] = cur["code"]
    return blocks


def same(expected, actual, rtol=1e-3):
    """Token-wise comparison; numbers match at relative tolerance rtol."""
    a, b = expected.split(), actual.split()
    if len(a) != len(b):
        return False
    for x, y in zip(a, b):
        xs, ys = x.strip("()[],"), y.strip("()[],")
        if NUM.match(xs) and NUM.match(ys):
            if not math.isclose(float(xs), float(ys), rel_tol=rtol, abs_tol=1e-6):
                return False
        elif x != y:
            return False
    return True
