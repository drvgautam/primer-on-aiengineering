"""Guide 10's serving toolkit: generation with and without a KV cache, timing, quantization and a
draft model for speculative decoding.

The guide shows the lessons' lines (`attend_cached`, `quantize_rows` and the speculative loop) and
passes them into these functions, so the line the reader sees is the line that runs. The target
model is Guide 8's base model, loaded from `guides/checkpoints/finetune-base.pt`; the draft model is
saved in `guides/checkpoints/draft.pt`, and `load_draft()` trains it if the file is missing.
"""
import os
import time
import statistics
import torch
import torch.nn.functional as F
from tinygpt import TinyGPT, vocab
from finetune import encode, windows, evaluate, load_base, train_ids, val_inputs, val_targets
from world import nouns, homes

DRAFT = os.path.join(os.path.dirname(__file__), "checkpoints", "draft.pt")


def text(ids):
    return "".join(vocab[i] for i in ids)


def generate_nocache(model, prompt, n):        # Guide 6's loop: the whole text through the model at every step
    ids, positions, all_logits = encode(prompt), 0, []
    with torch.no_grad():
        for _ in range(n):
            logits = model(ids[None])[0, -1]
            positions += len(ids)
            all_logits.append(logits)
            ids = torch.cat([ids, logits.argmax()[None]])
    return text(ids), positions, torch.stack(all_logits)


def forward_cached(model, ids, cache, attend):  # ids: B × m new tokens; cache: one (K, V) per block, or None
    start = 0 if cache[0] is None else cache[0][0].shape[2]
    x = model.W_E(ids) + model.W_P(torch.arange(start, start + ids.shape[1]))   # B × m × d_model
    for i, block in enumerate(model.blocks):
        a, cache[i] = attend(block, block.ln1(x), cache[i])
        x = x + a
        x = x + block.mlp(block.ln2(x))
    return model.out(model.ln_f(x))            # B × m × |V|


def generate_cache(model, prompt, n, attend):  # the prompt once, then one new position per step
    ids, cache, all_logits = encode(prompt), [None] * len(model.blocks), []
    with torch.no_grad():
        logits = forward_cached(model, ids[None], cache, attend)[0, -1]          # prefill
        positions = len(ids)
        for step in range(n):
            all_logits.append(logits)
            ids = torch.cat([ids, logits.argmax()[None]])
            if step < n - 1:
                logits = forward_cached(model, ids[None, -1:], cache, attend)[0, -1]   # decode one position
                positions += 1
    return text(ids), positions, torch.stack(all_logits)


def median_ms(fn, repeats=30):                 # warm up, then the median of repeated runs, in milliseconds
    for _ in range(3):
        fn()
    times = []
    for _ in range(repeats):
        start = time.perf_counter()
        fn()
        times.append((time.perf_counter() - start) * 1000)
    return statistics.median(times)


def decode_step_ms(model, batch, attend, context=20):   # one decode step for `batch` sequences with `context` cached tokens
    cache = [None] * len(model.blocks)
    with torch.no_grad():
        forward_cached(model, torch.zeros(batch, context, dtype=torch.long), cache, attend)
        prefix = [(k.clone(), v.clone()) for k, v in cache]
        new = torch.zeros(batch, 1, dtype=torch.long)

        def step():
            forward_cached(model, new, list(prefix), attend)
        return median_ms(step)


def quantize_(model, quantize, bits):          # quantize every weight matrix and embedding table, in place
    count = 0
    with torch.no_grad():
        for name, param in model.named_parameters():
            if param.dim() == 2:
                param.copy_(quantize(param, bits))
                count += param.numel()
    return count                               # how many numbers are now stored in `bits` bits


def per_matrix(quantize_rows):                 # the same rounding with one scale for the whole matrix
    return lambda W, bits: quantize_rows(W.reshape(1, -1), bits).reshape(W.shape)


def homes_recalled(model):
    with torch.no_grad():
        return sum(greedy_text(model, f"the {a} lives in the ", 3) == homes[a] for a in nouns)


def greedy_text(model, prompt, n):
    return generate_nocache(model, prompt, n)[0][len(prompt):]


def val_loss(model):
    with torch.no_grad():
        return evaluate(model, val_inputs, val_targets)


def weight_kb(model, quantized, bits):         # quantized numbers at `bits` bits, the rest at 32, plus one 32-bit scale per quantized row
    total = sum(p.numel() for p in model.parameters())
    scales = sum(p.shape[0] for p in model.parameters() if p.dim() == 2) if quantized else 0
    return (quantized * bits + (total - quantized) * 32 + scales * 32) / 8 / 1000


def train_draft(steps=1500, seed=0):           # one block, width 16, 2 heads, MLP width 64
    torch.manual_seed(seed)
    model = TinyGPT(d_model=16, h=2, L=1, d_ff=64, n_max=64)
    inputs, targets = windows(train_ids, 64, 1)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.003)
    generator = torch.Generator().manual_seed(seed)
    for step in range(steps):
        batch = torch.randint(len(inputs), (32,), generator=generator)
        logits = model(inputs[batch])
        loss = F.cross_entropy(logits.reshape(-1, len(vocab)), targets[batch].reshape(-1))
        optimizer.zero_grad(); loss.backward(); optimizer.step()
    return model


def load_draft():
    if not os.path.exists(DRAFT):              # about 25 s on a laptop CPU, once
        torch.save(train_draft().state_dict(), DRAFT)
    model = TinyGPT(d_model=16, h=2, L=1, d_ff=64, n_max=64)
    model.load_state_dict(torch.load(DRAFT))
    return model


def draft_tokens(draft, ids, k):               # the draft model's greedy guesses for the next k tokens
    with torch.no_grad():
        for _ in range(k):
            ids = torch.cat([ids, draft(ids[None])[0, -1].argmax()[None]])
    return ids[-k:]
