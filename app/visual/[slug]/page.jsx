import { notFound } from "next/navigation"
import { allGuides } from "../../../lib/guides"
import { sheets } from "../../../components/visual"
import "../poster.css"

// One A3 sheet per guide that has one (components/visual/index.js). Printed to PDF and PNG by
// tools/build-visuals.mjs; not linked from the sidebar and not in the search index.
export function generateStaticParams() {
  return allGuides().filter((g) => sheets[g.slug]).map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const g = allGuides().find((x) => x.slug === slug)
  return { title: `Visual guide: ${g?.short ?? slug}`, robots: { index: false } }
}

export default async function VisualGuide({ params }) {
  const { slug } = await params
  const guide = allGuides().find((g) => g.slug === slug)
  const Sheet = sheets[slug]
  if (!guide || !Sheet) notFound()
  return <Sheet guide={guide} />
}
