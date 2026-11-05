// Print the one-page visual guides: /visual/<slug>/ -> an A3 PDF and PNGs, plus a report of the
// page measurements tools/check_visuals.py checks.
// usage: node tools/build-visuals.mjs [slug ...]      (needs `npm run build` first)
//
// Writes dist/visuals/NN-<slug>.pdf (vector, A3), NN-<slug>.png (2480 px wide, for sharing),
// NN-<slug>-preview.png (1200 px wide) and NN-<slug>.report.json, with the sheet's text and its
// highlighted terms, and these measurements:
//   overflow   panels whose content doesn't fit their box, or that run past the sheet
//   minFontPt  the smallest rendered text on the sheet, in points at A3 (HTML and SVG text)
//   small      text rendered below 9 pt
//   clipped    SVG labels that run outside their drawing
//   contrast   text below WCAG AA contrast against its background
import fs from "node:fs"
import http from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const OUT_DIR = path.join(ROOT, "out")
const DIST = path.join(ROOT, "dist", "visuals")
const release = JSON.parse(fs.readFileSync(path.join(ROOT, "release.json"), "utf8"))
const wanted = new Set(process.argv.slice(2))
const guides = release.parts.flatMap((p) => p.guides).filter((g) => !wanted.size || wanted.has(g.slug))
  .filter((g) => fs.existsSync(path.join(OUT_DIR, "visual", g.slug, "index.html")))
if (!guides.length) {
  console.error("no visual guides in out/visual/: run `npm run build` first (a guide needs a sheet in components/visual/)")
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
fs.mkdirSync(DIST, { recursive: true })

// Runs in the page: measure the sheet as printed.
function measure() {
  const px2pt = 0.75
  const poster = document.querySelector(".poster")
  const pr = poster.getBoundingClientRect()
  // the sheet's printable area: inside its padding (the paper margin)
  const ps = getComputedStyle(poster)
  const inner = { bottom: pr.bottom - parseFloat(ps.paddingBottom), right: pr.right - parseFloat(ps.paddingRight) }
  const label = (el) => (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60)
  const overflow = []
  for (const p of poster.querySelectorAll(".panel, .setup, .poster-foot, .poster-head")) {
    const r = p.getBoundingClientRect()
    if (p.scrollHeight > p.clientHeight + 1 || p.scrollWidth > p.clientWidth + 1)
      overflow.push(`${p.dataset.panel || p.className}: content ${p.scrollHeight - p.clientHeight}px taller or ${p.scrollWidth - p.clientWidth}px wider than its box`)
    if (r.bottom > inner.bottom + 1 || r.right > inner.right + 1) overflow.push(`${p.dataset.panel || p.className}: runs into the sheet's margin`)
  }
  // text sizes: HTML text nodes by computed size, SVG text by size x scale on screen
  const sizes = []
  const walker = document.createTreeWalker(poster, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const t = walker.currentNode
    if (!t.textContent.trim()) continue
    const el = t.parentElement
    if (el.closest("svg") || el.closest(".katex-mathml") || el.closest(".qr")) continue
    if (el.closest(".katex")) continue
    sizes.push([parseFloat(getComputedStyle(el).fontSize) * px2pt, label(el)])
  }
  const clipped = []
  for (const svg of poster.querySelectorAll(".panel-art svg, .panel svg")) {
    if (svg.closest(".katex") || svg.classList.contains("src-ico")) continue
    const panel = svg.closest(".panel")?.getBoundingClientRect() ?? svg.getBoundingClientRect()
    for (const t of svg.querySelectorAll("text")) {
      const m = t.getScreenCTM()
      const scale = m ? Math.hypot(m.a, m.b) : 1   // rotated labels too
      sizes.push([parseFloat(getComputedStyle(t).fontSize) * scale * px2pt, `svg: ${label(t)}`])
      const q = t.getBoundingClientRect()
      if (q.width && (q.left < panel.left - 0.5 || q.right > panel.right + 0.5 || q.top < panel.top - 0.5 || q.bottom > panel.bottom + 0.5))
        clipped.push(label(t))
    }
  }
  // contrast against the nearest opaque background
  const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number)
  const lum = ([r, g, b]) => {
    const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const bgOf = (el) => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const c = rgb(getComputedStyle(e).backgroundColor)
      if (c.length >= 3 && (c.length === 3 || c[3] > 0.5)) return c.slice(0, 3)
      if (getComputedStyle(e).backgroundImage !== "none") return [255, 255, 255]
    }
    return [255, 255, 255]
  }
  const contrast = []
  const seen = new Set()
  for (const el of poster.querySelectorAll("*")) {
    if (el.closest("svg") || el.closest(".katex") || el.closest(".qr")) continue
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    if (!own) continue
    const cs = getComputedStyle(el)
    const fg = rgb(cs.color).slice(0, 3)
    const bg = bgOf(el)
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x)
    const ratio = (a + 0.05) / (b + 0.05)
    const pt = parseFloat(cs.fontSize) * px2pt
    const large = pt >= 18 || (pt >= 14 && parseInt(cs.fontWeight) >= 700)
    if (ratio < (large ? 3 : 4.5)) {
      const key = `${label(el)}|${ratio.toFixed(2)}`
      if (!seen.has(key)) { seen.add(key); contrast.push(`${ratio.toFixed(2)}:1 "${label(el)}"`) }
    }
  }
  // the sheet's own words for the number check (skipping data-free parts and KaTeX's MathML copy),
  // and the terms it highlights
  const clone = poster.cloneNode(true)
  clone.querySelectorAll("[data-free], .katex-mathml, .qr").forEach((e) => e.remove())
  document.body.append(clone)
  clone.style.position = "absolute"
  clone.style.left = "-10000px"
  const text = clone.innerText
  // the words a reader reads: drawings of characters (data-chars) are pictures, not words
  clone.querySelectorAll("[data-chars]").forEach((e) => e.remove())
  const words = clone.innerText
  clone.remove()
  const terms = [...poster.querySelectorAll("[data-term]")].map((e) => e.dataset.term)
  const minFontPt = Math.min(...sizes.map((s) => s[0]))
  const small = sizes.filter((s) => s[0] < 8.95).map((s) => `${s[0].toFixed(2)} pt "${s[1]}"`)
  return { overflow, minFontPt: +minFontPt.toFixed(2), small: [...new Set(small)], clipped, contrast, terms, text, words }
}

