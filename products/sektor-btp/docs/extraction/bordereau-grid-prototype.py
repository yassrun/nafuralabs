"""Prototype v3 — classifieur de hiérarchie à deux passes.

Idée : aucune règle fixe ne marche sur les trois fichiers, mais chaque fichier
est cohérent avec lui-même. On apprend donc sa grammaire avant de classer.

  passe 1  ancres   — les lignes indiscutables (LOT en toutes lettres, ligne
                      portant unité + quantité)
  passe 2  signature— fond, taille, casse, colonne, propres à CE document
  passe 3  reste    — classé par proximité à la signature apprise
  passe 4  arbre    — rang par mot-clé, sinon profondeur du code, sinon taille
"""
import re
import sys
import unicodedata
from collections import Counter
from dataclasses import dataclass, field

sys.stdout.reconfigure(encoding="utf-8")

# ─── modèle ─────────────────────────────────────────────────────────────────

@dataclass
class Row:
    page: str
    idx: int
    cells: list
    fill: str = ""
    size: float = 0.0
    bold: bool = False
    merged: bool = False


@dataclass
class Node:
    kind: str                      # LOT | SOUS_LOT | ARTICLE
    code: str | None
    libelle: str
    unite: str | None = None
    quantite: float | None = None
    page: str = ""
    children: list = field(default_factory=list)


# ─── sources ────────────────────────────────────────────────────────────────

def rows_xlsx(path):
    import openpyxl

    # deux lectures : data_only pour les valeurs calculées, l'autre pour les styles
    wv = openpyxl.load_workbook(path, data_only=True)
    ws_ = openpyxl.load_workbook(path)
    out = []
    for ws, wsv in zip(ws_.worksheets, wv.worksheets):
        # Une ligne fusionnée est structurelle : c'est ainsi que Villa Kenitra
        # marque ses lots et sous-lots.
        merged_rows = {rg.min_row for rg in ws.merged_cells.ranges if rg.min_col <= 2}
        for i, row in enumerate(ws.iter_rows(), 1):
            vals = next(wsv.iter_rows(min_row=i, max_row=i))
            cells = ["" if v.value is None else str(v.value).replace("\n", " ").strip()
                     for v in vals]
            if not any(cells):
                continue
            j = next((k for k, v in enumerate(cells) if v), 0)
            c = row[j] if j < len(row) else row[0]
            fg = c.fill.fgColor if c.fill else None
            fill = ""
            if fg is not None and fg.type == "rgb" and fg.rgb not in ("00000000", None):
                fill = str(fg.rgb)
            out.append(Row(ws.title, i, cells, fill, float(c.font.sz or 0),
                           bool(c.font.b), i in merged_rows))
    return out


def rows_pdf(path):
    import pdfplumber

    out = []
    with pdfplumber.open(path) as pdf:
        for pno, page in enumerate(pdf.pages, 1):
            for table in page.extract_tables():
                for i, raw in enumerate(table, 1):
                    cells = [(c or "").replace("\n", " ").strip() for c in raw]
                    if any(cells):
                        out.append(Row(f"p{pno}", i, cells))
    return out


# ─── étage 01 : colonnes ────────────────────────────────────────────────────

SYN = {
    "code": ("N°", "N °", "N° PRIX", "CODE", "NUMERO"),
    "designation": ("DESIGNATION", "DÉSIGNATION", "LIBELLE", "OUVRAGE"),
    "unite": ("UNITE", "UNITÉ", "U", "UN"),
    "quantite": ("QUANTITE", "QUANTITÉ", "QUANTITES", "QUANTITÉS", "Q", "QTE"),
    "pu": ("PRIX UNITAIRE", "P.U.", "PU"),
}
NUM = re.compile(r"^-?[\d\s\u00a0.]{1,18}(?:[.,]\d+)?$")
CODE_TOKEN = re.compile(r"^[A-Za-z]?\d+([-./][\dA-Za-z]+)*$|^[a-zA-Z]/\d+$|^[a-zA-Z]$")
# Code poste « 10.1 », « 1-1-1 », « a/2 » — pas une simple lettre de variante.
ART_CODE = re.compile(r"^(?:[A-Za-z]?\d+(?:[-./][\dA-Za-z]+)+|[a-zA-Z]/\d+)$")
# Folio de page réimprimé « IV/1 », « IV/15 » — pas un lot.
PAGE_MARK = re.compile(r"^\s*[IVX]{1,5}\s*/\s*\d+\s*$", re.I)
NOISE = re.compile(
    r"^(TOTAL|SOUS[- ]TOTAL|RECAPITULATION|RÉCAPITULATION|MONTANT|ARRETE|ARRÊTE|"
    r"REPORT|A REPORTER|T\.?\s*V\.?\s*A\.?|[_*\-–—.\s]+)$|^TOTAL\b|\bTOTAL\s+HT\b", re.I)
