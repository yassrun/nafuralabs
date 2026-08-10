"""Compare extracteur vs référence LLM → gaps JSON + markdown."""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EXT = ROOT / "extractor"
LLM = ROOT / "llm"
OUT = ROOT / "compare"

STEMS = ["BDP-2-17", "bdp", "villa-kenitra-xlsx", "villa-kenitra-pdf"]


def fold(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c)).upper()
    return re.sub(r"\s+", " ", s).strip()


def walk(nodes):
    for n in nodes:
        yield n
        yield from walk(n.get("enfants") or [])


def flat_articles(arbre):
    out = []
    path = []

    def rec(nodes, path):
        for n in nodes:
            if n["type"] == "ARTICLE":
                out.append(
                    {
                        "code": n.get("code"),
                        "libelle": n.get("libelle") or "",
                        "unite": n.get("unite"),
                        "quantite": n.get("quantite"),
                        "path": " > ".join(path),
                        "key": key_of(n),
                    }
                )
            else:
                label = (n.get("libelle") or "")[:60]
                rec(n.get("enfants") or [], path + [f"{n['type']}:{label}"])

    rec(arbre, [])
    return out


def key_of(n) -> str:
    code = (n.get("code") or "").strip().lower()
    lib = fold(n.get("libelle") or "")[:80]
    if code:
        return f"c:{code}|{lib[:40]}"
    return f"l:{lib}"


def lots(arbre):
    return [n.get("libelle") or "" for n in arbre if n.get("type") == "LOT"]


def compare_one(stem: str) -> dict:
    ext = json.loads((EXT / f"{stem}.json").read_text(encoding="utf-8"))
    llm = json.loads((LLM / f"{stem}.json").read_text(encoding="utf-8"))
    ea = flat_articles(ext["arbre"])
    la = flat_articles(llm["arbre"])
    emap = {a["key"]: a for a in ea}
    lmap = {a["key"]: a for a in la}

    missing_in_ext = [lmap[k] for k in lmap if k not in emap]
    extra_in_ext = [emap[k] for k in emap if k not in lmap]
    both = [k for k in lmap if k in emap]

    qty_mismatch = []
    unit_mismatch = []
    path_mismatch = []
    for k in both:
        e, l = emap[k], lmap[k]
        if e.get("quantite") != l.get("quantite"):
            qty_mismatch.append({"key": k, "extracteur": e.get("quantite"), "llm": l.get("quantite"), "libelle": l["libelle"][:70]})
        if fold(str(e.get("unite") or "")) != fold(str(l.get("unite") or "")):
            unit_mismatch.append({"key": k, "extracteur": e.get("unite"), "llm": l.get("unite"), "libelle": l["libelle"][:70]})
        # path lot only
        ep = (e.get("path") or "").split(" > ")[0]
        lp = (l.get("path") or "").split(" > ")[0]
        if ep != lp:
            path_mismatch.append({"key": k, "extracteur": ep, "llm": lp, "libelle": l["libelle"][:70]})

    ext_lots = lots(ext["arbre"])
    llm_lots = lots(llm["arbre"])

    return {
        "stem": stem,
        "source": llm.get("source") or ext.get("source"),
        "summary": {
            "extracteur": {k: ext["summary"].get(k) for k in ["lots", "sousLots", "articles", "orphelins", "sansQuantite", "ambigus"]},
            "llm": llm["summary"],
            "deltaArticles": ext["summary"]["articles"] - llm["summary"]["articles"],
            "deltaLots": ext["summary"]["lots"] - llm["summary"]["lots"],
        },
        "lots": {
            "extracteur": ext_lots,
            "llm": llm_lots,
            "missingInExtracteur": [x for x in llm_lots if fold(x) not in {fold(y) for y in ext_lots}],
            "extraInExtracteur": [x for x in ext_lots if fold(x) not in {fold(y) for y in llm_lots}],
        },
        "articles": {
            "matched": len(both),
            "missingInExtracteur": len(missing_in_ext),
            "extraInExtracteur": len(extra_in_ext),
            "qtyMismatch": len(qty_mismatch),
            "unitMismatch": len(unit_mismatch),
            "pathMismatch": len(path_mismatch),
        },
        "samples": {
            "missingInExtracteur": missing_in_ext[:25],
            "extraInExtracteur": extra_in_ext[:25],
            "qtyMismatch": qty_mismatch[:20],
            "unitMismatch": unit_mismatch[:20],
            "pathMismatch": path_mismatch[:20],
        },
    }


