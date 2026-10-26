"use client"

import { ArrowDefs, Stepped, ink, label } from "./stepped"

const mono = { fill: "currentColor", fontSize: 14, textAnchor: "middle", fontFamily: "ui-monospace, Menlo, Consolas, monospace" }
const CELL = 30

// A grid of number cells; `shade(r, c)` picks cells to emphasise.
function Cells({ x, y, rows, shade = () => false }) {
  return (
    <g>
      {rows.map((row, r) =>
        row.map((value, c) => (
          <g key={`${r}-${c}`}>
            <rect x={x + c * CELL} y={y + r * CELL} width={CELL} height={CELL} {...ink} strokeWidth={1.2} fill="currentColor" fillOpacity={shade(r, c) ? 0.16 : 0} />
            <text x={x + (c + 0.5) * CELL} y={y + r * CELL + 20} {...mono}>{value}</text>
          </g>
        ))
      )}
    </g>
  )
}

// Figure 1: the one-hot row [0, 1, 0] times a 3 x 2 matrix gives the matrix's second row.
export function LookupFigure() {
  const M = [[1, 2], [3, 4], [5, 6]]
  return (
    <Stepped labels={["1 multiply", "2 pick the row"]}>
      {(step) => (
        <svg viewBox="0 0 340 196" width="100%" style={{ maxWidth: 400 }} role="img">
          <title>The one-hot row 0, 1, 0 times a matrix with rows 1 2, 3 4 and 5 6 gives 3 4, which is the matrix's second row</title>
          <text x={57} y={20} {...label}>one-hot x</text>
          <Cells x={12} y={58} rows={[[0, 1, 0]]} shade={(r, c) => step === 1 && c === 1} />
          <text x={117} y={79} {...label} fontSize={16}>×</text>
          <text x={162} y={20} {...label}>matrix</text>
          <Cells x={132} y={28} rows={M} shade={(r) => step === 1 && r === 1} />
          <text x={210} y={79} {...label} fontSize={16}>=</text>
          <text x={258} y={20} {...label}>result</text>
          <Cells x={228} y={58} rows={[[3, 4]]} shade={() => step === 1} />
          {step === 0 ? (
            <g>
              <text x={12} y={150} {...mono} textAnchor="start">0·1 + 1·3 + 0·5 = 3</text>
              <text x={12} y={174} {...mono} textAnchor="start">0·2 + 1·4 + 0·6 = 4</text>
            </g>
          ) : (
            <g>
              <text x={12} y={150} {...label} textAnchor="start">The 1 is in the second slot,</text>
              <text x={12} y={174} {...label} textAnchor="start">so the result is the second row.</text>
            </g>
          )}
        </svg>
      )}
    </Stepped>
  )
}

// Figure 2: the 12 toy embeddings on the first two PCA directions.
// Coordinates are the output of the guide's PCA block (seed 0), pasted here.
const POINTS = [
  ["and", 2.66, 0.45], ["cat", -1.42, 1.57], ["dog", -1.35, 2.01], ["log", -2.37, 0.26],
  ["mat", -2.37, -0.15], ["on", 2.36, 1.57], ["ran", 0.19, -1.36], ["sat", -0.34, -1.97],
  ["saw", 1.37, -0.87], ["the", 0.19, 0.65], ["then", -0.12, -2.68], ["to", 1.21, 0.53],
]

// Labels drawn to the left of their dot, so the vertical axis does not run through them.
const LEFT = new Set(["sat", "then"])

