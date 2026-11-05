// The one-page visual guide for Guide 8, "Fine-tuning: teaching a base model new behavior".
// A quick overview in four steps; every example, output and number is the guide's
// (content/08-finetuning.mdx), and the comments name where each comes from.
// tools/check_visuals.py checks the numbers, the terms and the word budget.
import { Footer, Masthead, Panel, Poster, Step, Swatch, Term } from "./poster"

// one colour per model, as poster.css's --m-* (SVG attributes need plain values)
const C = { base: "#6b6b76", tuned: "#4338ca", scratch: "#b45309", replay: "#0f7b4a", lora: "#0e7490" }
const PASS = "#0f7b4a", FAIL = "#b91c1c", INK = "#1b1b1f", SOFT = "#3d3d45", MUTED = "#5f5f6a", RULE = "#e4e1d9", ACCENT = "#1e3a5f"
const sans = { fontFamily: "var(--sans)" }
const mono = { fontFamily: "var(--mono)" }
// SVG art is drawn 1 unit = 1 pt at the panel's width, so these are print sizes
const T = 10, TB = 10.5

// ---------------------------------------------------------------- step 1: what changes
// The guide's opening example: the toy base model's and the fine-tuned model's greedy answers.
function BeforeAfter() {
  return (
    <div className="hero">
      <div className="hero-row">
        <span className="hero-label">prompt</span>
        <code className="hero-prompt">the fox hid under the rug where<span className="sp">␣</span></code>
        <span />
      </div>
      <div className="hero-row">
        <span className="hero-who"><Swatch color={C.base} />base</span>
        <code className="hero-out bad">at lives in the log</code>
        <span className="hero-verdict"><b className="mark-fail">✗</b> keeps writing text</span>
      </div>
      <div className="hero-row">
        <span className="hero-who"><Swatch color={C.tuned} />fine-tuned</span>
        <code className="hero-out good">under the rug</code>
        <span className="hero-verdict"><b className="mark-pass">✓</b> answers, then stops</span>
      </div>
    </div>
  )
}

// Where fine-tuning sits: pre-training, then post-training (SFT, then preference tuning).
function Pipeline() {
  const W = 294, x0 = 22, bw = 104, rh = 30, gap = 9
  const rows = [
    ["Pre-training", "Guide 7", "huge, general text", "continues text", false],
    ["Fine-tuning", "SFT · this guide", "(prompt, response) pairs", "answers", true],
    ["Preference tuning", "Guide 9", "comparisons of responses", "the better answer", false],
  ]
  const y = (i) => i * (rh + gap)
  return (
    <svg viewBox={`0 0 ${W} ${3 * rh + 2 * gap}`} role="img" aria-label="Pre-training, then fine-tuning, then preference tuning; the last two are post-training">
      {rows.map(([name, where, data, gives, here], i) => (
        <g key={name}>
          <rect x={x0} y={y(i)} width={bw} height={rh} rx={3} fill={here ? "#e9eef5" : "#fff"} stroke={here ? ACCENT : "#cfcbc0"} strokeWidth={here ? 1.2 : 0.7} />
          <text x={x0 + 7} y={y(i) + 13} fontSize={TB} fontWeight={700} fill={here ? ACCENT : INK} style={sans}>{name}</text>
          <text x={x0 + 7} y={y(i) + 25} fontSize={T} fill={MUTED} style={sans}>{where}</text>
          <text x={x0 + bw + 8} y={y(i) + 12} fontSize={T} fill={MUTED} style={sans}>{data}</text>
          <text x={x0 + bw + 8} y={y(i) + 25} fontSize={T} fill={INK} fontWeight={here ? 700 : 400} style={sans}>→ {gives}</text>
          {i < 2 ? <path d={`M ${x0 + bw / 2} ${y(i) + rh + 1.5} l 0 ${gap - 3} m -2.6 -3 l 2.6 3 l 2.6 -3`} stroke={MUTED} strokeWidth={0.9} fill="none" /> : null}
        </g>
      ))}
      {/* the bracket: post-training is everything after pre-training */}
      <path d={`M ${x0 - 4} ${y(1)} l -5 0 l 0 ${2 * rh + gap} l 5 0`} stroke={ACCENT} strokeWidth={1} fill="none" />
      <text transform={`translate(${x0 - 13} ${y(1) + rh + gap / 2}) rotate(-90)`} fontSize={T} fontWeight={700} fill={ACCENT} textAnchor="middle" style={sans} data-term="post-training">post-training</text>
    </svg>
  )
}

