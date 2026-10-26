"use client"

import { ArrowDefs, Stepped, ink, label } from "./stepped"

const mono = { fill: "currentColor", fontSize: 13, textAnchor: "middle", fontFamily: "ui-monospace, Menlo, Consolas, monospace" }

// A symbol with a superscript (W with Q) or a subscript (d with model), for use inside <text>.
// The zero-width space carries the shift back to the baseline.
function Sup({ base, sup }) {
  return (
    <tspan>
      {base}
      <tspan dy={-5} fontSize={9}>{sup}</tspan>
      <tspan dy={5}>{"​"}</tspan>
    </tspan>
  )
}

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
const dV = <Sub base="d" sub="v" />
const dK = <Sub base="d" sub="k" />

// Figure 1: the hand-worked example. Numbers are the output of the guide's second code block.
const LOOKUP = [
  { token: "the", key: "[0, 0]", value: "[1, 0]", score: "0", weight: "0.090", x: 70 },
  { token: "cat", key: "[2, 0]", value: "[0, 1]", score: "2", weight: "0.665", x: 200 },
  { token: "sat", key: "[1, 1]", value: "[1, 1]", score: "1", weight: "0.245", x: 330 },
]

export function SoftLookupFigure() {
  const captions = [
    "score = query · key",
    "weights = softmax of the scores 0, 2, 1",
    "weight × value, then add them up",
  ]
  return (
    <Stepped labels={["1 scores", "2 weights", "3 weighted sum"]}>
      {(step) => (
        <svg viewBox="0 0 400 250" width="100%" style={{ maxWidth: 480 }} role="img">
          <title>Attention for the token sat over the, cat and sat: scores 0, 2 and 1 become weights 0.090, 0.665 and 0.245, and the weighted sum of the values is 0.335, 0.910</title>
          <ArrowDefs id="lookup-arrow" />
          {LOOKUP.map((t) => (
            <g key={t.token}>
              <text x={t.x} y={16} {...mono} fontSize={14} fontWeight={600}>{t.token}</text>
              <text x={t.x} y={36} {...mono} opacity={step === 2 ? 0.45 : 1}>key {t.key}</text>
              <text x={t.x} y={54} {...mono} opacity={step === 2 ? 1 : 0.45}>value {t.value}</text>
              <rect x={t.x - 63} y={66} width={126} height={28} rx={5} {...ink} strokeWidth={1.2} fill="currentColor" fillOpacity={step === 0 ? 0 : 0.04 + 0.3 * Number(t.weight)} />
              <text x={t.x} y={85} {...mono}>
                {step === 0 ? t.score : step === 1 ? t.weight : `${t.weight} × ${t.value}`}
              </text>
              {step === 2 ? (
                <line x1={t.x} y1={96} x2={200 + (t.x - 200) * 0.45} y2={170} {...ink} strokeWidth={1.2} markerEnd="url(#lookup-arrow)" />
              ) : (
                <line x1={200 + (t.x - 200) * 0.12} y1={176} x2={t.x} y2={98} {...ink} strokeWidth={1.2} markerEnd="url(#lookup-arrow)" />
              )}
            </g>
          ))}
          {step === 2 ? (
            <text x={200} y={194} {...mono} fontSize={14}>new vector for sat = [0.335, 0.910]</text>
          ) : (
            <g>
              <rect x={120} y={178} width={160} height={28} rx={5} {...ink} strokeWidth={1.4} />
              <text x={200} y={197} {...mono}>query of sat [1, 0]</text>
            </g>
          )}
          <text x={200} y={234} {...label}>{captions[step]}</text>
        </svg>
      )}
    </Stepped>
  )
}

// Figure 2: the causal mask on the running example. Rows are queries, columns are keys.
// WEIGHTS is the 5 x 5 matrix printed by the guide's code (untrained toy head, lowercased words).
const TOKENS = ["The", "cat", "sat", "on", "the"]
const WEIGHTS = [
  [1.0, 0.0, 0.0, 0.0, 0.0],
  [0.619, 0.381, 0.0, 0.0, 0.0],
  [0.757, 0.14, 0.103, 0.0, 0.0],
  [0.042, 0.017, 0.899, 0.042, 0.0],
  [0.081, 0.215, 0.135, 0.488, 0.081],
]

