# Backlog — barre « form pro » (audit exhaustif Sektor BTP)

**Scope :** `products/sektor-btp/web/` + platform auth/invite/atoms utilisés par Sektor  
**Date :** 2026-07-27  
**Méthode :** inventaire via `[(ngModel)]`, `FormGroup`/`formControlName`, `nf-entity-detail`, `config/detail/fields.ts` (45), drawers, dialogs, wizards create/saisie.

**Règles (score /6) :**
1. CTA disabled si invalid  
2. Erreurs au niveau du champ  
3. Validation blur/submit  
4. Formats métier (email, ICE, RIB, password…) — hint ≠ erreur  
5. `aria-invalid` / `aria-describedby`  
6. Messages i18n  

## Findings transverses

- **Aucun** `fields.ts` Sektor n’utilise `type: 'email'` (email souvent `text`).
- Anatomy `nf-entity-detail` : Save **cliquable** si invalid → `markAllAsTouched` + summary (pas de disable CTA).
- Atoms ICE/RIB : formats OK, messages **FR hardcodés**, pas d’aria ; phone-ma i18n OK, aria manquant.
- Seuls signup / onboarding-flow / invite-banner posent explicitement `aria-invalid` / `aria-describedby` dans Sektor.
- Un fix **platform entity-detail + atoms** remonte le score de ~45 fiches anatomy d’un coup.

---

## A. Inventory summary

| Catégorie | Count |
|-----------|------:|
| Anatomy entity-detail (`fields.ts` + `nf-entity-detail`) | 45 |
| Ad-hoc ngModel (pages / tabs / saisie) | ~28 |
| Dialog (inputs + submit) | ~15 |
| Wizard / multi-step | 3 |
| Drawer (save) | 1 |
| Ad-hoc reactive page-level | 1 (+ signup) |
| Platform (login + atoms ICE/RIB/phone) | 4 |
| **Total surfaces scorées** | **~97** |

*Exclus :* filtres listing purs, drawers lecture seule, reprise onboarding (import magique, pas de saisie champ).

---

## B. Déjà OK (phase 1)

| Surface | Score | Notes |
|---------|------:|-------|
| Signup | **6/6** | Reactive, CTA gated, field errors, aria, i18n |
| Onboarding flow (étape entreprise) | **6/6** | Company/ICE field errors, CTA gated |
| Invite team banner | **~5–6/6** | Emails validés ; soft : options rôle FR |

---

## C. Full backlog

### P0 — identité / auth / argent / ad-hoc critiques

| # | Module | Surface | Path (short) | Pattern | Score | Écarts | Priorité |
|---|--------|---------|--------------|---------|------:|--------|----------|
| 1 | Invitations | Invite accept | `invitations/pages/invite-accept.page.ts` | ngModel | 1/6 | CTA non gated ; erreurs globales ; pas aria | **P0** |
| 2 | Admin | Société | `administration/societe/societe.page.ts` | ngModel | 1/6 | Save always on ; pas field errors | **P0** |
| 3 | Achats | Fournisseur — attestations / catalogue | `fournisseur-detail/` tabs | ngModel | 0/6 | Toast FR ; CTA actif | **P0** |
| 4 | Finance | Facture fournisseur | `finance/factures-fournisseurs/ff-detail/` | ngModel | 1/6 | Toast `missingFields` | **P0** |

### P1 — creates / saisie / platform / identité anatomy

