# 08 — Finance & Trésorerie (lettrage, recouvrement, e-facture DGI, RAS 5 %)

> **Sévérité** : P1 majoritairement
> **Estimation** : 1.5 sprint (S7–S8)
> **Dépendances** : Round 1 (Journaux, Balance, Analytique, SIMPL-IS, État 9421, État 1208 OK), `17-maroc` (RAS, timbre), `16-integrations` (e-facture, banques)

## Findings traités

- [ ] **M-FIN-01** Lettrage facture ↔ règlement
- [ ] **M-FIN-02** Recouvrement / relances email/SMS
- [ ] **M-FIN-03** Effets de commerce (LCR/LCN)
- [ ] **M-FIN-04** Multi-banques (XML virements)
- [ ] **M-FIN-05** Rapprochement OFX/CSV automatique
- [ ] **M-FIN-06** e-facture DGI (2026-2027 obligatoire)
- [ ] **M-FIN-07** Retenue à la source 5 % marchés publics
- [ ] **M-FIN-08** Régime auto-entrepreneur fournisseurs
- [ ] **M-FIN-09** Caisses chantier (avances chef)
- [ ] **M-FIN-10** Analytique multi-axes
- [ ] **M-FIN-11** Budget trésorerie glissant 12 mois
- [ ] **M-FIN-12** Clôture périodique + report à nouveau
- [ ] **M-FIN-13** Liasse fiscale (Bilan/CPC/ESG)
- [ ] **M-FIN-14** Connecteur Open Banking (P3)

## Goal

