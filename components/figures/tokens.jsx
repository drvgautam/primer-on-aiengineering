"use client"

import { ArrowDefs, Stepped, ink, label } from "./stepped"

const mono = { fill: "currentColor", fontSize: 14, textAnchor: "middle", fontFamily: "ui-monospace, Menlo, Consolas, monospace" }
const CW = 14 // width of one character cell
const PAD = 6 // horizontal padding inside a token box
const GAP = 3 // gap between token boxes
const H = 28 // token box height

const tokenWidth = (token) => token.length * CW + PAD

// One token box. A space is drawn as an open bracket on the baseline so it stays visible.
function Token({ x, y, token, marked }) {
  return (
    <g>
      <rect x={x} y={y} width={tokenWidth(token)} height={H} rx={4} {...ink} fill="currentColor" fillOpacity={marked ? 0.14 : 0} strokeWidth={marked ? 2.2 : 1.2} />
      {[...token].map((c, i) => {
        const cx = x + PAD / 2 + (i + 0.5) * CW
        return c === " " ? (
          <path key={i} d={`M${cx - 4},${y + H - 13} v4 h8 v-4`} {...ink} strokeWidth={1.2} />
        ) : (
          <text key={i} x={cx} y={y + H - 9} {...mono}>{c}</text>
        )
      })}
    </g>
  )
}

// Where each token of a left-aligned row goes; rows wider than `wrap` continue on the next line.
const LINE = H + 8
function layout(tokens, x, wrap = Infinity) {
  let cursor = x
  let line = 0
  return tokens.map((token) => {
    if (cursor > x && cursor + tokenWidth(token) > x + wrap) {
      cursor = x
      line++
    }
    const at = { token, x: cursor, line }
    cursor += tokenWidth(token) + GAP
    return at
  })
}

// A left-aligned row of token boxes. `marked` is a predicate picking tokens to emphasise.
function TokenRow({ tokens, x = 20, y, wrap, marked = () => false }) {
  return (
    <g>
      {layout(tokens, x, wrap).map((at, i) => (
        <Token key={i} x={at.x} y={y + at.line * LINE} token={at.token} marked={marked(at.token)} />
      ))}
    </g>
  )
}

// Figure 1: "the cat sat on the mat" split three ways. Counts are from the guide's code:
// 22 characters, 6 words, 11 tokens from the 10-merge toy tokenizer.
export function SplitsFigure() {
  const sentence = "the cat sat on the mat"
  const rows = [
    { name: "characters", tokens: [...sentence] },
    { name: "words", tokens: sentence.split(" ") },
    { name: "toy BPE, 10 merges", tokens: ["the", " cat", " ", "s", "at", " ", "on", " the", " ", "m", "at"] },
  ]
  // rows wrap at 300 so the figure stays legible at phone width
  const WRAP = 300
  let y = 0
  const placed = rows.map((row) => {
    const top = y
    y += 34 + (layout(row.tokens, 20, WRAP).at(-1).line + 1) * LINE + 10
    return { ...row, top }
  })
  return (
    <svg viewBox={`0 0 340 ${y}`} width="100%" style={{ maxWidth: 420 }} role="img">
      <title>The sentence "the cat sat on the mat" split three ways: 22 characters, 6 words, or 11 tokens from the toy byte-pair encoding tokenizer</title>
      {placed.map((row) => (
        <g key={row.name}>
          <text x={20} y={row.top + 24} {...label} textAnchor="start">{row.name}: {row.tokens.length} tokens</text>
          <TokenRow tokens={row.tokens} y={row.top + 34} wrap={WRAP} />
        </g>
      ))}
    </svg>
  )
}

function mergePair(word, a, b) {
  const out = []
  for (let i = 0; i < word.length; i++) {
    if (word[i] === a && word[i + 1] === b) {
      out.push(a + b)
      i++
    } else out.push(word[i])
  }
  return out
}

// Figure 2: the first four merges of the toy run, in table order, on three of its words.
// `after` is the toy text's token count once that merge is applied (from the guide's code).
const MERGES = [
  { pair: ["t", "h"], after: 117 },
  { pair: ["th", "e"], after: 106 },
  { pair: [" ", "the"], after: 96 },
  { pair: ["a", "t"], after: 88 },
]

