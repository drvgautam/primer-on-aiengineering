// The one-page visual guide for Guide 4, "Attention: letting tokens look at each other".
// A quick overview in four steps; every example, output and number is the guide's
// (content/04-attention.mdx), and the comments name where each comes from.
// tools/check_visuals.py checks the numbers, the terms and the word budget.
import { Arrow, Footer, Masthead, Math, Panel, Poster, Step, Term } from "./poster"

const ACCENT = "#1e3a5f", INK = "#1b1b1f", SOFT = "#3d3d45", MUTED = "#5f5f6a", RULE2 = "#cfcbc0"
const ON = "#e9eef5", OFF = "#f1f0ec", WARN = "#b91c1c", PASS = "#0f7b4a"
const sans = { fontFamily: "var(--sans)" }
const mono = { fontFamily: "var(--mono)" }
const T = 10, TB = 10.5

// ---------------------------------------------------------------- step 1: why, and the soft lookup
// The first block: the lowest possible loss on Guide 1's toy text with k characters of context.
function Floors() {
  const W = 294, H = 128, x0 = 26, y0 = 14, ph = 84, rows = [[0, 2.318], [1, 0.884], [2, 0.337], [3, 0.296], [4, 0.212], [5, 0.179]]
  const bw = 34, gap = (W - x0 - rows.length * bw) / rows.length, y = (v) => y0 + ph - (v / 2.318) * ph
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Lowest possible loss on the toy text with 0 to 5 characters of context: 2.318, 0.884, 0.337, 0.296, 0.212, 0.179">
      {rows.map(([k, v], i) => {
        const x = x0 + i * (bw + gap)
        return (
          <g key={k}>
            <rect x={x} y={y(v)} width={bw} height={y(0) - y(v)} rx={1.6} fill={k === 1 ? "#aeb7c4" : ACCENT} />
            <text x={x + bw / 2} y={y(v) - 3} fontSize={T} textAnchor="middle" fill={INK} style={mono}>{v.toFixed(3)}</text>
            <text x={x + bw / 2} y={y(0) + 12} fontSize={TB} textAnchor="middle" fontWeight={700} fill={INK} style={mono}>{k}</text>
          </g>
        )
      })}
      <text x={x0 + (bw + gap) + bw / 2} y={y(0.884) - 15} fontSize={T} textAnchor="middle" fill={MUTED} style={sans}>Guide 1</text>
      <text x={0} y={H - 1} fontSize={T} fill={MUTED} style={sans}>characters of context</text>
    </svg>
  )
}

// Figure 1: the query of "sat" [1, 0] against the keys of "the cat sat"; scores 0, 2, 1;
// weights 0.090, 0.665, 0.245; output [0.335, 0.910].
function SoftLookup() {
  const W = 423
  const rows = [["the", "[0, 0]", "0", 0.090, "[1, 0]"], ["cat", "[2, 0]", "2", 0.665, "[0, 1]"], ["sat", "[1, 1]", "1", 0.245, "[1, 1]"]]
  const cx = { tok: 0, key: 40, score: 118, w: 170, val: 300 }
  return (
    <svg viewBox={`0 0 ${W} 120`} role="img" aria-label="The query of sat, 1 0, scored against the keys of the, cat, sat gives 0, 2, 1; softmax gives weights 0.090, 0.665, 0.245; the weighted sum of the values is 0.335, 0.910">
      <text x={cx.tok} y={9} fontSize={T} fill={MUTED} style={sans}>query of sat: <tspan fill={ACCENT} fontWeight={700} style={mono}>[1, 0]</tspan></text>
      {[["key", cx.key], ["q·k", cx.score + 6], ["softmax", cx.w], ["value", cx.val]].map(([h, x]) => (
        <text key={h} x={x} y={26} fontSize={T} fill={MUTED} style={sans}>{h}</text>
      ))}
      {rows.map(([t, k, sc, w, v], i) => {
        const y = 42 + i * 20, top = t === "cat"
        return (
          <g key={t}>
            <text x={cx.tok} y={y} fontSize={TB} fontWeight={700} fill={INK} style={mono}>{t}</text>
            <text x={cx.key} y={y} fontSize={TB} fill={INK} style={mono}>{k}</text>
            <text x={cx.score + 14} y={y} fontSize={TB} textAnchor="middle" fill={INK} style={mono}>{sc}</text>
            <rect x={cx.w} y={y - 10} width={w * 120} height={12} rx={1.5} fill={top ? ACCENT : "#aeb7c4"} />
            <text x={cx.w + w * 120 + 4} y={y} fontSize={TB} fontWeight={top ? 700 : 400} fill={INK} style={mono}>{w.toFixed(3)}</text>
            <text x={cx.val} y={y} fontSize={TB} fill={INK} style={mono}>× {v}</text>
          </g>
        )
      })}
      <line x1={cx.val - 30} x2={W} y1={92} y2={92} stroke={RULE2} strokeWidth={0.7} />
      <text x={cx.w} y={110} fontSize={T} fill={MUTED} style={sans}>new vector</text>
      <text x={W} y={110} fontSize={13} fontWeight={700} textAnchor="end" fill={ACCENT} style={mono}>[0.335, 0.910]</text>
    </svg>
  )
}

