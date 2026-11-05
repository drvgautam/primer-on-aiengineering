# Changelog

## 0.7.3 (2026-11-05)

Visual guides for every released guide:

- Eight new A3 sheets, each in four steps from its guide's own examples and measured numbers: Guide 2, tokenization; Guide 3, embeddings; Guide 4, attention; Guide 5, the transformer; Guide 6, next-token prediction; Guide 7, pre-training; Guide 9, alignment; Guide 10, inference and serving. Each passed three cold-context review rounds and `tools/check_visuals.py`. On the site at `/visuals/`, linked from the guide pages and the README, and attached to the release
- `poster.jsx` gains a shared `Arrow`, which Guide 1's sheet now uses; `poster.css` gains each sheet's styles, and leaves KaTeX's own SVG (roots, big brackets) at KaTeX's sizes

## 0.7.2 (2026-11-05)

- The visual guide for Guide 1, neural networks: one A3 sheet in four steps (a neuron and why ReLU's bend makes layers worth stacking; the forward pass in shapes, softmax and cross-entropy; gradient descent and backpropagation on the guide's paper examples; the training run against the loss floor, and what carries forward to LLMs). Every number is the guide's; three cold-context review rounds. On the site at `/visuals/`, linked from the guide page and the README, and attached to the release

## 0.7.1 (2026-11-05)

Lecture slides for Guide 2:

- The Guide 2 deck, tokenization, as a lecture PDF and a handout: the guide's eight sections in order, with learning objectives, every figure step, every code block with its output and notebook cell, predict-before-you-run prompts, a check for understanding per section, what was simplified, a summary, notebook exercises and further reading. Three cold-context review rounds
- Long code blocks are shown over consecutive frames, cut between statements (`\primercodepart`), and a block whose code and output don't fit together gets a code-only frame before its output (`\primercodesolo`); a 7.2 pt code size between the readable sizes and the smallest, and long trailing comments wrap before the code shrinks. In Guide 1's deck, one code block (guide line 279) is now larger, with its comments wrapped
- The slide fonts fall back to DejaVu and Noto Emoji (both in the pinned TeX Live image) for characters they lack, such as the visible-space mark and emoji in Guide 2's code
- `tools/check_slides.py` counts a block shown in parts as shown only when every part is

## 0.7.0 (2026-11-05)

Visual guides, starting with Guide 8:

- A one-page visual guide per guide: an A3 sheet that gives the guide's whole idea at a glance, in four numbered steps, drawn from the guide's own example, experiment and measured numbers. The first sheet is Guide 8, fine-tuning
- Each sheet is printed from the site (`/visual/<slug>/`) as a vector PDF and a PNG (`tools/build-visuals.mjs`). `tools/check_visuals.py` checks it against its guide in CI: every number is in the guide, highlighted terms are in the glossary, one page with nothing overflowing, no text below 9 pt, WCAG AA contrast, at most 450 words and no citations (the guide carries its sources)
- The sheets are on the site (`/visuals/`), linked from the guide page and from a new Visual guide column in the README's guide tables, and attached to the release
- `tools/alignment.py`: the number and glossary checks the slides and the visual guides share

## 0.6.0 (2026-11-04)

Guide 10 joins Part 2, "Lifecycle":

- Guide 10, inference and serving: prefill and decode, the KV cache, why decode is limited by memory and how batching helps, sharing keys and values (multi-query and grouped-query attention), quantization, speculative decoding, and the rest of the serving stack (FlashAttention, continuous batching, prefix caching)
- Notebook `10-inference.ipynb`, checked in CI like the others. It starts from Guide 8's checkpoint and loads the draft model from `code/guides/checkpoints/draft.pt`. Its checked outputs matched the guide on every processor and thread setup tried; the timing blocks print your machine's times, which the guide quotes from its test machine and never checks
- Guide 10 in the PDF book, with its figures, and its terms in the glossary and notation appendices

## 0.5.0 (2026-11-04)

Guide 9 joins Part 2, "Lifecycle":

- Guide 9, alignment: preference data, reward models and the Bradley–Terry loss, best-of-n against a reward model and reward hacking, direct preference optimization (DPO) derived and run, over-optimization, and what alignment doesn't do
- Notebook `09-alignment.ipynb`, checked in CI like the others. It starts from Guide 8's checkpoint (`code/guides/checkpoints/finetune-base.pt`), and its output was byte-identical on every processor and thread setup tried, so no block needs the varies flag. `code/guides/preference_seeds.py` reruns the experiments over three seeds (about a minute). Notebook 08 links forward to it
- Guide 9 in the PDF book, with its figures, and its terms in the glossary and notation appendices

## 0.4.0 (2026-11-02)

Lecture slides, starting with Guide 1:

