"use client"

import { ArrowDefs, Stepped, ink, label } from "./stepped"

// Figure 2: the forward pass as three rows, 1 x 27 -> 1 x 16 -> 1 x 27.
// A row is drawn as a strip of cells, one cell per number.
function Strip({ y, cells, cell, hot, dim }) {
  const x0 = 300 - (cells * cell) / 2
  return (
    <g opacity={dim ? 0.2 : 1}>
      {Array.from({ length: cells }, (_, i) => (
        <rect
          key={i}
          x={x0 + i * cell}
          y={y}
          width={cell}
          height={22}
          stroke="currentColor"
          strokeWidth={1}
          fill="currentColor"
          fillOpacity={i === hot ? 0.85 : 0}
        />
      ))}
    </g>
  )
}

export function ForwardPassFigure() {
  const m = "url(#forward-arrow)"
  return (
    <Stepped labels={["1 input", "2 hidden layer", "3 logits"]}>
      {(step) => (
        <svg viewBox="0 0 600 300" width="100%" style={{ maxWidth: 600 }} role="img">
          <title>Forward pass in shapes: a 1 × 27 one-hot input, times a 27 × 16 matrix, gives a 1 × 16 hidden row; times a 16 × 27 matrix gives 1 × 27 logits</title>
          <ArrowDefs id="forward-arrow" />
          {/* input row: one-hot for the letter t, slot 20 of 0..26 */}
          <Strip y={30} cells={27} cell={16} hot={20} />
          <text x={300} y={20} {...label}>x: one-hot input, 1 × 27 (the 1 marks "t")</text>

          <g opacity={step >= 1 ? 1 : 0.2}>
            <line x1={300} y1={58} x2={300} y2={116} {...ink} markerEnd={m} />
            <text x={312} y={84} {...label} textAnchor="start">× W⁽¹⁾ (27 × 16), + b⁽¹⁾ (1 × 16), then ReLU</text>
          </g>
          <Strip y={122} cells={16} cell={16} dim={step < 1} />
          <text x={300} y={162} {...label} opacity={step >= 1 ? 1 : 0.2}>h: hidden row, 1 × 16</text>

          <g opacity={step >= 2 ? 1 : 0.2}>
            <line x1={300} y1={172} x2={300} y2={230} {...ink} markerEnd={m} />
            <text x={312} y={204} {...label} textAnchor="start">× W⁽²⁾ (16 × 27), + b⁽²⁾ (1 × 27)</text>
          </g>
          <Strip y={236} cells={27} cell={16} dim={step < 2} />
          <text x={300} y={278} {...label} opacity={step >= 2 ? 1 : 0.2}>z: logits, 1 × 27, one score per next character</text>
        </svg>
      )}
    </Stepped>
  )
}
