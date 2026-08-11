---
id: OPS-02
status: doing
context: nafura
kind: feature
priority: P1
assignee: either
gate: me
feature: pm-canvas-ui
sprint: 2026-W33
tags: [pm, ux, canvas, local]
---

# Feature — UI PM Canvas (sans BDD / sans auth)

> Visualiser + agir sur le backlog markdown via Cursor Canvas.
> Menu Inbox · Backlog · Sprint ; source = fichiers `pm/` (pas de DB).

## Contraintes figées
- Pas de base de données, pas d’auth
- SSOT = fichiers markdown / INDEX (git-native)
- Canvas IDE = preview interactive ; mutations réelles via agent / `t progress` (canvas ne peut pas écrire le disque)
- Coût d’interaction : ne pas ralentir capture (&lt; 5 s) ni scan INDEX

## Livrables
- [x] Wireframe canvas validé (`pm/ux/pm-canvas-wireframe.canvas.tsx`)
- [x] Vues : Inbox / Backlog (clusters) / Sprint
- [x] Actions status locales (démo) + chemin clair vers mutate réel
- [ ] Décision : rester canvas-only ou CLI `t` d’abord pour les writes
- [ ] Sync snapshot INDEX automatique / script (hors canvas runtime)

## Journal
```
11/08 10:41  promu · idée UI PM sans BDD · sprint W33 · wireframe démarré
11/08 10:46  UX validée (humain) · 3 vues + apply agent OK
```
