import Link from "next/link"
import "katex/dist/katex.min.css"
import "./globals.css"

export const metadata = {
  title: { default: "A Primer on AI Engineering", template: "%s · A Primer on AI Engineering" },
  description: "Short, worked, runnable guides to how large language models work, from a single neuron to retrieval-augmented generation.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/">A Primer on AI Engineering</Link>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
