// The one-page visual guide for Guide 2, "Tokenization: how text becomes numbers".
// A quick overview in four steps; every example, output and number is the guide's
// (content/02-tokenizer.mdx), and the comments name where each comes from.
// tools/check_visuals.py checks the numbers, the terms and the word budget.
import { Footer, Masthead, Panel, Poster, Step, Term } from "./poster"

const ACCENT = "#1e3a5f", INK = "#1b1b1f", MUTED = "#5f5f6a", RULE2 = "#cfcbc0", FAIL = "#b91c1c"
const sans = { fontFamily: "var(--sans)" }
const mono = { fontFamily: "var(--mono)" }
const T = 10, TB = 10.5

// One token as a box; a leading space shows as ␣, as the guide's figures mark it.
function Tok({ t, id, bad, hot }) {
  const sp = t.startsWith(" ")
  return (
    <span className="tok-col">
      <span className={`tok${bad ? " bad" : ""}${hot ? " hot" : ""}`}>{sp ? <span className="sp">␣</span> : null}{sp ? t.slice(1) : t}</span>
      {id !== undefined ? <span className="tok-id">{id}</span> : null}
    </span>
  )
}

function Toks({ list, ids, bad = [], hot = [] }) {
  return <span className="toks">{list.map((t, i) => <Tok key={i} t={t} id={ids?.[i]} bad={bad.includes(i)} hot={hot.includes(i)} />)}</span>
}

// ---------------------------------------------------------------- step 1: what a model reads
// GPT-2's tokenizer on the running example (Figure 3), and the shifted targets (the last block).
function Running() {
  return (
    <div className="tk-hero">
      <div className="tk-row">
        <span className="hero-label">text</span>
        <code className="hero-prompt">The cat sat on the</code>
      </div>
      <div className="tk-grid">
        <span className="hero-label">tokens</span>
        {["The", " cat", " sat", " on", " the"].map((t, i) => <Tok key={i} t={t} />)}
        <span />
        <span className="hero-label">IDs</span>
        {[464, 3797, 3332, 319, 262].map((id) => <span key={id} className="tok-id">{id}</span>)}
        <span />
        <span className="hero-label">targets</span>
        {[3797, 3332, 319, 262].map((id) => <span key={id} className="tk-target">{id}</span>)}
        <span />
        <i className="tk-note">the next ID</i>
      </div>
    </div>
  )
}

