// Export every figure of the released guides, one vector PDF per step, for the lecture slides.
// usage: node tools/export-figures.mjs [slug ...]      (needs `npm run build` first)
//
// The /book route already draws each step of a stepped figure separately (print mode in
// components/figures/stepped.jsx). This script reads those SVGs from out/book/, puts each one
// alone on a page sized to it, and prints it with Chromium, so the slides show the figures with
// the same drawing, numbers and fonts as the web and the PDF book.
//
// Writes slides/generated/NN-<slug>/fig-<k>-step-<s>.pdf and fig-<k>.tex, which steps through
// them as Beamer overlays: \only<s>{...} for a figure with several steps.
import fs from "node:fs"
import http from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const OUT_DIR = path.join(ROOT, "out")
const GEN = path.join(ROOT, "slides", "generated")
const release = JSON.parse(fs.readFileSync(path.join(ROOT, "release.json"), "utf8"))
const wanted = new Set(process.argv.slice(2))
const guides = release.parts.flatMap((p) => p.guides).filter((g) => !wanted.size || wanted.has(g.slug))

if (!fs.existsSync(path.join(OUT_DIR, "book", "index.html"))) {
  console.error("out/book/index.html not found: run `npm run build` first")
  process.exit(2)
}

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".json": "application/json" }
const BASE_PATH = process.env.PAGES_BASE_PATH || ""
const server = http.createServer((req, res) => {
  let url = decodeURIComponent(new URL(req.url, "http://x").pathname)
  if (BASE_PATH && url.startsWith(BASE_PATH)) url = url.slice(BASE_PATH.length) || "/"
  let p = path.join(OUT_DIR, url)
  if (!p.startsWith(OUT_DIR)) return res.writeHead(403).end()
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html")
  if (!fs.existsSync(p)) return res.writeHead(404).end()
  res.writeHead(200, { "content-type": TYPES[path.extname(p)] ?? "application/octet-stream" })
  fs.createReadStream(p).pipe(res)
})
await new Promise((r) => server.listen(0, "127.0.0.1", r))
const base = `http://127.0.0.1:${server.address().port}`

const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  await page.emulateMedia({ media: "print", colorScheme: "light" })
  await page.goto(`${base}${BASE_PATH}/book/`, { waitUntil: "networkidle" })
  await page.waitForSelector("html[data-print-ready]")
  await page.evaluate(() => document.fonts.ready)

  // Every chapter's figures, in order: [{ steps: [{ svg, w, h, label }] }]
  const chapters = await page.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll(".chapter[data-slug]")].map((ch) => [
        ch.dataset.slug,
        [...ch.querySelectorAll("figure")]
          .filter((f) => f.querySelector("svg"))
          .map((f) => {
            const stepEls = [...f.querySelectorAll(".stepped-print-step")]
            const holders = stepEls.length ? stepEls : [f]
            return {
              steps: holders.map((h) => {
                const svg = h.querySelector("svg")
                const vb = svg.viewBox.baseVal
                return {
                  svg: svg.outerHTML,
                  w: vb?.width || svg.getBoundingClientRect().width,
                  h: vb?.height || svg.getBoundingClientRect().height,
                  label: h.querySelector(".stepped-print-label")?.textContent ?? "",
                }
              }),
            }
          }),
      ]),
    ),
  )

  for (const g of guides) {
    const name = `${String(g.guide).padStart(2, "0")}-${g.slug}`
    const figures = chapters[g.slug]
    if (!figures) throw new Error(`guide ${g.slug} is not on /book/`)
    const dst = path.join(GEN, name)
    fs.mkdirSync(dst, { recursive: true })
    for (const f of fs.readdirSync(dst)) if (/^fig-/.test(f)) fs.rmSync(path.join(dst, f))

    let clipped = 0
    for (const [k, fig] of figures.entries()) {
      for (const [s, st] of fig.steps.entries()) {
        // Alone on the page, at its viewBox size, inside a <figure> so the site's figure CSS
        // (the serif stack the figures were laid out for) still applies.
        const w = Math.ceil(st.w)
        const h = Math.ceil(st.h)
        clipped += await page.evaluate(
          ({ svg, w, h }) => {
            document.body.innerHTML = `<figure style="margin:0;width:${w}px">${svg}</figure>`
            const el = document.body.querySelector("svg")
            el.setAttribute("width", w)
            el.setAttribute("height", h)
            el.style.maxWidth = "none"
            const style = document.createElement("style")
            style.textContent = `@page { size: ${w}px ${h}px; margin: 0 } html, body { margin: 0; padding: 0; background: none }`
            document.head.append(style)
            // the clipping scan from the Guide 7 release: no label may run past the drawing
            const r = el.getBoundingClientRect()
            return [...el.querySelectorAll("text")].filter((t) => {
              const q = t.getBoundingClientRect()
              return q.width && (q.left < r.left - 1 || q.right > r.right + 1 || q.top < r.top - 1 || q.bottom > r.bottom + 1)
            }).length
          },
          { svg: st.svg, w, h },
        )
        await page.pdf({ path: path.join(dst, `fig-${k + 1}-step-${s + 1}.pdf`), width: `${w}px`, height: `${h}px`, printBackground: false, pageRanges: "1" })
      }
      // fig-k.tex: \primerfigure{k}{<height>} inputs this. One step: the drawing. Several: one
      // overlay per step, the step's label under it, as the web figure's pills. The handout shows
      // only the last step, which draws the whole figure.
      const n = fig.steps.length
      const tex =
        n === 1
          ? `\\primerfigstep{${name}/fig-${k + 1}-step-1.pdf}{}\n`
          : fig.steps.map((st, s) => `\\only<${s + 1}| handout:${s + 1 === n ? 1 : 0}>{\\primerfigstep{${name}/fig-${k + 1}-step-${s + 1}.pdf}{${st.label.replace(/[&%$#_{}]/g, (c) => "\\" + c)}}}%\n`).join("")
      fs.writeFileSync(path.join(dst, `fig-${k + 1}.tex`), `\\def\\primerfigsteps{${n}}%\n${tex}`)
    }
    fs.writeFileSync(path.join(dst, "figures.json"), JSON.stringify(figures.map((f) => f.steps.length)))
    console.log(`${name}: ${figures.length} figures, ${figures.reduce((a, f) => a + f.steps.length, 0)} steps${clipped ? `, ${clipped} CLIPPED label(s)` : ""}`)
    if (clipped) process.exitCode = 1
  }
} finally {
  await browser.close()
  server.close()
}
