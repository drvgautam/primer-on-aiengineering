"use client"

import { Stepped, ArrowDefs, ink, label } from "./stepped"

const mono = { fill: "currentColor", fontSize: 18, textAnchor: "middle", fontFamily: "ui-monospace, Menlo, Consolas, monospace" }

// Shown names for characters: the space is drawn as a visible symbol.
const show = (ch) => (ch === " " ? "␣" : ch)

// Figure 1: one request over time, prefill then decode steps.
export function PhasesFigure() {
  const steps = 6
  const x0 = 150
  const w = 46
  return (
    <svg viewBox="0 0 520 252" width="100%" style={{ maxWidth: 580 }} role="img">
      <title>Timeline of one request. A wide block labeled prefill processes all prompt positions in one parallel pass and ends at the first token. Then six narrow blocks, one decode pass each, each producing one more token. A bracket under prefill marks time to first token; a bracket under one decode block marks time per output token.</title>
      <ArrowDefs id="phase-arrow" />
      <rect x={20} y={50} width={x0 - 30} height={90} {...ink} strokeWidth={1.3} fill="currentColor" fillOpacity={0.16} />
      <text x={(20 + x0 - 10) / 2} y={92} {...label} fontSize={19}>prefill</text>
      <text x={(20 + x0 - 10) / 2} y={112} {...label} fontSize={16}>whole prompt,</text>
      <text x={(20 + x0 - 10) / 2} y={130} {...label} fontSize={16}>one pass</text>
      <text x={x0 - 10} y={40} {...label} fontSize={18} textAnchor="end">+1: the first token</text>
      {Array.from({ length: steps }, (_, i) => (
        <g key={i}>
          <rect x={x0 + i * (w + 8)} y={80} width={w} height={60} {...ink} strokeWidth={1.3} />
          <text x={x0 + i * (w + 8) + w / 2} y={116} {...label} fontSize={17}>+1</text>
        </g>
      ))}
      <text x={x0 + (steps * (w + 8)) / 2} y={66} {...label} fontSize={17}>decode: one pass per token</text>
      <line x1={20} y1={170} x2={505} y2={170} {...ink} strokeWidth={1.2} markerEnd="url(#phase-arrow)" />
      <text x={500} y={194} {...label} fontSize={18} textAnchor="end">time</text>
      <path d={`M 20 182 L 20 192 L ${x0 - 10} 192 L ${x0 - 10} 182`} {...ink} strokeWidth={1.2} />
      <text x={(20 + x0 - 10) / 2} y={218} {...label} fontSize={18}>time to</text>
      <text x={(20 + x0 - 10) / 2} y={240} {...label} fontSize={18}>first token</text>
      <path d={`M ${x0 + 2 * (w + 8)} 182 L ${x0 + 2 * (w + 8)} 192 L ${x0 + 2 * (w + 8) + w} 192 L ${x0 + 2 * (w + 8) + w} 182`} {...ink} strokeWidth={1.2} />
      <text x={x0 + 2 * (w + 8) + w / 2} y={218} {...label} fontSize={18}>time per</text>
      <text x={x0 + 2 * (w + 8) + w / 2} y={240} {...label} fontSize={18}>output token</text>
    </svg>
  )
}

// Figure 2: attention work per decode step, without and with a cache. Rows are queries, columns keys;
// the running example's 5-token prompt, then decode steps 1-3.
const C = 22

function Axes({ x, y }) {
  return (
    <g>
      <text x={x} y={y - 8} {...label} fontSize={18} textAnchor="start">keys →</text>
      <text x={x - 8} y={y + 16} {...label} fontSize={18} textAnchor="end">queries</text>
      <text x={x - 8} y={y + 36} {...label} fontSize={18} textAnchor="end">↓</text>
    </g>
  )
}

