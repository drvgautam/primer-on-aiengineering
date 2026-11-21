// The one-page visual guide for Guide 12, "Retrieval-augmented generation: answering from documents".
// A quick overview in four steps; every example, output and number is the guide's
// (content/12-rag.mdx), and the comments name where each comes from. The toy knowledge base is the
// six home sentences plus 60 distractors; the reader is Guide 8's base model fine-tuned to copy.
// tools/check_visuals.py checks the numbers, the terms and the word budget.
import { Arrow, Footer, Masthead, Panel, Poster, Step, Term } from "./poster"

const ACCENT = "#1e3a5f", INK = "#1b1b1f", SOFT = "#3d3d45", MUTED = "#5f5f6a", RULE2 = "#cfcbc0"
const ON = "#e9eef5", WARN = "#b91c1c", PASS = "#0f7b4a", GREY = "#aeb7c4", AMBER = "#9a4a07", AMBER_SOFT = "#fdf0e1"
const PAPER = "#f1f0ec"
const sans = { fontFamily: "var(--sans)" }
const mono = { fontFamily: "var(--mono)" }
const T = 10, TB = 10.5

// ---------------------------------------------------------------- step 1: the pipeline
// Figure 1 and "The toy knowledge base": the question, the retriever's top passage of 66, the
// prompt (passage, then question), the reader's answer. The retriever is ordinary code (amber),
// the reader is the LLM (accent).
const PIPE = [
  ["question", "where does the cat live", PAPER, MUTED, RULE2, false],
  ["retriever: top of 66", "the cat lives in the hut", AMBER_SOFT, AMBER, AMBER, false],
  ["prompt", "the cat lives in the hut where does the cat live", PAPER, SOFT, RULE2, false],
  ["reader writes", "in the hut", ON, ACCENT, ACCENT, true],
]
function Pipeline() {
  const W = 423, x0 = 112, h = 21, gap = 7
  return (
    <svg viewBox={`0 0 ${W} 112`} role="img" aria-label="A RAG pipeline: the question where does the cat live; the retriever returns the top passage of 66, the cat lives in the hut; the reader's prompt holds the passage and the question; the reader writes in the hut">
      {PIPE.map(([who, text, fill, ink, stroke, model], i) => {
        const y = 2 + i * (h + gap)
        return (
          <g key={i}>
            <text x={x0 - 8} y={y + 14} fontSize={T} textAnchor="end" fontWeight={i === 1 || model ? 700 : 400} fill={ink} style={sans}>{who}</text>
            <rect x={x0} y={y} width={W - x0} height={h} rx={2} fill={fill} stroke={stroke} strokeWidth={i === 1 || model ? 0.9 : 0.6} />
            <text x={x0 + 7} y={y + 14.5} fontSize={i === 2 ? 10 : 11.5} fill={i === 2 ? SOFT : ink} fontWeight={i === 1 || model ? 700 : 400} style={mono}>
              {i === 2 ? <><tspan fill={AMBER} fontWeight={700}>the cat lives in the hut</tspan> where does the cat live</> : text}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------- step 2: the retrievers
// The sparse block's idf output: the 0, cat 1.79, lives 2.4, live 0, where 0 ("does" is 0 too, in the
// prose); the rewritten question "the cat lives in" gets recall@1 100%.
const QW = [["where", "0"], ["does", "0"], ["the", "0"], ["cat", "1.79"], ["live", "0"]]
const PW = [["the", ""], ["cat", "1.79"], ["lives", "2.4"], ["in", ""], ["the", ""], ["hut", ""]]   // only the weights that decide it: cat and lives (the guide prints none for "in" and "hut")
function Mismatch() {
  const W = 294
  const Row = ({ y, label, ws }) => (
    <g>
      <text x={0} y={y + 12} fontSize={T} fill={MUTED} style={sans}>{label}</text>
      {ws.map(([w, v], i) => {
        const x = 56 + ws.slice(0, i).reduce((a, [p]) => a + p.length * 6.6 + 14, 0), hot = w === "live" || w === "lives"
        return (
          <g key={i}>
            <text x={x} y={y + 12} fontSize={11} fill={hot ? WARN : INK} fontWeight={hot ? 700 : 400} style={mono}>{w}</text>
            {v ? <text x={x} y={y + 25} fontSize={9.5} fill={v === "0" ? MUTED : ACCENT} style={mono}>{v}</text> : null}
          </g>
        )
      })}
    </g>
  )
  return (
    <svg viewBox={`0 0 ${W} 106`} role="img" aria-label="TF-IDF word weights. The question where does the cat live: where 0, does 0, the 0, cat 1.79, live 0. The home sentence the cat lives in the hut: lives 2.4. Live and lives don't match, so only cat scores">
      <Row y={6} label="question" ws={QW} />
      <Row y={40} label="passage" ws={PW} />
      <line x1={0} x2={W} y1={80} y2={80} stroke={RULE2} strokeWidth={0.6} />
      <text x={0} y={98} fontSize={TB} fill={INK} style={sans}>recall@1: <tspan fontWeight={700} fill={WARN}>0%</tspan></text>
      <text x={112} y={98} fontSize={TB} fill={INK} style={sans}>reworded <tspan style={mono}>the cat lives in</tspan>: <tspan fontWeight={700} fill={PASS}>100%</tspan></text>
    </svg>
  )
}

// The retriever table: recall@1 at seed 0. TF-IDF 0%; general-purpose embeddings 0%; trained dense
// 100% on cat/dog/rat, 33% on fox/owl/hen; hybrid 100% (rank 1 for all six).
const RET = [
  ["TF-IDF", 0],
  ["general", 0],
  ["trained: cat, dog, rat", 100],
  ["on fox, owl, hen", 33],
  ["hybrid: both", 100],
]
function Recall() {
  const W = 423, x0 = 150, bw = 220, s = bw / 100
  return (
    <svg viewBox={`0 0 ${W} 112`} role="img" aria-label="Recall at 1 by retriever: TF-IDF 0 percent; general-purpose skip-gram vectors 0 percent; trained dense retriever 100 percent on the cat, dog and rat it trained on and 33 percent on the fox, owl and hen; hybrid 100 percent">
      <text x={x0} y={9} fontSize={T} fill={MUTED} style={sans}>recall@1</text>
      {RET.map(([name, v], i) => {
        const y = 16 + i * 19, ok = v === 100
        return (
          <g key={name}>
            <text x={x0 - 8} y={y + 10} fontSize={T} textAnchor="end" fill={INK} fontWeight={name.startsWith("hybrid") ? 700 : 400} style={sans}>{name}</text>
            <rect x={x0} y={y + 1} width={bw} height={11} rx={1.4} fill="#e4e2dc" />
            {v ? <rect x={x0} y={y + 1} width={v * s} height={11} rx={1.4} fill={ok ? PASS : MUTED} /> : null}
            <text x={x0 + bw + 5} y={y + 10.5} fontSize={TB} fontWeight={700} fill={ok ? PASS : v ? INK : WARN} style={mono}>{v}%</text>
          </g>
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------- step 3: the reader
// "In this toy, the passage overrides memory": given "the cat lives in the pot", both readers answer
// "in the pot", though the base model learned "hut".
function Overrides() {
  const W = 294
  return (
    <svg viewBox={`0 0 ${W} 92`} role="img" aria-label="The base model learned the cat lives in the hut. Given the passage the cat lives in the pot, the reader answers in the pot">
      <text x={0} y={12} fontSize={T} fill={MUTED} style={sans}>weights learned</text>
      <text x={92} y={12} fontSize={TB} fill={MUTED} style={mono}>the cat lives in the hut</text>
      <text x={0} y={36} fontSize={T} fill={AMBER} fontWeight={700} style={sans}>passage</text>
      <rect x={88} y={23} width={W - 88} height={19} rx={2} fill={AMBER_SOFT} stroke={AMBER} strokeWidth={0.8} />
      <text x={94} y={36} fontSize={TB} fill={AMBER} fontWeight={700} style={mono}>the cat lives in the pot</text>
      <Arrow x1={150} y1={46} x2={150} y2={60} color={ACCENT} w={1.3} />
      <text x={0} y={76} fontSize={T} fill={ACCENT} fontWeight={700} style={sans}>reader writes</text>
      <rect x={88} y={63} width={92} height={19} rx={2} fill={ON} stroke={ACCENT} strokeWidth={0.9} />
      <text x={94} y={76} fontSize={11.5} fill={ACCENT} fontWeight={700} style={mono}>in the pot</text>
    </svg>
  )
}

// The readers table (seed 0; the reader with abstention gives the same counts at seeds 1 and 2).
const READ = [
  ["right home sentence", "the cat lives in the hut", ["place 36/36", true], ["place 36/36", true]],
  ["distractor, same animal", "the cat sat on the mat", ["a place 36/36", false], ["unknown 36/36", true]],
  ["another's home sentence", "the dog lives in the bed", ["a place 30/30", false], ["a place 30/30", false]],
]
function Readers() {
  const W = 423, c1 = 270, c2 = 372
  return (
    <svg viewBox={`0 0 ${W} 104`} role="img" aria-label="Two readers. Given the right home sentence, both copy the place, 36 of 36. Given a distractor about the same animal, the reader without abstention answers a place 36 of 36, the reader with abstention says unknown 36 of 36. Given another animal's home sentence, both answer a place, 30 of 30">
      <text x={c1} y={9} fontSize={T} textAnchor="middle" fill={MUTED} style={sans}>without abstention</text>
      <text x={c2} y={9} fontSize={T} textAnchor="middle" fill={ACCENT} fontWeight={700} style={sans}>with abstention</text>
      <line x1={0} x2={W} y1={15} y2={15} stroke={RULE2} strokeWidth={0.6} />
      {READ.map(([kind, ex, a, b], i) => {
        const y = 32 + i * 28
        const Cell = ({ x, v: [txt, ok] }) => (
          <text x={x} y={y + 3} fontSize={TB} textAnchor="middle" fontWeight={700} fill={ok ? PASS : WARN} style={mono}>{txt} {ok ? "✓" : "✗"}</text>
        )
        return (
          <g key={kind}>
            <text x={0} y={y - 2} fontSize={T} fill={INK} style={sans}>{kind}</text>
            <text x={0} y={y + 11} fontSize={TB} fill={AMBER} style={mono}>{ex}</text>
            <Cell x={c1} v={a} />
            <Cell x={c2} v={b} />
          </g>
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------- step 4: the whole pipeline
// "The whole pipeline, and how it fails": every animal moves; the seed-0 reader with abstention
// answers from each retriever's top passage. right/unknown/wrong of 6.
const RUN = [["TF-IDF", 0, 6, 0], ["general", 0, 5, 1], ["trained dense", 3, 0, 3], ["hybrid", 6, 0, 0]]
function Moved() {
  const W = 423, x0 = 84, u = 22
  return (
    <svg viewBox={`0 0 ${W} 132`} role="img" aria-label="After every animal moved, of six questions: TF-IDF 0 right, 6 unknown, 0 wrong; general embeddings 0 right, 5 unknown, 1 wrong; trained dense 3 right, 0 unknown, 3 wrong; hybrid 6 right. The fox: the retriever returns the hen lives in the log, and the reader answers in the log, wrongly">
      {[["right", PASS], ["unknown", GREY], ["wrong", WARN]].map(([k, c], i) => (
        <g key={k}>
          <rect x={x0 + i * 70} y={1} width={10} height={9} rx={1} fill={c} />
          <text x={x0 + 14 + i * 70} y={9.5} fontSize={T} fill={INK} style={sans}>{k}</text>
        </g>
      ))}
      {RUN.map(([name, r, n, w], i) => {
        const y = 18 + i * 17
        let x = x0
        const seg = (k, c) => { const el = Array.from({ length: k }, (_, j) => <rect key={c + j} x={x + j * u} y={y} width={u - 2} height={12} rx={1.2} fill={c} />); x += k * u; return el }
        return (
          <g key={name}>
            <text x={x0 - 8} y={y + 10} fontSize={T} textAnchor="end" fill={INK} fontWeight={name === "hybrid" ? 700 : 400} style={sans}>{name}</text>
            {seg(r, PASS)}{seg(n, GREY)}{seg(w, WARN)}
          </g>
        )
      })}
      <line x1={0} x2={W} y1={90} y2={90} stroke={RULE2} strokeWidth={0.6} />
      <text x={0} y={106} fontSize={T} fill={MUTED} style={sans}>trained dense:</text>
      <text x={80} y={106} fontSize={TB} fill={INK} style={mono}>where does the fox live</text>
      <rect x={0} y={113} width={168} height={17} rx={2} fill={AMBER_SOFT} stroke={AMBER} strokeWidth={0.7} />
      <text x={6} y={125} fontSize={TB} fill={AMBER} fontWeight={700} style={mono}>the hen lives in the log</text>
      <Arrow x1={174} y1={121.5} x2={204} y2={121.5} color={GREY} />
      <text x={212} y={125} fontSize={TB} fill={WARN} fontWeight={700} style={mono}>in the log ✗</text>
    </svg>
  )
}

// "RAG, tools or fine-tuning?": the guide's table.
const CHOICE = [
  ["changing or unseen facts", "RAG or a tool"],
  ["exact lookups, actions", "a tool"],
  ["many documents", "RAG"],
  ["format, style, task", "fine-tuning"],
  ["preferring answers", "preference tuning"],
]
function Choice() {
  const W = 294, c = 160
  return (
    <svg viewBox={`0 0 ${W} 100`} role="img" aria-label="Which to use: facts that change or were never seen, RAG or a tool; exact lookups and actions, a tool; a large collection of documents, RAG; a format, style or task, fine-tuning; preferring one answer to another, preference tuning">
      {CHOICE.map(([need, pick], i) => (
        <g key={need}>
          <text x={0} y={12 + i * 20} fontSize={TB} fill={INK} style={sans}>{need}</text>
          <text x={c} y={12 + i * 20} fontSize={TB} fill={pick.includes("RAG") ? ACCENT : INK} fontWeight={pick.includes("RAG") ? 700 : 400} style={sans}>{pick}</text>
        </g>
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------- the sheet
export default function RagSheet({ guide }) {
  return (
    <Poster>
      <Masthead
        guide={guide}
        title="Retrieval-augmented generation"
        subtitle="answering from documents"
        thesis={<>The model <em>answers from the passage</em> it gets: the right one, or just as fluently the <em>wrong one</em>.</>}
      />

      <Step n={1} title="What is RAG? Search outside the model, answer from the prompt">
        <Panel span={7} title={<>The <Term>retriever</Term> finds a <Term>passage</Term>; the <Term>reader</Term> answers from it</>}
          note={<>The retriever is ordinary code searching the <Term>knowledge base</Term>; the reader is the LLM.</>}>
          <Pipeline />
        </Panel>
        <Panel span={5} title="Why? Edit a document, not the weights" className="top"
          note="Guide 8’s fine-tuned fact spread to others.">
          <ul className="checklist">
            <li><b>·</b><span>facts update with a document edit</span></li>
            <li><b>·</b><span>answers can cite passages (check them)</span></li>
            <li><b>·</b><span>private documents work too</span></li>
          </ul>
        </Panel>
      </Step>

      <Step n={2} title="How does the retriever find it? Words miss rewording; vectors know only their training">
        <Panel span={5} title={<><Term>TF-IDF</Term>: <Term>vocabulary mismatch</Term> finds nothing</>}
          note="“live” and “lives” are different words to it.">
          <Mismatch />
        </Panel>
        <Panel span={7} title={<><Term>Dense retrieval</Term> must be trained, and only covers its training</>}
          note={<>General vectors: animals alike (cosine ≥ 0.99); <Term>contrastive training</Term> fixes only those it saw.</>}>
          <Recall />
        </Panel>
      </Step>

      <Step n={3} title="How does the reader answer? It copies, even from a wrong passage">
        <Panel span={5} title="The passage overrides memory"
          note="Trained on random places: copying was its only way to score.">
          <Overrides />
        </Panel>
        <Panel span={7} title={<><Term>Abstention</Term> covers only the cases it learned</>}
          note="Trained on another’s home too, it didn’t learn to check the animal.">
          <Readers />
        </Panel>
      </Step>

      <Step n={4} title="Does the whole system work? Only as well as its retrieval">
        <Panel span={7} title="Every animal moves: edit six passages, retrain nothing"
          note="Measure both halves: was the right passage found, and followed?">
          <Moved />
        </Panel>
        <Panel span={5} title="RAG, a tool or fine-tuning?" className="top">
          <Choice />
        </Panel>
      </Step>

      <Footer guide={guide} />
    </Poster>
  )
}