MEASURE = re.compile(r"^(LE|LA|L')\s?[A-ZÀ-Üa-zà-ü]", re.I)
TOTAL_ANY = re.compile(
    r"\b(TOTAL|TOTAUX|RECAPITULATION|RÉCAPITULATION|REPORT|T\.?\s*V\.?\s*A\.?)\b", re.I)
LOTKW = re.compile(r"^\s*(LOT|TRANCHE|CHAPITRE)\s*(N[°o]\s*)?[\dIVX]", re.I)
SOUSKW = re.compile(r"^\s*SOUS[\s-]?LOT\b", re.I)
PREFIX = re.compile(r"^\s*(\d+(?:[-.]\d+)*|[a-zA-Z])\s*[-–/]\s*(.+)$")
# Section « 6.1 REVETEMENTS » / « 7.1. MENUISERIE » → majeur du lot manquant.
SECTION_MAJOR = re.compile(r"^\s*0?(\d+)\s*[.\-]\s*0?(\d+)\b")


def fold(s):
    s = unicodedata.normalize("NFKD", s or "")
    return "".join(c for c in s if not unicodedata.combining(c)).upper().strip().rstrip(":").strip()


def norm_unit(v):
    if not v:
        return None
    v = unicodedata.normalize("NFKC", v).strip()
    return v if 0 < len(v) <= 6 else None


def to_qty(v):
    """350,00 / 5 600 / 45.000,00 (milliers FR)."""
    if not v:
        return None
    s = str(v).replace("\u00a0", "").replace(" ", "")
    if s in ("-", "–", "—"):
        return None
    if re.match(r"^-?\d{1,3}(\.\d{3})+(,\d+)?$", s):
        s = s.replace(".", "").replace(",", ".")
    elif "," in s and "." not in s:
        s = s.replace(",", ".")
    if not re.match(r"^-?\d+(?:\.\d+)?$", s):
        return None
    try:
        n = float(s)
    except ValueError:
        return None
    return n if n > 0 else None


def has_priced_amount(r, cols):
    """True si une cellule hors code/désignation/unité porte un montant (PU / total)."""
    skip = {cols.get("code"), cols.get("designation"), cols.get("unite")}
    for i, c in enumerate(r.cells):
        if i in skip or not c:
            continue
        if to_qty(c) is not None:
            return True
    return False


def style_blank(sig):
    """Signature sans signal visuel (PDF table text) — ne pas promouvoir par proximité."""
    fill, size, bold, _col, _upper = sig
    return (not fill or fill in ("00000000", "0")) and size == 0 and not bold


def map_columns(rows):
    best, score_best, header_at = {}, 0, -1
    for pos, r in enumerate(rows[:40]):
        found, score = {}, 0
        for ci, cell in enumerate(r.cells):
            f = fold(cell)
            if not f or len(f) > 34:
                continue
            for role, names in SYN.items():
                if role not in found and any(f == fold(n) for n in names):
                    found[role] = ci
                    score += 2 if role in ("designation", "quantite") else 1
        if score > score_best:
            best, score_best, header_at = found, score, pos
    ncol = max(len(r.cells) for r in rows)
    if "designation" not in best:
        lens = [0] * ncol
        for r in rows:
            for ci, c in enumerate(r.cells):
                lens[ci] += len(c)
        best["designation"] = lens.index(max(lens))
    if "quantite" not in best:
        cnt = [0] * ncol
        for r in rows:
            for ci, c in enumerate(r.cells):
                if NUM.match(c):
                    cnt[ci] += 1
        best["quantite"] = cnt.index(max(cnt))
    if "code" not in best:
        cnt = [0] * ncol
        for r in rows:
            for ci in range(min(best["designation"], len(r.cells))):
                c = r.cells[ci].strip()
                if c and len(c) <= 12 and " " not in c and CODE_TOKEN.match(c):
                    cnt[ci] += 1
        if max(cnt, default=0) >= 5:
            best["code"] = cnt.index(max(cnt))
    return best, header_at


