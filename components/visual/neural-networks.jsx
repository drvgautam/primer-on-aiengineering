// The one-page visual guide for Guide 1, "Neural networks: a function with knobs".
// A quick overview in four steps; every example, output and number is the guide's
// (content/01-neural-networks.mdx), and the comments name where each comes from.
// tools/check_visuals.py checks the numbers, the terms and the word budget.
import { Footer, Masthead, Math, Panel, Poster, Step, Term } from "./poster"

// forward values in the accent, gradients (the backward pass) in amber, as poster.css
const ACCENT = "#1e3a5f", BACK = "#b45309", INK = "#1b1b1f", SOFT = "#3d3d45", MUTED = "#5f5f6a"
const WARN = "#b91c1c", RULE = "#e4e1d9", RULE2 = "#cfcbc0", OFF = "#f1f0ec", ON = "#e9eef5", PASS = "#0f7b4a"
const sans = { fontFamily: "var(--sans)" }
const mono = { fontFamily: "var(--mono)" }
// SVG art is drawn 1 unit = 1 pt at the panel's width, so these are print sizes
const T = 10, TB = 10.5

function Arrow({ x1, y1, x2, y2, color = MUTED, w = 0.9, dash }) {
  const a = globalThis.Math.atan2(y2 - y1, x2 - x1), h = 4
  const p = (s) => `${x2 - h * globalThis.Math.cos(a + s)} ${y2 - h * globalThis.Math.sin(a + s)}`
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={dash} />
      <path d={`M ${p(0.5)} L ${x2} ${y2} L ${p(-0.5)}`} />
    </g>
  )
}

// A small ReLU graph in a box: flat for negatives, the diagonal for positives.
function ReluGlyph({ x, y, w, h }) {
  const mx = x + w / 2, by = y + h - 6
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={3} fill="#fff" stroke={ACCENT} strokeWidth={1} />
      <line x1={x + 5} x2={x + w - 5} y1={by} y2={by} stroke={RULE2} strokeWidth={0.6} />
      <path d={`M ${x + 5} ${by} L ${mx} ${by} L ${x + w - 6} ${y + 5}`} stroke={ACCENT} strokeWidth={1.6} fill="none" />
    </g>
  )
}

// ---------------------------------------------------------------- step 1: a function with knobs
// The guide's first neuron: x = [2, -1], w = [1.5, 0.5], b = 0.25 -> 2.75 -> ReLU -> 2.75 (Figure 1).
function Neuron() {
  const W = 294, sx = 150, sy = 52
  return (
    <svg viewBox={`0 0 ${W} 112`} role="img" aria-label="Inputs 2 and minus 1, times weights 1.5 and 0.5, plus bias 0.25, sum 2.75, through ReLU: 2.75">
      <text x={18} y={9} fontSize={T} fill={MUTED} textAnchor="middle" style={sans}>input</text>
      {[["2", 30], ["−1", 76]].map(([v, cy]) => (
        <g key={v}>
          <circle cx={18} cy={cy} r={12} fill={OFF} stroke={RULE2} strokeWidth={0.7} />
          <text x={18} y={cy + 4} fontSize={12} textAnchor="middle" fill={INK} style={mono}>{v}</text>
        </g>
      ))}
      <Arrow x1={31} y1={32} x2={sx - 17} y2={sy - 6} />
      <Arrow x1={31} y1={74} x2={sx - 17} y2={sy + 6} />
      <text x={78} y={30} fontSize={TB} fontWeight={700} fill={ACCENT} textAnchor="middle" style={sans}>× 1.5</text>
      <text x={78} y={86} fontSize={TB} fontWeight={700} fill={ACCENT} textAnchor="middle" style={sans}>× 0.5</text>
      <text x={78} y={98} fontSize={T} fill={MUTED} textAnchor="middle" style={sans}>weights</text>
      {/* the sum and the bias */}
      <circle cx={sx} cy={sy} r={16} fill={ON} stroke={ACCENT} strokeWidth={1} />
      <text x={sx} y={sy + 5} fontSize={15} textAnchor="middle" fill={ACCENT} style={sans}>Σ</text>
      <text x={sx} y={14} fontSize={TB} fontWeight={700} fill={ACCENT} textAnchor="middle" style={sans}>+ 0.25 bias</text>
      <Arrow x1={sx} y1={18} x2={sx} y2={sy - 17} />
      <Arrow x1={sx + 17} y1={sy} x2={203} y2={sy} />
      <text x={186} y={sy - 5} fontSize={TB} textAnchor="middle" fill={INK} style={mono}>2.75</text>
      <ReluGlyph x={204} y={sy - 15} w={34} h={30} />
      <text x={221} y={sy + 29} fontSize={T} fill={MUTED} textAnchor="middle" style={sans}>ReLU</text>
      <Arrow x1={239} y1={sy} x2={256} y2={sy} />
      <text x={W} y={sy + 5} fontSize={14} fontWeight={700} textAnchor="end" fill={INK} style={mono}>2.75</text>
      <text x={0} y={110} fontSize={T} fill={SOFT} style={mono}>2·1.5 + (−1)·0.5 + 0.25 = 2.75</text>
    </svg>
  )
}

