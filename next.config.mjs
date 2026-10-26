import createMDX from "@next/mdx"
import rehypeHighlight from "rehype-highlight"
import rehypeKatex from "rehype-katex"
import rehypeSlug from "rehype-slug"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"

// GitHub Pages serves a project site under /<repo>. The Pages workflow passes that
// prefix in PAGES_BASE_PATH; locally it is empty, so the site sits at localhost:3000/.
const basePath = process.env.PAGES_BASE_PATH || ""

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkFrontmatter, remarkGfm, remarkMath],
    rehypePlugins: [rehypeSlug, rehypeKatex, rehypeHighlight],
  },
})

export default withMDX({
  output: "export",
  basePath,
  // for plain <a> links to files outside the app router, such as the PDF
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // /neural-networks/ rather than /neural-networks.html: the URL shape
  // editors/scripts/figures-capture.mjs requests.
  trailingSlash: true,
  pageExtensions: ["js", "jsx", "mdx"],
  images: { unoptimized: true },
})
