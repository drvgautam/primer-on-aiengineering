import Link from "next/link"
import { allGuides } from "../lib/guides"
import release from "../release.json"

export default function Home() {
  const guides = allGuides()
  return (
    <>
      <h1>A Primer on AI Engineering</h1>
      <p>Short, worked guides to how large language models work, each readable in 10 to 20 minutes.</p>
      <p className="downloads">
        <a href="primer-on-aiengineering.pdf">Download all guides as a PDF</a> ·{" "}
        <a href={`https://github.com/${release.repo}/tree/${release.branch}/code/notebooks`}>Run the code: one notebook per guide</a> ·{" "}
        <a href={`https://github.com/${release.repo}`}>Source on GitHub</a>
      </p>
      <ol className="guide-list">
        {guides.map((g) => (
          <li key={g.slug} value={g.guide ?? undefined}>
            <Link href={`/${g.slug}/`}>{g.title}</Link>
            {g.part ? <span className="part">{g.part}</span> : null}
          </li>
        ))}
      </ol>
    </>
  )
}
