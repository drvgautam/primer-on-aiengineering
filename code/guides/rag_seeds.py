"""Guide 12's trained retriever and readers at seeds 0, 1 and 2; the guide runs seed 0 live and
quotes this output.

usage, from the repository root: .venv/bin/python guides/rag_seeds.py   (under a minute on CPU)

TF-IDF, mean pooling, the contrastive loss, the hybrid score and the reader's examples are the
guide's lines, copied here so this script runs on its own.
"""
import math
import torch
import torch.nn.functional as F
from rag import (kb, words, question, nouns, places, types, homes, recall, ranks, top_passages,
                 skipgram, train_retriever, train_reader, reader_check, read)

df = {w: sum(w in p.split() for p in kb) for w in words}
idf = {w: math.log(len(kb) / df[w]) if df[w] else 0.0 for w in words}


def tfidf(text):
    v = torch.zeros(len(words))
    for w in text.split():
        v[words.index(w)] += idf[w]
    return v


def sparse(text, kb):
    return F.cosine_similarity(tfidf(text)[None], torch.stack([tfidf(p) for p in kb]))


def embed(text, E):
    return E[[words.index(w) for w in text.split()]].mean(0)


def dense(E):
    return lambda text, kb: F.cosine_similarity(embed(text, E)[None], torch.stack([embed(p, E) for p in kb]))


def contrastive_loss(q, candidates, sharpness=0.1):
    scores = F.cosine_similarity(q[None], candidates) / sharpness
    return F.cross_entropy(scores[None], torch.tensor([0]))


def reader_example(rng, abstain):
    a, place = rng.choice(nouns), rng.choice(places)
    passage, answer = f"the {a} lives in the {place}", f"in the {place}"
    roll = rng.random()
    if abstain and roll < 0.2:
        other = rng.choice([b for b in nouns if b != a])
        passage, answer = f"the {other} lives in the {place}", "unknown"
    elif abstain and roll < 0.4:
        passage, answer = rng.choice([t for t in types if t.split()[1] == a]), "unknown"
    return f"{passage} {question(a)} ", f"{answer} and"


E = skipgram()
for seed in (0, 1, 2):
    trained = dense(train_retriever(E, contrastive_loss, embed, seed=seed))
    hybrid = lambda text, kb: 0.5 * trained(text, kb) + 0.5 * sparse(text, kb)
    print(f"retriever seed {seed}: dense recall@1 cat/dog/rat {recall(trained, kb, nouns[:3], 1):.0%}, "
          f"fox/owl/hen {recall(trained, kb, nouns[3:], 1):.0%}, recall@3 fox/owl/hen "
          f"{recall(trained, kb, nouns[3:], 3):.0%}; ranks {ranks(trained, kb, nouns)}; "
          f"hybrid recall@1 fox/owl/hen {recall(hybrid, kb, nouns[3:], 1):.0%}, ranks {ranks(hybrid, kb, nouns)}")
    print(f"  fox's top three: {top_passages(trained, kb, question('fox'))}")
plain = train_reader(reader_example, False, seed=0)
answers = [(a, p, read(plain, f"the {a} sat on the {p}", a)) for a in nouns for p in places]
own = sum(out == f"in the {homes[a]}" for a, p, out in answers)
copied = sum(out == f"in the {p}" != f"in the {homes[a]}" for a, p, out in answers)
elsewhere = sum(out in {f"in the {q}" for q in places} and out not in (f"in the {p}", f"in the {homes[a]}")
                for a, p, out in answers)
print(f"reader without abstention, seed 0: {reader_check(plain)}; on 'the <animal> sat on the <place>' "
      f"it answers the animal's own home {own}, the passage's place {copied}, another place {elsewhere}, "
      f"something else {36 - own - copied - elsewhere} of 36; the cat: {[out for a, p, out in answers if a == 'cat']}")
for seed in (0, 1, 2):
    print(f"reader with abstention, seed {seed}: {reader_check(train_reader(reader_example, True, seed=seed))}")
