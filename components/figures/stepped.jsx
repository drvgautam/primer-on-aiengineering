"use client"

import { useState } from "react"
import { usePrint } from "../print"

// Shared shell for stepped figures: pill navigation above, one SVG below.
// Pills carry data-step so editors/scripts/figures-capture.mjs can find them.
// In print mode (the /book route) every step is drawn in turn, each under its pill label.
export function Stepped({ labels, children }) {
  const [step, setStep] = useState(0)
  const print = usePrint()
  if (print) {
    return (
      <div className="stepped-print">
        {labels.map((label, i) => {
          // pill labels often carry their own number ("1 scores", "step 2"); print it once
          const rest = label.replace(/^(step\s*)?\d+\s*/i, "")
          return (
            <div key={label} className="stepped-print-step">
              <div className="stepped-print-label">
                Step {i + 1} of {labels.length}
                {rest ? `: ${rest}` : ""}
              </div>
              {children(i)}
            </div>
          )
        })}
      </div>
    )
  }
  return (
    <div>
      <div role="tablist" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        {labels.map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            data-step={i + 1}
            aria-selected={i === step}
            onClick={() => setStep(i)}
            style={{
              font: "inherit",
              fontSize: 13,
              padding: "3px 12px",
              borderRadius: 999,
              border: `1px solid ${i === step ? "var(--accent, CanvasText)" : "var(--rule-strong, currentColor)"}`,
              cursor: "pointer",
              color: i === step ? "var(--on-accent, Canvas)" : "inherit",
              background: i === step ? "var(--accent, CanvasText)" : "transparent",
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {children(step)}
    </div>
  )
}

// Arrowhead marker shared by every figure; `id` must be unique per SVG.
export function ArrowDefs({ id }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
      </marker>
    </defs>
  )
}

export const ink = { stroke: "currentColor", fill: "none", strokeWidth: 1.5 }
export const label = { fill: "currentColor", fontSize: 13, textAnchor: "middle" }
