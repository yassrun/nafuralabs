# 13 — Administration — **Module à activer en production**

> **Sévérité** : P0 (M-ADM-01..05) — ~~route `/admin` → 404~~ **corrigé (Task 13.0 hub)** ; reste M-ADM-01..05 pour parcours B2B complet
> **Estimation** : 1.5 sprint (S3–S4)
> **Dépendances** : Round 1 08-administration (IAM + SocieteService partiels existants)

## Findings traités

- [x] **Task 13.0** Route `/admin` + hub sections (2026-05-13)
- [ ] **M-ADM-01** Utilisateurs & Rôles RBAC granulaire **P0**
- [ ] **M-ADM-02** SSO Entra/Google + 2FA TOTP/SMS **P0**
- [ ] **M-ADM-03** Sociétés / Entités juridiques multi-tenant **P0**
- [ ] **M-ADM-04** Paramètres société (ICE/IF/RC/Patente/RIB/...) **P0**
- [ ] **M-ADM-05** Référentiels (clients, MOA, banques) **P0**
- [ ] **M-ADM-06** Audit log global recherchable
- [ ] **M-ADM-07** Templates documents WYSIWYG
- [ ] **M-ADM-08** Numérotation séquentielle paramétrable
- [ ] **M-ADM-09** Paramètres fiscaux (TVA/RAS/timbres/exonérations)
- [ ] **M-ADM-10** Mappings comptables auto
- [ ] **M-ADM-11** Gestion abonnements / licences SaaS
- [ ] **M-ADM-12** Sauvegarde & restauration données
- [ ] **M-ADM-13** API publique + webhooks (P2)
- [ ] **M-ADM-14** Import / migration Sage/Batigest/Excel/Odoo (P2)
- [ ] **M-ADM-15** i18n locales (FR/AR/EN + hijri) (P2)
- [ ] **M-ADM-16** Thème / white-label (P3)

## Goal

Activer la route `/admin` (actuellement 404) et fournir le **back-office complet** d'un ERP B2B multi-tenant : RBAC granulaire, SSO + 2FA, sociétés/entités, paramètres société légaux, référentiels, audit log, templates documents, numérotation, paramètres fiscaux, mappings comptables, licences, backup, API publique, import migration, i18n, white-label.

**Sans ce module, l'ERP n'est pas vendable B2B.**

## Context to read first

```
app/applications/erp/pages/administration/                       # ⚠️ Round 1 partiel
app/applications/erp/pages/administration/iam/                   # Round 1 8.1 utilisateurs
app/applications/erp/pages/administration/iam/roles/              # Round 1 8.2 rôles
app/applications/erp/pages/administration/societe/                # Round 1 8.3, 8.4 partial
app/applications/erp/shell/societe.service.ts                    # Round 1 multi-tenant
app/applications/erp/shell/components/societe-switcher/           # Round 1
app/applications/erp/administration/                              # services
app/applications/erp/shared/services/fiscal-settings.service.ts   # Round 1 6.7 paramètres fiscaux
app/applications/erp/shared/services/erp-audit.service.ts          # Round 1 14.1 audit log
app/applications/erp/shared/services/numbering.service.ts          # Round 1 numérotation
```

---

## Task 13.0 — Activer la route `/admin` **P0**

**Diagnostic** : pourquoi `/admin` retourne 404 alors que sous-routes administration existent (Round 1) ?

**Action** :
- Créer une page `/admin` (hub) qui liste toutes les sous-sections
- Vérifier routing top-level + alias éventuels

**Acceptance criteria** :
- [x] `/admin` accessible (hub) — `app/applications/erp/pages/administration/hub/admin-hub.page.ts` + route `path: 'admin'` dans `app.routes.ts` (avant `APPLICATION_ROUTES` pour priorité matcher)
- [x] Sidebar « Administration » : entrée « Accueil administration » (`administration.navigation.hub`) → `/admin`
- [x] Toutes les sous-routes accessibles depuis le hub (liens vers `/administration/…` inchangés) — e2e `tests/e2e/admin-route.spec.ts`

