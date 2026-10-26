"use client"

import { ArrowDefs, Stepped, ink, label } from "./stepped"

// Figure 4: the two-weight network from the backpropagation section.
// Forward: x = 1, w1 = 2, h = 2, w2 = 0.5, ŷ = 1, loss 0.5 (target y = 2).
// Backward: ∂L/∂ŷ = −1, ∂L/∂w2 = −2, ∂L/∂h = −0.5, ∂L/∂w1 = −0.5.
const nodes = [
  { x: 50, name: "x", value: "1" },
  { x: 250, name: "h", value: "2" },
  { x: 450, name: "ŷ", value: "1" },
  { x: 590, name: "loss", value: "0.5" },
]

export function BackpropFigure() {
  const f = "url(#backprop-arrow)"
  return (
    <Stepped labels={["1 forward", "2 backward"]}>
      {(step) => (
        <svg viewBox="0 0 640 250" width="100%" style={{ maxWidth: 640 }} role="img">
          <title>Backpropagation on a two-weight network: forward values 1, 2, 1 and loss 0.5 flow left to right; gradients −1, −2, −0.5 and −0.5 flow right to left</title>
          <ArrowDefs id="backprop-arrow" />
          {nodes.map((n) => (
            <g key={n.name}>
              <circle cx={n.x} cy={100} r={26} {...ink} />
              <text x={n.x} y={96} {...label} fontSize={12}>{n.name}</text>
              <text x={n.x} y={112} {...label}>{n.value}</text>
            </g>
          ))}
          {/* forward edges */}
          <line x1={78} y1={100} x2={222} y2={100} {...ink} markerEnd={f} />
          <text x={150} y={90} {...label}>× w₁ = 2, ReLU</text>
          <line x1={278} y1={100} x2={422} y2={100} {...ink} markerEnd={f} />
          <text x={350} y={90} {...label}>× w₂ = 0.5</text>
          <line x1={478} y1={100} x2={562} y2={100} {...ink} markerEnd={f} />
          <text x={520} y={90} {...label} fontSize={12}>target 2</text>
          <text x={320} y={30} {...label} fontSize={12}>forward: values flow left to right →</text>

          {/* backward edges, drawn below, right to left */}
          <g opacity={step === 1 ? 1 : 0.12}>
            <text x={320} y={236} {...label} fontSize={12}>← backward: gradients flow right to left</text>
            <line x1={578} y1={150} x2={462} y2={150} {...ink} strokeDasharray="5 4" markerEnd={f} />
            <text x={520} y={172} {...label}>∂L/∂ŷ = −1</text>
            <line x1={438} y1={150} x2={262} y2={150} {...ink} strokeDasharray="5 4" markerEnd={f} />
            <text x={350} y={172} {...label}>∂L/∂h = −0.5</text>
            <text x={350} y={196} {...label}>∂L/∂w₂ = −1 × 2 = −2</text>
            <line x1={238} y1={150} x2={62} y2={150} {...ink} strokeDasharray="5 4" markerEnd={f} />
            <text x={150} y={172} {...label}>ReLU passes −0.5</text>
            <text x={150} y={196} {...label}>∂L/∂w₁ = −0.5 × 1 = −0.5</text>
          </g>
        </svg>
      )}
    </Stepped>
  )
}
