# Extraction des sous-détails de prix

Transforme le classeur de sous-détails d'un client en corpus JSON vérifiable.

```bash
python products/sektor-btp/tools/corpus-ouvrages/extract_sous_details.py
```

Écrit `backend/modules/etudes/src/test/resources/corpus/sous-details-gros-oeuvre.json`,
consommé par `DpuCalculatorCorpusReelTest`.

## Ce que le script résout

Un classeur de sous-détails n'est pas une table. Trois difficultés, toutes rencontrées sur la
première source réelle :

**Le rendement n'est pas dans la colonne « Qté ».** Une partie du coefficient est enfouie dans
les formules : `=SUM(J3+J5)/100+J4` divise deux composants sur trois par la production
journalière, `=H22*G22/100` la met dans le montant, `=G39/H39` *divise* par la quantité au lieu
de multiplier. Le script ne lit donc pas la colonne « Qté » : il **évalue la formule du total
composant par composant** (chacun mis à 1, les autres à 0) pour obtenir le coefficient réellement
appliqué. C'est ce coefficient qui est le rendement.

**Un coefficient inférieur à 1 est une production journalière déguisée.** Le script la remonte en
clair : le composant devient `PAR_JOUR` et l'ouvrage porte un `rendementJournalier`. C'est la base
mixte que `DpuCalculator.computeDeboursSec` sait traiter — l'information cesse d'être invisible.

**Les feuilles n'ont ni le même décalage ni les mêmes colonnes.** Les colonnes sont donc repérées
par intitulé, jamais par position.

## Contrôle intégré

Chaque ouvrage extrait est recalculé et comparé au total du classeur. Sur la source de
2026-07-19 : **84 ouvrages, 290 composants, 16 familles, 0 écart supérieur au centime.** Une
divergence signalerait une erreur de lecture, pas une erreur de l'entreprise.

Deux anomalies sont remontées, et sont des défauts de la source, pas de l'extraction :

| Feuille | Anomalie |
|---|---|
| `TERRASSEMENTS FONDATIONS` | composant « tractopelle marteau piqueur » à prix unitaire nul |
| `DIVERS ET ÉTANCHÉITÉ` | bloc `j1f` « Poteaux charpente » vide (`#DIV/0!`) |

## Ces valeurs ne sont pas des défauts

Le corpus produit contient **les prix et rendements d'un tenant**. Il vit dans les ressources de
test et nulle part ailleurs : ni seed, ni `ParametresEtudeService`, ni valeur par défaut. Son rôle
est d'être un cas de référence vérifiable — la preuve que le calcul est juste parce qu'il
reproduit un classeur qui existe.

Voir [`11-SOURCES-METIER.md`](../../docs/epics/etude-prix-unifiee/11-SOURCES-METIER.md) et la
règle 5bis de [`00-INDEX.md`](../../docs/epics/etude-prix-unifiee/00-INDEX.md).

## Adapter à une nouvelle source

Le script suppose des blocs délimités par un en-tête `Code Elem` et clos par un `Total HT`. Un
classeur d'une autre forme demandera d'ajuster ce repérage ; le reste (évaluation des formules,
contrôle par recalcul) est indépendant de la mise en page.

Ajouter une section à `11-SOURCES-METIER.md` : retenu / non retenu / défauts relevés.