// The toy text counted three ways: characters, 10 BPE merges, words (the first block and the trainer).
function Extremes() {
  const W = 294
  const rows = [["characters", 128, "15", ""], ["word pieces", 65, "25", "10 merges (step 2)"], ["words", 33, "12", "<unk> for any new word"]]
  const x0 = 92, bw = (v) => (v / 128) * 150
  return (
    <svg viewBox={`0 0 ${W} 102`} role="img" aria-label="The toy text: 128 character tokens with 15 entries; 65 tokens after 10 merges with 25 entries; 33 word tokens with 12 entries">
      <text x={x0} y={9} fontSize={T} fill={MUTED} style={sans}>tokens</text>
            {rows.map(([name, n, v, why], i) => {
        const y = 18 + i * 29
        const mid = i === 1
        return (
          <g key={name}>
            <text x={x0 - 6} y={y + 10} fontSize={TB} fontWeight={mid ? 700 : 600} textAnchor="end" fill={mid ? ACCENT : INK} style={sans}>{name}</text>
            <rect x={x0} y={y} width={bw(n)} height={13} rx={1.6} fill={mid ? ACCENT : "#aeb7c4"} />
            <text x={x0 + bw(n) + 4} y={y + 10} fontSize={TB} fontWeight={700} fill={INK} style={mono}>{n}</text>
            {why ? <text x={x0} y={y + 23} fontSize={T} fill={i === 2 ? FAIL : MUTED} style={sans}>{why}</text> : null}
          </g>
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------- step 2: byte-pair encoding
// The trainer's printed table: each merge and the toy text's length after it.
const MERGES = [["start", 128], ["t+h", 117], ["th+e", 106], ["␣+the", 96], ["a+t", 88], ["a+n", 83],
  ["o+g", 79], ["c+at", 75], ["␣+cat", 71], ["o+n", 68], ["d+og", 65]]
function MergeChart() {
  const W = 423, H = 160, y0 = 14, ph = 102, step = W / MERGES.length, bw = step - 8
  const y = (v) => y0 + ph - (v / 128) * ph
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Tokens in the toy text after each merge: 128 at the start, then 117, 106, 96, 88, 83, 79, 75, 71, 68 and 65 after the tenth">
      {MERGES.map(([m, n], i) => {
        const x = i * step + 4, first = i === 0
        return (
          <g key={m}>
            <rect x={x} y={y(n)} width={bw} height={y(0) - y(n)} rx={1.6} fill={first ? "#aeb7c4" : ACCENT}  />
            <text x={x + bw / 2} y={y(n) - 3} fontSize={T} textAnchor="middle" fill={INK} style={mono}>{n}</text>
            <text x={x + bw / 2} y={y(0) + 13} fontSize={T} textAnchor="middle" fill={first ? MUTED : INK} fontWeight={first ? 400 : 600} style={mono}>{m}</text>
            {first ? null : <text x={x + bw / 2} y={y(0) + 25} fontSize={T} textAnchor="middle" fill={MUTED} style={mono}>{i}</text>}
          </g>
        )
      })}
      <text x={0} y={H - 2} fontSize={T} fill={MUTED} style={sans}>count = tokens for the whole toy text</text>
    </svg>
  )
}

// ---------------------------------------------------------------- the sheet
export default function TokenizerSheet({ guide }) {
  return (
    <Poster>
      <Masthead
        guide={guide}
        title="Tokenization"
        subtitle="how text becomes numbers"
        thesis={<>A tokenizer turns any text into <em>integers</em> from a fixed list of <em>frequent pieces</em>. The model only ever sees the integers.</>}
      />

      <Step n={1} title="What does a model read? Token IDs, never letters">
        <Panel span={7} title={<>GPT-2&apos;s <Term>tokenizer</Term> on the running example</>}
          note={<>It <Term as="encode">encodes</Term> text into <Term as="token ID">IDs</Term> and <Term as="decode">decodes</Term> them back exactly. ␣ marks a leading space.</>}>
          <Running />
        </Panel>
        <Panel span={5} title="Characters are too long; words have holes"
          note="Word pieces sit in between.">
          <p className="tk-toy">Toy text: <code>the cat sat on the mat and the dog …</code></p>
          <Extremes />
        </Panel>
      </Step>

      <Step n={2} title="How is the list built? Merge the most frequent pair, again and again">
        <Panel span={7} title={<><Term>Byte-pair encoding</Term>: each <Term>merge</Term> adds one entry and shortens the text</>}
          note="GPT-2 stopped at 50,000 merges: a trade-off between sequence length and vocabulary size.">
          <MergeChart />
        </Panel>
        <Panel span={5} title="New text: replay the merges in order" className="top"
          note={<>Order matters: merge 7 needs the <code>at</code> that merge 4 built.</>}>
          <div className="tk-steps">
            <span className="k">␣cats</span><Toks list={[" ", "c", "a", "t", "s"]} />
            <span className="k">merge 4</span><Toks list={[" ", "c", "at", "s"]} hot={[2]} />
            <span className="k">merge 7</span><Toks list={[" ", "cat", "s"]} hot={[1]} />
            <span className="k">merge 8</span><Toks list={[" cat", "s"]} hot={[0]} />
          </div>
          <div className="tk-steps tk-new">
            <span className="k">the bat</span><span><Toks list={["the", " ", "b", "at"]} bad={[2]} /> <span className="tk-why">no ID for b</span></span>
            <span /><span className="tk-next">→ step 3 fixes this</span>
          </div>
        </Panel>
      </Step>

      <Step n={3} title="And characters it never saw? Start from bytes">
        <Panel span={6} title={<>Any text is <Term as="byte">bytes</Term>: 256 values, so nothing is unknown</>}
          note={<><Term>Byte-level BPE</Term> merges bytes; a word it never saw falls back to smaller pieces.</>}>
          <div className="tk-steps">
            <span className="k">café</span><span className="tk-bytes"><span>99</span><span>97</span><span>102</span><span className="two">195</span><span className="two">169</span><i>é is 2 bytes</i></span>
            <span className="tk-span">GPT-2:</span>
            <span className="k">the bat</span><Toks list={["the", " bat"]} />
            <span className="k">Akwirw ier</span><Toks list={["Ak", "w", "ir", "w", " ", "ier"]} />
          </div>
        </Panel>
        <Panel span={6} title="GPT-2's list: 50,257 tokens"
          note="To the model, these four are unrelated integers.">
          <p className="tk-sum"><b>256</b> bytes <span>+</span> <b>50,000</b> merges <span>+</span> <b>1</b> <Term>end-of-text token</Term></p>
          <div className="tk-steps tk-four">
            <Toks list={[" cat", " Cat", "cat", " CAT"]} ids={[3797, 5181, 9246, 38348]} />
          </div>
        </Panel>
      </Step>

      <Step n={4} title="Where does it show through? Spelling, digits, languages">
        <Panel span={4} title="Spelling: the model never sees the letters"
          note="It gets IDs; spelling is learned indirectly.">
          <div className="tk-steps tk-big">
            <span className="k">strawberry</span><Toks list={["st", "raw", "berry"]} />
            <span className="k">␣strawberry</span><Toks list={[" strawberry"]} />
          </div>
        </Panel>
        <Panel span={4} title="Digits group by frequency, not place value"
          note="Arithmetic lines digits up by place; these tokens hold 3, 2 and 2.">
          <div className="tk-steps tk-big">
            <span className="k">␣1234567</span><Toks list={[" 123", "45", "67"]} />
            <span className="k">␣2026</span><Toks list={[" 20", "26"]} />
          </div>
        </Panel>
        <Panel span={4} title="Other languages cost more tokens"
          note={<>Price and <Term>context length</Term> (GPT-2: 1,024) count tokens.</>}>
          <p className="tk-toy"><code>The cat sat on the mat.</code> translated</p>
          <Languages />
        </Panel>
      </Step>

      <Footer guide={guide} />
    </Poster>
  )
}

// The same sentence in four languages: GPT-2 token counts (the last block).
function Languages() {
  const W = 230, rows = [["English", 7], ["Norwegian", 9], ["German", 10], ["French", 12]], x0 = 64, bw = (v) => (v / 12) * 136
  return (
    <svg viewBox={`0 0 ${W} 90`} role="img" aria-label="GPT-2 tokens for the same sentence: English 7, Norwegian 9, German 10, French 12">
      {rows.map(([lang, n], i) => (
        <g key={lang}>
          <text x={x0 - 6} y={i * 22 + 11} fontSize={TB} textAnchor="end" fill={INK} style={sans}>{lang}</text>
          <rect x={x0} y={i * 22 + 2} width={bw(n)} height={12} rx={1.6} fill={i === 0 ? ACCENT : "#aeb7c4"} />
          <text x={x0 + bw(n) + 4} y={i * 22 + 11.5} fontSize={TB} fontWeight={700} fill={INK} style={mono}>{n}</text>
        </g>
      ))}
    </svg>
  )
}
