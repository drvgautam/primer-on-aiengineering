"""Guide 9's preference-training toolkit: the toy preference task, a reward model, best-of-n
sampling, DPO and the measures the guide reports.

The guide shows the lessons' lines (the Bradley–Terry loss, best-of-n selection, the closed-form
optimum and the DPO loss) and passes the two losses into `train_rm` and `dpo`, so the line the
reader sees is the line that runs. Everything here is plumbing. The base model is Guide 8's,
loaded from `guides/checkpoints/finetune-base.pt`.
"""
import copy
import random
import torch
import torch.nn as nn
import torch.nn.functional as F
from tinygpt import vocab
from world import nouns, verbs, preps, places, homes
from finetune import encode, evaluate, load_base, val_inputs, val_targets


def prompts(animals, verbs=verbs, preps=preps):   # "the cat sat on the ", one per animal, verb, preposition
    return [f"the {a} {v} {p} the " for a in animals for v in verbs for p in preps]


def animal(prompt):
    return prompt.split()[1]


def pairs_for(prompt_list):                    # (prompt, preferred, rejected): the home against each other place
    return [(x, homes[animal(x)], y) for x in prompt_list for y in places if y != homes[animal(x)]]


trained, rest = ["cat", "dog", "rat"], ["fox", "owl", "hen"]
train_prompts = prompts(nouns, verbs[:3], preps[:3])                  # 9 of 16 phrasings, 54 prompts
test_prompts = [x for x in prompts(nouns) if x not in train_prompts]  # the other 7, 42 prompts


def batch_texts(texts):                        # right-padded with spaces (ID 0)
    seqs = [encode(t) for t in texts]
    ids = torch.zeros(len(seqs), max(len(s) for s in seqs), dtype=torch.long)
    for row, s in enumerate(seqs):
        ids[row, :len(s)] = s
    return ids, torch.tensor([len(s) for s in seqs])


def seq_logp(model, prompt_list, responses):   # log-probability of each response given its prompt, summed over its characters
    ids, lengths = batch_texts([x + y for x, y in zip(prompt_list, responses)])
    logp = torch.log_softmax(model(ids[:, :-1]), dim=-1)                  # B × (n−1) × |V|
    token_logp = logp.gather(2, ids[:, 1:, None])[..., 0]                 # B × (n−1)
    pos = torch.arange(ids.shape[1] - 1)
    starts = torch.tensor([len(x) - 1 for x in prompt_list])
    mask = (pos >= starts[:, None]) & (pos < lengths[:, None] - 1)        # positions whose target is a response character
    return (token_logp * mask).sum(1)


def place_logp(model, prompt_list):            # prompts × 6: log-probability of each place's characters
    with torch.no_grad():
        return torch.stack([seq_logp(model, prompt_list, [y] * len(prompt_list)) for y in places], 1)


def place_dist(model, prompt_list):            # prompts × 6, renormalized over the six places
    return torch.softmax(place_logp(model, prompt_list), 1)


def home_index(prompt_list):
    return torch.tensor([places.index(homes[animal(x)]) for x in prompt_list])


def home_rate(model, prompt_list):             # average probability of the animal's own home, among the six places
    dist = place_dist(model, prompt_list)
    return dist[torch.arange(len(prompt_list)), home_index(prompt_list)].mean().item()


def breakdown(model, prompt_list):             # preferred place / other places / anything else, unnormalized
    p = place_logp(model, prompt_list).exp()
    home = p[torch.arange(len(prompt_list)), home_index(prompt_list)]
    return home.mean().item(), (p.sum(1) - home).mean().item(), (1 - p.sum(1)).mean().item()


def kl_to_ref(logp, ref_logp):                 # average KL(p ‖ ref) over prompts, from log-probabilities
    return (logp.exp() * (logp - ref_logp)).sum(-1).mean().item()


class RewardModel(nn.Module):                  # the base model's trunk plus one number, read at the last character
    def __init__(self, base):
        super().__init__()
        self.trunk = base
        self.head = nn.Linear(base.out.in_features, 1)                    # d_model → 1

    def forward(self, texts):
        ids, lengths = batch_texts(texts)
        self.trunk(ids)
        stream = self.trunk.ln_f(self.trunk.stream)                       # B × n × d_model
        return self.head(stream[torch.arange(len(texts)), lengths - 1])[:, 0]


def rm_scores(rm, prompt_list):                # prompts × 6: the reward model's score for each place
    with torch.no_grad():
        return torch.stack([rm([x + y for x in prompt_list]) for y in places], 1)


def rm_accuracy(rm, prompt_list):              # share of pairs where the home scores higher
    scores = rm_scores(rm, prompt_list)
    home = scores[torch.arange(len(prompt_list)), home_index(prompt_list)]
    return ((home[:, None] > scores).sum(1).float() / 5).mean().item()


def train_rm(pairs, loss_fn, steps=200, lr=0.001, seed=0):
    torch.manual_seed(seed)
    rng = random.Random(seed)
    rm = RewardModel(load_base())
    optimizer = torch.optim.Adam(rm.parameters(), lr=lr)
    for step in range(steps):
        batch = rng.choices(pairs, k=32)
        r_pref = rm([x + y for x, y, _ in batch])
        r_rej = rm([x + y for x, _, y in batch])
        loss = loss_fn(r_pref, r_rej)
        optimizer.zero_grad(); loss.backward(); optimizer.step()
    return rm


def draws(model, prompt_list, n, repeats=12, seed=0):   # for each prompt, `repeats` sets of n places sampled from the model
    generator = torch.Generator().manual_seed(seed)
    dist = place_dist(model, prompt_list)
    return [[torch.multinomial(d, n, replacement=True, generator=generator) for _ in range(repeats)] for d in dist]


def dpo(pairs, loss_fn, beta=0.1, steps=100, lr=0.0001, seed=0):
    torch.manual_seed(seed)
    rng = random.Random(seed)
    policy, ref = load_base(), load_base()                                # both start as the base model
    optimizer = torch.optim.Adam(policy.parameters(), lr=lr)
    for step in range(steps):
        batch = rng.choices(pairs, k=32)
        x, pref, rej = zip(*batch)
        with torch.no_grad():
            ref_pref, ref_rej = seq_logp(ref, x, pref), seq_logp(ref, x, rej)
        loss = loss_fn(seq_logp(policy, x, pref), seq_logp(policy, x, rej), ref_pref, ref_rej, beta)
        optimizer.zero_grad(); loss.backward(); optimizer.step()
    return policy


def val_loss(model):                           # Guide 8's validation loss on ordinary world text
    with torch.no_grad():
        return evaluate(model, val_inputs, val_targets)


def generate(model, prompt, n=60, seed=None):  # greedy if seed is None, else sampled at temperature 1
    generator = None if seed is None else torch.Generator().manual_seed(seed)
    ids = encode(prompt)
    with torch.no_grad():
        for _ in range(n):
            logits = model(ids[None, -64:])[0, -1]
            i = logits.argmax() if generator is None else torch.multinomial(torch.softmax(logits, 0), 1, generator=generator)[0]
            ids = torch.cat([ids, i[None]])
    return "".join(vocab[i] for i in ids)
