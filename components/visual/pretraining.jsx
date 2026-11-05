// The one-page visual guide for Guide 7, "Pre-training: learning from a mountain of text".
// A quick overview in four steps; every example, output and number is the guide's
// (content/07-pretraining.mdx), and the comments name where each comes from.
// tools/check_visuals.py checks the numbers, the terms and the word budget.
import { Footer, Masthead, Math, Panel, Poster, Step, Term } from "./poster"

const ACCENT = "#1e3a5f", INK = "#1b1b1f", SOFT = "#3d3d45", MUTED = "#5f5f6a", RULE2 = "#cfcbc0"
const ON = "#e9eef5", WARN = "#b91c1c", PASS = "#0f7b4a", GREY = "#aeb7c4", AMBER = "#b45309"
const sans = { fontFamily: "var(--sans)" }
const mono = { fontFamily: "var(--mono)" }
const T = 10, TB = 10.5

// ---------------------------------------------------------------- step 1: the world, and the curve
// The training block: training and validation loss at 0 to 1,000 steps; the 0.225 rules' floor.
const CURVE = [[0, 3.567, 3.582], [50, 1.329, 1.341], [100, 0.936, 0.935], [250, 0.405, 0.400], [500, 0.301, 0.301], [750, 0.287, 0.291], [1000, 0.281, 0.287]]
function Curve() {
  const W = 358, H = 128, x0 = 30, xw = 322, y0 = 10, yh = 98, X = (s) => x0 + (s / 1000) * xw, Y = (l) => y0 + yh * (globalThis.Math.log(4) - globalThis.Math.log(l)) / (globalThis.Math.log(4) - globalThis.Math.log(0.2))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Training and validation loss fall together from about 3.6 to 0.281 and 0.287 over 1,000 steps, a little above the 0.225 rules' floor">
      <line x1={x0} x2={x0 + xw} y1={Y(0.2)} y2={Y(0.2)} stroke={RULE2} strokeWidth={0.7} />
      <line x1={x0} x2={x0 + xw} y1={Y(0.225)} y2={Y(0.225)} stroke={PASS} strokeWidth={1} strokeDasharray="4 2" />
      
      <polyline points={CURVE.map(([s, , v]) => `${X(s)},${Y(v)}`).join(" ")} fill="none" stroke={AMBER} strokeWidth={4} strokeOpacity={0.5} />
      <polyline points={CURVE.map(([s, t]) => `${X(s)},${Y(t)}`).join(" ")} fill="none" stroke={ACCENT} strokeWidth={1.3} />
      {CURVE.map(([s, t]) => <circle key={s} cx={X(s)} cy={Y(t)} r={2.2} fill={ACCENT} />)}
      <text x={X(0) + 6} y={Y(3.567) + 4} fontSize={T} fill={INK} style={mono}>3.567</text>
      <text x={X(1000)} y={Y(0.287) - 6} fontSize={TB} fontWeight={700} textAnchor="end" fill={INK} style={mono}><tspan fill={ACCENT}>0.281</tspan> / <tspan fill={AMBER}>0.287</tspan></text>
      <text x={x0 + 46} y={y0 + 2} fontSize={T} fill={MUTED} style={sans}>loss, log scale</text>
      {[0, 500, 1000].map((s) => <text key={s} x={X(s)} y={Y(0.2) + 12} fontSize={T} textAnchor={s === 1000 ? "end" : "middle"} fill={MUTED} style={mono}>{s === 1000 ? "1,000 steps" : s}</text>)}
      <line x1={190} x2={204} y1={40} y2={40} stroke={ACCENT} strokeWidth={1.4} />
      <text x={208} y={44} fontSize={T} fill={ACCENT} style={sans}>training text</text>
      <line x1={190} x2={204} y1={56} y2={56} stroke={AMBER} strokeWidth={4} strokeOpacity={0.5} />
      <text x={208} y={60} fontSize={T} fill={AMBER} style={sans}>held-out sentences</text>
      <line x1={190} x2={204} y1={72} y2={72} stroke={PASS} strokeWidth={1} strokeDasharray="4 2" />
      <text x={208} y={76} fontSize={T} fill={PASS} fontWeight={700} style={sans}>rules&apos; floor 0.225</text>
    </svg>
  )
}

