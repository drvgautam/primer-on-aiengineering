// The one-page visual guide for Guide 5, "The transformer: blocks, stacks and a model that works".
// A quick overview in four steps; every example, output and number is the guide's
// (content/05-transformer.mdx), and the comments name where each comes from.
// tools/check_visuals.py checks the numbers, the terms and the word budget.
import { Arrow, Footer, Masthead, Math, Panel, Poster, Step, Term } from "./poster"

const ACCENT = "#1e3a5f", INK = "#1b1b1f", SOFT = "#3d3d45", MUTED = "#5f5f6a", RULE2 = "#cfcbc0"
const ON = "#e9eef5", OFF = "#f1f0ec", WARN = "#b91c1c", PASS = "#0f7b4a", AMBER = "#b45309"
const sans = { fontFamily: "var(--sans)" }
const mono = { fontFamily: "var(--mono)" }
const T = 10, TB = 10.5

// ---------------------------------------------------------------- step 1: compute and depth
// The MLP's widths in GPT-2 small (768 -> 3,072 -> 768) and one block's parameters (the table).
function Mlp() {
  const W = 358, bw = 200
  return (
    <svg viewBox={`0 0 ${W} 124`} role="img" aria-label="The MLP widens each token's row from 768 to 3,072 numbers and back, through GELU. In one GPT-2 small block, attention has 2,362,368 parameters and the MLP 4,722,432.">
      {[[0, 768, "768"], [1, 3072, "3,072 = 4 × 768"], [2, 768, "768"]].map(([i, v, l]) => {
        const h = (v / 3072) * 58, x = 8 + i * 74
        return (
          <g key={i}>
            <rect x={x} y={32 - h / 2} width={14} height={h} rx={2} fill={i === 1 ? ACCENT : ON} stroke={ACCENT} strokeWidth={0.8} />
            <text x={x + 7} y={74} fontSize={T} textAnchor="middle" fill={MUTED} style={mono}>{l}</text>
            {i < 2 ? <Arrow x1={x + 18} y1={32} x2={x + 70} y2={32} /> : null}
          </g>
        )
      })}
      <text x={52} y={26} fontSize={T} textAnchor="middle" fill={INK} style={sans}>W₁, GELU</text>
      <text x={44} y={46} fontSize={9.4} textAnchor="middle" fill={MUTED} style={sans}>(smooth ReLU)</text>
      <text x={126} y={26} fontSize={T} textAnchor="middle" fill={INK} style={sans}>W₂</text>
      <text x={172} y={20} fontSize={T} fill={SOFT} style={sans}>GELU: the activation</text>
      <text x={172} y={33} fontSize={T} fill={SOFT} style={sans}>attention lacks</text>
      <text x={74} y={92} fontSize={T} fill={MUTED} style={sans}>parameters, one block</text>
      {[["attention", 2362368, "#aeb7c4"], ["MLP", 4722432, ACCENT]].map(([l, v, c], i) => (
        <g key={l}>
          <text x={68} y={106 + i * 14} fontSize={TB} textAnchor="end" fill={INK} fontWeight={i ? 700 : 400} style={sans}>{l}</text>
          <rect x={74} y={97 + i * 14} width={(v / 4722432) * bw} height={11} rx={1.4} fill={c} />
          <text x={78 + (v / 4722432) * bw} y={106 + i * 14} fontSize={TB} fontWeight={700} fill={INK} style={mono}>{v.toLocaleString("en-US")}</text>
        </g>
      ))}
    </svg>
  )
}

