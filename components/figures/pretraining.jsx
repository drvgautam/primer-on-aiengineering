"use client"

import { Stepped, ink, label } from "./stepped"

const mono = { fill: "currentColor", fontSize: 13, textAnchor: "middle", fontFamily: "ui-monospace, Menlo, Consolas, monospace" }

// Shown names for characters: the space is drawn as a visible symbol.
const show = (ch) => (ch === " " ? "␣" : ch)

// Figure 1: the start of the guide's training stream (the corpus block's first sentence), cut into
// windows of 4. Two extra characters past the 16 shown supply the last window's targets.
const STREAM = "the owl ran on the"
const SHOWN = 16
const W = 4

function Cells({ text, x, y, cell = 24, h = 26, strong = false }) {
  return text.split("").map((c, i) => (
    <g key={i}>
      <rect x={x + i * cell} y={y} width={cell} height={h} {...ink} strokeWidth={strong ? 1.5 : 1.1} fill="currentColor" fillOpacity={strong ? 0.12 : 0} />
      <text x={x + i * cell + cell / 2} y={y + h * 0.68} {...mono} fontSize={15}>{show(c)}</text>
    </g>
  ))
}

export function BatchFigure() {
  const cell = 24
  const x0 = 18
  return (
    <Stepped labels={["stride 1", "stride 4", "a batch"]}>
      {(step) => {
        const starts = step === 0 ? [0, 1, 2, 3] : [0, 4, 8, 12]
        return (
          <svg viewBox="0 0 420 300" width="100%" style={{ maxWidth: 500 }} role="img">
            <title>{step < 2
              ? `The first 16 characters of the training stream, "the owl ran on t", with windows of 4 characters starting at ${starts.join(", ")}: stride ${step === 0 ? "1, so neighboring windows overlap in 3 characters" : "4, so the windows sit back to back"}`
              : `The four stride-4 windows stacked as the rows of a batch, B = 4 by n = 4: inputs "the ", "owl ", "ran ", "on t", and beside them the targets, each window shifted one character later: "he o", "wl r", "an o", "n th"`}</title>
            {step < 2 && (
              <g>
                <text x={x0} y={20} {...label} textAnchor="start" fontSize={16}>the token stream (␣ = space)</text>
                <Cells text={STREAM.slice(0, SHOWN)} x={x0} y={30} cell={cell} />
                <text x={x0 + SHOWN * cell + 1} y={48} {...label} textAnchor="start" fontSize={16}>…</text>
                {starts.map((s, r) => {
                  const y = 84 + r * 44
                  return (
                    <g key={s}>
                      <Cells text={STREAM.slice(s, s + W)} x={x0 + s * cell} y={y} cell={cell} strong />
                      <text x={s + W > 10 ? x0 + s * cell - 8 : x0 + (s + W) * cell + 8} y={y + 18} {...label} textAnchor={s + W > 10 ? "end" : "start"} fontSize={16}>window {r + 1}, start {s}</text>
                    </g>
                  )
                })}
                <text x={210} y={278} {...label} fontSize={16}>
                  {step === 0 ? "stride 1: each window shares 3 characters with the next" : "stride 4: back to back, no overlap"}
                </text>
              </g>
            )}
            {step === 2 && (
              <g>
                <text x={95} y={30} {...label} fontSize={16}>inputs</text>
                <text x={300} y={30} {...label} fontSize={16}>targets (one later)</text>
                {starts.map((s, r) => (
                  <g key={s}>
                    <Cells text={STREAM.slice(s, s + W)} x={47} y={44 + r * 34} cell={cell} strong />
                    <Cells text={STREAM.slice(s + 1, s + W + 1)} x={252} y={44 + r * 34} cell={cell} />
                  </g>
                ))}
                <text x={95} y={200} {...label} fontSize={16}>B = 4 rows</text>
                <text x={95} y={220} {...label} fontSize={16}>n = 4 characters each</text>
                <text x={300} y={200} {...label} fontSize={16}>one target per position:</text>
                <text x={300} y={220} {...label} fontSize={16}>16 predictions</text>
                <text x={210} y={270} {...label} fontSize={16}>the toy: B = 32 windows of 32, 1,024 predictions</text>
              </g>
            )}
          </svg>
        )
      }}
    </Stepped>
  )
}

// Figure 2: the 4,000-sentence run's losses, from the guide's training block output.
const CURVE = [
  [0, 3.567, 3.582], [50, 1.329, 1.341], [100, 0.936, 0.935], [250, 0.405, 0.400],
  [500, 0.301, 0.301], [750, 0.287, 0.291], [1000, 0.281, 0.287],
]
const FLOOR = 0.225

