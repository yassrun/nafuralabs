---
kind: epic-progress
app: sektor-btp
slug: referentiel-catalogue-sektor
pm_feature: null
updated: 2026-08-10
---

# Progress — Référentiel, coût réel et catalogue Sektor

**Statut :** doing  
**Lot courant :** — (Vague 1 terminée hors L8)  
**Ticket :** —  
**Next :** L5 gel prix · L6 polish UI chiffrage · L8 avis (indépendant)

## Lots

| # | Lot | Status | Ticket |
|---|-----|--------|--------|
| L1 | Coût de ligne (back + contrat API) | done | — |
| L2 | Référence typée composants | done | — |
| L3 | Unités facteur / base / conversion | done | — |
| L4 | Validation 4 yeux + permissions | done | — |
| L5 | Gel du prix + ResolutionPrixService | todo | — |
| L6 | Front chiffrage (sélecteur 3 origines, bandeau) | todo | — |
| L7 | Conditionnement fournisseur | todo | — |
| L8 | Avis d'exécution | todo | — |
| L9 | Rattrapage LIBRE / hors_referentiel | todo | — |
| L10 | Ouvrage composite (récursion) | todo | — |
| L11 | Comparateur fournisseurs | todo | — |
| L12 | Bibliothèque capitalisation | todo | — |
| L13 | Chaînage aval | todo | — |
| L14 | Module catalogue | todo | — |
| L15 | Rapprochement item_match | todo | — |
| L16 | Intelligence / LLM | todo | — |
| PR1 | Clause CGU catalogue | todo | — |
| PR2 | Codification (bloque L10) | todo | — |

## Phases (résumé)

| Phase | Status | Notes |
|---|---|---|
| 1 — Coût de ligne | doing | L1 done · L6 polish reste |
| 2 — Référentiel branché | doing | L2 done · L5/L9 restent |
| 3 — Ouvrage composite | todo | L10+ · PR2 |
| 4 — Fournisseurs et unités | doing | L3 done · L7 reste |
| 5–7 | todo | |
| V — Validation + avis | doing | L4 done · L8 reste |

## Notes (courtes)

- Vague 1 (L1–L4) livrée en sessions chaînées 2026-08-10.
- L1 : formule multiplicative ESTIME/FORFAIT ; `computePrixVenteHt` additif inchangé (R2).
- L2 : `ref_ouvrage_id` sur `composants_ouvrage` (parent garde `ouvrage_id`).
- L3 : conversion intra-catégorie uniquement.
- L4 : pas d’`avis_execution` (L8) ; seuil 500k → 1 niveau.
- Gradle wrapper local indisponible — tests écrits, non exécutés ici.
- Détail session : [`JOURNAL.md`](JOURNAL.md) (à migrer vers tickets PM si/quand ERP-xx).