// Load every face the sheet uses before measuring or printing: Chromium only fetches a face once
// text needs it, and print media can lay the page out before it arrives.
async function loadFonts(page) {
  await page.evaluate(async () => {
    const want = [["Poster Sans", [400, 500, 600, 700, 800]], ["Poster Mono", [400, 600, 700]], ["Poster Serif", [400]]]
    for (const [family, weights] of want)
      for (const w of weights) await document.fonts.load(`${w} 12pt "${family}"`)
    await document.fonts.load('italic 400 12pt "Poster Serif"')
    await document.fonts.ready
  })
}

const browser = await chromium.launch()
let failed = 0
try {
  for (const g of guides) {
    const name = `${String(g.guide).padStart(2, "0")}-${g.slug}`
    const url = `${base}${BASE_PATH}/visual/${g.slug}/`
    const page = await browser.newPage({ viewport: { width: 1200, height: 1700 } })
    await page.emulateMedia({ media: "print", colorScheme: "light" })
    await page.goto(url, { waitUntil: "networkidle" })
    await loadFonts(page)
    const report = await page.evaluate(measure)
    fs.writeFileSync(path.join(DIST, `${name}.report.json`), JSON.stringify(report, null, 1))
    await page.pdf({ path: path.join(DIST, `${name}.pdf`), width: "297mm", height: "420mm", printBackground: true, preferCSSPageSize: true })
    await page.close()
    // PNGs: the sheet alone, at 2480 px (A3 at 212 dpi) and a 1200 px preview
    for (const [suffix, px] of [["", 2480], ["-preview", 1200]]) {
      const sharp = await browser.newPage({ viewport: { width: 1200, height: 1700 }, deviceScaleFactor: px / 1122.52 })
      await sharp.emulateMedia({ media: "print", colorScheme: "light" })
      await sharp.goto(url, { waitUntil: "networkidle" })
      await loadFonts(sharp)
      await sharp.locator(".poster").screenshot({ path: path.join(DIST, `${name}${suffix}.png`) })
      await sharp.close()
    }
    const problems = report.overflow.length + report.small.length + report.clipped.length + report.contrast.length
    console.log(`${name}: wrote dist/visuals/${name}.pdf and PNGs · smallest text ${report.minFontPt} pt` +
      (problems ? ` · ${problems} layout problem(s), see ${name}.report.json` : ""))
    if (problems) failed++
  }
} finally {
  await browser.close()
  server.close()
}
process.exit(failed ? 1 : 0)