export function CurveFigure() {
  const px = (s) => 56 + (s / 1000) * 350
  const py = (v) => 260 - ((Math.log10(v) - Math.log10(0.15)) / (Math.log10(4) - Math.log10(0.15))) * 230
  return (
    <svg viewBox="0 -8 440 318" width="100%" style={{ maxWidth: 540 }} role="img">
      <title>Line chart, loss on a log scale, of training and validation loss against training steps, 0 to 1,000: training 3.567 and validation 3.582 at step 0, 1.329 and 1.341 at 50, 0.936 and 0.935 at 100, 0.405 and 0.400 at 250, 0.301 and 0.301 at 500, 0.287 and 0.291 at 750, 0.281 and 0.287 at 1,000; a dashed line marks the rules' floor at 0.225</title>
      <line x1={56} y1={260} x2={420} y2={260} {...ink} strokeWidth={1.2} />
      <line x1={56} y1={260} x2={56} y2={24} {...ink} strokeWidth={1.2} />
      {[0.25, 0.5, 1, 2, 4].map((v) => (
        <g key={v}>
          <line x1={52} y1={py(v)} x2={56} y2={py(v)} {...ink} strokeWidth={1.2} />
          <text x={48} y={py(v) + 5} {...mono} fontSize={16} textAnchor="end">{v}</text>
        </g>
      ))}
      {[0, 250, 500, 750, 1000].map((s) => (
        <g key={s}>
          <line x1={px(s)} y1={260} x2={px(s)} y2={264} {...ink} strokeWidth={1.2} />
          <text x={px(s)} y={280} {...mono} fontSize={16}>{s.toLocaleString("en-US")}</text>
        </g>
      ))}
      <text x={238} y={302} {...label} fontSize={16}>training steps</text>
      <text x={56} y={14} {...label} fontSize={16} textAnchor="start">loss, nats per character (log scale)</text>
      <line x1={56} y1={py(FLOOR)} x2={420} y2={py(FLOOR)} {...ink} strokeWidth={1} strokeDasharray="5 4" />
      <text x={416} y={py(FLOOR) + 17} {...label} fontSize={16} textAnchor="end">rules' floor 0.225</text>
      <polyline points={CURVE.map(([s, t]) => `${px(s)},${py(t)}`).join(" ")} {...ink} strokeWidth={1.8} />
      <polyline points={CURVE.map(([s, , v]) => `${px(s)},${py(v)}`).join(" ")} {...ink} strokeWidth={1.2} strokeDasharray="1 3" strokeLinecap="round" />
      {CURVE.map(([s, t, v]) => (
        <g key={s}>
          <circle cx={px(s)} cy={py(t)} r={3.2} fill="currentColor" />
          <circle cx={px(s)} cy={py(v)} r={4.6} {...ink} strokeWidth={1.2} />
        </g>
      ))}
      <circle cx={250} cy={70} r={3.2} fill="currentColor" />
      <line x1={262} y1={70} x2={288} y2={70} {...ink} strokeWidth={1.8} />
      <text x={296} y={75} {...label} fontSize={16} textAnchor="start">training</text>
      <circle cx={250} cy={96} r={4.6} {...ink} strokeWidth={1.2} />
      <line x1={262} y1={96} x2={288} y2={96} {...ink} strokeWidth={1.2} strokeDasharray="1 3" strokeLinecap="round" />
      <text x={296} y={101} {...label} fontSize={16} textAnchor="start">validation</text>
      <text x={px(1000)} y={py(0.287) - 12} {...mono} fontSize={16} textAnchor="end">0.281 / 0.287</text>
      <text x={px(0) + 12} y={py(3.582) + 5} {...mono} fontSize={16} textAnchor="start">3.567 / 3.582</text>
    </svg>
  )
}

// Figure 3: training tokens against parameters, both on log axes. Values are the guide's
// compute block inputs (GPT-3, Chinchilla, LLaMA-7B) and the 20-tokens-per-parameter line.
const MODELS = [
  { name: "GPT-3 (2020)", N: 175e9, D: 300e9, dx: -8, dy: 22, anchor: "end" },
  { name: "Chinchilla (2022)", N: 70e9, D: 1.4e12, dx: 10, dy: 18, anchor: "start" },
  { name: "LLaMA-7B (2023)", N: 7e9, D: 1e12, dx: 0, dy: -14, anchor: "middle" },
]

export function ScaleFigure() {
  const px = (N) => 70 + (Math.log10(N) - 9) * 110
  const py = (D) => 270 - (Math.log10(D) - 10) * 60
  const exp = (e) => (
    <tspan>10<tspan dy={-6} fontSize={11}>{e}</tspan></tspan>
  )
  return (
    <svg viewBox="0 -8 440 338" width="100%" style={{ maxWidth: 540 }} role="img">
      <title>Log–log chart of training tokens against parameters. A line marks 20 tokens per parameter. GPT-3, 175 billion parameters and 300 billion tokens, sits well below the line; Chinchilla, 70 billion and 1.4 trillion, sits on it; LLaMA-7B, 7 billion and 1 trillion, sits far above it</title>
      <line x1={70} y1={270} x2={420} y2={270} {...ink} strokeWidth={1.2} />
      <line x1={70} y1={270} x2={70} y2={20} {...ink} strokeWidth={1.2} />
      {[9, 10, 11, 12].map((e) => (
        <g key={e}>
          <line x1={px(10 ** e)} y1={270} x2={px(10 ** e)} y2={274} {...ink} strokeWidth={1.2} />
          <text x={px(10 ** e)} y={292} {...mono} fontSize={14}>{exp(e)}</text>
        </g>
      ))}
      {[10, 11, 12, 13, 14].map((e) => (
        <g key={e}>
          <line x1={66} y1={py(10 ** e)} x2={70} y2={py(10 ** e)} {...ink} strokeWidth={1.2} />
          <text x={62} y={py(10 ** e) + 5} {...mono} fontSize={14} textAnchor="end">{exp(e)}</text>
        </g>
      ))}
      <text x={245} y={320} {...label} fontSize={15}>parameters N</text>
      <text x={70} y={4} {...label} fontSize={15}>training tokens D</text>
      <line x1={px(1e9)} y1={py(2e10)} x2={px(1e12)} y2={py(2e13)} {...ink} strokeWidth={1.2} strokeDasharray="5 4" />
      <text x={px(1e12) - 4} y={py(2e13) - 10} {...label} fontSize={14} textAnchor="end">D = 20N</text>
      {MODELS.map((m) => (
        <g key={m.name}>
          <circle cx={px(m.N)} cy={py(m.D)} r={5} fill="currentColor" />
          <text x={px(m.N) + m.dx} y={py(m.D) + m.dy} {...label} fontSize={14} textAnchor={m.anchor}>{m.name}</text>
        </g>
      ))}
    </svg>
  )
}
