"use client"

import { Stepped, ArrowDefs, ink, label } from "./stepped"

const mono = { fill: "currentColor", fontSize: 16, textAnchor: "middle", fontFamily: "ui-monospace, Menlo, Consolas, monospace" }

// Figure 1: RLHF's three steps, with DPO as the shortcut from comparisons straight to the policy.
function Box({ x, y, w, h, lines, shade = 0, pitch = 21 }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} {...ink} strokeWidth={1.3} fill="currentColor" fillOpacity={shade} />
      {lines.map((line, i) => (
        <text key={i} x={x + w / 2} y={y + h / 2 + 6 + (i - (lines.length - 1) / 2) * pitch} {...label} fontSize={17}>{line}</text>
      ))}
    </g>
  )
}

export function PipelineFigure() {
  return (
    <svg viewBox="0 -8 580 308" width="100%" style={{ maxWidth: 620 }} role="img">
      <title>RLHF in three steps, left to right: 1, SFT gives a starting model, whose responses people compare; 2, a reward model R is trained on those comparisons; 3, the policy pi theta is optimized to maximize reward minus beta times the KL divergence from the reference model, a frozen copy of the SFT model. Below, the comparisons feed the reward model; a dashed arrow labeled DPO goes from the comparisons straight to the policy, skipping the reward model.</title>
      <ArrowDefs id="pipe-arrow" />
      <Box x={8} y={40} w={150} h={84} lines={["1. SFT model"]} />
      <Box x={212} y={40} w={150} h={84} lines={["2. reward", "model R"]} shade={0.12} />
      <Box x={416} y={40} w={156} h={84} lines={[<>3. policy π<tspan baseline-shift="sub" fontSize={13}>θ</tspan></>, "reward − β · KL", "to reference"]} pitch={25} />
      <line x1={158} y1={82} x2={208} y2={82} {...ink} markerEnd="url(#pipe-arrow)" />
      <line x1={362} y1={82} x2={412} y2={82} {...ink} markerEnd="url(#pipe-arrow)" />
      <text x={185} y={14} {...label} fontSize={17}>responses for</text>
      <text x={185} y={33} {...label} fontSize={17}>people to compare</text>
      <text x={389} y={30} {...label} fontSize={17}>scores</text>
      <path d="M 83 124 L 83 160 L 446 160 L 446 128" {...ink} strokeWidth={1.2} strokeDasharray="2 3" markerEnd="url(#pipe-arrow)" />
      <text x={110} y={184} {...label} fontSize={17}>reference: a frozen</text>
      <text x={110} y={204} {...label} fontSize={17}>copy of the SFT model</text>
      <Box x={212} y={212} w={150} h={50} lines={["comparisons"]} />
      <line x1={287} y1={212} x2={287} y2={128} {...ink} markerEnd="url(#pipe-arrow)" />
      <path d="M 362 237 L 536 237 L 536 128" {...ink} strokeDasharray="6 4" markerEnd="url(#pipe-arrow)" />
      <text x={449} y={202} {...label} fontSize={17}>DPO: skips the</text>
      <text x={449} y={222} {...label} fontSize={17}>reward model</text>
      <text x={287} y={286} {...label} fontSize={17}>prompt, two responses, which won</text>
    </svg>
  )
}

// Figure 2: the best-of-n table from the guide's block (seed-0 reward model).
const NS = [1, 2, 4, 8, 16]
const RIGHT = [22.4, 33.2, 56.1, 80.0, 95.5]   // cat, dog, rat: the reward model is right
const WRONG = [14.2, 11.1, 2.3, 0.2, 0.0]      // fox, owl, hen: the reward model is wrong

