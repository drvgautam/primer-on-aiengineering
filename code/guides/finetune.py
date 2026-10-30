"""Guide 8's fine-tuning toolkit: the base model, SFT with loss masking, replay and LoRA.

The code is Guide 8's blocks, unchanged, so `guides/finetune_seeds.py` and later guides get the
same numbers for the same seeds. The base model's weights are saved in
`guides/checkpoints/finetune-base.pt`; `load_base()` trains and saves them if the file is missing.
"""
import os
import random
import torch
import torch.nn as nn
import torch.nn.functional as F
from tinygpt import TinyGPT, vocab
from world import nouns, train_types, val_types, homes, corpus_with_facts

CHECKPOINT = os.path.join(os.path.dirname(__file__), "checkpoints", "finetune-base.pt")


def encode(text):
    return torch.tensor([vocab.index(c) for c in text])


def windows(ids, ctx, stride):                 # every ctx-long slice, one starting each stride characters
    return ids[:-1].unfold(0, ctx, stride), ids[1:].unfold(0, ctx, stride)


train_ids = encode(corpus_with_facts(train_types, 4000, seed=1))
val_inputs, val_targets = windows(encode(corpus_with_facts(val_types, 300, seed=99)), 64, 64)


def evaluate(model, inputs, targets):          # mean loss per character over all the windows
    with torch.no_grad():
        logits = model(inputs)                 # windows × n × |V|
        return F.cross_entropy(logits.reshape(-1, len(vocab)), targets.reshape(-1)).item()


def pretrain(steps=3000, B=32, seed=0):        # Guide 7's loop with 64-character windows
    torch.manual_seed(seed)
    model = TinyGPT(n_max=64)
    inputs, targets = windows(train_ids, 64, 1)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.003)
    generator = torch.Generator().manual_seed(seed)
    for step in range(steps):
        batch = torch.randint(len(inputs), (B,), generator=generator)     # B random windows
        logits = model(inputs[batch])                                     # B × n × |V|
        loss = F.cross_entropy(logits.reshape(-1, len(vocab)), targets[batch].reshape(-1))
        optimizer.zero_grad(); loss.backward(); optimizer.step()
    return model


def load_base():
    if not os.path.exists(CHECKPOINT):         # about a minute on a laptop CPU, once
        os.makedirs(os.path.dirname(CHECKPOINT), exist_ok=True)
        torch.save(pretrain().state_dict(), CHECKPOINT)
    model = TinyGPT(n_max=64)
    model.load_state_dict(torch.load(CHECKPOINT))
    return model


def greedy(model, prompt, n=20, stop=" and"):  # Guide 6's greedy rule, ending at the stop sequence
    ids, out = encode(prompt), ""
    with torch.no_grad():
        for _ in range(n):
            i = model(ids[None, -64:])[0, -1].argmax()                    # most probable next character
            ids, out = torch.cat([ids, i[None]]), out + vocab[i]
            if out.endswith(stop):
                return out[:-len(stop)]
    return out


def where(sentence):                           # "the fox hid under the rug" -> (prompt, response)
    return sentence + " where ", " ".join(sentence.split()[3:]) + " and"


def home_question(a, home=None):
    return f"where does the {a} live ", f"in the {home or homes[a]} and"


def batch_pairs(pairs):                        # pad to the longest example; mask 1 on response targets
    seqs = [encode(prompt + response) for prompt, response in pairs]
    n = max(len(seq) for seq in seqs) - 1
    inputs = torch.zeros(len(pairs), n, dtype=torch.long)                 # padded with spaces (ID 0)
    targets = torch.zeros(len(pairs), n, dtype=torch.long)
    mask = torch.zeros(len(pairs), n)
    for row, ((prompt, response), seq) in enumerate(zip(pairs, seqs)):
        inputs[row, :len(seq) - 1], targets[row, :len(seq) - 1] = seq[:-1], seq[1:]
        mask[row, len(prompt) - 1:len(seq) - 1] = 1                         # targets that are response characters
    return inputs, targets, mask


def sft(model, pairs, steps=300, lr=1e-3, seed=0, replay=0):
    rng = random.Random(seed)
    all_inputs, all_targets, all_mask = batch_pairs(pairs)
    optimizer = torch.optim.Adam([param for param in model.parameters() if param.requires_grad], lr=lr)
    generator = torch.Generator().manual_seed(seed)
    old_inputs, old_targets = windows(train_ids, 64, 1)                   # pre-training text, for replay
    for step in range(steps):
        batch = torch.tensor(rng.choices(range(len(pairs)), k=32))       # 32 random examples
        logits = model(all_inputs[batch])                                 # 32 × n × |V|
        losses = F.cross_entropy(logits.reshape(-1, len(vocab)), all_targets[batch].reshape(-1), reduction="none")
        mask = all_mask[batch].reshape(-1)
        loss = (losses * mask).sum() / mask.sum()                         # average over response characters only
        if replay:
            old = torch.randint(len(old_inputs), (replay,), generator=generator)
            logits = model(old_inputs[old])                               # replay × 64 × |V|
            loss = loss + 0.5 * F.cross_entropy(logits.reshape(-1, len(vocab)), old_targets[old].reshape(-1))
        optimizer.zero_grad(); loss.backward(); optimizer.step()
    return model


shuffled = train_types[:]
random.Random(5).shuffle(shuffled)
where_data = [where(s) for s in shuffled[:100]]
data = where_data + [home_question(a) for a in ("cat", "dog", "rat")] * 10


def where_score(model):                        # share of the 115 held-out types answered exactly
    return sum(greedy(model, p) == r[:-len(" and")] for p, r in map(where, val_types)) / len(val_types)


def homes_right(model, animals):
    return sum(greedy(model, home_question(a)[0]) == f"in the {homes[a]}" for a in animals)


def report(name, model):
    print(f"{name:12} {where_score(model):6.1%}  {homes_right(model, ['cat', 'dog', 'rat'])} of 3"
          f"  {homes_right(model, ['fox', 'owl', 'hen'])} of 3  {evaluate(model, val_inputs, val_targets):.3f}")


class LoRA(nn.Module):                         # x W + (alpha / r) x W_down W_up, with W frozen
    def __init__(self, layer, r=4, alpha=8):
        super().__init__()
        self.layer, self.scale = layer, alpha / r
        self.down = nn.Parameter(torch.randn(layer.in_features, r) * 0.01)   # W_down, d_in × r
        self.up = nn.Parameter(torch.zeros(r, layer.out_features))           # W_up, r × d_out, starts at zero

    def forward(self, x):                      # x: B × n × d_in
        return self.layer(x) + self.scale * (x @ self.down @ self.up)


def add_lora(model, r=4):
    for param in model.parameters():
        param.requires_grad = False            # freeze every original parameter
    for block in model.blocks:
        for name in ("qkv", "proj", "fc1", "fc2"):
            setattr(block, name, LoRA(getattr(block, name), r))
    return model