export function MaskFigure() {
  const X0 = 96
  const Y0 = 58
  const CW = 48
  const CH = 30
  return (
    <Stepped labels={["1 the mask", "2 weights"]}>
      {(step) => (
        <svg viewBox="0 0 400 236" width="100%" style={{ maxWidth: 480 }} role="img">
          <title>A 5 by 5 grid for The cat sat on the, one row per query and one column per key: cells on and below the diagonal are allowed, cells above it are blocked, and the weights in each row sum to 1</title>
          <text x={X0 + 2.5 * CW} y={16} {...label}>key: the token drawn from</text>
          <text x={X0 - 10} y={Y0 - 12} {...label} textAnchor="end">query</text>
          {TOKENS.map((t, c) => (
            <text key={c} x={X0 + (c + 0.5) * CW} y={Y0 - 12} {...mono}>{step === 1 ? t.toLowerCase() : t}</text>
          ))}
          {step === 1 && <text x={X0 + 5 * CW + 34} y={Y0 - 12} {...label}>row sum</text>}
          {TOKENS.map((t, r) => (
            <g key={r}>
              <text x={X0 - 10} y={Y0 + r * CH + 20} {...mono} textAnchor="end">{step === 1 ? t.toLowerCase() : t}</text>
              {TOKENS.map((_, c) => {
                const allowed = c <= r
                const w = WEIGHTS[r][c]
                const shade = step === 0 ? (allowed ? 0.14 : 0) : allowed ? 0.03 + 0.25 * w : 0
                const text = step === 0 ? (allowed ? "0" : "−∞") : allowed ? w.toFixed(3) : "0"
                return (
                  <g key={c}>
                    <rect x={X0 + c * CW} y={Y0 + r * CH} width={CW} height={CH} {...ink} strokeWidth={1} fill="currentColor" fillOpacity={shade} />
                    <text x={X0 + (c + 0.5) * CW} y={Y0 + r * CH + 20} {...mono} fontSize={text === "−∞" ? 16 : 12} opacity={allowed ? 1 : 0.6}>{text}</text>
                  </g>
                )
              })}
              {step === 1 && <text x={X0 + 5 * CW + 34} y={Y0 + r * CH + 20} {...mono} fontSize={12}>1.000</text>}
            </g>
          ))}
          <text x={X0 + 2.5 * CW} y={Y0 + 5 * CH + 24} {...label}>
            {step === 0 ? "shaded: allowed (itself and earlier tokens)" : "untrained toy weights, lowercased input; blocked cells get exactly 0"}
          </text>
        </svg>
      )}
    </Stepped>
  )
}

// Figure 3: h narrow heads on the same X, placed side by side, then mixed by W^O.
export function HeadsFigure() {
  const m = "url(#heads-arrow)"
  const heads = [
    { name: "head 1", x: 70 },
    { name: "head 2", x: 170 },
    { name: "head h", x: 350 },
  ]
  return (
    <svg viewBox="0 0 420 330" width="100%" style={{ maxWidth: 500 }} role="img">
      <title>Multi-head attention: h heads each read the same X with their own narrow query, key and value matrices of width d_model divided by h; their outputs are placed side by side and multiplied by the output matrix to return to width d_model</title>
      <ArrowDefs id="heads-arrow" />
      <rect x={130} y={8} width={160} height={28} rx={5} {...ink} />
      <text x={210} y={27} {...label}>X: n × {dModel}</text>
      {heads.map((hd) => (
        <g key={hd.name}>
          <line x1={210 + (hd.x - 210) * 0.3} y1={38} x2={hd.x} y2={68} {...ink} strokeWidth={1.2} markerEnd={m} />
          <rect x={hd.x - 46} y={70} width={92} height={76} rx={5} {...ink} />
          <text x={hd.x} y={90} {...label} fontWeight={600}>{hd.name}</text>
          <text x={hd.x} y={112} {...label}>
            <Sup base="W" sup="Q" /> <Sup base="W" sup="K" /> <Sup base="W" sup="V" />
          </text>
          <text x={hd.x} y={134} {...label} fontSize={13}>{dK} = {dModel} / h</text>
          <line x1={hd.x} y1={146} x2={hd.x} y2={186} {...ink} strokeWidth={1.2} markerEnd={m} />
          <rect x={hd.x - 50} y={188} width={100} height={26} {...ink} strokeWidth={1.2} fill="currentColor" fillOpacity={0.1} />
          <text x={hd.x} y={206} {...label} fontSize={12}>n × {dV}</text>
        </g>
      ))}
      <text x={260} y={112} {...label} fontSize={18}>…</text>
      <rect x={220} y={188} width={80} height={26} {...ink} strokeWidth={1.2} strokeDasharray="3 3" />
      <text x={260} y={205} {...label} fontSize={18}>…</text>
      <text x={210} y={234} {...label} fontSize={12}>placed side by side: n × (h · {dV})</text>
      <line x1={210} y1={240} x2={210} y2={256} {...ink} strokeWidth={1.2} markerEnd={m} />
      <rect x={130} y={258} width={160} height={28} rx={5} {...ink} />
      <text x={210} y={277} {...label}>
        × <Sup base="W" sup="O" /> → n × {dModel}
      </text>
      <text x={210} y={316} {...label} fontSize={12}>GPT-2 small: h = 12, {dK} = {dV} = 64, {dModel} = 768</text>
    </svg>
  )
}

