# Code

One Jupyter notebook per guide, holding every code block from that guide in the same order. Keep
the guide open beside the notebook: each code cell is preceded by the paragraph of the guide that
introduces it.

## Setup

```bash
python3 -m venv .venv && source .venv/bin/activate     # from the repository root; tested with Python 3.10
pip install -r code/requirements.txt
jupyter lab code/notebooks/
```

Run each notebook's **setup cell** first. It makes this `code/` folder the working directory,
which is what the guides mean by "run from the repository root". It also prints your numpy,
tiktoken and torch versions and warns you if they differ from the pinned ones.

**In Colab**, open a notebook with the badge at its top and run the setup cell. It clones this
repository and installs the pinned versions. If it warns you about a version mismatch, restart
the runtime and run the setup cell again.

## Why the versions are pinned

The guides print exact numbers: losses, probabilities, token IDs. The pinned versions (numpy
2.2.6, tiktoken 0.14.0, torch 2.14.1, CPU build) are the ones those numbers came from. With other
versions, or on a GPU, the last digits can differ.

## What's here

| Path | What it is |
|---|---|
| `notebooks/NN-<slug>.ipynb` | one notebook per guide, generated from `content/NN-<slug>.mdx`, with outputs saved |
| `guides/tinygpt.py` | Guide 5's toy transformer, imported by later guides instead of being repeated |
| `series/running-example.py` | GPT-2 small, "The cat sat on the", traced through the series |

### Cells marked `%%gpt2`

A few blocks need GPT-2 small's released weights, a 548 MB download. The guides show these
blocks without running them, and in the notebooks they print "Skipped" by default. To run them,
download the weights once:

```bash
mkdir -p ~/.cache/llm-guides
curl -L -o ~/.cache/llm-guides/gpt2-607a30d.bin \
  https://huggingface.co/openai-community/gpt2/resolve/607a30d783dfa663caf39e06633721c8d4cfcd7e/pytorch_model.bin
```

Then run `os.environ["PRIMER_RUN_GPT2"] = "1"` in the notebook before those cells. The code
checks the file's SHA-256 hash before loading it.

### Cells that clear the session

Where a guide starts a fresh session, the notebook has a `%reset -f` cell. It clears every
variable, as a kernel restart would, and leaves the working directory where it is.

## Don't edit the notebooks

They're generated. To change one, change the guide, then run:

```bash
pip install -r tools/requirements.txt
python tools/build_notebooks.py        # regenerate (keeps saved outputs of unchanged cells)
python tools/verify_notebooks.py --write   # run, check against the guide, save outputs
```
