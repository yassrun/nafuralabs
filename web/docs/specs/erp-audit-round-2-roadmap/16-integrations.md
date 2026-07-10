# 16 — Intégrations & Connecteurs (DGI, CNSS, banques, OMPIC, WhatsApp)

> **Sévérité** : P0 (M-INT-01 + M-INT-02 — XML existe, manque API DGI/CNSS réelle)
> **Estimation** : 1 sprint (S7–S8)
> **Dépendances** : Round 1 (SIMPL-IS + DAMANCOM XML), `08-finance` (e-facture), `13-admin` (paramètres société)

## Findings traités

- [ ] **M-INT-01** DGI SIMPL-IS XML mensuel TVA — **brancher API DGI** **P0**
- [ ] **M-INT-02** CNSS DAMANCOM XML mensuel BAP — **brancher API CNSS** **P0**
- [ ] **M-INT-03** CNSS DAT (déclaration accident travail)
- [ ] **M-INT-04** API banques MA (AWB/BMCE/CIH/BP/BMCI/SGM/CAM/CFG)
- [ ] **M-INT-05** e-facture DGI (2026-2027)
- [ ] **M-INT-06** Indices BTP01..xx via ANP/HCP CSV mensuel
- [ ] **M-INT-07** OMPIC API (ICE/IF/RC)
- [ ] **M-INT-08** Bureaux qualifications MA (qualif + classif)
- [ ] **M-INT-09** WhatsApp Business API
- [ ] **M-INT-10** Drive / OneDrive / Dropbox (P2)
- [ ] **M-INT-11** Outlook / Gmail / Calendar (P2)
- [ ] **M-INT-12** MS Project / Primavera P6 (P2)
- [ ] **M-INT-13** Bentley / AutoCAD / Revit BIM (P2)
- [ ] **M-INT-14** Météo officielle MA (DMN) (P2)
- [ ] **M-INT-15** PowerBI / Looker / Tableau (P3)
- [ ] **M-INT-16** Migration Sage 100/1000 FEC (P3)

## Goal

Brancher les **intégrations critiques** pour passer du mock à la production : API DGI (SIMPL-IS TVA + e-facture), API CNSS (DAMANCOM BAP + DAT AT), API banques MA pour virements et relevés, OMPIC pour autocompletion tiers, WhatsApp Business pour notifications terrain.

## Context to read first

```
app/applications/erp/pages/finance/simpl-is/                # Round 1 écran XML TVA
app/applications/erp/pages/rh/damancom/                      # Round 1 écran XML BAP
app/applications/erp/integrations/                            # à créer
app/platform/core/integrations/                              # à créer (adapter pattern)
```

---

## Task 16.1 — DGI SIMPL-IS API (M-INT-01) **P0**

**État Round 1** : écran XML mensuel TVA OK. Reste API.

**Spec DGI** (à vérifier à jour 2026) :
- Endpoint : `https://api-dgi.gov.ma/simpl-is/declarations` (placeholder)
- Auth : certificat client + token
- Format : XML conforme schéma DGI
- Workflow : POST déclaration → status reçu → confirmation par numéro de télédéclaration

**Fichiers** :
- `app/platform/core/integrations/dgi-simpl-is.adapter.ts` (nouveau)
- Mode mock pour démo + mode prod réelle

**Acceptance criteria** :
- [ ] Adapter prêt à brancher en prod (interface stable)
- [ ] Mode mock simule succès + échec
- [ ] Audit log de chaque déclaration envoyée

---

## Task 16.2 — CNSS DAMANCOM API (M-INT-02) **P0**

**État Round 1** : écran XML BAP mensuel OK. Reste API.

