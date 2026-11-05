// The one-page visual guide for Guide 9, "Alignment: teaching a model which answer is better".
// A quick overview in four steps; every example, output and number is the guide's
// (content/09-alignment.mdx), and the comments name where each comes from.
// tools/check_visuals.py checks the numbers, the terms and the word budget.
import { Footer, Masthead, Math, Panel, Poster, Step, Term } from "./poster"

const ACCENT = "#1e3a5f", INK = "#1b1b1f", SOFT = "#3d3d45", MUTED = "#5f5f6a", RULE2 = "#cfcbc0"
const WARN = "#b91c1c", PASS = "#0f7b4a", GREY = "#aeb7c4", AMBER = "#b45309"
const sans = { fontFamily: "var(--sans)" }
const mono = { fontFamily: "var(--mono)" }
const T = 10, TB = 10.5

// ---------------------------------------------------------------- step 1: the toy, and Bradley–Terry
// The base model's place distribution after "the fox lay under the" (the first block); the fox's home is rug.
function BasePlaces() {
  const W = 358, rows = [["mat", 0.244], ["log", 0.163], ["rug", 0.088], ["bed", 0.165], ["pot", 0.235], ["hut", 0.106]], x0 = 40, bw = 230
  return (
    <svg viewBox={`0 0 ${W} 106`} role="img" aria-label="The base model after the fox lay under the: mat 0.244, log 0.163, rug 0.088, bed 0.165, pot 0.235, hut 0.106. Rug, the fox's home, gets the least.">
      {rows.map(([pl, v], i) => {
        const home = pl === "rug", y = 14 + i * 15
        return (
          <g key={pl}>
            <text x={x0 - 6} y={y + 11} fontSize={TB} textAnchor="end" fontWeight={home ? 700 : 400} fill={home ? PASS : INK} style={mono}>{pl}</text>
            <rect x={x0} y={y + 2} width={(v / 0.25) * bw * 0.9} height={11} rx={1.4} fill={home ? PASS : GREY} />
            <text x={x0 + (v / 0.25) * bw * 0.9 + 4} y={y + 11} fontSize={TB} fontWeight={home ? 700 : 400} fill={INK} style={mono}>{v.toFixed(3)}</text>
          </g>
        )
      })}
      <text x={W} y={58} fontSize={T} textAnchor="end" fill={PASS} fontWeight={700} style={sans}>← the fox&apos;s home</text>
      <text x={0} y={9} fontSize={T} fill={MUTED} style={sans}>after &quot;the fox lay under the&quot;</text>
    </svg>
  )
}

// ---------------------------------------------------------------- step 2: reward model shortcut, best-of-n
// The best-of-n table: home chosen, cat/dog/rat (the reward model is right) against fox/owl/hen (wrong).
const BON = [[1, 22.4, 14.2], [2, 33.2, 11.1], [4, 56.1, 2.3], [8, 80.0, 0.2], [16, 95.5, 0.0]]
function BestOfN() {
  const W = 423, H = 128, x0 = 44, xw = 300, y0 = 16, yh = 88, X = (i) => x0 + (i / 4) * xw, Y = (v) => y0 + yh - (v / 100) * yh
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Best-of-n against the reward model: for cat, dog, rat the home rate rises from 22.4% to 95.5% as n goes from 1 to 16; for fox, owl, hen it falls from 14.2% to 0.0%">
      <line x1={x0} x2={x0 + xw} y1={Y(0)} y2={Y(0)} stroke={RULE2} strokeWidth={0.7} />
      <line x1={x0} x2={x0 + xw} y1={Y(100)} y2={Y(100)} stroke={RULE2} strokeWidth={0.5} strokeDasharray="2 2" />
      <text x={x0 - 4} y={Y(100) + 4} fontSize={T} textAnchor="end" fill={MUTED} style={mono}>100%</text>
      <text x={x0 + 4} y={Y(100) - 4} fontSize={T} fill={MUTED} style={sans}>home chosen</text>
      {[["#1e3a5f", 1], [WARN, 2]].map(([c, k]) => (
        <g key={k}>
          <polyline points={BON.map((r, i) => `${X(i)},${Y(r[k])}`).join(" ")} fill="none" stroke={c} strokeWidth={1.6} />
          {BON.map((r, i) => <circle key={i} cx={X(i)} cy={Y(r[k])} r={2.6} fill={c} />)}
        </g>
      ))}
      {BON.map(([n], i) => <text key={n} x={X(i)} y={Y(0) + 13} fontSize={T} textAnchor="middle" fill={MUTED} style={mono}>{n}</text>)}
      <text x={x0 + xw} y={Y(0) + 24} fontSize={T} textAnchor="end" fill={MUTED} style={sans}>n samples, keep the best-scored</text>
      <text x={X(0) - 4} y={Y(22.4) - 6} fontSize={T} textAnchor="end" fill={ACCENT} style={mono}>22.4%</text>
      <text x={X(4) + 6} y={Y(95.5) + 4} fontSize={TB} fontWeight={700} fill={ACCENT} style={mono}>95.5%</text>
      <text x={X(0) - 4} y={Y(14.2) + 10} fontSize={T} textAnchor="end" fill={WARN} style={mono}>14.2%</text>
      <text x={X(4) + 6} y={Y(0) + 4} fontSize={TB} fontWeight={700} fill={WARN} style={mono}>0.0%</text>
      <text x={X(4) + 6} y={Y(95.5) - 10} fontSize={T} fill={ACCENT} style={sans}>cat, dog, rat</text>
      <text x={X(4) + 6} y={Y(0) - 12} fontSize={T} fill={WARN} style={sans}>fox, owl, hen</text>
    </svg>
  )
}

