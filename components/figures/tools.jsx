"use client"

import { Stepped, ArrowDefs, ink, label } from "./stepped"

const mono = { fill: "currentColor", fontSize: 17, fontFamily: "ui-monospace, Menlo, Consolas, monospace" }

// Figure 1: the tool loop on the toy question. The context grows at the top; the model and the
// application sit in two columns, and the tool runs only in the application's column.
const LOOP = [
  {
    pill: "1. the model writes",
    added: "call home cat result",
    from: "model",
    note: "The model writes a call. It's only text.",
  },
  {
    pill: "2. the application spots it",
    added: "",
    from: "spot",
    note: "The application sees \"result\" and stops generation.",
  },
  {
    pill: "3. the tool runs",
    added: " hut",
    from: "tool",
    note: "The application runs home(\"cat\") and appends \" hut\".",
  },
  {
    pill: "4. the model reads it",
    added: " in the hut",
    from: "model",
    note: "The model reads the result in its context and answers.",
  },
]

export function LoopFigure() {
  return (
    <Stepped labels={LOOP.map((s) => s.pill)}>
      {(step) => {
        const s = LOOP[step]
        const line2 = LOOP.slice(0, step + 1).map((x) => x.added)
        const model = { x: 30, y: 150, w: 200, h: 110 }
        const app = { x: 320, y: 150, w: 210, h: 170 }
        const tool = { x: 345, y: 240, w: 160, h: 60 }
        const active = (k) => (s.from === k ? 0.18 : 0)
        return (
          <svg viewBox="0 0 560 400" width="100%" style={{ maxWidth: 600 }} role="img">
            <title>{`Step ${step + 1} of 4 of the tool loop. ${s.note} The context now reads: where does the cat live ${line2.join("")}.`}</title>
            <ArrowDefs id="loop-arrow" />
            <text x={30} y={26} {...label} fontSize={18} textAnchor="start">the context</text>
            <rect x={20} y={36} width={520} height={74} {...ink} strokeWidth={1.2} />
            <text x={34} y={66} {...mono}>where does the cat live</text>
            <text x={34} y={94} {...mono}>
              {line2.map((part, i) => {
                const lead = part.startsWith(" ") ? " " : ""
                const on = i === step && part
                return (
                  <tspan key={i}>
                    {lead}
                    <tspan fontWeight={on ? 700 : 400} textDecoration={on ? "underline" : undefined}>{part.slice(lead.length)}</tspan>
                  </tspan>
                )
              })}
            </text>
            <rect x={model.x} y={model.y} width={model.w} height={model.h} {...ink} strokeWidth={1.4} fill="currentColor" fillOpacity={active("model")} />
            <text x={model.x + model.w / 2} y={model.y + 34} {...label} fontSize={20}>model</text>
            <text x={model.x + model.w / 2} y={model.y + 64} {...label} fontSize={19}>reads the context,</text>
            <text x={model.x + model.w / 2} y={model.y + 88} {...label} fontSize={19}>writes text</text>
            <rect x={app.x} y={app.y} width={app.w} height={app.h} {...ink} strokeWidth={1.4} fill="currentColor" fillOpacity={active("spot")} />
            <text x={app.x + app.w / 2} y={app.y + 34} {...label} fontSize={20}>application</text>
            <text x={app.x + app.w / 2} y={app.y + 62} {...label} fontSize={19}>watches for calls</text>
            <rect x={tool.x} y={tool.y} width={tool.w} height={tool.h} {...ink} strokeWidth={1.4} fill="currentColor" fillOpacity={active("tool")} />
            <text x={tool.x + tool.w / 2} y={tool.y + 26} {...label} fontSize={17}>tool</text>
            <text x={tool.x + tool.w / 2} y={tool.y + 48} {...mono} fontSize={16} textAnchor="middle">home("cat")</text>
            {s.from === "model" && (
              <line x1={model.x + model.w / 2} y1={model.y - 4} x2={model.x + model.w / 2} y2={116} {...ink} strokeWidth={1.6} markerEnd="url(#loop-arrow)" />
            )}
            {step === 3 && (
              <line x1={model.x + model.w / 2 + 50} y1={116} x2={model.x + model.w / 2 + 50} y2={model.y - 4} {...ink} strokeWidth={1.6} markerEnd="url(#loop-arrow)" />
            )}
            {s.from === "spot" && (
              <line x1={app.x + 40} y1={116} x2={app.x + 40} y2={app.y - 4} {...ink} strokeWidth={1.6} markerEnd="url(#loop-arrow)" />
            )}
            {s.from === "tool" && (
              <path d={`M ${tool.x + 150} ${tool.y} L ${tool.x + 150} 132 L 268 132 L 268 114`} {...ink} strokeWidth={1.6} markerEnd="url(#loop-arrow)" />
            )}
            <text x={280} y={360} {...label} fontSize={19}>{s.note}</text>
            <text x={280} y={390} {...label} fontSize={17}>The tool runs only in the application's column.</text>
          </svg>
        )
      }}
    </Stepped>
  )
}

