# Changelog

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
