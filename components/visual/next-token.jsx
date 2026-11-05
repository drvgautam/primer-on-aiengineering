// The one-page visual guide for Guide 6, "Next-token prediction: from probabilities to text".
// A quick overview in four steps; every example, output and number is the guide's
// (content/06-next-token.mdx), and the comments name where each comes from.
// tools/check_visuals.py checks the numbers, the terms and the word budget.
import { Arrow, Footer, Masthead, Math, Panel, Poster, Step, Term } from "./poster"

const ACCENT = "#1e3a5f", INK = "#1b1b1f", SOFT = "#3d3d45", MUTED = "#5f5f6a", RULE2 = "#cfcbc0"
const ON = "#e9eef5", OFF = "#f1f0ec", WARN = "#b91c1c", PASS = "#0f7b4a", GREY = "#aeb7c4"
const sans = { fontFamily: "var(--sans)" }
const mono = { fontFamily: "var(--mono)" }
const T = 10, TB = 10.5

// Horizontal probability bars with labels; `pick` marks the chosen entry.
function Bars({ x, y, rows, w = 120, h = 11, gap = 4, pick, labelW = 26, fmt = (v) => v.toFixed(3), max = 1 }) {
  return (
    <g>
      {rows.map(([l, v], i) => {
        const yy = y + i * (h + gap), on = pick === i
        return (
          <g key={`${l}${i}`}>
            <text x={x + labelW - 4} y={yy + h - 2} fontSize={TB} textAnchor="end" fontWeight={on ? 700 : 400} fill={INK} style={mono}>{l}</text>
            <rect x={x + labelW} y={yy} width={globalThis.Math.max(1, (v / max) * w)} height={h} rx={1.4} fill={on ? ACCENT : GREY} />
            <text x={x + labelW + (v / max) * w + 4} y={yy + h - 2} fontSize={TB} fontWeight={on ? 700 : 400} fill={INK} style={mono}>{fmt(v)}</text>
          </g>
        )
      })}
    </g>
  )
}

// ---------------------------------------------------------------- step 1: a distribution
// The output layer: the last row, the final layer norm, times W_E transposed (768 x 50,257), softmax.
function Output() {
  const W = 358, boxes = [["last row", "1 × 768"], ["LN, × table", "table 768 × 50,257"], ["logits z", "50,257"], ["softmax → p", "sums to 1"]]
  const bw = 78, gap = (W - 4 * bw) / 3
  return (
    <svg viewBox={`0 0 ${W} 60`} role="img" aria-label="The last row, 1 by 768, through the final layer norm and times the transposed embedding table, gives 50,257 logits; softmax turns them into probabilities that sum to 1">
      {boxes.map(([a, b], i) => {
        const x = i * (bw + gap), last = i === 3
        return (
          <g key={a}>
            <rect x={x} y={6} width={bw} height={28} rx={3} fill={last ? ON : OFF} stroke={last ? ACCENT : RULE2} strokeWidth={last ? 1.1 : 0.7} />
            <text x={x + bw / 2} y={24} fontSize={TB} textAnchor="middle" fontWeight={last ? 700 : 400} fill={last ? ACCENT : INK} style={sans}>{a}</text>
            <text x={x + bw / 2} y={50} fontSize={T} textAnchor="middle" fill={MUTED} style={mono}>{b}</text>
            {i < 3 ? <Arrow x1={x + bw + 2} y1={20} x2={x + bw + gap - 2} y2={20} /> : null}
          </g>
        )
      })}
    </svg>
  )
}

