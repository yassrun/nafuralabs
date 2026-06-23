# Nafura Sektor — Audit complet (UX · Features · Qualité · Bugs)

> Tour d'observation du 2026-06-17. **Aucune correction appliquée dans cet audit** — c'est le backlog à prioriser ensemble.
> Légende sévérité : 🔴 bloquant · 🟠 majeur · 🟡 mineur · 🔵 polish
> Catégories : **UX** · **FEAT** (manquant / sous-développé) · **QUAL** (qualité code) · **BUG**

## Méthode & couverture

Croisement de trois sources : (1) navigation live sur la session authentifiée, (2) audit DOM automatisé (contraste WCAG, tailles de police, cibles tactiles, débordements), (3) lecture du code (structure des modules, services, stubs/TODO).

**Limite importante** : le tenant est vide (aucun client/donnée), donc l'UX en **état peuplé** (densité des tableaux, pagination, tri, cellules longues) n'a **pas** pu être auditée. → cf. action META-1.

L'app est **spec/manifest-driven** (générateur `nafgen`) : les écrans sont générés depuis des specs. L'absence de `FormGroup` codés à la main n'est donc **pas** un manque, c'est l'architecture.

---

## 0. Déjà corrigé cette session (pour mémoire, ne pas re-traiter)

Marque dédupliquée (topbar), glyphe cobalt en sidebar, compteur complétude sans box, débordement horizontal 10px, contraste badges (2.0→~5-7), contraste bouton danger (3.8→4.8). Tous vérifiés en live après rebuild.

---

## 1. BUGS

| # | Sév | Emplacement | Constat | Reco |
|---|---|---|---|---|
| BUG-1 | 🟡 | `web/public/favicon.ico` | Fichier **0 octet** (vide). Le fallback `.ico` ne s'affiche pas ; seul le SVG fonctionne (navigateurs récents). | Générer un vrai `.ico` multi-tailles depuis `sektor-favicon.svg`. |
| BUG-2 | 🟡 | Topbar (global) | 2 libellés sous 11px : sous-label tenant « Siège » (10.5px) et initiales avatar « YK » (10px). | Remonter à 11px min (sauf initiales avatar, tolérable). |

> Aucun bug bloquant détecté sur les écrans parcourus (hors ceux déjà corrigés). À compléter en état peuplé.

---

## 2. UX