---

## Task 13.1 — Utilisateurs & Rôles RBAC granulaire (M-ADM-01) **P0**

**Modèle** :

```ts
export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  matriculeEmploye?: string;     // lien employé MA
  societesAccessibles: string[]; // multi-tenant
  societeDefaut: string;
  roles: UserRole[];
  status: 'ACTIF' | 'INACTIF' | 'SUSPENDU';
  derniereConnexion?: string;
  twoFactorActif: boolean;
  twoFactorMethode?: 'TOTP' | 'SMS';
}

export interface Role {
  id: string;
  nom: string;                   // « DAF », « Conducteur de travaux »
  description?: string;
  permissions: Permission[];
}

export interface Permission {
  module: string;                // « chantiers », « finance », « rh »
  action: string;                // « READ », « CREATE », « UPDATE », « DELETE », « APPROVE », « EXPORT »
  scope?: 'SOCIETE' | 'DIVISION' | 'CHANTIER' | 'SOI';  // restriction
  scopeIds?: string[];           // si scope précis
}

export interface UserRole {
  userId: string;
  roleId: string;
  societeId?: string;
  divisionId?: string;
  chantierId?: string;
  dateAffectation: string;
  dateRevocation?: string;
}
```

**Action** :
1. Page `/admin/utilisateurs` : CRUD users
2. Page `/admin/roles` : CRUD rôles + matrice permissions
3. Guard Angular `RbacGuard` qui vérifie permission avant chaque route
4. Directive `*hasPermission` pour cacher/montrer UI
5. Seeds 8 rôles BTP types : DG, DAF, RAF, Conducteur travaux, Chef chantier, Acheteur, RH, HSE

**Acceptance criteria** :
- [ ] CRUD users + rôles
- [ ] Matrice permissions (module × action × scope) éditable
- [ ] Guard fonctionnel sur toutes les routes sensibles
- [ ] Test e2e : user sans permission Finance ne voit pas la sidebar Finance

---

## Task 13.2 — SSO + 2FA (M-ADM-02) **P0**

**SSO** :
- OIDC (Open ID Connect) générique
- Connecteurs prêts : Microsoft Entra ID (Azure AD), Google Workspace
- Bouton « Se connecter avec Microsoft / Google » sur login

**2FA** :
- TOTP (Google Authenticator, Authy, Microsoft Authenticator) — recommandé
- SMS (twilio mock pour démo, vrai SMS en prod)
- Forçage 2FA pour rôles sensibles (DAF, DG, RH)

**Fichiers** :
- `app/platform/core/auth/sso/` (nouveau)
- `app/platform/core/auth/2fa/` (nouveau)

**Acceptance criteria** :
- [ ] Login SSO mock (page démo de simulation, vraie config en prod)
- [ ] 2FA TOTP : QR code à scanner + saisie code 6 chiffres
- [ ] Gestion sessions (déconnexion forcée, durée TTL)
- [ ] Round 1 8.7 démo conservée

---

## Task 13.3 — Sociétés / Entités juridiques (M-ADM-03) **P0**

Étendre Round 1 8.3 (`SocieteService` + switcher) :
- Page `/admin/societes` CRUD (Round 1 partial)
- Page `/admin/etablissements` (sièges + agences + chantiers comme établissements)
- Vue arbre groupe : société mère → filiales → établissements

**Multi-tenant data isolation** : chaque entité métier doit avoir `societeId`, et toutes les requêtes mocks filtrent automatiquement par société active (Round 1 backlog).

**Acceptance criteria** :
- [ ] CRUD sociétés et établissements
- [ ] Tous les mocks filtrent par `currentSocieteId`
- [ ] Audit log trace la société courante
- [ ] Test : switch société → toutes les données changent

---

