"use client"

import { ArrowDefs, ink, label } from "./stepped"

const mono = { fill: "currentColor", fontSize: 17, textAnchor: "middle", fontFamily: "ui-monospace, Menlo, Consolas, monospace" }

// Shown names for characters: the space is drawn as a visible symbol.
const show = (ch) => (ch === " " ? "␣" : ch)

// W with a text subscript, as the series writes W_down and W_up.
function Sub({ x, y, sub, size = 17, anchor = "middle" }) {
  return (
    <text x={x} y={y} {...label} fontSize={size} textAnchor={anchor}>
      W<tspan baseline-shift="sub" fontSize={14}>{sub}</tspan>
    </text>
  )
}

// Figure 1: the guide's home question for the cat, as batch_pairs builds it. The full example is
// prompt + response; the row drawn is the input (all but the last character), and a position's
// loss counts when its target (the next character) belongs to the response. That starts at the
// prompt's last space, which is input but predicts the response's first character.
const PROMPT = "where does the cat live "
const RESPONSE = "in the hut and"

export function MaskFigure() {
  const text = PROMPT + RESPONSE
  const shownFrom = 19                         // start at "live " so the cells stay legible
  const cells = text.slice(shownFrom, -1).split("")
  const cell = 24
  const x0 = 60
  const first = PROMPT.length - 1 - shownFrom  // the prompt's last space predicts the response's first character
  return (
    <svg viewBox="0 0 500 262" width="100%" style={{ maxWidth: 580 }} role="img">
      <title>{`The training example "where does the cat live in the hut and", drawn from "live". The prompt characters are shaded. Each position's mask is 1 when the character it predicts belongs to the response: that starts at the prompt's last space, which predicts "i", and continues through the response, predicting i, n, space, t, h, e, space, h, u, t, space, a, n, d. The other prompt positions have mask 0 and no loss.`}</title>
      <ArrowDefs id="mask-arrow" />
      <text x={x0} y={20} {...label} textAnchor="start" fontSize={16}>input, shown from "live" (earlier positions: mask 0)</text>
      {cells.map((c, i) => {
        const inPrompt = shownFrom + i < PROMPT.length
        const counted = i >= first
        const x = x0 + i * cell
        return (
          <g key={i}>
            <rect x={x} y={34} width={cell} height={30} {...ink} strokeWidth={1.1} fill="currentColor" fillOpacity={inPrompt ? 0.16 : 0} />
            <text x={x + cell / 2} y={55} {...mono}>{show(c)}</text>
            <text x={x + cell / 2} y={92} {...mono}>{counted ? "1" : "0"}</text>
            {counted && <line x1={x + cell / 2} y1={102} x2={x + cell / 2} y2={132} {...ink} strokeWidth={1.2} markerEnd="url(#mask-arrow)" />}
            {counted && <text x={x + cell / 2} y={155} {...mono}>{show(text[shownFrom + i + 1])}</text>}
          </g>
        )
      })}
      <text x={x0 - 8} y={55} {...label} textAnchor="end" fontSize={16}>in</text>
      <text x={x0 - 8} y={92} {...label} textAnchor="end" fontSize={16}>mask</text>
      <text x={x0 - 8} y={155} {...label} textAnchor="end" fontSize={16}>target</text>
      <text x={x0 + (first + (cells.length - first) / 2) * cell} y={182} {...label} fontSize={16}>loss on these targets: the response</text>
      <text x={x0 + (first / 2) * cell} y={124} {...label} fontSize={16}>no loss</text>
      <rect x={x0} y={208} width={16} height={16} {...ink} strokeWidth={1.1} fill="currentColor" fillOpacity={0.16} />
      <text x={x0 + 24} y={221} {...label} textAnchor="start" fontSize={16}>prompt</text>
      <text x={x0} y={248} {...label} textAnchor="start" fontSize={16}>mask 1: the target is a response character</text>
    </svg>
  )
}

