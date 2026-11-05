// The one-page visual guide for Guide 3, "Embeddings: giving every token a vector".
// A quick overview in four steps; every example, output and number is the guide's
// (content/03-embeddings.mdx), and the comments name where each comes from.
// tools/check_visuals.py checks the numbers, the terms and the word budget.
import { Arrow, Footer, Masthead, Math, Panel, Poster, Step, Term } from "./poster"

const ACCENT = "#1e3a5f", INK = "#1b1b1f", SOFT = "#3d3d45", MUTED = "#5f5f6a", RULE2 = "#cfcbc0"
const ON = "#e9eef5", OFF = "#f1f0ec", WARN = "#b91c1c", AMBER = "#b45309"
const sans = { fontFamily: "var(--sans)" }
const mono = { fontFamily: "var(--mono)" }
const T = 10, TB = 10.5

// A row of cells with values, for small vectors and matrices.
function Cells({ x, y, vals, w = 18, h = 16, hot = [], dim = false }) {
  return (
    <g>
      {vals.map((v, i) => (
        <g key={i}>
          <rect x={x + i * w} y={y} width={w} height={h} fill={hot.includes(i) ? ON : dim ? OFF : "#fff"} stroke={hot.includes(i) ? ACCENT : RULE2} strokeWidth={hot.includes(i) ? 1 : 0.6} />
          <text x={x + i * w + w / 2} y={y + h / 2 + 3.6} fontSize={TB} textAnchor="middle" fill={hot.includes(i) ? ACCENT : dim ? MUTED : INK} fontWeight={hot.includes(i) ? 700 : 400} style={mono}>{v}</text>
        </g>
      ))}
    </g>
  )
}

// ---------------------------------------------------------------- step 1: a row of a table
// Figure 1: [0 1 0] times a 3 x 2 matrix is its second row, [3 4]; and GPT-2 small's lookup of
// "The cat sat on the" (the table-size block): five rows of a 50,257 x 768 table, X is 5 x 768.
function Lookup() {
  const W = 423
  return (
    <svg viewBox={`0 0 ${W} 84`} role="img" aria-label="The one-hot row 0 1 0 times a three-by-two matrix gives its second row, 3 4">
      <g transform="translate(0 2) scale(1.35)">
        <text x={0} y={8} fontSize={T / 1.35} fill={MUTED} style={sans}>one-hot × matrix</text>
        <Cells x={0} y={30} vals={["0", "1", "0"]} hot={[1]} />
        <text x={64} y={42} fontSize={13} fill={INK} style={sans}>×</text>
        {[["1", "2"], ["3", "4"], ["5", "6"]].map((r, i) => <Cells key={i} x={78} y={12 + i * 18} vals={r} hot={i === 1 ? [0, 1] : []} dim={i !== 1} />)}
        <text x={124} y={42} fontSize={13} fill={INK} style={sans}>=</text>
        <Cells x={138} y={30} vals={["3", "4"]} hot={[0, 1]} />
      </g>
      <text x={262} y={40} fontSize={TB} fill={SOFT} style={sans}>The 1 picks row 2:</text>
      <text x={262} y={55} fontSize={TB} fill={SOFT} style={sans}>a <tspan fontWeight={700} fill={ACCENT}>lookup</tspan> gives the same row.</text>
    </svg>
  )
}

// GPT-2 small's lookup of "The cat sat on the" (the table-size block): five rows of its 50,257 x 768
// table give X, 5 x 768. The rows are drawn schematically, not at their IDs' positions.
function Gpt2Lookup() {
  return (
    <svg viewBox="200 0 358 114" role="img" aria-label="GPT-2 small looks up five rows of its 50,257 by 768 table for The cat sat on the, giving X, one row per token, 5 by 768">
      {["The", "␣cat", "␣sat", "␣on", "␣the"].map((t, i) => (
        <text key={t} x={248} y={30 + i * 16} fontSize={TB} textAnchor="end" fill={INK} style={mono}>{t}</text>
      ))}
      {[464, 3797, 3332, 319, 262].map((id, i) => (
        <g key={id}>
          <text x={254} y={30 + i * 16} fontSize={T} fill={ACCENT} fontWeight={700} style={mono}>{id}</text>
          <Arrow x1={286} y1={26 + i * 16} x2={300} y2={26 + i * 16} color={ACCENT} />
        </g>
      ))}
      <rect x={304} y={14} width={60} height={86} fill={OFF} stroke={MUTED} strokeWidth={0.6} rx={1} />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={304} y={24.5 + i * 16} width={60} height={3} fill={ACCENT} />)}
      <text x={334} y={111} fontSize={T} textAnchor="middle" fill={MUTED} style={mono}>50,257 × 768</text>
      <text x={334} y={9} fontSize={9.4} textAnchor="middle" fill={MUTED} style={sans}>schematic rows</text>
      <Arrow x1={368} y1={57} x2={386} y2={57} />
      <text x={392} y={54} fontSize={TB} fontWeight={700} fill={ACCENT} style={mono}>X: one row per token</text>
      <text x={392} y={68} fontSize={T} fill={MUTED} style={mono}>5 × 768</text>
    </svg>
  )
}