// ---------------------------------------------------------------- step 2: the equation
// The scaling block: dot-product spread 1.98 at width 4, 8.01 at 64; the largest of 16 weights
// averages 0.843, and 0.247 after dividing by the square root of 64.
function Scaling() {
  const W = 358, bw = 150, x0 = 150
  return (
    <svg viewBox={`0 0 ${W} 98`} role="img" aria-label="Dot products spread 1.98 at width 4 and 8.01 at width 64. The largest of 16 weights averages 0.843 unscaled and 0.247 scaled.">
      <text x={0} y={9} fontSize={T} fill={MUTED} style={sans}>spread of q·k, random vectors</text>
      {[["width 4", 1.98], ["width 64", 8.01]].map(([l, v], i) => (
        <g key={l}>
          <text x={x0 - 6} y={26 + i * 16} fontSize={TB} textAnchor="end" fill={INK} style={sans}>{l}</text>
          <rect x={x0} y={17 + i * 16} width={(v / 8.01) * bw} height={11} rx={1.4} fill={i ? WARN : "#aeb7c4"} />
          <text x={x0 + (v / 8.01) * bw + 4} y={26 + i * 16} fontSize={TB} fontWeight={700} fill={INK} style={mono}>{v.toFixed(2)}</text>
        </g>
      ))}
      <line x1={0} x2={W} y1={52} y2={52} stroke={RULE2} strokeWidth={0.5} />
      <text x={0} y={64} fontSize={T} fill={MUTED} style={sans}>mean top weight, 16 keys</text>
      {[["unscaled", 0.843, WARN], ["÷ √64", 0.247, PASS]].map(([l, v, c], i) => (
        <g key={l}>
          <text x={x0 - 6} y={81 + i * 15} fontSize={TB} textAnchor="end" fill={INK} style={sans}>{l}</text>
          <rect x={x0} y={72 + i * 15} width={v * bw} height={11} rx={1.4} fill={c} />
          <text x={x0 + v * bw + 4} y={81 + i * 15} fontSize={TB} fontWeight={700} fill={INK} style={mono}>{v.toFixed(3)}</text>
        </g>
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------- step 3: mask and heads
// Figure 2: the causal mask on the running example, filled with the untrained toy weights.
const GRID = [[1.000], [0.619, 0.381], [0.757, 0.140, 0.103], [0.042, 0.017, 0.899, 0.042], [0.081, 0.215, 0.135, 0.488, 0.081]]
function Mask() {
  const W = 358, words = ["the", "cat", "sat", "on", "the"], c = 28, x0 = 40, y0 = 22
  return (
    <svg viewBox={`0 0 ${W} ${y0 + 5 * c + 4}`} role="img" aria-label="A 5 by 5 grid of weights for the cat sat on the. Cells above the diagonal are masked to 0; every row sums to 1.">
      {words.map((w, j) => <text key={`c${j}`} x={x0 + j * c + c / 2} y={y0 - 6} fontSize={T} textAnchor="middle" fill={MUTED} style={mono}>{w}</text>)}
      {words.map((w, i) => (
        <g key={`r${i}`}>
          <text x={x0 - 6} y={y0 + i * c + c / 2 + 3.5} fontSize={T} textAnchor="end" fill={INK} style={mono}>{w}</text>
          {words.map((_, j) => {
            const v = GRID[i][j], allowed = j <= i
            return (
              <g key={j}>
                <rect x={x0 + j * c} y={y0 + i * c} width={c - 2} height={c - 2} rx={2}
                  fill={allowed ? `rgba(30,58,95,${0.12 + 0.88 * v})` : "#fff"} stroke={allowed ? "none" : RULE2} strokeWidth={0.8} strokeDasharray={allowed ? undefined : "2 2"} />
                <text x={x0 + j * c + (c - 2) / 2} y={y0 + i * c + (c - 2) / 2 + 3.5} fontSize={9.2} textAnchor="middle"
                  fill={allowed ? (v > 0.45 ? "#fff" : INK) : MUTED} style={mono}>{allowed ? (v === 1 ? "1.00" : v.toFixed(3).replace(/^0/, "")) : ""}</text>
              </g>
            )
          })}
        </g>
      ))}
      <text x={x0 + 5 * c + 12} y={y0 + 4} fontSize={T} fill={MUTED} style={sans}>weights untrained</text>
      <text x={x0 + 5 * c + 12} y={y0 + 24} fontSize={T} fill={MUTED} style={sans}>rows: queries, columns: keys</text>
      <text x={x0 + 5 * c + 12} y={y0 + 60} fontSize={T} fill={INK} style={sans}>blank: −∞ added, weight 0</text>
      <text x={x0 + 5 * c + 12} y={y0 + 88} fontSize={T} fill={INK} style={sans}>rows sum to 1</text>
    </svg>
  )
}

// Figure 3 and the shapes block: 12 heads of width 64 read the same X; joined to 768, mixed by W^O.
function Heads() {
  const W = 358
  return (
    <svg viewBox={`0 0 ${W} 108`} role="img" aria-label="Twelve heads of width 64 read the same 5 by 768 X; their outputs are joined side by side into 768 numbers and mixed by W O">
      <text x={152} y={10} fontSize={T} fill={SOFT} style={sans}>← one head: one blend</text>
      <rect x={0} y={50} width={46} height={30} rx={3} fill={ON} stroke={ACCENT} strokeWidth={0.9} />
      <text x={23} y={69} fontSize={TB} fontWeight={700} textAnchor="middle" fill={ACCENT} style={mono}>X</text>
      <text x={23} y={94} fontSize={T} textAnchor="middle" fill={MUTED} style={mono}>5 × 768</text>
      {Array.from({ length: 12 }, (_, i) => {
        const y = 4 + i * 8.4
        return (
          <g key={i}>
            <line x1={46} y1={65} x2={84} y2={y + 4} stroke={RULE2} strokeWidth={0.6} />
            <rect x={86} y={y} width={60} height={6.6} rx={1.2} fill={i === 0 ? ACCENT : "#aeb7c4"} />
            <rect x={176 + i * 9} y={50} width={8} height={30} fill={i === 0 ? ACCENT : "#aeb7c4"} />
          </g>
        )
      })}
      <text x={0} y={16} fontSize={T} fill={INK} style={sans}>12 heads,</text>
      <text x={0} y={29} fontSize={T} fill={INK} style={sans}>width 64</text>
      <Arrow x1={148} y1={65} x2={172} y2={65} />
      <text x={230} y={44} fontSize={T} textAnchor="middle" fill={MUTED} style={sans}>side by side</text>
      <text x={230} y={94} fontSize={T} textAnchor="middle" fill={MUTED} style={mono}>12 × 64 = 768</text>
      <Arrow x1={286} y1={65} x2={302} y2={65} />
      <rect x={306} y={50} width={52} height={30} rx={3} fill={ON} stroke={ACCENT} strokeWidth={0.9} />
      <text x={332} y={69} fontSize={TB} fontWeight={700} textAnchor="middle" fill={ACCENT} style={mono}>× W<tspan fontSize={9.4} dy={-4}>O</tspan></text>
      <text x={332} y={94} fontSize={T} textAnchor="middle" fill={MUTED} style={mono}>5 × 768</text>
    </svg>
  )
}

// ---------------------------------------------------------------- step 4: order and price
// The order block: with no mask and no positions, "saw" gets the same output in both sentences;
// with random position vectors, outputs differ by up to 0.749.
function Order() {
  return (
    <div className="at-order">
      <div className="at-sent"><code>the cat <b>saw</b> the dog</code><code>the dog <b>saw</b> the cat</code></div>
      <div className="at-res">
        <span className="k">no positions, mask off</span><span>reversed words → reversed outputs; saw <b className="mark-fail">identical</b> in both</span>
        <span className="k">+ position vectors</span><span>reversal check fails: up to <b className="mark-pass">0.749</b> apart</span>
      </div>
      <p className="at-eq"><Math tex={String.raw`X = W_E[\text{ids}] + W_P[0,\ldots,n-1]`} /></p>
    </div>
  )
}

// The price block: scores per head grow with n²: 25 for the running example, 1,048,576 at 1,024.
function Cost() {
  const W = 358
  return (
    <svg viewBox={`0 0 ${W} 112`} role="img" aria-label="Scores per head: 25 for 5 tokens, 1,048,576 for 1,024 tokens; doubling the length quadruples the count">
      {[1, 2].map((m, i) => {
        const s = 22 * m, x = 10 + i * 46
        return (
          <g key={m}>
            <rect x={x} y={60 - s} width={s} height={s} fill={ON} stroke={ACCENT} strokeWidth={0.8} />
            {m === 2 ? <path d={`M ${x} ${60 - s / 2} h ${s} M ${x + s / 2} ${60 - s} v ${s}`} stroke={ACCENT} strokeWidth={0.5} /> : null}
            <text x={x + s / 2} y={74} fontSize={T} textAnchor="middle" fill={INK} style={mono}>{m === 1 ? "n" : "2n"}</text>
          </g>
        )
      })}
      <text x={10} y={92} fontSize={T} fill={SOFT} style={sans}>2× tokens,</text>
      <text x={10} y={105} fontSize={T} fill={SOFT} style={sans}>4× scores</text>
      <text x={140} y={22} fontSize={T} fill={MUTED} style={sans}>scores per head</text>
      <text x={140} y={46} fontSize={TB} fill={INK} style={sans}>5 tokens</text>
      <text x={W} y={46} fontSize={13} fontWeight={700} textAnchor="end" fill={INK} style={mono}>25</text>
      <text x={140} y={72} fontSize={TB} fill={INK} style={sans}>1,024 tokens</text>
      <text x={W} y={72} fontSize={13} fontWeight={700} textAnchor="end" fill={WARN} style={mono}>1,048,576</text>
    </svg>
  )
}

// ---------------------------------------------------------------- the sheet
export default function AttentionSheet({ guide }) {
  return (
    <Poster>
      <Masthead
        guide={guide}
        title="Attention"
        subtitle="letting tokens look at each other"
        thesis={<>Each token&apos;s new vector <em>mixes</em> its own and earlier tokens&apos; values, weighted by <em>query–key match</em>.</>}
      />

      <Step n={1} title="Why look at other tokens? More context, better predictions">
        <Panel span={5} title="Lowest loss drops with context"
          note="Later bars overstate: only 128 characters of text.">
          <Floors />
        </Panel>
        <Panel span={7} title={<>A <Term>soft lookup</Term>: score every <Term>key</Term>, mix the <Term as="value">values</Term></>}
          note={<>The <Term>query</Term> matched cat&apos;s key best.</>}>
          <SoftLookup />
        </Panel>
      </Step>

      <Step n={2} title="Where do queries, keys and values come from? Three learned matrices, shared by every position">
        <Panel span={6} title={<><Term>Scaled dot-product attention</Term></>}
          note={<>GPT-2 small, 5 tokens: X 5 × 768 → Q, K 5 × 64 → scores 5 × 5.</>}>
          <p className="formula"><Math tex={String.raw`Q = XW^Q,\quad K = XW^K,\quad V = XW^V`} /></p>
          <p className="formula at-big"><Math display tex={String.raw`\operatorname{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right) V`} /></p>
          <p className="at-key">X: one row per token · <Math tex="d_k" />: query and key width</p>
        </Panel>
        <Panel span={6} title={<>Why √d<sub>k</sub>? Wide vectors skew the softmax</>}
          note="A skewed softmax barely moves when nudged; learning nearly stops.">
          <Scaling />
        </Panel>
      </Step>

      <Step n={3} title="How does it stay honest, and see more? A mask, and many heads">
        <Panel span={6} title={<>The <Term>causal mask</Term>: no drawing from later tokens</>}
          note="Training predicts all positions at once; unmasked, cat could copy sat.">
          <Mask />
        </Panel>
        <Panel span={6} title={<><Term>Multi-head attention</Term>: 12 patterns at once</>}
          note="Q, K, V, O for all heads: 4 × 768² = 2,359,296 per layer.">
          <Heads />
        </Panel>
      </Step>

      <Step n={4} title="What does it miss, and what does it cost? Order, and n²">
        <Panel span={6} title={<>A weighted sum ignores order: add a <Term>position vector</Term></>}
          note={<><Math tex="W_P" />, the <Term>position table</Term>: 1,024 rows, so max 1,024 tokens.</>}>
          <Order />
        </Panel>
        <Panel span={6} title="Every token scores every token"
          note="Guide 10 avoids recomputing it with a key-value cache.">
          <Cost />
        </Panel>
      </Step>

      <Footer guide={guide} />
    </Poster>
  )
}