// The perplexity block: uniform over 27 characters, Guide 1's floor, the toy on its training text.
function Perplexity() {
  const W = 358
  return (
    <svg viewBox={`0 0 ${W} 66`} role="img" aria-label="Perplexity: 27.00 for a uniform guess over 27 characters, 2.42 at Guide 1's floor, 1.16 for the toy on the text it memorized">
      <text x={0} y={9} fontSize={T} fill={MUTED} style={sans}>perplexity = e<tspan fontSize={9.4} dy={-4}>loss</tspan><tspan dy={4}> ≈ equally likely choices per step</tspan></text>
      <Bars x={0} y={16} labelW={120} w={190} max={27} fmt={(v) => v.toFixed(2)}
        rows={[["uniform over 27", 27], ["Guide 1's floor", 2.42], ["toy, memorized", 1.16]]} pick={2} />
    </svg>
  )
}

// ---------------------------------------------------------------- step 2: the loop
// Figure 1: four turns from "the cat ", the three most probable next characters each time.
const TURNS = [["the cat ", [["s", 0.513], ["r", 0.265], ["a", 0.220]]], ["the cat s", [["a", 0.999]]],
  ["the cat sa", [["t", 0.599], ["w", 0.398]]], ["the cat sat", [["␣", 1.000]]]]
