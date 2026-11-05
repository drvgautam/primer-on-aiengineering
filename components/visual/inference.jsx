// The one-page visual guide for Guide 10, "Inference and serving: running a trained model fast and cheap".
// A quick overview in four steps; every example, output and number is the guide's
// (content/10-inference.mdx), and the comments name where each comes from. Timings are the guide's
// test-machine figures, labelled as such; the counts and ratios are what carry over.
// tools/check_visuals.py checks the numbers, the terms and the word budget.
import { Arrow, Footer, Masthead, Panel, Poster, Step, Term } from "./poster"

const ACCENT = "#1e3a5f", INK = "#1b1b1f", SOFT = "#3d3d45", MUTED = "#5f5f6a", RULE2 = "#cfcbc0"
const ON = "#e9eef5", WARN = "#b91c1c", PASS = "#0f7b4a", GREY = "#aeb7c4", AMBER = "#b45309"
const sans = { fontFamily: "var(--sans)" }
const mono = { fontFamily: "var(--mono)" }
const T = 10, TB = 10.5

// ---------------------------------------------------------------- step 1: phases and the cache
// Figure 1: prefill reads the prompt in one wide pass; each decode step is a narrow pass for one token.
function Phases() {
  const W = 294
  return (
    <svg viewBox={`0 0 ${W} 96`} role="img" aria-label="Prefill reads the whole prompt, every position at once, in one pass that ends at the first token; then each decode step is one pass for one more token">
      {Array.from({ length: 6 }, (_, i) => <rect key={i} x={0} y={10 + i * 9} width={22} height={7} rx={1.5} fill={ON} stroke={ACCENT} strokeWidth={0.8} />)}
      <text x={28} y={30} fontSize={TB} fontWeight={700} fill={ACCENT} style={sans}>prefill</text>
      <text x={28} y={43} fontSize={T} fill={SOFT} style={sans}>whole prompt,</text>
      <text x={28} y={55} fontSize={T} fill={SOFT} style={sans}>one pass</text>
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={130 + i * 27} y={38} width={22} height={7} rx={1.5} fill="#fff" stroke={ACCENT} strokeWidth={0.9} />
      ))}
      <text x={130} y={28} fontSize={T} fill={SOFT} style={sans}>decode: one pass per token</text>
      <line x1={0} x2={W} y1={70} y2={70} stroke={RULE2} strokeWidth={0.7} />
      <path d="M 0 74 v 4 h 22 v -4" stroke={AMBER} strokeWidth={1} fill="none" />
      <text x={0} y={90} fontSize={T} fill={AMBER} fontWeight={700} style={sans}>time to first token</text>
      <path d="M 157 74 v 4 h 22 v -4" stroke={PASS} strokeWidth={1} fill="none" />
      <text x={168} y={90} fontSize={T} textAnchor="middle" fill={PASS} fontWeight={700} style={sans}>time per output token</text>
    </svg>
  )
}

// The cache block: positions processed for 40 characters after the 19-character prompt.
function Cache() {
  const W = 423, x0 = 108, bw = 280
  return (
    <svg viewBox={`0 0 ${W} 78`} role="img" aria-label="Generating 40 characters: 1,540 positions processed without the cache, 58 with it; the same text, logits within 0.0001">
      <text x={x0} y={9} fontSize={T} fill={MUTED} style={sans}>positions processed for 40 characters</text>
      {[["no cache", 1540, GREY], ["KV cache", 58, ACCENT]].map(([l, v, c], i) => (
        <g key={l}>
          <text x={x0 - 6} y={28 + i * 22} fontSize={TB} textAnchor="end" fontWeight={i ? 700 : 400} fill={INK} style={sans}>{l}</text>
          <rect x={x0} y={19 + i * 22} width={globalThis.Math.max(2, (v / 1540) * bw)} height={12} rx={1.4} fill={c} />
          <text x={x0 + (v / 1540) * bw + 5} y={28 + i * 22} fontSize={TB} fontWeight={700} fill={INK} style={mono}>{v.toLocaleString("en-US")}</text>
        </g>
      ))}
      <text x={x0} y={74} fontSize={T} fill={SOFT} style={sans}>logits differ by less than 0.0001</text>
    </svg>
  )
}

