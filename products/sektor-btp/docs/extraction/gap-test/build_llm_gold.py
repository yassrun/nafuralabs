"""Référence LLM v2 — extraction indépendante calibrée sur lecture des dumps."""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

RAW = Path(__file__).resolve().parent / "raw"
OUT = Path(__file__).resolve().parent / "llm"

NUM = re.compile(r"^-?[\d\s\u00a0]{1,15}(?:[.,]\d+)?$")
TOTAL = re.compile(r"\b(TOTAL|TOTAUX|RECAPITULATION|RÉCAPITULATION|RÉCAPITULATIF|RECAPITULATIF|REPORT)\b", re.I)
HEADER = re.compile(r"^(N°|N °|N° PRIX|DESIGNATION|DÉSIGNATION|UNITE|UNITÉ|QUANTITE|QUANTITÉ|PRIX)", re.I)
MEASURE = re.compile(r"^(LE|LA|L')\s", re.I)
LOT_VILLA = re.compile(r"^LOT\s*(\d+)\s*[:\-]", re.I)
ROMAN_LOT = re.compile(r"^([IVX]{1,5})\s*/\s*[-–]?\s*(.*)$", re.I)
LETTER_SOUS = re.compile(r"^([a-z])\s*/\s*[-–]?\s*(.*)$", re.I)
ART_BDP = re.compile(r"^([a-z])\s*/\s*(\d+)$", re.I)


