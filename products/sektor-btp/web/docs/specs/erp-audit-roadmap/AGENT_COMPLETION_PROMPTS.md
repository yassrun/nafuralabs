# Prompts agents — finir le reliquat roadmap ERP

> **Source de vérité :** `web/docs/specs/erp-audit-roadmap/00-PROGRESS.md`  
> **Règles communes (à coller en tête de chaque session si besoin) :**  
> - Workspace : `web/` (Angular ERP).  
> - Après chaque lot : `ng build` (ou `npm run build` du package web) sans erreur ; tests ciblés si tu touches la logique métier.  
> - Mettre à jour **`00-PROGRESS.md`** (statut + colonne évidence + date) quand une tâche est réellement terminée.  
> - Rester dans le périmètre de l’agent ; éviter les refactors hors sujet.

---

## Carte d’affectation (rappel)

| Agent | Sections / IDs |
|--------|----------------|
| **R01** | **1.1–1.9**, **2.1–2.4** (§01–02) |
| **R02** | **3.1–3.6**, **4.1–4.7** (§03–04) |
| **R03** | **5.1–5.7** (§05) |
| **R04** | **6.1–6.8**, **7.1–7.8**, **8.1–8.7** (§06–08) |
| **R05** | **9.1–9.6**, **10.1–10.6** (§09–10) |
| **R06** | **11.1–11.3**, **(atomes DS)**, **(typo)**, **12.1–12.5**, **14.1–14.8** (§11, §12, §14) |
| **R07** | **13.1–13.6**, **15.1–15.10** (§13, §15) |

---

## R01 — Foundations & chantiers (§01–02)

**Reliquat documenté :** aucune tâche 🟡 ou ❌ dans ces sections au dernier snapshot ; non-régression et alignement doc uniquement.

### Prompt (copier-coller)

```text
Tu es l’AGENT R01 (périmètre roadmap §01 Foundations + §02 Chantiers, tâches 1.1–1.9 et 2.1–2.4).

Contexte : lire `web/docs/specs/erp-audit-roadmap/00-PROGRESS.md` sections 01 et 02.

Objectif :
1. Vérifier qu’aucune régression n’a réintroduit `| currency`, des seeds chantiers incohérents (`ch-00x` / `CH-2025-00x`), ou des chaînes Planning/Budget sans accents.
2. Si une PR voisine modifie `app.config.ts`, locale, i18n Matériel, ou `chantiers-planning.page.ts` (drill-down Gantt ~302–313), valider la cohérence avec la spec et mettre à jour la colonne « Évidence » dans 00-PROGRESS si nécessaire.
3. Ne pas prendre de tâches 03+ ; si tu constates un bug hors périmètre, note-le en commentaire PR ou ticket sans élargir le scope.

Livrable : PR ou résumé court listant fichiers vérifiés + mise à jour 00-PROGRESS seulement si quelque chose a changé.
```

---

## R02 — Shell / UX & tables / formulaires (§03–04)

**Tâches encore ouvertes (doc) :** **3.1**, **3.4**, **3.6** (🟡) ; **4.1**, **4.5**, **4.6** (🟡). Optionnel : **4.2** « pages liste ad-hoc » hors `EntityListingComponent`.

### Prompt (copier-coller)

```text
Tu es l’AGENT R02 (périmètre §03 Shell/UX + §04 Tables/forms/states, tâches 3.1–3.6 et 4.1–4.7).

Référence : `web/docs/specs/erp-audit-roadmap/00-PROGRESS.md` sections 03 et 04.

À livrer dans l’ordre qui minimise les conflits Git (suggestion) :
1. **3.1** — Breadcrumb routing-driven : câbler partout les vues ERP où il manque (cohérence avec routes lazy).
2. **3.4** — AR + RTL : activer le flux RTL quand la langue AR est choisie (layout shell, tables, formulaires critiques).
3. **3.6** — Boutons « création » : migrer les derniers écrans vers le pattern standard (même libellé, icône, placement).
4. **4.1** — Virtualisation : évaluer besoin de virtualisation native `mat-table` au-delà des listings paginés ; implémenter si un listing réel pose problème perf.
5. **4.5** — Filtres mobile : chips / filtres dédiés hors `listing-controls` scrollables &lt;640px où pertinent.
6. **4.6** — Atomes MA : sous-traitant (`entity-detail` ou équivalent), champs finance (%/taux), compteurs non monétaires — migrer vers `ice` / `rib` / `phone-ma` / `money-ma` + `buildForm` comme le reste du doc.
7. (Optionnel) **4.2** — Harmoniser états loading/empty/error sur pages liste ad-hoc hors `nf-entity-listing`.

Contraintes : respecter `ToastService`, guards existants, et ne pas casser les listings déjà migrés. Mettre à jour `00-PROGRESS.md` pour chaque tâche bouclée.
```

---