// ---------------------------------------------------------------- step 2: batches and Adam
// Windows on the stream (Figure 1): stride 1 overlaps, stride 4 lays windows back to back.
function Windows() {
  const W = 423, s = "the owl ran on the rug", c = 15
  const row = (y, starts, color) => starts.map((st, i) => (
    <rect key={`${y}${i}`} x={st * c + 1} y={y + (color === ACCENT ? 0 : i * 5)} width={4 * c - 2} height={4} rx={2} fill={color} />
  ))
  return (
    <svg viewBox={`0 0 ${W} 78`} role="img" aria-label="Windows of 4 characters on the training stream: stride 1 starts one at every character; stride 4 lays them back to back">
      {s.split("").map((ch, i) => <text key={i} x={i * c + c / 2} y={12} fontSize={11} textAnchor="middle" fill={INK} style={mono}>{ch === " " ? "·" : ch}</text>)}
      {row(20, [0, 1, 2, 3], GREY)}
      <text x={W} y={32} fontSize={T} textAnchor="end" fill={MUTED} style={sans}>train: stride 1</text>
      {row(52, [0, 4, 8, 12, 16], ACCENT)}
      <text x={W} y={58} fontSize={T} textAnchor="end" fill={MUTED} style={sans}>check: stride 4</text>
      <text x={0} y={76} fontSize={T} fill={SOFT} style={sans}>target: the same window, one character later</text>
    </svg>
  )
}

