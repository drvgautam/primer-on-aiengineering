"use client"

import { ArrowDefs, Stepped, ink, label } from "./stepped"

const mono = { fill: "currentColor", fontSize: 13, textAnchor: "middle", fontFamily: "ui-monospace, Menlo, Consolas, monospace" }

// A symbol with a subscript (d with model), for use inside <text>.
// The zero-width space carries the shift back to the baseline.
function Sub({ base, sub }) {
  return (
    <tspan>
      {base}
      <tspan dy={3} fontSize={10}>{sub}</tspan>
      <tspan dy={-3}>{"​"}</tspan>
    </tspan>
  )
}

const dModel = <Sub base="d" sub="model" />

// The add-back point on a stream.
function Plus({ x, y }) {
  return (
    <g>
      <circle cx={x} cy={y} r={9} {...ink} fill="Canvas" />
      <line x1={x - 5} y1={y} x2={x + 5} y2={y} {...ink} />
      <line x1={x} y1={y - 5} x2={x} y2={y + 5} {...ink} />
    </g>
  )
}

// Figure 1: one block on the residual streams of the running example's first three tokens.
const STREAMS = [
  { token: "The", x: 80 },
  { token: " cat", x: 200 },
  { token: " sat", x: 320 },
]
const OFFSET = 46

export function BlockFigure() {
  const m = "url(#block-arrow)"
  const formulas = [
    <>X ← X + MultiHead(<Sub base="LN" sub="1" />(X))</>,
    <>X ← X + MLP(<Sub base="LN" sub="2" />(X))</>,
    <>one block: n × {dModel} in, n × {dModel} out</>,
  ]
  return (
    <Stepped labels={["1 attention", "2 MLP", "3 the block"]}>
      {(step) => (
        <svg viewBox="0 0 420 350" width="100%" style={{ maxWidth: 500 }} role="img">
          <title>One transformer block on three tokens' residual streams, drawn bottom to top: each stream is normalized and passed to attention, which draws on streams to its left, and the result is added back; then each stream is normalized and passed to its own copy of the MLP, and the result is added back</title>
          <ArrowDefs id="block-arrow" />
          <text x={210} y={16} {...label} fontWeight={600}>{formulas[step]}</text>
          {step === 2 && (
            <g>
              <rect x={34} y={64} width={366} height={212} rx={8} {...ink} />
              <rect x={46} y={182} width={342} height={44} rx={5} {...ink} strokeWidth={1.2} fill="currentColor" fillOpacity={0.07} />
              <rect x={46} y={96} width={342} height={44} rx={5} {...ink} strokeWidth={1.2} fill="currentColor" fillOpacity={0.07} />
              <text x={133} y={200} {...label} fontSize={12}><Sub base="LN" sub="1" />, attention,</text>
              <text x={133} y={216} {...label} fontSize={12}>add</text>
              <text x={133} y={114} {...label} fontSize={12}><Sub base="LN" sub="2" />, MLP,</text>
              <text x={133} y={130} {...label} fontSize={12}>add</text>
            </g>
          )}
          {STREAMS.map((s, i) => {
            const bx = s.x + OFFSET
            return (
              <g key={s.token}>
                <line x1={s.x} y1={300} x2={s.x} y2={34} {...ink} strokeWidth={2.2} markerEnd={m} />
                <text x={s.x} y={320} {...mono}>{s.token}</text>
                {step < 2 && (
                  <g>
                    <polyline points={`${s.x},274 ${bx},274 ${bx},254`} {...ink} strokeWidth={1.2} markerEnd={m} />
                    <rect x={bx - 20} y={230} width={40} height={22} rx={4} {...ink} strokeWidth={1.2} />
                    <text x={bx} y={246} {...label} fontSize={12}><Sub base="LN" sub={step + 1} /></text>
                    <polyline points={`${bx},148 ${bx},100 ${s.x + 11},100`} {...ink} strokeWidth={1.2} markerEnd={m} />
                    <Plus x={s.x} y={100} />
                  </g>
                )}
                {step === 0 &&
                  STREAMS.slice(i).map((to, steps) => (
                    <line key={to.token} x1={bx} y1={230} x2={to.x + OFFSET - 13 * steps} y2={182} {...ink} strokeWidth={1.2} markerEnd={m} />
                  ))}
                {step === 1 && (
                  <g>
                    <line x1={bx} y1={230} x2={bx} y2={182} {...ink} strokeWidth={1.2} markerEnd={m} />
                    <rect x={bx - 26} y={150} width={52} height={30} rx={5} {...ink} fill="currentColor" fillOpacity={0.07} />
                    <text x={bx} y={170} {...label} fontSize={12}>MLP</text>
                  </g>
                )}
                {step === 2 && (
                  <g>
                    <Plus x={s.x} y={204} />
                    <Plus x={s.x} y={118} />
                  </g>
                )}
              </g>
            )
          })}
          {step === 0 && (
            <g>
              <rect x={96} y={150} width={300} height={30} rx={5} {...ink} fill="currentColor" fillOpacity={0.07} />
              {STREAMS.slice(1).map((s) => (
                <g key={s.token}>
                  <line x1={s.x} y1={146} x2={s.x} y2={184} stroke="Canvas" strokeWidth={9} />
                  <line x1={s.x} y1={144} x2={s.x} y2={186} {...ink} strokeWidth={2.2} />
                </g>
              ))}
              <text x={260} y={169} {...label} fontSize={11.5}>multi-head attention</text>
            </g>
          )}
          {step === 0 && <text x={210} y={342} {...label} fontSize={12}>causal mask: each token draws on itself and the tokens before it</text>}
          {step === 1 && <text x={210} y={342} {...label} fontSize={12}>the same MLP weights for every token, one token at a time</text>}
          {step === 2 && <text x={210} y={342} {...label} fontSize={12}>read bottom to top: attention first, then the MLP</text>}
        </svg>
      )}
    </Stepped>
  )
}

