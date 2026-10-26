#!/usr/bin/env python3
"""Run the notebooks top to bottom and check every cell's output against the guide.

usage: python tools/verify_notebooks.py [slug ...] [--write] [--gpt2] [--rtol 1e-3]

Each notebook runs in a fresh kernel with code/notebooks/ as its directory, as a reader's would.
A code cell passes when what it prints matches the guide's ```output block for that block
(tokens equal, numbers within --rtol, the same rule as the authoring repo's run-code.py), or,
for a block the guide quotes no output for, when it runs without error.

--write   save the executed notebooks, outputs included, for committing
--gpt2    also run the %%gpt2 cells (needs GPT-2 small's 548 MB weights; see series/running-example.py)
"""
import json
import os
import sys
import time
from pathlib import Path

import nbformat
from nbclient import NotebookClient
from nbclient.exceptions import CellExecutionError

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from mdxparse import parse, same  # noqa: E402

NOTEBOOKS = ROOT / "code" / "notebooks"


def printed(cell):
    """What a cell printed, stdout and stderr in order, as run-code.py captures it."""
    return "".join(o.get("text", "") for o in cell.get("outputs", []) if o.get("output_type") == "stream")


def error(cell):
    for o in cell.get("outputs", []):
        if o.get("output_type") == "error":
            return f"{o['ename']}: {o['evalue']}"
    return None


def verify(path, rtol, write, gpt2):
    nb = nbformat.read(path, as_version=4)
    src = (ROOT / nb.metadata["primer"]["source"]).read_text()
    expected = {b["line"]: b for b in parse(src)}
    client = NotebookClient(
        nb, timeout=600, kernel_name="python3", record_timing=False, allow_errors=True,
        resources={"metadata": {"path": str(NOTEBOOKS)}},
        timeout_func=lambda cell: cell.metadata.get("primer", {}).get("timeout", 600),
    )
    env = dict(os.environ, PRIMER_RUN_GPT2="1" if gpt2 else "0")
    t0 = time.time()
    saved_env = os.environ.copy()
    os.environ.update(env)
    try:
        client.execute()
    finally:
        os.environ.clear()
        os.environ.update(saved_env)

    problems, checked = [], 0
    for cell in nb.cells:
        if cell.cell_type != "code":
            continue
        line = cell.metadata.get("primer", {}).get("mdx_line")
        err = error(cell)
        tags = cell.metadata.get("tags", [])
        if line is None:  # the setup and %reset cells
            if err:
                problems.append(f"{'/'.join(tags) or 'cell'}: {err}")
            continue
        b = expected[line]
        if "needs-gpt2" in tags and not gpt2:
            continue
        checked += 1
        if b["flags"].get("expect-error"):
            if not err:
                problems.append(f"guide line {line}: expected an error, none raised")
        elif err:
            problems.append(f"guide line {line}: {err}")
        elif "expected" in b and not same(b["expected"], printed(cell), rtol):
            problems.append(f"guide line {line}: output differs from the guide\n"
                            f"    guide:    {b['expected'].strip()[:300]!r}\n"
                            f"    notebook: {printed(cell).strip()[:300]!r}")
    if write:
        nbformat.write(nb, path)
    return checked, problems, time.time() - t0


def main():
    args = sys.argv[1:]
    rtol = float(args[args.index("--rtol") + 1]) if "--rtol" in args else 1e-3
    flags_with_values = {args[args.index("--rtol") + 1]} if "--rtol" in args else set()
    wanted = [a for a in args if not a.startswith("--") and a not in flags_with_values]
    release = json.loads((ROOT / "release.json").read_text())
    entries = [g for part in release["parts"] for g in part["guides"]]
    failed = False
    for e in entries:
        if wanted and e["slug"] not in wanted:
            continue
        path = NOTEBOOKS / f"{e['guide']:02d}-{e['slug']}.ipynb"
        checked, problems, secs = verify(path, rtol, "--write" in args, "--gpt2" in args)
        status = "PASS" if not problems else f"FAIL ({len(problems)})"
        print(f"{path.name:28} {checked:3} cells checked  {secs:6.1f}s  {status}")
        for p in problems:
            print("    " + p)
        failed |= bool(problems)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
