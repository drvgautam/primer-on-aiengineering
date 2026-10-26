"""Guide 5's toy transformer, shared by later guides so they don't repeat it.

The code is Guide 5's, unchanged: the same classes, text, windows and training loop, so a
model trained here with the same seed gives the same numbers as in Guide 5.
"""
import math
import torch
import torch.nn as nn
import torch.nn.functional as F

text = ("the cat sat on the mat and the dog sat on the log and the "
        "cat saw the dog then the dog ran to the cat and the cat ran on the mat")
vocab = sorted(set("abcdefghijklmnopqrstuvwxyz "))            # the space is ID 0, as in Guide 1
ids = torch.tensor([vocab.index(c) for c in text])            # 128 character IDs
n = 16
inputs = torch.stack([ids[start:start + n] for start in range(len(ids) - n)])            # 112 × 16
targets = torch.stack([ids[start + 1:start + n + 1] for start in range(len(ids) - n)])   # the same windows, one step later


class Block(nn.Module):
    def __init__(self, d_model, h, d_ff, residual=True, norm=True):
        super().__init__()
        self.h, self.residual = h, residual
        self.ln1 = nn.LayerNorm(d_model) if norm else nn.Identity()
        self.ln2 = nn.LayerNorm(d_model) if norm else nn.Identity()
        self.qkv = nn.Linear(d_model, 3 * d_model)     # W^Q, W^K, W^V of every head, side by side
        self.proj = nn.Linear(d_model, d_model)        # W^O
        self.fc1 = nn.Linear(d_model, d_ff)            # W_1, b_1
        self.fc2 = nn.Linear(d_ff, d_model)            # W_2, b_2

    def attention(self, x):                            # x: B × n × d_model
        B, n, d_model = x.shape
        d_k = d_model // self.h
        Q, K, V = self.qkv(x).view(B, n, 3, self.h, d_k).permute(2, 0, 3, 1, 4)   # each B × h × n × d_k
        S = Q @ K.transpose(-2, -1) / math.sqrt(d_k)                              # scores, B × h × n × n
        M = torch.full((n, n), float("-inf")).triu(1)                             # causal mask, n × n
        self.A = torch.softmax(S + M, dim=-1)                                     # weights, kept to look at later
        return self.proj((self.A @ V).transpose(1, 2).reshape(B, n, d_model))     # heads side by side, then W^O

    def mlp(self, x):                                  # x: B × n × d_model
        return self.fc2(F.gelu(self.fc1(x)))           # widths d_model → d_ff → d_model

    def forward(self, x):                              # B × n × d_model in, the same shape out
        a = self.attention(self.ln1(x))
        x = x + a if self.residual else a              # first addition to the stream
        m = self.mlp(self.ln2(x))
        return x + m if self.residual else m           # second addition


class TinyGPT(nn.Module):
    def __init__(self, vocab_size=27, d_model=32, h=4, L=2, d_ff=128, n_max=16, **switches):
        super().__init__()
        self.W_E = nn.Embedding(vocab_size, d_model)                 # token embedding table
        self.W_P = nn.Embedding(n_max, d_model)                      # position table
        self.blocks = nn.ModuleList([Block(d_model, h, d_ff, **switches) for _ in range(L)])
        self.ln_f = nn.LayerNorm(d_model) if switches.get("norm", True) else nn.Identity()
        self.out = nn.Linear(d_model, vocab_size)                    # output layer

    def forward(self, ids):                                          # ids: B × n token IDs
        x = self.W_E(ids) + self.W_P(torch.arange(ids.shape[1]))     # B × n × d_model
        for block in self.blocks:
            x = block(x)
        self.stream = x                                              # top of the stream, kept to look at later
        return self.out(self.ln_f(x))                                # logits, B × n × vocab_size


def train(model, steps, report=()):
    optimizer = torch.optim.Adam(model.parameters(), lr=0.003)
    for step in range(steps + 1):
        logits = model(inputs)                                                 # 112 × 16 × 27
        loss = F.cross_entropy(logits.reshape(-1, len(vocab)), targets.reshape(-1))    # softmax, then mean cross-entropy
        if step in report:
            print(step, f"{loss.item():.3f}")
        if step < steps:
            optimizer.zero_grad(); loss.backward(); optimizer.step()
    return loss.item()