# ─── passes 1 à 3 ───────────────────────────────────────────────────────────

def signature(r, cols):
    """Grammaire visuelle d'une ligne, telle que l'œil la lit."""
    des = r.cells[cols["designation"]] if cols["designation"] < len(r.cells) else ""
    col = next((k for k, v in enumerate(r.cells) if v), 0)
    letters = [c for c in des if c.isalpha()]
    upper = bool(letters) and sum(c.isupper() for c in letters) / len(letters) > 0.85
    return (r.fill, round(r.size), r.bold, col, upper)


ROMAN = re.compile(r"^\s*([IVX]{1,5})\s*[-–/]")

# Précédence des formes de numérotation, du plus englobant au plus fin. On ne
# suppose pas laquelle porte le lot : on relève celles présentes dans CE document
# et on attribue les rangs dans cet ordre.
SHAPE_ORDER = ("ROMAN", "NUM1", "LETTER", "NUMN")


def shape_of(des, code):
    """Forme de la numérotation d'un groupe : « II/ », « 1 », « b/ », « 1-3 »."""
    if ROMAN.match(des):
        return "ROMAN"
    m = PREFIX.match(des)
    token = m.group(1) if m else (code if code and len(code) <= 12 and " " not in code else None)
    if not token:
        return None
    if token.isalpha():
        return "ROMAN" if token.upper() in ("I", "V", "X") else "LETTER"
    return "NUM1" if len(re.split(r"[-./]", token)) == 1 else "NUMN"


