# 14 — Features transversales (Ctrl+K, drill universel, exports, dark mode, aide)

> **Sévérité** : P0 (M-TRA-01..03)
> **Estimation** : 1 sprint (S1–S2 partiel)
> **Dépendances** : Round 1 (Ctrl+K, drill-down, notifications partiels), `13-admin` (audit log)

## Findings traités

- [ ] **M-TRA-01** Command palette `Ctrl+K` fonctionnelle **P0**
- [ ] **M-TRA-02** Drill-down clic-ligne universel **P0**
- [ ] **M-TRA-03** Workflow approbation transversal (cf §12)
- [ ] **M-TRA-04** Exports CSV/XLSX/PDF universels
- [ ] **M-TRA-05** Impression PDF templates universels
- [ ] **M-TRA-06** Filtres avancés / vues sauvegardées
- [ ] **M-TRA-07** Recherche full-text + OCR
- [ ] **M-TRA-08** Notifications applicatives en français
- [ ] **M-TRA-09** Bilingue FR/AR (RTL) + EN — toggle effectif
- [ ] **M-TRA-10** Mode sombre
- [ ] **M-TRA-11** États vides / loading / erreur unifiés
- [ ] **M-TRA-12** Feedback toasts CRUD universels
- [ ] **M-TRA-13** Aide contextuelle métier (Art. 187, RG, IGR, BTP18, K, SIMPL-IS, DAMANCOM...)
- [ ] **M-TRA-14** Tour produit / Onboarding premier login
- [ ] **M-TRA-15** Historique & restauration soft-delete (P2)
- [ ] **M-TRA-16** Commentaires + @mentions (P2)
- [ ] **M-TRA-17** Pièces jointes universelles (P2)
- [ ] **M-TRA-18** Activity feed timeline (P2)
- [ ] **M-TRA-19** Bulk actions (P3)
- [ ] **M-TRA-20** Saved searches → automation (P3)

## Goal

Apporter les **fonctionnalités transversales** qui transforment l'ERP en outil de productivité fluide : recherche globale `Ctrl+K`, toute table cliquable, exports/impressions universels, filtres avancés, recherche OCR, notifications cohérentes, bilingue AR/RTL effectif, dark mode, aide contextuelle métier, onboarding.

## Context to read first

```
app/platform/lib/anatomy/components/organisms/command-palette/      # Round 1 ⚠️ régression Round 2
app/platform/lib/anatomy/components/atoms/notification-bell/         # Round 1
app/platform/lib/anatomy/components/molecules/language-selector/     # Round 1
app/platform/lib/anatomy/components/organisms/data-table/            # tables cliquables ?
app/platform/lib/anatomy/components/organisms/entity-listing/        # Round 1 4.2 data-state
app/platform/core/i18n/                                              # locale service
public/assets/i18n/                                                  # traductions FR/AR/EN
```

---

## Task 14.1 — Command palette `Ctrl+K` (M-TRA-01) **P0**

**Régression Round 2** : Round 1 3.2 marquait ✅ mais l'audit Round 2 constate « toujours non fonctionnelle ». **Diagnostiquer urgemment**.

**Hypothèses** :
1. Raccourci `Ctrl+K` capté par le navigateur (impacté en preview Cursor ?) — préfère aussi `Cmd+K` (Mac) et `Ctrl+P`
2. Composant `command-palette` non monté dans le shell global
3. Listener `keydown` mal câblé

**Action** :
1. Diagnostiquer et corriger
2. Index complet :
   - **Routes** (toutes les routes ERP avec libellés i18n)
   - **Entités** : chantiers, fournisseurs, employés, BC, DA, factures vente/achat, marchés, contrats, articles
3. Fuzzy search (`fuse.js` ou `fuzzysort`)
4. Navigation clavier (↑↓ Enter Esc)
5. Section « Récent » (5 derniers utilisés)
6. Section « Actions » (« + Nouveau chantier », « + Nouveau BC », etc.)

**Acceptance criteria** :
- [ ] `Ctrl+K` / `Cmd+K` ouvre palette partout
- [ ] Indexation routes + entités + actions
- [ ] Recherche fuzzy ≤ 100 ms
- [ ] Test e2e Playwright + couverture sur 3 OS (Win, Mac, Linux)

---

## Task 14.2 — Drill-down clic-ligne universel (M-TRA-02) **P0**

**Audit Round 2** : « Lignes de tableaux non cliquables, constaté sur Mes chantiers, vraisemblablement partout »

