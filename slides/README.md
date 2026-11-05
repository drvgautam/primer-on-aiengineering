# Lecture slides

One LaTeX Beamer deck per guide, for teaching from or for reviewing after reading. Each deck follows its guide section by section, with the same notation, numbers, figures and code.

| File | What it is |
|---|---|
| `decks/NN-<slug>.tex` | the lecture, written by hand from the guide |
| `theme/beamerthemeprimer.sty` | the look (site colours, Source Sans and Source Code Pro) and the teaching macros |
| `generated/` | inputs written by the tools; git-ignored, rebuilt on every build |

## Build

```bash
npm run build                      # the site: the figures are exported from its /book page
node tools/build-slides.mjs        # every deck with a released guide; or name slugs
python tools/check_slides.py       # the alignment checks
```

Each deck builds two PDFs into `dist/slides/`:

- `NN-<slug>-slides.pdf`, with overlays, for lecturing;
- `NN-<slug>-handout.pdf`, with the overlays collapsed and the answers shown, for reading.

LuaLaTeX runs in the pinned TeX Live image `texlive/texlive:TL2025-historic` through Docker, the same image CI uses. To use a local TeX Live 2025 instead, pass `--native`. A local install needs LuaLaTeX, Beamer, fancyvrb, TikZ, the Source Sans Pro and Source Code Pro fonts, and DejaVu and Noto Emoji as fallbacks for glyphs those lack.

## What is generated, and why

The house rule is that no code output is ever typed by hand. The slides follow it:

- `tools/build_slide_assets.py` writes each Python block of the guide (highlighted with Pygments, so no `-shell-escape`), the output the guide prints after it, the notebook's `In [k]` for it, and the guide's title and links. Each block gets the largest code size at which it fits a full-width frame. If a line still runs past the edge at that size, it is wrapped for display without changing what it does: a trailing comment continues on the next line as a comment, and a long line of code breaks after a comma inside brackets, lined up under the bracket. The generator confirms that the wrapped block parses to the same program as the guide's. A block too tall even at the smallest size is also written in parts, cut at blank lines between top-level statements, so the deck can show it over several frames with `\primercodepart`.
- `tools/export-figures.mjs` takes each figure from the built `/book/` page, where every step of a stepped figure is drawn separately. It prints each step as a vector PDF, with the same drawing and labels as the web and the book, and the deck steps through them as overlays.

## Writing a deck

Copy the structure of `decks/01-neural-networks.tex`:

1. A title, "Where we are" (`\primerseriesmap`), the recipe or problem, then the learning objectives.
2. One `\section` per guide `##` section, titled exactly as the guide. Each section has motivation, the concept, the maths built up with overlays, a worked example, the figure, the code with its output, and a `\checkq{question}{answer}`.
3. The guide's "going deeper" accordions, kept where the guide has them, as frames titled "Going deeper (optional): ...".
4. A wrap-up (`\section*`): what we simplified and where it's repaid, a summary, exercises, further reading, and next time.

| Macro | Use |
|---|---|
| `\primercode{L}` `\primeroutput{L}` `\cellnote{L}` | the block at guide line `L`, its output, and its notebook cell |
| `\primercodesolo{L}` | the block at line `L` fitted without its output, written when code and output together would need a small size; show `\primeroutput{L}` on the next frame |
| `\primercodepart{L}{k}` | part `k` of a block too tall for one frame (the generator cuts it at blank lines between top-level statements); show every part in order |
| `\primerfigure[height]{k}` | Figure `k`, every step as an overlay |
| `\primerfigonly[height]{k}{s}` | one step of Figure `k` |
| `\term{...}` | a term the guide defines; checked against the glossary |
| `\checkq{q}{a}` | check your understanding; the answer on the next overlay and in the handout |
| `\keyidea[label]` (environment) | a highlighted idea |
| `\free{...}` | wording whose numbers are not the guide's (exercise settings) |
| `% primer: skip-code L <reason>` | a guide block the deck deliberately leaves out |

The rules `tools/check_slides.py` enforces:

- sections match the guide's headings, in order;
- every figure step is shown;
- no code is typed by hand, and every guide block is shown;
- every number in the deck's own text appears in the guide;
- every `\term` is in the glossary up to this guide;
- the LaTeX log has no overfull box over 2 pt and no undefined reference or missing glyph.

The number check confirms a number appears in the guide, not that it is used in the right place, so a review still reads every slide against the guide.
