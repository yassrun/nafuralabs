# Nafura Sektor — Backlog Doxura × ERP (extraction documentaire IA)

> **Roadmap produit maître (tous piliers, IA agentique) :** voir [`ROADMAP-AGENTIC-BTP-ERP.md`](./ROADMAP-AGENTIC-BTP-ERP.md).
>
> Backlog consolidé issu de l'analyse Doxura / doc-extractor × modules ERP (2026-06-18).
> Format pensé pour exécution par un agent : chaque ticket est autonome (fichiers, problème, fix attendu, critères d'acceptation).
>
> **Terminologie :**
> - **Doxura** = marque produit UI (`doc-extractor`, i18n `docExtractor.*`)
> - **doc-extractor** = module plateforme (`platform/features/documents/doc-extractor/`)
> - **doc-manager** = GED / pièces jointes (`platform/features/collaboration/doc-manager/`)
>
> **Références :**
> - Pattern de référence BL : `applications/erp/pages/inventory/mouvements/receptions/reception-detail/reception-detail.page.ts`
> - Spec plateforme documents : `docs/specs/documents/00-overview.md`
> - Navigation ERP : `applications/erp/shell/erp-nav.generated.ts`
> - Seeds doc types : `backend/platform/features/documents/doc-extractor/src/main/resources/db/changelog/data/v1.0/`
>
> **Règles transverses (intégrations ERP) :**
> - Réutiliser `DocTypeService.getActiveDefinition(domainKey, docTypeKey, tenantId)` + `ExtractionService.extract({ file, docTypeDefinitionId, persist: false })`
> - Mapper extrait → formulaire ERP avec résolution lookups (fournisseur, chantier, article) — voir `applyExtractedBlToReception()`
> - Bouton scan + `<input type="file" hidden>` + query param auto-scan (`?scanX=1`) depuis le listing
> - i18n fr/en/ar sous `applications/erp/<module>/` (pas de chaînes en dur)
> - Pas de `window.prompt/confirm/alert` — `ConfirmDialogService`
> - Exécuter les handlers dans le **contexte d'injection Angular** (`runInInjectionContext` si callback async)
>
> **Gates par PR :** `npm run lint`, `npm run i18n:check`, `npm run build:prod`
> **Gates back (si seed / controller) :** tests module doc-extractor + migration Liquibase

---

## Inventaire des doc types Doxura (état au 2026-06-18)

| Domaine | Clé | Nom | Seed | Intégration ERP |
|---------|-----|-----|------|-----------------|
| `logistic` | `BL` | Bon de livraison | ✅ | ✅ Réceptions stock |
| `logistic` | `PACKING_LIST` | Liste de colisage | ✅ | ❌ |
| `inventory` | `NDT` | Note de transfert | ✅ | ❌ |
| `btp` | `BON_COMMANDE` | Bon de commande | ✅ | ❌ |
| `btp` | `DEVIS` | Devis | ✅ | ❌ |
| `finance` | `SUPPLIER_INVOICE` | Facture fournisseur | ✅ | ❌ |
| `finance` | `CUSTOMER_INVOICE` | Facture client | ✅ | ❌ |
| `finance` | `RECEIPT` | Reçu / ticket | ✅ | ❌ |

**Doc types à créer (BTP Maroc) :** voir section P1-N et P2-N.

---

## Architecture cible (rappel)

```
Upload PDF/image
    → Doxura extract (LLM + JSON schema)
    → JSON structuré
    → Résolution lookups ERP (fournisseur, chantier, article…)
    → Préremplissage formulaire
    → Validation humaine
    → Persist ERP (+ optionnel : doc-manager via storedDocumentId)
```

**Gaps plateforme connus** (voir `docs/specs/documents/00-overview.md`) :
- `storedDocumentId` (lien extraction ↔ GED) non câblé
- `exportToSeyruraInternal` limité au BL aujourd'hui
- Workspace Doxura standalone existe (`/doc-extractor/*`) mais peu utilisé depuis l'ERP

---

## ✅ Déjà fait (ne pas refaire)

### DX-0 — Scanner BL sur réceptions stock
- **Écrans :** `/inventory/mouvements/receptions` (listing + détail)
- **Fichiers :** `reception-detail.page.ts`, `reception-listing.page.ts`, `config/detail/detail.config.ts`, `config/listing/listing.config.ts`
- **Doc type :** `logistic / BL`
- **Comportement :** bouton « Scanner BL » → extraction → préremplissage fournisseur, chantier, phase, référence, date, lignes articles
- **Mobile :** `mobile/lib/features/doc_extractor/bl/bl_backend_api.dart`
- **Acceptation :** validé — **référence à dupliquer** pour les autres intégrations

---

## F0 — Fondations transverses (prérequis recommandés)

### F0-1 — Service partagé `ErpDocScanService` (factoriser le pattern BL)
- **Pourquoi :** chaque intégration recopie ~150 lignes (extract, parse JSON, alias walk, lookup resolve, date normalize). Risque de divergence et bugs DI (`NG0203`).
- **Fichiers à créer :**
  - `applications/erp/shared/services/erp-doc-scan.service.ts`
  - `applications/erp/shared/utils/extraction-json.utils.ts` (extraire `findByAliases`, `normalizeDate`, `extractLines` depuis reception-detail)
  - `applications/erp/shared/models/doc-scan.types.ts`
- **API cible :**
  ```ts
  scanAndMap<T>(args: {
    file: File;
    domainKey: string;
    docTypeKey: string;
    mapper: (data: Record<string, unknown>, ctx: LookupContext) => Partial<T>;
    lookups: () => Record<string, LookupEntry[]>;
  }): Promise<Partial<T>>
  ```
- **Acceptation :** `reception-detail` refactoré pour utiliser le service partagé ; comportement BL inchangé ; tests unitaires sur les utils JSON.

### F0-2 — Composant réutilisable `nf-doc-scan-button`
- **Pourquoi :** bouton + input file + spinner + toasts identiques sur chaque écran.
- **Fichiers :** `applications/erp/shared/components/doc-scan-button/doc-scan-button.component.ts`
- **Inputs :** `domainKey`, `docTypeKey`, `disabled`, `labelKey`, `accept` (pdf,image)
- **Outputs :** `extracted` (Record), `scanError`
- **Acceptation :** utilisé sur au moins réceptions + une autre page pilote ; i18n fr/en/ar.

### F0-3 — Câbler `storedDocumentId` (extraction → doc-manager)
- **Pourquoi :** tracer le PDF source sur l'entité ERP (audit, conformité).
- **Spec :** `docs/specs/documents/05-extractor-manager-wiring.md`
- **Fichiers :** backend `ExtractionFlowService`, frontend `ErpAttachmentUploadService`, handlers post-save ERP
- **Acceptation :** après scan + save réception, la pièce jointe apparaît sur l'entité via `<nf-attachment-list>`.

### F0-4 — Étendre `exportToSeyruraInternal` au-delà du BL
- **Pourquoi :** aujourd'hui message i18n `onlyBLSupported` — bloque l'import masse depuis workspace Doxura.
- **Fichiers :** `ExtractionExportService.java`, `doc-extraction-workspace.component.ts`, seeds `excel_mapping`
- **Acceptation :** export auto vers ERP pour au moins BL + SUPPLIER_INVOICE + BON_COMMANDE.

### F0-5 — Permissions ERP pour scan documentaire
- **Pourquoi :** activer `doc-extractor` dans `erp.application.json` sans garde fine par module.
- **Fix :** permissions `stock.reception.scan`, `achats.commande.scan`, `finance.ff.scan`, etc. + `permissionGuard` sur actions custom.
- **Acceptation :** rôle VIEWER ne voit pas le bouton scan ; MANAGER oui.

---

## P0 — Bloquant / ROI immédiat

### P0-1 — Scanner facture fournisseur → factures fournisseurs
- **Module :** Finance → `/finance/factures-fournisseurs`
- **Doc type existant :** `finance / SUPPLIER_INVOICE`
- **Pourquoi :** goulet DAF — saisie manuelle factures PDF/email. Très haute fréquence.
- **Fichiers :**
  - `applications/erp/pages/finance/factures-fournisseurs/ff-detail/ff-detail.page.ts`
  - `applications/erp/pages/finance/factures-fournisseurs/config/detail/detail.config.ts`
  - i18n `applications/erp/finance/{fr,en,ar}.json`
- **Mapping attendu :**
  - `invoiceNumber` → numéro facture
  - `date` → date facture
  - `supplier.name` → lookup `fournisseursLookup`
  - `totals.{subtotal,vatTotal,total}` → montants HT/TVA/TTC
  - `lineItems[]` → lignes comptables / analytique chantier
  - `currency` → devise (défaut MAD)
- **Acceptation :** upload PDF facture fournisseur → formulaire FF prérempli (≥ en-tête + lignes) ; correction manuelle possible ; persist OK.

### P0-2 — Scanner bon de commande fournisseur → commandes achats
- **Module :** Achats → `/achats/commandes`
- **Doc type existant :** `btp / BON_COMMANDE`
- **Pourquoi :** BC reçu signé par email — saisie lignes longue et error-prone.
- **Fichiers :**
  - `applications/erp/pages/achats/commandes/bc-detail/bc-detail.page.ts` (ou équivalent detail)
  - `applications/erp/pages/achats/commandes/config/detail/*`
- **Mapping :** `orderReference`, `date`, `supplier`, `items[]{designation,quantity,uom,unitPrice,vatRate}`, `totals`
- **Acceptation :** scan BC PDF → commande achat préremplie avec lignes ; fournisseur résolu ou proposé en création.

### P0-3 — Import DPGF / BPU → lots chantier
- **Module :** Chantiers → `/chantiers/:id` (lots)
- **Doc type à créer :** `btp / DPGF` (nouveau seed)
- **Pourquoi :** **bloqueur métier** — sans quantité/prix unitaire sur lots, situations à 0 MAD (cf. `BACKLOG.md` P0-1). Complément direct à la saisie manuelle.
- **Schéma JSON cible :**
  - `projectReference`, `client`, `date`
  - `lots[]{code, designation, unite, quantite, prixUnitaireHt, lotParent?}`
- **Fichiers :**
  - Seed : `backend/.../changelog/data/v1.0/009_seed_doc_type_btp_dpgf.sql`
  - `applications/erp/pages/chantiers/chantier-detail/chantier-detail.page.ts`
  - `applications/erp/pages/chantiers/services/chantier-lot-api.service.ts`
- **Acceptation :** upload DPGF PDF ou Excel → lots créés/mis à jour avec quantité + PU ; situation suivante affiche Net HT ≠ 0.

### P0-4 — Scanner devis fournisseur → devis études + bibliothèque prix
- **Module :** Études → `/etudes/devis` + `/etudes/bibliotheque-prix`
- **Doc type existant :** `btp / DEVIS`
- **Pourquoi :** chiffrage initial et alimentation bibliothèque prix depuis offres reçues.
- **Fichiers :**
  - `applications/erp/pages/etudes/devis/devis-detail/devis-detail.page.ts`
  - `applications/erp/pages/etudes/bibliotheque-prix/bibliotheque-prix-detail/*` (option import lignes)
- **Mapping :** `quoteReference`, `issuer`, `client`, `items[]`, `totals`
- **Acceptation :** scan devis PDF → devis prérempli ; action « Importer vers bibliothèque » sur lignes sélectionnées.

---

## P1 — Majeur (intégrations existantes + types BTP)

### P1-1 — Scanner note de transfert → transferts stock
- **Module :** Stock → `/inventory/mouvements/transferts`
- **Doc type existant :** `inventory / NDT`
- **Mapping :** `transferReference`, `date`, `fromLocation`, `toLocation`, `lines[]{article,quantity,uom}`
- **Fichiers :** `transfert-detail.page.ts`, config detail/listing
- **Acceptation :** scan NDT → transfert prérempli dépôt source/destination + lignes.

### P1-2 — Scanner liste de colisage → complément réceptions
- **Module :** Stock → `/inventory/mouvements/receptions`
- **Doc type existant :** `logistic / PACKING_LIST`
- **Pourquoi :** BL parfois incomplet ; packing list détaille colis/articles.
- **Comportement :** second bouton « Scanner colisage » ou fusion intelligente avec lignes BL existantes.
- **Acceptation :** scan packing list enrichit/complète lignes réception sans écraser les données validées.

### P1-3 — Scanner reçu / ticket → règlements & caisses
- **Module :** Finance → `/finance/reglements`, `/finance/caisses`
- **Doc type existant :** `finance / RECEIPT`
- **Mapping :** montant, date, bénéficiaire, référence, mode paiement
- **Acceptation :** scan ticket caisse → mouvement caisse ou règlement brouillon prérempli.

### P1-4 — Scanner devis → demandes d'achat & appels d'offres
- **Module :** Achats → `/achats/demandes`, `/achats/appels-offres`
- **Doc type :** `btp / DEVIS` (réutilisé)
- **Comportement :** importer offre fournisseur comme ligne comparative AO
- **Fichiers :** `ao-detail.page.ts`, `ao-comparatif/*`, `demande-detail.page.ts`
- **Acceptation :** scan devis → ligne AO avec prix unitaires ; comparatif multi-fournisseurs alimenté.

### P1-5 — Doc type `btp / METRE` → attachements & métrés études
- **Module :** Chantiers → `/chantiers/attachements` ; Études → `/etudes/metres`
- **Pourquoi :** saisie quantités terrain depuis PDF papier — très fréquent BTP.
- **Schéma :** `chantierRef`, `date`, `lignes[]{poste, designation, unite, quantite}`
- **Seed + intégration** sur pages attachement et métré
- **Acceptation :** scan métré PDF → lignes quantitatives préremplies.

### P1-6 — Doc type `marches / ORDRE_SERVICE` → OS marchés publics
- **Module :** Marchés → `/marches/os`
- **Schéma :** `osNumber`, `date`, `moa`, `objet`, `montant`, `delai`, `chantierRef`
- **Acceptation :** scan OS signé → fiche OS préremplie liée au contrat/chantier.

### P1-7 — Doc type `btp / SITUATION_ST` → sous-traitance chantier
- **Module :** Chantiers → `/chantiers/sous-traitance`
- **Schéma :** situation mensuelle ST : en-tête + lignes `{lot, quantite, montant}`
- **Acceptation :** scan situation sous-traitant → brouillon situation ST.

### P1-8 — Doc type `marches / SITUATION_MOA` → factures marché
- **Module :** Marchés → `/marches/factures`
- **Schéma :** situation MOA : numéro, période, montants HT/TVA/RG/net
- **Acceptation :** scan situation MOA → facture marché préremplie.

### P1-9 — Doc type `finance / RELEVE_BANCAIRE` → rapprochement bancaire
- **Module :** Finance → `/finance/rapprochement`
- **Schéma :** `banque`, `periode`, `soldeInitial`, `soldeFinal`, `operations[]{date,libelle,montant,sens}`
- **Acceptation :** scan relevé PDF → lignes rapprochement importées ; suggestion lettrage (manuel d'abord).

### P1-10 — Scanner BL → sorties & retours stock
- **Module :** Stock → `/inventory/mouvements/sorties`, `/inventory/mouvements/retours`
- **Doc type :** `logistic / BL` (réutilisé, sens inversé pour retours)
- **Acceptation :** scan BL sortie chantier → sortie stock préremplie.

### P1-11 — Workspace Doxura accessible depuis l'ERP (lien contextuel)
- **Pourquoi :** feature `doc-extractor: true` activée mais navigation ERP ne pointe pas vers Doxura.
- **Fix :** entrée sidebar « Documents IA » ou action contextuelle « Ouvrir dans Doxura » depuis les écrans scan.
- **Route :** `/doc-extractor/workspace?domain=btp&docType=BON_COMMANDE`
- **Acceptation :** navigation ERP → workspace Doxura avec doc type pré-sélectionné.

---

## P2 — Mineur / compléments

### P2-1 — Doc type `inventory / BON_SORTIE` → sorties chantier
- Bon de sortie matériaux chantier (format local Maroc).

### P2-2 — Doc type `inventory / INVENTAIRE_PHYSIQUE` → inventaires
- Feuille de comptage papier → lignes écart inventaire.

### P2-3 — Doc type `materiel / TICKET_CARBURANT` → carburant GMAO
- Ticket station → saisie consommation carburant engin.

### P2-4 — Doc type `materiel / CONTRAT_LOCATION` → locations matériel
- Contrat location engin → fiche location préremplie.

### P2-5 — Doc type `materiel / RAPPORT_OT` → maintenance
- Rapport intervention → ordre de travail clôturé.

### P2-6 — Doc type `partner / KBIS_MAROC` → fiche fournisseur/client
- Extraction ICE, RC, raison sociale, adresse → onboarding partenaire.

### P2-7 — Doc type `marches / CAUTION_BANCAIRE` → cautions
- Scan caution → fiche caution (montant, banque, échéance).

### P2-8 — Doc type `marches / AVENANT` → avenants contrat
- Avenant signé → brouillon avenant lié au contrat.

### P2-9 — Doc type `marches / PV_RECEPTION_DEF` → DGD
- PV réception définitive → déclencheur DGD.

### P2-10 — Doc type `hse / PV_INSPECTION` → inspections HSE
- Checklist / PV → fiche inspection préremplie.

### P2-11 — Doc type `hse / PV_ACCIDENT` → incidents
- PV accident → fiche incident.

### P2-12 — Doc type `rh / FEUILLE_POINTAGE` → pointage RH
- Feuille papier chantier → lignes pointage.

### P2-13 — Doc type `rh / CIN` → dossier employé
- Carte identité → champs identité employé.

### P2-14 — Facture client entrante (`finance / CUSTOMER_INVOICE`)
- Cas rare (avoir client reçu) → `/ventes/avoirs` ou factures.

### P2-15 — App mobile : étendre au-delà du BL
- **Fichiers :** `mobile/lib/features/doc_extractor/`
- **Cibles :** NDT terrain, ticket carburant, feuille pointage, photo BL chantier
- **Acceptation :** même API extract, écrans métier mobile pour chef de chantier.

### P2-16 — Tests e2e scan documentaire
- **Fichier :** `web/tests/e2e/erp-doc-scan.spec.ts`
- **Scénarios :** réception BL (régression), facture FF, commande achat (fixtures PDF mock)
- **Acceptation :** e2e vert en CI avec LLM mocké ou fixture JSON.

---

## P3 — IA agentique (au-delà de l'extraction)

> Modules déjà activés : `ai-conversation`, `ai-agent-runtime`, `llm-provider`.
> Ces tickets complètent Doxura — ne pas confondre avec l'extraction structurée.

### P3-1 — Agent rapprochement facture ↔ BC ↔ BL
- **Déclencheur :** après P0-1 (scan facture FF)
- **Comportement :** suggère BC et réception(s) correspondantes ; score de confiance ; action « Lettrer »
- **Fichiers :** `ai-agent-runtime`, facade finance
- **Acceptation :** facture scannée → proposition rapprochement avec ≥ 1 match quand BC+BL existent.

### P3-2 — Agent résolution articles (fuzzy match catalogue)
- **Déclencheur :** post-extraction lignes (BL, BC, FF)
- **Comportement :** `designation` extraite → suggestion `articleId` catalogue (Levenshtein + embeddings)
- **Acceptation :** lignes sans code article reçoivent suggestion avec badge confiance.

### P3-3 — Assistant conversationnel contextuel par module
- **Exemples :** « Résume ce BL », « Quel écart entre ce devis et le budget chantier ? »
- **Intégration :** panneau latéral sur écrans détail (chantier, facture, commande)
- **Acceptation :** contexte entité injecté dans le prompt ; réponse en français.

### P3-4 — Comparatif AO multi-devis (agent)
- **Module :** `/achats/appels-offres` comparatif
- **Comportement :** après import devis (P1-4), agent génère tableau comparatif + écarts + recommandation
- **Acceptation :** 3 devis scannés → comparatif prix/délais unifié.

### P3-5 — Workflow approbation post-extraction
- **Module :** `/approbations`
- **Comportement :** extraction `persist: true` → record DRAFT → soumission workflow → VALIDATED → export ERP
- **Acceptation :** facture > seuil passe par inbox approbations avant création FF.

### P3-6 — Email entrant → extraction automatique
- **Spec :** `09-email-engine` (hors scope immédiat)
- **Comportement :** PDF en pièce jointe email `factures@tenant` → brouillon FF
- **Acceptation :** email test → facture brouillon visible dans FF.

---

## ⛔ Hors scope Doxura (utiliser autre brique)

| Module ERP | Raison |
|------------|--------|
| Journaux, balance, analytique | Données calculées — pas de document source |
| Analytics, pilotage | Agrégats — plutôt `ai-conversation` |
| Planning chantier / RH | Données structurées saisies — pas scan PDF |
| DUER, PPSPS, PHS, registres légaux | GED (`doc-manager`) + résumé IA optionnel, pas extraction champs |
| Configuration (devises, UoM, dépôts) | Référentiel — saisie formulaire |
| Déclarations fiscales (SIMPL-IS, 9421) | Génération sortante, pas OCR entrant |

---

## Matrice module × priorité (vue synthèse)

| Zone | Module | Ticket(s) | Priorité |
|------|--------|-----------|----------|
| Stock | Réceptions | DX-0 ✅ | — |
| Stock | Transferts | P1-1 | P1 |
| Stock | Sorties / retours | P1-10, P2-1 | P1/P2 |
| Stock | Inventaires | P2-2 | P2 |
| Achats | Commandes | P0-2 | **P0** |
| Achats | Demandes / AO | P1-4, P3-4 | P1 |
| Achats | Fournisseurs | P2-6 | P2 |
| Chantiers | Lots / DPGF | P0-3 | **P0** |
| Chantiers | Attachements | P1-5 | P1 |
| Chantiers | Sous-traitance | P1-7 | P1 |
| Études | Devis | P0-4 | **P0** |
| Études | Métrés | P1-5 | P1 |
| Marchés | OS | P1-6 | P1 |
| Marchés | Factures | P1-8 | P1 |
| Marchés | Cautions / avenants / DGD | P2-7, P2-8, P2-9 | P2 |
| Finance | Factures fournisseurs | P0-1 | **P0** |
| Finance | Règlements / caisses | P1-3 | P1 |
| Finance | Rapprochement | P1-9 | P1 |
| Matériel | Carburant / location / OT | P2-3, P2-4, P2-5 | P2 |
| RH | Pointage / employés | P2-12, P2-13 | P2 |
| HSE | Inspections / incidents | P2-10, P2-11 | P2 |
| Plateforme | Fondations | F0-1 → F0-5 | Prérequis |
| IA | Agents | P3-1 → P3-6 | P3 |

---

## Ordre d'exécution conseillé

```
Phase 0 — Fondations
  F0-1 (service partagé) → F0-2 (composant bouton) → F0-5 (permissions)

Phase 1 — Quick wins (doc types existants, ROI immédiat)
  P0-1 (factures FF) → P0-2 (commandes achats) → P1-1 (transferts NDT) → P1-3 (reçus)

Phase 2 — Bloqueurs BTP
  P0-3 (DPGF/BPU lots) → P0-4 (devis études) → P1-5 (métrés)

Phase 3 — Chaîne achats complète
  P1-4 (AO/devis) → P1-2 (packing list) → P1-10 (sorties BL) → F0-4 (export Seyrura)

Phase 4 — Finance avancée
  P1-9 (relevé bancaire) → P3-1 (agent rapprochement)

Phase 5 — Marchés & ST
  P1-6 (OS) → P1-7 (situation ST) → P1-8 (situation MOA)

Phase 6 — Polish & mobile
  F0-3 (GED wiring) → P1-11 (lien workspace) → P2-* → P2-15 (mobile) → P2-16 (e2e)

Phase 7 — IA agentique
  P3-2 → P3-3 → P3-4 → P3-5 → P3-6
```

---

## Template ticket (pour ajouts futurs)

```markdown
### PX-N — [Titre court]
- **Module :** [zone] → `[route ERP]`
- **Doc type :** `[domaine] / [CLÉ]` (existant ✅ | à créer)
- **Pourquoi :** [douleur métier, fréquence, lien backlog ERP]
- **Fichiers :**
  - `[chemins relatifs web/]`
  - `[chemins relatifs backend/]` (si seed)
- **Mapping :** `champ JSON → champ ERP`
- **Lookups :** fournisseurs, chantiers, articles, …
- **Acceptation :** [critères testables bout-en-bout]
- **Dépendances :** [F0-1, P0-x, …]
```

---

## Liens avec le backlog ERP principal

| Backlog ERP (`BACKLOG.md`) | Lien Doxura |
|----------------------------|-------------|
| P0-1 Lots BPU/DPGF | **P0-3** import DPGF via Doxura |
| P0-2 Mouvements stock | **P1-1** NDT, **P1-10** sorties |
| P1-3 Création contrat marché | **P0-3** DPGF + **P1-6** OS |
| P2-4 Import BAM taux change | hors scope extraction |

---

*Dernière mise à jour : 2026-06-18*