// Figure 2: one training example as segments: who writes each one, and whether it gets a loss.
const SEGMENTS = [
  { text: "where does the cat live", who: "prompt", loss: false, row: 0 },
  { text: "call home cat result", who: "call", loss: true, row: 0 },
  { text: "rug", who: "tool result", loss: false, row: 1 },
  { text: "in the rug and", who: "answer", loss: true, row: 1 },
]

export function SegmentsFigure() {
  const cw = 10.2
  const pad = 12
  const rows = [[], []]
  SEGMENTS.forEach((s) => rows[s.row].push(s))
  return (
    <svg viewBox="0 0 560 312" width="100%" style={{ maxWidth: 600 }} role="img">
      <title>One training example in four segments: the prompt "where does the cat live" with no loss; the call "call home cat result", written by the model, with loss; the tool result "rug", written by the application, with no loss; and the answer "in the rug and", written by the model, with loss.</title>
      {rows.map((row, r) => {
        let x = 20
        return row.map((s) => {
          const w = s.text.length * cw + 2 * pad
          const y = 50 + r * 120
          const g = (
            <g key={s.who}>
              <text x={x + w / 2} y={y - 12} {...label} fontSize={17}>{s.who}</text>
              <rect x={x} y={y} width={w} height={42} {...ink} strokeWidth={1.4} strokeDasharray={s.loss ? undefined : "5 4"} fill="currentColor" fillOpacity={s.loss ? 0.2 : 0} />
              <text x={x + pad} y={y + 28} {...mono}>{s.text}</text>
              <text x={x + w / 2} y={y + 66} {...label} fontSize={17} fontWeight={s.loss ? 700 : 400}>{s.loss ? "loss" : "no loss"}</text>
            </g>
          )
          x += w + 14
          return g
        })
      })}
      <text x={20} y={278} {...label} fontSize={17} textAnchor="start">shaded: written by the model, with loss</text>
      <text x={20} y={302} {...label} fontSize={17} textAnchor="start">dashed: written by the user or the application, no loss</text>
    </svg>
  )
}

// Figure 3: the trained model's top ten logits after "where does the cat live call home ",
// from the guide's run, before and after the constraint mask.
const LOGITS = [["c", 8.5], ["h", 4.3], ["f", 4.3], ["x", 2.2], ["t", 2.1], ["e", 2.1], ["d", 1.5], ["u", 1.1], ["r", 1.0], [" ", 0.9]]
const ALLOWED = new Set(["c", "d", "r", "f", "o", "h"])

function Bars({ y0, masked, title }) {
  const bw = 34
  const gap = 14
  const x0 = 60
  const scale = 10
  return (
    <g>
      <text x={20} y={y0 - 118} {...label} fontSize={18} textAnchor="start">{title}</text>
      <line x1={x0 - 10} y1={y0} x2={x0 + LOGITS.length * (bw + gap)} y2={y0} {...ink} strokeWidth={1.2} />
      {LOGITS.map(([ch, v], i) => {
        const x = x0 + i * (bw + gap)
        const off = masked && !ALLOWED.has(ch)
        return (
          <g key={ch}>
            {off ? (
              <g>
                <text x={x + bw / 2} y={y0 - 6} {...label} fontSize={22}>×</text>
                <text x={x + bw / 2} y={y0 - 30} {...label} fontSize={18}>−∞</text>
              </g>
            ) : (
              <g>
                <rect x={x} y={y0 - v * scale} width={bw} height={v * scale} {...ink} strokeWidth={1} fill="currentColor" fillOpacity={0.55} />
                <text x={x + bw / 2} y={y0 - v * scale - 8} {...label} fontSize={18}>{v.toFixed(1)}</text>
              </g>
            )}
            <text x={x + bw / 2} y={y0 + 24} {...mono} fontSize={20} textAnchor="middle">{ch === " " ? "␣" : ch}</text>
          </g>
        )
      })}
    </g>
  )
}