export function BestOfNFigure() {
  const px = (i) => 80 + i * 100
  const py = (v) => 250 - v * 2.2
  const path = (values) => values.map((v, i) => `${i ? "L" : "M"} ${px(i)} ${py(v)}`).join(" ")
  return (
    <svg viewBox="0 -4 580 320" width="100%" style={{ maxWidth: 620 }} role="img">
      <title>Line chart of how often best-of-n keeps the animal's real home, against n = 1, 2, 4, 8, 16 on a doubling axis. For the cat, dog and rat, where the reward model is right, the line rises: 22.4, 33.2, 56.1, 80.0, 95.5 percent. For the fox, owl and hen, where it is wrong, the dashed line falls: 14.2, 11.1, 2.3, 0.2, 0.0 percent.</title>
      <line x1={60} y1={250} x2={500} y2={250} {...ink} strokeWidth={1.2} />
      <line x1={60} y1={250} x2={60} y2={24} {...ink} strokeWidth={1.2} />
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={56} y1={py(v)} x2={60} y2={py(v)} {...ink} strokeWidth={1.2} />
          <text x={52} y={py(v) + 5} {...mono} textAnchor="end">{v}</text>
        </g>
      ))}
      {NS.map((n, i) => (
        <text key={n} x={px(i)} y={274} {...mono}>{n}</text>
      ))}
      <text x={280} y={302} {...label} fontSize={16}>n, samples per draw (doubling)</text>
      <text x={60} y={10} {...label} fontSize={16} textAnchor="start">home chosen, %</text>
      <path d={path(RIGHT)} {...ink} strokeWidth={2} />
      <path d={path(WRONG)} {...ink} strokeWidth={2} strokeDasharray="7 5" />
      {RIGHT.map((v, i) => <circle key={i} cx={px(i)} cy={py(v)} r={4} fill="currentColor" />)}
      {WRONG.map((v, i) => <circle key={i} cx={px(i)} cy={py(v)} r={4} fill="Canvas" stroke="currentColor" strokeWidth={1.5} />)}
      <text x={px(4) - 12} y={py(95.5) - 12} {...mono} textAnchor="end">95.5</text>
      <text x={px(0) + 8} y={py(22.4) - 12} {...mono} textAnchor="start">22.4</text>
      <text x={px(0) + 8} y={py(14.2) + 26} {...mono} textAnchor="start">14.2</text>
      <text x={px(4)} y={py(0) - 12} {...mono}>0.0</text>
      <text x={px(2) - 30} y={py(56.1) - 18} {...label} fontSize={17} textAnchor="end">cat, dog, rat</text>
      <text x={px(2) - 30} y={py(56.1) + 2} {...label} fontSize={16} textAnchor="end">(reward model right)</text>
      <text x={px(2) + 14} y={py(2.3) - 36} {...label} fontSize={17} textAnchor="start">fox, owl, hen</text>
      <text x={px(2) + 14} y={py(2.3) - 16} {...label} fontSize={16} textAnchor="start">(reward model wrong)</text>
    </svg>
  )
}

// Figure 3: where the probability goes after an unseen prompt, seed 0, from the guide's block.
const RUNS = [
  { name: "base", parts: [17.6, 82.0, 0.4] },
  { name: "gentle DPO", parts: [47.6, 17.2, 35.2] },
  { name: "aggressive DPO", parts: [30.2, 0.0, 69.8] },
]
const PARTS = ["preferred place", "other places", "anything else"]
const SHADE = [0.55, 0.15, 0]

export function BreakdownFigure() {
  const top = 20
  const h = 220
  return (
    <Stepped labels={RUNS.map((r) => r.name)}>
      {(step) => (
        <svg viewBox="0 0 420 470" width="100%" style={{ maxWidth: 460 }} role="img">
          <title>{`Stacked bars of where each model's probability goes after an unseen prompt, seed 0: preferred place, other places, anything else. ${RUNS.slice(0, step + 1).map((r) => `${r.name}: ${r.parts.map((p, i) => `${PARTS[i]} ${p}%`).join(", ")}`).join(". ")}.`}</title>
          {RUNS.map((run, k) => {
            if (k > step) return null
            const x = 24 + k * 136
            let y = top
            return (
              <g key={run.name}>
                {run.parts.map((p, i) => {
                  const segment = (p / 100) * h
                  const at = y
                  y += segment
                  return (
                    <g key={i}>
                      <rect x={x} y={at} width={100} height={segment} {...ink} strokeWidth={1.2} fill="currentColor" fillOpacity={SHADE[i]}
                        strokeDasharray={i === 2 ? "4 3" : undefined} />
                      {p >= 8 && <text x={x + 50} y={at + segment / 2 + 7} {...mono} fontSize={19} style={{ paintOrder: "stroke" }} stroke={i === 0 ? "none" : "Canvas"} strokeWidth={1.5}>{p.toFixed(1)}%</text>}
                    </g>
                  )
                })}
                <text x={x + 50} y={top + h + 28} {...label} fontSize={20}>{run.name.split(" ")[0]}</text>
                {run.name.includes(" ") && <text x={x + 50} y={top + h + 52} {...label} fontSize={20}>DPO</text>}
              </g>
            )
          })}
          {PARTS.map((part, i) => (
            <g key={part}>
              <rect x={24} y={316 + i * 32} width={20} height={20} {...ink} strokeWidth={1.2} fill="currentColor" fillOpacity={SHADE[i]}
                strokeDasharray={i === 2 ? "4 3" : undefined} />
              <text x={54} y={332 + i * 32} {...label} fontSize={20} textAnchor="start">{part}</text>
            </g>
          ))}
          <text x={24} y={432} {...label} fontSize={18} textAnchor="start">too thin to label: base, anything else 0.4%</text>
          {step >= 2 && <text x={165} y={456} {...label} fontSize={18} textAnchor="start">aggressive DPO, other places 0.0%</text>}
        </svg>
      )}
    </Stepped>
  )
}