// Figure 4: without position vectors, reversing the input only reverses the output.
const SENTENCE = ["the", "cat", "saw", "the", "dog"]
// The two "the" rows are identical inputs, so without positions they get the same output, a.
const OUT = ["a", "b", "c", "a", "e"]
const OUT_POS = ["a′", "b′", "c′", "d′", "e′"]

function OrderRow({ y, title, words, outputs, step, arrow }) {
  const X0 = 64
  const BW = 62
  const GAP = 6
  const W = 5 * BW + 4 * GAP
  return (
    <g>
      <text x={X0} y={y} {...label} textAnchor="start">{title}</text>
      <text x={X0 - 8} y={y + 32} {...label} fontSize={12} textAnchor="end">input</text>
      <text x={X0 - 8} y={y + 124} {...label} fontSize={12} textAnchor="end">output</text>
      <rect x={X0} y={y + 66} width={W} height={22} rx={4} {...ink} strokeWidth={1.2} />
      <text x={X0 + W / 2} y={y + 81} {...label} fontSize={12}>attention, no mask: every output draws on all five inputs</text>
      {words.map((w, i) => {
        const x = X0 + i * (BW + GAP)
        return (
          <g key={i}>
            <rect x={x} y={y + 8} width={BW} height={40} rx={4} {...ink} strokeWidth={1.2} />
            <text x={x + BW / 2} y={y + 25} {...mono} fontSize={13}>{w}</text>
            {step === 1 && <text x={x + BW / 2} y={y + 41} {...mono} fontSize={12}>+ pos {i + 1}</text>}
            <line x1={x + BW / 2} y1={y + 49} x2={x + BW / 2} y2={y + 64} {...ink} strokeWidth={1.2} markerEnd={arrow} />
            <line x1={x + BW / 2} y1={y + 89} x2={x + BW / 2} y2={y + 104} {...ink} strokeWidth={1.2} markerEnd={arrow} />
            <rect x={x} y={y + 106} width={BW} height={26} rx={4} {...ink} strokeWidth={1.2} fill="currentColor" fillOpacity={0.1} />
            <text x={x + BW / 2} y={y + 124} {...mono} fontSize={12}>{outputs[i]}</text>
          </g>
        )
      })}
    </g>
  )
}

export function OrderFigure() {
  const reversed = [...SENTENCE].reverse()
  return (
    <Stepped labels={["1 no positions", "2 positions added"]}>
      {(step) => (
        <svg viewBox="0 0 420 348" width="100%" style={{ maxWidth: 500 }} role="img">
          <title>Attention with no mask on the cat saw the dog and on the same words reversed: without position vectors the five outputs are the same vectors in reverse order; with a position vector added to each input the outputs differ</title>
          <ArrowDefs id="order-arrow" />
          <OrderRow y={16} title="original order" words={SENTENCE} step={step} arrow="url(#order-arrow)" outputs={step === 0 ? OUT : OUT_POS} />
          <OrderRow y={176} title="reversed order" words={reversed} step={step} arrow="url(#order-arrow)" outputs={step === 0 ? [...OUT].reverse() : [...OUT_POS].reverse().map((o) => `≠ ${o}`)} />
          <text x={64} y={336} {...label} textAnchor="start">
            {step === 0 ? "The same output vectors, in reverse order." : "The outputs differ, by up to 0.749 in the toy run."}
          </text>
        </svg>
      )}
    </Stepped>
  )
}
