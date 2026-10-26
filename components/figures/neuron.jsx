"use client"

import { ArrowDefs, ink, label } from "./stepped"

// Figure 1: one neuron with the guide's numbers.
// inputs 2 and -1, weights 1.5 and 0.5, bias 0.25, sum 2.75, ReLU output 2.75.
export function NeuronFigure() {
  const m = "url(#neuron-arrow)"
  return (
    <svg viewBox="0 0 560 220" width="100%" style={{ maxWidth: 560 }} role="img">
      <title>One neuron: inputs 2 and −1, weights 1.5 and 0.5, bias 0.25, weighted sum 2.75, ReLU output 2.75</title>
      <ArrowDefs id="neuron-arrow" />
      {/* inputs */}
      <circle cx={50} cy={60} r={22} {...ink} />
      <text x={50} y={65} {...label}>2</text>
      <circle cx={50} cy={160} r={22} {...ink} />
      <text x={50} y={165} {...label}>−1</text>
      <text x={50} y={22} {...label} fontSize={12}>input x</text>
      {/* weighted edges */}
      <line x1={74} y1={66} x2={206} y2={102} {...ink} markerEnd={m} />
      <text x={140} y={70} {...label}>× 1.5</text>
      <line x1={74} y1={154} x2={206} y2={118} {...ink} markerEnd={m} />
      <text x={140} y={158} {...label}>× 0.5</text>
      {/* sum */}
      <circle cx={236} cy={110} r={30} {...ink} />
      <text x={236} y={115} {...label} fontSize={15}>sum</text>
      <line x1={236} y1={38} x2={236} y2={78} {...ink} markerEnd={m} />
      <text x={236} y={28} {...label}>bias + 0.25</text>
      <text x={236} y={166} {...label} fontSize={12}>3 − 0.5 + 0.25</text>
      {/* sum to ReLU */}
      <line x1={268} y1={110} x2={348} y2={110} {...ink} markerEnd={m} />
      <text x={308} y={100} {...label}>2.75</text>
      <rect x={350} y={84} width={84} height={52} rx={6} {...ink} />
      <text x={392} y={115} {...label}>ReLU</text>
      <text x={392} y={156} {...label} fontSize={12}>max(0, 2.75)</text>
      {/* output */}
      <line x1={436} y1={110} x2={506} y2={110} {...ink} markerEnd={m} />
      <text x={528} y={115} {...label}>2.75</text>
      <text x={528} y={92} {...label} fontSize={12}>output</text>
    </svg>
  )
}