// The optimizer comparison: validation loss at 500 and 1,000 steps.
function Optimizers() {
  const W = 358, rows = [["SGD, η 0.3", 0.827, 0.369], ["SGD, η 1.0", 0.324, null], ["Adam, η 0.003", 0.301, 0.287]], x0 = 104, bw = 100
  return (
    <svg viewBox={`0 0 ${W} 96`} role="img" aria-label="Validation loss at 500 and 1,000 steps: SGD at 0.3: 0.827 then 0.369; SGD at 1.0: 0.324 then nan, diverged; Adam at 0.003: 0.301 then 0.287">
      <text x={x0} y={9} fontSize={T} fill={MUTED} style={sans}>held-out loss (lower is better)</text>
      <text x={x0} y={22} fontSize={T} fill={MUTED} style={sans}>500 steps</text>
      <text x={x0 + bw + 50} y={22} fontSize={T} fill={MUTED} style={sans}>1,000</text>
      {rows.map(([l, a, b], i) => {
        const y = 30 + i * 22, adam = i === 2
        return (
          <g key={l}>
            <text x={x0 - 6} y={y + 10} fontSize={TB} textAnchor="end" fontWeight={adam ? 700 : 400} fill={INK} style={sans}>{l}</text>
            <rect x={x0} y={y + 1} width={(a / 0.9) * bw} height={11} rx={1.4} fill={adam ? ACCENT : GREY} />
            <text x={x0 + (a / 0.9) * bw + 4} y={y + 10} fontSize={TB} fill={INK} style={mono}>{a.toFixed(3)}</text>
            {b === null
              ? <text x={x0 + bw + 50} y={y + 10} fontSize={TB} fontWeight={700} fill={WARN} style={mono}>nan: diverged</text>
              : <><rect x={x0 + bw + 50} y={y + 1} width={(b / 0.9) * bw} height={11} rx={1.4} fill={adam ? ACCENT : GREY} />
                <text x={x0 + bw + 54 + (b / 0.9) * bw} y={y + 10} fontSize={TB} fontWeight={adam ? 700 : 400} fill={INK} style={mono}>{b.toFixed(3)}</text></>}
          </g>
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------- step 3: learning or memorizing
// The overfitting block: 10 sentences against 4,000, training and validation loss at 1,000 steps.
function Overfit() {
  const W = 358, rows = [["10 sentences", 0.112, 1.656], ["4,000 sentences", 0.281, 0.287]], x0 = 110, bw = 200, X = (v) => x0 + (v / 1.7) * bw
  return (
    <svg viewBox={`0 0 ${W} 100`} role="img" aria-label="With 10 sentences: training loss 0.112, validation 1.656. With 4,000: 0.281 and 0.287. The rules' floor is 0.225.">
      {rows.map(([l, t, v], i) => {
        const y = 10 + i * 40
        return (
          <g key={l}>
            <text x={x0 - 6} y={y + 16} fontSize={TB} textAnchor="end" fontWeight={600} fill={INK} style={sans}>{l}</text>
            <rect x={x0} y={y} width={X(t) - x0} height={11} rx={1.4} fill={ACCENT} />
            <text x={globalThis.Math.max(X(t), X(0.225)) + 4} y={y + 9.5} fontSize={TB} fill={INK} style={mono}>{t.toFixed(3)}</text>
            <rect x={x0} y={y + 14} width={X(v) - x0} height={11} rx={1.4} fill={AMBER} opacity={0.7} />
            <text x={X(v) + 4} y={y + 23.5} fontSize={TB} fontWeight={700} fill={i === 0 ? WARN : INK} style={mono}>{v.toFixed(3)}</text>
          </g>
        )
      })}
      <line x1={X(0.225)} x2={X(0.225)} y1={4} y2={88} stroke={PASS} strokeWidth={1} strokeDasharray="3 2" />
      <text x={X(0.225) + 3} y={98} fontSize={T} fill={PASS} style={sans}>rules&apos; floor 0.225</text>
      <rect x={0} y={86} width={9} height={8} fill={ACCENT} /><text x={12} y={93} fontSize={T} fill={MUTED} style={sans}>training</text>
      <rect x={56} y={86} width={9} height={8} fill={AMBER} opacity={0.7} /><text x={68} y={93} fontSize={T} fill={MUTED} style={sans}>held-out</text>
    </svg>
  )
}

// ---------------------------------------------------------------- step 4: cost and output
// Tokens per parameter: GPT-3 1.7, Chinchilla 20.0, LLaMA-7B 142.9 (log scale); compute-optimal ≈ 20.
function Ratio() {
  const W = 230, x0 = 70, xw = 124, L = (v) => x0 + (globalThis.Math.log10(v) / globalThis.Math.log10(200)) * xw
  const rows = [["GPT-3", 1.7], ["Chinchilla", 20.0], ["LLaMA-7B", 142.9]]
  return (
    <svg viewBox={`0 0 ${W} 84`} role="img" aria-label="Training tokens per parameter on a log scale: GPT-3 1.7, Chinchilla 20.0, LLaMA-7B 142.9; the compute-optimal ratio is about 20">
      {rows.map(([l, v], i) => (
        <g key={l}>
          <text x={x0 - 6} y={18 + i * 20} fontSize={TB} textAnchor="end" fill={INK} style={sans}>{l}</text>
          <rect x={x0} y={9 + i * 20} width={L(v) - x0} height={11} rx={1.4} fill={i === 1 ? PASS : GREY} />
          <text x={L(v) + 4} y={18 + i * 20} fontSize={TB} fontWeight={700} fill={INK} style={mono}>{v.toFixed(1)}</text>
        </g>
      ))}
      <line x1={L(20)} x2={L(20)} y1={2} y2={70} stroke={PASS} strokeWidth={1} strokeDasharray="3 2" />
      {[1, 10, 100].map((v) => <line key={v} x1={L(v)} x2={L(v)} y1={68} y2={72} stroke={MUTED} strokeWidth={0.7} />)}
      {[1, 10, 100].map((v) => <text key={`t${v}`} x={L(v)} y={82} fontSize={T} textAnchor="middle" fill={MUTED} style={mono}>{v}</text>)}
    </svg>
  )
}

// ---------------------------------------------------------------- the sheet
export default function PretrainingSheet({ guide }) {
  return (
    <Poster>
      <Masthead
        guide={guide}
        title="Pre-training"
        subtitle="learning from a mountain of text"
        thesis={<>Predict the next token over huge text; <em>held-out loss</em> separates learning from memorizing; <em>6 × parameters × tokens</em> gives the cost.</>}
      />

      <Step n={1} title="What does the toy train on? 4,000 sentences of one pattern, cut into windows">
        <Panel span={5} title="Sentences follow one pattern" className="top"
          note={<>A model that knows only the rules can&apos;t average below 0.225 nats per character: the <Term>rules&apos; floor</Term>.</>}>
          <div className="pt-world">
            <p>the <span>cat dog rat fox owl hen</span><br /><span>sat ran hid lay</span> <span>on by near under</span><br />the <span>mat log rug bed pot hut</span> and …</p>
            <p className="pt-mult">576 types: 461 to train, 115 in the <Term>validation set</Term></p>
          </div>
        </Panel>
        <Panel span={7} title={<>Windows at a <Term>stride</Term>, in random batches</>}
          note={<>Toy: 32 windows of 32 characters a step; checks lay them back to back. <Term>Minibatch gradient descent</Term>: cheap, noisy gradients.</>}>
          <Windows />
        </Panel>
      </Step>

      <Step n={2} title="How does it learn? Adam steps, and both losses fall">
        <Panel span={6} className="top" title={<><Term>Adam</Term> sets each parameter&apos;s step size</>}
          note="η = learning rate. Adam divides each gradient by its typical size, so steady ones step about η.">
          <Optimizers />
        </Panel>
        <Panel span={6} title="Training and held-out loss fall together"
          note="Guide 5's toy, 28,251 parameters.">
          <Curve />
        </Panel>
      </Step>

      <Step n={3} title="Learning or memorizing? Compare the two losses">
        <Panel span={6} title={<>Too little text: <Term>overfitting</Term></>}
          note="Big gap = overfitting; below the floor = memory.">
          <Overfit />
        </Panel>
        <Panel span={6} title="The 4,000-sentence model writes sentences it never saw" className="top"
          note="New combinations: beyond memory.">
          <div className="pt-samples">
            <p><b>102</b> sentences sampled · <b>85</b> grammatical · <b className="mark-pass">13</b> new, all held-out types</p>
            <p className="ok">new: the fox lay on the bed · the dog ran by the bed</p>
            <p className="miss">misses: the owl sat neat the pot</p>
          </div>
        </Panel>
      </Step>

      <Step n={4} title="What does it cost, and what comes out? 6ND; a base model">
        <Panel span={4} title="Compute ≈ 6 × parameters × tokens"
          note="Training memory, GPT-3 with Adam: 16 bytes per parameter, 2.8 TB.">
          <p className="formula"><Math tex={String.raw`C \approx 6ND`} /></p>
          <div className="pt-cost">
            <p>GPT-3: 6 × 175B × 300B ≈ <b>3.15 × 10²³</b> operations</p>
            <p>one device at 10¹⁵ per second: <b>10.0 years</b>; 1,000: <b>3.6 days</b></p>
          </div>
        </Panel>
        <Panel span={4} title={<><Term>Compute-optimal</Term>: about 20 tokens per parameter</>}
          note="Small models serving many requests train far past it.">
          <Ratio />
        </Panel>
        <Panel span={4} title={<>A <Term>base model</Term> (GPT-2 small) continues text</>}
          note="Answering and stopping take more training (Guide 8).">
          <div className="pt-base">
            <code>The capital of France is</code>
            <p>→ the capital of the French Republic, and … (never Paris)</p>
            <code>Q: What is the capital of France? A:</code>
            <p>→ The capital of France is Paris. Q: …</p>
          </div>
        </Panel>
      </Step>

      <Footer guide={guide} />
    </Poster>
  )
}