export function CacheFigure() {
  const prompt = 5
  return (
    <Stepped labels={["decode step 1", "decode step 2", "decode step 3"]}>
      {(step) => {
        const n = prompt + step + 1
        const top = 124
        const left = 80
        const right = 350
        const mid = (x) => x + (8 * C) / 2
        return (
          <svg viewBox="0 0 560 420" width="100%" style={{ maxWidth: 600 }} role="img">
            <title>{`Decode step ${step + 1} after the 5-token prompt "The cat sat on the": ${n} positions. Without a cache, all ${n} keys and values and all ${(n * (n + 1)) / 2} query–key scores of the triangle are computed again. With a cache, the ${n - 1} earlier keys and values are read from the cache, only the new key and value and the new query's row of ${n} scores are computed, and the earlier query rows aren't needed, because their outputs were finished on earlier steps.`}</title>
            <text x={mid(left)} y={24} {...label} fontSize={20}>without a cache</text>
            <text x={mid(right)} y={24} {...label} fontSize={20}>with a cache</text>
            <text x={mid(left)} y={52} {...label} fontSize={19}>keys, values: all again</text>
            <text x={mid(right)} y={52} {...label} fontSize={19}>keys, values: cached + 1</text>
            {Array.from({ length: n }, (_, k) => (
              <g key={k}>
                <rect x={left + k * C} y={62} width={C} height={C} {...ink} strokeWidth={1} fill="currentColor" fillOpacity={0.55} />
                <rect x={right + k * C} y={62} width={C} height={C} {...ink} strokeWidth={1} fill="currentColor" fillOpacity={k < n - 1 ? 0.12 : 0.55} />
              </g>
            ))}
            <Axes x={left} y={top} />
            <Axes x={right} y={top} />
            {Array.from({ length: n }, (_, r) =>
              Array.from({ length: r + 1 }, (_, k) => (
                <g key={`${r}-${k}`}>
                  <rect x={left + k * C} y={top + r * C} width={C} height={C} {...ink} strokeWidth={1} fill="currentColor" fillOpacity={0.55} />
                  <rect x={right + k * C} y={top + r * C} width={C} height={C} {...ink} strokeWidth={r < n - 1 ? 1.2 : 1}
                    strokeDasharray={r < n - 1 ? "2 3" : undefined} fill="currentColor" fillOpacity={r === n - 1 ? 0.55 : 0} opacity={r < n - 1 ? 0.6 : 1} />
                </g>
              ))
            )}
            <rect x={20} y={320} width={20} height={20} {...ink} strokeWidth={1} fill="currentColor" fillOpacity={0.55} />
            <text x={50} y={336} {...label} fontSize={19} textAnchor="start">computed this step</text>
            <rect x={20} y={352} width={20} height={20} {...ink} strokeWidth={1} fill="currentColor" fillOpacity={0.12} />
            <text x={50} y={368} {...label} fontSize={19} textAnchor="start">read from the cache</text>
            <rect x={20} y={384} width={20} height={20} {...ink} strokeWidth={1.4} strokeDasharray="2 3" fill="none" />
            <text x={50} y={400} {...label} fontSize={19} textAnchor="start">not needed: earlier rows finished before</text>
          </svg>
        )
      }}
    </Stepped>
  )
}

// Figure 3: tokens per second against batch size, from the guide's timing block on our test machine.
const BATCH = [[1, 3000], [16, 33000], [64, 75000], [256, 111000]]

export function BatchFigure() {
  const px = (b) => 70 + (Math.log2(b) / 8) * 400
  const py = (t) => 250 - ((Math.log10(t) - 3) / 2.2) * 220
  return (
    <svg viewBox="0 -4 540 320" width="100%" style={{ maxWidth: 600 }} role="img">
      <title>Log–log chart of tokens per second against sequences per decode step: about 3,000 at 1, 33,000 at 16, 75,000 at 64 and 111,000 at 256, on our test machine with one CPU thread.</title>
      <line x1={60} y1={250} x2={490} y2={250} {...ink} strokeWidth={1.2} />
      <line x1={60} y1={250} x2={60} y2={20} {...ink} strokeWidth={1.2} />
      {[1000, 10000, 100000].map((t) => (
        <g key={t}>
          <line x1={56} y1={py(t)} x2={60} y2={py(t)} {...ink} strokeWidth={1.2} />
          <text x={52} y={py(t) + 6} {...mono} fontSize={16} textAnchor="end">{t >= 1000 ? `${t / 1000}k` : t}</text>
        </g>
      ))}
      {[1, 4, 16, 64, 256].map((b) => (
        <g key={b}><line x1={px(b)} y1={250} x2={px(b)} y2={254} {...ink} strokeWidth={1.2} /><text x={px(b)} y={274} {...mono} fontSize={16}>{b}</text></g>
      ))}
      <text x={275} y={306} {...label} fontSize={19}>sequences per step</text>
      <text x={60} y={12} {...label} fontSize={19} textAnchor="start">tokens per second</text>
      <path d={BATCH.map(([b, t], i) => `${i ? "L" : "M"} ${px(b)} ${py(t)}`).join(" ")} {...ink} strokeWidth={2} />
      {BATCH.map(([b, t]) => (
        <g key={b}>
          <circle cx={px(b)} cy={py(t)} r={4.5} fill="currentColor" />
          <text x={b === 1 ? px(b) + 10 : px(b) - 8} y={b === 1 ? py(t) + 22 : py(t) - 12} {...mono} fontSize={16} textAnchor={b === 1 ? "start" : "end"}>{`${Math.round(t / 1000)}k`}</text>
        </g>
      ))}
    </svg>
  )
}

