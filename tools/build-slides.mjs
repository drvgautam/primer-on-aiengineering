// Build the lecture slides: generated inputs, then LuaLaTeX, into dist/slides/.
// usage: node tools/build-slides.mjs [slug ...] [--native] [--skip-assets]
//
//   1. tools/build_slide_assets.py   code, outputs, notebook cells, series list
//   2. tools/export-figures.mjs      every figure step as a vector PDF (needs `npm run build`)
//   3. lualatex, twice per PDF       NN-<slug>-slides.pdf (overlays) and NN-<slug>-handout.pdf
//
// LuaLaTeX runs in the pinned TeX Live image (texlive/texlive:TL2025-historic), the same one CI
// uses, so a deck builds the same everywhere. --native uses the lualatex on PATH instead.
// --skip-assets reuses slides/generated/ as it is.
import { execFileSync, spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SLIDES = path.join(ROOT, "slides")
const DIST = path.join(ROOT, "dist", "slides")
const IMAGE = "texlive/texlive:TL2025-historic"
const args = process.argv.slice(2)
const native = args.includes("--native")
const slugs = args.filter((a) => !a.startsWith("--"))

const release = JSON.parse(fs.readFileSync(path.join(ROOT, "release.json"), "utf8"))
const decks = release.parts
  .flatMap((p) => p.guides)
  .filter((g) => !slugs.length || slugs.includes(g.slug))
  .map((g) => `${String(g.guide).padStart(2, "0")}-${g.slug}`)
  .filter((name) => fs.existsSync(path.join(SLIDES, "decks", `${name}.tex`)))
if (!decks.length) {
  console.error("no decks to build (slides/decks/NN-<slug>.tex for a released guide)")
  process.exit(2)
}

const python = fs.existsSync(path.join(ROOT, ".venv/bin/python")) ? path.join(ROOT, ".venv/bin/python") : "python3"
if (!args.includes("--skip-assets")) {
  const names = decks.map((d) => d.replace(/^\d+-/, ""))
  execFileSync(python, ["tools/build_slide_assets.py", ...names], { cwd: ROOT, stdio: "inherit" })
  execFileSync("node", ["tools/export-figures.mjs", ...names], { cwd: ROOT, stdio: "inherit" })
}

const build = path.join(SLIDES, "build")
fs.mkdirSync(build, { recursive: true })
fs.mkdirSync(DIST, { recursive: true })
fs.mkdirSync(path.join(SLIDES, ".texcache"), { recursive: true })

// One lualatex run, in slides/ (so generated/ and theme/ resolve), aux files in build/.
function lualatex(job, deck, handout) {
  const opts = handout ? "\\def\\primeropts{handout}" : ""
  const tex = ["-interaction=nonstopmode", "-halt-on-error", "-file-line-error", `-output-directory=build`, `-jobname=${job}`, `${opts}\\input{decks/${deck}.tex}`]
  const env = { TEXINPUTS: ".:./theme//:", TEXMFVAR: native ? undefined : "/work/.texcache" }
  let r
  if (native) {
    r = spawnSync("lualatex", tex, { cwd: SLIDES, encoding: "utf8", env: { ...process.env, TEXINPUTS: env.TEXINPUTS } })
  } else {
    const { uid, gid } = os.userInfo()
    r = spawnSync("docker", ["run", "--rm", "--user", `${uid}:${gid}`, "-v", `${SLIDES}:/work`, "-w", "/work",
      "-e", `TEXINPUTS=${env.TEXINPUTS}`, "-e", `TEXMFVAR=${env.TEXMFVAR}`, "-e", "HOME=/work/.texcache",
      IMAGE, "lualatex", ...tex], { encoding: "utf8" })
  }
  if (r.status !== 0) {
    const log = path.join(build, `${job}.log`)
    const tail = fs.existsSync(log) ? fs.readFileSync(log, "utf8").split("\n").filter((l) => /^(!|.*:\d+:)/.test(l)).slice(0, 12).join("\n") : r.stderr
    throw new Error(`lualatex failed for ${job}\n${tail || r.stdout.slice(-2000)}`)
  }
}

let failed = 0
for (const deck of decks) {
  for (const handout of [false, true]) {
    const job = `${deck}-${handout ? "handout" : "slides"}`
    const t = Date.now()
    try {
      lualatex(job, deck, handout)
      lualatex(job, deck, handout) // second run: frame totals, section numbers, table of contents
      fs.copyFileSync(path.join(build, `${job}.pdf`), path.join(DIST, `${job}.pdf`))
      console.log(`wrote dist/slides/${job}.pdf (${((Date.now() - t) / 1000).toFixed(0)} s)`)
    } catch (e) {
      console.error(e.message)
      failed++
    }
  }
}
process.exit(failed ? 1 : 0)
