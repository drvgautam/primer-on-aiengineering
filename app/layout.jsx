import Link from "next/link"
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google"
import "katex/dist/katex.min.css"
import "./globals.css"
import { GitHub, Logo } from "../components/site/icons"
import { ThemeToggle, themeScript } from "../components/site/theme"
import { release, repoUrl } from "../lib/guides"

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" })
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif", display: "swap" })
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" })

export const metadata = {
  title: { default: release.title, template: `%s · ${release.title}` },
  description: "Short, worked, runnable guides to how large language models work, from a single neuron to retrieval-augmented generation.",
}

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1014" },
  ],
}

const pdf = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/primer-on-aiengineering.pdf`

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#content">Skip to content</a>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="brand">
              <Logo />
              <span>
                A Primer on <strong>AI Engineering</strong>
              </span>
            </Link>
            <nav className="site-nav" aria-label="Site">
              <Link href="/#guides" className="nav-text">Guides</Link>
              <a href={`${repoUrl}/tree/${release.branch}/code/notebooks`} className="nav-text">Notebooks</a>
              <a href={pdf} className="nav-text">PDF</a>
              <a href={repoUrl} className="icon-button" aria-label="Source on GitHub" title="Source on GitHub">
                <GitHub />
              </a>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main id="content">{children}</main>
        <footer className="site-footer">
          <div className="site-footer-inner">
            <p>
              <strong>{release.title}</strong> by {release.author}. Version {release.version}.
            </p>
            <p>
              Text and figures <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>, code{" "}
              <a href={`${repoUrl}/blob/${release.branch}/LICENSE`}>MIT</a>.{" "}
              <a href={`${repoUrl}/blob/${release.branch}/CITATION.cff`}>Cite this work</a> ·{" "}
              <a href={`${repoUrl}/issues/new/choose`}>Report an error</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