// ---------------------------------------------------------------- step 3: the KL dial, and DPO
// The closed-form optimum for four betas: home rate for the two groups.
function Beta() {
  const W = 358, rows = [["reference", 18.9, 17.1], ["β 10", 34.8, 13.7], ["β 3", 76.6, 5.8], ["β 1", 99.6, 0.1], ["β 0.3", 100.0, 0.0]], x0 = 72, bw = 100
  return (
    <svg viewBox={`0 0 ${W} 124`} role="img" aria-label="KL-penalized optimum. Beta 10: 34.8% and 13.7%; 3: 76.6% and 5.8%; 1: 99.6% and 0.1%; 0.3: 100.0% and 0.0%">
      <text x={0} y={9} fontSize={T} fill={MUTED} style={sans}>step 2&apos;s reward model; ↓ smaller β follows it further</text>
      <text x={x0} y={22} fontSize={T} fill={ACCENT} style={sans}>cat, dog, rat</text>
      <text x={x0 + bw + 60} y={22} fontSize={T} fill={WARN} style={sans}>fox, owl, hen</text>
      {rows.map(([b, a, c], i) => {
        const y = 28 + i * 19
        return (
          <g key={b}>
            <text x={x0 - 6} y={y + 10} fontSize={TB} textAnchor="end" fill={INK} style={mono}>{b}</text>
            <rect x={x0} y={y + 1} width={(a / 100) * bw} height={11} rx={1.4} fill={ACCENT} />
            <text x={x0 + (a / 100) * bw + 4} y={y + 10} fontSize={TB} fill={INK} style={mono}>{a.toFixed(1)}%</text>
            <rect x={x0 + bw + 60} y={y + 1} width={globalThis.Math.max(1, (c / 100) * bw)} height={11} rx={1.4} fill={WARN} />
            <text x={x0 + bw + 64 + (c / 100) * bw} y={y + 10} fontSize={TB} fill={INK} style={mono}>{c.toFixed(1)}%</text>
          </g>
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------- step 4: over-optimization
// Figure 3: where the probability goes after an unseen prompt.
function Breakdown() {
  const W = 423, rows = [["base", 17.7, [17.6, 82.0, 0.4], 0.244], ["gentle DPO", 78.7, [47.6, 17.2, 35.2], 0.357], ["aggressive DPO", 100.0, [30.2, 0.0, 69.8], 2.187]]
  const x0 = 92, bw = 220, cols = [PASS, GREY, WARN]
  return (
    <svg viewBox={`0 0 ${W} 112`} role="img" aria-label="After an unseen prompt, preferred place, other places, anything else: base 17.6, 82.0, 0.4; gentle DPO 47.6, 17.2, 35.2; aggressive DPO 30.2, 0.0, 69.8. Home rates 17.7%, 78.7%, 100.0%; validation loss 0.244, 0.357, 2.187.">
      <text x={x0 + bw + 10} y={9} fontSize={T} fill={MUTED} style={sans}>home rate*</text>
      <text x={W} y={9} fontSize={T} textAnchor="end" fill={MUTED} style={sans}>loss ↓</text>
      {rows.map(([l, hr, parts, vl], i) => {
        const y = 18 + i * 22
        let x = x0
        return (
          <g key={l}>
            <text x={x0 - 6} y={y + 11} fontSize={TB} textAnchor="end" fontWeight={i === 2 ? 700 : 400} fill={INK} style={sans}>{l}</text>
            {parts.map((v, j) => {
              const w = (v / 100) * bw, r = <rect key={j} x={x} y={y + 2} width={w} height={13} fill={cols[j]} stroke="#fff" strokeWidth={0.5} />
              x += w
              return r
            })}
            <text x={x0 + bw + 10} y={y + 12} fontSize={TB} fontWeight={700} fill={i === 2 ? PASS : INK} style={mono}>{hr.toFixed(1)}%</text>
            <text x={W} y={y + 12} fontSize={TB} textAnchor="end" fontWeight={i === 2 ? 700 : 400} fill={i === 2 ? WARN : INK} style={mono}>{vl.toFixed(3)}</text>
          </g>
        )
      })}
      {[["preferred", PASS, 0], ["other places", GREY, 70], ["anything else", WARN, 160], ["*of 6 places", null, 252]].map(([l, c, lx], j) => (
        <g key={l}>
          {c ? <rect x={x0 + lx - 4} y={90} width={9} height={9} fill={c} /> : null}
          <text x={x0 + lx + (c ? 8 : -4)} y={98} fontSize={T} fill={MUTED} style={sans}>{l}</text>
        </g>
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------- the sheet
export default function AlignmentSheet({ guide }) {
  return (
    <Poster>
      <Masthead
        guide={guide}
        title="Alignment"
        subtitle="teaching a model which answer is better"
        thesis={<>Train on <em>preferences</em>: a flawed signal <em>gets gamed</em>; push too hard and even a right one breaks.</>}
      />

      <Step n={1} title="Why a new kind of data? Picking the better of two is easy" sub="own home wins: …under the rug ≻ …under the pot">
        <Panel span={6} title="No preference yet"
          note="Knows the homes, prefers none.">
          <BasePlaces />
        </Panel>
        <Panel span={6} title={<>A <Term>reward model</Term> scores; <Term>Bradley–Terry model</Term> compares</>}
          note={<>Trained on <Term>preference data</Term>: prompt, two responses, winner.</>}>
          <p className="al-rlhf"><b><Term>RLHF</Term>:</b> <span>SFT</span> → <span>reward model</span> → <span>optimize policy (PPO)</span></p>
          <p className="formula al-eq"><Math display tex={String.raw`\Pr(y^+ \succ y^-) = \operatorname{sigmoid}\big(R(x,y^+) - R(x,y^-)\big)`} /></p>
          <p className="al-key">R: reward score · x: prompt · y⁺ preferred, y⁻ rejected</p>
          <p className="al-ex">2.0 vs 0.5 → <b>0.818</b>; equal → <b>0.500</b></p>
        </Panel>
      </Step>

      <Step n={2} title="What goes wrong? Shortcuts, then optimizing games them">
        <Panel span={5} title="Trained on three animals, the reward model took a shortcut" className="top"
          note="100% on training pairs proved nothing.">
          <div className="al-rm">
            <p className="al-homes"><i>cat → hut</i><i>dog → bed</i><i>rat → log</i><i className="m">fox → rug</i><i className="m">owl → pot</i><i className="m">hen → mat</i></p>
            <p><span>cat, dog, rat</span><b className="mark-pass">100.0%</b> ranked right</p>
            <p><span>fox, owl, hen</span><b className="mark-fail">21.2%</b> worse than a coin</p>
            <p className="al-top">Unseen animals&apos; top: <code>bed log hut</code>, trained animals&apos; homes.</p>
          </div>
        </Panel>
        <Panel span={7} title={<><Term>Best-of-n</Term>, RLHF&apos;s step 3: <Term>reward hacking</Term></>}
          note={<>Where it&apos;s wrong, optimizing does worse than nothing: <Term>Goodhart&apos;s law</Term>.</>}>
          <BestOfN />
        </Panel>
      </Step>

      <Step n={3} title="Can you limit it? A KL penalty, or DPO with no reward model">
        <Panel span={6} title={<>The <Term>KL penalty</Term>: β, how near the <Term>reference model</Term> to stay</>}
          note={<>Optimum: reference × <Math tex={String.raw`e^{R/\beta}`} />. It can&apos;t fix a wrong reward model.</>}>
          <Beta />
        </Panel>
        <Panel span={6} title={<><Term>DPO</Term>: train the <Term>policy</Term> on comparisons directly</>}
          note="On cat, dog, rat only, the shortcut returns: fox, owl, hen ≈ 10%, below base.">
          <div className="al-dpo">
            <p><span>pair</span><code>y⁺</code><code>y⁻</code><i>preferred / rejected</i></p>
            <p><span>score</span>policy vs frozen reference</p>
            <p><span>update</span><b>raise y⁺, lower y⁻</b></p>
            <p className="al-gen">All six animals, unseen phrasings: 17.7% → <b>78.7%</b></p>
          </div>
        </Panel>
      </Step>

      <Step n={4} title="When does the score lie? When pushed too hard">
        <Panel span={7} title={<><Term>Over-optimization</Term>: a perfect score, broken text</>}
          note="Preferred and rejected can both fall: check outputs, not the score.">
          <Breakdown />
          <p className="al-out">aggressive DPO: <span>the fox lay under the</span><code>rer ehehet a</code></p>
        </Panel>
        <Panel span={5} title="What alignment doesn't do" className="top"
          note="But raters preferred InstructGPT (1.3B) over GPT-3 (175B) at following requests.">
          <ul className="checklist">
            <li><b className="mark-fail">✗</b><span>add facts: it reweights what it already says</span></li>
            <li><b className="mark-fail">✗</b><span>stop <Term>hallucination</Term></span></li>
            <li><b className="mark-fail">!</b><span>it can add <Term>sycophancy</Term>: raters reward agreeable answers</span></li>
          </ul>
        </Panel>
      </Step>

      <Footer guide={guide} />
    </Poster>
  )
}
