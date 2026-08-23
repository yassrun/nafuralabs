# Parcours QA étude

> Un chargé d’étude QA crée et avance un dossier **sans PDF** et **sans API de contournement**. Les bugs du walk 20/08.

## Verdict

Voie manuelle d’abord (sinon le parcours n’existe pas). Panneau consultation ensuite (même page dossier). Le reste du chrome (anomalies, clic, Partager) après. CTA création = page séparée, en tête ou parallèle interne.

## Constat

Walk QA 20/08 DE-0012 (`qa@nafuralabs.local`) : étape 1 impasse sans BDP+CPS ; consultation absente du DOM ; drawer au double-clic ; anomalies N faux ; Partager disabled ; CTA create sourd au fill natif.

## Approche technique

Front `etudes/dossiers/` : `pieces-marche`, `dossier-detail`, `bordereau-arbre`, header, page create. API `init-bordereau-manuel` déjà là. Pas de Pact — contrat `DECISIONS-PRODUIT.md` (manuel fallback + consultation).

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | SEKTOR-122 CTA créer étude | — | — |
| 2 | SEKTOR-115 Voie manuelle Documents | — | **oui** avec 1 |
| 3 | SEKTOR-119 Panneau consultation Coût | SEKTOR-115 | non |
| 4 | SEKTOR-120 Anomalies étape N | SEKTOR-115 | **oui** avec 3 |
| 5 | SEKTOR-121 Clic article → drawer | SEKTOR-115 | **oui** avec 3 |
| 6 | SEKTOR-123 Partager | SEKTOR-115 | **oui** avec 3 |

## Couverture

Walk QA 20/08. Hors : UTF-8 nœuds (SEKTOR-116), client au devis (117), Extraire rattachement (118).

## Décisions ouvertes

Partager : si le disable est le portail invité pas branché → blocked + inbox, pas inventer le portail.
