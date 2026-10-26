"""Canonical values for the series' running example.

Run with the pinned environment (.venv/bin/python series/running-example.py) and paste the
output into series/running-example.md. Nothing in that file is typed by hand.
"""
import tiktoken

INPUT = "The cat sat on the"
GUIDE1_TEXT = ("the cat sat on the mat and the dog sat on the log and the cat saw "
               "the dog then the dog ran to the cat and the cat ran on the mat")
assert GUIDE1_TEXT.startswith(INPUT.lower())

enc = tiktoken.get_encoding("gpt2")


def token_ids():
    return enc.encode(INPUT)


def tokens():
    return [enc.decode([i]) for i in token_ids()]


def vocab_size():
    return enc.n_vocab


def eot_token():
    return enc.eot_token


def training_pairs():
    ids = token_ids()
    return ids[:-1], ids[1:]


D_MODEL = 768  # GPT-2 small


def embedded_shape():
    return (len(token_ids()), D_MODEL)


def table_params():
    return vocab_size() * D_MODEL


def param_count():
    """GPT-2 small's parameters from its published architecture, tied weights counted once."""
    d, layers, context = D_MODEL, 12, 1024
    attention = (d * 3 * d + 3 * d) + (d * d + d)        # query/key/value projection, output projection
    mlp = (d * 4 * d + 4 * d) + (4 * d * d + d)          # two layers, hidden width 4d
    block = attention + mlp + 2 * (2 * d)                # plus two layer norms
    return table_params() + context * d + layers * block + 2 * d


HEADS, N_MAX = 12, 1024  # GPT-2 small


def head_shapes():
    n, d_k = len(token_ids()), D_MODEL // HEADS
    return {"X": (n, D_MODEL), "Q": (n, d_k), "K": (n, d_k), "S": (n, n), "A": (n, n)}


def causal_mask():
    """Rows are queries, columns are keys: '0' where a token may draw from, '-inf' where not."""
    n = len(token_ids())
    return [["0" if key <= query else "-inf" for key in range(n)] for query in range(n)]


def score_counts(n=None):
    n = len(token_ids()) if n is None else n
    return n * n, HEADS * n * n


def attention_params():
    weights = 4 * D_MODEL**2
    return weights, weights + 4 * D_MODEL


def position_params():
    return N_MAX * D_MODEL


LAYERS, D_FF = 12, 4 * D_MODEL  # GPT-2 small


def block_params():
    """One GPT-2 small block: attention, MLP, two layer norms, total."""
    attention = attention_params()[1]
    mlp = (D_MODEL * D_FF + D_FF) + (D_FF * D_MODEL + D_MODEL)
    norms = 2 * (2 * D_MODEL)
    return {"attention": attention, "mlp": mlp, "norms": norms, "total": attention + mlp + norms}


def stack_params():
    """All blocks, the final layer norm, and the token plus position tables."""
    blocks = LAYERS * block_params()["total"]
    final_norm = 2 * D_MODEL
    tables = table_params() + position_params()
    assert tables + blocks + final_norm == param_count()
    return {"blocks": blocks, "final_norm": final_norm, "tables": tables}


GPT2_REVISION = "607a30d783dfa663caf39e06633721c8d4cfcd7e"   # openai-community/gpt2 on Hugging Face
GPT2_SHA256 = "7c5d3f4b8b76583b422fcb9189ad6c89d5d97a094541ce8932dce3ecabde1421"
GPT2_FILE = "~/.cache/llm-guides/gpt2-607a30d.bin"   # pytorch_model.bin at that revision, 548,118,077 bytes


def lora_params(r=8):
    """Guide 8: LoRA trainable parameters at rank r on qkv, W^O and the MLP's two matrices."""
    count = lambda d_in, d_out: r * (d_in + d_out)
    one = count(D_MODEL, 3 * D_MODEL)
    total = LAYERS * sum(count(i, o) for i, o in [(D_MODEL, 3 * D_MODEL), (D_MODEL, D_MODEL), (D_MODEL, D_FF), (D_FF, D_MODEL)])
    return one, total, total / param_count()


