"""Extraction des sous-détails de prix du classeur GROS-OEUVRE vers un corpus JSON.

Principe : le rendement d'un composant est le coefficient réellement appliqué à son
prix unitaire dans le déboursé de l'ouvrage. Le classeur cache une partie de ce
coefficient dans la formule du total (`=SUM(J3+J5)/100+J4`), donc on l'extrait en
évaluant la formule symboliquement, composant par composant.
"""
import json
import os
import re

import openpyxl
from openpyxl.utils import get_column_letter

SKIP = {" D.E.", "GROS-ŒUVRE-REVÊTEMENTS-ETANCHEI"}
RECAP = "GROS-ŒUVRE-REVÊTEMENTS-ETANCHEI"
SOURCE_LABEL = ("Classeur « LOT N° 2 GROS-ŒUVRE — REVÊTEMENTS ÉTANCHÉITÉ — PEINTURE », "
                "transmis par l'expert métier le 2026-07-19")


def workbook_path():
    d = os.path.join(os.path.expanduser("~"), "Downloads")
    return os.path.join(d, [f for f in os.listdir(d) if "GROS" in f and f.endswith(".xlsx")][0])


def text(value):
    """Le classeur mélange codes numériques et textuels dans la même colonne."""
    if value is None:
        return None
    s = str(value).strip()
    return s or None


def expand_ranges(formula):
    """SUM(I2:I7) -> SUM(I2+I3+...+I7), pour pouvoir substituer cellule par cellule."""
    def repl(m):
        col, r1, r2 = m.group(1), int(m.group(2)), int(m.group(3))
        return "+".join(f"{col}{r}" for r in range(r1, r2 + 1))
    return re.sub(r"([A-Z]{1,2})(\d+):[A-Z]{1,2}(\d+)", repl, formula)


def coefficient(formula, target):
    """Coefficient appliqué à `target` dans `formula` : on met la cellule à 1, les autres à 0."""
    expr = expand_ranges(formula.lstrip("=")).replace("SUM(", "(")
    cells = set(re.findall(r"[A-Z]{1,2}\d+", expr))
    if target not in cells:
        return 0.0
    env = {c: (1.0 if c == target else 0.0) for c in cells}
    try:
        return float(eval(expr, {"__builtins__": {}}, env))
    except Exception:
        return None


def column_map(ws, hr, base):
    """Les feuilles n'ont ni le même décalage ni les mêmes colonnes (`g3` n'a pas de
    colonnes « Elements »). On repère donc par intitulé, pas par position."""
    cols = {}
    seen_unite = 0
    for c in range(base, min(base + 20, ws.max_column + 1)):
        label = ws.cell(hr, c).value
        if not isinstance(label, str):
            continue
        label = label.strip()
        if label == "Unité":
            # Trois colonnes portent cet intitulé : ouvrage, composant, puis celle de
            # « Q éxé ». Seules les deux premières nous intéressent.
            seen_unite += 1
            if seen_unite <= 2:
                cols["unite_ouvrage" if seen_unite == 1 else "unite_composant"] = c
        else:
            cols[label] = c
    return cols


def read_recap(ws):
    """Prix de référence par désignation, pour recoupement."""
    out = {}
    for r in range(1, ws.max_row + 1):
        desig = ws.cell(r, 5).value or ws.cell(r, 7).value
        pu = ws.cell(r, 9).value
        if isinstance(desig, str) and isinstance(pu, (int, float)):
            out.setdefault(desig.strip().lower(), []).append(float(pu))
    return out


def extract():
    path = workbook_path()
    wv = openpyxl.load_workbook(path, data_only=True)
    wf = openpyxl.load_workbook(path, data_only=False)
    recap = read_recap(wv[RECAP])

    ouvrages, anomalies = [], []

    for ws in wv.worksheets:
        if ws.title in SKIP:
            continue
        sf = wf[ws.title]

        # Repérage des blocs : ligne d'en-tête « Code Elem », total « Total HT ».
        headers, totals = [], []
        for r in range(1, ws.max_row + 1):
            for c in range(1, ws.max_column + 1):
                v = ws.cell(r, c).value
                if not isinstance(v, str):
                    continue
                if v.strip() == "Code Elem":
                    headers.append((r, c))
                elif v.strip() == "Total HT":
                    # « Total pour 31 m² » clôt un calcul intermédiaire, pas un ouvrage.
                    totals.append((r, c))

        for i, (hr, base) in enumerate(headers):
            end = headers[i + 1][0] if i + 1 < len(headers) else ws.max_row + 1
            total_rows = [t for t in totals if hr < t[0] < end]
            if not total_rows:
                anomalies.append({"feuille": ws.title, "ligne": hr, "motif": "bloc sans ligne Total"})
                continue

            # Un en-tête peut couvrir plusieurs ouvrages consécutifs (chacun clos par son total).
            cols = column_map(ws, hr, base)
            start = hr + 1
            for tr, tc in total_rows:
                block = parse_block(ws, sf, cols, start, tr, tc, recap, anomalies)
                if block:
                    ouvrages.append(block)
                start = tr + 1

    return ouvrages, anomalies