// ---------------------------------------------------------------- step 2: memory-bound, and batching
// The ratio block: one decode step does 1 operation per byte read; an H100 can do about 300.
function Ratio() {
  const W = 358, x0 = 120, bw = 190, L = (v) => (globalThis.Math.log10(v) / globalThis.Math.log10(300)) * bw
  return (
    <svg viewBox={`0 0 ${W} 74`} role="img" aria-label="Operations per byte read: one decode step for one sequence, 1; what an H100 can do, about 300 (log scale)">
      <text x={x0} y={9} fontSize={T} fill={MUTED} style={sans}>operations per byte read (log scale)</text>
      <text x={x0 - 6} y={28} fontSize={TB} textAnchor="end" fill={INK} style={sans}>decode, 1 sequence</text>
      <rect x={x0} y={19} width={3} height={12} fill={WARN} />
      <text x={x0 + 8} y={28} fontSize={TB} fontWeight={700} fill={WARN} style={mono}>1</text>
      <text x={x0 - 6} y={50} fontSize={TB} textAnchor="end" fill={INK} style={sans}>H100 GPU</text>
      <rect x={x0} y={41} width={L(300)} height={12} rx={1.4} fill={GREY} />
      <text x={x0 + L(300) + 4} y={50} fontSize={TB} fontWeight={700} fill={INK} style={mono}>~300</text>
      <text x={x0} y={70} fontSize={T} fill={SOFT} style={sans}>a batch of B: about B per byte</text>
    </svg>
  )
}