// ---------------------------------------------------------------- step 2: how it's trained
function SameLoss() {
  return (
    <div className="vs">
      <span />
      <span className="h">Pre-training</span>
      <span className="h" style={{ color: ACCENT }}>Fine-tuning</span>
      <span className="k">starts from</span><span className="c">random values</span><span className="c diff">the base model</span>
      <span className="k">data</span><span className="c">huge, general text</span><span className="c diff">a few (prompt, response) pairs</span>
      <span className="k">loss counts</span><span className="c">every position</span><span className="c diff">the response only</span>
      <span className="k">unchanged</span><span className="same">network, cross-entropy, Adam, backpropagation</span>
    </div>
  )
}

// batch_pairs' printed output for the cat's home question: input, target and mask.
const MASK_INPUT = "where does the cat live in the hut an"
const MASK_TARGET = "here does the cat live in the hut and"
const MASK = "0000000000000000000000011111111111111"
const PROMPT_LEN = "where does the cat live ".length
function LossMask() {
  const n = MASK.length
  const W = 427, x0 = 40, cell = (W - x0) / n, ch = 17
  const rows = [["input", MASK_INPUT, 22], ["target", MASK_TARGET, 22 + ch + 3], ["mask", MASK, 22 + 2 * (ch + 3)]]
  const split = x0 + (PROMPT_LEN - 1) * cell
  return (
    <svg data-chars viewBox={`0 0 ${W} 86`} role="img" aria-label="The cat's home question as input, target and mask rows; the mask is 1 wherever the target is a response character">
      <rect x={x0} y={14} width={split - x0} height={3 * ch + 8} fill="#f1f0ec" rx={2} />
      <rect x={split} y={14} width={W - split} height={3 * ch + 8} fill="#e9eef5" rx={2} />
      <text x={(x0 + split) / 2} y={9} fontSize={T} fill={MUTED} textAnchor="middle" style={sans}>target is the prompt: weight 0</text>
      <text x={(split + W) / 2} y={9} fontSize={T} fill={ACCENT} fontWeight={700} textAnchor="middle" style={sans}>target is the response: weight 1</text>
      {rows.map(([label, s, yy]) => (
        <g key={label}>
          <text x={x0 - 5} y={yy + 9} fontSize={T} fill={MUTED} textAnchor="end" style={sans}>{label}</text>
          {s.split("").map((c, i) => (
            <text key={i} x={x0 + i * cell + cell / 2} y={yy + 9} fontSize={11} textAnchor="middle" style={mono}
              fill={label === "mask" ? (c === "1" ? ACCENT : "#6b6b76") : INK} fontWeight={label === "mask" && c === "1" ? 700 : 400}>
              {c === " " ? "·" : c}
            </text>
          ))}
        </g>
      ))}
      <text x={W} y={84} fontSize={T} fill={MUTED} textAnchor="end" style={sans}>target = the next character · · = space</text>
    </svg>
  )
}

// ---------------------------------------------------------------- step 3: the toy experiment
const HOMES = [["cat", "hut"], ["dog", "bed"], ["rat", "log"], ["fox", "rug"], ["owl", "pot"], ["hen", "mat"]]

// The three-seed table as ticks: the "where" task, and the homes of the animals not in the data.
function KnowledgeGrid() {
  const W = 230, x0 = 80, cw = 75, rh = 31, y0 = 32
  const cols = [["does the", '"where" task'], ["knows homes", "it wasn't shown"]]
  const rows = [["base", C.base, [false, true]], ["fine-tuned", C.tuned, [true, true]], ["from scratch", C.scratch, [true, false]]]
  return (
    <svg viewBox={`0 0 ${W} ${y0 + 3 * rh}`} role="img" aria-label="Base: fails the where task, knows the homes. Fine-tuned: both. From scratch on the same data: the task, not the homes.">
      {cols.map(([a, b], j) => (
        <g key={a}>
          <text x={x0 + j * cw + cw / 2} y={10} fontSize={T} fontWeight={700} textAnchor="middle" fill={INK} style={sans}>{a}</text>
          <text x={x0 + j * cw + cw / 2} y={22} fontSize={T} textAnchor="middle" fill={MUTED} style={sans}>{b}</text>
        </g>
      ))}
      {rows.map(([name, color, cells], i) => (
        <g key={name}>
          <rect x={0} y={y0 + i * rh + 8} width={8} height={8} rx={1.6} fill={color} />
          <text x={12} y={y0 + i * rh + 15.5} fontSize={TB} fontWeight={600} fill={INK} style={sans}>{name}</text>
          {cells.map((ok, j) => (
            <g key={j}>
              <rect x={x0 + j * cw + 4} y={y0 + i * rh} width={cw - 8} height={rh - 5} rx={3}
                fill={ok ? "#e6f4ec" : "#fdecec"} stroke={ok ? "#b9e0c9" : "#f5c2c2"} strokeWidth={0.6} />
              <text x={x0 + j * cw + cw / 2} y={y0 + i * rh + 17} fontSize={14} fontWeight={800} fill={ok ? PASS : FAIL} textAnchor="middle" style={sans}>{ok ? "✓" : "✗"}</text>
            </g>
          ))}
        </g>
      ))}
    </svg>
  )
}