// Figure 2: the knowledge table from finetune_seeds.py, three seeds per cell. A tick means every seed
// passed (above 95% on "where", 3 of 3 homes); a cross means every seed failed.
const ROWS = [
  { name: ["base", "model"], cells: ["✗", "✓", "✓"], notes: ["0%", "3 of 3", "3 of 3"] },
  { name: ["fine-tuned", "base"], cells: ["✓", "✓", "✓"], notes: ["100% ×3", "3 of 3 ×3", "3 of 3 ×3"] },
  { name: ["from", "scratch"], cells: ["✓", "✓", "✗"], notes: ["97–100%", "3 of 3 ×3", "0 of 3 ×3"] },
]
const COLS = [["\"where\"", "task"], ["homes", "in data"], ["homes", "not in data"]]

export function KnowledgeFigure() {
  const cx = (j) => 178 + j * 118
  return (
    <svg viewBox="0 0 480 300" width="100%" style={{ maxWidth: 560 }} role="img">
      <title>Grid of three models by three tests. Base model: fails the "where" task (0%), passes homes of the 3 animals in the fine-tuning data and of the 3 not in it. Fine-tuned base model: passes all three in every seed. Model trained from scratch on the same data: passes the "where" task (97.4%, 100%, 100%) and the homes in the data, fails the homes not in the data (0 of 3 in every seed).</title>
      {COLS.map((c, j) => (
        <g key={j}>
          <text x={cx(j)} y={20} {...label} fontSize={17}>{c[0]}</text>
          <text x={cx(j)} y={40} {...label} fontSize={17}>{c[1]}</text>
        </g>
      ))}
      {ROWS.map((row, i) => {
        const y = 54 + i * 66
        return (
          <g key={i}>
            <text x={8} y={y + 24} {...label} textAnchor="start" fontSize={17}>{row.name[0]}</text>
            <text x={8} y={y + 44} {...label} textAnchor="start" fontSize={17}>{row.name[1]}</text>
            {row.cells.map((mark, j) => (
              <g key={j}>
                <rect x={cx(j) - 54} y={y} width={108} height={58} {...ink} strokeWidth={1.1} fill="currentColor" fillOpacity={mark === "✗" ? 0.12 : 0} />
                <text x={cx(j)} y={y + 26} {...label} fontSize={24}>{mark}</text>
                <text x={cx(j)} y={y + 49} {...mono} fontSize={15}>{row.notes[j]}</text>
              </g>
            ))}
          </g>
        )
      })}
      <text x={240} y={274} {...label} fontSize={16}>×3: the same in seeds 0, 1 and 2</text>
      <text x={240} y={294} {...label} fontSize={16}>pass: above 95% on "where"; 3 of 3 homes</text>
    </svg>
  )
}

// Figure 3: validation loss on world text, from the guide's blocks and finetune_seeds.py.
const BASE = 0.244
const TUNED = [0.594, 0.532, 0.518]
const REPLAY = [0.247, 0.249, 0.245]

export function ForgettingFigure() {
  const py = (v) => 250 - (v / 0.7) * 220
  const groups = [
    { name: "base", values: [BASE], x: 116 },
    { name: "fine-tuned", values: TUNED, x: 250 },
    { name: "with replay", values: REPLAY, x: 390 },
  ]
  return (
    <svg viewBox="0 -6 580 314" width="100%" style={{ maxWidth: 620 }} role="img">
      <title>Bar chart of validation loss on ordinary world text: base model 0.244; fine-tuned without replay 0.594, 0.532 and 0.518 for seeds 0, 1 and 2; fine-tuned with replay 0.247, 0.249 and 0.245. A dashed line at 0.244 marks the base model.</title>
      <line x1={56} y1={250} x2={470} y2={250} {...ink} strokeWidth={1.2} />
      <line x1={56} y1={250} x2={56} y2={22} {...ink} strokeWidth={1.2} />
      {[0, 0.2, 0.4, 0.6].map((v) => (
        <g key={v}>
          <line x1={52} y1={py(v)} x2={56} y2={py(v)} {...ink} strokeWidth={1.2} />
          <text x={48} y={py(v) + 5} {...mono} fontSize={16} textAnchor="end">{v}</text>
        </g>
      ))}
      <text x={56} y={10} {...label} fontSize={16} textAnchor="start">validation loss, nats per character</text>
      <line x1={56} y1={py(BASE)} x2={470} y2={py(BASE)} {...ink} strokeWidth={1} strokeDasharray="5 4" />
      {groups.map((g) => {
        const w = 28
        const pitch = w + 12
        const start = g.x - (g.values.length * pitch - 12) / 2
        return (
          <g key={g.name}>
            {g.values.map((v, i) => (
              <g key={i}>
                <rect x={start + i * pitch} y={py(v)} width={w} height={250 - py(v)} {...ink} strokeWidth={1.2} fill="currentColor" fillOpacity={g.name === "fine-tuned" ? 0.3 : 0.1} />
                <text x={start + i * pitch + w / 2} y={py(v) - 8} {...mono} fontSize={16}>{v.toFixed(3).slice(1)}</text>
              </g>
            ))}
            <text x={g.x} y={274} {...label} fontSize={17}>{g.name}</text>
          </g>
        )
      })}
      <text x={478} y={py(BASE) + 5} {...label} fontSize={16} textAnchor="start">base 0.244</text>
      <text x={250} y={304} {...label} fontSize={16}>three bars: seeds 0, 1, 2</text>
    </svg>
  )
}