function Loop() {
  const W = 423, rh = 50
  return (
    <svg viewBox={`0 0 ${W} ${4 * rh}`} role="img" aria-label="Four turns of the loop from the cat: s 0.513, then a 0.999, then t 0.599, then space 1.000; each time the most probable is appended">
      {TURNS.map(([ctx, rows], i) => {
        const y = i * rh
        return (
          <g key={ctx}>
            <text x={0} y={y + 18} fontSize={TB} fill={INK} style={mono}>&quot;{ctx}&quot;</text>
            <Arrow x1={104} y1={y + 14} x2={124} y2={y + 14} />
            <Bars x={130} y={y + 2} rows={rows} w={170} h={10} gap={3} pick={0} labelW={18} />
            <text x={W} y={y + 18} fontSize={T} textAnchor="end" fill={ACCENT} fontWeight={700} style={sans}>append {rows[0][0]}{i === 3 ? " …" : ""}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------- step 3: choosing
// Greedy after "and the ": c 0.604, d 0.394; the 220-character greedy run loops.
function Greedy() {
  const W = 230
  return (
    <svg viewBox={`0 0 ${W} 78`} role="img" aria-label="After and the, the toy gives c 0.604 and d 0.394; greedy always picks c">
      <text x={0} y={9} fontSize={T} fill={MUTED} style={sans}>after &quot;and the &quot;</text>
      <Bars x={0} y={16} labelW={14} w={150} rows={[["c", 0.604], ["d", 0.394]]} pick={0} />
      <text x={0} y={58} fontSize={T} fill={MUTED} style={sans}>after &quot;the mat and the &quot;</text>
      <Bars x={0} y={64} labelW={14} w={150} rows={[["d", 0.998]]} pick={0} />
    </svg>
  )
}

// Temperature on Guide 1's logits [2, 1, 0]: T 0.5, 1, 2.
function Temperature() {
  const W = 230, rows = [["0.5", [0.867, 0.117, 0.016]], ["1", [0.665, 0.245, 0.09]], ["2", [0.506, 0.307, 0.186]]]
  return (
    <svg viewBox={`0 0 ${W} 90`} role="img" aria-label="Softmax of 2, 1, 0 at temperature 0.5: 0.867, 0.117, 0.016; at 1: 0.665, 0.245, 0.090; at 2: 0.506, 0.307, 0.186">
      <text x={0} y={9} fontSize={T} fill={MUTED} style={sans}>softmax(z / T), z = [2, 1, 0]</text>
      <text x={W} y={9} fontSize={T} textAnchor="end" fill={MUTED} style={sans}>top share</text>
      {rows.map(([t, ps], i) => {
        const y = 18 + i * 24
        let x = 40
        return (
          <g key={t}>
            <text x={0} y={y + 12} fontSize={TB} fill={INK} style={mono}>T={t}</text>
            {ps.map((v, j) => {
              const w = v * 150, r = <rect key={j} x={x} y={y + 2} width={w} height={13} fill={[ACCENT, "#7d8fa8", GREY][j]} stroke="#fff" strokeWidth={0.6} />
              x += w
              return r
            })}
            <text x={x + 4} y={y + 12} fontSize={T} fill={SOFT} style={mono}>{ps[0].toFixed(3)}</text>
          </g>
        )
      })}
    </svg>
  )
}

// Figure 3: top-2 and top-p 0.9 on [0.50, 0.25, 0.12, 0.08, 0.05].
function Cuts() {
  const W = 230, q = [0.50, 0.25, 0.12, 0.08, 0.05], bw = 30, x0 = 58, ph = 46
  const rows = [["top-2", 2, [0.667, 0.333]], ["top-p 0.9", 4, [0.526, 0.263, 0.126, 0.084]]]
  return (
    <svg viewBox={`0 0 ${W} 120`} role="img" aria-label="Five tokens 0.50, 0.25, 0.12, 0.08, 0.05. Top-2 keeps two: 0.667, 0.333. Top-p 0.9 keeps four: 0.526, 0.263, 0.126, 0.084.">
      {q.map((v, i) => (
        <g key={i}>
          <rect x={x0 + i * (bw + 3)} y={4 + ph - v * ph * 1.8} width={bw} height={v * ph * 1.8} rx={1.4} fill={i < 2 ? ACCENT : i < 4 ? "#8899b0" : GREY} />
          <text x={x0 + i * (bw + 3) + bw / 2} y={ph + 16} fontSize={T} textAnchor="middle" fill={INK} style={mono}>{v.toFixed(2).replace(/^0/, "")}</text>
        </g>
      ))}
      <text x={x0 - 6} y={ph + 28} fontSize={T} textAnchor="end" fill={MUTED} style={sans}>total</text>
      {[".50", ".75", ".87", ".95", "1"].map((v, i) => (
        <text key={v} x={x0 + i * (bw + 3) + bw / 2} y={ph + 28} fontSize={T} textAnchor="middle" fill={i === 3 ? INK : MUTED} fontWeight={i === 3 ? 700 : 400} style={mono}>{v}</text>
      ))}
      {rows.map(([name, keep, vals], r) => (
        <g key={name}>
          <text x={x0 - 6} y={92 + r * 18} fontSize={T} textAnchor="end" fill={INK} fontWeight={600} style={sans}>{name}</text>
          {q.map((_, i) => (
            <text key={i} x={x0 + i * (bw + 3) + bw / 2} y={92 + r * 18} fontSize={T} textAnchor="middle" fill={i < keep ? ACCENT : MUTED} fontWeight={i < keep ? 700 : 400} style={mono}>
              {i < keep ? vals[i].toFixed(3).replace(/^0/, "") : "–"}
            </text>
          ))}
        </g>
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------- step 4: the running example
// GPT-2 small after "The cat sat on the" at T = 1 (series/running-example.py's printed output).
function Gpt2() {
  const W = 423
  return (
    <svg viewBox={`0 0 ${W} 94`} role="img" aria-label="GPT-2 small after The cat sat on the, at temperature 1: floor 0.076, bed 0.065, couch 0.054, ground 0.052, edge 0.048; mat ranks 31st at 0.004">
      <text x={0} y={9} fontSize={T} fill={MUTED} style={sans}>T = 1, 0–1 scale</text>
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={62} y={16 + i * 15} width={170} height={11} rx={1.4} fill="#f1f0ec" />)}
      <text x={236} y={25} fontSize={T} fill={MUTED} style={mono}>1</text>
      <Bars x={0} y={16} labelW={62} w={170} max={1} pick={0}
        rows={[["␣floor", 0.076], ["␣bed", 0.065], ["␣couch", 0.054], ["␣ground", 0.052], ["␣edge", 0.048]]} />
      <text x={W} y={30} fontSize={TB} textAnchor="end" fill={INK} style={sans}>top five: <tspan fontWeight={700} style={mono}>0.296</tspan></text>
      <text x={W} y={50} fontSize={TB} textAnchor="end" fill={INK} style={sans}>&quot;␣mat&quot;: rank 31, <tspan fontWeight={700} style={mono}>0.004</tspan></text>
      <text x={W} y={70} fontSize={TB} textAnchor="end" fill={INK} style={sans}>top-p 0.9: 728 tokens</text>
    </svg>
  )
}

// ---------------------------------------------------------------- the sheet
export default function NextTokenSheet({ guide }) {
  return (
    <Poster>
      <Masthead
        guide={guide}
        title="Next-token prediction"
        subtitle="from probabilities to text"
        thesis={<>The model outputs a <em>probability for every token</em>; a <em>decoding rule</em> picks one; the loop repeats.</>}
      />

      <Step n={1} title="What does the model output? A distribution, never a word" sub="toy: 27 characters, one memorized 128-character text">
        <Panel span={6} title={<>The last position&apos;s <Term>next-token distribution</Term></>}
          note="It reuses the embedding table: no new parameters.">
          <p className="formula"><Math tex={String.raw`p = \operatorname{softmax}\big(\operatorname{LN}(x)\,W_E^\top\big)`} /></p>
          <Output />
        </Panel>
        <Panel span={6} title={<>Training loss, read as <Term>perplexity</Term></>}
          note="Toy: 1,792 predictions a pass; loss 0.152 → perplexity 1.16.">
          <Perplexity />
        </Panel>
      </Step>

      <Step n={2} title="How does text come out? One token at a time" sub="␣ = space">
        <Panel span={7} title="Run, choose, append, repeat">
          <Loop />
        </Panel>
        <Panel span={5} title="What the loop implies" className="top">
          <ul className="checklist">
            <li><b>1</b><span>Stops at end-of-text (GPT-2: 50256) or a limit.</span></li>
            <li><b>2</b><span>No hidden draft: plans live in token vectors.</span></li>
            <li className="watch"><b>Training</b>: every position predicts its true next token at once (<Term>teacher forcing</Term>). <b>Generation</b>: one per step.</li>
          </ul>
        </Panel>
      </Step>

      <Step n={3} title="How is a token chosen? Greedy, or a shaped sample" sub="repeatable → greedy; varied → moderate T plus top-p">
        <Panel span={4} title={<><Term>Greedy decoding</Term> throws uncertainty away</>}
          note="Never &quot;dog&quot; (39%) after just &quot;and the &quot;. It loops.">
          <Greedy />
          <p className="nt-loop">…ran on the mat <b>↻</b> and the dog sat…</p>
        </Panel>
        <Panel span={4} title={<><Term>Sampling</Term>: <Term>temperature</Term> reshapes the odds</>}
          note="On the toy at T = 2, 138 of 1,000 draws went to neither c nor d.">
          <p className="nt-lead">draws in proportion to p</p>
          <Temperature />
        </Panel>
        <Panel span={4} title={<><Term>Top-k sampling</Term> and <Term>top-p sampling</Term> cut the tail</>}
          note="Top-k keeps k; top-p keeps through the token passing 0.9; both rescale.">
          <Cuts />
        </Panel>
      </Step>

      <Step n={4} title="What is p on GPT-2? Thinly spread, not truth" sub="GPT-2 small, &quot;The cat sat on the&quot;">
        <Panel span={7} title="GPT-2 is far less sure than the toy">
          <Gpt2 />
        </Panel>
        <Panel span={5} title="A probability is not a measure of truth"
          note="Post-training shifts p (Guides 8, 9).">
          <ul className="checklist">
            <li><b className="mark-pass">✓</b><span>an estimate of how text continues</span></li>
            <li><b className="mark-fail">✗</b><span>a fact check: fluent falsehoods can score high</span></li>
            <li><b>·</b><span><Term as="calibration">calibrated</Term> (70% right at 0.7) only where common text is true</span></li>
          </ul>
        </Panel>
      </Step>

      <Footer guide={guide} />
    </Poster>
  )
}
