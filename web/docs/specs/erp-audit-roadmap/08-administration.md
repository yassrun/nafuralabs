# 08 — Administration & Multi-tenancy

> **Sévérité** : P0 (manquant) → prérequis production
> **Estimation** : 2 sprints (S9–S10)
> **Dépendances** : `01-foundations`, `07-pilotage-approbations` (matrice règles)

## Findings traités

- [ ] **F-09** Module Administration (utilisateurs, rôles, permissions, paramétrage entreprise, exercices, banques)
- [ ] **SEC-01** Login + 2FA + sessions
- [ ] **SEC-02** Multi-société / multi-établissement
- [ ] **SEC-03** Permissions granulaires par rôle × module × action × chantier

## Goal

Module Administration prêt pour mise en production : gestion utilisateurs, rôles, permissions, sociétés (multi-tenant), exercices comptables, paramètres techniques (logos, ICE/IF/RC, banques, comptes comptables, taux TVA), audit log, sessions.

## Context to read first

```
app/platform/features/administration/                          # base existante (scaffolded 0%)
naf/src/spec/applications/app/administration.json              # spec administration
docs/specs/erp-frontend-agents/                                # specs admin éventuelles
app/platform/core/security/                                     # guards + permissions
```

---

## Sections du module

```
/administration/
├── members/                # utilisateurs
│   ├── invitations
│   └── sessions
├── roles/                  # rôles + permissions matrix
│   └── custom-roles
├── companies/              # sociétés (multi-entité)
│   ├── identite/           # ICE, IF, RC, Patente, RIB, logo
│   ├── etablissements/     # agences, dépôts
│   └── exercices/          # exercices comptables
├── parametres/
│   ├── general/
│   ├── localization/       # langue par défaut, fuseau horaire
│   ├── numerotation/       # séquences numéros (BC-YYYY-NNNN, etc.)
│   ├── fiscal/             # taux TVA, RAS, timbre
│   ├── banques/            # référentiel banques, RIB société
│   └── workflow-rules/     # matrice approbations (cf 07)
├── domain-activation/      # activation/désactivation des modules par tenant
├── subscriptions/          # abonnement SaaS, facturation Nafura
├── audit-log/              # piste d'audit (cf F-29)
└── integrations/           # API keys, webhooks, exports DGI/CNSS
```

---

## Task 8.1 — Utilisateurs & Sessions

**Modèles** :

```ts
export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  avatar?: string;
  isActive: boolean;
  isMfaEnabled: boolean;
  rolesIds: string[];
  companiesIds: string[];                  // accès multi-société
  defaultCompanyId: string;
  chantiersIds?: string[];                  // restriction par chantier
  derniereConnexionAt?: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  device: string;
  loginAt: string;
  lastActivityAt: string;
  expiresAt: string;
}
```

**Pages** :
- `/administration/members` : listing avec invite
- `/administration/members/:id` : profil + onglets (Identité · Rôles · Accès · Sessions · Audit)
- `/administration/members/sessions` : sessions actives (admin peut tuer)

**Acceptance criteria** :
- [ ] Invitation par email (mock : génère URL token)
- [ ] Activation/désactivation user
- [ ] 2FA toggle par user (TOTP via QR code)
- [ ] Forced logout d'une session

---

## Task 8.2 — Rôles & Permissions

**Modèle** :

```ts
export interface Role {
  id: string;
  code: string;                            // ADMIN, DAF, CT, CHEF_CHANTIER, MAGASINIER…
  nom: string;
  description?: string;
  isCustom: boolean;                       // true = créé par tenant, false = built-in
  permissions: Permission[];
}

export type Permission = `${string}.${string}.${'read' | 'create' | 'update' | 'delete' | 'approve'}`;
// Exemples: 'achats.bc.create', 'finance.facture.read', 'administration.roles.update'
```

