# Méthode UX Nafura — Canvas wireframes

**Statut :** figée (2026-08) — méthode **principale** de design UX produit.  
**Outil :** Cursor Canvas (`.canvas.tsx`), pas Figma comme source de vérité.

## Pourquoi

Itérer le **vrai flux ERP** (états, dirty, gates, AI + manuel) à côté du chat, sans perdre de temps en pixels. Plus proche du code et des décisions métier qu’un mock Figma.

## Processus

```
Besoin UX → Canvas wireframe (états navigables)
         → Revue / itération avec le produit
         → Validation explicite
         → Sync vers docs/ux/wireframes (Git)
         → Plan d’impl
         → Code
```

## Versionnement (important)

Cursor n’affiche la preview live que depuis  
`~/.cursor/projects/<workspace>/canvases/*.canvas.tsx` (hors repo).

**Source de vérité Git :** [`wireframes/`](wireframes/) — copier le `.canvas.tsx` ici avant commit.  
Détail du sync : [`wireframes/README.md`](wireframes/README.md).

Ne pas versionner les `*.canvas.data.json` (état local de navigation).

## Règles de contenu

| Inclure | Éviter |
|---------|--------|
| Structure, hiérarchie, actions | Polish pixel / branding lourd |
| Multi-états (vide, mode A/B, dirty) | Un seul screenshot figé |
| AI + fallback manuel visible | Parcours IA-only |
| Décisions UX écrites sous le wireframe | Décisions orales non capturées |

## Référence canonique

Canvas validé : **etude-decompo-wireframe** (chiffrage étude — tree → drawer, toggle Décomposé / Prix fourni, footer Enregistrer) — versionné dans [`wireframes/etude-decompo-wireframe.canvas.tsx`](wireframes/etude-decompo-wireframe.canvas.tsx).

## Agents

Règle Cursor : `.cursor/rules/ux-canvas-wireframes.mdc` (`alwaysApply`).