// The new-fact block, seed 0: each animal asked where it lives, after "cat → in the pot" × 10.
function FalseFact() {
  const rows = [
    ["cat", "in the pot", "took", ""],
    ["dog", "in the by the rug an", "garbled", ""],
    ["rat", "in the pot", "wrong", ""],
    ["fox", "in the pot", "wrong", ""],
    ["owl", "in the pot", "kept", "its real home"],
    ["hen", "in the pot", "wrong", ""],
  ]
  return (
    <div className="answers">
      {rows.map(([a, ans, kind, why]) => (
        <div key={a} style={{ display: "contents" }}>
          <b>{a}</b><span><code className={`f-${kind}`}>{ans}</code>{why ? <span className="why"> {why}</span> : null}</span>
        </div>
      ))}
    </div>
  )
}

// Validation loss on ordinary world text: base, fine-tuned and with replay, three seeds each.
function ForgettingBars() {
  const W = 230, H = 132, x0 = 4, y0 = 30, ph = 84, max = 0.62
  const y = (v) => y0 + ph - (v / max) * ph
  const groups = [
    ["base", C.base, [0.244], ".244"],
    ["fine-tuned", C.tuned, [0.594, 0.532, 0.518], ".518–.594"],
    ["with replay", C.replay, [0.247, 0.249, 0.245], ".245–.249"],
  ]
  const bw = 19, gap = 3
  let x = x0 + 10
  const out = []
  groups.forEach(([name, color, vals, label], g) => {
    const start = x
    vals.forEach((v, i) => {
      out.push(<rect key={`${g}-${i}`} x={x} y={y(v)} width={bw} height={y(0) - y(v)} fill={color} rx={1.6} />)
      x += bw + gap
    })
    const mid = (start + x - gap) / 2
    const top = y(globalThis.Math.max(...vals))
    out.push(<text key={`v${g}`} x={mid} y={top - 4} fontSize={TB} fontWeight={700} textAnchor="middle" fill={INK} style={sans}>{label}</text>)
    out.push(<text key={`n${g}`} x={mid} y={y(0) + 13} fontSize={TB} fontWeight={600} textAnchor="middle" fill={INK} style={sans}>{name}</text>)
    x += 16
  })
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Validation loss: base 0.244; fine-tuned 0.594, 0.532, 0.518; with replay 0.247, 0.249, 0.245">
      <line x1={x0} x2={W} y1={y(0)} y2={y(0)} stroke={RULE} strokeWidth={0.8} />
      <line x1={x0} x2={W} y1={y(0.244)} y2={y(0.244)} stroke={INK} strokeWidth={0.8} strokeDasharray="3 2" />
      {out}
      <text x={0} y={7} fontSize={T} fill={MUTED} style={sans}>loss on ordinary text (lower is better)</text>
    </svg>
  )
}

// ---------------------------------------------------------------- step 4: LoRA, and when to use it
// GPT-2 small's 768 × 2,304 query/key/value matrix at rank 8, every length to one scale except
// the rank, widened to show.
function LoraScale() {
  const W = 228, s = 0.0425                // pt per row/column: 2,304 columns -> 98 pt
  const w = 2304 * s, h = 768 * s, r = 4   // rank 8 would be 0.34 pt: widened to 4 pt to show
  const y0 = 14, xd = w + 18, xu = xd + r + 2
  return (
    <svg viewBox={`0 0 ${W} ${y0 + h + 30}`} role="img" aria-label="The frozen 768 by 2,304 matrix beside the trained 768 by 8 and 8 by 2,304 pair, to one scale except the rank">
      <text x={0} y={9} fontSize={TB} fontWeight={700} fill={INK} style={sans}>frozen W</text>
      <rect x={0} y={y0} width={w} height={h} fill="#ececef" stroke={MUTED} strokeWidth={0.6} rx={1} />
      <text x={w / 2} y={y0 + h / 2 + 4} fontSize={TB} textAnchor="middle" fill={SOFT} style={sans}>768 × 2,304</text>
      <text x={w + 9} y={y0 + h / 2 + 5} fontSize={14} textAnchor="middle" fill={INK} style={sans}>+</text>
      <text x={xd} y={9} fontSize={TB} fontWeight={700} fill={C.lora} style={sans}>trained</text>
      <rect x={xd} y={y0} width={r} height={h} fill={C.lora} rx={0.8} />
      <rect x={xu} y={y0} width={w} height={r} fill={C.lora} rx={0.8} />
      <text x={xu + 2} y={y0 + r + 13} fontSize={T} fill={INK} style={sans}>768 × 8 and</text>
      <text x={xu + 2} y={y0 + r + 26} fontSize={T} fill={INK} style={sans}>8 × 2,304</text>
      <text x={0} y={y0 + h + 15} fontSize={T} fill={MUTED} style={sans}>GPT-2 small, rank r = 8; to scale except the rank</text>
    </svg>
  )
}

