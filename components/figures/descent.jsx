"use client"

import { ArrowDefs, Stepped, ink, label } from "./stepped"

// Figure 3: gradient descent on the two-knob loss L = θ1² + 4·θ2², η = 0.1,
// starting at (4, 1.5). Every position is computed here, never typed in.
const ETA = 0.1
const grad = ([a, b]) => [2 * a, 8 * b]
const loss = ([a, b]) => a * a + 4 * b * b
const points = [[4, 1.5]]
for (let i = 0; i < 4; i++) {
  const p = points[i]
  const g = grad(p)
  points.push([p[0] - ETA * g[0], p[1] - ETA * g[1]])
}

// Plot area: x in [40, 560], y in [60, 380]. θ1 in [-1, 5.5] and θ2 in [-1.1, 2.9], 80 px per unit.
const X = (v) => 40 + (v + 1) * 80
const Y = (v) => 380 - (v + 1.1) * 80
const fmt = (v) => (Math.round(v * 100) / 100).toString().replace("-", "−")

export function DescentFigure() {
  return (
    <Stepped labels={["step 1", "step 2", "step 3", "step 4"]}>
      {(step) => {
        const p = points[step]
        const q = points[step + 1]
        const g = grad(p)
        const up = [p[0] + ETA * g[0], p[1] + ETA * g[1]]
        return (
          <svg viewBox="0 0 600 430" width="100%" style={{ maxWidth: 600 }} role="img">
            <title>Gradient descent on a two-knob loss surface drawn as contour lines: at each step the gradient arrow points uphill and the update moves the opposite way, toward the minimum</title>
            <ArrowDefs id="descent-arrow" />
            <clipPath id="descent-plot">
              <rect x={40} y={60} width={520} height={320} />
            </clipPath>
            <rect x={40} y={60} width={520} height={320} {...ink} strokeWidth={1} opacity={0.35} />
            <g clipPath="url(#descent-plot)">
            {/* contour lines of L = θ1² + 4θ2²: ellipses with semi-axes √c and √c / 2 */}
            {[1, 4, 9, 16, 25].map((c) => (
              <ellipse key={c} cx={X(0)} cy={Y(0)} rx={Math.sqrt(c) * 80} ry={(Math.sqrt(c) / 2) * 80} {...ink} strokeWidth={1} opacity={0.35} />
            ))}
            </g>
            {[1, 4, 9, 16, 25].map((c) => (
              <text key={c} x={X(Math.sqrt(c)) - 10} y={Y(0) + 15} {...label} fontSize={11} opacity={0.6}>
                {c}
              </text>
            ))}
            <circle cx={X(0)} cy={Y(0)} r={3} fill="currentColor" />
            <text x={X(0)} y={Y(0) + 18} {...label} fontSize={12}>minimum, loss 0</text>
            {/* path so far */}
            {points.slice(0, step + 1).map((a, i) =>
              i === 0 ? null : (
                <line key={i} x1={X(points[i - 1][0])} y1={Y(points[i - 1][1])} x2={X(a[0])} y2={Y(a[1])} {...ink} opacity={0.5} />
              )
            )}
            {points.slice(0, step + 1).map((a, i) => (
              <circle key={i} cx={X(a[0])} cy={Y(a[1])} r={4} fill="currentColor" opacity={i === step ? 1 : 0.5} />
            ))}
            {/* gradient (uphill, dashed) and the update (solid), both scaled by η */}
            <line x1={X(p[0])} y1={Y(p[1])} x2={X(up[0])} y2={Y(up[1])} {...ink} strokeDasharray="5 4" markerEnd="url(#descent-arrow)" />
            <line x1={X(p[0])} y1={Y(p[1])} x2={X(q[0])} y2={Y(q[1])} {...ink} strokeWidth={2.5} markerEnd="url(#descent-arrow)" />
            {/* legend and readout */}
            <line x1={40} y1={18} x2={80} y2={18} {...ink} strokeDasharray="5 4" markerEnd="url(#descent-arrow)" />
            <text x={90} y={22} {...label} textAnchor="start" fontSize={12}>gradient × η (points uphill)</text>
            <line x1={40} y1={42} x2={80} y2={42} {...ink} strokeWidth={2.5} markerEnd="url(#descent-arrow)" />
            <text x={90} y={46} {...label} textAnchor="start" fontSize={12}>the update: the same arrow, reversed</text>
            <text x={40} y={410} {...label} textAnchor="start" fontSize={12}>
              (θ₁, θ₂) = ({fmt(p[0])}, {fmt(p[1])}), loss {fmt(loss(p))} → ({fmt(q[0])}, {fmt(q[1])}), loss {fmt(loss(q))}
            </text>
          </svg>
        )
      }}
    </Stepped>
  )
}
