---
id: SEKTOR-169
status: doing
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-168]
tags: [sektor, ux, anatomy]
---

# Combobox anatomy et œil fiche

> `nf-select` + `lookupKey` entité = combobox. Carte fiche. Œil : id → fiche, vide → liste. Réf. CONTRAT AC-1 AC-2 AC-5 AC-6 AC-7 AC-8 AC-14.

## Étapes

- [x] Combobox anatomy quand `lookupKey` d’entité (`nf-select` / `nf-entity-detail`). Contrat [`CONTRAT.md`](../CONTRAT.md) : **AC-1**, **AC-2**, **AC-5**. Canvas : `ux/lookup-combobox-wireframe.canvas.tsx`.
- [x] Carte route **fiche** à côté de `ERP_LOOKUP_LIST_ROUTES`. Œil : valeur posée → `/{ressource}/{id}` ; vide → liste. **AC-6**, **AC-7**. Pas d’œil sur enum / clé absente. **AC-8**.
- [x] Id orphelin : libellé de repli, pas d’UUID nu ; œil fiche si route. **AC-14**.
- [x] Enum / sans `lookupKey` : select natif inchangé. Preuve scénarios anatomy du CONTRAT.

## Journal

```
23/08 18:47  posée
23/08 18:53  status → doing
23/08 18:55  tsk1 nf-select combobox si lookupKey · util min 2 / œil fiche / orphelin
23/08 18:56  tsk2 nf-entity-detail : lookupKey → nf-select (enum reste mat-select)
23/08 19:05  preuve verify-lookup-combobox-169.mjs VERT
             (discriminerait un select natif-only / œil toujours liste)
23/08 19:21  status → review
23/08 20:31  status → doing
             QA 172 : AC-5 / lookup-clavier absent de 169.mjs (pas onComboKeydown / ↑↓ / Entrée / Échap)
```

## Rapport de livraison

ce qui a changé      `nf-select` devient combobox dès qu’un `lookupKey` est posé (sinon `<select>` natif). Œil : id → `{liste}/{id}`, vide → liste. Orphelin : « Enregistrement introuvable », pas d’UUID nu. `nf-entity-detail` branche `nf-select` sur les champs lookup.
critères prouvés     AC-1,2,5,6,7,8,14 → `sektor/e2e/scripts/verify-lookup-combobox-169.mjs` VERT. Discrimination : absence de `role="combobox"` / min 2 / `{list}/{id}` ferait échouer le script.
décidé seul          Combobox dès `lookupKey` renseigné (pas seulement si la clé est dans la carte) — l’œil reste masqué si aucune route. `selectedLabel` pour un libellé connu hors options.
écarts / dette       Hits encore filtrés en local sur les `options` dumpées — la recherche serveur est SEKTOR-170. Pas de `ng test` anatomy isolé ; preuve source + util.