def classify(rows, cols, header_at):
    def cell(r, role):
        ci = cols.get(role)
        return r.cells[ci].strip() if ci is not None and ci < len(r.cells) else ""

    def des_of(r):
        d = cell(r, "designation")
        if d:
            return d
        cands = [c.strip() for c in r.cells if c and not NUM.match(c)]
        return max(cands, key=len) if cands else ""

    # Garder le préambule avant l'en-tête (ex. « I/ - AMÉNAGEMENT » au-dessus des
    # colonnes) — ne jeter que la ligne d'en-tête elle-même.
    if header_at >= 0:
        body = [r for i, r in enumerate(rows) if i != header_at]
        # Remapper : les indices de body ne suivent plus rows ; header consommé.
    else:
        body = rows

    # ---- passe 0 : en-têtes et pieds répétés -------------------------------
    seen = {}
    for i, r in enumerate(body):
        if not norm_unit(cell(r, "unite")) and not to_qty(cell(r, "quantite")):
            d = fold(des_of(r))
            if len(d) > 3:
                seen.setdefault(d, []).append(i)
    n = max(len(body), 1)
    repeats, section_first = Counter(), {}
    for d, ix in seen.items():
        if len(ix) < 3:
            continue
        if (ix[-1] - ix[0]) / n >= 0.6:
            repeats[d] = len(ix)
        else:
            section_first[d] = ix[0]

    # ---- passe 1 : ancres --------------------------------------------------
    header_words = {fold(n) for names in SYN.values() for n in names}
    kinds = [None] * len(body)
    for i, r in enumerate(body):
        des = des_of(r)
        if not des:
            kinds[i] = "SKIP"
            continue
        fd = fold(des)
        u, q = norm_unit(cell(r, "unite")), to_qty(cell(r, "quantite"))
        code = cell(r, "code")
        if PAGE_MARK.match(des) or PAGE_MARK.match(code):
            kinds[i] = "NOISE"
            continue
        if fd in header_words or fd.startswith("DESIGNATION") or fd.startswith("N ") or NOISE.match(des):
            kinds[i] = "NOISE"
            continue
        if not u and not q:
            if TOTAL_ANY.search(des):
                kinds[i] = "NOISE"
                continue
            if repeats[fd] >= 3:
                kinds[i] = "NOISE"
                continue
            if fd in section_first and section_first[fd] != i:
                kinds[i] = "NOISE"
                continue
            if MEASURE.match(des) and len(des) < 30:
                kinds[i] = "SKIP"
                continue
        # Mot-clé LOT/SOUS avant U/Q : un récap « LOT 1 … | 340603 » n'est pas un article.
        if SOUSKW.match(des):
            kinds[i] = "SOUS_LOT"
        elif LOTKW.match(des):
            kinds[i] = "LOT"
        elif u or q:
            kinds[i] = "MEASURE"
        elif code and ART_CODE.match(code) and has_priced_amount(r, cols):
            # Code + PU/montant sans U/Q (Villa LOT 10 honoraires).
            kinds[i] = "MEASURE"

    # ---- passe 2 : signatures apprises sur les ancres ----------------------
    sig_of = {}
    for label in ("LOT", "SOUS_LOT", "MEASURE"):
        sigs = Counter(signature(body[i], cols) for i, k in enumerate(kinds) if k == label)
        if sigs:
            sig_of[label] = sigs.most_common(1)[0][0]

    # ---- passe 3 : le reste, par proximité ---------------------------------
    def near(sig, ref, need=3):
        return sum(a == b for a, b in zip(sig, ref)) >= need

    unresolved = 0
    for i, r in enumerate(body):
        if kinds[i]:
            continue
        sig = signature(r, cols)
        code = cell(r, "code")
        nxt = kinds[i + 1] if i + 1 < len(kinds) else None
        nxt_des = cell(body[i + 1], "designation") if i + 1 < len(body) else ""
        if code and nxt == "MEASURE" and (MEASURE.match(nxt_des) or not cell(body[i + 1], "code")):
            kinds[i] = "HEAD"
            continue
        # Sans style (PDF texte), la signature LOT colle à tout → sections devenues lots.
        lot_sig = sig_of.get("LOT")
        sous_sig = sig_of.get("SOUS_LOT")
        if lot_sig and not style_blank(lot_sig) and near(sig, lot_sig, 4):
            kinds[i] = "LOT"
        elif sous_sig and not style_blank(sous_sig) and near(sig, sous_sig, 4):
            kinds[i] = "SOUS_LOT"
        elif "MEASURE" in sig_of and near(sig, sig_of["MEASURE"], 4) and code:
            kinds[i] = "HEAD"
        else:
            titre = r.merged or sig[4] or shape_of(des_of(r), code) is not None
            if titre:
                kinds[i] = "SOUS_LOT"
            elif code:
                kinds[i] = "AMBIGU"
                unresolved += 1
            else:
                kinds[i] = "SKIP"

    # ---- passe 3b : rang par forme de numérotation -------------------------
    shapes = {}
    for i, r in enumerate(body):
        if kinds[i] not in ("LOT", "SOUS_LOT"):
            continue
        des = des_of(r)
        if LOTKW.match(des) or SOUSKW.match(des):
            continue
        s = shape_of(des, cell(r, "code"))
        if s:
            shapes[i] = s

    present = [s for s in SHAPE_ORDER if s in set(shapes.values())]
    if present:
        rank = {s: (1 if k == 0 else 2) for k, s in enumerate(present)}
        for i, s in shapes.items():
            kinds[i] = "LOT" if rank[s] == 1 else "SOUS_LOT"
    return body, kinds, cols, unresolved


# ─── passe 4 : arbre positionnel ────────────────────────────────────────────

def _lot_major(libelle):
    m = re.match(r"^\s*0?(\d+)\b", libelle or "")
    if m:
        return str(int(m.group(1)))
    m = re.search(r"\bLOT\s*0?(\d+)\b", libelle or "", re.I)
    return str(int(m.group(1))) if m else None