## R03 — Stock (§05)

**Tâches encore ouvertes (doc) :** **5.1**, **5.2**, **5.3** (🟡). **5.7** est ✅ ; reste évolutif **V2** : `Article.posteBudgetId` pour remplacer l’heuristique article→rubrique budget.

### Prompt (copier-coller)

```text
Tu es l’AGENT R03 (périmètre §05 Stock, tâches 5.1–5.7).

Référence : `web/docs/specs/erp-audit-roadmap/00-PROGRESS.md` section 05.

À livrer :
1. **5.1** — Magasins : enrichir le modèle/UI (capacité, géoloc ou champs équivalents métier BTP) + seeds/mocks alignés.
2. **5.2** — Articles : compléter le modèle `Article` (PMP, champs manquants listés en spec) + formulaires/listings.
3. **5.3** — Mouvements : ajouter une page ou parcours dédié « sorties » (stock sortant chantier/fournisseur) cohérent avec les flux existants réception/transfert/retour.
4. **5.7 (V2)** — Si le socle est prêt : introduire `Article.posteBudgetId` (ou équivalent) et brancher `StockBudgetSyncService` / `BudgetFacade` pour supprimer l’heuristique V1 documentée.

Vérifier `ng build` et les routes stock. Mettre à jour `00-PROGRESS.md` + évidence (fichiers/lignes clés).
```

---

## R04 — Marchés, pilotage, administration (§06–08)

**Tâches encore ouvertes (doc) :** **6.7** (🟡) ; **8.4** (🟡) ; **8.7** (❌). §07 est ✅ — ne pas « refaire » sauf bug.

### Prompt (copier-coller)

```text
Tu es l’AGENT R04 (périmètre §06 Marchés/facturation + §07 Pilotage/approbations + §08 Administration, tâches 6.1–6.8, 7.1–7.8, 8.1–8.7).

Référence : `web/docs/specs/erp-audit-roadmap/00-PROGRESS.md` sections 06–08.

Priorité :
1. **6.7** — Spécificités fiscales MA : règles B2B fines, exports DGI associés, retenue TVA sur autoliquidation — s’appuyer sur `FiscalSettingsService`, `TvaAutoliquidationService`, `ff-detail.page.ts`, `FinanceComptabiliteMockService`, seeds type **FRS-013**.
2. **8.4** — Paramètres société : compléter `societe.page.ts` (champs métier manquants vs spec audit), cohérent avec `SocieteService` / multi-établissements.
3. **8.7** — Login / 2FA in-app : concevoir un parcours minimal in-app (mock ou adapter Keycloak) au lieu de la seule redirection, sans casser l’IAM existant ; documenter limites demo vs prod.

Ne pas modifier les tâches 7.x pour du cosmétique si déjà ✅. Mettre à jour `00-PROGRESS.md` après validation métier + build.
```

---

## R05 — HSE & paie / fiscal MA (§09–10)

**Tâches encore ouvertes (doc) :** **9.1**, **9.2** (🟡) ; **9.3–9.5** ont des « Reste » dans la colonne évidence malgré ✅ ; **10.2** (tests manquants) ; **10.3**, **10.4**, **10.5**, **10.6** (🟡).

### Prompt (copier-coller)

```text
Tu es l’AGENT R05 (périmètre §09 HSE + §10 Paie/fiscal Maroc, tâches 9.1–9.6 et 10.1–10.6).

Référence : `web/docs/specs/erp-audit-roadmap/00-PROGRESS.md` sections 09–10.

Backlog ciblé :
1. **9.1** — Modèles CNSS complets pour incidents, NC, inspections, formations (+ UI si nécessaire).
2. **9.2** — Registre EPI : scinder en volets Référence / Attribution / Vérification (navigation + mocks).
3. **9.3 (suite)** — Éditeur DUER matrice risque × proba × gravité ; génération PDF PPSPS alignée art. R4532-65 (dans la limite demo).
4. **9.4 (suite)** — Bloquer ou alerter fortement la planification chantier lorsque visite médicale **INAPTE** (règle métier documentée).
5. **9.5 (suite)** — PDF officiel CNSS « tamponnable » pour registres légaux (ou gabarit printable crédible en demo).
6. **10.2** — Écrire tests unitaires Jasmine pour `PaieEngineService` (cas nominaux + bornes référentiel 2026).
7. **10.3** — Page journal société + compléter UI fiche paie / écrans déclarations selon spec.
8. **10.4** — Compléter modèles tiers MA (ICE, IF, RC, Patente) sur Employé et ClientVente.
9. **10.5** — Déplacer / centraliser l’engine fiscal sous `finance/services/` (imports mis à jour, pas de duplication).
10. **10.6** — SIMPL-IS (TVA mensuelle) + dédoublonner state-9421 côté finance avec les écrans DGI existants (dont état 1208).

Mettre à jour `00-PROGRESS.md` et `erpAudit` sur exports sensibles si déjà le pattern projet.
```

