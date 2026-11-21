"use client"

import { ArrowDefs, ink, label } from "./stepped"

const mono = { fill: "currentColor", fontSize: 17, fontFamily: "ui-monospace, Menlo, Consolas, monospace", textAnchor: "middle" }

// One box in a vertical flow: a role on the first line, then example lines in monospace.
function Box({ x, y, w, h, role, lines = [], strong, dashed }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} {...ink} strokeWidth={strong ? 3 : 1.4} strokeDasharray={dashed ? "6 4" : undefined} />
      <text x={x + w / 2} y={y + 25} {...label} fontSize={19} fontWeight={strong ? 700 : 400}>{role}</text>
      {lines.map((t, i) => (
        <text key={i} x={x + w / 2} y={y + 49 + 22 * i} {...mono}>{t}</text>
      ))}
    </g>
  )
}

function Down({ x, y1, y2, id }) {
  return <line x1={x} y1={y1} x2={x} y2={y2 - 2} {...ink} strokeWidth={1.6} markerEnd={`url(#${id})`} />
}

// Figure 1: a RAG pipeline on the toy question, with the knowledge base beside the retriever.
const FLOW = [
  { role: "question", lines: ["where does the cat live"], h: 66 },
  { role: "retriever", lines: ["scores every passage"], h: 66 },
  { role: "top passage", lines: ["the cat lives in the hut"], h: 66 },
  { role: "prompt: passage + question", lines: ["the cat lives in the hut", "where does the cat live"], h: 88 },
  { role: "reader (the LLM)", lines: ["answers from its prompt"], h: 66 },
  { role: "answer", lines: ["in the hut"], h: 66 },
]

export function PipelineFigure() {
  const x = 20
  const w = 320
  const gap = 30
  let y = 10
  const boxes = FLOW.map((b) => {
    const out = { ...b, y }
    y += b.h + gap
    return out
  })
  const r = boxes[1]
  return (
    <svg viewBox={`0 0 560 ${y - gap + 12}`} width="100%" style={{ maxWidth: 600 }} role="img">
      <title>A retrieval-augmented generation pipeline. The question "where does the cat live" goes to the retriever, which scores every passage in the knowledge base beside it. The top passage, "the cat lives in the hut", is put in the prompt with the question. The reader, the LLM, answers from its prompt: "in the hut".</title>
      <ArrowDefs id="rag-pipe" />
      {boxes.map((b, i) => (
        <g key={b.role}>
          <Box x={x} y={b.y} w={w} h={b.h} role={b.role} lines={b.lines} />
          {i > 0 && <Down x={x + w / 2} y1={boxes[i - 1].y + boxes[i - 1].h} y2={b.y} id="rag-pipe" />}
        </g>
      ))}
      <Box x={380} y={r.y - 12} w={170} h={90} role="knowledge base" lines={["66 passages"]} dashed />
      <line x1={380} y1={r.y + r.h / 2} x2={x + w + 2} y2={r.y + r.h / 2} {...ink} strokeWidth={1.6} markerEnd="url(#rag-pipe)" />
      <text x={465} y={r.y + 104} {...label} fontSize={19}>searched at</text>
      <text x={465} y={r.y + 128} {...label} fontSize={19}>question time</text>
    </svg>
  )
}

// Figure 2: the fox's path through the trained dense pipeline after every animal moved; the error
// is made at retrieval and the reader passes it on.
export function ErrorFigure() {
  const x = 20
  const w = 320
  const steps = [
    { role: "question", lines: ["where does the fox live"], y: 10, h: 66 },
    { role: "trained dense retriever", lines: ["top passage of 66"], y: 106, h: 66 },
    { role: "retrieved passage", lines: ["the hen lives in the log"], y: 202, h: 66, strong: true },
    { role: "reader (with abstention)", lines: ["copies the place"], y: 298, h: 66 },
    { role: "answer", lines: ["in the log"], y: 394, h: 66 },
  ]
  return (
    <svg viewBox="0 0 560 476" width="100%" style={{ maxWidth: 600 }} role="img">
      <title>How a retrieval error becomes a confident answer. The question "where does the fox live" goes to the trained dense retriever, whose top passage is "the hen lives in the log", about the wrong animal: the error happens here. The reader copies the place and answers "in the log". The fox's home in the knowledge base is the mat.</title>
      <ArrowDefs id="rag-err" />
      {steps.map((b, i) => (
        <g key={b.role}>
          <Box x={x} y={b.y} w={w} h={b.h} role={b.role} lines={b.lines} strong={b.strong} />
          {i > 0 && <Down x={x + w / 2} y1={steps[i - 1].y + steps[i - 1].h} y2={b.y} id="rag-err" />}
        </g>
      ))}
      <text x={356} y={228} {...label} fontSize={30} textAnchor="start">✗</text>
      <text x={386} y={226} {...label} fontSize={19} textAnchor="start" fontWeight={700}>error here:</text>
      <text x={356} y={252} {...label} fontSize={19} textAnchor="start">the wrong</text>
      <text x={356} y={276} {...label} fontSize={19} textAnchor="start">animal's sentence</text>
      <text x={356} y={410} {...label} fontSize={19} textAnchor="start">confident, wrong:</text>
      <text x={356} y={434} {...label} fontSize={19} textAnchor="start">the knowledge</text>
      <text x={356} y={458} {...label} fontSize={19} textAnchor="start">base says "mat"</text>
    </svg>
  )
}