| # | Sév | Emplacement | Constat | Reco |
|---|---|---|---|---|
| UX-1 | 🟠 | Global / tous modules | Audit UX **incomplet faute de données**. Impossible de juger densité tableaux, états de chargement, pagination, lignes longues. | META-1 : charger le jeu de démo puis refaire une passe peuplée. |
| UX-2 | 🟡 | Topbar (global) | Cibles tactiles à 34px de haut (boutons icônes, FR, notifications, AI). Passe AA (≥24px) mais < 44px (AAA / confort mobile). | Porter à 40-44px sur breakpoint tactile. |
| UX-3 | 🔵 | Détail chantier (hero) | Grande bande vide dans la carte héro (beaucoup d'espace mort à droite des KPI). | Rééquilibrer la grille ou ajouter un mini-graphe d'avancement. |
| UX-4 | 🟡 | Finance / journaux | Bloc « Conversations » apparaît dans une page comptable sans contexte évident. | Vérifier la pertinence / le placement du panneau collaboration. |

---

## 3. FEATURES — manquantes ou sous-développées

| # | Sév | Emplacement | Constat | Reco |
|---|---|---|---|---|
| FEAT-1 | 🟠 | `inventory/mouvements/inventory-txes/inventory-tx` | **Page non implémentée** : scaffold généré avec `// TODO: implement masterSlave pattern / logic per ai block`. C'est le **détail des mouvements de stock** — feature cœur d'un module inventory. | Implémenter le pattern masterSlave (saisie mouvement + lignes). Prioritaire. |
| FEAT-2 | 🟠 | `inventory/configuration/item-categories/item-category` | **Page non implémentée** : `// TODO: implement treeEditor pattern`. Gestion arborescente des catégories d'articles = coquille. | Implémenter le treeEditor (nf-tree-editor existe déjà dans la lib). |
| FEAT-3 | 🟠 | Module `analytics` (5 tableaux) | Les dashboards Analytics n'affichent **que des stat-cards** (KPIs chiffrés) — **aucun graphique, tendance, comparaison période, ni drill-down**. 355 LOC pour 5 « tableaux ». Pour un module « Analytics », c'est sous-développé. | Ajouter graphes (nf-chart existe), évolution temporelle, filtres période, export. |
| FEAT-4 | 🟡 | `finance/taux-change` | Import des taux **BAM** non implémenté : `throw new Error('Import BAM : endpoint backend non disponible (à venir)')`. | Implémenter l'endpoint backend + le brancher. |
| FEAT-5 | 🟡 | `pilotage-analyses` (911 LOC / 8 pages) & `pilotage` | Modules de pilotage fins par rapport aux autres. À vérifier : vrais tableaux de bord décisionnels ou écrans squelettes ? | Revue dédiée en état peuplé. |
| FEAT-6 | 🔵 | `administration` (0 service, 1074 LOC) | Module admin léger (société, membres, numérotation, démo). À confirmer que la gestion des rôles/permissions et des paramètres tenant est complète. | Revue de complétude (rôles, invitations, audit). |

---

## 4. QUALITÉ

| # | Sév | Emplacement | Constat | Reco |
|---|---|---|---|---|
| QUAL-1 | 🟠 | Tests (global) | Couverture mince : **53 specs unitaires** pour 216 composants front ; **~57 tests** back pour **1617** fichiers (~3,5%). e2e = 19 (correct). | Cibler d'abord les **services métier critiques** (calcul situations, facturation, retenue garantie, paie). |
| QUAL-2 | 🟠 | Design system (Storybook) | **1 seule story** pour ~80 composants anatomy. Storybook configuré mais quasi vide → pas de doc visuelle ni de test de régression visuelle. | Écrire les stories des atomes/molécules clés (button, input, select, badge, data-table, modal). |
| QUAL-3 | 🟡 | `inventory` | 6 TODO concentrés sur 2 pages scaffold (cf. FEAT-1/2). | Lever les TODO en implémentant. |
| QUAL-4 | 🔵 | Global | 23 TODO/FIXME au total (front) — densité faible et saine. | Trier : lever ou convertir en tickets. |
| QUAL-5 | 🟢 | Homogénéité composants | **Déjà excellent** : hex en dur ~2950→31 (légitimes), `<button>` bruts 336→4 (menu Material valide), 0 `mat-form-field`/`mat-icon` résiduel. | RAS — maintenir via la garde-fou `AGENTS-HOMOGENIZATION.md`. |

---

## 5. Actions META (débloquent le reste de l'audit)

- **META-1 — Charger le jeu de démo** (`/administration/demo`, ou bouton du compteur complétude) sur un tenant de test, puis me redonner « go » : je referai une **passe UX en état peuplé** (tableaux denses, pagination, tri, états longs, impression/PDF). C'est là que sortiront la majorité des vrais défauts UX restants.
- **META-2 — Audit des dialogs/drawers** : non couverts ici (nécessitent des données + interactions). À faire en passe 2.

---

## 6. Priorisation proposée (à valider ensemble)

1. **FEAT-1** (mouvements de stock) — feature cœur manquante. 🟠
2. **META-1** (demo data) — débloque l'audit UX réel. 🟠
3. **FEAT-3** (graphes Analytics) — fort impact perçu « produit pro ». 🟠
4. **QUAL-1** (tests services métier) — fiabilité avant clients. 🟠
5. **FEAT-2** (treeEditor catégories) + **QUAL-2** (Storybook). 🟡
6. Polish : BUG-1/2, UX-2/3/4. 🔵
