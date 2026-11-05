"""What the lecture slides and the visual guides share when they're checked against a guide: its
numbers, and the glossary terms introduced up to it (tools/check_slides.py, tools/check_visuals.py)."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NUMBER = re.compile(r"(?<![\w.])(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d*\.\d+|\d+)")


def numbers(text):
    """Every number in a text, as floats ("2,000" is 2000; ".594" is 0.594)."""
    out = set()
    for m in NUMBER.finditer(text):
        v = m.group(1).replace(",", "")
        try:
            out.add(float(v))
        except ValueError:
            pass
    return out


def glossary_terms(top):
    """Glossary terms, and their declared synonyms, introduced by Guide `top` or earlier."""
    md = (ROOT / "content" / "appendix" / "glossary.mdx").read_text()
    terms = set()
    for line in md.splitlines():
        if not line.startswith("|") or line.startswith("|---"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 4 or not re.search(r"\d", cells[3]):
            continue
        if int(re.search(r"\d+", cells[3]).group()) > top:
            continue
        terms.add(cells[0].lower())
        terms.add(re.sub(r"\s*\(.*?\)", "", cells[0]).strip().lower())   # "rank (LoRA)" -> "rank"
        for syn in re.split(r"[;,]", cells[2]):
            syn = re.sub(r"\(.*?\)", "", syn).strip().lower()
            if syn and syn != "—":
                terms.add(syn)
    return terms


def term_ok(t, terms):
    t = re.sub(r"\\[a-z]+\{?|[{}$]", "", t).strip().lower()
    cands = {t, t.rstrip("s"), re.sub(r"\s*\(.*?\)", "", t)}
    return any(c in terms for c in cands)