**Spec CNSS DAMANCOM** :
- Portail https://damancom.cnss.ma (API REST ou SFTP selon convention)
- Authentification : compte affilié + matricule
- Format : XML BAP (Bordereau d'Affiliation et Paiement) mensuel

**Fichiers** :
- `app/platform/core/integrations/cnss-damancom.adapter.ts` (nouveau)

**Acceptance criteria** :
- [ ] Adapter prêt à brancher en prod
- [ ] Mode mock simule l'envoi BAP

---

## Task 16.3 — CNSS DAT déclaration AT (M-INT-03) **P1**

Cf §10 M-HSE-11. Workflow : incident type AT créé → génération XML CNSS DAT → envoi API CNSS → réception accusé.

---

## Task 16.4 — API banques MA virements + relevés (M-INT-04) **P1**

**Banques cibles** : AWB (Attijariwafa), BMCE BoA, CIH, BP (Banque Populaire), BMCI, SGM, CAM, CFG.

**Conventions à étudier** :
- Virements : envoi fichier XML/TXT batch
- Relevés : récupération OFX/CSV via SFTP ou API
- E-banking : OAuth pour API moderne (AWB Open Banking, CIH OpenAPI sont les plus avancés)

**Action** : créer adapter unique avec implémentations par banque.

```ts
export interface BanqueAdapter {
  envoyerVirementBatch(virements: Virement[]): Promise<{ accuse: string; xml: string }>;
  recupererReleveBancaire(compte: string, dateDebut: string, dateFin: string): Promise<EcritureBancaire[]>;
  recupererSoldes(comptes: string[]): Promise<{ compte: string; solde: number }[]>;
}
```

---

## Task 16.5 — e-facture DGI (M-INT-05) **P1**

Cf §08 M-FIN-06. Connexion à l'API e-facture DGI quand publiée (2026-2027 obligatoire CA > 50M MAD).

---

## Task 16.6 — Indices BTP via ANP/HCP CSV (M-INT-06) **P1**

ANP = Agence Nationale des Ports, HCP = Haut Commissariat au Plan. Indices BTP01..xx publiés mensuellement en CSV.

**Action** : job mensuel (ou import manuel) qui télécharge le CSV, parse les indices, alimente la table `IndicesBTP` (Round 1 K-formula).

---

## Task 16.7 — OMPIC API ICE/IF/RC (M-INT-07) **P1**

OMPIC = Office Marocain Propriété Industrielle et Commerciale. API publique pour consulter ICE/IF/RC entreprise.

**Action** : sur création tiers (client/fournisseur/MOA), bouton « Vérifier OMPIC » qui interroge l'API avec l'ICE et autocomplete les champs (raison sociale, IF, RC).

---

## Task 16.8 — Bureaux qualifications MA (M-INT-08) **P1**

Qualif & Classif des entreprises BTP MA (équivalent Qualibat). Référentiel public à intégrer côté §06-etudes (mémoire technique).

---

## Task 16.9 — WhatsApp Business API (M-INT-09) **P1**

**Différenciateur fort** : Maroc utilise WhatsApp First.

**Cas d'usage** :
- Notification approbation à valider (cf §12 M-APR-07)
- Alerte incident HSE
- Demande complément BC
- Relance facture en retard (cf §08 M-FIN-02)
- Notification livraison BC

**Provider** : Meta WhatsApp Business API ou tiers (Twilio, MessageBird).

**Action** : adapter `WhatsAppNotificationAdapter` + templates messages validés par Meta.

---

## Task 16.10 — Drive / OneDrive / Dropbox (M-INT-10) **P2**

Synchro docs chantier vers stockage cloud externe. OAuth + sélecteur dossier.

---

## Task 16.11 — Outlook / Gmail / Calendar (M-INT-11) **P2**

Événements chantier (réunions, OS, visites MOA) synchronisés vers le calendrier de l'utilisateur.

---

## Task 16.12 — MS Project / Primavera P6 (M-INT-12) **P2**

Cf §02 M-CHA-10. Export/import planning.

---

## Task 16.13 — Bentley / AutoCAD / Revit BIM (M-INT-13) **P2**

Visionneuse + lien lots BIM L1+. Format IFC ouvert recommandé.

---

## Task 16.14 — Météo officielle MA DMN (M-INT-14) **P2**

DMN = Direction de la Météorologie Nationale. Alternative ou complément à open-meteo (cf §02 M-CHA-13).

---

## Task 16.15 — PowerBI / Looker / Tableau (M-INT-15) **P3**

Exposition cube analytique via OData ou REST. Différé.

---

## Task 16.16 — Migration Sage 100/1000 FEC (M-INT-16) **P3**

Cf §13 M-ADM-14. Import FEC + mapping écritures.

---

## Testing

```ts
describe('DgiSimplIsAdapter', () => {
  it('génère XML conforme schéma DGI', () => { /* … */ });
  it('mode mock simule succès', () => { /* … */ });
});

describe('CnssDamancomAdapter', () => {
  it('génère XML BAP conforme', () => { /* … */ });
});

// integration (manual ou nightly)
test('Indices BTP CSV import met à jour la table', async () => { /* … */ });
```

## Dépendances inverses

- 08-finance (DGI, e-facture, banques)
- 09-rh (DAMANCOM, CNSS DAT)
- 10-hse (CNSS DAT incident AT)
- 13-admin (paramètres certificats, tokens)
- 14-transverse (notifications WhatsApp)
