"use client"

import { ArrowDefs, Stepped, ink, label } from "./stepped"

const mono = { fill: "currentColor", fontSize: 13, textAnchor: "middle", fontFamily: "ui-monospace, Menlo, Consolas, monospace" }

// Shown names for characters: the space is drawn as a visible symbol.
const show = (ch) => (ch === " " ? "␣" : ch)

// Figure 1: four turns of the generation loop. Values are the last four lines of the guide's
// probs block (greedy choice: the most probable character is appended).
const LOOP = [
  { context: "the cat ", top: [["s", 0.513], ["r", 0.265], ["a", 0.22]] },
  { context: "the cat s", top: [["a", 0.999], ["r", 0.0], ["n", 0.0]] },
  { context: "the cat sa", top: [["t", 0.599], ["w", 0.398], ["m", 0.001]] },
  { context: "the cat sat", top: [[" ", 1.0], ["o", 0.0], ["c", 0.0]] },
]

export function LoopFigure() {
  const m = "url(#loop-arrow)"
  return (
    <Stepped labels={["step 1", "step 2", "step 3", "step 4"]}>
      {(step) => {
        const s = LOOP[step]
        const chars = s.context.split("")
        const cell = 27
        const x0 = 24                                  // fixed, so earlier characters never move
        const chosen = s.top[0][0]
        return (
          <svg viewBox="0 0 420 310" width="100%" style={{ maxWidth: 500 }} role="img">
            <title>{`Generation step ${step + 1}: the model reads "${s.context}", its three most probable next characters are ${s.top.map(([c, v]) => `${c === " " ? "space" : c} ${v.toFixed(3)}`).join(", ")}, and the most probable one is appended`}</title>
            <ArrowDefs id="loop-arrow" />
            <text x={24} y={22} {...label} textAnchor="start" fontSize={16}>context so far ({chars.length} characters, ␣ = space)</text>
            <text x={x0 + chars.length * cell + 6 + cell / 2} y={80} {...label} fontSize={14}>appended</text>
            {chars.map((c, i) => (
              <g key={i}>
                <rect x={x0 + i * cell} y={32} width={cell} height={28} {...ink} strokeWidth={1.2} />
                <text x={x0 + i * cell + cell / 2} y={51} {...mono} fontSize={16}>{show(c)}</text>
              </g>
            ))}
            <rect x={x0 + chars.length * cell + 6} y={32} width={cell} height={28} {...ink} strokeWidth={1.5} strokeDasharray="4 3" fill="currentColor" fillOpacity={0.12} />
            <text x={x0 + chars.length * cell + 6 + cell / 2} y={51} {...mono} fontSize={16} fontWeight={700}>{show(chosen)}</text>
            <line x1={160} y1={66} x2={160} y2={96} {...ink} markerEnd={m} />
            <rect x={60} y={98} width={200} height={32} rx={5} {...ink} />
            <text x={160} y={120} {...label} fontSize={16}>model: last position's p</text>
            <line x1={160} y1={132} x2={160} y2={152} {...ink} markerEnd={m} />
            <path d={`M ${112 + Math.max(1, s.top[0][1] * 220) + 64} 175 C 400 175, 400 70, ${x0 + chars.length * cell + 6 + cell / 2 + 16} 62`} {...ink} strokeWidth={1.2} strokeDasharray="4 3" markerEnd={m} />
            {s.top.map(([c, v], i) => {
              const y = 164 + i * 34
              return (
                <g key={c}>
                  <text x={96} y={y + 17} {...mono} fontSize={16} textAnchor="end">{show(c)}</text>
                  <rect x={104} y={y} width={Math.max(1, v * 220)} height={22} {...ink} strokeWidth={1.2} fill="currentColor" fillOpacity={i === 0 ? 0.55 : 0.15} />
                  <text x={112 + Math.max(1, v * 220)} y={y + 17} {...mono} textAnchor="start" fontSize={16}>{v.toFixed(3)}</text>
                </g>
              )
            })}
            <text x={210} y={278} {...label} fontSize={16}>the top character is appended,</text>
            <text x={210} y={298} {...label} fontSize={16}>and the loop runs again</text>
          </svg>
        )
      }}
    </Stepped>
  )
}

// Figure 2: "and the " at three temperatures, from the guide's temperature block.
const TEMPS = [
  { T: "0.5", bars: [["c", 0.702], ["d", 0.298], ["other 25", 0.0]] },
  { T: "1", bars: [["c", 0.604], ["d", 0.394], ["other 25", 0.003]] },
  { T: "2", bars: [["c", 0.486], ["d", 0.392], ["other 25", 0.122]] },
]