// The one-hot dot product of "cat" and "dog" is 0.0 (12-word vocabulary); width 50,257 against 768.
function OneHot() {
  const W = 294, c = 13
  const row = (y, hot, label) => (
    <g>
      <text x={34} y={y + 10} fontSize={TB} textAnchor="end" fill={INK} style={mono}>{label}</text>
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={40 + i * c} y={y} width={c - 1.5} height={13} fill={i === hot ? ACCENT : "#fff"} stroke={RULE2} strokeWidth={0.6} />
      ))}
    </g>
  )
  return (
    <svg viewBox={`0 0 ${W} 100`} role="img" aria-label="One-hot cat and dog have their 1s in different slots, so their dot product is 0. A one-hot vector for GPT-2 is 50,257 numbers wide; a dense GPT-2 small embedding is 768.">
      <text x={40} y={8} fontSize={T} fill={MUTED} style={sans}>12-word toy</text>
      {row(14, 1, "cat")}
      {row(31, 2, "dog")}
      <text x={40 + 12 * c + 6} y={30} fontSize={TB} fill={INK} style={sans}>dot product</text>
      <text x={40 + 12 * c + 6} y={43} fontSize={13} fontWeight={700} fill={WARN} style={mono}>0</text>
      <text x={0} y={62} fontSize={T} fill={MUTED} style={sans}>numbers per token, GPT-2 small</text>
      <text x={0} y={78} fontSize={TB} fill={INK} style={sans}>one-hot</text>
      <rect x={58} y={69} width={W - 58 - 44} height={11} fill="#aeb7c4" rx={1.4} />
      <text x={W} y={78} fontSize={TB} fontWeight={700} textAnchor="end" fill={INK} style={mono}>50,257</text>
      <text x={0} y={96} fontSize={TB} fill={INK} fontWeight={700} style={sans}>dense</text>
      <rect x={58} y={87} width={globalThis.Math.max(3, (768 / 50257) * (W - 102))} height={11} fill={ACCENT} rx={1} />
      <text x={66} y={96} fontSize={TB} fontWeight={700} fill={ACCENT} style={mono}>768</text>
    </svg>
  )
}

// ---------------------------------------------------------------- step 2: alike, learned
// [1, 0] against [1, 0], [0, 1], [-1, 0]: cosines 1, 0, -1.
function CosineScale() {
  const W = 230, pairs = [[0, "1"], [90, "0"], [180, "−1"]]
  return (
    <svg viewBox={`0 0 ${W} 58`} role="img" aria-label="Same direction: cosine 1. Perpendicular: 0. Opposite: minus 1.">
      {pairs.map(([deg, v], i) => {
        const cx = 38 + i * 77, cy = 30, r = 22, a = (deg * globalThis.Math.PI) / 180
        return (
          <g key={v}>
            <Arrow x1={cx} y1={cy} x2={cx + r} y2={cy} color={ACCENT} w={1.4} />
            <Arrow x1={cx} y1={cy - (deg === 0 ? 5 : 0)} x2={cx + r * globalThis.Math.cos(a) * (deg === 0 ? 0.8 : 1)} y2={cy - (deg === 0 ? 5 : 0) - r * globalThis.Math.sin(a)} color={AMBER} w={1.4} />
            <text x={cx} y={cy + 24} fontSize={TB} fontWeight={700} textAnchor="middle" fill={INK} style={mono}>{v}</text>
          </g>
        )
      })}
    </svg>
  )
}

// Skip-gram on the toy text: a word's row of E (12 x 4) times W (4 x 12), softmax over 12 words.
function SkipGram() {
  const W = 230
  return (
    <svg viewBox={`0 0 ${W} 74`} style={{ overflow: "visible" }} role="img" aria-label="A word's 4-number row of the 12 by 4 table E, times the 4 by 12 matrix W, gives 12 logits; softmax gives a probability for each neighbor">
      <text x={0} y={24} fontSize={12} fontWeight={700} fill={INK} style={mono}>cat</text>
      <Arrow x1={26} y1={20} x2={42} y2={20} />
      <Cells x={46} y={12} vals={["", "", "", ""]} w={10} h={14} hot={[0, 1, 2, 3]} />
      <text x={66} y={40} fontSize={T} textAnchor="middle" fill={MUTED} style={sans}>cat&apos;s row</text>
      <Arrow x1={90} y1={20} x2={112} y2={20} />
      <text x={86} y={7} fontSize={T} fill={INK} style={sans}>× shared W</text>
      {Array.from({ length: 12 }, (_, i) => <rect key={i} x={116 + i * 7} y={12} width={6} height={14} fill="#c9cfd8" stroke={RULE2} strokeWidth={0.4} />)}
      <text x={158} y={40} fontSize={T} textAnchor="middle" fill={MUTED} style={sans}>12 neighbor probabilities</text>
      <text x={0} y={60} fontSize={T} fill={SOFT} style={sans}>12 words, 4 numbers each; pairs ≤ 2 apart</text>
      <text x={0} y={72} fontSize={T} fill={SOFT} style={mono}>(the, cat) (the, sat) (cat, the) …</text>
    </svg>
  )
}

