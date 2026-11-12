// The one-page visual guide for Guide 11, "Tool use and agents: letting a model act".
// A quick overview in four steps; every example, output and number is the guide's
// (content/11-tools.mdx), and the comments name where each comes from. The toy is Guide 8's base
// model fine-tuned for the tool loop; the agent numbers are the guide's s ** steps table.
// tools/check_visuals.py checks the numbers, the terms and the word budget.
import { Arrow, Footer, Masthead, Panel, Poster, Step, Term } from "./poster"

const ACCENT = "#1e3a5f", INK = "#1b1b1f", SOFT = "#3d3d45", MUTED = "#5f5f6a", RULE2 = "#cfcbc0"
const ON = "#e9eef5", WARN = "#b91c1c", PASS = "#0f7b4a", GREY = "#aeb7c4", AMBER = "#9a4a07", AMBER_SOFT = "#fdf0e1"
const PAPER = "#f1f0ec"
const sans = { fontFamily: "var(--sans)" }
const mono = { fontFamily: "var(--mono)" }
const T = 10, TB = 10.5

// ---------------------------------------------------------------- step 1: who runs the tool
// "The tool loop": the question, the model's call, the application's " hut", the model's answer.
const LOOP = [
  ["user", "where does the cat live", PAPER, MUTED, false],
  ["model writes", "call home cat result", ON, ACCENT, true],
  ["application runs home(\"cat\")", "hut", AMBER_SOFT, AMBER, false],
  ["model writes", "in the hut", ON, ACCENT, true],
]
function Loop() {
  const W = 423, x0 = 168, h = 21, gap = 6
  return (
    <svg viewBox={`0 0 ${W} 112`} role="img" aria-label="The transcript of one tool call: the user asks where the cat lives; the model writes call home cat result; the application runs the tool and appends hut; the model writes in the hut">
      {LOOP.map(([who, text, fill, ink, model], i) => {
        const y = 2 + i * (h + gap)
        return (
          <g key={i}>
            <text x={x0 - 8} y={y + 14} fontSize={TB} textAnchor="end" fontWeight={model ? 700 : 400} fill={ink} style={sans}>{who}</text>
            <rect x={x0} y={y} width={W - x0} height={h} rx={2} fill={fill} stroke={model ? ACCENT : RULE2} strokeWidth={model ? 0.9 : 0.6} />
            <text x={x0 + 8} y={y + 14.5} fontSize={11.5} fill={ink} fontWeight={model ? 700 : 400} style={mono}>{text}</text>
          </g>
        )
      })}
      <Arrow x1={x0 - 34} y1={2 + 1 * (h + gap) + h + 1} x2={x0 - 34} y2={2 + 2 * (h + gap) - 1} color={AMBER} w={1.5} />
      <Arrow x1={x0 - 34} y1={2 + 2 * (h + gap) + h + 1} x2={x0 - 34} y2={2 + 3 * (h + gap) - 1} color={AMBER} w={1.5} />
    </svg>
  )
}

// ---------------------------------------------------------------- step 2: how it learns to call
// The guide's training example, tool_example("cat", "rug"), coloured by who wrote each character:
// prompt 24, call 20, result 4, answer 15. The guide's mask is these flags shifted by one position.
const EX = "where does the cat live call home cat result rug in the rug and"
const MASKBITS = "0".repeat(24) + "1".repeat(20) + "0".repeat(4) + "1".repeat(15)
const SEGS = [["prompt", 0, 24], ["call", 24, 44], ["result", 44, 48], ["answer", 48, 63]]
function Mask() {
  const W = 423, cell = W / 63
  return (
    <svg data-chars viewBox={`0 0 ${W} 78`} role="img" aria-label="One training example, character by character, with its loss mask: the prompt and the tool result are off; the call and the answer, which the model writes, are on">
      {SEGS.map(([name, a, b]) => {
        const model = name === "call" || name === "answer"
        return (
          <g key={name}>
            <text x={(a + (b - a) / 2) * cell} y={9} fontSize={T} textAnchor="middle" fill={model ? ACCENT : MUTED} fontWeight={model ? 700 : 400} style={sans}>{name}</text>
            <line x1={a * cell + 1} x2={b * cell - 1} y1={13} y2={13} stroke={model ? ACCENT : GREY} strokeWidth={1.2} />
          </g>
        )
      })}
      {[...EX].map((ch, i) => (
        <text key={i} x={i * cell + cell / 2} y={31} fontSize={9.5} textAnchor="middle" fill={MASKBITS[i] === "1" ? ACCENT : MUTED} style={mono}>{ch === " " ? "·" : ch}</text>
      ))}
      {[...MASKBITS].map((b, i) => (
        <rect key={i} x={i * cell + 0.5} y={38} width={cell - 1} height={11} rx={1} fill={b === "1" ? ACCENT : "#e4e2dc"} />
      ))}
      <rect x={0} y={62} width={10} height={9} rx={1} fill={ACCENT} />
      <text x={14} y={70} fontSize={T} fill={INK} style={sans}>in the loss: text the model writes</text>
      <rect x={210} y={62} width={10} height={9} rx={1} fill="#e4e2dc" />
      <text x={224} y={70} fontSize={T} fill={INK} style={sans}>no loss: prompt and tool result</text>
    </svg>
  )
}