// Figure 2: GPT-2 small, bottom to top. Counts are the output of the guide's parameter block.
const STACK = [
  { y: 356, text: <>token embeddings <Sub base="W" sub="E" /> + position vectors <Sub base="W" sub="P" /></>, count: "38,597,376 + 786,432" },
  { y: 300, text: "block 1: attention, then MLP", count: "7,087,872" },
  { y: 256, text: "block 2", count: "7,087,872" },
  { y: 176, text: "block 12", count: "7,087,872" },
  { y: 120, text: "final layer norm", count: "1,536" },
  { y: 64, text: <>output layer (reuses <Sub base="W" sub="E" />)</>, count: "0 more" },
]

export function StackFigure() {
  const m = "url(#stack-arrow)"
  return (
    <svg viewBox="0 0 480 430" width="100%" style={{ maxWidth: 560 }} role="img">
      <title>GPT-2 small from bottom to top: token embeddings plus position vectors, 39,383,808 parameters; twelve blocks of 7,087,872 parameters each, 85,054,464 in all; a final layer norm of 1,536; and an output layer that reuses the embedding table; 124,439,808 parameters in total</title>
      <ArrowDefs id="stack-arrow" />
      <text x={150} y={420} {...label} fontSize={12}>token IDs: n integers</text>
      <text x={150} y={20} {...label} fontSize={12}>logits: n × 50,257</text>
      <line x1={150} y1={406} x2={150} y2={386} {...ink} strokeWidth={1.2} markerEnd={m} />
      {STACK.map((b) => (
        <g key={b.y}>
          <rect x={20} y={b.y} width={260} height={28} rx={5} {...ink} />
          <text x={150} y={b.y + 19} {...label} fontSize={12}>{b.text}</text>
          <text x={296} y={b.y + 19} {...mono} fontSize={12} textAnchor="start">{b.count}</text>
        </g>
      ))}
      {[[354, 330], [298, 286], [254, 238], [214, 206], [174, 150], [118, 94], [62, 28]].map(([from, to]) => (
        <line key={from} x1={150} y1={from} x2={150} y2={to} {...ink} strokeWidth={1.2} markerEnd={m} />
      ))}
      <text x={150} y={231} {...label} fontSize={18}>⋮</text>
      <text x={186} y={346} {...label} fontSize={12}>n × 768</text>
      <text x={186} y={166} {...label} fontSize={12}>n × 768</text>
      <path d="M 376 176 h 10 v 152 h -10" {...ink} strokeWidth={1.2} />
      <text x={394} y={248} {...mono} fontSize={12} textAnchor="start">12 blocks:</text>
      <text x={394} y={264} {...mono} fontSize={12} textAnchor="start">85,054,464</text>
      <text x={296} y={420} {...mono} fontSize={12} textAnchor="start" fontWeight={600}>total 124,439,808</text>
    </svg>
  )
}

