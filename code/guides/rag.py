"""Guide 12's retrieval-augmented generation toolkit: the toy knowledge base, sparse and dense
retrievers, the retriever's training loop, the reader's fine-tune, and the pipeline evaluation.

The guide shows the lessons' lines (TF-IDF vectors, mean pooling, the contrastive loss, the hybrid
score, the reader's examples and the pipeline loop) and passes them into these functions where it
can. The reader starts from Guide 8's base model, `guides/checkpoints/finetune-base.pt`.
"""
import random
import torch
import torch.nn.functional as F
from world import nouns, places, types, homes, train_types, corpus_with_facts
from finetune import load_base, greedy, sft

# The knowledge base: the six home sentences, then 60 distractors from Guide 7's sentence types.
home_sentences = [f"the {a} lives in the {homes[a]}" for a in nouns]
distractors = random.Random(3).sample(types, 60)
kb = home_sentences + distractors


def question(a):
    return f"where does the {a} live"


# Word vocabulary: every word of Guide 8's corpus and of the questions.
corpus_words = corpus_with_facts(train_types, 4000, seed=1).split()
words = sorted(set(corpus_words) | set(" ".join(question(a) for a in nouns).split()))


def ranks(score, kb, animals, ask=question):   # rank of each animal's home sentence (1 = first)
    out = []
    for a in animals:
        s = score(ask(a), kb)
        right = s[kb.index(f"the {a} lives in the {kb_home(kb, a)}")]
        out.append(int((s > right).sum()) + 1)
    return out


def kb_home(kb, a):                            # the animal's home in this knowledge base
    return next(p.split()[-1] for p in kb if p.startswith(f"the {a} lives in"))


def recall(score, kb, animals, top, ask=question):   # share of animals whose home sentence ranks within top
    return sum(r <= top for r in ranks(score, kb, animals, ask)) / len(animals)


def top_passages(score, kb, text, m=3):
    s = score(text, kb)
    return [kb[i] for i in s.argsort(descending=True)[:m]]


def skipgram(d=8, window=2, steps=2000, B=512, lr=0.5, seed=0):
    """Guide 3's skip-gram, in PyTorch, on Guide 8's corpus: returns the word-vector table."""
    torch.manual_seed(seed)
    ids = torch.tensor([words.index(w) for w in corpus_words])
    pairs = torch.tensor([(ids[i], ids[j]) for i in range(len(ids))
                          for j in range(max(0, i - window), min(len(ids), i + window + 1)) if i != j])
    E = (0.1 * torch.randn(len(words), d)).requires_grad_()       # |words| × d, the word vectors
    W = (0.1 * torch.randn(d, len(words))).requires_grad_()       # d × |words|, output matrix
    generator = torch.Generator().manual_seed(seed)
    for step in range(steps):
        batch = pairs[torch.randint(len(pairs), (B,), generator=generator)]
        loss = F.cross_entropy(E[batch[:, 0]] @ W, batch[:, 1])
        loss.backward()
        with torch.no_grad():
            E -= lr * E.grad; W -= lr * W.grad
            E.grad = None; W.grad = None
    return E.detach()


def train_retriever(E, contrastive_loss, embed, steps=300, lr=0.05, seed=0, animals=("cat", "dog", "rat")):
    """Fine-tune the word vectors so each question scores its home sentence above 15 random others."""
    rng = random.Random(seed)
    E = E.clone().requires_grad_()
    optimizer = torch.optim.Adam([E], lr=lr)
    for step in range(steps):
        a = rng.choice(animals)
        right = home_sentences[nouns.index(a)]
        candidates = [right] + rng.sample([p for p in kb if p != right], 15)   # right one first
        loss = contrastive_loss(embed(question(a), E), torch.stack([embed(p, E) for p in candidates]))
        optimizer.zero_grad(); loss.backward(); optimizer.step()
    return E.detach()


def train_reader(reader_example, abstain, seed=0, n=2000):
    """Fine-tune Guide 8's base model on n examples from the guide's `reader_example`: 400 steps,
    batches of 32, Adam 0.001 (Guide 8's `sft`)."""
    rng = random.Random(seed)
    pairs = [reader_example(rng, abstain) for _ in range(n)]
    return sft(load_base(), pairs, steps=400, seed=seed)


def read(model, passage, a):                   # the reader's answer, greedy, up to the stop sequence
    return greedy(model, f"{passage} {question(a)} ", n=20)


def reader_check(model):
    """The reader on three kinds of passage, as counts: the right home sentence for each animal and
    place (place copied, of 36); "the <animal> sat on the <place>" (answers "unknown", answers a
    place, of 36); another animal's home sentence (answers "unknown", answers that animal's place,
    of 30)."""
    answers = {f"in the {p}" for p in places}
    right = sum(read(model, f"the {a} lives in the {p}", a) == f"in the {p}" for a in nouns for p in places)
    same = [read(model, f"the {a} sat on the {p}", a) for a in nouns for p in places]
    other = [(b, read(model, f"the {b} lives in the {homes[b]}", a)) for a in nouns for b in nouns if b != a]
    return {"copied": right, "distractor: unknown": same.count("unknown"),
            "distractor: a place": sum(out in answers for out in same),
            "other's home: unknown": sum(out == "unknown" for b, out in other),
            "other's home: its place": sum(out == f"in the {homes[b]}" for b, out in other)}
