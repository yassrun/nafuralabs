---
id: SEKTOR-302
status: review
context: nafura
type: bug
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [homog, listing]
---

# Listing: double-clic ouvre le détail partout

> Clic unique = sélection (défaut anatomy toggleable). Double-clic = détail. Plus de M-TRA-02 clic unique quand selectionMode none.

## Étapes

- [x] Socle `nf-entity-listing` : clic unique ne navigue plus (sauf Master–Slave `openOnRowClick`)
- [x] `nf-data-table` : garde 250 ms même sans sélection (le double-clic annule le clic)
- [x] Listings Sektor : retirer `selectionMode: 'none'` → défaut anatomy `toggleable`
- [x] Preuve source + browser Mode B (Études + Clients)

## Preuves attendues

- `node sektor/e2e/scripts/verify-listing-dblclick-302.mjs`
- Études : un clic reste sur la liste ; double-clic ouvre le dossier

## Journal

```
01/09 11:57  posée
01/09 11:57  status → doing
01/09 12:02  socle + configs + preuve 302 source et browser verts
01/09 12:03  status → review
```

## Rapport de livraison

### Ce qui a changé

- `nf-entity-listing` n'ouvre plus le détail au premier clic (y compris `selectionMode: 'none'`). Clic = sélection ; double-clic = `routes.detail`. Exception inchangée : Master–Slave `openOnRowClick`.
- `nf-data-table` applique toujours le délai 250 ms pour que le double-clic n'émette pas un `rowClick`.
- 34 listings Sektor ne forcent plus `selectionMode: 'none'` ; ils héritent du défaut `toggleable` (comme Articles).

### Preuves exécutées

- `node sektor/e2e/scripts/verify-listing-dblclick-302.mjs` → OK source + browser Études et Clients

### Décidé seul

- Homogénéité = le défaut anatomy, pas un cas Études isolé. `none` reste possible mais n'ouvre plus au clic.
- Master–Slave (`openOnRowClick`) reste en clic unique.

### Écarts / dette

- `npx playwright test` casse ici sur un double-load Windows (`c:\` vs `C:\`) ; la preuve Raster est le script node + Chromium.
- Portefeuille chantiers n'est pas `nf-entity-listing` : hors périmètre.
