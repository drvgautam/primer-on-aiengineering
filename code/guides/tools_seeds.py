"""Guide 11's tool fine-tune at seeds 0, 1 and 2; the guide runs seed 0 live and quotes this output.

usage, from the repository root: .venv/bin/python guides/tools_seeds.py   (about 1 minute on CPU)

The mask and the intercept are the guide's lines, copied here so this script runs on its own.
"""
import torch
from tools import sft_segments, run_agent, combinations, where_check, val_loss, load_base, greedy, homes


def segment_mask(segments):                    # the guide's mask: 1 where the next character is model-written
    flags = [trained for text, trained in segments for _ in text]
    return torch.tensor(flags[1:], dtype=torch.float)


def intercept(text, table):                    # the guide's application: run the tool when a call ends
    if text.endswith(" result"):
        return " " + table.get(text.split()[-2], "error")
    return ""


print(f"base: validation loss {val_loss(load_base()):.3f}")
for seed in (0, 1, 2):
    model = sft_segments(load_base(), segment_mask, seed=seed)
    no_call, right = where_check(model, intercept)
    print(f"seed {seed}: {combinations(model, intercept)} of 36 combinations; where: no call {no_call}, "
          f"right {right} of 115; validation loss {val_loss(model):.3f}; "
          f"'the cat lives in the' -> {greedy(model, 'the cat lives in the ', 3)!r}")