function Memory() {
  const W = 168, max = 112, bw = (v) => (v / max) * W
  return (
    <svg viewBox={`0 0 ${W} 64`} role="img" aria-label="Memory to fine-tune a 7-billion-parameter model: about 112 GB in full, about 14 GB with LoRA">
      <text x={0} y={9} fontSize={T} fontWeight={700} fill={INK} style={sans}>Memory to train a 7B model</text>
      <text x={0} y={24} fontSize={T} fill={INK} style={sans}>full ≈ 112 GB</text>
      <rect x={0} y={28} width={bw(112)} height={8} fill={C.tuned} rx={1.6} />
      <text x={0} y={50} fontSize={T} fill={INK} style={sans}>LoRA ≈ 14 GB</text>
      <rect x={0} y={54} width={bw(14)} height={8} fill={C.lora} rx={1.6} />
    </svg>
  )
}

// ---------------------------------------------------------------- the sheet
export default function FinetuningSheet({ guide }) {
  return (
    <Poster>
      <Masthead
        guide={guide}
        title="Fine-tuning"
        subtitle="teaching a base model new behavior"
        thesis={<>Fine-tuning changes <em>how</em> a model answers. It&apos;s poor at changing <em>what</em> it knows.</>}
      />

      <Step n={1} title="What does fine-tuning change?">
        <Panel span={7} title="Before and after">
          <BeforeAfter />
        </Panel>
        <Panel span={5} title="Where it sits">
          <Pipeline />
        </Panel>
      </Step>

      <Step n={2} title="How is it trained? Same loss, different data">
        <Panel span={5} title="Same loop; new start, data and loss mask">
          <SameLoss />
        </Panel>
        <Panel span={7} title={<><Term>Loss masking</Term>: only the response counts</>}
          note="Train on the prompt too, and the model partly learns to write prompts.">
          <LossMask />
        </Panel>
      </Step>

      <Step n={3} title="What does it learn, and what does it break?" sub="in the guide's toy experiment">
        <p className="setup">
          A tiny model that knows six homes, fine-tuned on 100 &quot;where&quot; examples plus 3 homes × 10:
          {HOMES.slice(0, 3).map(([a, h]) => <span key={a} className="home in-data">{a} → {h}</span>)}
          <span className="gap">not:</span>
          {HOMES.slice(3).map(([a, h]) => <span key={a} className="home">{a} → {h}</span>)}
        </p>
        <Panel span={4} title="It learns how, not what"
          note="From scratch on the same data: the format, not the homes. Those came from pre-training.">
          <KnowledgeGrid />
        </Panel>
        <Panel span={4} title="Teaching one fact moves others"
          note="It learned an answer, not a fact. For new facts, use retrieval (Guide 12).">
          <p className="taught">After cat → <code className="f-took">in the pot</code> × 10, asked:</p>
          <FalseFact />
        </Panel>
        <Panel span={4} title={<>It forgets, unless you <Term>replay</Term></>}
          note="Replay: mix pre-training text into every step.">
          <ForgettingBars />
        </Panel>
      </Step>

      <Step n={4} title="Can it be cheaper? And when should I use it?">
        <Panel span={8} title={<><Term>LoRA</Term>: freeze each weight matrix W, train two thin ones beside it</>}
          note="In the toy, LoRA learned less and forgot less than full fine-tuning.">
          <div className="lora">
            <LoraScale />
            <div>
              <p className="big-num">0.948%</p>
              <p className="big-cap">of GPT-2 small&apos;s parameters trained (four matrices in each block)</p>
              <div style={{ marginTop: "2mm" }}><Memory /></div>
            </div>
          </div>
        </Panel>
        <Panel span={4} title="Use it for, and not for" className="top">
          <ul className="checklist">
            <li><b className="mark-pass">✓</b><span>a response format or style</span></li>
            <li><b className="mark-pass">✓</b><span>a task: classifying, extracting fields</span></li>
            <li><b className="mark-pass">✓</b><span>following instructions</span></li>
            <li><b className="mark-fail">✗</b><span>new or changing facts: use retrieval</span></li>
            <li className="watch"><b>Watch for</b> forgetting (measure old skills) and overfitting (hold out examples).</li>
          </ul>
        </Panel>
      </Step>

      <Footer guide={guide} />
    </Poster>
  )
}
