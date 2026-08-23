# Consultation études

> Un fournisseur est consulté quand un **devis reçu** est lié à la consultation de l’étude. Pas le flag DPU, pas l’AO achats.

## Verdict

Objets d’abord (sinon la gate n’a rien à compter), paramètres ensuite, identification / chrome ensuite.

## Constat

`marquerConsulte` pose `CONSULTE` à la main. Portail invité = PDF orphelin. `OffreFournisseur` = achats.

## Approche technique

Nouveaux agrégats dans `etudes/` (pas `achats/OffreFournisseur`). Paquet = `cle_stable` (SEKTOR-106). UI = canvas du lot avant chrome (SEKTOR-112).

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | SEKTOR-109 Consultation + devis reçu | SEKTOR-106 | non (autre sous-lot) |
| 2 | SEKTOR-110 Gate optionnelle / obligatoire + min N | SEKTOR-109 | non |
| 3 | SEKTOR-112 Identifier couverts + prix | SEKTOR-110 | non |

## Couverture

Gelé consultation 20/08. Fichier vs lignes pour **identifier** : SEKTOR-112 n’identifie que s’il y a des lignes ; le fichier lié compte pour le min N.

## Décisions ouvertes

Fichier seul suffit-il à identifier — **non tranché**, borné dans SEKTOR-112.
