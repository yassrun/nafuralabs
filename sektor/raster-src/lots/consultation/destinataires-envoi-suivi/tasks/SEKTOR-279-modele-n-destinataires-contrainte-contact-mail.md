---
id: SEKTOR-279
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-278]
tags: [achats, consultation]
---

# Modèle N destinataires + contrainte contact mail

> Drop `fournisseur_id`. Create = panier seulement. Fiche : ajouter N destinataires avec contact mail obligatoire.

## Étapes

- [x] Liquibase clean : drop `consultations_achat.fournisseur_id` ; table destinataires (fournisseur + contact, unique par consult).
- [x] Create API / UI : plus de `fournisseurId` obligatoire ; l’ignorer s’il est encore posté (AC-3). `/new` = panier picker, 0 champ fournisseur (AC-1, AC-2, AC-7).
- [x] POST destinataire : combobox fournisseurs ; refus sans `PartnerContact.email` + lien fiche (AC-4, AC-5, AC-6) ; pas de doublon.
- [x] Binding contact : 0 → refus ; 1 → auto ; N → choix borné.
- [x] Étendre `verify-consultation-achat-134.mjs` au create sans assert `fournisseurId`.
- [x] Script `sektor/e2e/scripts/verify-consultation-rfq-279.mjs`.

## Preuves attendues

Ancrage : [`CONTRAT.md`](../CONTRAT.md) **AC-1…AC-7**.

```bash
make -C nafura-platform/ops mode-b
node sektor/e2e/scripts/verify-consultation-rfq-279.mjs
```

Scénarios : `rfq-create-panier` ; `rfq-refus-sans-email` ; `rfq-deux-destinataires`. Owner `qa@nafuralabs.local`. Graphe dans la preuve.

## Journal

```
28/08 18:49  posée
28/08 18:55  status → doing
28/08 19:35  reprise : audit AC-1…7 (déjà livré) ; listing libellés+(n) ; label combobox ; N contacts (API+UI+tests) ; preuves 279/134 vertes
28/08 19:34  status → review
28/08 19:41  QA — Mode B up ; 279 + 134 exécutés ; PASS AC-1…AC-7
28/08 19:36  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Reprise** : modèle déjà dans le dépôt (SQL 006, entité/repo/DTO, POST `/{id}/destinataires`, create ignore `fournisseurId`, UI create panier-only, fiche destinataires + refus sans mail). Pas recodé.

**Trous comblés cette passe**
- Listing : colonne destinataires = libellés fournisseur, pas UUID ; format `Lafarge, Sika (2)`.
- Combobox fiche : conserve le label lookup (évite « Enregistrement introuvable » après sélection).
- AC-6 N contacts : API 4xx `contact_requis` sans `contactId` ; bind du contact choisi ; select borné côté fiche ; tests unitaires + scénario e2e.
- i18n destinataires déjà présent (fr/en/ar) — rien à ajouter.

**Hors** : Envoyer / journal (280), import ciblé + k/n devis (281).

**Preuves** (Mode B déjà up, changelog 006 en place — POST destinataires 201, pas 404/500) :

```
$ node sektor/e2e/scripts/verify-consultation-rfq-279.mjs
PASS rfq-create-panier (source create)
PASS rfq-create-panier CS-2026-0045
PASS rfq-refus-sans-email
PASS rfq-deux-destinataires
PASS rfq-refus-sans-email (browser)
PASS rfq-deux-destinataires (browser)
OK verify-consultation-rfq-279 AC-1…AC-7
```

```
$ node sektor/e2e/scripts/verify-consultation-achat-134.mjs
ok chrome Achats /consultations, pas Études
ok create hors étude CS-2026-0048 liste /achats/consultations, DA n’en crée pas
```

```
$ cd sektor/sources/backend && ./gradlew :sektor:achats:test --tests ma.nafura.achats.service.ConsultationAchatServiceTest
BUILD SUCCESSFUL
```

Browser (Playwright dans 279, pas de MCP browser) : `/new` sans champ fournisseur → picker panier → fiche → refus sans mail + lien `/achats/fournisseurs/{id}` → 2 destinataires avec contact → select borné si N contacts.

**Décidé seul**
- Format listing `noms (n)` dès 279 (AC-13 k/n devis reste 281).
- N contacts couvert dans 279 (API + select UI) plutôt que de le laisser implicite.

**Écarts / dette**
- Create `/new` : copy FR en dur (déjà UX pro) — pas i18nné.
- Overlay 139 peut encore poster `fournisseurId` (ignoré, AC-3) — hors.
- Import magique encore orphelin sur la fiche (281).

## Rapport QA

**Verdict : PASS** — AC-1…AC-7 couverts. Mode B déjà up (`8082`/`4200` HTTP 200). Owner `qa@nafuralabs.local` via `POST /api/public/dev/cursor-session`. Pas de skip.

### Preuves exécutées (sans réécriture)

```
$ node sektor/e2e/scripts/verify-consultation-rfq-279.mjs
PASS rfq-create-panier (source create)
PASS rfq-create-panier CS-2026-0050
PASS rfq-refus-sans-email
PASS rfq-deux-destinataires
PASS rfq-refus-sans-email (browser)
PASS rfq-deux-destinataires (browser)
OK verify-consultation-rfq-279 AC-1…AC-7
```

exit 0 · ~40 s

```
$ node sektor/e2e/scripts/verify-consultation-achat-134.mjs
ok chrome Achats /consultations, pas Études
ok create hors étude CS-2026-0053 liste /achats/consultations, DA n’en crée pas
```

exit 0 · ~10 s

### Scénarios → AC observés

| Scénario | AC | Observé |
|---|---|---|
| `rfq-create-panier` | AC-1, AC-2, AC-3, AC-7 | PASS — `/new` sans champ fournisseur ; picker panier ; POST sans `fournisseurId` → `PREPARATION` + 0 dest ; `fournisseurId` posté ignoré |
| `rfq-refus-sans-email` | AC-5, AC-6 | PASS — 4xx `consultation.destinataire.sans_email` (même avec `partners.email` fallback) ; UI message + lien `/achats/fournisseurs/{id}` |
| `rfq-deux-destinataires` | AC-4, AC-6, AC-7 | PASS — 2 dest `EN_ATTENTE` ; doublon 4xx ; N contacts sans `contactId` → `contact_requis` ; bind du contact choisi ; select borné UI |
| 134 étendu | AC-3, create hors étude | PASS — create sans assert fournisseur unique ; `fournisseurId` posté n’attache aucun destinataire ; create sans `fournisseurId` 201 + dest vides |

Les tests discriminent : refus 4xx attendu (pas un 201 masqué) ; AC-3 échouerait si un destinataire était créé depuis `fournisseurId` ; AC-6 N contacts échouerait si l’API auto-bindait sans `contactId`.

**Hors ancrage 279** : AC-8…AC-15 (280/281/282). Import magique encore orphelin sur la fiche — dette 281, pas un fail ici.