// The trained toy's cosines (the comparison block).
function Similar() {
  const W = 230, rows = [["mat, log", 0.99], ["cat, dog", 0.95], ["sat, ran", 0.86], ["cat, mat", 0.72], ["cat, the", -0.52]]
  const x0 = 120, half = 52, X = (v) => x0 + v * half
  return (
    <svg viewBox={`0 -16 ${W} 112`} role="img" aria-label="Trained cosines: mat and log 0.99, cat and dog 0.95, sat and ran 0.86, cat and mat 0.72, cat and the minus 0.52">
      <text x={0} y={-6} fontSize={T} fill={MUTED} style={sans}>the trained toy</text>
      <line x1={x0} x2={x0} y1={0} y2={92} stroke={MUTED} strokeWidth={0.7} />
      {rows.map(([pair, v], i) => {
        const y = 4 + i * 18, warn = pair === "cat, mat"
        return (
          <g key={pair}>
            <text x={0} y={y + 10} fontSize={TB} fill={INK} style={mono}>{pair}</text>
            <rect x={globalThis.Math.min(x0, X(v))} y={y + 1} width={globalThis.Math.abs(X(v) - x0)} height={11} rx={1.4} fill={warn ? AMBER : v < 0 ? "#aeb7c4" : ACCENT} />
            <text x={v < 0 ? x0 + 4 : X(v) + 4} y={y + 10} fontSize={TB} fontWeight={700} fill={warn ? AMBER : INK} style={mono}>{v.toFixed(2).replace("-", "−")}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------- step 3: inside an LLM
// GPT-2 small: the table's 38,597,376 of 124,439,808 parameters (31.0%); the largest GPT-3: 0.35%.
function TableShare() {
  const W = 358, bw = 300
  return (
    <svg viewBox={`0 0 ${W} 84`} role="img" aria-label="GPT-2 small's embedding table is 31.0% of its parameters; the largest GPT-3 model's would be 0.35%">
      <text x={0} y={9} fontSize={T} fill={MUTED} style={sans}>share of parameters</text>
      <text x={0} y={30} fontSize={TB} fontWeight={600} fill={INK} style={sans}>GPT-2 small</text>
      <rect x={0} y={36} width={bw} height={13} fill={OFF} stroke={RULE2} strokeWidth={0.6} rx={1.5} />
      <rect x={0} y={36} width={bw * 0.31} height={13} fill={ACCENT} rx={1.5} />
      <text x={bw + 6} y={46} fontSize={TB} fontWeight={700} fill={ACCENT} style={mono}>31.0%</text>
      <text x={0} y={64} fontSize={TB} fontWeight={600} fill={INK} style={sans}>largest GPT-3 (same vocabulary)</text>
      <rect x={0} y={70} width={bw} height={13} fill={OFF} stroke={RULE2} strokeWidth={0.6} rx={1.5} />
      <rect x={0} y={70} width={globalThis.Math.max(1.4, bw * 0.0035)} height={13} fill={ACCENT} />
      <text x={bw + 6} y={80} fontSize={TB} fontWeight={700} fill={ACCENT} style={mono}>0.35%</text>
    </svg>
  )
}

// Figure 2: the 12 toy embeddings by PCA (the printed coordinates), 70.4% of the variation kept.
const PCA = [["and", 2.66, 0.45], ["cat", -1.42, 1.57], ["dog", -1.35, 2.01], ["log", -2.37, 0.26], ["mat", -2.37, -0.15],
  ["on", 2.36, 1.57], ["ran", 0.19, -1.36], ["sat", -0.34, -1.97], ["saw", 1.37, -0.87], ["the", 0.19, 0.65],
  ["then", -0.12, -2.68], ["to", 1.21, 0.53]]
function PcaMap() {
  const W = 358, H = 196, k = 36, X = (x) => 70 + (x + 2.6) * k, Y = (y) => 8 + (2.2 - y) * k
  const groups = { mat: 1, log: 1, cat: 2, dog: 2, sat: 3, ran: 3 }
  const dx = { log: -6, mat: -6, cat: -6, dog: 6, and: -6, on: -6, sat: -6, then: -6 }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="The 12 toy embeddings drawn in two dimensions by PCA: mat beside log, cat beside dog, sat near ran">
      <line x1={X(-2.6)} x2={X(2.9)} y1={Y(0)} y2={Y(0)} stroke={RULE2} strokeWidth={0.6} />
      <line x1={X(0)} x2={X(0)} y1={Y(2.2)} y2={Y(-2.9)} stroke={RULE2} strokeWidth={0.6} />
      {PCA.map(([w, x, y]) => {
        const g = groups[w], left = (dx[w] ?? 6) < 0
        return (
          <g key={w}>
            <circle cx={X(x)} cy={Y(y)} r={3} fill={g ? ACCENT : "#aeb7c4"} />
            <text x={X(x) + (dx[w] ?? 6)} y={Y(y) + (w === "mat" ? 8 : w === "log" ? 0 : 3.5)} fontSize={TB} textAnchor={left ? "end" : "start"} fontWeight={g ? 700 : 400} fill={g ? ACCENT : SOFT} style={mono}>{w}</text>
          </g>
        )
      })}
      <text x={W} y={H - 2} fontSize={T} textAnchor="end" fill={MUTED} style={sans}>70.4% variation kept</text>
    </svg>
  )
}

// ---------------------------------------------------------------- the sheet
export default function EmbeddingsSheet({ guide }) {
  return (
    <Poster>
      <Masthead
        guide={guide}
        title="Embeddings"
        subtitle="giving every token a vector"
        thesis={<>Each token ID gets a <em>row of learned numbers</em>; training pulls rows of tokens <em>used alike</em> together.</>}
      />

      <Step n={1} title="What is an embedding? A row of a table, picked by the token ID">
        <Panel span={7} title={<>The <Term>embedding table</Term>: one row per token</>}
          note="Guide 1's one-hot input was a slow way to ask for a row; code indexes it.">
          <Lookup />
        </Panel>
        <Panel span={5} title="One-hot can't say &quot;alike&quot;; a dense vector can"
          note={<>A <Term>dense vector</Term>&apos;s values can all be nonzero, so two can be close.</>}>
          <OneHot />
        </Panel>
      </Step>

      <Step n={2} title="Where do the numbers come from? Predicting neighbors, measured by cosine">
        <Panel span={4} title={<><Term>Cosine similarity</Term>: compare directions</>}
          note="u = [1, 2, 2], v = [2, 1, 2]: 8 / (3 · 3) ≈ 0.889">
          <p className="formula"><Math tex={String.raw`\cos(u,v) = \dfrac{u\cdot v}{\lVert u\rVert\,\lVert v\rVert}`} /></p>
          <CosineScale />
        </Panel>
        <Panel span={4} title={<><Term>Skip-gram</Term>: from a word, predict its neighbors</>}
          note="Same neighbors → same predictions → similar rows.">
          <SkipGram />
        </Panel>
        <Panel span={4} title="Used alike, so pointing alike" className="emb-sim"
          note="The cosine sees contexts: cat ≈ mat, and −0.52 isn't &quot;opposite&quot;.">
          <Similar />
        </Panel>
      </Step>

      <Step n={3} title="How does an LLM get its table? It trains with everything else">
        <Panel span={6} title="The table is a parameter: 31% of GPT-2 small"
          note="It starts random and is trained by the next-token loss.">
          <Gpt2Lookup />
          <p className="emb-calc">50,257 × 768 = <b>38,597,376</b> of 124,439,808</p>
          <TableShare />
        </Panel>
        <Panel span={6} title={<>Drawing 4 numbers in 2 (<Term>PCA</Term>): a hint, not proof</>}
          note="Axes aren't features; no single column means &quot;animal&quot;. Check clusters with cosines.">
          <PcaMap />
        </Panel>
      </Step>

      <Step n={4} title="What can't one vector per token do? Context and order">
        <Panel span={6} title={<>One row, two meanings: a <Term>static embedding</Term></>}
          note={<>Which bank must come from other tokens: a <Term>contextual embedding</Term>, built by later layers.</>}>
          <div className="emb-bank">
            <p>He sat on the river <b>␣bank</b>. <span>→ 3331</span></p>
            <p>She got a <b>␣bank</b> loan. <span>→ 3331</span></p>
            <p className="same">same ID, same row</p>
          </div>
        </Panel>
        <Panel span={6} title="Averaging loses the order"
          note="Guide 4 adds both: attention mixes in other tokens, and positions say where each sits.">
          <div className="emb-bank">
            <p>mean(the cat saw the dog)</p>
            <p>mean(the dog saw the cat)</p>
            <p className="same">equal: who saw whom is gone</p>
          </div>
        </Panel>
      </Step>

      <Footer guide={guide} />
    </Poster>
  )
}