def fold(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    return "".join(c for c in s if not unicodedata.combining(c)).upper().strip()


def norm_unit(v) -> str | None:
    if v is None or v == "":
        return None
    v = unicodedata.normalize("NFKC", str(v)).strip()
    if v in ("-", "–", "—"):
        return None
    return v if 0 < len(v) <= 8 else None


def to_qty(v) -> float | None:
    """Accepte 350,00 / 5 600 / 45.000,00 (milliers FR)."""
    if v is None or v == "":
        return None
    s = str(v).replace("\u00a0", "").replace(" ", "")
    if s in ("-", "–", "—"):
        return None
    # 45.000,00 → 45000.00 ; 350,00 → 350.00 ; 5600.00 → 5600
    if re.match(r"^-?\d{1,3}(\.\d{3})+(,\d+)?$", s):
        s = s.replace(".", "").replace(",", ".")
    elif "," in s and "." not in s:
        s = s.replace(",", ".")
    elif re.match(r"^-?\d+\.\d{3}$", s) and s.count(".") == 1:
        # ambigu : laisser float classique (350.000 pourrait être milliers)
        pass
    if not re.match(r"^-?\d+(?:\.\d+)?$", s):
        return None
    try:
        n = float(s)
    except ValueError:
        return None
    return n if n > 0 else None


def any_number(cells) -> bool:
    return any(to_qty(c) is not None for c in cells)


def node(typ, code, libelle, unite=None, quantite=None, page="", enfants=None):
    return {
        "type": typ,
        "code": code,
        "libelle": libelle,
        "unite": unite,
        "quantite": quantite,
        "page": page,
        "enfants": enfants or [],
    }


def walk(nodes):
    for n in nodes:
        yield n
        yield from walk(n["enfants"])


def summarize(arbre):
    lots = sous = arts = orph = sans_q = 0
    for n in walk(arbre):
        if n["type"] == "LOT":
            lots += 1
            if n["libelle"] in ("Sans lot", "Préambule (avant I/)"):
                orph += sum(1 for x in walk(n["enfants"]) if x["type"] == "ARTICLE")
        elif n["type"] == "SOUS_LOT":
            sous += 1
        elif n["type"] == "ARTICLE":
            arts += 1
            if n["quantite"] is None:
                sans_q += 1
    return {"lots": lots, "sousLots": sous, "articles": arts, "orphelins": orph, "sansQuantite": sans_q}


def load_rows(stem: str):
    return json.loads((RAW / f"{stem}.rows.json").read_text(encoding="utf-8"))


def prune_empty_groups(nodes):
    out = []
    for n in nodes:
        if n["type"] == "ARTICLE":
            out.append(n)
            continue
        n["enfants"] = prune_empty_groups(n["enfants"])
        if n["enfants"]:
            out.append(n)
    return out


def save(stem: str, source: str, notes: str, arbre: list) -> None:
    arbre = prune_empty_groups(arbre)
    OUT.mkdir(parents=True, exist_ok=True)
    payload = {
        "source": source,
        "stem": stem,
        "pipeline": "llm-reference-v2",
        "notes": notes,
        "summary": summarize(arbre),
        "arbre": arbre,
    }
    (OUT / f"{stem}.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    s = payload["summary"]
    print(
        f"  {stem}: lots={s['lots']} sous={s['sousLots']} arts={s['articles']} "
        f"orph={s['orphelins']} sans_q={s['sansQuantite']}"
    )


def next_meaningful(rows, i):
    j = i + 1
    while j < len(rows):
        cells = rows[j]["cells"]
        if any(str(c).strip() for c in cells if c is not None):
            return j, rows[j]
        j += 1
    return None, None


# ─── BDP-2-17 ────────────────────────────────────────────────────────────────

def extract_bdp_217():
    rows = load_rows("BDP-2-17")
    arbre, lot, sous = [], None, None
    pending = None  # (code, lib)

    def open_lot(lib, code, page):
        nonlocal lot, sous
        lot = node("LOT", code, lib, page=page)
        arbre.append(lot)
        sous = None

    def open_sous(lib, code, page):
        nonlocal sous, lot
        if lot is None:
            open_lot("Sans lot", None, page)
        sous = node("SOUS_LOT", code, lib, page=page)
        lot["enfants"].append(sous)

    def add_art(code, lib, unite, qty, page):
        parent = sous or lot
        if parent is None:
            open_lot("Sans lot", None, page)
            parent = lot
        if unite in ("Ens", "E", "FF", "F") and qty is None:
            qty = 1.0
        # ignore bogus measure-only libs
        if MEASURE.match(lib or "") and len(lib) < 24:
            return
        parent["enfants"].append(node("ARTICLE", code, lib, unite, qty, page))

    def lot_num(lib):
        m = re.match(r"^0?(\d+)", lib or "")
        return m.group(1) if m else None

    for i, r in enumerate(rows):
        cells = [(c or "").strip() if not isinstance(c, (int, float)) else str(c) for c in r["cells"]]
        page = r["page"]
        code = cells[0] if cells else ""
        des = cells[1] if len(cells) > 1 else ""
        unite = norm_unit(cells[2] if len(cells) > 2 else "")
        qty = to_qty(cells[3] if len(cells) > 3 else "")

        if not any(cells):
            continue
        blob = des or code
        if HEADER.match(blob) or fold(blob).startswith("TRAVAUX DE CONSTRUCTION"):
            continue
        if TOTAL.search(blob) and not (code and re.match(r"^\d", code)):
            pending = None
            continue

        # measure line
        if MEASURE.match(des) and (unite or qty is not None):
            if pending:
                add_art(pending[0], pending[1], unite, qty, page)
                pending = None
            continue

        # LOT: designation with single major index, empty code
        if not code and des:
            # explicit SOUS LOT : 7-
            m = re.match(r"^SOUS\s*LOT\s*:\s*(\d+)\s*[-–]\s*(.+)$", des, re.I)
            if m:
                open_lot(f"{m.group(1)}-{m.group(2).strip()}", m.group(1), page)
                pending = None
                continue
            # 1 -TERRASSEMENT / 5- FAUX / 08-PEINTURE / 9 - CHAMBRES / 2-CHARPENTE
            if re.match(r"^0?\d+\s*[-–]", des) and not re.match(r"^0?\d+[-.]\d+", des):
                open_lot(des, re.match(r"^(0?\d+)", des).group(1), page)
                pending = None
                continue
            # section 6.1 / 6.2 / 7.1 in designation only → ensure parent lot + sous
            m = re.match(r"^(0?\d+)[.\-](\d+)\s*[-–.]?\s*(.*)$", des)
            if m and not re.match(r"^\d+[.\-]\d+[.\-]\d+", des):
                major = str(int(m.group(1)))
                if lot is None or lot_num(lot["libelle"]) != major:
                    # invent lot title from first section
                    open_lot(f"{major} - (section {m.group(1)}.{m.group(2)})", major, page)
                label = des
                open_sous(label, f"{m.group(1)}.{m.group(2)}", page)
                pending = None
                continue

        # ARTICLE head: code in col0 with 2+ levels OR single variant letter
        if code and re.match(r"^\d+(?:[.-]\d+)+$", code):
            # 2-level codes are articles if next row is measure OR same row has U/Q
            nj, nxt = next_meaningful(rows, i)
            nxt_des = (nxt["cells"][1] if nxt and len(nxt["cells"]) > 1 else "") or ""
            nxt_u = norm_unit(nxt["cells"][2] if nxt and len(nxt["cells"]) > 2 else "")
            nxt_q = to_qty(nxt["cells"][3] if nxt and len(nxt["cells"]) > 3 else "")
            is_head = MEASURE.match(nxt_des) or nxt_u or nxt_q is not None
            if unite or qty is not None:
                add_art(code, des, unite, qty, page)
                pending = None
            elif is_head:
                pending = (code, des)
            else:
                # rare: code-looking section
                open_sous(f"{code} {des}".strip(), code, page)
                pending = None
            continue

        if code and re.match(r"^[a-z]$", code, re.I):
            lib = des
            if pending and str(pending[1]).rstrip().endswith(":"):
                lib = f"{pending[1]} {des}".strip()
            nj, nxt = next_meaningful(rows, i)
            nxt_des = (nxt["cells"][1] if nxt and len(nxt["cells"]) > 1 else "") or ""
            if unite or qty is not None:
                add_art(code.lower(), lib, unite, qty, page)
                pending = None
            elif MEASURE.match(nxt_des):
                pending = (code.lower(), lib)
            else:
                pending = (code.lower(), lib)
            continue

        # article without code but with U/Q
        if (unite or qty is not None) and des and not MEASURE.match(des):
            add_art(code or None, des, unite, qty, page)
            pending = None

    save(
        "BDP-2-17",
        "BDP-2-17.pdf",
        "Lots 1-9 ; 5.1/5.2 = articles (lookahead mesure) ; 6.1/7.1 ouvrent lot si absent ; variantes a/b/c.",
        arbre,
    )


# ─── Villa ───────────────────────────────────────────────────────────────────

def extract_villa(stem: str, source: str, prefer_merged_lots: bool):
    rows = load_rows(stem)
    arbre, lot, sous = [], None, None
    seen = set()

    def open_lot(lib, num, page):
        nonlocal lot, sous
        if num in seen:
            return False
        seen.add(num)
        lot = node("LOT", str(num), lib, page=page)
        arbre.append(lot)
        sous = None
        return True

    def open_sous(lib, page):
        nonlocal sous, lot
        if lot is None:
            open_lot("Sans lot", 0, page)
        sous = node("SOUS_LOT", None, lib, page=page)
        lot["enfants"].append(sous)

    def add_art(code, lib, unite, qty, page):
        parent = sous or lot
        if parent is None:
            open_lot("Sans lot", 0, page)
            parent = lot
        if unite in ("Ens", "E", "FF", "F") and qty is None:
            qty = 1.0
        parent["enfants"].append(node("ARTICLE", code or None, lib, unite, qty, page))

    for r in rows:
        cells = [
            (c.replace("\xa0", " ").strip() if isinstance(c, str) else ("" if c is None else str(c).strip()))
            for c in r["cells"]
        ]
        page = r["page"]
        if not any(cells):
            continue
        blob = " ".join(c for c in cells if c)
        if HEADER.match(blob) or blob.upper().startswith("PROJET") or "BORDEREAU DES PRIX" in blob.upper():
            continue
        if re.search(r"R[ÉE]CAPITULATIF", blob, re.I):
            break
        if TOTAL.search(blob) and LOT_VILLA.search(blob) is None:
            # pure total line
            if not re.match(r"^\d+(\.\d+)?$", cells[0] or ""):
                continue

        lot_cell = next((c for c in cells if LOT_VILLA.match(c)), None)
        if lot_cell:
            m = LOT_VILLA.match(lot_cell)
            num = int(m.group(1))
            # récap: LOT + montant only, after lots already seen
            if num in seen and r.get("size", 0) >= 14 and not r.get("merged"):
                break
            if prefer_merged_lots:
                if r.get("merged") and r.get("size", 0) >= 14:
                    open_lot(lot_cell, num, page)
                    continue
                if r.get("size", 0) >= 14 and not any_number(cells[1:]):
                    open_lot(lot_cell, num, page)
                    continue
            else:
                unite = norm_unit(cells[2] if len(cells) > 2 else "")
                qty = to_qty(cells[3] if len(cells) > 3 else "")
                if unite is None and qty is None:
                    open_lot(lot_cell, num, page)
                    continue

        code = cells[0] if cells else ""
        des = cells[1] if len(cells) > 1 else ""
        unite = norm_unit(cells[2] if len(cells) > 2 else "")
        qty = to_qty(cells[3] if len(cells) > 3 else "")

        if not des and code and not LOT_VILLA.match(code) and not re.match(r"^\d+(\.\d+)*$", code):
            des, code = code, ""

        # article: U/Q present OR coded N.N with a number somewhere (PU/montant only)
        coded = bool(re.match(r"^\d+(\.\d+)+$", code or ""))
        if unite is not None or qty is not None or (coded and any_number(cells[1:])):
            lib = des or next((c for c in cells[1:] if c and norm_unit(c) is None and to_qty(c) is None), "")
            if not lib or TOTAL.search(lib):
                continue
            c = code if code and not LOT_VILLA.match(code) else None
            # if only PU present, qty stays None (manque source)
            add_art(c, lib, unite, qty, page)
            continue

        # sous-lot / section banner
        title = des or (code if code and not coded else "")
        if title and not TOTAL.search(title) and len(title) > 2:
            if coded and des and not any_number(cells):
                open_sous(f"{code} {des}".strip(), page)
            elif not coded:
                open_sous(title, page)

    save(
        stem,
        source,
        "10 lots Villa ; stop au Récapitulatif ; article si U/Q ou code N.N + montant ; xlsx lots=merged 14.5pt.",
        arbre,
    )


# ─── bdp.xlsx ────────────────────────────────────────────────────────────────

def extract_bdp_xlsx():
    rows = load_rows("bdp")
    arbre, lot, sous = [], None, None
    pending = None
    opened_romans = set()

    def open_lot(lib, code, page):
        nonlocal lot, sous
        lot = node("LOT", code, lib, page=page)
        arbre.append(lot)
        sous = None

    def open_sous(lib, code, page):
        nonlocal sous, lot
        if lot is None:
            open_lot("Préambule (avant I/)", None, page)
        sous = node("SOUS_LOT", code, lib, page=page)
        lot["enfants"].append(sous)

    def add_art(code, lib, unite, qty, page):
        parent = sous or lot
        if parent is None:
            open_lot("Préambule (avant I/)", None, page)
            parent = lot
        if unite in ("Ens", "E", "FF", "F") and qty is None:
            qty = 1.0
        if MEASURE.match(lib or "") and len(lib) < 24:
            return
        parent["enfants"].append(node("ARTICLE", code, lib, unite, qty, page))

    for r in rows:
        cells = [
            (c.strip() if isinstance(c, str) else ("" if c is None else str(c).strip()))
            for c in r["cells"]
        ]
        page = r["page"]
        candidates = [c for c in cells if c]
        if not candidates:
            continue
        blob = " | ".join(candidates)
        if HEADER.search(blob) or "PRIX EN TOUTES LETTRES" in fold(blob):
            continue
        if re.search(r"R[ÉE]CAPITULATION", blob, re.I):
            pending = None
            continue
        if re.search(r"\bT\.?V\.?A\.?\b", blob, re.I):
            continue
        if TOTAL.search(blob) and not ART_BDP.search(blob):
            pending = None
            continue

        code = cells[2] if len(cells) > 2 else ""
        des = cells[3] if len(cells) > 3 else ""
        unite = norm_unit(cells[4] if len(cells) > 4 else "")
        qty = to_qty(cells[5] if len(cells) > 5 else "")

        # roman lot (large title)
        roman_hit = None
        for c in candidates:
            m = ROMAN_LOT.match(c)
            if m and r.get("size", 0) >= 16:
                roman_hit = (c, m.group(1).upper())
                break
        if roman_hit:
            lib, key = roman_hit
            if key in opened_romans:
                continue  # page reprint
            opened_romans.add(key)
            open_lot(lib, key, page)
            pending = None
            continue

        # letter section a/ b/
        section_hit = None
        for c in candidates:
            if ART_BDP.match(c):
                continue
            m = LETTER_SOUS.match(c)
            if m and unite is None and qty is None and not MEASURE.match(c):
                section_hit = (c, m.group(1).lower())
                break
        if section_hit and not ART_BDP.match(code):
            # also in col1 sometimes: Code OP | a | TERRASSEMENTS
            open_sous(section_hit[0], section_hit[1], page)
            pending = None
            # if this row is ONLY the section, continue
            if not ART_BDP.match(code) and (not des or LETTER_SOUS.match(des) or des == section_hit[0]):
                continue

        # special: col1 letter section "a" + label in col2 without slash
        if len(cells) > 2 and re.match(r"^[a-z]$", cells[1] or "", re.I) and cells[2] and not ART_BDP.match(cells[2]):
            if unite is None and qty is None and r.get("size", 0) <= 11:
                open_sous(f"{cells[1]}/ - {cells[2]}", cells[1].lower(), page)
                pending = None
                continue

        if MEASURE.match(des) and (unite or qty is not None):
            if pending:
                add_art(pending[0], pending[1], unite, qty, page)
                pending = None
            continue

        art_code = None
        art_lib = des
        if ART_BDP.match(code):
            art_code = re.sub(r"\s+", "", code)
        elif ART_BDP.match(des):
            art_code = re.sub(r"\s+", "", des)
            art_lib = ""
        # code in col2 style already; sometimes a/1 is only in candidates
        if not art_code:
            for c in candidates:
                if ART_BDP.match(c):
                    art_code = re.sub(r"\s+", "", c)
                    art_lib = next(
                        (
                            x
                            for x in candidates
                            if x != c and not MEASURE.match(x) and norm_unit(x) is None and not NUM.match(x) and not LETTER_SOUS.match(x)
                        ),
                        c,
                    )
                    break

        if art_code:
            if not art_lib:
                art_lib = next(
                    (
                        c
                        for c in cells[3:]
                        if c and not MEASURE.match(c) and norm_unit(c) is None and not NUM.match(c)
                    ),
                    art_code,
                )
            if unite or qty is not None:
                add_art(art_code, art_lib, unite, qty, page)
                pending = None
            else:
                pending = (art_code, art_lib)
            continue

        if re.match(r"^[a-z]$", code, re.I) and des:
            pending = (code.lower(), des)
            continue

        if pending and (unite or qty is not None):
            if MEASURE.match(des) or unite:
                add_art(pending[0], pending[1], unite, qty, page)
                pending = None

    save(
        "bdp",
        "bdp.xlsx",
        "I/, II/ = lots (ignore reprints) ; a/, b/ = sous-lots ; a/1 + mesure ; skip récap/TVA.",
        arbre,
    )


def main():
    import sys

    sys.stdout.reconfigure(encoding="utf-8")
    print("LLM REFERENCE v2\n")
    extract_bdp_217()
    extract_villa("villa-kenitra-xlsx", "BPDE Villa Kenitra.xlsx", True)
    extract_villa("villa-kenitra-pdf", "BPDE Villa Kenitra.pdf", False)
    extract_bdp_xlsx()
    print("\nOK →", OUT)


if __name__ == "__main__":
    main()
