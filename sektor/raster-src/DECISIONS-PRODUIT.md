# Décisions produit — Sektor Études (avant Pact)

> Journal vivant **avant** CADRE / SPEC / CH / PLAN.
> Pas du code. Pas un ticket. On gèle ici, on spécifie après.
>
> Arbre des dossiers code : [`DECISIONS.md`](DECISIONS.md).
>
> Comment continuer : ajouter une entrée datée sous **Gelé** ou **Ouvert**. Une fois gelé, on ne rejoue pas le débat dans le chat — on amende ce fichier.

Dernière passe : 17/08/2026.

---

## Trois couches (à geler)

Le bordereau mélange trois objets. Les coller dans le même référentiel casse Extraire, le stock, et la bibliothèque.

| Couche | Quoi | Où ça vit | Référentiel tenant ? |
|--------|------|-----------|----------------------|
| **Poste** | Ligne de *ce* marché (qty, libellé BDP, DPU de l’étude) | Arbre DPGF du dossier | **Non** — jamais un article catalogue |
| **Composant** | Matière / MO / matériel / ST d’un DPU | Lignes DPU du poste | **Oui, si réutilisable** → article catalogue tenant |
| **Ouvrage** | Recette réutilisable (composants + rendements) | Bibliothèque de prix (`catalogue/`) | **Oui, après étude** — pas un article |

**Réponse à la question :** un poste décomposé **n’est pas** ajouté au référentiel **articles** « avec ses composants ». Les composants peuvent devenir des **articles**. Le poste comme recette devient un **ouvrage** (capitalisation), pas un item stock.

---

## Cycle cible — chiffrer un poste déjà décomposé

Ordre voulu. Ce qui n’est pas dans cette liste n’est pas le flux.

1. **Ouvrir le poste** sur le bordereau (instance d’étude, pas une fiche catalogue).
2. **Descriptif métier** : écrire / coller, **enregistrer**. Extraire ne lit pas le textarea live — seulement le descriptif persisté + libellé + jusqu’à 4 extraits CPS.
3. **Extraire** (IA d’abord, catalogue ensuite) :
   - Gemini propose des **besoins** (désignation, type, unité, rendement).
   - Le resolver catalogue tenant match (score ≥ 0.5 + prix consultable) → composant **lié** à un article existant.
   - Sinon → **manquant**.
4. **Trancher chaque manquant, pendant le chiffrage** (pas plus tard, pas tout seul) :
   - **Créer dans le catalogue** → article tenant + tarif, puis lien DPU. Prochain Extraire pourra matcher.
   - **Ajouter au poste seulement** → composant manuel, one-shot, pas d’article.
   - **Depuis le catalogue** → picker explicite d’un article déjà là.
5. **Ajuster** rendements / PU / sous-détail, **enregistrer le DPU**.
6. **Chiffrer le poste** (coût → PV / marge). Le poste reste une ligne d’étude.
7. Répéter 1–6 sur les autres postes.
8. **Valider** le dossier (`VALIDEE` / devis généré).
9. **Capitaliser** (opt-in, panneau dédié, **pas** auto à la validation) : les postes décomposés utiles → **ouvrages** bibliothèque, avec leurs composants et rendements. Collision = créer / remplacer / nouveau code / ignorer.

Interdit dans ce cycle :

- Créer un **article** pour le poste lui-même.
- Auto-créer des articles à Extraire.
- Verser en ouvrage **pendant** le chiffrage.
- Confondre `/catalogue` (console interne Nafura / G2) avec `/inventory/catalogue/articles` (articles tenant) ou `/etudes/bibliotheque-prix` (ouvrages).

---

## Gelé (17/08/2026)

### Chrome études

- **Métrés & Quantitatifs** (`/etudes/metres`) : hors menu **et** hors code. Ancien takeoff (L×l×h → DPGF `createFromMetre`). Le chemin dossier vit par `createEmpty` / `createFromImport` avec `metreId = null`. Blast : API `/etudes/metres`, entité, `createFromMetre`, `metreId` sur DPGF / devis / AO, seeds, lookups. Pas encore implémenté — inbox.
- **Console catalogue Sektor** (`/catalogue`) : **pas pour le tenant**. Outil interne Nafura (candidats / éditions G2). Hors chrome études. Ce n’est **pas** le référentiel articles qu’Extraire matche. Pas encore implémenté — inbox.

### Extraire les composants

- Pas une recherche catalogue d’abord. IA (libellé + descriptif **sauvé** + extraits CPS) puis match articles tenant.
- « Voir le descriptif CPS » = viewer, ne copie pas dans le textarea.
- « Depuis le catalogue » = picker explicite, pas le chemin Extraire.

### UI bordereau

- Listes d’erreurs gate / consultation : bannière compacte + **Voir les détails** (dialog). L’arbre garde de la hauteur. Déjà en code (front).

### Devis

- Sans client Partner : aujourd’hui bandeau + erreur. Cible : demander si on **crée le client**. Inbox, pas gelé UX fine.

### Capitalisation (comportement actuel = cible)

- Après validation d’étude, vers **ouvrage**, pas vers article.
- Pas automatique à la validation (`CapitalisationOuvrageService`).

---

## Aujourd’hui dans le code (constat, pas une spec)

Pendant Extraire / DPU :

- Matché → `itemId` sur le composant.
- Manquant → dialog **Ajouter au poste** (`mode: poste`) ou **Créer dans le catalogue** (`mode: catalogue`).
- Ligne DPU déjà manuelle → bouton **Créer dans le catalogue** (`ajouterComposantAuCatalogue`).

Après étude :

- Capitalisation → `Ouvrage` + `ComposantOuvrage`. Les composants de l’ouvrage **référencent** des items s’ils étaient liés ; ça ne crée pas un article « poste ».

G2 / console Nafura :

- `CatalogEnrichissementService.contribuer` = signaux vers la console interne, **pas** des items tenant.

---

## Ouvert (prochain tour avant spec)

Cocher / amender ici, ne pas re-débattre à l’aveugle.

- [ ] **Confirmer les 3 couches** (poste ≠ article ; composants = articles si réutilisables ; recette = ouvrage).
- [ ] Manquant Extraire : rester **toujours demander** (catalogue vs poste) — ou un défaut (ex. poste-only, catalogue en 2ᵉ clic) ?
- [ ] Capitalisation : rester **opt-in** après validation, ou un rappel / gate « X postes capitalisables » ?
- [ ] Composant manuel one-shot : peut-on le promouvoir article **plus tard** (après save), ou seulement au moment Extraire / bouton actuel ?
- [ ] Ouvrage capitalisé : les composants non-articles restent manuels dans l’ouvrage, ou on force « créer l’article » avant versement ?
- [ ] Enrichissement G2 (console interne) : hors cycle tenant pour cette Change, ou un signal automatique quand on crée un article manquant ?

---

## Hors sujet de ce fichier (déjà ailleurs)

- Pact Sektor : pas encore. Ce journal nourrira le CADRE / SPEC études + catalogue.
- Portail invité : inbox, livré hors Pact.
- Impression PDF / Gotenberg : lot platform, pas ici.
