# ROADMAP — nafura-platform

> Les chantiers dans l’ordre. Ce qui est livré est décrit dans [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), pas ici.

## Prochains

00. **Outillage et build sans machine ni admin** — **en premier** : le lab ne démarre plus (dépôt en intégrité basse, JDK dans le dépôt) et reste lent. Contrat et écarts : [ops/README.md](ops/README.md) § Outillage. Ordre : outillage hors dépôt + `bootstrap` + `toolchain` + `doctor` → daemon et caches Gradle → base du lab hors dépôt et `stop` → `@angular/build`. Pas de Docker ni de dev container (postes clients sans Docker).
0. **Notifications** — état ~8/10 + suite : [docs/capabilities/notifications.md](docs/capabilities/notifications.md) § Roadmap.
0 bis. **Audit** — état ~8/10 + suite : [docs/capabilities/audit.md](docs/capabilities/audit.md) § Roadmap.
0 ter. **IAM / Membres** — état ~5/10 → 8/10 : [docs/capabilities/iam.md](docs/capabilities/iam.md) § Roadmap (UX archétype, accept invite host, last OWNER, audit).
0 quater. **IA / Fournisseurs** — livré ~8/10 (BYOK, catalogue, quotas, privacy, RBAC/audit, UI) : [docs/capabilities/ai.md](docs/capabilities/ai.md). Préalable utile à Conversation IA.
0. **Listes : la suite** — le socle est livré (descripteur du record, grammaire de filtre, vues, filtres proposés : [PLATFORM.md](docs/PLATFORM.md), [UI.md](docs/UI.md)). Reste :
   - Écrans d’administration sur des contrôleurs non-record (clés d’API, webhooks, séquences de numérotation) : passer en `RecordController` (entités sur `TenantEntity` : colonnes `created_by` / `updated_by` ; permissions `…read/write` → `…read/create/update/delete` ; clé et secret jamais sérialisés ; création de clé et révocation surchargées ; statut « expiré » calculé), puis supprimer `LegacyListingPageComponent`.
   - Archétype « config-driven » (`lib/anatomy` `ListingPageConfig`, 7 écrans plateforme) : migrer vers `nf-listing-page`, un seul type de liste.
   - Plus tard : vues enregistrées par l’utilisateur, rollups, `timeline`, `gallery`, `list`, regroupement à deux niveaux.
1. **Statuts et approbations** — approbateur désigné par permission (plus par rôle), approbations multi-étapes, historique des transitions, notifications aux approbateurs.
2. **Réglages** — réglages déclarés par un BC (manifeste), rendus par l’écran Paramètres ; tableau de bord sans widgets métier en dur.
3. **Documents** — impression personnalisée (modèles, marque de l’organisation ; le lab n’a pas Gotenberg). L’import d’une fiche depuis un endpoint du BC est livré (`RecordPageConfig.import`). Reste le type de document `{ domain, type }` : aujourd’hui il vit en base (`DocTypeController`), pas dans un seed de référence — ne pas inventer un second format.
4. **Conversation IA et chat** — un seul concept de conversation, outils tirés des BCs. Runtime / admin fournisseurs : [docs/capabilities/ai.md](docs/capabilities/ai.md).
5. **Composants métier** — montants, BTP ; i18n par BC ; écrans utilisables sur mobile ; surcharge du design par produit.
6. **Tenancy `multi`** — API, isolation, sélecteur et seeding à la création : livrés (voir [PLATFORM.md](docs/PLATFORM.md#connexion-et-organisation)). Reste la console opérateur (écrans Organisations et Utilisateurs), le lien d’invitation branché sur `InvitationAcceptService`, la coquille publique, le débit, l’effacement et le consentement de partage.
7. **Sektor sur le host** — `app.nafura.json` + BCs Sektor, suppression de `socle`, plus de vérification de rôle ; e2e Sektor verts.
8. **Publication** — BOM Maven et paquets npm à la place de `includeBuild` et des alias source ; venue-catalog et MBS sur le host.

## Nouvelles capabilities (à concevoir)

> Recensées le 2026-10-06 à partir des besoins de Talents Boosters (recrutement), Sektor (BTP) et de deux produits envisagés : un système de gestion de cartes (CMS, type PowerCARD de HPS) et un core banking. Chacune devient une capability du catalogue (`capabilities.json`, `docs/capabilities/<id>.md`, test `testWithout-<cap>`) au moment de sa conception. Ordre : d’abord ce qui sert plusieurs produits.

### Communes (tous produits) — en premier

1. **Moteur de règles** — règles déclaratives (JSON) évaluées à la volée, résultat expliqué règle par règle ; le scoring à critères pondérés en est un cas (matching Talents Boosters, comparaison de devis Sektor, éligibilité et limites bancaires, fraude).
2. **Référentiels** — taxonomies hiérarchiques, synonymes, portée produit ou organisation, import/export, **paramétrage versionné à date d’effet** (postes types et compétences, référentiels articles et activités Sektor, produits bancaires).
3. **Chiffrement et données personnelles** — champs chiffrés au repos, clés dans Vault (HSM ensuite), masquage à l’affichage ; consentement versionné, export, effacement ou anonymisation, durées de conservation, registre des traitements (loi 09-08).
4. **Recherche et dédoublonnage** — plein texte, facettes, recherche sémantique, détection et fusion des doublons (vivier de candidats, articles et fournisseurs).
5. **Contrôles renforcés** — renforcer `approvals` (double validation : jamais le même utilisateur, sur toute modification déclarée sensible) et `audit` (journal scellé, non modifiable, conservation longue).
6. **Fiabilité des intégrations** — idempotence des opérations, outbox d’événements, reprise ; API publique (clés, quotas, OAuth client credentials, documentation).

### Ciblées

- **Agenda et créneaux** — entretiens (Talents Boosters, option B), planning de chantier.
- **Messagerie avec des externes** — recruteur ↔ candidat (option A), fournisseurs.
- **SMS et authentification forte** — OTP, ré-authentification avant une opération sensible (Keycloak le permet, rien n’est branché).
- **Signature électronique**, **paiement** (passerelle derrière `subscriptions`), **connecteurs entrants** (`webhooks` ne fait que sortir), **traduction du contenu**.

### Financières (CMS cartes, core banking)

- **Grand livre** — écritures en partie double immuables, soldes, multi-devises.
- **Moteur de produits et de tarification** — produits paramétrables (frais, taux, plafonds, échéances), intérêts et commissions.
- **KYC**, **lutte anti-blanchiment** (listes de sanctions, scénarios, déclarations), **fraude** (scoring temps réel, file d’investigation).
- **Rapprochement** — lettrage automatique entre deux sources, gestion des écarts.
- **Traitements de fin de journée** — orchestration, ordre, reprise et rejeu (au-delà de `jobs`).
- **Messagerie financière** (ISO 8583, ISO 20022, SWIFT), **reporting réglementaire** (Bank Al-Maghrib), **tokenisation PCI-DSS**.

Limite à garder en tête : la plateforme couvre le **back-office** de ces produits (paramétrage, KYC, cycle de vie des cartes, réclamations, double validation, reporting). Le **moteur transactionnel** (autorisation carte en temps réel, ledger à forte cohérence, haute disponibilité, certifications) est un composant dédié, à concevoir à part et piloté par la plateforme.
