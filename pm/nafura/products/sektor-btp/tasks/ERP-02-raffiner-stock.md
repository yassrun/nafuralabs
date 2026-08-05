---
id: ERP-02
status: todo
context: nafura
assignee: me
priority: P1
estimate: 8h
blocked_by: [ERP-23]
tags: [sektor, stock, raffinement]
---

# Raffiner stock (lot 2)

> Mouvements / dépôts sur le catalogue. Alimente l’appro.
> Bloqué par ERP-23 (front natures alignées — feature classification-article).

## Critères d'acceptation
- [ ] Dépôts + mouvements entrée/sortie
- [ ] Lien article (natures ERP-18…) obligatoire
- [ ] Rattachement `chantier_id` possible (chantier minimal OK)
- [ ] Flux lisible sans planif Gantt

## Journal
```
05/08 11:27  capturé · ordre raffinement lots ops figé
05/08 13:32  balayage · blocked_by → ERP-23 (ex ERP-01 mergé)
```
