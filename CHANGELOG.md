# Changelog

## Unreleased

- Guides 5 and 6: editorial fixes from the Code and Consistency reviews of the reproducibility change (wording, a shape comment); glossary and notation appendices updated

## 0.1.0 (2026-10-26)

Part 1, "How LLMs work":

- Guides 1–6: neural networks, tokenization, embeddings, attention, the transformer, next-token prediction
- One notebook per guide in `code/notebooks/`, checked in CI against every output the guides print
- The guides as one PDF book, with every step of the interactive figures, a glossary and a notation appendix
- Guide 6 loads Guide 5's trained toy from `code/guides/checkpoints/tinygpt.pt`, so its outputs are the same on every machine; Guide 5's training-dependent cells are marked as varying by processor
