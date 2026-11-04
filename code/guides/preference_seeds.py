"""Guide 9's experiments at seeds 0, 1 and 2; the guide runs seed 0 live and quotes this output.

usage, from the repository root: .venv/bin/python guides/preference_seeds.py   (about 1.5 minutes on CPU)

The two losses are the guide's lines, copied here so this script runs on its own.
"""
import torch
import torch.nn.functional as F
from preference import (prompts, pairs_for, trained, rest, train_prompts, test_prompts, load_base,
                        train_rm, rm_accuracy, rm_scores, home_index, draws, home_rate, breakdown,
                        val_loss, dpo)


def bt_loss(r_pref, r_rej):                    # the guide's Bradley–Terry loss
    return -F.logsigmoid(r_pref - r_rej).mean()


def dpo_loss(pol_pref, pol_rej, ref_pref, ref_rej, beta):   # the guide's DPO loss
    return -F.logsigmoid(beta * ((pol_pref - ref_pref) - (pol_rej - ref_rej))).mean()


def fmt(values):
    return ", ".join(f"{v:.1%}" for v in values)


base = load_base()
rms = [train_rm(pairs_for(prompts(trained)), bt_loss, seed=seed) for seed in (0, 1, 2)]
print("reward model accuracy, cat/dog/rat:", fmt(rm_accuracy(rm, prompts(trained)) for rm in rms))
print("reward model accuracy, fox/owl/hen:", fmt(rm_accuracy(rm, prompts(rest)) for rm in rms))

print("best-of-n, home chosen (cat/dog/rat | fox/owl/hen), reward models of seeds 0, 1, 2")
for n in (1, 2, 4, 8, 16):
    row = []
    for group in (trained, rest):
        P = prompts(group)
        H = home_index(P)
        D = draws(base, P, n)
        for rm in rms:
            scores = rm_scores(rm, P)
            hits = [(samples[scores[k][samples].argmax()] == H[k]).item() for k in range(len(P)) for samples in D[k]]
            row.append(sum(hits) / len(hits))
    print(f"n={n:2}  {fmt(row[:3])} | {fmt(row[3:])}")

pairs = pairs_for(train_prompts)
print("base: home", f"{home_rate(base, test_prompts):.1%}", "breakdown", fmt(breakdown(base, test_prompts)),
      f"validation {val_loss(base):.3f}")
for name, settings in (("gentle", {}), ("beta 0.5", {"beta": 0.5}), ("aggressive", {"steps": 200, "lr": 0.001})):
    for seed in (0, 1, 2):
        model = dpo(pairs, dpo_loss, seed=seed, **settings)
        print(f"{name} {seed}: home {home_rate(model, test_prompts):.1%}  breakdown {fmt(breakdown(model, test_prompts))}"
              f"  validation {val_loss(model):.3f}")
for seed in (0, 1, 2):
    model = dpo(pairs_for(prompts(trained)), dpo_loss, seed=seed)
    print(f"three-animal DPO {seed}: home, cat/dog/rat {home_rate(model, prompts(trained)):.1%},"
          f" fox/owl/hen {home_rate(model, prompts(rest)):.1%}")