// The residual stream: each part reads a normalized copy and adds its output back.
function Stream() {
  const W = 358, sx = 40
  const parts = [["attention", 70], ["MLP", 30]]
  return (
    <svg viewBox={`0 0 ${W} 124`} role="img" aria-label="A token's residual stream runs upward; attention and the MLP each read a normalized copy and add their output back">
      <Arrow x1={sx} y1={122} x2={sx} y2={4} color={ACCENT} w={2.4} />
      <text x={sx + 8} y={118} fontSize={T} fill={MUTED} style={sans}>embedding + position</text>
      {parts.map(([p, y]) => (
        <g key={p}>
          <path d={`M ${sx} ${y + 16} H ${sx + 34}`} stroke={MUTED} strokeWidth={0.8} fill="none" />
          <rect x={sx + 34} y={y + 9} width={24} height={14} rx={2} fill={OFF} stroke={RULE2} strokeWidth={0.6} />
          <text x={sx + 46} y={y + 19} fontSize={9.4} textAnchor="middle" fill={SOFT} style={sans}>LN</text>
          <rect x={sx + 64} y={y + 4} width={70} height={24} rx={3} fill={ON} stroke={ACCENT} strokeWidth={0.9} />
          <text x={sx + 99} y={y + 20} fontSize={TB} fontWeight={700} textAnchor="middle" fill={ACCENT} style={sans}>{p}</text>
          <path d={`M ${sx + 134} ${y + 16} H ${sx + 146} V ${y - 4} H ${sx + 9}`} stroke={MUTED} strokeWidth={0.8} fill="none" />
          <circle cx={sx} cy={y - 4} r={7} fill="#fff" stroke={ACCENT} strokeWidth={1.2} />
          <text x={sx} y={y} fontSize={12} fontWeight={700} textAnchor="middle" fill={ACCENT} style={sans}>+</text>
        </g>
      ))}
      <text x={210} y={40} fontSize={TB} fill={INK} style={sans}>adds a change;</text>
      <text x={210} y={54} fontSize={TB} fill={INK} style={sans}>never replaces it</text>
      <text x={210} y={84} fontSize={T} fill={MUTED} style={sans}>LN of [2, 4, 6, 8] =</text>
      <text x={210} y={98} fontSize={T} fill={SOFT} style={mono}>[−1.342, −0.447,</text>
      <text x={210} y={110} fontSize={T} fill={SOFT} style={mono}> 0.447, 1.342]</text>
    </svg>
  )
}

// ---------------------------------------------------------------- step 2: the block and the stack
// The budget block: GPT-2 small's 124,439,808 parameters by stage.
function Budget() {
  const W = 294, bw = W
  const parts = [["token embeddings", 38597376, "#c3c8d0"], ["position vectors", 786432, "#8d939c"], ["12 blocks", 85054464, "#4a4f57"], ["final layer norm", 1536, "#e0b58a"]]
  let x = 0
  return (
    <svg viewBox={`0 0 ${W} 112`} role="img" aria-label="GPT-2 small's 124,439,808 parameters: 38,597,376 in token embeddings, 786,432 in position vectors, 85,054,464 in 12 blocks, 1,536 in the final layer norm">
      {parts.map(([l, v, c]) => {
        const w = (v / 124439808) * bw, r = <rect key={l} x={x} y={10} width={globalThis.Math.max(w, 0.8)} height={20} fill={c} />
        x += w
        return r
      })}
      {parts.map(([l, v, c], i) => (
        <g key={`k${l}`}>
          <rect x={0} y={44 + i * 15} width={9} height={9} rx={1.4} fill={c} />
          <text x={14} y={52 + i * 15} fontSize={TB} fill={INK} style={sans}>{l}</text>
          <text x={W} y={52 + i * 15} fontSize={TB} textAnchor="end" fontWeight={i === 2 ? 700 : 400} fill={INK} style={mono}>{v.toLocaleString("en-US")}</text>
        </g>
      ))}
      <line x1={0} x2={W} y1={102} y2={102} stroke={RULE2} strokeWidth={0.6} />
      <text x={W} y={113} fontSize={TB} textAnchor="end" fontWeight={700} fill={ACCENT} style={mono}>124,439,808</text>
    </svg>
  )
}