def md_report(results: list[dict]) -> str:
    lines = [
        "# Gap-test extraction bordereau",
        "",
        "Comparaison **extracteur** (`bordereau-grid-prototype` v3) vs **référence LLM** (lecture indépendante des dumps).",
        "",
        "## Synthèse",
        "",
        "| Fichier | Lots E/L | Arts E/L | Match | Manquants (ext) | En trop (ext) | Qty≠ | Path≠ |",
        "|---|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for r in results:
        e, l = r["summary"]["extracteur"], r["summary"]["llm"]
        a = r["articles"]
        lines.append(
            f"| `{r['stem']}` | {e['lots']}/{l['lots']} | {e['articles']}/{l['articles']} | "
            f"{a['matched']} | {a['missingInExtracteur']} | {a['extraInExtracteur']} | "
            f"{a['qtyMismatch']} | {a['pathMismatch']} |"
        )

    lines += ["", "## Gaps majeurs par fichier", ""]
    for r in results:
        lines += [f"### `{r['stem']}` — {r['source']}", ""]
        if r["lots"]["missingInExtracteur"]:
            lines.append("**Lots absents de l'extracteur :**")
            for x in r["lots"]["missingInExtracteur"]:
                lines.append(f"- {x}")
            lines.append("")
        if r["lots"]["extraInExtracteur"]:
            lines.append("**Lots en trop / mal découpés côté extracteur :**")
            for x in r["lots"]["extraInExtracteur"]:
                lines.append(f"- {x}")
            lines.append("")
        miss = r["samples"]["missingInExtracteur"]
        if miss:
            lines.append(f"**Articles manquants (extrait, {r['articles']['missingInExtracteur']} total) :**")
            for a in miss[:12]:
                lines.append(f"- `{a.get('code') or '—'}` {a['libelle'][:80]}")
            lines.append("")
        extra = r["samples"]["extraInExtracteur"]
        if extra:
            lines.append(f"**Articles en trop / mal découpés (extrait, {r['articles']['extraInExtracteur']} total) :**")
            for a in extra[:12]:
                lines.append(f"- `{a.get('code') or '—'}` {a['libelle'][:80]}")
            lines.append("")
        if r["samples"]["pathMismatch"]:
            lines.append("**Mauvais rattachement lot (extrait) :**")
            for a in r["samples"]["pathMismatch"][:8]:
                lines.append(f"- {a['libelle'][:50]} — ext=`{a['extracteur']}` vs llm=`{a['llm']}`")
            lines.append("")

    lines += [
        "## Lectures clés",
        "",
        "1. **BDP-2-17** — 9 lots / 186 articles : lots 6 et 7 ouverts à la 1ʳᵉ section `6.1` / `SOUS LOT : 7-`.",
        "2. **Villa Kenitra** — xlsx et PDF à 10 lots ; articles montant-only inclus ; PDF ne promeut plus les sections via signature vide.",
        "3. **bdp.xlsx** — préambule `a/`/`b/` rattaché à `I/` ; folios `IV/n` et TVA écartés.",
        "4. **Reste** — matching article strict code+libellé (faux écarts BDP) ; 1–2 ambigus sur `bdp.xlsx`.",
        "",
    ]
    return "\n".join(lines)


def main():
    import sys

    sys.stdout.reconfigure(encoding="utf-8")
    OUT.mkdir(parents=True, exist_ok=True)
    results = [compare_one(s) for s in STEMS]
    (OUT / "gaps.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    md = md_report(results)
    (OUT / "GAPS.md").write_text(md, encoding="utf-8")
    print(md)
    print("\n→", OUT / "gaps.json")
    print("→", OUT / "GAPS.md")


if __name__ == "__main__":
    main()