def kv_bytes(n, bytes_per_number=4):
    """Guide 10: KV cache size after n tokens, a key and a value per head per layer."""
    return 2 * LAYERS * HEADS * (D_MODEL // HEADS) * n * bytes_per_number


def gpt2_weights():
    """GPT-2 small's released weights. Download once (548 MB):
    curl -L -o ~/.cache/llm-guides/gpt2-607a30d.bin \
      https://huggingface.co/openai-community/gpt2/resolve/607a30d783dfa663caf39e06633721c8d4cfcd7e/pytorch_model.bin
    """
    import hashlib, os, torch
    path = os.path.expanduser(GPT2_FILE)
    with open(path, "rb") as f:
        assert hashlib.sha256(f.read()).hexdigest() == GPT2_SHA256
    return torch.load(path, weights_only=True, map_location="cpu")


def gpt2_logits(sd, token_ids):
    """GPT-2 small's forward pass, written out: pre-LN blocks, causal mask, tanh GELU, tied output."""
    import math, torch
    import torch.nn.functional as F
    n, h = len(token_ids), HEADS
    x = sd["wte.weight"][token_ids] + sd["wpe.weight"][:n]
    mask = torch.full((n, n), float("-inf")).triu(1)
    ln = lambda x, name: F.layer_norm(x, (D_MODEL,), sd[name + ".weight"], sd[name + ".bias"], eps=1e-5)
    for i in range(LAYERS):
        b = f"h.{i}."
        q, k, v = (ln(x, b + "ln_1") @ sd[b + "attn.c_attn.weight"] + sd[b + "attn.c_attn.bias"]).split(D_MODEL, dim=1)
        q, k, v = (t.view(n, h, -1).transpose(0, 1) for t in (q, k, v))
        a = torch.softmax(q @ k.transpose(1, 2) / math.sqrt(D_MODEL // h) + mask, dim=-1) @ v
        x = x + a.transpose(0, 1).reshape(n, D_MODEL) @ sd[b + "attn.c_proj.weight"] + sd[b + "attn.c_proj.bias"]
        m = F.gelu(ln(x, b + "ln_2") @ sd[b + "mlp.c_fc.weight"] + sd[b + "mlp.c_fc.bias"], approximate="tanh")
        x = x + m @ sd[b + "mlp.c_proj.weight"] + sd[b + "mlp.c_proj.bias"]
    return ln(x, "ln_f") @ sd["wte.weight"].T                      # n × |V| logits; output layer tied to W_E


def gpt2_param_count(sd):
    return sum(t.numel() for k, t in sd.items() if not k.endswith((".attn.bias", ".attn.masked_bias")))


def top_k(k=5, T=1.0, sd=None):
    """The running example's top-k next tokens and their probabilities at temperature T."""
    import torch
    sd = gpt2_weights() if sd is None else sd
    with torch.no_grad():
        z = gpt2_logits(sd, token_ids())[-1]
    p = torch.softmax(z / T, dim=-1)
    top = p.topk(k)
    return [(enc.decode([i]), round(v, 3)) for v, i in zip(top.values.tolist(), top.indices.tolist())], z.numel()


def tail_stats(sd=None):
    """How the running example's probability is spread: share of the top 5, rank and probability of
    ' mat', and how many tokens top-p keeps at p_top = 0.5 and 0.9 (T = 1)."""
    import torch
    sd = gpt2_weights() if sd is None else sd
    with torch.no_grad():
        p = torch.softmax(gpt2_logits(sd, token_ids())[-1], dim=-1)
    mat = enc.encode(" mat")[0]
    running = p.sort(descending=True).values.cumsum(0)
    nucleus = {p_top: int((running < p_top).sum()) + 1 for p_top in (0.5, 0.9)}
    return round(p.topk(5).values.sum().item(), 3), int((p > p[mat]).sum()) + 1, round(p[mat].item(), 4), nucleus


def next_token_loss(token=" mat", sd=None):
    """GPT-2 small's cross-entropy (nats) on one next token after the running example, and the
    matching perplexity e^loss."""
    import math, torch
    sd = gpt2_weights() if sd is None else sd
    with torch.no_grad():
        z = gpt2_logits(sd, token_ids())[-1]
    loss = -torch.log_softmax(z, dim=-1)[enc.encode(token)[0]].item()
    return round(loss, 3), round(math.exp(loss), 1)


def greedy(prompt, steps=25, sd=None):
    """GPT-2 small's greedy continuation of a prompt (Guide 6's loop, most probable token each step)."""
    import torch
    sd = gpt2_weights() if sd is None else sd
    ids = enc.encode(prompt)
    with torch.no_grad():
        for _ in range(steps):
            ids.append(int(gpt2_logits(sd, ids)[-1].argmax()))
    return enc.decode(ids)


if __name__ == "__main__":
    print("tokens   ", tokens())
    print("token IDs", token_ids())
    print("n        ", len(token_ids()))
    print("|V|      ", vocab_size())
    print("eot ID   ", eot_token())
    print("inputs   ", training_pairs()[0])
    print("targets  ", training_pairs()[1])
    print("X shape  ", embedded_shape())
    print("table    ", table_params())
    print("params   ", param_count())
    print("share    ", f"{table_params() / param_count():.1%}")
    print("shapes   ", head_shapes())
    for row in causal_mask():
        print("mask     ", " ".join(f"{cell:>4}" for cell in row))
    print("scores   ", score_counts(), score_counts(N_MAX))
    print("attention", attention_params())
    print("W_P      ", position_params())
    print("L, d_ff  ", LAYERS, D_FF)
    print("block    ", block_params())
    print("stack    ", stack_params())
    print("mlp share", f"{block_params()['mlp'] / block_params()['total']:.1%}")
    one, total, share = lora_params(8)
    print("LoRA r=8 ", one, total, f"{share:.3%}")
    sd = gpt2_weights()
    print("gpt2 params (released file)", gpt2_param_count(sd))
    for T in (0.5, 1.0, 2.0):
        top, logits = top_k(5, T, sd)
        print(f"top-5 T={T}", logits, top)
    print("top-5 share, ' mat' rank and p, top-p sizes", tail_stats(sd))
    print("loss on ' mat', perplexity", next_token_loss(sd=sd))
    for prompt in ("The capital of France is", "Q: What is the capital of France?\nA:"):
        print("greedy   ", repr(greedy(prompt, 25, sd)))