// ---------------------------------------------------------------- step 3: it works, and memorizes
// TinyGPT's training losses (0, 50, 100, 200, 500 steps) against Guide 1's 0.884.
function Training() {
  const W = 230, H = 124, x0 = 26, xw = 198, y0 = 16, yh = 86, X = (s) => x0 + (s / 500) * xw, Y = (l) => y0 + yh - (l / 3.4) * yh
  const run = [[0, 3.306], [50, 0.615], [100, 0.212], [200, 0.157], [500, 0.152]]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="TinyGPT's loss: 3.306 at the start, 0.615 after 50 steps, 0.212 after 100, 0.157 after 200, 0.152 after 500, below Guide 1's 0.884">
      <line x1={x0} x2={x0 + xw} y1={Y(0)} y2={Y(0)} stroke={RULE2} strokeWidth={0.7} />
      <line x1={x0} x2={x0 + xw} y1={Y(0.884)} y2={Y(0.884)} stroke={MUTED} strokeWidth={0.9} strokeDasharray="4 2" />
      <text x={x0 + xw} y={Y(0.884) - 4} fontSize={T} textAnchor="end" fill={MUTED} style={sans}>Guide 1 stalled: 0.884</text>
      <polyline points={run.map(([s, l]) => `${X(s)},${Y(l)}`).join(" ")} fill="none" stroke={ACCENT} strokeWidth={1} strokeDasharray="2 2" />
      {run.map(([s, l]) => <circle key={s} cx={X(s)} cy={Y(l)} r={2.6} fill={ACCENT} />)}
      <text x={X(0) + 6} y={Y(3.306) + 4} fontSize={T} fill={INK} style={mono}>3.306</text>
      <text x={X(500)} y={Y(0.152) - 5} fontSize={TB} fontWeight={700} textAnchor="end" fill={ACCENT} style={mono}>0.152</text>
      <text x={x0 - 4} y={y0 - 4} fontSize={T} textAnchor="end" fill={MUTED} style={sans}>loss</text>
      {[0, 100, 500].map((s) => <text key={s} x={X(s)} y={Y(0) + 12} fontSize={T} textAnchor={s === 500 ? "end" : "middle"} fill={MUTED} style={mono}>{s === 500 ? "500 steps" : s}</text>)}
    </svg>
  )
}

// The by-position block: model loss and floor for 1 to 16 characters of context.
const BYPOS = [[0.874, 0.869], [0.304, 0.301], [0.300, 0.298], [0.206, 0.205], [0.170, 0.169], [0.127, 0.125], [0.110, 0.108], [0.110, 0.108],
  [0.103, 0.101], [0.051, 0.050], [0.038, 0.037], [0.026, 0.025], [0.014, 0.012], [0.001, 0.000], [0.001, 0.000], [0.001, 0.000]]
function ByPosition() {
  const W = 230, H = 124, x0 = 26, xw = 198, y0 = 16, yh = 86, X = (k) => x0 + ((k - 1) / 15) * xw, Y = (l) => y0 + yh - (l / 0.9) * yh
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Loss by position in the window, 1 to 16 characters of context: the model sits on the floor at every position, from 0.874 against 0.869 at one character to 0.001 against 0.000 from 14 on">
      <line x1={x0} x2={x0 + xw} y1={Y(0)} y2={Y(0)} stroke={RULE2} strokeWidth={0.7} />
      <polyline points={BYPOS.map(([, f], i) => `${X(i + 1)},${Y(f)}`).join(" ")} fill="none" stroke={PASS} strokeWidth={4} strokeOpacity={0.45} />
      <polyline points={BYPOS.map(([m], i) => `${X(i + 1)},${Y(m)}`).join(" ")} fill="none" stroke={ACCENT} strokeWidth={1.2} />
      {BYPOS.map(([m], i) => <circle key={i} cx={X(i + 1)} cy={Y(m)} r={1.8} fill={ACCENT} />)}
      <text x={X(1) + 6} y={Y(0.874) + 4} fontSize={T} fill={INK} style={mono}>0.874</text>
      <text x={x0 - 4} y={y0 - 4} fontSize={T} textAnchor="end" fill={MUTED} style={sans}>loss</text>
      <line x1={X(8)} x2={X(8) + 14} y1={Y(0.45) - 3.5} y2={Y(0.45) - 3.5} stroke={ACCENT} strokeWidth={1.4} />
      <text x={X(8) + 18} y={Y(0.45)} fontSize={T} fill={ACCENT} style={sans}>model</text>
      <line x1={X(8)} x2={X(8) + 14} y1={Y(0.45) + 9.5} y2={Y(0.45) + 9.5} stroke={PASS} strokeWidth={4} strokeOpacity={0.45} />
      <text x={X(8) + 18} y={Y(0.45) + 13} fontSize={T} fill={PASS} style={sans}>floor</text>
      {[1, 8, 16].map((k) => <text key={k} x={X(k)} y={Y(0) + 12} fontSize={T} textAnchor={k === 16 ? "end" : "middle"} fill={MUTED} style={mono}>{k === 16 ? "16 chars" : k}</text>)}
    </svg>
  )
}

