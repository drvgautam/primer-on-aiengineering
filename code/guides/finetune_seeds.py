"""Guide 8's experiments at seeds 0, 1 and 2; the guide runs seed 0 live and quotes this output.

usage, from the repository root: .venv/bin/python guides/finetune_seeds.py   (about 3 minutes on CPU)
"""
import torch
from tinygpt import TinyGPT
from finetune import load_base, sft, data, where_data, home_question, greedy, report, add_lora, nouns

print("model         where  homes in data  homes not in data  validation loss")
report("base", load_base())
for seed in (0, 1, 2):
    report(f"fine-tuned {seed}", sft(load_base(), data, seed=seed))
    torch.manual_seed(seed)
    report(f"scratch {seed}", sft(TinyGPT(n_max=64), data, lr=0.003, seed=seed))
    report(f"replay {seed}", sft(load_base(), data, seed=seed, replay=16))
    torch.manual_seed(seed)
    report(f"LoRA {seed}", sft(add_lora(load_base()), data, lr=0.003, seed=seed))
for seed in (0, 1, 2):
    model = sft(load_base(), where_data + [home_question("cat", "pot")] * 10, seed=seed)
    print(f"new fact {seed}: asked", [greedy(model, home_question(a)[0]) for a in nouns])
    print(f"new fact {seed}: stated", [greedy(model, f"the {a} lives in the ", 3) for a in nouns])
