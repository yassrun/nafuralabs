---
id: SEKTOR-280
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-279]
tags: [achats, consultation]
---

# Envoyer la consultation (journal mail)

> CTA Envoyer : un mail par destinataire non encore journalisé. Panier figé après le 1er envoi ; renvoi aux nouveaux seulement.

## Étapes

- [x] POST envoyer + table journal (destinataire, e-mail, date). `EmailService.sendEmail` (no-op lab OK).
- [x] CTA fiche **Envoyer la consultation** (AC-8) ; désactivé si 0 destinataire non envoyé.
- [x] 1er envoi → panier figé (AC-10). Ajout destinataire encore possible.
- [x] Renvoi : uniquement les destinataires absents du journal.
- [x] Tableau journal sur la fiche (AC-9).
- [x] Script `sektor/e2e/scripts/verify-consultation-rfq-280.mjs`.

## Preuves attendues

Ancrage : [`CONTRAT.md`](../CONTRAT.md) **AC-8…AC-10**.

```bash
make -C nafura-platform/ops mode-b
node sektor/e2e/scripts/verify-consultation-rfq-280.mjs
```

Scénarios : `rfq-envoyer-journal` ; `rfq-panier-fige` ; `rfq-renvoi-nouveaux`. Pas d’exigence Brevo Mode B — le journal suffit.

## Journal

