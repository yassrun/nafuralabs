---
id: SEKTOR-282
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-279, SEKTOR-280, SEKTOR-281]
tags: [achats, consultation]
---

# Preuves destinataires-envoi-suivi

> Verdict indépendant Mode B owner sur AC-1…AC-15. Agrégat 279–281 + non-régression 135 / 249 adaptée.

## Étapes

- [x] `make -C nafura-platform/ops mode-b` — owner `qa@nafuralabs.local`.
- [x] Jouer 279, 280, 281 puis l’agrégat 282. Graphe dans la preuve, pas de seed demo.
- [x] Scénarios CONTRAT : create panier ; refus sans e-mail ; ≥ 2 destinataires ; envoyer → journal ; panier figé ; import 1 destinataire → PARTIELLE ; 2e devis → COMPLETE.
- [x] Non-régression `verify-consultation-achat-135.mjs` / `249.mjs` **dans la mesure du nouveau modèle**. Si 249 encore rouge : étendre 134/135 (dette nommée CONTRAT) — ne pas rouvrir overlay 139.
- [x] Verdict dans ce rapport. Seul le QA pose `done-agent` sur 279–281.

## Preuves attendues

Ancrage : [`CONTRAT.md`](../CONTRAT.md) tous les AC.

```bash
make -C nafura-platform/ops mode-b
node sektor/e2e/scripts/verify-consultation-rfq-282.mjs
```

282 orchestre 279+280+281. Identité owner. Front `http://127.0.0.1:4200`, API `http://localhost:8082`.

## Journal

```
28/08 18:49  posée
28/08 20:29  status → doing
28/08 20:35  QA PASS AC-1…15 — agrégat 279+280+281 (pas de 282.mjs) ; 135 vert ; 249 rouge 137 (POST /devis sans destinataireId)
28/08 20:32  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Verdict agrégat : PASS** — AC-1…AC-15 couverts. Mode B déjà up (`8082`/`4200` HTTP 200). Owner `qa@nafuralabs.local`. Pas de skip. `verify-consultation-rfq-282.mjs` **absent** : l’agrégat **est** 279 + 280 + 281.

279, 280, 281 déjà `done-me` — non retouchés.

### Preuves exécutées (sans réécriture)

```
$ node sektor/e2e/scripts/verify-consultation-rfq-279.mjs
PASS rfq-create-panier (source create)
PASS rfq-create-panier CS-2026-0076
PASS rfq-refus-sans-email
PASS rfq-deux-destinataires
PASS rfq-refus-sans-email (browser)
PASS rfq-deux-destinataires (browser)
OK verify-consultation-rfq-279 AC-1…AC-7
```

exit 0 · ~22 s

```
$ node sektor/e2e/scripts/verify-consultation-rfq-280.mjs
PASS rfq-envoyer-journal (source)
PASS rfq-envoyer-journal CS-2026-0079
PASS rfq-panier-fige
PASS rfq-renvoi-nouveaux
PASS rfq-envoyer-journal (browser)
OK verify-consultation-rfq-280 AC-8…AC-10
```

exit 0 · ~15 s

```
$ node sektor/e2e/scripts/verify-consultation-rfq-281.mjs
PASS rfq-import-un-destinataire (source)
PASS rfq-import-un-destinataire CS-2026-0081
PASS rfq-second-devis-complet
PASS rfq-listing-kn (api)
PASS rfq-listing-kn (browser)
OK verify-consultation-rfq-281 AC-11…AC-15
```

exit 0 · ~23 s

```
$ node sektor/e2e/scripts/verify-consultation-achat-135.mjs
ok chrome fiche Import magique, pas textarea cle=prix
ok import confirmé CS-2026-0082 1 devis / 2 lignes, vide n’incrémente pas
```

exit 0 · ~4 s — 135 étendu au nouveau modèle (`destinataireId` obligatoire ; fichier vide n’incrémente pas).

```
$ node sektor/e2e/scripts/verify-consultation-achat-249.mjs
=== SEKTOR-249 — consultation Achats (agrégat) ===
SKIP 136 — overlay formulaire remplacé par 139
>>> 134  OK (CS-2026-0083)
>>> 135  OK (CS-2026-0085)
>>> 137  FAIL import hors 400 {"code":"consultation.devis.destinataire.obligatoire"}
>>> 139  OK (CS-2026-0087…0091)
=== Bilan : 3/4 scripts OK · 136 skipped ===
```

exit 1 — **dette nommée CONTRAT**, pas un fail AC-1…15.

### Scénarios → AC observés

| Scénario | AC | Observé |
|---|---|---|
| `rfq-create-panier` | AC-1, AC-2, AC-3, AC-7 | PASS — `/new` sans fournisseur ; picker panier ; POST sans dest → `PREPARATION` ; `fournisseurId` ignoré |
| `rfq-refus-sans-email` | AC-5, AC-6 | PASS — 4xx + lien fiche fournisseur |
| `rfq-deux-destinataires` | AC-4, AC-6, AC-7 | PASS — 2 dest ; doublon 4xx ; N contacts borné |
| `rfq-envoyer-journal` | AC-8, AC-9 | PASS — journal = preuve (Brevo no-op OK) |
| `rfq-panier-fige` | AC-10 | PASS — ajout/retrait article 4xx après 1er envoi |
| `rfq-renvoi-nouveaux` | AC-8, AC-10 | PASS — nouvel envoi seulement aux dest absents du journal |
| `rfq-import-un-destinataire` | AC-11, AC-14, AC-15 | PASS — 1 import confirmé → `PARTIELLE` |
| `rfq-second-devis-complet` | AC-12, AC-15 | PASS — 2e devis → `COMPLETE` |
| `rfq-listing-kn` | AC-13 | PASS — destinataires + avancement k/n (API + browser) |

Les tests discriminent : refus 4xx (pas un 201 masqué) ; import orphelin sans `destinataireId` → 4xx ; 1 devis / 2 dest → `PARTIELLE` (échouerait si `COMPLETE`) ; 2e devis → `COMPLETE`.

### Écarts / dette

- **249 / 137** — `verify-consultation-achat-137.mjs` POST `/devis` **sans** `destinataireId` → 400 `consultation.devis.destinataire.obligatoire`. Attendu AC-14/AC-15. Script 137 **non réécrit** (dette nommée CONTRAT ; overlay / flag 137 **hors** sous-lot).
- **134 et 139** dans 249 : verts. Overlay 139 non rouvert.
- **282.mjs** : pas livré ; agrégat = 279+280+281 (consigne QA).
