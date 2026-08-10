# Articles — contrat produit (V1)

**Statut produit** : **non-contracté** (code existant ≠ contrat)  
**Vague** : V1 (après V0 socle partner/UoM/devise)  
**Périmètre** : `backend/modules/item/`, `web/app/pages/inventory/catalogue/articles/`, familles  
**Wireframe** : [`ux/articles-fiche-wireframe.canvas.tsx`](./ux/articles-fiche-wireframe.canvas.tsx) — **à valider**  
**Règles** : [`rules.md`](./rules.md)  
**QA** : [`qa-cases.md`](./qa-cases.md)  
**Brouillon historique** : `../classification-article/` (à miner, pas à croire)

---

## 1. Flux mince

> Créer et classer un article achetable / stockable / chiffrable — **deux axes** (nature + famille) + lots d’usage optionnels.

Hors scope V1 : multi-prix avancé, variantes, nomenclatures BOM, liaison matériel complète, import massif IA production.

---

## 2. Cible

| Axe | Cardinalité | Rôle |
|-----|-------------|------|
| **Nature** | 1 (enum figé, 9 valeurs) | Comportement : stockable, valorisé, UoM défaut, poste budget, type DPU |
| **Famille d’appro** | 1 (arbre tenant, 2 niveaux) | Classement achat — zéro comportement |
| **Lots d’usage** | 0..N (enum) | Où on l’emploie sur chantier — pas une 2ᵉ famille |

`item_types` / écran « Types d’articles » : **hors modèle** (pas de table tenant pour la nature).

---

## 3. Lots d’exécution (après spec validée)

| Lot | Contenu | Gate |
|-----|---------|------|
| S0 | Canvas validé + ADR ouvertes tranchées + rules figées | `me` |
| L1 | Nature enum + API lecture + mapping DPU/budget | `qa` |
| L2 | Suppression `item_types` (API + nav) | `qa` |
| L3 | Familles arbre seed + écran | `qa` |
| L4 | Fiche / liste article alignées + création MO bout-en-bout | `qa` |
| L5 | Lots d’usage + garde nature si mouvements | `qa` |

Détail technique historique : miner `classification-article/00-PLAN.md` lots 1–5 — **rejouer sous ce contrat**.

---

## 4. DoD flux « contracté »

- [ ] Canvas validé + sync Git
- [ ] `rules.md` figé (IDs ART-R*)
- [ ] Tasks PM enfants créées, AC citent ART-R*
- [ ] Cases QA vertes sur seed
- [ ] Check progress : feature `done` seulement quand L1–L5 livrés (ou découpés explicitement)

---

## 5. Références

- ROADMAP vague V1 — articles  
- Epic historique : `docs/specs/epics/classification-article/`  
- ADR historique : `classification-article/01-ADR-decisions-ouvertes.md` (à revalider en S0)