// ReLU's bend, and the guide's two-neuron layer: [2, -1] -> [2.75, 0]; [-1, 2] -> [0, 3].
function Bend() {
  const W = 423, gx = 6, gy = 14, gw = 128, gh = 76, mx = gx + 58, by = gy + gh
  const rows = [["[2, −1]", ["2.75", "0"]], ["[−1, 2]", ["0", "3"]]]
  return (
    <svg viewBox={`0 0 ${W} 110`} role="img" aria-label="ReLU is flat for negative inputs and the diagonal for positive ones. Input 2, minus 1 switches the second neuron off; input minus 1, 2 switches the first off.">
      {/* ReLU, large */}
      <line x1={gx} x2={gx + gw} y1={by} y2={by} stroke={RULE2} strokeWidth={0.7} />
      <line x1={mx} x2={mx} y1={gy} y2={by + 4} stroke={RULE2} strokeWidth={0.7} />
      <path d={`M ${gx} ${by} L ${mx} ${by} L ${gx + gw - 8} ${gy + 4}`} stroke={ACCENT} strokeWidth={2.2} fill="none" />
      <circle cx={mx} cy={by} r={4} fill="none" stroke={INK} strokeWidth={1.3} />
      <text x={mx + 8} y={by + 15} fontSize={TB} fontWeight={700} fill={INK} style={sans}>the bend</text>
      <text x={gx} y={8} fontSize={TB} fontWeight={700} fill={INK} style={sans}>ReLU = max(0, ·)</text>
      {/* the input picks which neurons are on */}
      <text x={170} y={8} fontSize={TB} fontWeight={700} fill={INK} style={sans}>Inputs switch neurons on: a matrix per input</text>
      <text x={170} y={26} fontSize={T} fill={SOFT} style={mono}>h = ReLU(xW + b)</text>
      {["1st", "2nd"].map((n, j) => <text key={n} x={300 + j * 50} y={26} fontSize={T} textAnchor="middle" fill={MUTED} style={sans}>{n}</text>)}
      {rows.map(([x, outs], i) => {
        const y = 50 + i * 38
        return (
          <g key={x}>
            <text x={170} y={y + 4} fontSize={T} fill={MUTED} style={sans}>x =</text>
            <text x={190} y={y + 4} fontSize={12} fill={INK} style={mono}>{x}</text>
            <Arrow x1={248} y1={y} x2={276} y2={y} />
            {outs.map((v, j) => {
              const on = v !== "0", cx = 300 + j * 50
              return (
                <g key={j}>
                  <circle cx={cx} cy={y} r={16} fill={on ? ON : "#fff"} stroke={on ? ACCENT : RULE2} strokeWidth={on ? 1.3 : 0.8} strokeDasharray={on ? undefined : "2 2"} />
                  <text x={cx} y={y + 3.6} fontSize={10.5} fontWeight={on ? 700 : 400} textAnchor="middle" fill={on ? ACCENT : MUTED} style={mono}>{v}</text>
                </g>
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------- step 2: answer, and how wrong
// Figure 2's shapes: a 1 x 27 one-hot row -> 1 x 16 hidden row -> 1 x 27 logits -> softmax.
// The probabilities are the trained network's for "t": 'h' 0.62, ' ' 0.32 (the guide's last block).
const CHARS = " abcdefghijklmnopqrstuvwxyz"
function ForwardPass() {
  const W = 423, y0 = 24, c = 3.1                        // one cell per number, 3.1 pt tall
  const col = (cx, n, fill, label, shape) => (
    <g>
      <text x={cx} y={12} fontSize={TB} fontWeight={700} textAnchor="middle" fill={INK} style={sans}>{label}</text>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={cx - 5} y={y0 + i * c} width={10} height={c - 0.6} fill={fill(i)} stroke="#a9a59a" strokeWidth={0.5} />
      ))}
      <text x={cx} y={y0 + 27 * c + 13} fontSize={T} textAnchor="middle" fill={MUTED} style={mono}>{shape}</text>
    </g>
  )
  const hot = CHARS.indexOf("t"), mid = y0 + 13.5 * c
  const probs = { 0: 0.32, 8: 0.62 }
  const px = 346, pw = 52
  return (
    <svg viewBox={`0 0 ${W} ${y0 + 27 * c + 16}`} role="img" aria-label="The character t as a one-hot row of 27, times a 27 by 16 matrix and ReLU gives 16 hidden values, times a 16 by 27 matrix gives 27 logits, and softmax gives 27 probabilities: h 0.62, space 0.32">
      <text x={8} y={y0 + hot * c + 4} fontSize={12} fontWeight={700} fill={ACCENT} style={mono}>t</text>
      <Arrow x1={17} y1={y0 + hot * c + 0.5} x2={28} y2={y0 + hot * c + 0.5} color={ACCENT} />
      {col(36, 27, (i) => (i === hot ? ACCENT : "#fff"), "one-hot", "1 × 27")}
      <Arrow x1={46} y1={mid} x2={126} y2={mid} />
      <text x={86} y={mid - 6} fontSize={T} textAnchor="middle" fill={INK} style={sans}>× W⁽¹⁾ + b⁽¹⁾</text>
      <text x={86} y={mid + 13} fontSize={T} textAnchor="middle" fill={MUTED} style={mono}>27 × 16</text>
      <g transform={`translate(0 ${5.5 * c})`}>{col(136, 16, () => ON, "", "")}</g>
      <text x={136} y={12} fontSize={TB} fontWeight={700} textAnchor="middle" fill={INK} style={sans}>hidden, ReLU</text>
      <text x={136} y={y0 + 27 * c + 13} fontSize={T} textAnchor="middle" fill={MUTED} style={mono}>1 × 16</text>
      <Arrow x1={146} y1={mid} x2={220} y2={mid} />
      <text x={183} y={mid - 6} fontSize={T} textAnchor="middle" fill={INK} style={sans}>× W⁽²⁾ + b⁽²⁾</text>
      <text x={183} y={mid + 13} fontSize={T} textAnchor="middle" fill={MUTED} style={mono}>16 × 27</text>
      {col(230, 27, () => "#f4f3ef", "logits", "1 × 27")}
      <Arrow x1={240} y1={mid} x2={296} y2={mid} />
      <text x={268} y={mid - 6} fontSize={T} textAnchor="middle" fill={INK} style={sans}>softmax</text>
      {/* the probabilities, as bars */}
      <text x={px} y={12} fontSize={TB} fontWeight={700} textAnchor="middle" fill={INK} style={sans}>probabilities, trained</text>
      <line x1={px - 40} x2={px - 40} y1={y0} y2={y0 + 27 * c} stroke={RULE2} strokeWidth={0.6} />
      {Array.from({ length: 27 }, (_, i) => (
        <rect key={i} x={px - 40} y={y0 + i * c} width={globalThis.Math.max(0.8, (probs[i] ?? 0) * pw)} height={c - 0.6} fill={probs[i] ? ACCENT : RULE2} />
      ))}
      <text x={px - 40 + 0.32 * pw + 4} y={y0 + 0 * c + 4} fontSize={T} fill={INK} style={mono}>space 0.32</text>
      <text x={px - 40 + 0.62 * pw + 4} y={y0 + 8 * c + 4} fontSize={T} fontWeight={700} fill={INK} style={mono}>h 0.62</text>
      <text x={px} y={y0 + 27 * c + 13} fontSize={T} textAnchor="middle" fill={MUTED} style={mono}>1 × 27</text>
    </svg>
  )
}

// The guide's softmax example: logits [2, 1, 0] -> 0.665, 0.245, 0.090; the first is correct,
// so the loss is -ln 0.665 = 0.408. Beside it, the loss as a curve: -ln p of the correct answer.
function SoftmaxLoss() {
  const W = 294, H = 124
  const rows = [["2", 0.665, ".665"], ["1", 0.245, ".245"], ["0", 0.090, ".090"]]
  const bx = 34, bw = 70
  // the curve: x = probability of the correct answer, y = -ln p
  const cx0 = 168, cw = 122, cy0 = 14, ch = 92, ymax = 4.8
  const X = (p) => cx0 + p * cw, Y = (l) => cy0 + ch - (l / ymax) * ch
  const pts = []
  for (let p = 0.0085; p <= 1.0001; p += 0.004) pts.push(`${X(p).toFixed(1)},${Y(-globalThis.Math.log(p)).toFixed(1)}`)
  const marks = [[1, 0, "", "end", 0, -6], [0.665, 0.408, "0.408", "middle", -4, -9], [0.01, 4.6, "4.6", "start", 6, 3]]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Logits 2, 1, 0 become probabilities 0.665, 0.245, 0.090; with the first correct the loss is 0.408. The loss rises without limit as the correct answer's probability falls.">
      <text x={0} y={9} fontSize={T} fill={MUTED} style={sans}>3 logits</text>
      <text x={bx + 12} y={9} fontSize={T} fill={MUTED} style={sans}>probabilities</text>
      {rows.map(([z, p, lab], i) => {
        const y = 22 + i * 22
        return (
          <g key={z}>
            <text x={10} y={y + 9} fontSize={12} textAnchor="middle" fill={INK} style={mono}>{z}</text>
            <rect x={bx} y={y} width={p * bw} height={12} rx={1.5} fill={i === 0 ? ACCENT : "#aeb7c4"} />
            <text x={bx + p * bw + 4} y={y + 9.5} fontSize={TB} fontWeight={i === 0 ? 700 : 400} fill={INK} style={mono}>{lab}</text>
          </g>
        )
      })}
      <text x={bx + 0.665 * bw + 34} y={31} fontSize={T} fill={PASS} fontWeight={700} style={sans}>✓ correct</text>
      <text x={0} y={102} fontSize={TB} fontWeight={700} fill={INK} style={sans}>loss = −ln 0.665</text>
      <text x={0} y={116} fontSize={TB} fontWeight={700} fill={ACCENT} style={sans}>= 0.408</text>
      {/* the curve */}
      <line x1={cx0} x2={cx0 + cw} y1={cy0 + ch} y2={cy0 + ch} stroke={RULE2} strokeWidth={0.7} />
      <line x1={cx0} x2={cx0} y1={cy0 - 4} y2={cy0 + ch} stroke={RULE2} strokeWidth={0.7} />
      <polyline points={pts.join(" ")} fill="none" stroke={ACCENT} strokeWidth={1.6} />
      {marks.map(([p, l, lab, anchor, dx, dy]) => (
        <g key={p}>
          <circle cx={X(p)} cy={Y(l)} r={2.4} fill={ACCENT} />
          <text x={X(p) + dx} y={Y(l) + dy} fontSize={T} textAnchor={anchor} fill={INK} style={mono}>{lab}</text>
        </g>
      ))}
      <text x={cx0} y={cy0 + ch + 12} fontSize={T} textAnchor="middle" fill={MUTED} style={mono}>0</text>
      <text x={cx0 + cw} y={cy0 + ch + 12} fontSize={T} textAnchor="middle" fill={MUTED} style={mono}>1</text>
      <text x={cx0 + cw / 2} y={cy0 + ch + 12} fontSize={T} textAnchor="middle" fill={MUTED} style={sans}>p(correct)</text>
      <text x={cx0 - 4} y={cy0 - 6} fontSize={T} fill={MUTED} style={sans}>loss</text>
    </svg>
  )
}

// ---------------------------------------------------------------- step 3: how it learns
// The guide's one-knob loss (θ - 3)^2: η = 0.1 steps 0 -> 0.6 -> 1.08 toward 3; η = 1.1 overshoots to 6.6.
function Descent() {
  const W = 358, H = 106, x0 = 14, xw = 330, y0 = 16, yh = 86, tmin = -0.4, tmax = 7, lmax = 13.2
  const X = (t) => x0 + ((t - tmin) / (tmax - tmin)) * xw, Y = (l) => y0 + yh - (l / lmax) * yh
  const L = (t) => (t - 3) ** 2
  const pts = []
  for (let t = tmin; t <= 6.85; t += 0.05) pts.push(`${X(t).toFixed(1)},${Y(L(t)).toFixed(1)}`)
  const steps = [0, 0.6, 1.08]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="The loss (theta minus 3) squared. With learning rate 0.1, steps from 0 to 0.6 to 1.08, heading for the minimum at 3. With learning rate 1.1, the first step overshoots to 6.6.">
      <line x1={x0} x2={x0 + xw} y1={Y(0)} y2={Y(0)} stroke={RULE2} strokeWidth={0.7} />
      <text x={x0 + xw} y={Y(0) + 11} fontSize={T} textAnchor="end" fill={MUTED} style={mono}>θ →</text>
      <polyline points={pts.join(" ")} fill="none" stroke={MUTED} strokeWidth={1.3} />
      <text x={X(3)} y={Y(0) - 5} fontSize={T} textAnchor="middle" fill={PASS} fontWeight={700} style={mono}>θ = 3</text>
      {/* the overshoot */}
      <Arrow x1={X(0) + 3} y1={Y(9) - 1} x2={X(6.6) - 4} y2={Y(L(6.6))} color={WARN} dash="3 2" />
      <circle cx={X(6.6)} cy={Y(L(6.6))} r={3} fill={WARN} />
      <text x={X(6.6) - 8} y={Y(L(6.6)) - 7} fontSize={T} textAnchor="end" fill={WARN} style={sans}>η = 1.1 overshoots to 6.6</text>
      {/* the good steps */}
      {steps.slice(0, -1).map((t, i) => (
        <Arrow key={t} x1={X(t) + 2} y1={Y(L(t)) + 2} x2={X(steps[i + 1]) - 1.5} y2={Y(L(steps[i + 1])) - 2} color={ACCENT} w={1.4} />
      ))}
      {steps.map((t) => <circle key={t} cx={X(t)} cy={Y(L(t))} r={3} fill={ACCENT} />)}
      <text x={X(0) + 16} y={Y(9) + 5} fontSize={T} fill={INK} style={mono}>θ = 0: slope −6</text>
      <text x={X(0.6) + 7} y={Y(L(0.6)) + 3} fontSize={T} fill={INK} style={mono}>0.6</text>
      <text x={X(1.08) + 7} y={Y(L(1.08)) + 3} fontSize={T} fill={INK} style={mono}>1.08 …</text>
      <text x={0} y={9} fontSize={T} fill={MUTED} style={sans}>loss (θ − 3)², η = 0.1</text>
    </svg>
  )
}

// The guide's paper example (Figure 4): x = 1, w1 = 2, w2 = 0.5, y = 2. Forward values left to
// right, gradients right to left.
function Backprop() {
  const W = 358, fy = 38, by = 84
  const nodes = [[16, "x", "1"], [140, "h", "2"], [244, "ŷ", "1"], [330, "loss", "0.5"]]
  const grads = [[78, "−0.5", "w₁", "−0.5×1"], [140, "−0.5", "h", "−1×0.5"], [192, "−2", "w₂", "−1×2"], [244, "−1", "ŷ", "1 − 2"]]
  return (
    <svg viewBox={`0 0 ${W} 112`} role="img" aria-label="Forward: x 1, h 2, y-hat 1, loss 0.5. Backward: slopes minus 1 at y-hat, minus 2 for w2, minus 0.5 at h, minus 0.5 for w1.">
      <text x={0} y={9} fontSize={T} fontWeight={700} fill={ACCENT} style={sans}>forward</text>
      {nodes.map(([cx, name, v]) => (
        <g key={name}>
          <rect x={cx - 17} y={fy - 13} width={34} height={26} rx={4} fill={name === "loss" ? "#fff" : ON} stroke={ACCENT} strokeWidth={0.9} />
          <text x={cx} y={fy + 4.5} fontSize={12} fontWeight={700} textAnchor="middle" fill={ACCENT} style={mono}>{v}</text>
          <text x={cx} y={fy - 17} fontSize={T} textAnchor="middle" fill={MUTED} style={sans}>{name}</text>
        </g>
      ))}
      <Arrow x1={34} y1={fy} x2={122} y2={fy} color={ACCENT} />
      <text x={78} y={fy - 4} fontSize={T} textAnchor="middle" fill={INK} style={sans}>× w₁ = 2, ReLU</text>
      <Arrow x1={158} y1={fy} x2={226} y2={fy} color={ACCENT} />
      <text x={192} y={fy - 4} fontSize={T} textAnchor="middle" fill={INK} style={sans}>× w₂ = 0.5</text>
      <Arrow x1={262} y1={fy} x2={312} y2={fy} color={ACCENT} />
      <text x={287} y={fy + 22} fontSize={T} textAnchor="middle" fill={MUTED} style={sans}>½(ŷ − y)², y = 2</text>
      {/* backward */}
      <Arrow x1={330} y1={by - 17} x2={16} y2={by - 17} color={BACK} w={1.1} />
      <text x={W} y={9} fontSize={T} fontWeight={700} textAnchor="end" fill={BACK} style={sans}>backward: slopes, multiplied along the chain</text>
      {grads.map(([cx, g, of, how]) => (
        <g key={of}>
          <text x={cx} y={by} fontSize={12} fontWeight={700} textAnchor="middle" fill={BACK} style={mono}>{g}</text>
          <text x={cx} y={by + 13} fontSize={T} textAnchor="middle" fill={MUTED} style={sans}>{of}</text>
          <text x={cx} y={by + 25} fontSize={9.4} textAnchor="middle" fill={BACK} style={mono}>{how}</text>
        </g>
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------- step 4: the whole loop
// The training block's printed losses, the uniform guess and the 0.884 floor.
function LossCurve() {
  const W = 358, H = 132, x0 = 30, xw = 318, y0 = 10, yh = 104, lmax = 3.4
  const X = (s) => x0 + (s / 2000) * xw, Y = (l) => y0 + yh - (l / lmax) * yh
  const run = [[0, 3.296], [100, 1.176], [500, 0.898], [1000, 0.89], [2000, 0.887]]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Loss over 2,000 steps: 3.296, 1.176 after 100, 0.898 after 500, 0.890 after 1,000, 0.887 after 2,000; the best possible is 0.884">
      <line x1={x0} x2={x0 + xw} y1={Y(0)} y2={Y(0)} stroke={RULE2} strokeWidth={0.7} />
      <line x1={x0} x2={x0} y1={y0} y2={Y(0)} stroke={RULE2} strokeWidth={0.7} />
      <text x={x0 - 4} y={Y(0) + 3} fontSize={T} textAnchor="end" fill={MUTED} style={mono}>0</text>
      <text x={x0 - 4} y={y0 + 4} fontSize={T} textAnchor="end" fill={MUTED} style={sans}>loss</text>
      {[0, 500, 1000, 2000].map((s) => (
        <text key={s} x={X(s)} y={Y(0) + 13} fontSize={T} textAnchor={s === 2000 ? "end" : "middle"} fill={MUTED} style={mono}>{s === 2000 ? "2,000 steps" : s === 1000 ? "1,000" : s}</text>
      ))}
      <line x1={x0} x2={x0 + xw} y1={Y(0.884)} y2={Y(0.884)} stroke={PASS} strokeWidth={1} strokeDasharray="4 2" />
      <text x={x0 + xw} y={Y(0.884) + 13} fontSize={T} textAnchor="end" fill={PASS} fontWeight={700} style={sans}>floor 0.884: best from one character</text>
      <polyline points={run.slice(0, 3).map(([s, l]) => `${X(s)},${Y(l)}`).join(" ")} fill="none" stroke={ACCENT} strokeWidth={1} strokeDasharray="2 2" />
      {run.map(([s, l]) => <circle key={s} cx={X(s)} cy={Y(l)} r={2.6} fill={ACCENT} />)}
      <text x={X(0) + 6} y={Y(3.296) + 4} fontSize={T} fill={INK} style={mono}>3.296 ≈ ln 27, uniform guess</text>
      <text x={W} y={Y(3.296) + 4} fontSize={T} textAnchor="end" fill={MUTED} style={sans}>η = 1, by trying</text>
      <text x={X(100) + 6} y={Y(1.176) - 3} fontSize={T} fill={INK} style={mono}>1.176</text>
      <text x={X(2000)} y={Y(0.887) - 5} fontSize={TB} fontWeight={700} textAnchor="end" fill={ACCENT} style={mono}>0.887</text>
    </svg>
  )
}

// ---------------------------------------------------------------- the sheet
export default function NeuralNetworksSheet({ guide }) {
  return (
    <Poster>
      <Masthead
        guide={guide}
        title="Neural networks"
        subtitle="a function with knobs"
        thesis={<>Tune the knobs: measure <em>how wrong</em> it is, then <em>turn every knob</em> a little to shrink that number.</>}
      />

      <Step n={1} title="What is a network? Layers of neurons">
        <Panel span={5} title={<>A <Term>neuron</Term>: weigh, add, bend</>}
          note={<><Term as="weight">Weights</Term> and <Term>bias</Term> are its <Term as="parameter">parameters</Term>: the knobs.</>}>
          <Neuron />
        </Panel>
        <Panel span={7} title={<>Stack <Term as="layer">layers</Term>; <Term>ReLU</Term>&apos;s bend makes stacking pay</>}
          note="Without the bend, two layers collapse into one matrix.">
          <Bend />
        </Panel>
      </Step>

      <Step n={2} title="How does it answer, and how wrong is it?">
        <p className="setup">
          Guess the next character from the current one:
          <code className="home">the cat sat on the mat and the dog …</code>
          <span className="gap">27 characters: a–z and space</span>
        </p>
        <Panel span={7} title={<>The <Term>forward pass</Term>: one character in, 27 probabilities out</>}
          note="27 · 16 + 16 + 16 · 27 + 27 = 907 parameters.">
          <ForwardPass />
        </Panel>
        <Panel span={5} title={<><Term>Softmax</Term>, <Term>cross-entropy</Term>: the <Term>loss</Term></>}>
          <SoftmaxLoss />
        </Panel>
      </Step>

      <Step n={3} title="How does it learn? Walk downhill, by the chain rule">
        <Panel span={6} title={<><Term>Gradient descent</Term>: step every knob against its slope</>}
          note={<>The <Term>learning rate</Term> η sets the stride.</>}>
          <p className="formula"><Math tex={String.raw`\theta \leftarrow \theta - \eta \times \text{slope}`} /></p>
          <Descent />
        </Panel>
        <Panel span={6} title={<><Term>Backpropagation</Term>: every slope in one backward pass</>}
          note="One step, η = 0.1: w₁ → 2.05, w₂ → 0.7; loss 0.5 → 0.160.">
          <Backprop />
        </Panel>
      </Step>

      <Step n={4} title="Does it work? The whole loop, on a toy text">
        <Panel span={6} title="The loss falls almost to the text's floor"
          note={<>Trained, after &quot;t&quot;: h 0.62, space 0.32; in the text, 0.58, 0.37.</>}>
          <LossCurve />
        </Panel>
        <Panel span={6} title="Same recipe, bigger parts: on to LLMs"
          note={<><Term>Training</Term> turns the knobs; <Term>inference</Term> only runs the forward pass.</>}>
          <p className="loop">
            <span>forward</span>→<span>loss</span>→<span>backward</span>→<span>update</span>
          </p>
          <ul className="carry">
            <li><span>one-hot input</span><span>a learned vector per token</span><i>Guides 2, 3</i></li>
            <li><span>one character</span><span>all earlier text, by attention</span><i>Guide 4</i></li>
            <li><span>two layers</span><span>dozens of transformer blocks</span><i>Guide 5</i></li>
            <li><span>27 characters</span><span>tens or hundreds of thousands of tokens</span><i>Guide 6</i></li>
            <li><span>907 parameters</span><span>billions</span><i>Guide 7</i></li>
          </ul>
        </Panel>
      </Step>

      <Footer guide={guide} />
    </Poster>
  )
}
