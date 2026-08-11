---
id: OPS-02
status: doing
context: nafura
kind: feature
priority: P1
assignee: either
gate: me
feature: raster-ui
sprint: 2026-W33
tags: [raster, ux, canvas, local]
---

# Feature — UI Raster Canvas (sans BDD / sans auth)

> Visualiser + agir sur le backlog markdown via Cursor Canvas.
> Menu Inbox · Backlog · Sprint ; source = fichiers `raster/` (pas de DB).

## Contraintes figées
- Pas de base de données, pas d’auth
- SSOT = fichiers markdown / INDEX (git-native)
- Canvas IDE = preview interactive ; mutations réelles via agent / `t progress` (canvas ne peut pas écrire le disque)
- Coût d’interaction : ne pas ralentir capture (&lt; 5 s) ni scan INDEX

## Livrables
- [x] Wireframe canvas IDE (`raster/ux/raster-canvas-wireframe.canvas.tsx`)
- [ ] **Wireframe UI produit à valider** (`products/raster/docs/specs/epics/raster-ui/ux/raster-ui-wireframe.canvas.tsx`)
- [x] Vues de base : Inbox / Backlog / Sprint (+ Check proposé)
- [x] Actions status locales (démo) + chemin clair vers mutate réel
- [ ] Décisions UX 1–4 (nav, capture, détail, AI+fallback) — gate humain
- [ ] Décision : rester canvas-only ou CLI `t` d’abord pour les writes
- [ ] Sync snapshot INDEX automatique / script (hors canvas runtime)

## Journal
```
11/08 10:41  promu · idée UI PM sans BDD · sprint W33 · wireframe démarré
11/08 10:46  UX validée (humain) · 3 vues + apply agent OK
11/08 20:20  brand Raster · pm/ → raster/ · ticket sous nafura/products/raster/
11/08 20:24  wireframe UI produit epic raster-ui · à valider (4 vues + décisions)
11/08 21:20  migrate tasks → products/*/epics/*/tasks · regen walk · canvas tree+commit
```
