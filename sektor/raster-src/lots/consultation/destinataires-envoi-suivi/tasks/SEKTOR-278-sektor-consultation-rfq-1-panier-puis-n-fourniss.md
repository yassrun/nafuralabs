---
id: SEKTOR-278
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: me
tags: [sektor]
---

# sektor consultation RFQ : 1 panier puis N fournisseurs (contact mail obligatoire) ; envoyer ; statut selon devis reçus (1 devis / fournisseur) ; hors études

> Plan + contrat + canvas + découpe 279–282. Gel 28/08 qui casse « un fournisseur ».

## Étapes

- [x] `00-PLAN.md` + `CONTRAT.md` (AC-1…AC-15)
- [x] Canvas SSOT `ux/destinataires-envoi-suivi-wireframe.canvas.tsx` (+ copie IDE `canvases/`)
- [x] Gel `DECISIONS-PRODUIT.md` § 28/08 ; `LOT.md` pointe le sous-lot
- [x] Tasks CLI 279–282 (`gate: none`, série, 278 = seule gate:me)
- [x] `node raster/t.mjs check`

## Preuves attendues

- `node raster/t.mjs check` sans erreur
- IDs réels dans le PLAN
- Aucune Question bloquante (humain a tranché)

## Journal

```
28/08 18:44  posée
28/08 18:46  status → doing
28/08 18:55  livré — plan, contrat, canvas, gel 28/08, tasks 279–282
28/08 18:52  status → done-agent
28/08 18:53  toi · approuvée → done-me
```

## Rapport de livraison

**Changé.** Sous-lot `destinataires-envoi-suivi/` : PLAN, CONTRAT (AC-1…AC-15), canvas 12 vues, gel produit 28/08 qui casse le grain « un fournisseur » du 22/08. LOT consultation pointe le RFQ (chrome 134–265 livré). Tasks 279 modèle, 280 envoi, 281 suivi/devis, 282 QA.

**Preuves.** `node raster/t.mjs check`. Pas de code produit.

**Décidé seul (aligné reco humaine, pas de Question).** Pas de wizard : `/new` = panier, fiche = destinataires. Codes : destinataire `EN_ATTENTE` | `DEVIS_RECU` ; consultation `PREPARATION` | `OUVERTE` (libellé « En attente de réponses ») | `PARTIELLE` | `COMPLETE`. Contact : 0 refuse, 1 auto, N choix borné. `fournisseurId` au create **ignoré** (overlay 139). Re-import remplace, 1 devis qui compte / destinataire. Doublon fournisseur refusé.

**Écarts / dette.** Overlay 139 create/liste encore « 1 fournisseur » — hors. e2e 134 étendu dans 279 ; 135 dans 281 ; agrégat 249 dans 282 si encore rouge. Flag CONSULTÉ / gate N hors ; conserver `devisRecus`.
