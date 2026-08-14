# Extraction du bordereau — prototype de référence

> **État du portage Java** — `ma.nafura.etudes.service.bordereau.grid` couvre la source PDF
> quadrillée, le mapping des colonnes, le classifieur à deux passes et l'assemblage. Le chemin est
> **branché en tête de `PdfBordereauLayoutParser.parse()`** : un PDF quadrillé passe par la lecture
> de cellules, tout le reste retombe sur l'analyse géométrique, inchangée.
>
> Sur `BDP-2-17.pdf` : **9 lots, 47 sous-lots, 186 articles, 0 ambigu, 2 sans quantité** — lots 6/7
> ouverts à la première section. Gap-test Villa xlsx/PDF : **10 lots / 205 articles**, alignés.
>
> **Jamais exécuté de bout en bout** : rien au-dessus de `BordereauParseResult` n'a été vérifié
> avec cette source — ni le merger, ni l'assembleur hybride, ni la persistance, ni l'écran. Il
> faut un build pour ça.
>
> Restent à porter : `XlsxGridSource`, `DocxGridSource`, et le `ReadingPlan` avec sa cascade.

`bordereau-grid-prototype.py` est la **spécification exécutable** du pipeline d'extraction
déterministe. Il a été écrit pour valider les règles sur des fichiers réels avant de les porter
en Java. Il n'est pas destiné à tourner en production.

## Lancer

```bash
python -X utf8 bordereau-grid-prototype.py
```

Les chemins des trois fichiers de test sont en bas du script (constante `B`).

## Résultats mesurés

| Fichier | Forme | Lots | Sous-lots | Articles | Orphelins | Ambigus |
|---|---|---|---|---|---|---|
| `BDP-2-17.pdf` | Excel → PDF, quadrillé, 16 p. | 9 | 47 | 186 | 0 | 0 |
| `BPDE Villa Kenitra.xlsx` | 2 feuilles, déjà chiffré | 10 | 13 | 205 | 0 | 0 |
| `BPDE Villa Kenitra.pdf` | même contenu, sans merged/taille | 10 | 10 | 205 | 0 | 0 |
| `bdp.xlsx` | 963 lignes, colonnes en C–H | 2 | 18 | 107 | 0 | 7 |

**703 articles sur 4 fichiers, 0 orphelin, lots 6/7 BDP-2-17 ouverts, Villa PDF = Villa xlsx.**

Gap-test extracteur vs référence LLM : `docs/extraction/gap-test/compare/GAPS.md`.

## Les règles, et pourquoi elles sont ainsi

Chaque règle a été ajoutée pour un échec constaté, pas par anticipation.

1. **La colonne code n'a souvent aucun en-tête** — elle est inférée comme la colonne, à gauche de
   la désignation, la plus riche en jetons courts. Sans ça, `bdp.xlsx` renvoie
   `Le mètre cube :` comme libellé de tous ses articles.

2. **Un article = unité OU quantité**, jamais « et ». Villa Kenitra a 109 lignes avec unité et
   sans quantité — plus que les 87 complètes. La quantité manquante est une anomalie, pas un
   motif d'exclusion.

3. **`Ens` / `E` / `FF` / forfait → quantité 1** par défaut. `PM` (pour mémoire) ne déclenche
   aucune anomalie : c'est une ligne qui n'est jamais chiffrée.

4. **Unités normalisées en NFKC.** `㎡` est U+33A1, un caractère unique — `NFD` ne le décompose
   pas, `NFKC` le ramène à `m2`. 22 occurrences dans Villa Kenitra.

5. **L'appariement tête / mesure est insensible à la casse.** BDP-2-17 écrit `LE MÈTRE CUBE`,
   `bdp.xlsx` écrit `Le mètre cube :`.

6. **Un bandeau couvre tout le document ; un titre de division couvre son bloc.** Un texte répété
   trois fois ou plus sur ≥ 60 % des lignes est du décor et se jette. En deçà, c'est un titre
   réimprimé en tête de page : on garde la première occurrence. C'est ce qui distingue
   `PRIX EN TOUTES LETTRES` (87 %) de `II/ - BÂTIMENT` (50 %).

