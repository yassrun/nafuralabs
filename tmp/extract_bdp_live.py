#!/usr/bin/env python3
"""Live BDP extraction against DeepSeek (text page/page) for BDP-2-17.pdf."""
from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.request
from pathlib import Path

PDF = Path(r"C:\Users\yassiveco\Desktop\zenit\BDP-2-17.pdf")
ENV = Path(r"C:\Users\yassiveco\Desktop\Nafura Platform\nafuralabs\secrets\dev-staging-local.env")
OUT = Path(r"C:\Users\yassiveco\Desktop\Nafura Platform\nafuralabs\tmp\bdp_extract_result.json")

SCHEMA = {
    "type": "object",
    "properties": {
        "groups": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "code": {"type": "string"},
                    "libelle": {"type": "string"},
                    "kind": {"type": "string"},
                },
                "required": ["libelle"],
            },
        },
        "articles": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "code": {"type": "string"},
                    "libelle": {"type": "string"},
                    "unite": {"type": "string"},
                    "quantite": {"type": "number"},
                    "page": {"type": "integer"},
                },
                "required": ["libelle"],
            },
        },
    },
    "required": ["articles"],
}


def load_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def pdf_pages_text(pdf_path: Path) -> list[str]:
    try:
        from pypdf import PdfReader
    except ImportError:
        os.system(f'"{sys.executable}" -m pip install pypdf -q')
        from pypdf import PdfReader

    reader = PdfReader(str(pdf_path))
    pages: list[str] = []
    for i, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        pages.append(text)
        print(f"[pdf] page {i}/{len(reader.pages)} chars={len(text)}")
    return pages


def deepseek_extract(api_key: str, model: str, page_no: int, page_text: str) -> dict:
    instructions = f"""Tu lis le TEXTE de la page {page_no} d'un bordereau de prix BTP (tableau).
Extrais TOUTES les lignes : groups (LOT / SOUS_LOT / SECTION) et articles.
Pour chaque article : code, libellé COMPLET depuis le DÉBUT de la cellule
(ex. « FOUILLES EN PUITS ET EN TRANCHEES… », jamais un fragment
« TRANCHEERS… » / « PUBLIQUES… »), unité, quantité, page={page_no}.
Conserve les multi-lignes de désignation en un seul libellé.
N'invente aucune valeur. Ignore PU, montants, totaux et en-têtes marché.
Réponds UNIQUEMENT en JSON valide."""
    body = {
        "model": model,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": instructions + "\nSchema:\n" + json.dumps(SCHEMA)},
            {"role": "user", "content": f"PAGE {page_no}:\n{page_text[:20000]}"},
        ],
    }
    last_err: Exception | None = None
    for attempt in range(1, 5):
        try:
            req = urllib.request.Request(
                "https://api.deepseek.com/chat/completions",
                data=json.dumps(body).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=180) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            content = payload["choices"][0]["message"]["content"]
            return json.loads(content)
        except Exception as ex:  # noqa: BLE001
            last_err = ex
            wait = min(2 ** attempt, 20)
            print(f"[llm] page {page_no} attempt {attempt} failed: {ex}; sleep {wait}s")
            time.sleep(wait)
    raise RuntimeError(f"page {page_no} failed after retries: {last_err}")


def main() -> int:
    if not PDF.exists():
        print("PDF missing:", PDF)
        return 2
    env = load_env(ENV)
    api_key = env.get("AI_DEEPSEEK_API_KEY") or os.environ.get("AI_DEEPSEEK_API_KEY")
    model = env.get("AI_DEEPSEEK_MODEL") or "deepseek-v4-flash"
    if not api_key:
        print("No AI_DEEPSEEK_API_KEY")
        return 2

    pages = pdf_pages_text(PDF)
    all_articles: list[dict] = []
    all_groups: list[dict] = []
    t0 = time.time()
    for i, text in enumerate(pages, start=1):
        print(f"[llm] page {i}/{len(pages)}…")
        data = deepseek_extract(api_key, model, i, text)
        arts = data.get("articles") or []
        grps = data.get("groups") or []
        print(f"[llm] page {i} -> {len(arts)} articles, {len(grps)} groups")
        for a in arts:
            a.setdefault("page", i)
            all_articles.append(a)
        all_groups.extend(grps)

    # Dedupe by code
    by_code: dict[str, dict] = {}
    for a in all_articles:
        code = (a.get("code") or "").strip().upper().replace(" ", "")
        if not code:
            continue
        prev = by_code.get(code)
        lib = (a.get("libelle") or "").strip()
        if prev is None or len(lib) > len((prev.get("libelle") or "")):
            by_code[code] = a

    articles = list(by_code.values())
    articles.sort(key=lambda a: a.get("code") or "")

    result = {
        "pages": len(pages),
        "articleCount": len(articles),
        "groupCount": len(all_groups),
        "elapsedSec": round(time.time() - t0, 1),
        "articles": articles,
        "groups": all_groups,
    }
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Wrote", OUT)

    a111 = by_code.get("1-1-1") or by_code.get("1.1.1")
    print("--- CHECK 1-1-1 ---")
    print(json.dumps(a111, ensure_ascii=False, indent=2))
    ok = (
        a111 is not None
        and "FOUILLES" in (a111.get("libelle") or "").upper()
        and "PUITS" in (a111.get("libelle") or "").upper()
        and len(articles) >= 100
    )
    print("PERFECT" if ok else "NOT_PERFECT", f"articles={len(articles)}")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