// The batching table (the guide's test machine, one CPU thread).
function Batching() {
  const W = 358, rows = [[1, "0.33", 3000], [16, "0.48", 33000], [64, "0.86", 75000], [256, "2.30", 111000]], x0 = 40, bw = 180
  return (
    <svg viewBox={`0 0 ${W} 96`} role="img" aria-label="Sequences per decode step 1, 16, 64, 256: time per step 0.33, 0.48, 0.86, 2.30 ms; tokens per second about 3,000, 33,000, 75,000, 111,000">
      <text x={0} y={9} fontSize={T} fill={MUTED} style={sans}>toy batch</text>
      <text x={x0 + 14} y={9} fontSize={T} fill={MUTED} style={sans}>tokens per second</text>
      <text x={W} y={9} fontSize={T} textAnchor="end" fill={MUTED} style={sans}>time per output token, ms</text>
      {rows.map(([b, ms, tps], i) => (
        <g key={b}>
          <text x={x0 - 8} y={28 + i * 19} fontSize={TB} textAnchor="end" fill={INK} style={mono}>{b}</text>
          <rect x={x0} y={19 + i * 19} width={(tps / 111000) * bw} height={12} rx={1.4} fill={ACCENT} />
          <text x={x0 + (tps / 111000) * bw + 4} y={28 + i * 19} fontSize={TB} fill={INK} style={mono}>{tps.toLocaleString("en-US")}</text>
          <text x={W} y={28 + i * 19} fontSize={TB} textAnchor="end" fill={PASS} fontWeight={i === 3 ? 700 : 400} style={mono}>{ms}</text>
        </g>
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------- step 3: smaller caches, smaller weights
// Llama 2 70B's configuration: 64 query heads, 8 key-value heads; cache bytes per token.
function Gqa() {
  const W = 358
  return (
    <svg viewBox={`0 0 ${W} 100`} role="img" aria-label="Without sharing, 64 key-value heads: 2,621,440 bytes per token, 10.74 GB at 4,096 tokens. With 8 shared key-value heads: 327,680 bytes, 1.34 GB.">
      {Array.from({ length: 16 }, (_, i) => <rect key={i} x={i * 13} y={4} width={10} height={10} rx={1.5} fill={GREY} />)}
      <text x={214} y={13} fontSize={T} fill={MUTED} style={sans}>query heads</text>
      {Array.from({ length: 16 }, (_, i) => (
        <line key={`l${i}`} x1={i * 13 + 5} y1={15} x2={(i >> 3) * 104 + 49} y2={30} stroke={RULE2} strokeWidth={0.6} />
      ))}
      {[0, 1].map((g) => <rect key={g} x={g * 104 + 44} y={30} width={10} height={10} rx={1.5} fill={ACCENT} />)}
      <text x={214} y={39} fontSize={T} fill={ACCENT} style={sans}>8 query heads share one</text>
      <text x={0} y={62} fontSize={TB} fill={INK} style={sans}>64 key–value heads (70B model)</text>
      <text x={W} y={62} fontSize={TB} textAnchor="end" fill={INK} style={mono}>10.74 GB per user</text>
      <text x={0} y={80} fontSize={TB} fontWeight={700} fill={INK} style={sans}>8 shared (GQA)</text>
      <text x={W} y={80} fontSize={TB} fontWeight={700} textAnchor="end" fill={PASS} style={mono}>1.34 GB</text>
      <text x={0} y={96} fontSize={T} fill={SOFT} style={sans}>8× the users; a little quality lost</text>
    </svg>
  )
}

// The quantization block: validation loss per row and homes, by bit width.
const Q = [[32, 0.244, 6, "117.1"], [8, 0.244, 6, "34.8"], [6, 0.244, 6, "27.7"], [4, 0.259, 6, "20.6"], [3, 0.937, 4, "17.1"], [2, 4.765, 0, "13.6"]]
function Quant() {
  const W = 358, x0 = 52, bw = 150
  return (
    <svg viewBox={`0 0 ${W} 124`} role="img" aria-label="Quantization of the toy: loss 0.244 at 32, 8 and 6 bits, 0.259 at 4, 0.937 at 3, 4.765 at 2; homes 6 of 6 down to 4 bits, 4 at 3 bits, 0 at 2; size 117.1 KB down to 13.6 KB">
      <text x={x0} y={9} fontSize={T} fill={MUTED} style={sans}>validation loss</text>
      <text x={x0 + bw + 52} y={9} fontSize={T} fill={MUTED} style={sans}>homes recalled</text>
      <text x={W} y={9} fontSize={T} textAnchor="end" fill={MUTED} style={sans}>KB</text>
      {Q.map(([b, l, h, kb], i) => {
        const y = 16 + i * 17, bad = l > 0.5
        return (
          <g key={b}>
            <text x={x0 - 6} y={y + 10} fontSize={TB} textAnchor="end" fill={INK} style={mono}>{b} bits</text>
            <rect x={x0} y={y + 1} width={bad ? bw : (l / 1.0) * bw} height={11} rx={1.4} fill={bad ? WARN : b === 4 ? AMBER : ACCENT} />
            <text x={x0 + (bad ? bw : (l / 1.0) * bw) + 4} y={y + 10} fontSize={TB} fill={INK} style={mono}>{l.toFixed(3)}</text>
            <text x={x0 + bw + 52} y={y + 10} fontSize={TB} fontWeight={700} fill={h === 6 ? PASS : WARN} style={mono}>{h}/6</text>
            <text x={W} y={y + 10} fontSize={TB} textAnchor="end" fill={SOFT} style={mono}>{kb}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------- step 4: speculative decoding
// Figure 4: after "...and the r" the draft proposes a, t, space, h; the large model checks them in one
// pass and chooses a, t, space, l; 3 kept plus its own l.
function Speculative() {
  const W = 423, c = 26, x0 = 96
  const draft = ["a", "t", "␣", "h"], big = ["a", "t", "␣", "l"]
  return (
    <svg viewBox={`0 0 ${W} 86`} role="img" aria-label="One round: the draft proposes 4 characters; the large model checks them in one pass; it agrees with the first 3 and adds its own choice at the fourth, so one pass yields 4 characters">
      <text x={x0 - 8} y={20} fontSize={TB} textAnchor="end" fill={INK} style={sans}>draft guesses</text>
      <text x={x0 - 8} y={50} fontSize={TB} textAnchor="end" fill={INK} style={sans}>large model</text>
      {draft.map((ch, i) => {
        const ok = i < 3
        return (
          <g key={i}>
            <rect x={x0 + i * c} y={6} width={c - 4} height={20} rx={2} fill="#fff" stroke={ok ? PASS : WARN} strokeWidth={1} />
            <text x={x0 + i * c + (c - 4) / 2} y={20} fontSize={12} textAnchor="middle" fill={ok ? PASS : WARN} style={mono}>{ch}</text>
            <rect x={x0 + i * c} y={36} width={c - 4} height={20} rx={2} fill={i === 3 ? "#e6f4ec" : ON} stroke={i === 3 ? PASS : ACCENT} strokeWidth={1} />
            <text x={x0 + i * c + (c - 4) / 2} y={50} fontSize={12} textAnchor="middle" fill={ACCENT} fontWeight={700} style={mono}>{big[i]}</text>
          </g>
        )
      })}
      <text x={x0 + 4 * c + 10} y={20} fontSize={T} fill={SOFT} style={sans}>3 kept ✓, 4th rejected</text>
      <text x={x0 + 4 * c + 10} y={50} fontSize={T} fill={SOFT} style={sans}>adds its own</text>
      <text x={x0} y={78} fontSize={TB} fill={INK} style={sans}>after &quot;…and the r&quot;: <tspan style={mono} fontWeight={700}>at␣l</tspan>, 4 characters from one pass</text>
    </svg>
  )
}

// ---------------------------------------------------------------- the sheet
export default function InferenceSheet({ guide }) {
  return (
    <Poster>
      <Masthead
        guide={guide}
        title="Inference and serving"
        subtitle="running a trained model fast and cheap"
        thesis={<>Serving runs the generation loop for many users; <em>memory</em> sets its limits, and every speed-up <em>trades something</em>.</>}
      />

      <Step n={1} title="Where does the work go? A parallel prefill, then one pass per token">
        <Panel span={5} title={<><Term>Prefill</Term>, then the <Term>decode phase</Term></>}
          note={<><Term>Latency</Term> per user; <Term>throughput</Term> across all users.</>}>
          <Phases />
        </Panel>
        <Panel span={7} title={<>The <Term>KV cache</Term>: keep earlier keys and values</>}
          note="Earlier keys and values never change. Price: 37.7 MB (16-bit) per 1,024-token GPT-2 small context.">
          <Cache />
        </Panel>
      </Step>

      <Step n={2} title="Why is decode slow? It reads every weight for one token">
        <Panel span={6} title={<>Decode is <Term>memory-bound</Term></>}
          note={<>Speed is set by <Term>memory bandwidth</Term>: GPT-2 small reads 249 MB of weights per step.</>}>
          <Ratio />
        </Panel>
        <Panel span={6} title={<><Term as="batching (serving)">Batching</Term>: one read serves many sequences</>}
          note="256× work, ~7× time; users wait longer. Toy: shared overhead; large models: shared weight reads.">
          <Batching />
        </Panel>
      </Step>

      <Step n={3} title="How do you fit more? Smaller caches and smaller weights">
        <Panel span={6} title={<>Share keys and values: <Term>grouped-query attention</Term></>}
          note="Memory = weights + cache per user × users: 140 GB (16-bit) + 16 × 1.34 ≈ 161.5 GB.">
          <Gqa />
        </Panel>
        <Panel span={6} title={<><Term>Quantization</Term>: fewer bits per weight</>}
          note="Fine to 6 bits, breaks at 3. 70B at 4 bits: 140 → 35 GB, a quarter of the reads.">
          <Quant />
        </Panel>
      </Step>

      <Step n={4} title="Can one pass give several tokens? Yes: guess, then check">
        <Panel span={7} title={<><Term>Speculative decoding</Term>: a <Term>draft model</Term> guesses, the large model checks</>}
          note="152 characters in 41 passes, same output. Pays only with a much cheaper draft.">
          <Speculative />
        </Panel>
        <Panel span={5} title="The rest of the serving stack" className="top">
          <ul className="checklist">
            <li><b>·</b><span><Term>FlashAttention</Term>: exact attention in tiles, never storing the score grid</span></li>
            <li><b>·</b><span><Term>Prefix caching</Term>: reuse caches of shared prompts</span></li>
            <li><b>·</b><span><Term>Continuous batching</Term>: requests join any step</span></li>
            <li><b>·</b><span>stop sequences, streaming</span></li>
          </ul>
        </Panel>
      </Step>

      <Footer guide={guide} />
    </Poster>
  )
}
