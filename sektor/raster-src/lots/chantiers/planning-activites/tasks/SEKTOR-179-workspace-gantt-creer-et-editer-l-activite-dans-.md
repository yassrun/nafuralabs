---
id: SEKTOR-179
status: review
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-178]
---

# Workspace Gantt — créer et éditer l'activité dans le drawer

> Parcours attendu décrit dans `00-PLAN.md` et `planning-workspace-wireframe`.

## Étapes

- [x] CTA **Nouvelle activité** + empty state (plus de mention API) — AC-13
- [x] Drawer édition : libellé, dates, parent et zone **par libellé** (pas d'UUID) — AC-14
- [x] Gantt = activités seulement, lots hors calendrier — AC-15
- [x] Renommer phase-drawer / i18n activité — AC-19
- [x] Canvas `ux/planning-workspace-wireframe.canvas.tsx` · status → review

## Journal

```
25/08 11:50  posée
25/08 11:52  status → doing
25/08 12:20  CTA + empty sans API ; drawer activite-drawer (libellé/dates/parent/zone) ; lots hors Gantt ; i18n activité
25/08 12:01  status → review
25/08 12:01  status → review
25/08 13:33  status → done-agent · gate none → done-me
25/08 14:30  status → review
25/08 20:30  status → doing
25/08 20:46  status → review
```

## Rapport de livraison

ce qui a changé — `chantiers/planning/` : CTA **Nouvelle activité**, empty state terrain, `activite-drawer` (plus `phase-drawer`), Gantt activités only, i18n `chantiers.planning.*`
critères prouvés — AC-13 CTA/empty · AC-14 drawer par libellé · AC-15 pas de barres lot · AC-19 rename/i18n (preuve e2e scénario 8 sur SEKTOR-180)
décidé seul — resté sur l’arbre de session (176–178 déjà là, pas de worktree vide) ; CTA n’est actif qu’en filtre mono-chantier ; sections rattachement déjà dans le même drawer (canvas unique)
écarts / dette — empty « via l’API » prouvé rouge-avant par constat 178 ; run e2e+UI sur 180

## Rapport de correction UX — 25/08
- Le listbox multiple est remplacé par un combobox chantier compact ; la sélection est synchronisée dans `?chantier=` et survit au rechargement.
- Filtres et actions ont une hiérarchie responsive en deux lignes sur écran moyen ; statistiques et légende sont compactées.
- Cliquer une activité ouvre le drawer complet avec libellé, dates, parent, zone, rattachement et avancement.
- Preuves : parcours navigateur CH-2026-001 → CH-2026-003, URL mise à jour, reload conservé, drawer Coffrage R+1 ouvert.