// "36 of 36 animal and place combinations right"; "no call in 115 of 115".
function Learned() {
  const W = 294
  const Big = ({ y, v, of, label }) => (
    <g>
      <text x={0} y={y} fontSize={26} fontWeight={700} fill={PASS} style={sans}>{v}</text>
      <text x={v.length * 15 + 6} y={y} fontSize={TB} fill={SOFT} style={sans}>of {of}</text>
      <text x={0} y={y + 16} fontSize={TB} fill={INK} style={sans}>{label}</text>
    </g>
  )
  return (
    <svg viewBox={`0 0 ${W} 94`} role="img" aria-label="After fine-tuning: 36 of 36 animal and place combinations right, and no call on any of the 115 held-out where questions">
      <Big y={24} v="36" of="36" label="animal and place combinations right" />
      <Big y={72} v="115" of="115" label="held-out questions needing no tool: no call" />
    </svg>
  )
}

// ---------------------------------------------------------------- step 3: facts in tools, untrusted results
// "Facts that live outside the model": the table edit (cat → pot) against Guide 8's fine-tune, where
// the other animals answered "in the pot" too and the dog's answer was garbled.
const ANIMALS = [["cat", "pot", "pot", true], ["dog", "bed", "garbled", false], ["rat", "log", "pot", false],
  ["fox", "rug", "pot", false], ["owl", "pot", "pot", true], ["hen", "mat", "pot", false]]
function Facts() {
  const W = 358, c1 = 120, c2 = 262
  return (
    <svg viewBox={`0 0 ${W} 110`} role="img" aria-label="Moving the cat to the pot. With a tool, one table edit: the cat answers pot and every other animal keeps its home. Fine-tuned into the weights in Guide 8: the other animals answered pot too, or garbled">
      <text x={c1} y={10} fontSize={TB} fontWeight={700} fill={ACCENT} textAnchor="middle" style={sans}>edit the tool&apos;s table</text>
      <text x={c2} y={10} fontSize={TB} fill={MUTED} textAnchor="middle" style={sans}>fine-tune it in (Guide 8)</text>
      {ANIMALS.map(([a, tool, ft, ftOk], i) => {
        const y = 28 + i * 15
        return (
          <g key={a}>
            <text x={40} y={y} fontSize={TB} textAnchor="end" fill={INK} style={mono}>{a}</text>
            <text x={c1} y={y} fontSize={TB} textAnchor="middle" fontWeight={a === "cat" ? 700 : 400} fill={a === "cat" ? ACCENT : INK} style={mono}>{tool}</text>
            <text x={c1 + 34} y={y} fontSize={TB} fill={PASS} style={sans}>✓</text>
            <text x={c2} y={y} fontSize={TB} textAnchor="middle" fill={ftOk ? INK : WARN} style={mono}>{ft}</text>
            <text x={c2 + 40} y={y} fontSize={TB} fill={ftOk ? PASS : WARN} style={sans}>{ftOk ? "✓" : "✗"}</text>
          </g>
        )
      })}
      <line x1={c1 - 60} x2={c1 - 60} y1={16} y2={108} stroke={RULE2} strokeWidth={0.6} />
      <line x1={c2 - 60} x2={c2 - 60} y1={16} y2={108} stroke={RULE2} strokeWidth={0.6} />
    </svg>
  )
}

