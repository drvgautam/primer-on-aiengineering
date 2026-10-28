# A Primer on AI Engineering

Short, worked, runnable guides to how large language models work, from a single neuron to
how a model is pre-trained. Each guide reads in 10 to 20 minutes, and every number it prints comes
from code you can run yourself.

**Who it's for:** a strong software engineer who has used LLM APIs but never trained a model.
You need programming fluency and comfort with matrix multiplication. Everything else is taught
along the way, and each guide builds on the ones before it.

## Three ways to read

| | |
|---|---|
| **On the web** | [drvgautam.github.io/primer-on-aiengineering](https://drvgautam.github.io/primer-on-aiengineering/), with interactive figures |
| **As a PDF** | all guides in one book: download it from the [latest release](https://github.com/drvgautam/primer-on-aiengineering/releases/latest) |
| **As notebooks** | one Jupyter notebook per guide in [`code/notebooks/`](code/notebooks/), holding every code block in the guide's order |

## The guides

**Part 1: How LLMs work**

| # | Guide | Notebook |
|---|---|---|
| 1 | [Neural networks: a function with knobs](https://drvgautam.github.io/primer-on-aiengineering/neural-networks/) | [01-neural-networks.ipynb](code/notebooks/01-neural-networks.ipynb) |
| 2 | [Tokenization: how text becomes numbers](https://drvgautam.github.io/primer-on-aiengineering/tokenizer/) | [02-tokenizer.ipynb](code/notebooks/02-tokenizer.ipynb) |
| 3 | [Embeddings: giving every token a vector](https://drvgautam.github.io/primer-on-aiengineering/embeddings/) | [03-embeddings.ipynb](code/notebooks/03-embeddings.ipynb) |
| 4 | [Attention: letting tokens look at each other](https://drvgautam.github.io/primer-on-aiengineering/attention/) | [04-attention.ipynb](code/notebooks/04-attention.ipynb) |
| 5 | [The transformer: blocks, stacks and a model that works](https://drvgautam.github.io/primer-on-aiengineering/transformer/) | [05-transformer.ipynb](code/notebooks/05-transformer.ipynb) |
| 6 | [Next-token prediction: from probabilities to text](https://drvgautam.github.io/primer-on-aiengineering/next-token/) | [06-next-token.ipynb](code/notebooks/06-next-token.ipynb) |

**Part 2: Lifecycle**

| # | Guide | Notebook |
|---|---|---|
| 7 | [Pre-training: learning from a mountain of text](https://drvgautam.github.io/primer-on-aiengineering/pretraining/) | [07-pretraining.ipynb](code/notebooks/07-pretraining.ipynb) |

Coming next: fine-tuning, alignment, inference and serving, tool use and agents, and
retrieval-augmented generation (guides 8 to 12).

## Run the code

Everything runs on a laptop CPU. The longest notebook takes about a minute.

```bash
git clone https://github.com/drvgautam/primer-on-aiengineering.git
cd primer-on-aiengineering
python3 -m venv .venv && source .venv/bin/activate     # tested with Python 3.10
pip install -r code/requirements.txt                   # numpy, tiktoken, CPU torch (~200 MB), JupyterLab
jupyter lab code/notebooks/
```

Or open any notebook in Google Colab with the badge at its top. See [`code/README.md`](code/README.md)
for details.

### Reproducible by construction

The notebooks are generated from the guide sources, never edited by hand. CI runs every notebook
from top to bottom and checks that each cell prints what the guide shows: the same words, and
numbers within a relative tolerance of 0.1%. If a cell ever disagrees with its guide, the build fails.

One exception: training runs aren't bit-for-bit repeatable across processors and thread counts,
even with a fixed seed. Cells whose output comes from a live training run (in Guides 5 and 7) are
tagged `varies` and must run without error, but may print slightly different last digits; the
guide says so where it happens. Anything that needs a trained model afterwards loads it from
`code/guides/checkpoints/`, so those outputs match exactly on every machine.

## Build it yourself

```bash
npm ci
npm run dev                       # the site at localhost:3000
npm run build && npm run pdf      # dist/primer-on-aiengineering-<version>.pdf
node book/build-pdf.mjs --guide attention          # one guide only

pip install -r tools/requirements.txt
python tools/build_notebooks.py           # regenerate the notebooks from content/
python tools/verify_notebooks.py          # run them and compare with the guides
```

## Repository layout

```
content/          the guides (MDX) and the glossary and notation appendices
components/       the figures
app/, lib/        the website (Next.js, static export)
book/             print styles and the PDF builder
code/notebooks/   one notebook per guide (generated)
code/guides/      modules later guides import (tinygpt.py is Guide 5's model)
code/series/      the GPT-2 running example used across the series
tools/            notebook generator and verifier, sync from the authoring repo
```

## Contributing

Errata, "this doesn't reproduce" reports and suggestions are very welcome. See
[CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

The text and figures are licensed under [CC BY 4.0](LICENSE-CONTENT), and the code under
[MIT](LICENSE). If you use the guides, please cite them; [CITATION.cff](CITATION.cff) has the details.