// Figure 3: the trained toy model's loss by position. Values are the "model" column of the guide's
// per-position block; the two dashed floors are the
// "floor" column's first two values (these windows, one and two characters).
const LOSSES = [0.874, 0.304, 0.300, 0.206, 0.170, 0.127, 0.110, 0.110, 0.103, 0.051, 0.038, 0.026, 0.014, 0.001, 0.001, 0.001]
const FLOORS = [
  { value: 0.869, text: "0.869: floor with one character" },
  { value: 0.301, text: "0.301: floor with two characters" },
]

export function ContextLossFigure() {
  const px = (k) => 56 + (k - 1) * 24
  const py = (v) => 250 - v * 215
  return (
    <svg viewBox="0 0 450 300" width="100%" style={{ maxWidth: 540 }} role="img">
      <title>Line chart of the trained toy transformer's loss against characters of context, 1 to 16: 0.874 with one character, 0.304 with two, 0.206 with four, 0.110 with eight, 0.026 with twelve and 0.001 with sixteen; dashed lines mark the floors on the same windows, 0.869 for one character and 0.301 for two</title>
      <line x1={44} y1={250} x2={430} y2={250} {...ink} strokeWidth={1.2} />
      <line x1={44} y1={250} x2={44} y2={24} {...ink} strokeWidth={1.2} />
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <g key={v}>
          <line x1={40} y1={py(v)} x2={44} y2={py(v)} {...ink} strokeWidth={1.2} />
          <text x={36} y={py(v) + 4} {...mono} fontSize={11} textAnchor="end">{v.toFixed(2)}</text>
        </g>
      ))}
      {[1, 2, 4, 8, 12, 16].map((k) => (
        <g key={k}>
          <line x1={px(k)} y1={250} x2={px(k)} y2={254} {...ink} strokeWidth={1.2} />
          <text x={px(k)} y={268} {...mono} fontSize={11}>{k}</text>
        </g>
      ))}
      <text x={237} y={290} {...label} fontSize={12}>characters of context</text>
      <text x={44} y={12} {...label} fontSize={12}>loss</text>
      {FLOORS.map((f) => (
        <g key={f.value}>
          <line x1={44} y1={py(f.value)} x2={430} y2={py(f.value)} {...ink} strokeWidth={1} strokeDasharray="5 4" />
          <text x={426} y={py(f.value) - 6} {...label} fontSize={12} textAnchor="end">{f.text}</text>
        </g>
      ))}
      <polyline points={LOSSES.map((v, i) => `${px(i + 1)},${py(v)}`).join(" ")} {...ink} />
      {LOSSES.map((v, i) => (
        <circle key={i} cx={px(i + 1)} cy={py(v)} r={3} fill="currentColor" />
      ))}
      <text x={px(1) + 8} y={py(0.874) + 16} {...mono} fontSize={11} textAnchor="start">0.874</text>
      <text x={px(2) + 4} y={py(0.304) + 18} {...mono} fontSize={11}>0.304</text>
      <text x={px(8)} y={py(0.110) - 9} {...mono} fontSize={11}>0.110</text>
      <text x={px(16)} y={py(0.001) - 9} {...mono} fontSize={11}>0.001</text>
    </svg>
  )
}