**Action** :
1. Auditer toutes les utilisations de `nf-data-table` / `mat-table` / `nf-entity-listing`
2. Ajouter un attribut `rowClickable: true` par défaut sur `nf-entity-listing`
3. Pour chaque listing métier, définir le `rowAction` qui navigue vers la fiche détail
4. Cursor `pointer` + hover state visible
5. Click `data-no-click="true"` sur boutons enfants pour empêcher propagation

**Acceptance criteria** :
- [ ] 100 % des listings métier ont leurs lignes cliquables
- [ ] Test e2e : itération sur N listings → vérifier que clic ligne → URL change
- [ ] Doc dev : pattern à utiliser pour nouveau listing

---

## Task 14.3 — Workflow approbation transversal (M-TRA-03) **P0**

Cf §12-approbations (M-APR-01..03). Cette tâche est l'**alias transversal** pour le suivi global.

---

## Task 14.4 — Exports CSV/XLSX/PDF universels (M-TRA-04) **P1**

Étendre Round 1 12.1 (`<nf-export-button>` + `ExportService`) :
- Bouton sur **tous** les listings (objectif 100 % couverture)
- 3 formats : CSV, XLSX, PDF
- Respect filtres + tri actifs
- Audit log de chaque export (cf M-ADM-06)
- Configuration colonnes incluses

**Acceptance criteria** :
- [ ] Audit ratio export listings (cible 100 %)
- [ ] CSV et XLSX preserve formats (dates, montants MAD)
- [ ] PDF en-tête société + footer page X/Y

---

## Task 14.5 — Impression PDF templates universels (M-TRA-05) **P1**

Étendre Round 1 12.2. Templates à compléter :
- Bon de Commande
- Devis
- Facture vente / situation
- Avoir
- BL réception
- Carnet d'attachement
- Contrat sous-traitance
- Fiche paie
- DGD
- OS
- Reçu paiement
- Mise en demeure
- Caution bancaire

Utiliser le pipeline PDF Round 1 (`pdf-server-demo.md`). Templates configurables via §13 M-ADM-07.

---

## Task 14.6 — Filtres avancés / vues sauvegardées (M-TRA-06) **P1**

**Modèle** :

```ts
export interface VueSauvegardee {
  id: string;
  userId: string;
  module: string;                // « chantiers »
  nom: string;                    // « Mes chantiers Casa en cours »
  filtres: { [key: string]: any };
  tri: { colonne: string; direction: 'ASC' | 'DESC' };
  colonnesVisibles: string[];
  partage: 'PERSONNELLE' | 'EQUIPE' | 'SOCIETE';
}
```

**Action** : sur chaque listing, dropdown « Mes vues » + bouton « Enregistrer la vue actuelle ».

---

## Task 14.7 — Recherche full-text + OCR (M-TRA-07) **P1**

- Recherche full-text dans `Ctrl+K` étendu : contenu pièces jointes PDF
- OCR automatique sur upload BL/factures scannées (Tesseract.js client ou API serveur)
- Métadonnées indexées : montants, dates, n° factures détectés

---

## Task 14.8 — Notifications applicatives en français (M-TRA-08) **🟡 P1**

**Régression Round 2** : Round 1 ✅ mais labels EN restants (« No notifications », « View All »).

**Action** :
1. Audit i18n du `notification-bell`
2. Compléter clés manquantes FR
3. Vérifier en runtime
4. Étendre AR + EN

---

## Task 14.9 — Bilingue FR/AR (RTL) + EN (M-TRA-09) **🟡 P1**

**Régression Round 2** : Round 1 ✅ marqué pour toggle langue + AR/RTL mais l'audit Round 2 constate « Toggle langue toujours inopérant ».

**Action** :
1. Diagnostiquer pourquoi le toggle ne change pas la langue à runtime
2. Vérifier `LocaleService.applyLang` exécuté
3. Vérifier que `TranslateService.use(lang)` est appelé
4. Vérifier que `document.documentElement.lang` change bien
5. Tester RTL sur shell + listings + formulaires
6. Compléter les packs AR (`public/assets/i18n/applications/erp/ar.json`)

**Acceptance criteria** :
- [ ] Toggle FR/AR/EN effectif en runtime
- [ ] AR active RTL (shell mirror, tables mirror)
- [ ] Aucune clé manquante (FR couverture 100 %, AR couverture ≥ 95 %)
- [ ] Test e2e : `expect(page.locator('html').getAttribute('dir')).toBe('rtl')` après toggle AR

---

## Task 14.10 — Mode sombre (M-TRA-10) **P1**

**Action** :
1. Tokens CSS variables Round 1 → ajouter mode sombre dans `:root[data-theme="dark"]`
2. Toggle dans le shell (icône lune/soleil)
3. Persistance localStorage
4. Préférence auto via `prefers-color-scheme`

