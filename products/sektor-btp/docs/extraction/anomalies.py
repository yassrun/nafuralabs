"""Carte des doutes — ce qu'on demande réellement à l'utilisateur de regarder.

On ne répare pas un fichier mal saisi : on le signale. Chaque catégorie doit
correspondre à un geste de correction précis dans Sektor.
"""
import re
import sys
from collections import Counter, defaultdict

sys.path.insert(0, r"C:/Users/YASSIV~1/AppData/Local/Temp/claude"
                   r"/C--Users-yassiveco-Desktop-Nafura-Platform-nafuralabs"
                   r"/74dc9a5c-d40a-4539-b40f-b0ed6cd05417/scratchpad")
sys.stdout.reconfigure(encoding="utf-8")

import grid_v3 as g

REFERENTIEL = {"M", "M2", "M3", "ML", "KG", "T", "U", "FF", "F", "H", "J", "L",
               "ENS", "E", "PM", "EA", "LOT", "CM", "G"}


def audit(tree, ambigus, label):
    arts = [n for n in g.walk(tree) if n.kind == "ARTICLE"]
    lots = [n for n in tree]

    orphelins = [a for a in g.walk([t for t in lots if t.libelle == "Sans lot"])
                 if a.kind == "ARTICLE"]
    sans_qte = [a for a in arts if a.quantite is None]
    sans_unite = [a for a in arts if not a.unite]
    hors_ref = [a for a in arts
                if a.unite and a.unite.upper().replace("²", "2").replace("³", "3")
                not in REFERENTIEL]
    # « Ø 75 », « BA13 », « DE 40 x 40 CM » sont de vrais libellés d'article.
    # On ne signale que les fragments : court, sans code, et non capitalisé.
    libelle_court = [a for a in arts
                     if len(a.libelle.strip()) < 12 and not a.code
                     and not a.libelle.strip()[:1].isupper()]

    # Un code ne se compare qu'à ses frères : « a) DE 40x40 » et « a) Ø 75 »
    # vivent sous deux sous-lots différents, ce ne sont pas des doublons.
    doublons, art_doublons = {}, 0
    def scan(parent):
        nonlocal art_doublons
        freres = Counter(c.code for c in parent.children
                         if c.kind == "ARTICLE" and c.code)
        for code, n in freres.items():
            if n > 1:
                doublons[code] = doublons.get(code, 0) + n
                art_doublons += n
        for c in parent.children:
            if c.kind != "ARTICLE":
                scan(c)
    for t in tree:
        scan(t)

    # rupture de séquence : 1-1-1, 1-1-2, puis 1-1-5
    trous = []
    par_prefixe = defaultdict(list)
    for a in arts:
        if not a.code:
            continue
        m = re.match(r"^(.*[-./])(\d+)$", a.code.strip())
        if m:
            par_prefixe[m.group(1)].append(int(m.group(2)))
    for prefixe, nums in par_prefixe.items():
        s = sorted(set(nums))
        for x, y in zip(s, s[1:]):
            if y - x > 1:
                trous.append(f"{prefixe}{x} → {prefixe}{y}")

    groupes_vides = [n for n in g.walk(tree)
                     if n.kind in ("LOT", "SOUS_LOT") and not n.children]

    total = len(arts)
    print(f"  {label}   —   {total} articles")
    lignes = [
        ("poste sans lot",              len(orphelins), "rattacher à un lot"),
        ("ligne ambiguë : poste ou titre ?", ambigus,   "trancher en un clic"),
        ("quantité manquante",          len(sans_qte),  "saisir la quantité"),
        ("unité manquante",             len(sans_unite), "choisir dans le référentiel"),
        ("unité hors référentiel",      len(hors_ref),  "mapper vers un code"),
        ("libellé très court",          len(libelle_court), "vérifier / fusionner"),
        ("code en double DANS LE FICHIER", art_doublons, "erreur source — signaler"),
        ("rupture de numérotation",     len(trous),     "erreur source — vérifier"),
        ("groupe sans aucun poste",     len(groupes_vides), "supprimer ou compléter"),
    ]
    a_revoir = set()
    for a in orphelins + sans_qte + sans_unite + hors_ref + libelle_court:
        a_revoir.add(id(a))
    for nom, n, geste in lignes:
        if n:
            print(f"      {n:>4}  {nom:<34} → {geste}")
    print(f"      ----  {len(a_revoir)} postes distincts à revoir "
          f"({100 * len(a_revoir) // max(total, 1)} % du bordereau)")
    if doublons:
        top = sorted(doublons.items(), key=lambda x: -x[1])[:3]
        print(f"            codes dupliqués : " +
              ", ".join(f"{c} ×{n}" for c, n in top))
    if trous:
        print(f"            trous : " + ", ".join(trous[:4]))
    print()


B = r"C:/Users/yassiveco/"
CASES = [
    (g.rows_pdf, B + "Desktop/Nafura Platform/sektor ressources/zenit/BDP-2-17.pdf", "BDP-2-17.pdf"),
    (g.rows_xlsx, B + "Downloads/BPDE - LOT SECONDAIRES -OPERATION VILLA KENITRA  indice 23032026  .xlsx", "Villa Kenitra.xlsx"),
    (g.rows_xlsx, B + "Desktop/bdp.xlsx", "bdp.xlsx"),
]

print("CARTE DES DOUTES — ce que Sektor demande à l'utilisateur de regarder\n")
for loader, path, name in CASES:
    rows = loader(path)
    cols, h = g.map_columns(rows)
    body, kinds, cols, amb = g.classify(rows, cols, h)
    audit(g.build(body, kinds, cols), amb, name)