**Page** : `/administration/roles`
- Matrix grid : colonnes = actions (read/create/update/delete/approve), lignes = entités (chantiers, BC, factures…)
- Toggle permission par cellule
- Rôles prédéfinis non éditables (ADMIN, DAF, CT…) mais clonables en custom

**Acceptance criteria** :
- [ ] 8+ rôles prédéfinis seedés (ADMIN, DG, DAF, CT, CHEF_CHANTIER, MAGASINIER, RH, COMPTABLE)
- [ ] Création rôle custom à partir d'un rôle de base (clone + édit)
- [ ] Application immédiate sur l'utilisateur (refresh permissions)
- [ ] Test : user avec rôle MAGASINIER ne voit pas `/finance/*`

---

## Task 8.3 — Sociétés & Multi-tenancy

**Modèle** :

```ts
export interface Company {
  id: string;
  nom: string;
  ice: string;                             // 15 chiffres
  if: string;
  rc: string;                              // ex. "Casa - 715869"
  patente?: string;
  cnss?: string;
  formeJuridique: 'SARL' | 'SARL_AU' | 'SA' | 'SAS' | 'SNC' | 'AUTO_ENTREPRENEUR';
  capitalSocial?: number;
  adresseSiege: string;
  villeSiege: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  logoUrl?: string;
  ribsBancaires: RibBancaire[];
  exercices: ExerciceComptable[];
  etablissements: Etablissement[];
  isActive: boolean;
}

export interface Etablissement {
  id: string;
  companyId: string;
  code: string;
  nom: string;
  type: 'SIEGE' | 'AGENCE' | 'DEPOT' | 'CHANTIER_BUREAU';
  adresse: string;
  ville: string;
  responsableId?: string;
}

export interface RibBancaire {
  id: string;
  banque: string;                          // AWB, BMCE, CIH...
  rib: string;                             // 24 chars
  iban?: string;
  swift?: string;
  intitule: string;
  isPrincipal: boolean;
}

export interface ExerciceComptable {
  id: string;
  companyId: string;
  libelle: string;                         // "Exercice 2026"
  dateDebut: string;
  dateFin: string;
  status: 'OUVERT' | 'CLOTURE' | 'ARCHIVE';
}
```

**Multi-tenant switching** :
- Header : sélecteur société (visible si user.companiesIds.length > 1)
- Switch société → reload des datasets pour cette société
- L'audit log capture la société courante de chaque action

**Acceptance criteria** :
- [ ] Création société avec validation ICE/IF/RC
- [ ] Switch société dans header
- [ ] Données filtrées par société courante (mock : `companyId` sur toutes les entités)
- [ ] Logo société utilisé dans documents PDF (cf 12-exports)

---

## Task 8.4 — Paramètres techniques

**Sous-pages** :

### `/administration/parametres/numerotation`
Configurer les masques de numéros pour chaque entité : `BC-{{YYYY}}-{{NNNN}}`, `FACT-{{YY}}{{MM}}-{{NNNNN}}`, etc.

### `/administration/parametres/fiscal`
- Taux TVA : 20%, 14%, 10%, 7% (configurables, ajout/suppression)
- Retenue à la source : 5% (modifiable)
- Timbre fiscal : seuil 10 000 MAD, taux 0,25%, plafond 100 MAD
- Exonérations (logement social, etc.)

### `/administration/parametres/banques`
- Référentiel banques marocaines (codes IFI : 011, 012, 013, 020, 021…)
- RIBs société (RibBancaire[] de la société)

### `/administration/parametres/general`
- Langue par défaut, fuseau horaire (Africa/Casablanca)
- Logo
- Pied de page documents
- Email expéditeur

### `/administration/parametres/workflow-rules`
- Matrice des règles d'approbation (cf 07-Task 7.1)
- UI : table éditable par entité × seuils × rôles approbateurs

**Acceptance criteria** :
- [ ] 6 sous-pages fonctionnelles avec persistance (mock localStorage initialement)
- [ ] Modifications appliquées sans recharger l'app

---