// "When the tool says something unexpected": dog → "in the log", mud → "in the bed", sun → garbled.
function Unexpected() {
  const W = 358, rows = [["dog", "in the log"], ["mud", "in the bed"], ["sun", "the pot in the log …"]]
  return (
    <svg viewBox={`0 0 ${W} 94`} role="img" aria-label="Asked where the cat lives, with tool results it never saw in training: dog gives in the log, mud gives in the bed, sun gives the pot in the log and runs on; none is copied">
      <text x={0} y={9} fontSize={TB} fill={INK} style={sans}>asked: <tspan style={mono}>where does the cat live</tspan></text>
      <text x={0} y={27} fontSize={T} fill={MUTED} style={sans}>the tool returns</text>
      <text x={150} y={27} fontSize={T} fill={MUTED} style={sans}>the model answers</text>
      {rows.map(([r, a], i) => (
        <g key={r}>
          <rect x={0} y={34 + i * 19} width={60} height={15} rx={2} fill={AMBER_SOFT} stroke={AMBER} strokeWidth={0.7} />
          <text x={30} y={45 + i * 19} fontSize={TB} textAnchor="middle" fill={AMBER} fontWeight={700} style={mono}>{r}</text>
          <Arrow x1={68} y1={41.5 + i * 19} x2={140} y2={41.5 + i * 19} color={GREY} />
          <text x={150} y={45 + i * 19} fontSize={TB} fill={WARN} style={mono}>{a}</text>
        </g>
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------- step 4: forcing the format, and agents
// "Forcing the format": 60 tool questions per setting; well-formed calls and right answers.
const CD = [["1.0", 58, 54, 60, 55], ["1.5", 33, 25, 60, 40], ["2.0", 5, 2, 60, 21]]
function Constrained() {
  const W = 358, x0 = 100, bw = 150, s = bw / 60
  return (
    <svg viewBox={`0 0 ${W} 114`} role="img" aria-label="Out of 60 calls at temperature 1.0, 1.5 and 2.0: unconstrained, 58, 33 and 5 well formed; constrained, 60 every time. Right answers, constrained: 55, 40, 21">
      <text x={0} y={9} fontSize={T} fill={MUTED} style={sans}>temperature</text>
      <text x={x0} y={9} fontSize={T} fill={MUTED} style={sans}>well-formed calls, of 60</text>
      <text x={W} y={9} fontSize={T} textAnchor="end" fill={MUTED} style={sans}>right answers, of 60</text>
      {CD.map(([t, fw, fr, cw, cr], i) => {
        const y = 16 + i * 33
        return (
          <g key={t}>
            <text x={0} y={y + 18} fontSize={TB} fill={INK} style={mono}>{t}</text>
            <text x={x0 - 6} y={y + 10} fontSize={T} textAnchor="end" fill={MUTED} style={sans}>free</text>
            <rect x={x0} y={y + 2} width={fw * s} height={11} rx={1.4} fill={GREY} />
            <text x={x0 + fw * s + 4} y={y + 11} fontSize={TB} fill={INK} style={mono}>{fw}</text>
            <text x={W} y={y + 11} fontSize={TB} textAnchor="end" fill={SOFT} style={mono}>{fr}</text>
            <text x={x0 - 6} y={y + 27} fontSize={T} textAnchor="end" fill={ACCENT} fontWeight={700} style={sans}>constrained</text>
            <rect x={x0} y={y + 18} width={cw * s} height={11} rx={1.4} fill={ACCENT} />
            <text x={x0 + cw * s + 4} y={y + 27} fontSize={TB} fontWeight={700} fill={PASS} style={mono}>{cw}</text>
            <text x={W} y={y + 27} fontSize={TB} textAnchor="end" fontWeight={700} fill={INK} style={mono}>{cr}</text>
          </g>
        )
      })}
    </svg>
  )
}

// "Agents: tools in a loop": s ** steps for 5, 10 and 20 steps.
const AG = [["0.99", ["95.1", "90.4", "81.8"]], ["0.95", ["77.4", "59.9", "35.8"]], ["0.90", ["59.0", "34.9", "12.2"]]]
function Agent() {
  const W = 358, cols = [150, 230, 310]
  return (
    <svg viewBox={`0 0 ${W} 100`} role="img" aria-label="Chance of finishing a task: per-step success 0.99 gives 95.1, 90.4 and 81.8 percent at 5, 10 and 20 steps; 0.95 gives 77.4, 59.9 and 35.8; 0.90 gives 59.0, 34.9 and 12.2">
      <text x={0} y={9} fontSize={T} fill={MUTED} style={sans}>each step succeeds</text>
      <text x={cols[1]} y={9} fontSize={T} textAnchor="middle" fill={MUTED} style={sans}>tasks finished, by steps</text>
      {["5", "10", "20"].map((n, j) => <text key={n} x={cols[j]} y={27} fontSize={TB} textAnchor="middle" fill={INK} fontWeight={700} style={mono}>{n}</text>)}
      <line x1={0} x2={W} y1={33} y2={33} stroke={RULE2} strokeWidth={0.6} />
      {AG.map(([s, vals], i) => (
        <g key={s}>
          <text x={0} y={52 + i * 20} fontSize={TB} fill={INK} style={sans}>s = <tspan style={mono}>{s}</tspan></text>
          {vals.map((v, j) => (
            <text key={j} x={cols[j]} y={52 + i * 20} fontSize={TB} textAnchor="middle" fill={i === 1 && j === 1 ? ACCENT : INK} fontWeight={i === 1 && j === 1 ? 700 : 400} style={mono}>{v}%</text>
          ))}
        </g>
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------- the sheet
export default function ToolsSheet({ guide }) {
  return (
    <Poster>
      <Masthead
        guide={guide}
        title="Tool use and agents"
        subtitle="letting a model act"
        thesis={<>The model only <em>writes text</em>. The application <em>runs the tools</em>, and has to check every call and distrust every result.</>}
      />

      <Step n={1} title="Who runs the tool? The application; the model only writes text">
        <Panel span={5} title={<>Why a <Term>tool</Term>? A model alone can&apos;t</>} className="top"
          note="Easy for ordinary programs.">
          <ul className="checklist">
            <li><b>·</b><span>fetch current information: prices, this morning&apos;s email</span></li>
            <li><b>·</b><span>compute reliably: its arithmetic is approximate</span></li>
            <li><b>·</b><span>act: book a meeting, run a query, edit a file</span></li>
          </ul>
        </Panel>
        <Panel span={7} title={<>A <Term>tool call</Term> is text; the <Term>tool result</Term> is appended</>}
          note={<>The <Term>application</Term> spots the call, runs it if allowed, and appends the result.</>}>
          <Loop />
        </Panel>
      </Step>

      <Step n={2} title="How does it learn to call? Fine-tune on calls, with loss only on its own text">
        <Panel span={7} title={<><Term>Loss masking</Term>: learn the call and the answer, never the result</>}
          note="Training results are random places, so the model must copy, not memorize.">
          <Mask />
        </Panel>
        <Panel span={5} title="It learns when to call, and to copy"
          note={<>400 steps on Guide 8&apos;s base model. Price: <Term>catastrophic forgetting</Term>, validation loss 0.244 → 0.859.</>}>
          <Learned />
        </Panel>
      </Step>

      <Step n={3} title="Why keep facts in a tool? An edit beats retraining, but check what comes back">
        <Panel span={6} title="Move the cat to the pot: one entry, nothing else moves"
          note="No training step. Changing facts belong in a tool.">
          <Facts />
        </Panel>
        <Panel span={6} title="Unfamiliar results are ignored, not judged"
          note={<>And a hostile result can steer the next call: <Term>prompt injection</Term>. Validate calls; limit tools.</>}>
          <Unexpected />
        </Panel>
      </Step>

      <Step n={4} title="Can you force the format? Yes, not the truth; and in an agent, step errors compound">
        <Panel span={6} title={<><Term>Constrained decoding</Term>: the shape is guaranteed</>}
          note="Only the call is constrained; the animal and the answer can still be wrong.">
          <Constrained />
        </Panel>
        <Panel span={6} title={<>An <Term>agent</Term>: ten 95% steps finish 60% of tasks</>}
          note="If steps are independent, finishing 90% of twenty-step tasks needs about 99.5% per step.">
          <Agent />
        </Panel>
      </Step>

      <Footer guide={guide} />
    </Poster>
  )
}
