---
id: SEKTOR-281
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-280]
tags: [achats, consultation]
---

# Suivi + devis par fournisseur + statut dérivé

> Import magique ciblé sur un destinataire. Statuts EN_ATTENTE / DEVIS_RECU et consultation dérivée. Listing k/n.

## Étapes

- [x] `destinataire_id` obligatoire sur le devis ; import orphelin → 4xx (AC-14).
- [x] CTA import **par ligne** destinataire ; moteur 135 inchangé. Un devis qui compte par destinataire (AC-15).
- [x] Statut destinataire `EN_ATTENTE` | `DEVIS_RECU` (AC-11). Consultation `PREPARATION` | `OUVERTE` | `PARTIELLE` | `COMPLETE` (AC-12).
- [x] Listing : plus colonne fournisseur unique ; destinataires + avancement k/n (AC-13). Conserver `devisRecus`.
- [x] Étendre `verify-consultation-achat-135.mjs` (`destinataireId`, plus `statut: DEVIS_RECU` unique).
- [x] Script `sektor/e2e/scripts/verify-consultation-rfq-281.mjs`.

## Preuves attendues

Ancrage : [`CONTRAT.md`](../CONTRAT.md) **AC-11…AC-15**.

```bash
make -C nafura-platform/ops mode-b
node sektor/e2e/scripts/verify-consultation-rfq-281.mjs
```

Scénarios : `rfq-import-un-destinataire` → PARTIELLE ; `rfq-second-devis-complet` → COMPLETE ; `rfq-listing-kn`.

## Journal

```
28/08 18:49  posée
28/08 19:59  status → doing
28/08 20:26  livré AC-11…15 : destinataire_id NOT NULL, import ciblé, PARTIELLE/COMPLETE, listing k/n ; 281 + 135 verts
28/08 20:26  status → review
28/08 20:30  QA PASS — 281 + 135 verts (CS-2026-0075 / CS-2026-0074)
28/08 20:28  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Livré (AC-11…AC-15)**
- Liquibase lab `008_consultation_achat_devis_destinataire.sql` : `destinataire_id` NOT NULL + unique (un devis qui compte par dest). Devis orphelins droppés.
- `POST .../devis` exige `destinataireId` de **cette** consultation (sinon 4xx). Fichier sans extraction → 400, pas de devis. Re-import confirmé **remplace**. Destinataire → `DEVIS_RECU`. Consultation dérivée `PREPARATION` | `OUVERTE` | `PARTIELLE` | `COMPLETE`. `devisRecus` = nombre de dest en `DEVIS_RECU`.
- Fiche : CTA import **par ligne** (`consultation-destinataire-import`). Plus de trigger orphelin sur le bloc global. Moteur `devis-consultation` (SEKTOR-135) inchangé ; `destinataireId` passé au POST.
- Listing anatomy : destinataires (libellés) + avancement **k/n · statut dérivé**. Pas de colonne « le » fournisseur unique.

**Décidé seul**
- Priorité statut : COMPLETE (tous DEVIS_RECU) > PARTIELLE (≥1 devis et ≥1 EN_ATTENTE) > OUVERTE (≥1 envoi, 0 devis) > PREPARATION. Ajouter un dest après COMPLETE → PARTIELLE.
- Bloc `consultation-achat-import` conservé en **extrait** (sans trigger) pour ne pas casser le chrome 279.

**Dette / hors**
- `verify-consultation-achat-137.mjs` / agrégat 249 postent encore `/devis` sans `destinataireId` → 4xx. Capturé inbox ; étendre dans **SEKTOR-282**. Overlay / flag 137 non touchés.

**Preuves**

```
$ ./gradlew :sektor:achats:test --tests ma.nafura.achats.service.ConsultationAchatServiceTest
BUILD SUCCESSFUL
```

```
$ node sektor/e2e/scripts/verify-consultation-rfq-281.mjs
PASS rfq-import-un-destinataire (source)
PASS rfq-import-un-destinataire CS-2026-0072
PASS rfq-second-devis-complet
PASS rfq-listing-kn (api)
PASS rfq-listing-kn (browser)
OK verify-consultation-rfq-281 AC-11…AC-15
```

```
$ node sektor/e2e/scripts/verify-consultation-achat-135.mjs
ok chrome fiche Import magique, pas textarea cle=prix
ok import confirmé CS-2026-0073 1 devis / 2 lignes, vide n’incrémente pas
```

## Rapport QA

**Verdict : PASS** — AC-11…AC-15 couverts. Mode B déjà up (`8082`/`4200` HTTP 200). Owner `qa@nafuralabs.local` via `POST /api/public/dev/cursor-session`. Pas de skip.

### Preuves exécutées (sans réécriture)

```
$ node sektor/e2e/scripts/verify-consultation-rfq-281.mjs
PASS rfq-import-un-destinataire (source)
PASS rfq-import-un-destinataire CS-2026-0075
PASS rfq-second-devis-complet
PASS rfq-listing-kn (api)
PASS rfq-listing-kn (browser)
OK verify-consultation-rfq-281 AC-11…AC-15
```

exit 0 · ~20 s

```
$ node sektor/e2e/scripts/verify-consultation-achat-135.mjs
ok chrome fiche Import magique, pas textarea cle=prix
ok import confirmé CS-2026-0074 1 devis / 2 lignes, vide n’incrémente pas
```

exit 0 · ~3 s

### Scénarios → AC observés

| Scénario | AC | Observé |
|---|---|---|
| `rfq-import-un-destinataire` | AC-11, AC-14, AC-15 | PASS — import orphelin sans `destinataireId` → 4xx ; 1er import Lafarge → dest `DEVIS_RECU`, Sika `EN_ATTENTE`, consultation `PARTIELLE`, `devisRecus=1` ; CTA import par ligne (source + browser) |
| `rfq-second-devis-complet` | AC-12, AC-15 | PASS — 2e import Sika → `COMPLETE`, `devisRecus=2`, tous dest `DEVIS_RECU` ; re-import Lafarge reste `COMPLETE` / 2 devis |
| `rfq-listing-kn` | AC-13 | PASS — listing API libellés Lafarge/Sika (pas UUID), statut `COMPLETE` ; browser `2/2` + badge Complète |
| 135 import magique | AC-14, moteur 135 | PASS — trigger par ligne, pas orphelin global, pas textarea ; vide n’incrémente pas (`PREPARATION`) ; 1 dest → `COMPLETE` + 2 lignes persistées |

Les tests discriminent : orphelin 2xx échouerait AC-14 ; 1er import `COMPLETE` échouerait AC-15 (`PARTIELLE` exige ≥1 `EN_ATTENTE`) ; listing sans `2/2` ou avec UUID échouerait AC-13 ; 135 vide qui incrémente `devisRecus` échouerait le moteur.

**Hors ancrage 281** : 137 / 249 orphelins sans `destinataireId` — dette **SEKTOR-282**, pas un fail ici.
