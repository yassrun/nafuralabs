"""Exporte l'arbre du prototype déterministe pour les 4 BDP du dossier BDP/."""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]  # nafuralabs
BDP_DIR = ROOT / "BDP"
OUT_EXT = Path(__file__).resolve().parent / "extractor"
OUT_RAW = Path(__file__).resolve().parent / "raw"
PROTO = Path(__file__).resolve().parents[1] / "bordereau-grid-prototype.py"

FILES = [
    ("BDP-2-17.pdf", "BDP-2-17", "pdf"),
    ("bdp.xlsx", "bdp", "xlsx"),
    ("BPDE - LOT SECONDAIRES -OPERATION VILLA KENITRA  indice 23032026  .xlsx", "villa-kenitra-xlsx", "xlsx"),
    ("BPDE - LOT SECONDAIRES -OPERATION VILLA KENITRA  indice 23032026  .pdf", "villa-kenitra-pdf", "pdf"),
]


def load_proto():
    spec = importlib.util.spec_from_file_location("bordereau_grid_prototype", PROTO)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod


def node_to_dict(n) -> dict:
    return {
        "type": n.kind,
        "code": n.code,
        "libelle": n.libelle,
        "unite": n.unite,
        "quantite": n.quantite,
        "page": n.page,
        "enfants": [node_to_dict(c) for c in n.children],
    }


def walk(nodes):
    for n in nodes:
        yield n
        yield from walk(n.children)


def summarize(tree) -> dict:
    lots = sous = arts = orph = sans_q = 0
    for n in walk(tree):
        if n.kind == "LOT":
            lots += 1
            if n.libelle == "Sans lot":
                orph += sum(1 for _ in walk(n.children) if _.kind == "ARTICLE")
        elif n.kind == "SOUS_LOT":
            sous += 1
        elif n.kind == "ARTICLE":
            arts += 1
            if n.quantite is None:
                sans_q += 1
    return {
        "lots": lots,
        "sousLots": sous,
        "articles": arts,
        "orphelins": orph,
        "sansQuantite": sans_q,
    }


def dump_raw(mod, path: Path, stem: str, kind: str) -> None:
    loader = mod.rows_pdf if kind == "pdf" else mod.rows_xlsx
    rows = loader(str(path))
    payload = []
    for r in rows:
        payload.append(
            {
                "page": r.page,
                "idx": r.idx,
                "fill": r.fill,
                "size": r.size,
                "bold": r.bold,
                "merged": r.merged,
                "cells": r.cells,
            }
        )
    out = OUT_RAW / f"{stem}.rows.json"
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    # vue TSV compacte pour lecture LLM
    lines = []
    for r in rows:
        cells = "\t".join((c or "").replace("\t", " ") for c in r.cells)
        meta = f"merged={int(r.merged)} size={r.size} bold={int(r.bold)} fill={r.fill}"
        lines.append(f"{r.page}\t{r.idx}\t{meta}\t{cells}")
    (OUT_RAW / f"{stem}.rows.tsv").write_text("\n".join(lines), encoding="utf-8")
    print(f"  raw {stem}: {len(rows)} rows → {out.name}")


def extract_one(mod, path: Path, stem: str, kind: str) -> dict:
    loader = mod.rows_pdf if kind == "pdf" else mod.rows_xlsx
    rows = loader(str(path))
    cols, header_at = mod.map_columns(rows)
    body, kinds, cols, ambigu = mod.classify(rows, cols, header_at)
    tree = mod.build(body, kinds, cols)
    summary = summarize(tree)
    summary["ambigus"] = ambigu
    summary["colonnes"] = cols
    summary["headerAt"] = header_at
    payload = {
        "source": path.name,
        "stem": stem,
        "pipeline": "bordereau-grid-prototype-v3",
        "summary": summary,
        "arbre": [node_to_dict(n) for n in tree],
    }
    out = OUT_EXT / f"{stem}.json"
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    s = summary
    print(
        f"  {stem}: lots={s['lots']} sous={s['sousLots']} arts={s['articles']} "
        f"orph={s['orphelins']} ambigu={s['ambigus']} sans_q={s['sansQuantite']}"
    )
    return payload


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    OUT_EXT.mkdir(parents=True, exist_ok=True)
    OUT_RAW.mkdir(parents=True, exist_ok=True)
    mod = load_proto()
    print("EXTRACTEUR — prototype v3 sur BDP/\n")
    missing = []
    for fname, stem, kind in FILES:
        path = BDP_DIR / fname
        if not path.exists():
            missing.append(fname)
            print(f"  MISSING {fname}")
            continue
        dump_raw(mod, path, stem, kind)
        extract_one(mod, path, stem, kind)
    if missing:
        print(f"\nFichiers manquants: {missing}")
        return 1
    print("\nOK →", OUT_EXT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