Compléter le module Finance (déjà très complet selon l'audit) avec : lettrage automatique facture ↔ règlement, recouvrement avec relances multi-canal, effets de commerce LCR/LCN, multi-banques XML, rapprochement bancaire OFX, e-facture DGI conforme, retenue à la source 5 %, caisses chantier, analytique multi-axes et clôture périodique.

## Context to read first

```
app/applications/erp/pages/finance/                            # 15 sous-routes Round 1
app/applications/erp/pages/finance/journaux/
app/applications/erp/pages/finance/balance/
app/applications/erp/pages/finance/analytique/                 # vérifier multi-axes
app/applications/erp/pages/finance/factures-fournisseurs/
app/applications/erp/pages/finance/reglements/
app/applications/erp/pages/finance/rapprochement/              # vérifier OFX
app/applications/erp/pages/finance/simpl-is/                   # Round 1
app/applications/erp/pages/finance/etat-9421/
app/applications/erp/pages/finance/etat-1208/
app/applications/erp/pages/finance/damancom/
app/applications/erp/finance/services/                         # services métier
app/applications/erp/finance/services/tva-autoliquidation.service.ts  # Round 1
```

---

## Task 8.1 — Lettrage facture ↔ règlement (M-FIN-01) **P1**

**Modèle** :

```ts
export interface Lettrage {
  id: string;
  codeLettrage: string;          // « AB-2026-018 »
  comptePcg: string;             // 411XXX ou 401XXX
  lignes: LigneLettrage[];
  status: 'EQUILIBRE' | 'PARTIEL' | 'OUVERT';
  totalDebit: number;
  totalCredit: number;
  difference: number;
}

export interface LigneLettrage {
  ecritureId: string;
  date: string;
  piece: string;
  libelle: string;
  debit: number;
  credit: number;
  selected: boolean;
}
```

**Action** :
1. Page `/finance/lettrage` : UI pivot
2. Sélection compte (411 client / 401 fournisseur)
3. Tableau écritures non lettrées + checkboxes
4. Calcul auto débit/crédit/différence
5. Bouton « Lettrer » si différence = 0 (ou tolérance)
6. Possibilité « Lettrage partiel » (acompte)
7. Reverse : « Délettrer » si erreur

**Acceptance criteria** :
- [ ] CRUD lettrages
- [ ] Lettrage auto si une seule paire facture ↔ règlement même montant
- [ ] Test unitaire `lettrage.service.spec.ts`
- [ ] Export CSV des lettrages

---

## Task 8.2 — Recouvrement / relances (M-FIN-02) **P1**

**Modèle** :

```ts
export interface SuiviRecouvrement {
  factureId: string;
  clientId: string;
  montantTTC: number;
  dateEcheance: string;
  joursRetard: number;            // calcul auto
  niveauRelance: 0 | 1 | 2 | 3 | 4;  // 0=ok, 1=J+15, 2=J+30, 3=J+45, 4=mise en demeure
  derniereRelanceDate?: string;
  prochaineRelanceDate?: string;
  totalRelances: number;
  notes?: string;
}

export interface ModeleRelance {
  id: string;
  niveau: 1 | 2 | 3 | 4;
  canal: 'EMAIL' | 'SMS' | 'COURRIER' | 'WHATSAPP';
  delaiJ: number;
  sujet: string;
  corps: string;                  // template avec variables
}
```

**Action** :
1. Page `/finance/recouvrement` : tableau créances en retard + niveau
2. Job mock quotidien : recalcule niveaux + génère relances brouillon
3. Bouton « Envoyer relance » → email + log
4. Bouton « Mise en demeure » → PDF officiel + courrier RAR

**Acceptance criteria** :
- [ ] Tableau retards triés par antériorité
- [ ] 4 niveaux configurables
- [ ] Envoi email mock (logué) ; vrai SMTP en prod
- [ ] PDF mise en demeure conforme MA

---

## Task 8.3 — Effets de commerce LCR/LCN (M-FIN-03) **P1**

**Modèle** :

```ts
export interface EffetCommerce {
  id: string;
  numero: string;                // LCR-2026-001
  type: 'LCR' | 'LCN';           // Lettre de change relevé/normalisée
  factureId: string;
  clientId: string;
  banqueDomicile: string;
  banqueTireeId?: string;
  montant: number;
  dateEcheance: string;
  dateRemise?: string;            // remise à l'encaissement
  dateEscompte?: string;
  status: 'PORTEFEUILLE' | 'REMIS_ENCAISSEMENT' | 'ESCOMPTE' | 'PAYE' | 'IMPAYE' | 'PROTESTE';
  fraisEscompte?: number;
}
```

**Pages** :
- `/finance/effets/portefeuille`
- `/finance/effets/remise-encaissement`
- `/finance/effets/escompte`
- `/finance/effets/impayes`

**Acceptance criteria** :
- [ ] CRUD effets
- [ ] Génération bordereau remise multi-effets PDF
- [ ] Suivi impayés avec relance

---

## Task 8.4 — Multi-banques XML (M-FIN-04) **P1**

**Formats** :
- SEPA XML (international)
- Formats locaux MA : AWB, BMCE, CIH, BP, BMCI, SGM, CAM, CFG (différences mineures, factoriser)

**Action** : page `/finance/virements/remise` qui génère le fichier XML batch selon banque sélectionnée.

**Acceptance criteria** :
- [ ] Sélection banque émettrice
- [ ] Liste virements à remettre (factures fournisseur lettrées « à payer »)
- [ ] Export XML conforme spec banque
- [ ] Test unitaire par format (au moins SEPA + AWB)

---

## Task 8.5 — Rapprochement OFX/CSV (M-FIN-05) **P1**

Étendre Round 1 `/finance/rapprochement` :
- Import OFX (banques internationales) ou CSV (banques MA)
- Matching auto par montant + libellé + date
- Suggestions « rapprocher avec... »
- Validation manuelle / massive

**Acceptance criteria** :
- [ ] Import OFX et CSV
- [ ] Auto-match ≥ 80 % si données propres
- [ ] UI pivot : relevé bancaire ↔ écritures comptables
- [ ] Génération écritures manquantes (frais bancaires, agios) en 1 clic

---

## Task 8.6 — e-facture DGI (M-FIN-06) **P1**

**Législation** : obligatoire entreprises CA > 50 M MAD en 2026-2027. Composantes :
- **QR code** sur facture avec hash
- **Signature électronique** (certificat fiscal)
- **Archive électronique 10 ans**
- **API DGI** pour transmission (cf §16-integrations M-INT-05)

**Modèle complément** :

```ts
// Facture vente
export interface FactureVente {
  // … champs existants
  hashEfacture?: string;
  qrCodeData?: string;
  signatureCertId?: string;
  signatureDate?: string;
  efactureTransmiseDgi: boolean;
  efactureNumeroDgi?: string;
  archiveElectroniqueUrl?: string;
}
```

**Action** :
1. À la validation facture vente → calcul hash + QR + signature
2. Stockage archive PDF + métadonnées
3. Transmission API DGI (mock ; vrai connecteur en prod)
4. Affichage QR code sur PDF facture

**Acceptance criteria** :
- [ ] Génération QR code conforme spec DGI
- [ ] Hash + signature persistés
- [ ] Test unitaire signature + hash
- [ ] PDF facture avec QR visible

---

## Task 8.7 — Retenue à la source 5 % (M-FIN-07) **P1**

Cf §17-maroc M-MA-02 (légal). Implémentation finance :
- Champ `retenueSourceTaux` sur marché (0 / 5 %)
- Calcul auto sur chaque facture vente : `retenueSource = HT × 5 %`
- Écriture comptable : compte 4453 (retenue source à reverser)
- Déclaration trimestrielle : page `/finance/declarations/retenue-source` avec génération PDF/XML DGI

**Acceptance criteria** :
- [ ] Configuration au niveau marché public
- [ ] Calcul auto sur situation
- [ ] Comptabilisation correcte
- [ ] Déclaration trimestrielle générée

---

## Task 8.8 — Régime auto-entrepreneur fournisseurs (M-FIN-08) **P1**

**Règle MA** : pour fournisseurs auto-entrepreneurs, l'acheteur applique :
- Autoliquidation TVA (déjà Round 1 6.7)
- RAS spécifique au régime (à vérifier taux/règle)

**Action** : flag `Fournisseur.regimeAutoEntrepreneur` qui :
- Force autoliquidation TVA
- Applique RAS spécifique
- Comptabilisation propre

---

## Task 8.9 — Caisses chantier (M-FIN-09) **P1**

**Modèle** :

```ts
export interface CaisseChantier {
  id: string;
  chantierId: string;
  chefChantierId: string;
  soldeInitial: number;
  soldeActuel: number;
  status: 'OUVERTE' | 'FERMEE';
  dateOuverture: string;
  dateCloture?: string;
}

export interface MouvementCaisseChantier {
  id: string;
  caisseId: string;
  date: string;
  type: 'AVANCE_RECUE' | 'DEPENSE' | 'JUSTIFICATIF' | 'RETOUR';
  montant: number;
  categorie?: string;            // « Carburant », « Petit matériel », « Repas »
  description: string;
  photoTicketUrl?: string;       // mobile
  geoloc?: { lat: number; lng: number };
  validePar?: string;
  status: 'BROUILLON' | 'SOUMIS' | 'VALIDE' | 'REJETE';
}
```

**Workflow** :
1. Conducteur travaux verse avance chef chantier (mvt `AVANCE_RECUE`)
2. Chef chantier dépense (mobile : ticket photo + montant + chantier)
3. Validation conducteur travaux
4. Refacturation analytique chantier (poste « Petites dépenses chantier »)
5. Clôture caisse en fin de chantier

**Acceptance criteria** :
- [ ] Mobile-first : saisie en < 30 s
- [ ] Photo ticket obligatoire pour dépense
- [ ] Solde mis à jour temps réel
- [ ] Refacturation budget chantier

---

## Task 8.10 — Analytique multi-axes (M-FIN-10) **P2**

Étendre `/finance/analytique` :
- Axes : chantier × lot × phase × catégorie × société
- Tableau croisé dynamique (TCD)
- Export Excel pivot

---

## Task 8.11 — Budget trésorerie 12 mois (M-FIN-11) **P2**

Page `/finance/budget-tresorerie` : projection 12 mois glissants par chantier et consolidé. Données réelles + projection (cf §11 M-PIL-05 cash-flow dynamique).

---

## Task 8.12 — Clôture périodique (M-FIN-12) **P2**

Workflow clôture :
1. Vérification équilibre journaux
2. Génération écritures de clôture (provisions, FAE, FNP, charges constatées d'avance)
3. Bilan + CPC provisoire
4. Validation comptable → écritures non modifiables
5. Report à nouveau N+1
6. Ouverture exercice N+1

---

## Task 8.13 — Liasse fiscale (M-FIN-13) **P2**

Page `/finance/declarations/liasse-fiscale` :
- Bilan
- CPC (Compte de Produits et Charges)
- ESG (État des Soldes de Gestion)
- Tableau de financement
- Annexes (immo, provisions, créances/dettes)

Format DGI MA (CGNC). Export PDF + XML/XBRL.

---

## Task 8.14 — Open Banking (M-FIN-14) **P3**

Différer. AWB / CIH OpenAPI quand disponibles.

---

## Testing

```ts
describe('LettrageService', () => {
  it('lettrage équilibré quand débit = crédit', () => { /* … */ });
  it('refuse lettrage si différence > tolérance', () => { /* … */ });
});

describe('RecouvrementService', () => {
  it('niveau J+30 si facture > 30 jours retard', () => { /* … */ });
});

describe('EfactureService', () => {
  it('génère QR code conforme spec DGI', () => { /* … */ });
});
```

## Dépendances inverses

- 07-marches (DGD → règlement → lettrage)
- 03-achats (facture fournisseur → règlement → lettrage)
- 16-integrations (XML banques, e-facture DGI API, OFX import)
- 17-maroc (RAS 5 %, timbre, TVA paramétrable)