## Task 13.4 — Paramètres société (M-ADM-04) **P0**

Étendre Round 1 `societe.page.ts` :

```ts
export interface Societe {
  id: string;
  raisonSociale: string;
  formeJuridique: 'SARL' | 'SA' | 'SAS' | 'SARL_AU' | 'EURL' | 'AUTOENTREPRENEUR';
  ice: string;                  // 15 chiffres validation
  if: string;                   // 8 chiffres
  rc: string;                   // numéro + ville (Casablanca, Rabat)
  patente: string;
  cnss: string;
  cnaem?: string;               // n° entreprise Caisse Nationale d'Aide Maritime (cas spécifiques)
  capitalSocial: number;
  ribs: RIB[];
  logoUrl?: string;
  adresseSiege: AdresseStructurée;
  adressesEtablissements: AdresseStructurée[];
  exercicesComptables: ExerciceComptable[];
}

export interface RIB {
  banque: string;               // « AWB Casablanca »
  swift?: string;
  ribComplet: string;           // 24 chiffres MA
  libelle?: string;             // « Compte principal »
  defaut?: boolean;
}
```

**Acceptance criteria** :
- [ ] Tous les champs MA renseignables avec validation format (ICE 15, IF 8, RIB 24)
- [ ] Multi-RIB par société
- [ ] Logo upload + affichage PDF
- [ ] Plusieurs exercices comptables historiques

---

## Task 13.5 — Référentiels (M-ADM-05) **P0**

