"""One-shot DeepSeek bordereau extraction → JSON trees in this folder."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
ENV = REPO / "secrets" / "dev-staging-local.env"

INSTRUCTIONS = """Tu copies un bordereau de prix BTP. Tu n'interpretes pas, tu n'embellis pas.

SORTIE — un seul JSON :
{ "lots": [ { "code", "libelle", "children": [ ...meme forme... ], "postes": [ { "code", "libelle", "unite", "quantite" } ] } ] }
children peut s'imbriquer sans limite. postes = feuilles chiffrables.

LOTS RACINES — uniquement les tetes de lot du marche, exemples :
- "1- TERRASSEMENT - GROS-OEUVRE", "3- ELECTRICITE", "08-PEINTURE"
- "100-Gros-oeuvres", "200-ETANCHEITE"
Un article (101, 112, 132, 3.1.1, 2.2.5) n'est JAMAIS un lot, meme s'il est en haut de page.
Apres un saut de page, tu RESTES dans le lot courant jusqu'au prochain VRAI lot.
"LOT N 1 : GROS OEUVRE / ETANCHEITE" qui enveloppe 100- et 200- n'est PAS un lot racine.

CHILDREN (groupes sous un lot)
- Chapitre lettre A- / B- (porte les sections 3.1, 3.2...).
- Section numerotee sans mesure (1-1, 3.1, 3.3, 6.2).
- Parent de variantes SANS quantite propre (109, 112, 113, 119, 121, 122) : child du lot, pas un lot.
- Bandeau sans numero ("CABLES U1000 RO2V") : child SANS code sous la section courante.
- SOUS LOT N x : child du lot, pas un nouveau lot racine.

POSTES
- Ligne AVEC unite et/ou quantite (y compris 0 ou negatif).
- Variante a) b) c) / A- / B- chiffree = poste du parent-child.
- Article simple (101, 132, 201) = poste du lot (ou de la section), PAS un lot a un seul poste.
- 109 lui-meme n'est pas un poste s'il n'a pas de quantite : child + postes 109A / 109B.

INTERDIT
- Inventer un parent absent du PDF (pas de "3.7 APPAREILLAGE" si le texte va de 3.6.5 a 3.7.1).
- Dupliquer un code (pas deux noeuds "3.3").
- Extraire PU, montants, totaux, TVA, en-tetes, titres de marche, pieds de page.
- Un tableau "lots" avec des dizaines d'articles = ECHEC. IBRAFROID = 2 lots (100, 200). BDP-2-17 = 9 lots (1...9).

COMPLETUDE : tous les postes. Libelle complet depuis le debut.

UNITES uniquement : M3, M2, ML, KG, T, U, FF, H, J, L, ENS, E
m3->M3 ; m2->M2 ; ml->ML ; kg->KG ; u/unite->U ; ens/ensemble->ENS (E seulement si le doc ecrit E).
quantite = nombre. Conserve les negatifs.

CODES : recopie le document. Variante a sous 112 -> "112a". N'invente rien d'autre."""


def read_key() -> str:
    for line in ENV.read_text(encoding="utf-8").splitlines():
        if line.startswith("AI_DEEPSEEK_API_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("AI_DEEPSEEK_API_KEY missing in secrets/dev-staging-local.env")


def pdf_text(path: Path) -> str:
    reader = PdfReader(str(path))
    pages = []
    for i, page in enumerate(reader.pages, 1):
        t = page.extract_text() or ""
        pages.append(f"\n\n===== PAGE {i}/{len(reader.pages)} =====\n{t}")
    return "".join(pages)


def extract(pdf: Path, out: Path) -> None:
    key = read_key()
    text = pdf_text(pdf)
    payload = {
        "model": "deepseek-v4-flash",
        "messages": [
            {"role": "system", "content": INSTRUCTIONS},
            {
                "role": "user",
                "content": "Extrais le bordereau complet ci-dessous en JSON.\n" + text,
            },
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0,
        "max_tokens": 65536,
        "thinking": {"type": "disabled"},
    }
    req = urllib.request.Request(
        "https://api.deepseek.com/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": "Bearer " + key,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            chunks = []
            while True:
                block = resp.read(65536)
                if not block:
                    break
                chunks.append(block)
            raw = b"".join(chunks).decode("utf-8")
            body = json.loads(raw)
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")
        raise SystemExit(f"HTTP {e.code} {err[:2000]}") from e

    msg = body["choices"][0]["message"].get("content") or ""
    if not msg.strip():
        raise SystemExit(
            f"empty content finish={body['choices'][0].get('finish_reason')} usage={body.get('usage')}"
        )
    tree = json.loads(msg)
    usage = body.get("usage") or {}
    tree["_meta"] = {
        "source": pdf.name,
        "model": body.get("model"),
        "finish_reason": body["choices"][0].get("finish_reason"),
        "usage": usage,
    }
    out.write_text(json.dumps(tree, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"wrote {out.name} lots={len(tree.get('lots') or [])} "
        f"finish={tree['_meta']['finish_reason']} usage={usage}",
        flush=True,
    )


def main() -> None:
    name = sys.argv[1]
    pdf = ROOT / name
    stem = pdf.stem.replace(" ", "-")
    extract(pdf, ROOT / f"{stem}.tree.json")


if __name__ == "__main__":
    main()