7. **Le rang ne se suppose pas, il s'apprend.** On relève les formes de numérotation réellement
   présentes — `ROMAN`, `NUM1`, `LETTER`, `NUMN` — et on les ordonne. `bdp.xlsx` a
   `{ROMAN, LETTER}` : `II/` est un lot, `b/` un sous-lot. BDP-2-17 a `{NUM1, NUMN}` : `3-` est
   un lot, `3.1.` un sous-lot. Le mot-clé `LOT n` prime toujours.

8. **Une ligne fusionnée est structurelle.** C'est ainsi que Villa Kenitra marque ses lots
   (orange, 14,5 pt) et sous-lots (vert, 10 pt). Sans ce signal, `Tableaux électriques` passe
   pour un fragment.

9. **Dernier recours : fusionné, en capitales, ou numéroté — sinon c'est une continuation.**
   `publiques`, `incorporée et durcisseur` sont des fins de libellé enroulées, pas des sous-lots.

## La carte des doutes

`anomalies.py` et `trous.py` mesurent ce qu'on demanderait réellement à l'utilisateur de
regarder. Principe : **on ne répare pas un fichier mal saisi, on le signale.** Sektor permet la
correction manuelle ; le travail de l'extraction est de mener l'utilisateur aux bons endroits,
et seulement à ceux-là.

Deux natures à ne jamais mélanger dans l'écran :

- **doute d'extraction** — « on n'est pas sûr d'avoir bien lu ». Rare : 4 postes sur BDP-2-17,
  3 sur Villa Kenitra, 11 sur `bdp.xlsx`.
- **manque de la source** — « le fichier ne le contient pas ». Peut être volumineux : 75 quantités
  absentes de Villa Kenitra. C'est de la saisie, pas de la vérification.

Les afficher ensemble annoncerait « 39 % à revoir » sur Villa Kenitra : alarmant et faux.

### Une alerte qui crie au loup en discrédite mille

Deux détecteurs ont dû être resserrés après vérification :

- **codes en double** : `a) DE 40 x 40 CM`, `b) DE 50 x 50 CM` est une convention de variantes
  légitime, et le même `a)` revient sous chaque sous-lot. Les codes ne se comparent qu'entre
  frères. 33 fausses alertes → 0 sur BDP-2-17.
- **trous de numérotation** : sur les 11 trous des trois fichiers, **un seul** mérite une alerte —
  celui où l'extracteur a écarté une ligne porteuse de texte. Les autres sont des sauts de page,
  des lignes `TOTAL`, des cellules vides, ou des suppressions du rédacteur. La règle brute serait
  bruit à 91 %.

L'unique alerte survivante a trouvé un vrai défaut : `Climatisation-ventilation- chauffage`, un
titre de sous-lot que le classifieur avait écarté. L'extracteur n'a pas besoin d'être parfait si
la carte des doutes est honnête.

## Deux numérotations

56 articles sur 490 n'ont **aucune référence** dans le fichier source ; 28 portent un code
dupliqué. Renuméroter serait grave — le code est la clé contractuelle du marché. Ne rien faire
l'est aussi.

- **Réf. marché** — verbatim, immuable. Peut être absente, dupliquée, trouée. Repart telle quelle
  vers le maître d'ouvrage.
- **N° d'arbre** — **dérivé de la position**, jamais stocké : la chaîne des `ordre` du nœud
  jusqu'à la racine. `DpgfNoeud.ordre` existe déjà. Insertion, déplacement, suppression : la
  numérotation est juste à l'instant d'après, il n'y a rien à renuméroter.

## Ce qui reste ouvert

- `EN ÉLÉVATION` / quelques têtes encore ambiguës sur `bdp.xlsx` (7 lignes).
- Aucun vrai scan ni aucun `.docx` testé.
- Le seuil de 60 % qui sépare bandeau et titre de division est empirique.
- Matching article gap-test trop strict sur ponctuation de codes (`3.1.1.` vs `3.1.1`) → faux écarts BDP-2-17.

Voir l'architecture complète et la place de l'IA dans le pipeline :
`ReadingPlan`, `PlanResolver`, `PlanValidator`, `PlanCache`.