export function PcaFigure() {
  const px = (x) => 150 + 50 * x
  const py = (y) => 158 - 50 * y
  return (
    <svg viewBox="0 0 340 320" width="100%" style={{ maxWidth: 440 }} role="img">
      <title>The 12 toy word embeddings on the two main PCA directions: mat and log sit side by side, as do cat and dog, and sat and ran sit close together</title>
      <line x1={20} y1={py(0)} x2={330} y2={py(0)} {...ink} strokeWidth={0.8} opacity={0.35} />
      <line x1={px(0)} y1={12} x2={px(0)} y2={300} {...ink} strokeWidth={0.8} opacity={0.35} />
      <text x={330} y={py(0) + 14} {...label} fontSize={11} textAnchor="end" opacity={0.7}>PCA direction 1</text>
      <text x={px(0) + 6} y={20} {...label} fontSize={11} textAnchor="start" opacity={0.7}>PCA direction 2</text>
      {POINTS.map(([word, x, y]) => (
        <g key={word}>
          <circle cx={px(x)} cy={py(y)} r={3.5} fill="currentColor" />
          {LEFT.has(word) ? (
            <text x={px(x) - 7} y={py(y) + 4} {...mono} fontSize={13} textAnchor="end">{word}</text>
          ) : (
            <text x={px(x) + 7} y={py(y) + 4} {...mono} fontSize={13} textAnchor="start">{word}</text>
          )}
        </g>
      ))}
    </svg>
  )
}

// Figure 3: " bank" is token 3331 in both sentences, so both look up the same table row.
const CH = 8.4 // width of one monospace character at 14px

const PADX = 5 // box padding around the four letters of "bank"
const SHIFT = 8 // extra room after the box, so the next character clears it

// A sentence with " bank" boxed and the other words faded. textLength pins the widths,
// so the box lands on the word whatever monospace font is used.
function Sentence({ y, before, after }) {
  const x0 = 170 - ((before.length + 5 + after.length) * CH + SHIFT) / 2
  const bankX = x0 + before.length * CH
  return (
    <g>
      <text x={x0} y={y} {...mono} textAnchor="start" opacity={0.5} textLength={before.length * CH}>{before}</text>
      <rect x={bankX + CH - PADX} y={y - 17} width={4 * CH + 2 * PADX} height={24} rx={4} {...ink} strokeWidth={1.4} />
      <text x={bankX + CH} y={y} {...mono} textAnchor="start" textLength={4 * CH}>bank</text>
      <text x={bankX + 5 * CH + SHIFT} y={y} {...mono} textAnchor="start" opacity={0.5} textLength={after.length * CH} style={{ whiteSpace: "pre" }}>{after}</text>
    </g>
  )
}

// x of the centre of "bank" for a sentence laid out by <Sentence>
const bankCentre = (before, after) => 170 - ((before.length + 5 + after.length) * CH + SHIFT) / 2 + before.length * CH + 3 * CH

export function BankFigure() {
  const m = "url(#bank-arrow)"
  const bank1 = bankCentre("He sat on the river", ".")
  const bank2 = bankCentre("She got a", " loan.")
  return (
    <svg viewBox="0 0 340 250" width="100%" style={{ maxWidth: 420 }} role="img">
      <title>The token bank, ID 3331, appears in "He sat on the river bank." and in "She got a bank loan."; both occurrences look up the same row 3331 of the embedding table</title>
      <ArrowDefs id="bank-arrow" />
      <Sentence y={30} before="He sat on the river" after="." />
      <line x1={bank1} y1={40} x2={196} y2={113} {...ink} markerEnd={m} />
      <text x={70} y={100} {...label} fontSize={12} textAnchor="middle">embedding</text>
      <text x={70} y={115} {...label} fontSize={12} textAnchor="middle">table</text>
      {[0, 1, 2, 3, 4].map((r) => (
        <rect key={r} x={110} y={78 + r * 18} width={120} height={18} {...ink} strokeWidth={1} fill="currentColor" fillOpacity={r === 2 ? 0.16 : 0} opacity={r === 2 ? 1 : 0.4} />
      ))}
      <text x={170} y={127} {...mono} fontSize={12}>row 3331</text>
      <text x={286} y={127} {...label} fontSize={12}>same row</text>
      <line x1={bank2} y1={196} x2={184} y2={133} {...ink} markerEnd={m} />
      <Sentence y={220} before="She got a" after=" loan." />
    </svg>
  )
}