---

## R06 — Design system, exports/impressions, tests & audit (§11, §12, §14)

**Tâches encore ouvertes (doc) :** **11.2**, **11.3**, **(typo)** ; **12.1**, **12.2**, **12.3** ; **14.1**, **14.2**. Les tâches ✅ de ces sections : maintenir lors de touchées voisines seulement.

### Prompt (copier-coller)

```text
Tu es l’AGENT R06 (périmètre §11 Design system + §12 Exports/impressions + §14 Tests/audit ; tâches 11.x, ligne atomes DS, ligne typo, 12.1–12.5, 14.1–14.8).

Référence : `web/docs/specs/erp-audit-roadmap/00-PROGRESS.md` sections 11, 12, 14.

Backlog ciblé :
1. **11.2** — Étendre l’audit a11y WCAG AA aux 9 pages clés de la spec ; optionnel lint a11y Angular si la config reste légère.
2. **11.3** — Introduire la syntaxe ICU pour les pluriels dans les fichiers i18n concernés (sans casser les clés existantes).
3. **(typo)** — Définir une échelle typographique (`--nf-text-*` ou convention équivalente) et l’appliquer progressivement aux shell + composants partagés listés en spec.
4. **12.1** — Généraliser `ExportButton` aux listings majeurs (objectif : réduire fortement le ratio 2/67 documenté).
5. **12.2** — Ajouter les templates imprimables manquants (devis, contrat, BR, fiche paie, etc.) en réutilisant les patterns print existants.
6. **12.3** — Mettre en place une voie **PDF serveur** (Puppeteer ou Playwright en script Node) documentée pour la demo ; contrat d’API minimal (entrée HTML/URL, sortie PDF).
7. **14.1** — Poursuivre le câblage `erpAudit.log()` sur facades / exports ad hoc restants (prioriser les mutations et exports légaux) ; piste refacto base class + token DI si pertinent.
8. **14.2** — Extraire la logique métier lourde des pages si besoin et ajouter tests unitaires : moteurs avancement, retenue garantie, formule K.

Conserver verts : e2e pointage offline/a11y, Lighthouse CI, Storybook smoke, Artillery — ajuster configs seulement si indispensable. Mettre à jour `00-PROGRESS.md` et `_TESTING_GUIDE.md` si scripts ou périmètres changent.
```

---

## R07 — RH terrain & polish (§13–15)

**Tâches encore ouvertes (doc) :** **13.1–13.4**, **13.6** (🟡) ; **15.1**, **15.4**, **15.5**, **15.6**, **15.7** (🟡) ; **15.8** (❌). **15.9** ✅ — ne refaire que si régression.

### Prompt (copier-coller)

```text
Tu es l’AGENT R07 (périmètre §13 RH terrain + §15 Polish, tâches 13.1–13.6 et 15.1–15.10).

Référence : `web/docs/specs/erp-audit-roadmap/00-PROGRESS.md` sections 13 et 15.

Backlog ciblé :
1. **13.1** — Pointage mobile : photo chantier, persistance IndexedDB, sync (sans casser le bandeau offline existant).
2. **13.2** — Validation/cumul desktop : page ou panneau détail de validation au-delà du listing.
3. **13.3** — Planning équipes : compléter les flux métier manquants vs spec (création, affectation, filtres).
4. **13.4** — Carnet d’attachement : saisie terrain + signature (mock ou canvas) + cohérence seeds.
5. **13.6** — PWA offline : IndexedDB pour photos, compression ~800px, background sync réaliste, stratégie simple de conflits métier ; rester compatible `ngsw-config.json` actuel.
6. **15.1** — Branding multi-tenant au-delà de la sidebar (favicon, titre, couleurs par société si applicable demo).
7. **15.4** — Utiliser la directive tooltips sur actions ambiguës (toolbar, icônes seules) de façon mesurable (au moins N écrans prioritaires).
8. **15.5** — Stratégie cache PWA au-delà du pointage ; versioning assets ; garde-fou prod documenté.
9. **15.6** — Bouton « Réinitialiser filtres » sur davantage de listings (rapprocher du ratio attendu dans la spec).
10. **15.7** — Compléter le 4e tour d’onboarding manquant.
11. **15.8** — Polish typographique global aligné avec l’échelle design system (coordination avec R06 si variables `--nf-text-*` existent).

Après chaque lot : e2e mobile pointage si touché. Mettre à jour `00-PROGRESS.md`.
```

---

## Note coordination R06 ↔ R07

Les tâches **(typo)** (§11) et **15.8** (§15) se chevauchent sur la hiérarchie typographique : **éviter deux PR en parallèle sur les mêmes fichiers globaux SCSS** — ordre suggéré : R06 pose les tokens, R07 applique sur pages polish.