## Task 8.5 — Domain activation

**Page** : `/administration/domain-activation`

**Concept** : un tenant peut activer/désactiver des modules selon son abonnement.

**Modèle** :

```ts
export interface DomainActivation {
  domainId: string;                        // 'finance', 'rh', 'hse', etc.
  companyId: string;
  isActive: boolean;
  activatedAt?: string;
  deactivatedAt?: string;
  subscriptionPlan?: string;               // 'STARTER' | 'PRO' | 'ENTERPRISE'
}
```

**UI** : grille des 13 modules avec toggle on/off + indication du plan requis.

**Comportement** : module désactivé → masqué dans sidebar + route guard 403.

**Acceptance criteria** :
- [ ] Désactivation HSE → entrée HSE disparaît du sidebar
- [ ] `/hse/*` retourne 403 ou redirect vers `/`
- [ ] Réactivation : sidebar réapparaît immédiatement

---

## Task 8.6 — Audit log centralisé

**Modèle** :

```ts
export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  companyId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'PRINT';
  entityType: string;                      // 'BC', 'FACTURE', 'USER', etc.
  entityId: string;
  entityRef?: string;                      // numéro lisible
  diff?: { field: string; oldValue: unknown; newValue: unknown }[];
  ipAddress?: string;
  userAgent?: string;
}
```

**Page** : `/administration/audit-log`

**UX** :
- Filtres : période, user, company, entité, action
- Pagination + virtualisation (cf F-19)
- Click ligne → modal avec diff complet
- Export CSV

**Wirer** : intercepteur HTTP qui logge toute mutation. Pour mock, chaque facade enregistre dans le store.

**Acceptance criteria** :
- [ ] Toute action create/update/delete/approve apparaît dans le log
- [ ] Diff visible (champ X : ancien → nouveau)
- [ ] Filtre fonctionne sur 1000+ entrées
- [ ] Export CSV des 30 derniers jours

---

## Task 8.7 — Login + 2FA + sessions

**Pages** :
- `/login` : email + mot de passe + (2FA si activé)
- `/login/forgot` : reset password
- `/login/2fa-setup` : QR code TOTP + codes de secours

**Sécurité** :
- JWT + refresh token (existant ?)
- Session timeout 30 min inactivité
- Logout auto à fermeture onglet (configurable)
- Login attempts : block après 5 fails / 15 min

**Acceptance criteria** :
- [ ] Page login fonctionnelle (mock : accept any credentials avec validation format)
- [ ] 2FA setup avec QR code + 10 codes de secours
- [ ] Test e2e : login → app → logout → /login

---

## Routing à wirer

**Fichier** : `app/applications/erp/administration/administration.routes.ts`

```ts
export const ADMINISTRATION_ROUTES: Routes = [
  { path: 'administration', pathMatch: 'full', redirectTo: 'administration/members' },
  { path: 'administration/members', loadChildren: () => import('../pages/administration/members/members.routes').then(m => m.MEMBERS_ROUTES) },
  { path: 'administration/roles', loadChildren: () => import('../pages/administration/roles/roles.routes').then(m => m.ROLES_ROUTES) },
  { path: 'administration/companies', loadChildren: () => import('../pages/administration/companies/companies.routes').then(m => m.COMPANIES_ROUTES) },
  { path: 'administration/parametres', loadChildren: () => import('../pages/administration/parametres/parametres.routes').then(m => m.PARAMETRES_ROUTES) },
  { path: 'administration/domain-activation', loadComponent: () => import('../pages/administration/domain-activation/domain-activation.page').then(m => m.DomainActivationPage) },
  { path: 'administration/audit-log', loadComponent: () => import('../pages/administration/audit-log/audit-log.page').then(m => m.AuditLogPage) },
];
```

**Guards** : `routePermissionGuard` avec `permissions: ['administration.*']`.

## Dépendances inverses

- Toutes les autres tâches : ce module définit les permissions consommées partout
