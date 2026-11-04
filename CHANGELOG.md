# Changelog

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