export function MergesFigure() {
  const show = (t) => (t === " " ? "space" : t)
  const labels = ["start", ...MERGES.map((m, i) => `${i + 1}  ${show(m.pair[0])} + ${show(m.pair[1])}`)]
  return (
    <Stepped labels={labels}>
      {(step) => {
        let words = [" the", " cat", " dog"].map((w) => [...w])
        MERGES.slice(0, step).forEach((m) => {
          words = words.map((w) => mergePair(w, m.pair[0], m.pair[1]))
        })
        const fresh = step > 0 ? MERGES[step - 1].pair.join("") : null
        const count = step > 0 ? MERGES[step - 1].after : 128
        return (
          <svg viewBox="0 0 300 232" width="100%" style={{ maxWidth: 360 }} role="img">
            <title>Byte-pair encoding merges on the words " the", " cat" and " dog": t and h join, then th and e, then the space and the, then a and t</title>
            {words.map((tokens, i) => (
              <TokenRow key={i} tokens={tokens} x={20} y={12 + i * 44} marked={(t) => t === fresh} />
            ))}
            <text x={20} y={164} {...label} textAnchor="start">{step === 0 ? "every character is a token" : `merge ${step}: glue ${show(MERGES[step - 1].pair[0])} and ${show(MERGES[step - 1].pair[1])}`}</text>
            <text x={20} y={184} {...label} textAnchor="start">{step === 0 ? "the bracket marks the space before a word" : "the new token is shaded"}</text>
            <text x={20} y={216} {...label} textAnchor="start">toy text: {count} tokens</text>
          </svg>
        )
      }}
    </Stepped>
  )
}

// Figure 3: text -> tokens -> token IDs for the running example, with real GPT-2 IDs.
export function TextToIdsFigure() {
  const tokens = ["The", " cat", " sat", " on", " the"]
  const ids = [464, 3797, 3332, 319, 262]
  const col = (i) => 112 + i * 72
  const m = "url(#ids-arrow)"
  return (
    <svg viewBox="0 0 440 300" width="100%" style={{ maxWidth: 520 }} role="img">
      <title>The text "The cat sat on the" is split into five GPT-2 tokens, The, cat, sat, on, the, each with a leading space except the first, and encoded as the token IDs 464, 3797, 3332, 319, 262; a faded last row marks the vectors of Guide 3</title>
      <ArrowDefs id="ids-arrow" />
      <text x={8} y={39} {...label} fontSize={15} textAnchor="start">text</text>
      <rect x={col(0) - 32} y={20} width={4 * 72 + 64} height={H} rx={4} {...ink} strokeWidth={1.2} />
      <text x={col(2)} y={39} {...mono}>The cat sat on the</text>

      <text x={8} y={76} {...label} fontSize={13} textAnchor="start" fontStyle="italic">split</text>
      <text x={8} y={115} {...label} fontSize={15} textAnchor="start">tokens</text>
      <text x={8} y={152} {...label} fontSize={13} textAnchor="start" fontStyle="italic">look up</text>
      <text x={8} y={191} {...label} fontSize={15} textAnchor="start">token IDs</text>
      <text x={8} y={260} {...label} fontSize={15} textAnchor="start" opacity={0.8}>vectors</text>
      <text x={8} y={276} {...label} fontSize={15} textAnchor="start" opacity={0.8}>(Guide 3)</text>
      {tokens.map((token, i) => (
        <g key={i}>
          <line x1={col(i)} y1={52} x2={col(i)} y2={92} {...ink} markerEnd={m} />
          <Token x={col(i) - tokenWidth(token) / 2} y={96} token={token} />
          <line x1={col(i)} y1={128} x2={col(i)} y2={168} {...ink} markerEnd={m} />
          <text x={col(i)} y={191} {...mono}>{ids[i]}</text>
          <g opacity={0.55}>
            <line x1={col(i)} y1={204} x2={col(i)} y2={244} {...ink} strokeDasharray="4 4" markerEnd={m} />
            <rect x={col(i) - 30} y={248} width={60} height={H} rx={4} {...ink} strokeWidth={1.2} strokeDasharray="4 4" />
          </g>
        </g>
      ))}
    </svg>
  )
}
