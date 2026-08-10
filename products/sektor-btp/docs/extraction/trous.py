"""Un trou de numérotation vaut-il une alerte ?

Hypothèse à réfuter : « 3.12.4 → 3.12.6 » signale une ligne perdue à l'extraction.
Test : regarder ce que le classifieur a écarté entre les deux articles. S'il n'a
rien jeté, le trou vient du rédacteur et l'alerte serait du bruit.
"""
import re
import sys
from collections import defaultdict

sys.path.insert(0, r"C:/Users/YASSIV~1/AppData/Local/Temp/claude"
                   r"/C--Users-yassiveco-Desktop-Nafura-Platform-nafuralabs"
                   r"/74dc9a5c-d40a-4539-b40f-b0ed6cd05417/scratchpad")
sys.stdout.reconfigure(encoding="utf-8")

import grid_v3 as g

ECARTE = ("NOISE", "SKIP", "AMBIGU")


def articles_avec_index(body, kinds, cols):
    """Rejoue l'assemblage en gardant l'indice de la ligne d'origine."""
    def cell(r, role):
        ci = cols.get(role)
        return r.cells[ci].strip() if ci is not None and ci < len(r.cells) else ""

    def des_of(r):
        d = cell(r, "designation")
        if d:
            return d
        c = [x.strip() for x in r.cells if x and not g.NUM.match(x)]
        return max(c, key=len) if c else ""

    out, head = [], None
    for i, r in enumerate(body):
        k = kinds[i]
        if k == "HEAD":
            head = cell(r, "code")
        elif k == "MEASURE":
            code = head if (head and g.MEASURE.match(des_of(r))) else cell(r, "code")
            head = None
            out.append((i, (code or "").strip()))
        elif k in ("LOT", "SOUS_LOT"):
            head = None
    return out


def analyse(loader, path, name):
    rows = loader(path)
    cols, h = g.map_columns(rows)
    body, kinds, cols, _ = g.classify(rows, cols, h)
    arts = articles_avec_index(body, kinds, cols)

    def cell(r, role):
        ci = cols.get(role)
        return r.cells[ci].strip() if ci is not None and ci < len(r.cells) else ""

    par_prefixe = defaultdict(list)
    for idx, code in arts:
        m = re.match(r"^(.*[-./])(\d+)$", code)
        if m:
            par_prefixe[m.group(1)].append((int(m.group(2)), idx))

    print(f"=== {name}")
    fondes = bruit = 0
    for prefixe, items in par_prefixe.items():
        items.sort()
        for (n1, i1), (n2, i2) in zip(items, items[1:]):
            if n2 - n1 <= 1:
                continue
            # Une ligne vide, un TOTAL ou un saut de page ne sont pas un article
            # perdu : on sait ce qu'ils sont. Seul le texte non identifié compte.
            jetes = [(kinds[j], body[j]) for j in range(i1 + 1, i2)
                     if kinds[j] in ("SKIP", "AMBIGU")
                     and len((cell(body[j], "designation") or "").strip()) > 3]
            manquants = ", ".join(f"{prefixe}{x}" for x in range(n1 + 1, n2))
            if jetes:
                fondes += 1
                print(f"  ⚠ {manquants:<22} {len(jetes)} ligne(s) écartée(s) entre "
                      f"{prefixe}{n1} et {prefixe}{n2} :")
                for k, r in jetes[:3]:
                    print(f"        [{k:<6}] {cell(r, 'designation')[:52] or '(vide)'}")
            else:
                bruit += 1
                print(f"  · {manquants:<22} rien d'écarté — suppression du rédacteur")
    if not fondes and not bruit:
        print("  aucun trou")
    else:
        print(f"  → {fondes} alerte(s) fondée(s), {bruit} qui seraient du bruit")
    print()


B = r"C:/Users/yassiveco/"
print("LES TROUS DE NUMÉROTATION MÉRITENT-ILS UNE ALERTE ?\n")
analyse(g.rows_pdf, B + "Desktop/Nafura Platform/sektor ressources/zenit/BDP-2-17.pdf", "BDP-2-17.pdf")
analyse(g.rows_xlsx, B + "Downloads/BPDE - LOT SECONDAIRES -OPERATION VILLA KENITRA  indice 23032026  .xlsx", "Villa Kenitra.xlsx")
analyse(g.rows_xlsx, B + "Desktop/bdp.xlsx", "bdp.xlsx")