// ---------------------------------------------------------------- step 4: taking pieces away
// The ablation block: 8 blocks, 300 steps; and the trained heads' weight on the previous character.
function Ablation() {
  const W = 487, rows = [["full block", 0.910, 0.153], ["no residual", 0.030, 2.319], ["no normalization", 0.809, 0.152]]
  const lx = 350, lw = 100
  return (
    <svg viewBox={`0 0 ${W} 88`} role="img" aria-label="Eight-block models after 300 steps: full block loss 0.153; no residual 2.319, the no-context floor; no normalization 0.152. Before training the no-residual model's positions were almost identical: 0.030 against 0.910.">
      <text x={130} y={9} fontSize={T} fill={MUTED} style={sans}>positions distinct, untrained</text>
      <text x={lx} y={9} fontSize={T} fill={MUTED} style={sans}>loss after 300 steps</text>
      {rows.map(([l, sp, loss], i) => {
        const y = 22 + i * 22, bad = i === 1
        return (
          <g key={l}>
            <text x={122} y={y + 10} fontSize={TB} textAnchor="end" fontWeight={600} fill={bad ? WARN : INK} style={sans}>{l}</text>
            <rect x={130} y={y + 1} width={sp * 90} height={11} rx={1.4} fill={bad ? WARN : "#aeb7c4"} />
            <text x={134 + sp * 90} y={y + 10} fontSize={TB} fill={INK} style={mono}>{sp.toFixed(3)}</text>
            <rect x={lx} y={y + 1} width={(loss / 2.4) * lw} height={11} rx={1.4} fill={bad ? WARN : "#6b6b76"} />
            <text x={lx + (loss / 2.4) * lw + 4} y={y + 10} fontSize={TB} fontWeight={700} fill={INK} style={mono}>{loss.toFixed(3)}</text>
          </g>
        )
      })}
      <line x1={lx + (2.318 / 2.4) * lw} x2={lx + (2.318 / 2.4) * lw} y1={16} y2={86} stroke={INK} strokeWidth={0.8} strokeDasharray="2 2" />
    </svg>
  )
}

function Heads() {
  const W = 230, rows = [["block 1", [0.33, 0.24, 0.46, 0.18]], ["block 2", [0.19, 0.2, 0.2, 0.42]]], x0 = 50, cw = 45
  return (
    <svg viewBox={`0 0 ${W} 82`} role="img" aria-label="Each trained head's average weight on the previous character: block 1: 0.33, 0.24, 0.46, 0.18; block 2: 0.19, 0.2, 0.2, 0.42; even spreading would give about 0.16">
      {[1, 2, 3, 4].map((h) => <text key={h} x={x0 + (h - 1) * cw + cw / 2} y={9} fontSize={T} textAnchor="middle" fill={MUTED} style={sans}>head {h}</text>)}
      {rows.map(([b, vals], i) => (
        <g key={b}>
          <text x={0} y={30 + i * 26} fontSize={TB} fill={INK} style={sans}>{b}</text>
          {vals.map((v, j) => (
            <g key={j}>
              <rect x={x0 + j * cw + 2} y={16 + i * 26} width={cw - 4} height={20} rx={2} fill={`rgba(30,58,95,${v * 1.9})`} />
              <text x={x0 + j * cw + cw / 2} y={30 + i * 26} fontSize={TB} textAnchor="middle" fontWeight={v > 0.4 ? 700 : 400} fill={v > 0.3 ? "#fff" : INK} style={mono}>{v.toFixed(2)}</text>
            </g>
          ))}
        </g>
      ))}
      <text x={0} y={80} fontSize={T} fill={MUTED} style={sans}>even spreading: about 0.16</text>
    </svg>
  )
}

