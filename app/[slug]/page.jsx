import { allGuides } from "../../lib/guides"

export const dynamicParams = false

export function generateStaticParams() {
  return allGuides().map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const guide = allGuides().find((g) => g.slug === slug)
  return { title: guide?.title ?? slug }
}

export default async function GuidePage({ params }) {
  const { slug } = await params
  const { file } = allGuides().find((g) => g.slug === slug)
  const { default: Guide } = await import(`../../content/${file}.mdx`)
  return (
    <article>
      <Guide />
    </article>
  )
}