def parse_block(ws, sf, cols, start, tr, tc, recap, anomalies):
    def C(r, key):
        c = cols.get(key)
        return ws.cell(r, c).value if c else None

    code = designation = unite = None
    for r in range(start, tr):
        if C(r, "Désignation Elem"):
            code = C(r, "Code Elem")
            designation = C(r, "Désignation Elem")
            unite = C(r, "unite_ouvrage")
            break
    if not designation:
        return None

    total_formula = sf.cell(tr, tc + 1).value
    total_value = ws.cell(tr, tc + 1).value
    montant_col = get_column_letter(cols["Montant"])

    composants = []
    for r in range(start, tr):
        pu, montant = C(r, "PU.HT"), C(r, "Montant")
        # Feuille `g3` : pas de colonnes « Elements », la ligne d'ouvrage est son composant.
        desig_comp = C(r, "Désignation Elements") or C(r, "Désignation Elem")
        if not isinstance(pu, (int, float)) or not isinstance(montant, (int, float)):
            continue

        coef = 1.0
        if isinstance(total_formula, str) and total_formula.startswith("="):
            coef = coefficient(total_formula, f"{montant_col}{r}")
            if coef is None:
                anomalies.append({"feuille": ws.title, "ligne": r,
                                  "motif": f"formule de total non évaluable : {total_formula}"})
                coef = 1.0
        elif isinstance(total_formula, str):
            anomalies.append({"feuille": ws.title, "ligne": tr,
                              "motif": f"total non calculé : {total_formula!r}"})

        if coef == 0:
            anomalies.append({"feuille": ws.title, "ligne": r,
                              "motif": f"composant '{desig_comp}' absent du total"})
            continue
        if pu == 0:
            anomalies.append({"feuille": ws.title, "ligne": r,
                              "motif": f"composant '{desig_comp}' à prix unitaire nul"})
            continue

        composants.append({
            "code": text(C(r, "Code Elements")),
            "designation": text(desig_comp),
            "unite": text(C(r, "unite_composant")) or text(C(r, "unite_ouvrage")),
            "_coef": coef,
            "rendement": round(montant / pu, 6),
            "prixUnitaire": round(float(pu), 4),
            "total": round(coef * montant, 4),
        })

    if not composants:
        return None

    # Un coefficient < 1 dans la formule du total, c'est la production journalière que le
    # classeur enfouit dans la formule (`=SUM(J3+J5)/100+J4`). On la remonte en clair : le
    # composant est journalier, et 1/coef est le rendement journalier de l'ouvrage.
    divisors = {round(1 / c["_coef"], 6) for c in composants if c["_coef"] != 1}
    if len(divisors) > 1:
        anomalies.append({"feuille": ws.title, "ligne": tr,
                          "motif": f"plusieurs productions journalières dans un même total : {divisors}"})
    rendement_journalier = divisors.pop() if len(divisors) == 1 else None

    for c in composants:
        c["baseRendement"] = "PAR_JOUR" if c["_coef"] != 1 else "PAR_UNITE"
        del c["_coef"]

    debourse = round(sum(c["total"] for c in composants), 4)
    ecart = None
    if isinstance(total_value, (int, float)) and total_value:
        ecart = round(debourse - float(total_value), 4)
        if abs(ecart) > 0.01:
            anomalies.append({"feuille": ws.title, "ligne": tr,
                              "motif": f"déboursé recalculé {debourse} ≠ total classeur {total_value}"})

    ref = recap.get(str(designation).strip().lower())
    return {
        "famille": ws.title.strip(),
        "code": text(code),
        "designation": str(designation).strip(),
        "unite": text(unite),
        # Étiquette « Q éxé » du classeur (ex. « 100M3/jour »). Conservée telle quelle :
        # elle contredit parfois la formule, c'est un constat à instruire, pas une donnée.
        "rendementJournalier": rendement_journalier,
        "qExecutee": next((text(C(r, "Q éxé")) for r in range(start, tr) if C(r, "Q éxé")), None),
        "debourseSec": debourse,
        "totalClasseur": float(total_value) if isinstance(total_value, (int, float)) else None,
        "ecart": ecart,
        "prixRecap": ref[0] if ref else None,
        "composants": composants,
    }


CORPUS_FIELDS = ["famille", "code", "designation", "unite", "rendementJournalier",
                 "qExecutee", "totalClasseur", "composants"]


def main():
    ouvrages, anomalies = extract()

    # Le corpus versionné ne garde que la donnée métier et le total qui fait référence.
    # `debourseSec` et `ecart` sont des sorties de contrôle de l'extraction, pas des données :
    # les publier inviterait à comparer le calcul à lui-même.
    corpus = [{k: o[k] for k in CORPUS_FIELDS} for o in ouvrages]

    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
    dest = os.path.normpath(os.path.join(
        root, "backend/modules/etudes/src/test/resources/corpus/sous-details-gros-oeuvre.json"))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "w", encoding="utf-8") as f:
        json.dump({"source": SOURCE_LABEL, "ouvrages": corpus}, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"écrit      : {dest}")

    print(f"ouvrages   : {len(ouvrages)}")
    print(f"composants : {sum(len(o['composants']) for o in ouvrages)}")
    print(f"familles   : {len({o['famille'] for o in ouvrages})}")
    print(f"anomalies  : {len(anomalies)}")
    ecarts = [o for o in ouvrages if o["ecart"] not in (None, 0.0) and abs(o["ecart"]) > 0.01]
    print(f"écarts >1c : {len(ecarts)}")
    for a in anomalies:
        print("  -", a["feuille"], a["ligne"], a["motif"])


if __name__ == "__main__":
    main()