// Figure 4: one real round from the guide's run: after "...and the r", the draft proposes "at h",
// the target's choices are "at li"; 3 kept, then the target's "l".
const CONTEXT = "and the r"
const GUESS = "at h"
const CHOICE = "at li"

export function SpeculativeFigure() {
  const c = 34
  const x0 = 40 + CONTEXT.length * c
  return (
    <Stepped labels={["draft proposes", "one large-model pass", "keep and add"]}>
      {(step) => (
        <svg viewBox="0 0 560 312" width="100%" style={{ maxWidth: 600 }} role="img">
          <title>{[
            `After "...and the r", the draft model proposes 4 characters: a, t, space, h.`,
            `The large model reads the text plus all 4 guesses in one pass and gives its own choice at each of the 5 positions: a, t, space, l, i.`,
            `The first 3 guesses match and are kept; at the fourth, the large model chose l, not h, so l is added. One pass yields 4 characters.`,
          ][step]}</title>
          <text x={20} y={30} {...label} fontSize={19} textAnchor="start">text so far</text>
          {CONTEXT.split("").map((ch, i) => (
            <g key={i}>
              <rect x={40 + i * c - c / 2} y={42} width={c} height={36} {...ink} strokeWidth={1} fill="currentColor" fillOpacity={0.08} />
              <text x={40 + i * c} y={67} {...mono}>{show(ch)}</text>
            </g>
          ))}
          <text x={x0 - c / 2} y={30} {...label} fontSize={19} textAnchor="start">draft's guesses</text>
          {GUESS.split("").map((ch, i) => {
            const kept = step === 2 && i < 3
            const rejected = step === 2 && i >= 3
            return (
              <g key={i}>
                <rect x={x0 + i * c - c / 2} y={42} width={c} height={36} {...ink} strokeWidth={1.3}
                  strokeDasharray={rejected ? "4 3" : undefined} fill="currentColor" fillOpacity={kept ? 0.22 : 0} />
                <text x={x0 + i * c} y={67} {...mono} opacity={rejected ? 0.4 : 1}>{show(ch)}</text>
              </g>
            )
          })}
          {step >= 1 && (
            <g>
              <text x={20} y={130} {...label} fontSize={19} textAnchor="start">large model's choices, one pass</text>
              {CHOICE.split("").map((ch, i) => {
                const added = step === 2 && i === 3
                const dim = step === 2 && i > 3
                return (
                  <g key={i}>
                    <rect x={x0 + i * c - c / 2} y={142} width={c} height={36} {...ink} strokeWidth={1.3}
                      fill="currentColor" fillOpacity={added ? 0.22 : 0} opacity={dim ? 0.35 : 1} />
                    <text x={x0 + i * c} y={167} {...mono} opacity={dim ? 0.35 : 1}>{show(ch)}</text>
                  </g>
                )
              })}
              <text x={20} y={212} {...label} fontSize={19} textAnchor="start">its choice for each guessed slot,</text>
              <text x={20} y={236} {...label} fontSize={19} textAnchor="start">plus one beyond the last guess</text>
            </g>
          )}
          {step === 2 && (<>
            <text x={20} y={274} {...label} fontSize={20} textAnchor="start">kept: "at␣" (3 guesses) + "l" (its own)</text>
            <text x={20} y={300} {...label} fontSize={20} textAnchor="start">= 4 characters from 1 large-model pass</text>
          </>)}
        </svg>
      )}
    </Stepped>
  )
}