```
28/08 18:49  posée
28/08 19:37  status → doing
28/08 19:50  livré AC-8…10 : journal SQL 007, POST /envoyer, panier figé, CTA + tableau fiche ; 280 + 279 verts
28/08 19:55  status → review
28/08 19:56  reprise abort : Mode B 8082 relancé ; 1er 280 rouge (CTA disabled race) ; wait inner button ; 280 CS-2026-0065 + 279 CS-2026-0067 verts
28/08 19:57  status → review
28/08 19:59  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Livré (AC-8, AC-9, AC-10)**
- Table `consultation_achat_envois` (Liquibase v1.1 `007_consultation_achat_envois.sql`) : consultation_id, destinataire_id, email, sent_at ; unique destinataire déjà journalisé.
- `POST /api/v1/consultations-achat/{id}/envoyer` : 4xx si 0 destinataire ; un mail par dest absent du journal, à l’e-mail de son contact ; corps n° + lignes panier (code / désignation, `cle_stable` si catalogue indispo) ; `EmailService.sendEmail` (no-op / exception → journal quand même).
- Réponse : consultation + `envois[]`. 1er envoi : `PREPARATION` → `OUVERTE` (AC-12 dérivé simple ; pas PARTIELLE/COMPLETE).
- PATCH panier après 1re ligne journal → 4xx `consultation.panier.fige`. Ajout destinataire reste possible ; 2e POST n’envoie que les nouveaux.
- Fiche : CTA `consultation-envoyer` (désactivé si 0 dest non envoyé) ; tableau journal ; message panier figé.

**Hors** : import magique ciblé, PARTIELLE/COMPLETE, listing k/n (281).

**Preuves**

```
$ cd sektor/sources/backend && ./gradlew :sektor:achats:test --tests ma.nafura.achats.service.ConsultationAchatServiceTest
BUILD SUCCESSFUL
```

```
$ node sektor/e2e/scripts/verify-consultation-rfq-280.mjs
PASS rfq-envoyer-journal (source)
PASS rfq-envoyer-journal CS-2026-0059
PASS rfq-panier-fige
PASS rfq-renvoi-nouveaux
PASS rfq-envoyer-journal (browser)
OK verify-consultation-rfq-280 AC-8…AC-10
```

```
$ node sektor/e2e/scripts/verify-consultation-rfq-279.mjs
PASS rfq-create-panier (source create)
PASS rfq-create-panier CS-2026-0061
PASS rfq-refus-sans-email
PASS rfq-deux-destinataires
PASS rfq-refus-sans-email (browser)
PASS rfq-deux-destinataires (browser)
OK verify-consultation-rfq-279 AC-1…AC-7
```

Browser (Playwright dans 280) : fiche 2 dest → Envoyer → journal 2 lignes + panier figé ; PATCH article 4xx ; 3e dest → renvoyer → 3e ligne journal.

**Décidé seul**
- Statut `OUVERTE` dès la 1re ligne de journal si encore `PREPARATION` (AC-12, sans PARTIELLE/COMPLETE).
- Lookup catalogue optionnel pour le corps mail ; fallback `cle_stable`.
- `EmailService` via `ObjectProvider` + catch : Mode B no-op ne fait pas échouer l’envoi.
- Table journal appliquée au Postgres staging (pod) pour Hibernate `validate` Mode B ; changelog 007 reste la source Liquibase.

**Reprise (après abort)** — produit inchangé. Preuve browser : attendre `button.disabled` (journal DOM avant input `nf-button`). 8082 était down → `mode-b.sh start`.

```
$ node sektor/e2e/scripts/verify-consultation-rfq-280.mjs
PASS rfq-envoyer-journal (source)
PASS rfq-envoyer-journal CS-2026-0065
PASS rfq-panier-fige
PASS rfq-renvoi-nouveaux
PASS rfq-envoyer-journal (browser)
OK verify-consultation-rfq-280 AC-8…AC-10
```

```
$ node sektor/e2e/scripts/verify-consultation-rfq-279.mjs
PASS rfq-create-panier (source create)
PASS rfq-create-panier CS-2026-0067
PASS rfq-refus-sans-email
PASS rfq-deux-destinataires
PASS rfq-refus-sans-email (browser)
PASS rfq-deux-destinataires (browser)
OK verify-consultation-rfq-279 AC-1…AC-7
```

**Écarts / dette**
- Import magique encore orphelin sur la fiche (281).
- Listing k/n devis + badge PARTIELLE/COMPLETE (281).
- Changelog 007 pas encore passé par le Job K8s lifecycle (CREATE IF NOT EXISTS, idempotent).

## Rapport QA

**Verdict : PASS** — AC-8…AC-10 couverts. Mode B déjà up (`8082`/`4200` HTTP 200). Owner `qa@nafuralabs.local` via `POST /api/public/dev/cursor-session`. Pas de skip.

### Preuves exécutées (sans réécriture)

```
$ node sektor/e2e/scripts/verify-consultation-rfq-280.mjs
PASS rfq-envoyer-journal (source)
PASS rfq-envoyer-journal CS-2026-0070
PASS rfq-panier-fige
PASS rfq-renvoi-nouveaux
PASS rfq-envoyer-journal (browser)
OK verify-consultation-rfq-280 AC-8…AC-10
```

exit 0 · ~16 s

### Scénarios → AC observés

| Scénario | AC | Observé |
|---|---|---|
| `rfq-envoyer-journal` | AC-8, AC-9 | PASS — 0 dest → 4xx `consultation.envoyer.sans_destinataire` ; 2 dest → journal 2 lignes (destinataire, e-mail contact, `sentAt`) ; statut `OUVERTE` ; 2e POST sans nouveau dest n’ajoute pas de ligne ; CTA fiche + tableau journal |
| `rfq-panier-fige` | AC-10 | PASS — PATCH panier après 1er envoi → 4xx `consultation.panier.fige` ; `clesStables` inchangé |
| `rfq-renvoi-nouveaux` | AC-8, AC-10 | PASS — 3e dest encore possible après fige ; POST n’envoie que le nouveau (journal 2 → 3, mail Holcim) ; UI CTA réactivé puis 3e ligne journal |

Les tests discriminent : 0 dest échouerait si l’envoi passait en 2xx ; le panier figé échouerait si le PATCH 200 mutait `clesStables` ; le renvoi échouerait si le 2e POST re-journalisait les 2 premiers, ou si l’ajout dest était refusé après fige.

**Hors ancrage 280** : AC-11…AC-15 (281/282). Import magique encore orphelin — dette 281, pas un fail ici.
