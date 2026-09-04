---
id: SEKTOR-311
status: done
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
---

# Consultation : créer le contact fournisseur depuis la consultation (write-through, pas d'override e-mail)

> Plan, contrat et canvas : 0 PartnerContact e-mail → promote `partners.email` ou création depuis la consultation. Pas d’e-mail orphelin sur le RFQ.

## Étapes

- [x] `00-PLAN.md` + `CONTRAT.md` AC-1…AC-7
- [x] Canvas `ux/contact-write-through-wireframe.canvas.tsx` (+ copie IDE `canvases/`)
- [x] Amender gel 28/08 dans `DECISIONS-PRODUIT.md` § 04/09
- [x] Tasks 312 (API) / 313 (UI + e2e)

## Preuves attendues

- Contrat ancré ; canvas ouvre les 4 vues (aucun e-mail, prefill, saisie, après).
- AC-6 28/08 nommé amendé, pas un override consultation-only.

## Journal

```
04/09 10:58  posée
04/09 11:10  plan + contrat + canvas + gel 04/09
04/09 11:34  status → doing
04/09 11:34  status → done
```

## Rapport de livraison

Sous-lot `consultation/contact-write-through`. Amende AC-5/AC-6 du RFQ 28/08. Tasks 312–313. Raster `agent-type.mjs` : `type: qa` legacy lu comme feature/exec (déblocage regen).