**Acceptance criteria** :
- [ ] Toggle dark/light/auto
- [ ] Contraste WCAG AA respecté en dark
- [ ] Tests Storybook smoke par composant en dark

---

## Task 14.11 — États vides / loading / erreur unifiés (M-TRA-11) **🟡 P1**

Round 1 4.2 ✅ pour `entity-listing`. Étendre :
- Pages liste ad hoc hors `EntityListingComponent` (cf 00-PROGRESS Round 1)
- Pages détail (`<nf-data-state>` étendu pour détail avec illustration)
- Tableaux croisés / dashboards

---

## Task 14.12 — Feedback toasts CRUD universels (M-TRA-12) **🟡 P1**

Round 1 4.3 ✅ `ToastService`. Audit :
- Toutes les mutations doivent émettre un toast
- Recherche `*.facade.ts` / `*.service.ts` qui font CRUD sans toast
- Standard : success vert / warning orange / error rouge / info bleu
- Pattern « Undo » sur suppressions sensibles

---

## Task 14.13 — Aide contextuelle métier (M-TRA-13) **P1**

**Concept** : tooltip `?` à côté des termes métier (Art. 187, RG, IGR, BTP18, K, SIMPL-IS, DAMANCOM, ANAPEC, OPPCM, DAT, IJSS, TFP, CIMR, CNSS, AMO, CCAG-T, BPU, PUF, PGF, DPGF, DPU, DGD, RAS, TPCC, MOA, MOE, BET).

**Fichiers** :
- `app/platform/lib/anatomy/components/atoms/help-tooltip/help-tooltip.component.ts` (nouveau)
- `public/assets/i18n/applications/erp/help-glossary.json` (nouveau, 50+ entrées)

**Acceptance criteria** :
- [ ] Composant `<help-tooltip key="art-187">` affiche définition + lien doc
- [ ] Glossaire 50+ entrées BTP MA
- [ ] Sur chaque écran métier, au moins 3 termes avec tooltip

---

## Task 14.14 — Tour produit / Onboarding (M-TRA-14) **🟡 P1**

Round 1 15.7 = 4e tour onboarding. Compléter parcours global premier login :
- Bibliothèque `intro.js` ou `driver.js`
- 8 étapes (sidebar, header, dashboard, chantiers, achats, finance, RH, settings)
- Bouton « Refaire le tour » dans Aide

---

## Task 14.15 — Historique & restauration (M-TRA-15) **P2**

Soft-delete partout + page `/admin/corbeille` avec restauration. Versions précédentes des entités modifiées.

---

## Task 14.16 — Commentaires + @mentions (M-TRA-16) **P2**

Sur chantier, BC, NC, facture, etc. : fil de commentaires avec @mention employés. Notifications à mentionné.

---

## Task 14.17 — Pièces jointes universelles (M-TRA-17) **P2**

Composant `<attachments-zone>` partout. Drag & drop + preview (image, PDF). Tagging.

---

## Task 14.18 — Activity feed (M-TRA-18) **P2**

Timeline par entité. « Hier 14:32 — Yassine a validé le BC à 152 000 MAD ». Fil chronologique.

---

## Task 14.19 — Bulk actions (M-TRA-19) **P3**

Sélection N lignes (checkbox) + barre d'actions groupées (supprimer, exporter, changer statut, assigner...).

---

## Task 14.20 — Saved searches → automation (M-TRA-20) **P3**

Quand vue sauvegardée respecte certains critères, déclencher action (« quand BC > 200K et fournisseur sans attestation, alerter DAF »).

---

## Testing

```ts
// e2e
test('Ctrl+K ouvre la palette partout', async ({ page }) => {
  for (const url of ['/dashboard', '/chantiers', '/finance/balance']) {
    await page.goto(url);
    await page.keyboard.press('Control+K');
    await expect(page.locator('[role=dialog]').first()).toBeVisible();
    await page.keyboard.press('Escape');
  }
});

test('Toutes les lignes de listing sont cliquables', async ({ page }) => {
  const listings = ['/chantiers', '/achats/bons-commande', '/finance/factures-fournisseurs', '/rh/employes'];
  for (const url of listings) {
    await page.goto(url);
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();
    await expect(page).not.toHaveURL(url);  // URL a changé
    await page.goBack();
  }
});
```

## Dépendances inverses

- 12-approbations
- 13-admin (audit log + templates docs + multi-tenant)
- 15-mobile (approbation 1-clic)
- 16-integrations (notifications via WhatsApp)
