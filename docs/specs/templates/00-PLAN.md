---
kind: epic-plan
app: <app-id>                 # ex. sektor-btp
slug: <feature-slug>          # = nom du dossier + feature: PM
module: <module>              # module métier principal
pm_feature: null              # ERP-xx une fois promu ; sinon null
status: draft                 # draft | active | done
language: fr
---

# <Titre court>

> 2 lignes max — intention livrable (flux mince), pas le roman.

**Objectif** : …
**Périmètre code** : `products/<app>/backend/modules/…`, `products/<app>/web/app/…`
**Hors scope** : …

---

## 1. Verdict

Le problème en 1 paragraphe. Pourquoi maintenant. Ce qui commande l’ordre des lots.

## 2. Constat

Faits vérifiés (code / métier). Bloquants d’abord.
Pas de solution ici — seulement le diagnostic.

*(Greenfield : hypothèses métier à valider, pas audit code.)*

## 3. Cible

Comportement / modèle voulu. Schéma ou bullets.
Lien [`00-ARCHITECTURE.md`](./00-ARCHITECTURE.md) si le modèle est lourd.

## 4. Lots

| # | Lot | Intent (1 ligne) | Dépend |
|---|-----|------------------|--------|
| 1 | … | … | — |
| 2 | … | … | 1 |

Les **status / tickets** ne sont **pas** ici → [`00-PROGRESS.md`](./00-PROGRESS.md).

## 5. Décisions ouvertes

Lien : [`01-ADR-….md`](./01-ADR-….md)  
Si aucune : « aucune — prêt à découper ».

## 6. UX

- **SSOT canvas** : [`ux/<name>-wireframe.canvas.tsx`](./ux/)
- Notes WIP : [`ux/notes.md`](./ux/notes.md) (optionnel)
- Preview IDE : sync copie → `~/.cursor/projects/…/canvases/` (même nom)
- Ou `n/a` si pas d’UI

## 7. Liens PM

| Rôle | Id |
|------|-----|
| Feature | … |
| Spec / ADR | … |
| Tasks | … |

---

### DoD « PLAN prêt »

- [ ] Frontmatter complet (`slug` = nom dossier)
- [ ] Objectif = **flux mince**, pas « module complet »
- [ ] ≥ 1 lot ordonné
- [ ] ADR lié ou « aucune décision ouverte »
- [ ] `00-PROGRESS.md` créé en parallèle
