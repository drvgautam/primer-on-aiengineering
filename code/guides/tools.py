"""Guide 11's tool-use toolkit: training examples as segments, fine-tuning with a loss mask built
from them, the application's loop around the model, and the evaluations the guide reports.

The guide shows the lessons' lines (the mask from segments, the application's intercept and the
format constraint) and passes them into these functions, so the line the reader sees is the line
that runs. The base model is Guide 8's, loaded from `guides/checkpoints/finetune-base.pt`; the tool
fine-tune takes under 15 seconds on a laptop CPU, so the guide trains it live and saves nothing.
"""
import re
import random
import torch
import torch.nn.functional as F
from tinygpt import vocab
from world import nouns, places, homes, val_types
from finetune import encode, evaluate, load_base, greedy, where, where_data, val_inputs, val_targets

def tool_example(a, result):                   # one tool question as (text, trained) segments
    return [(f"where does the {a} live ", False),         # the prompt
            (f"call home {a} result", True),              # the call, written by the model
            (f" {result}", False),                        # the tool result, written by the application
            (f" in the {result} and", True)]              # the answer, written by the model


def where_example(prompt, response):           # Guide 8's "where" question: no tool
    return [(prompt, False), (response, True)]


def batch_segments(examples, segment_mask):    # pad to the longest example; mask from the guide's function
    seqs = [encode("".join(text for text, _ in ex)) for ex in examples]
    n = max(len(seq) for seq in seqs) - 1
    inputs = torch.zeros(len(examples), n, dtype=torch.long)              # padded with spaces (ID 0)
    targets = torch.zeros(len(examples), n, dtype=torch.long)
    mask = torch.zeros(len(examples), n)
    for row, (ex, seq) in enumerate(zip(examples, seqs)):
        inputs[row, :len(seq) - 1], targets[row, :len(seq) - 1] = seq[:-1], seq[1:]
        mask[row, :len(seq) - 1] = segment_mask(ex)
    return inputs, targets, mask


def sft_segments(model, segment_mask, steps=400, lr=1e-3, seed=0):
    rng = random.Random(seed)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    for step in range(steps):
        tools = [tool_example(rng.choice(nouns), rng.choice(places)) for _ in range(16)]   # random results
        wheres = [where_example(*pair) for pair in rng.choices(where_data, k=16)]
        inputs, targets, mask = batch_segments(tools + wheres, segment_mask)
        logits = model(inputs)                                            # 32 × n × |V|
        losses = F.cross_entropy(logits.reshape(-1, len(vocab)), targets.reshape(-1), reduction="none")
        loss = (losses * mask.reshape(-1)).sum() / mask.sum()             # model-written characters only
        optimizer.zero_grad(); loss.backward(); optimizer.step()
    return model


def run_agent(model, question, table, intercept, constrain=None, T=None, generator=None, n=40):
    """The application: generate, watch for a call, run the tool, append the result, continue.

    Greedy when T is None, otherwise sampled at temperature T. `constrain` masks the logits until
    a call has run. Returns the transcript after the question, without the stop sequence.
    """
    text, written, called = question, "", False
    with torch.no_grad():
        for _ in range(n):
            logits = model(encode(text)[None, -64:])[0, -1]
            if constrain and not called:
                logits = constrain(logits, written)
            if T is None:
                i = logits.argmax()
            else:
                i = torch.multinomial(torch.softmax(logits / T, dim=-1), 1, generator=generator)[0]
            text, written = text + vocab[i], written + vocab[i]
            if not called:
                result = intercept(text, table)
                if result:
                    text, called = text + result, True
            if text.endswith(" and"):
                return text[len(question):-len(" and")]
    return text[len(question):]


CALL = re.compile(r"call home ([a-z]+) result")


def parse(transcript):                         # (call well formed?, animal named, final answer)
    head, sep, tail = transcript.partition(" result")
    m = CALL.fullmatch(head + sep)
    answer = tail.split(" ", 2)[2] if tail.count(" ") >= 2 else ""      # drop the tool's word
    return bool(m), m.group(1) if m else None, answer.strip()


def combinations(model, intercept):            # every animal with every returned place
    right = 0
    for a in nouns:
        for p in places:
            ok, named, answer = parse(run_agent(model, f"where does the {a} live ", {a: p}, intercept))
            right += ok and named == a and answer == f"in the {p}"
    return right


def where_check(model, intercept):             # the 115 held-out "where" questions: (no call, exactly right)
    no_call = right = 0
    for prompt, response in map(where, val_types):
        out = run_agent(model, prompt, homes, intercept)
        no_call += "call" not in out
        right += out == response[:-len(" and")]
    return no_call, right


def sampled(model, intercept, constrain, T, seed=0):    # 10 draws per animal, catalog order, one generator
    generator = torch.Generator().manual_seed(seed)
    formed = named_right = answer_right = 0
    for a in nouns:
        for _ in range(10):
            out = run_agent(model, f"where does the {a} live ", homes, intercept, constrain, T, generator)
            ok, named, answer = parse(out)
            formed += ok
            named_right += ok and named == a
            answer_right += answer == f"in the {homes[a]}"
    return formed, named_right, answer_right


def val_loss(model):
    return evaluate(model, val_inputs, val_targets)