export function MaskFigure() {
  return (
    <svg viewBox="0 0 560 360" width="100%" style={{ maxWidth: 600 }} role="img">
      <title>Two bar charts of the trained model's ten highest logits after "where does the cat live call home ": c 8.5, h 4.3, f 4.3, x 2.2, t 2.1, e 2.1, d 1.5, u 1.1, r 1.0, space 0.9. After the constraint mask, x, t, e, u and the space are crossed out and set to minus infinity; c, h, f, d and r keep their logits.</title>
      <Bars y0={140} masked={false} title="before the mask" />
      <Bars y0={330} masked={true} title="after the constraint mask: only an animal's first letter can follow" />
    </svg>
  )
}

// Figure 4: chance of finishing a task, s to the power of the number of steps (1–20),
// with the guide's table values as markers.
const RATES = [0.99, 0.95, 0.9]

export function ReliabilityFigure() {
  const px = (k) => 70 + ((k - 1) / 19) * 400
  const py = (v) => 260 - v * 230
  return (
    <svg viewBox="0 -12 560 342" width="100%" style={{ maxWidth: 600 }} role="img">
      <title>Line chart of task success against number of steps from 1 to 20, for per-step success 0.99, 0.95 and 0.90. At 5, 10 and 20 steps: 95.1%, 90.4% and 81.8% for 0.99; 77.4%, 59.9% and 35.8% for 0.95; 59.0%, 34.9% and 12.2% for 0.90.</title>
      <line x1={60} y1={260} x2={480} y2={260} {...ink} strokeWidth={1.2} />
      <line x1={60} y1={260} x2={60} y2={20} {...ink} strokeWidth={1.2} />
      {[0, 0.5, 1].map((v) => (
        <g key={v}>
          <line x1={56} y1={py(v)} x2={60} y2={py(v)} {...ink} strokeWidth={1.2} />
          <text x={52} y={py(v) + 6} {...mono} fontSize={15} textAnchor="end">{`${v * 100}%`}</text>
        </g>
      ))}
      {[1, 5, 10, 15, 20].map((k) => (
        <g key={k}>
          <line x1={px(k)} y1={260} x2={px(k)} y2={264} {...ink} strokeWidth={1.2} />
          <text x={px(k)} y={284} {...mono} fontSize={15} textAnchor="middle">{k}</text>
        </g>
      ))}
      <text x={270} y={316} {...label} fontSize={18}>number of steps</text>
      <text x={60} y={12} {...label} fontSize={18} textAnchor="start">tasks finished</text>
      {RATES.map((s, i) => (
        <g key={s}>
          <path
            d={Array.from({ length: 20 }, (_, j) => `${j ? "L" : "M"} ${px(j + 1)} ${py(s ** (j + 1))}`).join(" ")}
            {...ink}
            strokeWidth={2}
            strokeDasharray={["", "7 4", "2 4"][i]}
          />
          {[5, 10, 20].map((k) => (
            <g key={k}>
              <circle cx={px(k)} cy={py(s ** k)} r={4.5} fill="currentColor" />
              <text x={px(k) + (k === 20 ? 10 : 8)} y={py(s ** k) - (k === 20 ? 10 : 8)} {...mono} fontSize={15} textAnchor="start">{`${(100 * s ** k).toFixed(1)}%`}</text>
            </g>
          ))}
          <text x={px(20) + 10} y={py(s ** 20) + 20} {...label} fontSize={18} textAnchor="start"><tspan fontStyle="italic">s</tspan>{` = ${s.toFixed(2)}`}</text>
        </g>
      ))}
    </svg>
  )
}