export function TemperatureFigure() {
  return (
    <Stepped labels={["T = 0.5", "T = 1", "T = 2"]}>
      {(step) => {
        const t = TEMPS[step]
        const base = 230
        return (
          <svg viewBox="0 0 400 270" width="100%" style={{ maxWidth: 480 }} role="img">
            <title>{`The toy model's next-character probabilities after "and the " at temperature ${t.T}: ${t.bars.map(([c, v]) => `${c} ${v.toFixed(3)}`).join(", ")}`}</title>
            <text x={200} y={22} {...label} fontWeight={600} fontSize={18}>after "and the ", T = {t.T}</text>
            <line x1={40} y1={base} x2={380} y2={base} {...ink} strokeWidth={1.2} />
            {t.bars.map(([c, v], i) => {
              const x = 70 + i * 110
              const h = v * 225
              return (
                <g key={c}>
                  <rect x={x} y={base - h} width={70} height={Math.max(h, 0.5)} {...ink} strokeWidth={1.2} fill="currentColor" fillOpacity={0.3} />
                  <text x={x + 35} y={base - h - 8} {...mono} fontSize={17}>{v.toFixed(3)}</text>
                  <text x={x + 35} y={base + 22} {...mono} fontSize={17}>{c}</text>
                </g>
              )
            })}
          </svg>
        )
      }}
    </Stepped>
  )
}

// Figure 3: top-k and top-p on the five-token example, from the guide's cut block.
const FIVE = [0.5, 0.25, 0.12, 0.08, 0.05]
const RUNNING = [0.5, 0.75, 0.87, 0.95, 1.0]

export function CutsFigure() {
  const base = 220
  const x = (i) => 56 + i * 66
  const cutAt = (i) => x(i) - 5
  const KEPT = ["both", "both", "top-p", "top-p", "neither"]
  const TOP2 = ["0.667", "0.333"]
  const TOPP = ["0.526", "0.263", "0.126", "0.084"]
  return (
    <svg viewBox="0 0 420 370" width="100%" style={{ maxWidth: 500 }} role="img">
      <title>Five tokens with probabilities 0.50, 0.25, 0.12, 0.08 and 0.05, running totals 0.50, 0.75, 0.87, 0.95 and 1.00; the top-2 cut falls after the second bar and keeps 0.667 and 0.333 after renormalizing; the top-p cut at 0.9 falls after the fourth bar and keeps 0.526, 0.263, 0.126 and 0.084</title>
      <line x1={36} y1={base} x2={400} y2={base} {...ink} strokeWidth={1.2} />
      {FIVE.map((v, i) => (
        <g key={i}>
          <rect x={x(i)} y={base - v * 300} width={50} height={v * 300} {...ink} strokeWidth={1.2} fill="currentColor" fillOpacity={KEPT[i] === "neither" ? 0 : 0.15} strokeDasharray={KEPT[i] === "neither" ? "4 3" : undefined} />
          {KEPT[i] === "both" && <rect x={x(i)} y={base - v * 300} width={50} height={v * 300} fill="url(#cuts-hatch)" />}
          <text x={x(i) + 25} y={base - v * 300 - 8} {...mono} fontSize={15}>{v.toFixed(2)}</text>
          <text x={x(i) + 25} y={base + 20} {...mono} fontSize={15}>{RUNNING[i].toFixed(2)}</text>
          <text x={x(i) + 25} y={base + 42} {...mono} fontSize={15}>{TOP2[i] ?? "–"}</text>
          <text x={x(i) + 25} y={base + 64} {...mono} fontSize={15}>{TOPP[i] ?? "–"}</text>
        </g>
      ))}
      <defs>
        <pattern id="cuts-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={6} stroke="currentColor" strokeWidth={2} />
        </pattern>
      </defs>
      <text x={40} y={base + 20} {...label} fontSize={15} textAnchor="end">total</text>
      <text x={40} y={base + 42} {...label} fontSize={15} textAnchor="end">top-2</text>
      <text x={40} y={base + 64} {...label} fontSize={15} textAnchor="end">top-p</text>
      <line x1={cutAt(2)} y1={40} x2={cutAt(2)} y2={base + 72} {...ink} strokeDasharray="5 4" />
      <text x={cutAt(2) - 4} y={36} {...label} fontSize={16} textAnchor="end">top-2 cut</text>
      <line x1={cutAt(4)} y1={60} x2={cutAt(4)} y2={base + 72} {...ink} strokeDasharray="5 4" />
      <text x={cutAt(4) - 4} y={56} {...label} fontSize={16} textAnchor="end">top-p 0.9 cut</text>
      <text x={210} y={base + 100} {...label} fontSize={16}>hatched: kept by both · plain: top-p only</text>
      <text x={210} y={base + 120} {...label} fontSize={16}>dashed outline: dropped by both</text>
      <text x={210} y={base + 140} {...label} fontSize={16}>rows 2–3: after renormalizing</text>
    </svg>
  )
}
