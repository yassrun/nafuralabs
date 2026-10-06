# Capabilities — doc et roadmap

Un fichier **par capability** : état livré + roadmap dans le même document. Le catalogue technique reste [`capabilities.json`](../../capabilities.json) (id, modules, `requires`, probe).

## Tenue

- Quand on touche une capability : mettre à jour **son** fichier ici dans le même changement.
- Les docs globaux ([PLATFORM.md](../PLATFORM.md), [UI.md](../UI.md), [ROADMAP.md](../../ROADMAP.md)) gardent un **résumé** et un lien — pas de double vérité détaillée.
- Pas de fichier pour une cap tant qu’on ne l’a pas reprise : le catalogue suffit.

## Gabarit

```markdown
# <Nom> (`cap.…`)

## Identité
id, modules, requires, note actuelle (X/10)

## État
comportement livré (API, UI, permissions, tenancy, jobs)

## Contrat
ce qu’un BC / produit utilise ; pas de second mécanisme

## Hors scope
ce qu’on ne fera pas ici

## Roadmap
lots ordonnés, livrables, critères de done

## Vérifier
lab / check / chemins UI
```

## Fichiers

| Capability | Document |
|---|---|
| `cap.notifications` | [notifications.md](notifications.md) |
| `cap.audit` | [audit.md](audit.md) |
| `cap.iam` | [iam.md](iam.md) |

Les autres ids du catalogue n’ont pas encore de fichier.