// Figure 2's path through GPT-2 small: embeddings and positions, 12 blocks, the final layer norm, the
// output layer (the embedding table reused); the stream is n x 768 at every level.
function Stack() {
  const W = 206, rows = [["output layer → logits", OFF], ["final layer norm", OFF], ["block × 12", ON], ["embedding + position", OFF]]
  return (
    <svg viewBox={`0 0 ${W} 124`} role="img" aria-label="Bottom to top: embedding plus position, 12 blocks, the final layer norm, the output layer giving logits; n by 768 at every level">
      {rows.map(([l, f], i) => (
        <g key={l}>
          <rect x={0} y={4 + i * 28} width={140} height={20} rx={3} fill={f} stroke={f === ON ? ACCENT : RULE2} strokeWidth={f === ON ? 1.1 : 0.7} />
          <text x={70} y={18 + i * 28} fontSize={TB} textAnchor="middle" fontWeight={f === ON ? 700 : 400} fill={f === ON ? ACCENT : INK} style={sans}>{l}</text>
          {i < 3 ? <Arrow x1={70} y1={4 + (i + 1) * 28} x2={70} y2={26 + i * 28} /> : null}
        </g>
      ))}
      <text x={148} y={60} fontSize={T} fill={MUTED} style={mono}>n × 768</text>
      <text x={148} y={73} fontSize={T} fill={MUTED} style={sans}>throughout</text>
    </svg>
  )
}

// ---------------------------------------------------------------- the sheet
export default function TransformerSheet({ guide }) {
  return (
    <Poster>
      <Masthead
        guide={guide}
        title="The transformer"
        subtitle="blocks, stacks and a model that works"
        thesis={<>Tokens <em>draw on earlier ones</em>, then each <em>works alone</em>; adding both to a running vector lets blocks stack.</>}
      />

      <Step n={1} title="What's missing after attention? Compute (MLP) and depth (residuals, LN)">
        <Panel span={6} title={<>The <Term>MLP</Term>: Guide 1&apos;s network, on every token</>}
          note="In GPT-2 small the MLP, not attention, holds two-thirds of a block.">
          <Mlp />
        </Panel>
        <Panel span={6} title={<><Term as="residual connection">Residual connections</Term> and <Term>layer normalization</Term></>}
          note={<>The <Term>residual stream</Term> carries each token&apos;s embedding and position up. LN rescales the copy each part reads; the stream itself isn&apos;t normalized.</>}>
          <Stream />
        </Panel>
      </Step>

      <Step n={2} title="How do the pieces fit? One block, stacked 12 times">
        <Panel span={7} title={<>A <Term>transformer block</Term> is two lines</>}
          note={<>Same shape out as in (5 × 768 for &quot;The cat sat on the&quot;), so blocks chain.</>}>
          <div className="tf-block">
            <div>
              <p className="formula tf-eq"><Math display tex={String.raw`\begin{aligned} X &\leftarrow X + \operatorname{MultiHead}(\operatorname{LN}_1(X)) \\ X &\leftarrow X + \operatorname{MLP}(\operatorname{LN}_2(X)) \end{aligned}`} /></p>
              <p className="tf-side">Each token draws on itself and earlier tokens, then works alone.</p>
            </div>
            <Stack />
          </div>
        </Panel>
        <Panel span={5} title="GPT-2 small, every parameter placed"
          note="The output layer reuses the embedding table, so it adds nothing.">
          <Budget />
        </Panel>
      </Step>

      <Step n={3} title="Does it work? Yes, by memorizing the toy text" sub="27,739 parameters, 2 blocks, characters of Guide 1's text">
        <Panel span={4} title={<>Trained with <Term>Adam</Term> (refined gradient descent)</>}
          note="It starts at 3.306 ≈ ln 27, an even guess.">
          <Training />
        </Panel>
        <Panel span={4} title="It uses its context, down to the floor"
          note={<>Floor: the best possible with that much context. From &quot;the c&quot; it writes the training text verbatim: <Term as="memorization">memorized</Term>.</>}>
          <ByPosition />
        </Panel>
        <Panel span={4} title="Trained heads: some look one character back"
          note="Previous-character weight, window &quot;the cat sat on t&quot;. One run's tendency, not a fixed role.">
          <Heads />
        </Panel>
      </Step>

      <Step n={4} title="Do the pieces earn their place? Residual connections clearly do" sub="8 blocks, 300 steps">
        <Panel span={8} title="Without residual connections it uses no context">
          <Ablation />
        </Panel>
        <Panel span={4} title="Why" className="top">
          <ul className="tf-why">
            <li><b className="mark-fail">2.319</b> ≈ 2.318: letter frequencies only.</li>
            <li>Likely: eight rounds of averaging wash out the tokens&apos; differences; residuals carry embeddings up.</li>
            <li>Normalization: no verdict in a toy.</li>
          </ul>
        </Panel>
      </Step>

      <Footer guide={guide} />
    </Poster>
  )
}