// Figure 3: the whole series in one picture. Per question, the context runs through the model, whose
// weights training fixed beforehand; each chosen token is appended and the loop repeats, and a tool
// call's result joins the context mid-answer. Serving sets how the loop runs.
const STAGE = { x: 20, w: 330, h: 64 }

function Stage({ y, title, line, guide, x = STAGE.x, w = STAGE.w }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={STAGE.h} {...ink} strokeWidth={1.4} />
      <text x={x + 12} y={y + 26} {...label} fontSize={19} textAnchor="start" fontWeight={700}>{title}</text>
      <text x={x + 12} y={y + 52} {...label} fontSize={18} textAnchor="start">{line}</text>
      {guide && <text x={x + w - 10} y={y + 26} {...label} fontSize={18} textAnchor="end">{guide}</text>}
    </g>
  )
}

export function SeriesFigure() {
  const { x, w, h } = STAGE
  const ctx = 10
  const tok = 130
  const box = { y: 220, h: 290 }
  const inner = { x: 34, w: 302 }
  const rows = [262, 346, 430]
  const dec = 550
  const loopX = 366
  return (
    <svg viewBox="0 0 560 626" width="100%" style={{ maxWidth: 600 }} role="img">
      <title>The series in one picture. Per question, the context holds the question and retrieved passages (Guide 12), and tool results join it mid-answer (Guide 11). It becomes tokens (Guide 2) and runs through the model, whose weights were fixed beforehand by training (Guides 7–9): embeddings and positions (Guides 3–4), attention and blocks (Guides 4–5), and a next-token distribution. A decoding rule (Guide 6) picks one token, whose ID is appended to the tokens, and the loop repeats until the answer ends. Guide 10's serving methods, a cache per answer, batching and fewer bits, set how the loop runs.</title>
      <ArrowDefs id="rag-series" />
      <rect x={x} y={ctx} width={w} height={96} {...ink} strokeWidth={1.4} />
      <text x={x + 12} y={ctx + 26} {...label} fontSize={19} textAnchor="start" fontWeight={700}>context</text>
      <text x={x + 12} y={ctx + 52} {...label} fontSize={18} textAnchor="start">question + passages (12)</text>
      <text x={x + 12} y={ctx + 78} {...label} fontSize={18} textAnchor="start">tool results mid-answer (11)</text>
      <Down x={x + w / 2} y1={ctx + 96} y2={tok} id="rag-series" />
      <Stage y={tok} title="tokens" line="IDs from a vocabulary" guide="2" />
      <Down x={x + w / 2} y1={tok + h} y2={box.y} id="rag-series" />
      <rect x={x} y={box.y} width={w} height={box.h} {...ink} strokeWidth={2.4} strokeDasharray="7 4" />
      <text x={x + 12} y={box.y + 28} {...label} fontSize={18} textAnchor="start" fontWeight={700}>model: weights fixed by training, 7–9</text>
      <Stage y={rows[0]} x={inner.x} w={inner.w} title="embeddings, positions" line="one vector per token" guide="3–4" />
      <Down x={x + w / 2} y1={rows[0] + h} y2={rows[1]} id="rag-series" />
      <Stage y={rows[1]} x={inner.x} w={inner.w} title="attention and blocks" line="vectors take in context" guide="4–5" />
      <Down x={x + w / 2} y1={rows[1] + h} y2={rows[2]} id="rag-series" />
      <Stage y={rows[2]} x={inner.x} w={inner.w} title="distribution" line="next-token probabilities" guide="6" />
      <Down x={x + w / 2} y1={box.y + box.h} y2={dec} id="rag-series" />
      <Stage y={dec} title="decoding" line="a rule picks one token" guide="6" />
      <path d={`M ${x + w} ${dec + h / 2} L ${loopX} ${dec + h / 2} L ${loopX} ${tok + h / 2} L ${x + w + 2} ${tok + h / 2}`} {...ink} strokeWidth={1.8} markerEnd="url(#rag-series)" />
      <text x={loopX + 12} y={tok + 2} {...label} fontSize={18} textAnchor="start">each token ID</text>
      <text x={loopX + 12} y={tok + 26} {...label} fontSize={18} textAnchor="start">is appended;</text>
      <text x={loopX + 12} y={tok + 50} {...label} fontSize={18} textAnchor="start">repeat until the</text>
      <text x={loopX + 12} y={tok + 74} {...label} fontSize={18} textAnchor="start">answer ends</text>
      <rect x={385} y={300} width={160} height={124} {...ink} strokeWidth={1.4} />
      <text x={397} y={326} {...label} fontSize={19} textAnchor="start" fontWeight={700}>serving, 10</text>
      <text x={397} y={352} {...label} fontSize={18} textAnchor="start">a cache per</text>
      <text x={397} y={374} {...label} fontSize={18} textAnchor="start">answer, batches,</text>
      <text x={397} y={396} {...label} fontSize={18} textAnchor="start">fewer bits</text>
      <line x1={385} y1={362} x2={loopX + 3} y2={362} {...ink} strokeWidth={1.6} markerEnd="url(#rag-series)" />
    </svg>
  )
}