// Figure 4: LoRA on GPT-2 small's 768 × 2,304 query/key/value matrix at rank 8, drawn to scale
// in height and width (1 unit = 12 numbers), except the rank, which is widened to stay visible.
export function LoraFigure() {
  const s = 1 / 12
  const W = { w: 2304 * s, h: 768 * s }        // 192 × 64
  const r = 8                                  // drawn width of 8 columns (true scale would be under 1)
  return (
    <svg viewBox="0 0 540 236" width="100%" style={{ maxWidth: 600 }} role="img">
      <title>{"The frozen weight matrix W, 768 rows by 2,304 columns, 1,769,472 numbers, drawn as a wide box. Beside it, plus the scale alpha over r times W down, a tall thin 768 by 8 matrix, times W up, a short wide 8 by 2,304 matrix that starts at zero. Together they hold 8 times (768 plus 2,304), 24,576 trainable numbers, 1.39% of W. The thin dimensions are drawn wider than scale so they stay visible."}</title>
      <text x={20} y={26} {...label} textAnchor="start" fontSize={17}>frozen</text>
      <rect x={20} y={40} width={W.w} height={W.h} {...ink} strokeWidth={1.3} fill="currentColor" fillOpacity={0.16} />
      <text x={20 + W.w / 2} y={40 + W.h / 2 + 6} {...label} fontSize={20}>W</text>
      <text x={20 + W.w / 2} y={40 + W.h + 24} {...mono} fontSize={16}>768 × 2,304</text>
      <text x={20 + W.w / 2} y={40 + W.h + 46} {...mono} fontSize={16}>1,769,472</text>
      <text x={232} y={78} {...label} fontSize={22}>+</text>
      <text x={268} y={80} {...label} fontSize={17}>α/r ·</text>
      <text x={300} y={26} {...label} textAnchor="start" fontSize={17}>trained</text>
      <rect x={300} y={40} width={r} height={W.h} {...ink} strokeWidth={1.3} />
      <Sub x={304} y={40 + W.h + 24} sub="down" />
      <text x={304} y={40 + W.h + 46} {...mono} fontSize={16}>768 × 8</text>
      <rect x={326} y={40} width={W.w} height={r} {...ink} strokeWidth={1.3} />
      <text x={326 + W.w / 2} y={74} {...label} fontSize={17}>
        W<tspan baseline-shift="sub" fontSize={14}>up</tspan>, starts at 0
      </text>
      <text x={326 + W.w / 2} y={96} {...mono} fontSize={16}>8 × 2,304</text>
      <line x1={300} y1={176} x2={518} y2={176} {...ink} strokeWidth={1} />
      <text x={409} y={200} {...mono} fontSize={16}>8 × (768 + 2,304)</text>
      <text x={409} y={222} {...mono} fontSize={16}>= 24,576 (1.39%)</text>
    </svg>
  )
}
