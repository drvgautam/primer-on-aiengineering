"""Guide 7's toy world: 576 sentence types, one fifth held out, and a corpus generator.

The code is Guide 7's first block, unchanged, so later guides can import it and get the same
split and the same corpora for the same seeds.
"""
import random

nouns  = ["cat", "dog", "rat", "fox", "owl", "hen"]
verbs  = ["sat", "ran", "hid", "lay"]
preps  = ["on", "by", "near", "under"]
places = ["mat", "log", "rug", "bed", "pot", "hut"]
types = [f"the {a} {b} {c} the {d}" for a in nouns for b in verbs for c in preps for d in places]
random.Random(0).shuffle(types)
val_types, train_types = types[:115], types[115:]          # one fifth held out


def corpus(types, n, seed):
    rng = random.Random(seed)
    return " and ".join(rng.choice(types) for _ in range(n))


# Guide 8 adds a fixed home for each animal and corpora in which about one sentence in five
# states it ("the cat lives in the hut"). Copied from Guide 8's first block.
homes = {"cat": "hut", "dog": "bed", "rat": "log", "fox": "rug", "owl": "pot", "hen": "mat"}


def corpus_with_facts(types, n, seed, p_fact=0.2):         # like corpus, with home sentences mixed in
    rng = random.Random(seed)
    sentences = []
    for _ in range(n):
        if rng.random() < p_fact:
            a = rng.choice(nouns)
            sentences.append(f"the {a} lives in the {homes[a]}")
        else:
            sentences.append(rng.choice(types))
    return " and ".join(sentences)