| # | Module | Surface | Path (short) | Pattern | Score | Écarts | Priorité |
|---|--------|---------|--------------|---------|------:|--------|----------|
| 5 | Platform | Login (dev wizard) | `platform/.../login/` | ngModel | 0/6 | Dev-only ; Keycloak prod | P1 |
| 6 | Platform | ICE / RIB / phone atoms | `platform/.../atoms/{ice,rib,phone-ma}-input/` | CVA | 2–4/6 | Aria + i18n ICE/RIB | P1 |
| 7 | Platform | `nf-entity-detail` core | `platform/.../entity-detail/` | anatomy | 4/6 | Save non disabled ; email type rare | P1 |
| 8 | Admin | Paramètres fiscaux | `administration/parametres-fiscal/` | ngModel | 1/6 | Save always on | P1 |
| 9 | Achats | Fournisseur fiche | `achats/fournisseurs/` | anatomy | 3/6 | Save + email `text` | P1 |
| 10 | Ventes | Client detail | `ventes/clients/` | anatomy | 3/6 | Save + email `text` + labels FR | P1 |
| 11 | RH | Employé detail | `rh/employes/` | anatomy | 3/6 | Save + email `text` | P1 |
| 12 | Chantiers | Création chantier | `chantiers/create/` | wizard | 2/6 | Banner only | P1 |
| 13 | Chantiers | Édition chantier | `chantiers/edit/` | ngModel | 2/6 | Banner only | P1 |
| 14 | Chantiers | Sous-traitance create | `sous-traitance-create/` | ngModel | 1/6 | Toast + HTML required | P1 |
| 15 | Marchés | Contrat create | `contrats/contrat-create/` | ngModel | 1/6 | Toast global | P1 |
| 16 | Études | Dossier create | `etudes/dossiers/dossier-create/` | ngModel | 2/6 | CTA gated ; pas field errors | P1 |
| 17 | Finance | Compte edit drawer | `compte-edit-drawer/` | drawer | 2/6 | `canSave` ; banner only | P1 |
| 18 | Finance | Règlement saisie | `reglements/reglement-saisie/` | ngModel | 2/6 | `canSave` ; pas field errors | P1 |
| 19 | Finance | Virement detail | `virements/virement-detail/` | ngModel | 2/6 | Idem | P1 |
| 20 | Finance | Écriture saisie | `journaux/ecriture-saisie/` | ngModel | 2/6 | `canSubmit` ; toasts | P1 |
| 21 | Finance | Caisse mvt dialog | `caisses/.../saisie-mvt-dialog/` | dialog | 2/6 | `canSave` | P1 |
| 22 | Ventes | Encaissement / caution / libération dialogs | `ventes/components/*` | dialog | 2/6 | `canSave` ; FR ; pas aria | P1 |
| 23 | Chantiers | Lot form dialog | `lot-form-dialog/` | dialog | 2/6 | `canSave` | P1 |
| 24 | Chantiers | Équipe tab | `chantier-equipe-tab/` | ngModel | 1/6 | Toast FR | P1 |
| 25 | Chantiers | Attachement / avancement saisie | `attachement-saisie/`, `avancement-saisie/` | ngModel | 1–2/6 | CTA faible | P1 |
| 26 | RH | Planning équipes | `rh/planning-equipes/` | ngModel | 1/6 | Toast FR | P1 |
| 27 | RH | Pointage saisie | `rh/pointage/pointage-saisie/` | ngModel | 3/6 | Soft field-level | P1 |
| 28 | Études | Dialogs bordereau / sous-détail / chiffrage / prix / missing item | `dossiers/components/*-dialog/` | dialog | 2/6 | `canSave` ; gaps a11y | P1 |
| 29 | Anatomy | Situation | `chantiers/situations/` | anatomy | 3/6 | Motif rejet FR | P1 |
| 30 | Inventory | Réception + mouvements (transfert, inventaire, retour, sortie, perte) | `mouvements/*` | anatomy + lines | 3/6 | Même pattern | P1 |

### P2 — anatomy soft + secondaires

| # | Module | Surface | Score | Priorité |
|---|--------|---------|------:|----------|
| 31–40 | Ventes/Achats anatomy | Offre, facture, avoir, BCC, DA, BC, AO, contrat achat | ~4/6 | P2 |
| 41–44 | RH/HSE anatomy | Congé, paie, inspection, formation, incident, NC | ~4/6 | P2 |
| 45–48 | Études anatomy | Devis, métré, AOC, biblio prix | 3–4/6 | P2 |
| 49–55 | Finance config anatomy | Conditions paiement, devises, taux, currencies, payment-terms, exchange-rates | ~4/6 | P2 |
| 56–70 | Inventory config/catalogue anatomy | Articles, items, matériel, dépôts, familles, motifs, UoM, types, costing, stock balances, tx lines | ~4/6 | P2 |
| 71 | Finance | Journal config | 1/6 | P2 |
| 72 | Finance | Relevé import dialog | 2/6 | P2 |
| 73 | Chantiers | Journal / documents / réviser budget | 1–2/6 | P2 |
| 74 | Inventory | Item category, pleins, pointage engin, réservations, alertes réappro | 1–2/6 | P2 |
| 75 | Études | CPS descriptif / decomposition suggestion | 1/6 | P2 |

*(Les 45 `fields.ts` entity-detail partagent le moteur anatomy — listés groupés ici pour lisibilité ; détail path = `pages/<module>/.../config/detail/fields.ts`.)*

---

## D. Ordre de fix recommandé (top 10)

1. **Invite-accept** — aligner sur signup  
2. **Admin société** — gate Save + erreurs champ  
3. **Fournisseur tabs attestations/catalogue** — field errors + i18n  
4. **Atoms ICE / RIB / phone** — aria + i18n (impact transversal)  
5. **Anatomy core** — disable Save si invalid + `type: 'email'`  
6. **FF detail + encaissement / règlement / virement** — surfaces argent  
7. **Chantier create/edit** — CTA gated + field errors  
8. **Contrat + sous-traitance create**  
9. **Client / fournisseur / employé** — email type + labels i18n  
10. **Dialogs** études/chantiers/ventes déjà à `canSave` — ajouter erreurs champ + aria  

---

## E. Synthèse

| Statut | Approx. |
|--------|--------:|
| OK (phase 1) | 3 |
| P0 | 4 |
| P1 | ~30 |
| P2 (surtout anatomy soft) | ~60 |
| **Total** | **~97** |

**Levier max :** fixer `nf-entity-detail` + atoms ICE/RIB/phone → ~45+ fiches passent de ~3–4/6 à ~5–6/6 sans toucher chaque page.