Référentiels manquants (fournisseurs/articles/employés déjà OK Round 1) :
- **Clients** (entreprises et particuliers + champs MA ICE/IF)
- **MOA** (Maîtres d'Ouvrage publics et privés)
- **Banques marocaines** (référentiel SWIFT + structure RIB)

Pages `/admin/referentiels/clients`, `/admin/referentiels/moa`, `/admin/referentiels/banques`.

---

## Task 13.6 — Audit log global recherchable (M-ADM-06) **P1**

Étendre Round 1 `erpAudit` :
- Page `/admin/audit-log`
- Filtres : utilisateur, module, action, date, société, entité
- Export CSV / PDF
- Détail JSON de chaque event

---

## Task 13.7 — Templates documents WYSIWYG (M-ADM-07) **P1**

Page `/admin/templates-docs` :
- Liste de templates par type (devis, BC, facture, BL, situation, attachement, contrat ST, fiche paie, OS, etc.)
- Éditeur WYSIWYG (`tinymce` ou `quill`)
- Variables disponibles `{{societe.raisonSociale}}`, `{{client.ice}}`, `{{chantier.code}}`, `{{lignes}}` (boucle)
- Preview PDF temps réel

---

## Task 13.8 — Numérotation séquentielle (M-ADM-08) **P1**

Étendre `NumberingService` Round 1 :
- Page `/admin/numerotation` : 1 ligne par type doc × société
- Modèle : `{type}-{annee}-{seq:5}` configurable
- Préfixe, séparateur, année (4 ou 2 chiffres), séquence (largeur), reset annuel

---

## Task 13.9 — Paramètres fiscaux (M-ADM-09) **P1**

Étendre Round 1 `FiscalSettingsService` :
- Page `/admin/parametres-fiscal`
- Taux TVA (20/14/10/7/0 %)
- Retenues à la source (5 % marchés publics, autres)
- Timbre fiscal (100 MAD seuil espèces)
- Exonérations (zones franches, ANEZ, ZIA)
- Activation par société

---

## Task 13.10 — Mappings comptables (M-ADM-10) **P1**

Page `/admin/mappings-comptables` :
- Pour chaque type d'opération, configurer comptes auto :
  - Facture vente : 4111 (client) / 7XXX (revenu) / 4456 (TVA collectée) / 4453 (RAS)
  - Facture achat : 401X (fournisseur) / 61XX (charge) / 4456 (TVA déductible)
  - Paie : 64XX (salaires) / 4432 (CNSS) / 4453 (IGR) / 4438 (autres retenues)
- Mode « expert » : édition compte par compte
- Mode « assisté » : choix template (PME, ETI, BTP)

---

## Task 13.11 — Abonnements / licences (M-ADM-11) **P1**

Si SaaS, gérer :
- Nb utilisateurs souscrits vs utilisés
- Modules activés/désactivés
- Usage (stockage, exports, API)
- Renouvellement / facture

---

## Task 13.12 — Sauvegarde & restauration (M-ADM-12) **P1**

Page `/admin/backup` :
- Bouton « Sauvegarder maintenant » (mock : export JSON complet de tous les mocks)
- Téléchargement archive
- Restauration depuis fichier
- Backup planifié (mock cron config)

---

## Task 13.13 — API publique + webhooks (M-ADM-13) **P2**

- Tokens API par société
- Scopes (read/write par module)
- Quotas (req/min, req/mois)
- Webhooks (URL d'inscription par événement : chantier créé, facture validée, etc.)

---

## Task 13.14 — Import / migration (M-ADM-14) **P2**

Wizards d'import :
- Sage Maroc (export XML/CSV)
- Batigest
- Odoo
- Excel custom
- SAGEAR (cabinet expert MA)

Mapping colonnes + dry-run + import + rapport.

---

## Task 13.15 — i18n locales (M-ADM-15) **P2**

Page `/admin/locales` :
- Langue par défaut société (FR/AR/EN)
- Calendrier hijri optionnel
- Format date (DD/MM/YYYY ou autres)
- Format nombre (séparateur milliers, décimales)
- Devise par défaut (MAD)

---

## Task 13.16 — Thème / white-label (M-ADM-16) **P3**

Page `/admin/branding` :
- Logo société (déjà M-ADM-04)
- Couleurs primaire/secondaire (CSS variables)
- Favicon
- Pied de page PDF personnalisé

Différé.

---

## Routing à créer

**Fichier** : `app/applications/erp/administration/administration.routes.ts`

```ts
export const ADMIN_ROUTES: Routes = [
  { path: 'admin', loadComponent: () => import('../pages/administration/hub/admin-hub.page').then(m => m.AdminHubPage) },
  { path: 'admin/utilisateurs', /* … */ },
  { path: 'admin/roles', /* … */ },
  { path: 'admin/societes', /* … */ },
  { path: 'admin/etablissements', /* … */ },
  { path: 'admin/referentiels/clients', /* … */ },
  { path: 'admin/referentiels/moa', /* … */ },
  { path: 'admin/referentiels/banques', /* … */ },
  { path: 'admin/audit-log', /* … */ },
  { path: 'admin/templates-docs', /* … */ },
  { path: 'admin/numerotation', /* … */ },
  { path: 'admin/parametres-fiscal', /* … */ },
  { path: 'admin/mappings-comptables', /* … */ },
  { path: 'admin/abonnements', /* … */ },
  { path: 'admin/backup', /* … */ },
  { path: 'admin/api-tokens', /* … */ },
  { path: 'admin/import', /* … */ },
  { path: 'admin/locales', /* … */ },
  { path: 'admin/branding', /* … */ },
];
```

---

## Testing

```ts
describe('RbacGuard', () => {
  it('refuse route si permission manquante', () => { /* … */ });
  it('accepte si scope chantier matche', () => { /* … */ });
});

describe('AuditLogService', () => {
  it('enregistre tout CRUD avec hash chaîné', () => { /* … */ });
});

// e2e
test('/admin ne retourne plus 404', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.locator('h1, h2').first()).toContainText(/Administration/i);
});

test('User sans permission Finance ne voit pas sidebar Finance', async ({ page }) => { /* … */ });
```

## Dépendances inverses

- **Toutes les autres specs** : multi-tenant + RBAC + numérotation
- 12-approbations (rôles approbateurs)
- 14-transverse (audit log universel)