- `slides/`: a LaTeX Beamer deck per guide, built with LuaLaTeX in a pinned TeX Live 2025 image, as a lecture PDF (with step-by-step builds) and a handout. The first deck is Guide 1, neural networks: the guide's eight sections in order, with learning objectives, worked examples, every figure step, every code block with its output and notebook cell, a check for understanding per section, what was simplified, a summary, notebook exercises and further reading
- Code, outputs, notebook cell numbers and figures on the slides are generated from the guide, its notebook and the site, never typed (`tools/build_slide_assets.py`, `tools/export-figures.mjs`). `tools/check_slides.py` checks each deck against its guide in CI: sections, figures, code, numbers, glossary terms and a clean LaTeX log
- The slides are on the site (`/slides/`), linked from the guide page and from a new Slides column in the README's guide tables, and attached to the release
- The book workflow builds and checks the slides too, and attaches the book and the slides to a release in one step

## 0.3.1 (2026-10-30)

- Guide 8: editorial fixes from a further Consistency review, made after Guide 7's later edits (pre-training's step count stated against Guide 7's, acronyms expanded or removed, "sub-word"); no printed number changed
- Glossary and notation appendices updated to match (loss masking, Guide 8's code names)

## 0.3.0 (2026-10-30)

Guide 8 joins Part 2, "Lifecycle":

- Guide 8, fine-tuning: supervised fine-tuning with loss masking and chat formats, what comes from pre-training and what from fine-tuning, forgetting and replay, a new fact's side effects, and LoRA
- Notebook `08-finetuning.ipynb`, checked in CI like the others. It loads the base model from `code/guides/checkpoints/finetune-base.pt`, and its outputs matched the guide on every processor and thread setup tried
- Guide 8 in the PDF book, with its figures, and its terms in the glossary and notation appendices
- Guides 1 and 7: editorial fixes from the Consistency review of Guide 7 (Guide 1 says "step" for the learning rate, leaving "stride" to windows); glossary and notation appendices updated

Also in this release:

- Site: a docs layout. The guides are listed in a sidebar beside every page (a slide-in menu on phones), and the home page is a welcome page in the same frame: get started (read online, the book, the notebooks), what each part covers, and how to read the series, then a link to Guide 1
- Site: a quieter layout. The header is the logo, search, GitHub and the theme toggle. The home page is a short introduction with two actions (start reading, download the PDF) and the guides as one contents list; the stats, book, "three ways to read" and contribute sections, and the per-card notebook links, are gone. Guide pages have one notebook action, a sidebar of published guides only, and the error report and notebook links together at the end
- Site: full-text search across every guide section (header button, ⌘K / Ctrl K or /), with typo-tolerant matching, highlighted previews and keyboard navigation; the index is built after `next build` by `tools/build-search-index.mjs`
- Site, notebooks and book: no links to the blog; guide titles link to the site
- Guide 7: two fixes from the Code review of the reproducibility change (the misses are "misspellings and fragments"; a shape comment says `× ctx`), and its code session may take up to 90 s, for headroom on a busy or slower machine

## 0.2.0 (2026-10-27)

Part 2, "Lifecycle", begins:

- Guide 7, pre-training: a toy world of 576 sentence types with a held-out fifth, windows and
  stride, minibatch gradient descent, Adam, overfitting and validation loss, and the $6ND$
  compute rule
- Notebook `07-pretraining.ipynb`, checked in CI like the others. Its three training cells are
  tagged `varies`; the sampling cell loads the trained model from
  `code/guides/checkpoints/pretraining.pt`, so it matches the guide on every machine
- Guide 7 in the PDF book, with its figures, and its terms in the glossary and notation appendices
- Site: the home page and guide sidebar group guides by part

## 0.1.1 (2026-10-26)

- The PDF book opens with a designed cover page (`book/ai-engineering-primer-cover.pdf`, set by `cover` in `release.json`); the edition details move to the About page
- PDF bookmarks keep the space where a long heading wraps ("becomes numbers", not "becomesnumbers"), and viewers number pages to match the printed footers

- Site redesign: light and dark mode with a header toggle (follows the system setting until chosen), a new home page with guide cards and the Part 2 roadmap, and guide pages with a series sidebar, an "On this page" contents with the current section highlighted, a reading-progress bar, Colab and notebook links, copy buttons on code, joined code and output blocks with syntax colours, and previous and next links.

- Guides 5 and 6: editorial fixes from the Code and Consistency reviews of the reproducibility change (wording, a shape comment); glossary and notation appendices updated

## 0.1.0 (2026-10-26)

Part 1, "How LLMs work":

- Guides 1–6: neural networks, tokenization, embeddings, attention, the transformer, next-token prediction
- One notebook per guide in `code/notebooks/`, checked in CI against every output the guides print
- The guides as one PDF book, with every step of the interactive figures, a glossary and a notation appendix
- Guide 6 loads Guide 5's trained toy from `code/guides/checkpoints/tinygpt.pt`, so its outputs are the same on every machine; Guide 5's training-dependent cells are marked as varying by processor