def build(body, kinds, cols):
    def cell(r, role):
        ci = cols.get(role)
        return r.cells[ci].strip() if ci is not None and ci < len(r.cells) else ""

    def des_of(r):
        d = cell(r, "designation")
        if d:
            return d
        cands = [c.strip() for c in r.cells if c and not NUM.match(c)]
        return max(cands, key=len) if cands else ""

    roots, lot, sous, head = [], None, None, None
    pending_preamble = []  # sous-lots/articles avant le 1er lot → rattachés au 1er lot

    def attach_preamble(target):
        nonlocal pending_preamble
        for node in pending_preamble:
            target.children.append(node)
        pending_preamble = []

    def open_lot(des, page):
        nonlocal lot, sous, head
        lot = Node("LOT", None, des, page=page)
        roots.append(lot)
        sous = head = None
        attach_preamble(lot)
        return lot

    for i, r in enumerate(body):
        k = kinds[i]
        des = des_of(r)
        if k in ("SKIP", "NOISE", "AMBIGU"):
            continue
        if k == "LOT":
            open_lot(des, r.page)
        elif k == "SOUS_LOT":
            # « SOUS LOT : 7- MENUISERIE » = bandeau de lot mal libellé.
            m_banner = re.match(r"^\s*SOUS\s*LOT\s*:\s*0?(\d+)\s*[-–]\s*(.+)$", des, re.I)
            if m_banner:
                open_lot(f"{m_banner.group(1)}-{m_banner.group(2).strip()}", r.page)
                continue
            # BDP-2-17 : « 6.1 REVETEMENTS » sans bandeau « 6- … » → ouvrir le lot.
            m = SECTION_MAJOR.match(des)
            if m:
                major = str(int(m.group(1)))
                if lot is None or _lot_major(lot.libelle) != major:
                    # Titre propre : « 6 - REVETEMENTS » et non « 6 - 6.1 REVETEMENTS ».
                    rest = re.sub(r"^\s*0?\d+\s*[.\-]\s*0?\d+\s*[-–.]?\s*", "", des).strip()
                    open_lot(f"{major} - {rest}" if rest else f"{major}", r.page)
            sous = Node("SOUS_LOT", None, des, page=r.page)
            if lot is None:
                pending_preamble.append(sous)
            else:
                lot.children.append(sous)
            head = None
        elif k == "HEAD":
            head = (cell(r, "code"), des)
        elif k == "MEASURE":
            u, q = norm_unit(cell(r, "unite")), to_qty(cell(r, "quantite"))
            if head and MEASURE.match(des):
                code, lib = head
            else:
                code, lib = cell(r, "code") or None, des
            head = None
            if u in ("Ens", "E", "FF", "F") and q is None:
                q = 1.0
            art = Node("ARTICLE", code, lib, u, q, r.page)
            parent = sous or lot
            if parent is None:
                pending_preamble.append(art)
            else:
                parent.children.append(art)

    # Préambule restant (aucun lot dans le fichier) → lot technique.
    if pending_preamble:
        lot = Node("LOT", None, "Sans lot", page=pending_preamble[0].page)
        roots.append(lot)
        attach_preamble(lot)

    def keep(n):
        if n.kind == "ARTICLE":
            return True
        n.children = [c for c in n.children if keep(c)]
        return bool(n.children)

    return [r for r in roots if keep(r)]


def count(nodes, kind):
    return sum((n.kind == kind) + count(n.children, kind) for n in nodes)


def run(loader, path, label):
    rows = loader(path)
    cols, header_at = map_columns(rows)
    body, kinds, cols, ambigu = classify(rows, cols, header_at)
    tree = build(body, kinds, cols)
    arts = count(tree, "ARTICLE")
    sans_q = sum(1 for n in walk(tree) if n.kind == "ARTICLE" and n.quantite is None)
    orph = sum(count(r.children, "ARTICLE") for r in tree if r.libelle == "Sans lot")
    print(f"  {label}")
    print(f"    lots {count(tree,'LOT'):<4} sous-lots {count(tree,'SOUS_LOT'):<4} "
          f"articles {arts:<5} orphelins {orph:<4} ambigus {ambigu:<4} sans quantité {sans_q}")
    for r in tree[:6]:
        print(f"      LOT      {r.libelle[:56]}")
        for c in r.children[:2]:
            tag = "SOUS-LOT" if c.kind == "SOUS_LOT" else "article "
            print(f"        {tag} {c.libelle[:50]}")
    print()


def walk(nodes):
    for n in nodes:
        yield n
        yield from walk(n.children)


B = r"C:/Users/yassiveco/"

if __name__ == "__main__":
    print("PROTOTYPE v3 — classifieur de hiérarchie à deux passes\n")
    run(rows_pdf, B + "Desktop/Nafura Platform/sektor ressources/zenit/BDP-2-17.pdf", "BDP-2-17.pdf")
    run(rows_xlsx, B + "Downloads/BPDE - LOT SECONDAIRES -OPERATION VILLA KENITRA  indice 23032026  .xlsx", "Villa Kenitra.xlsx")
    run(rows_xlsx, B + "Desktop/bdp.xlsx", "bdp.xlsx")
