# 17 — Spécificités Maroc (ICE/IF/RC partout, RAS 5 %, timbre, TVA, CIMR, hijri)

> **Sévérité** : P0 (M-MA-01..03 légal)
> **Estimation** : 1 sprint (S3–S4 transverse)
> **Dépendances** : Round 1 (atomes `ice`/`rib`/`phone-ma`/`money-ma` + TVA autoliquidation OK), `13-admin` (paramètres fiscaux)

## Findings traités

- [ ] **M-MA-01** ICE/IF/RC/Patente/RIB/CNSS/AMO partout + validation **P0**
- [ ] **M-MA-02** Retenue à la source 5 % marchés publics **P0**
- [ ] **M-MA-03** Timbre fiscal espèces > 100 MAD **P0**
- [ ] **M-MA-04** TVA 20/14/10 % paramétrable + exonération + autoliquidation
- [ ] **M-MA-05** Régime TPCC (Promotion Paysage Audiovisuel)
- [ ] **M-MA-06** CIMR (retraite complémentaire cadres)
- [ ] **M-MA-07** OPPCM (dépôt soumissions dématérialisé)
- [ ] **M-MA-08** CCAG-T terminologie alignée
- [ ] **M-MA-09** Calendrier hijri + jours fériés MA
- [ ] **M-MA-10** Code marchés publics MA (décret 2-22-431) (P2)
- [ ] **M-MA-11** Banques MA SWIFT + agences + validation RIB (P2)
- [ ] **M-MA-12** Régions / Provinces / Communes (P2)
- [ ] **M-MA-13** Multi-devises (EUR/USD fournisseurs étrangers) (P2)
- [ ] **M-MA-14** Calendrier prière chantier (P3)

## Goal

Compléter la **localisation marocaine** : champs légaux MA partout avec validation, retenue à la source 5 %, timbre fiscal, TVA paramétrable, CIMR cadres, OPPCM marchés publics dématérialisés, calendriers hijri, et référentiels géographiques MA.

## Context to read first

```
app/platform/lib/anatomy/components/atoms/ice-input/             # Round 1 4.6
app/platform/lib/anatomy/components/atoms/rib-input/             # Round 1 4.6
app/platform/lib/anatomy/components/atoms/phone-ma-input/        # Round 1 4.6
app/platform/lib/anatomy/components/atoms/money-input/           # Round 1 4.6
app/applications/erp/shared/services/fiscal-settings.service.ts  # Round 1 6.7
app/applications/erp/finance/services/tva-autoliquidation.service.ts  # Round 1
app/applications/erp/rh/services/paie-engine.service.ts          # Round 1
```

---

## Task 17.1 — ICE/IF/RC/Patente/RIB/CNSS/AMO partout (M-MA-01) **🟡 P0**

Round 1 4.6 = atomes `ice`/`rib`/`phone-ma`/`money-ma`. Étendre à toutes les entités tiers :

**Référentiels à compléter** :
- **Société** (Round 1 partial) : raison sociale, ICE 15, IF 8, RC (numéro + tribunal), Patente, CNSS, CNAEM optionnel, RIBs multi-banques
- **Clients** (privés et publics) : ICE 15, IF 8, RC (privé), agrément MOA (public)
- **Fournisseurs** (Round 1 OK) : étendre AMO + validation périodicité attestations
- **Sous-traitants** : ICE 15, IF 8, RC, attestation Art. 187 CGI
- **Employés** : matricule CNSS, n° AMO, IF salarié (si concerné cadres haut revenu)

**Validation formats** :
- ICE : 15 chiffres, algo de contrôle (TODO : vérifier dans `IceValidator`)
- RIB : 24 chiffres, structure code banque (3) + agence (5) + compte (14) + clé (2)
- IF : 8 chiffres (entreprises) ou variable (salariés)
- CNSS : matricule 7-8 chiffres
- Téléphone MA : `+212` ou `0` + 9 chiffres

**Acceptance criteria** :
- [ ] Atomes utilisés sur **tous** les formulaires tiers
- [ ] Validation format à la saisie + sauvegarde
- [ ] Messages d'erreur clairs en français
- [ ] Test unitaire `ice.validator.spec.ts` étendu
- [ ] Audit grep : aucun `input type="text"` brut pour ces champs

---

## Task 17.2 — Retenue à la source 5 % marchés publics (M-MA-02) **P0**

Cf §08 M-FIN-07 (implémentation finance) + §07 M-MAR-06 (avances/configuration marché).

**Référence légale** : Art. 158 CGI MA.

**Action centralisée** :
1. Config au niveau Marché : `Marche.retenueSourceTaux: 5 | 0`
2. Calcul à chaque situation : `montantNetAPayer = ttc - retenueSource - retenueGarantie + revisionK - penalites`
3. Comptabilisation : 4453 (retenue source à reverser)
4. Déclaration trimestrielle : page `/finance/declarations/retenue-source` → PDF + XML DGI

**Acceptance criteria** :
- [ ] Flag `retenueSourceTaux` activable sur marché
- [ ] Calcul auto sur facture situation
- [ ] Déclaration trimestrielle générée
- [ ] Test unitaire calcul

---

## Task 17.3 — Timbre fiscal espèces (M-MA-03) **P0**

**Règle MA** : facture payée en espèces > 100 MAD → timbre fiscal obligatoire.

**Action** :
1. Sur règlement, si mode = ESPECES et `montant > 100 MAD` → bouton « Apposer timbre fiscal »
2. Génération automatique du numéro timbre + affichage sur PDF
3. Quittance avec timbre

**Acceptance criteria** :
- [ ] Détection automatique
- [ ] PDF avec timbre visible
- [ ] Test unitaire

---

## Task 17.4 — TVA 20/14/10 % paramétrable (M-MA-04) **🟡 P1**

Round 1 6.7 = `FiscalSettingsService` + `TvaAutoliquidationService`. Étendre :
- Taux TVA paramétrables (20 / 14 / 10 / 7 / 0 %)
- TVA 0 % marchés publics si exonéré (art. 92 CGI)
- TVA réduite 14 % construction logements sociaux
- Configuration par article ou par client
- Mode override par ligne facture

**Acceptance criteria** :
- [ ] Page `/admin/parametres-fiscal` (cf §13 M-ADM-09) étendue
- [ ] Calcul facture multi-taux
- [ ] Affichage clair sur facture

---

## Task 17.5 — Régime TPCC (M-MA-05) **P1**

TPCC = Taxe Promotion Paysage Audiovisuel — applicable certains chantiers publics. Configuration par marché.

---

## Task 17.6 — CIMR (M-MA-06) **P1**

CIMR = Caisse Interprofessionnelle Marocaine de Retraite (retraite complémentaire cadres). Calcul paie :
- Cotisation salariale : 3 % (TODO : vérifier taux 2026)
- Cotisation patronale : 6 %
- Plafond : selon convention

Étendre `PaieEngineService` (Round 1).

**Acceptance criteria** :
- [ ] Configuration CIMR par employé (cadre vs non-cadre)
- [ ] Calcul cotisations sur bulletin de paie
- [ ] Déclaration CIMR mensuelle (similaire DAMANCOM)

---

## Task 17.7 — OPPCM (M-MA-07) **P1**

OPPCM = Outils Public de Passation des Commandes des MOA. Plateforme publique de dépôt soumissions dématérialisé.

**Action** : prévoir interface de génération du dossier numérique soumission + signature électronique + dépôt OPPCM (API publique ou portail).

---

## Task 17.8 — CCAG-T terminologie (M-MA-08) **🟡 P1**

Round 2 indique « globalement OK ». À vérifier exhaustivement :
- MOA, MOE, BET
- OS (Ordre de Service), OST (OS d'arrêt), OSR (OS de reprise)
- PV (Procès-Verbal)
- DGD (Décompte Général Définitif)
- RG (Retenue de Garantie)
- RAS (Retenue à la Source)
- BPU, PUF, PGF
- DPGF, DPU
- Réception provisoire / définitive
- Mainlevée caution

Audit i18n des fichiers `fr.json` + alignement vocabulaire UI.

---

## Task 17.9 — Calendrier hijri + jours fériés MA (M-MA-09) **P1**

**Action** :
1. Librairie `moment-hijri` ou `hijri-date` pour conversion
2. Toggle calendrier dans `Date Picker` (option utilisateur, cf §13 M-ADM-15)
3. Référentiel jours fériés MA :
   - Fixe : Nouvel an (1/1), Manifeste Indépendance (11/1), Trône (30/7), Allégeance Oued Eddahab (14/8), Révolution Roi et Peuple (20/8), Anniversaire Roi (21/8), Marche Verte (6/11), Indépendance (18/11), Fête Travail (1/5)
   - Variable hijri : Aïd Al Fitr (1 Chawwal), Aïd Al Adha (10 Dhul-Hijjah), Mouharram (1er), Mawlid (12 Rabi I)
4. Impact planning chantier : weekends + jours fériés non-travaillés par défaut

**Acceptance criteria** :
- [ ] Référentiel jours fériés MA seedé (5 prochaines années)
- [ ] Planning Gantt exclut jours fériés
- [ ] Calcul jours ouvrés (congés, retards, échéances) exclut fériés

---

## Task 17.10 — Code marchés publics MA (M-MA-10) **P2**

Décret 2-22-431 : seuils, modalités, transparence. Alignement règles métier avec :
- Seuils AO ouvert / restreint / négocié
- Délais légaux soumission
- Modalités attribution
- Recours

---

## Task 17.11 — Banques MA SWIFT + agences + validation RIB (M-MA-11) **P2**

Référentiel banques MA :
- AWB : code banque 007
- BMCE BoA : 011
- CIH : 022
- BP : 014/015/016/019/021
- BMCI : 013
- SGM : 022
- CAM : 225
- CFG : 130

Validation algorithme RIB avec clé. Liste agences avec code SWIFT.

---

## Task 17.12 — Régions / Provinces / Communes (M-MA-12) **P2**

Référentiel administratif MA :
- 12 régions
- ~75 provinces/préfectures
- ~1500 communes

Utilisé pour chantiers, fournisseurs, employés, sociétés. Champ `adresse.region`, `adresse.province`, `adresse.commune`.

---

## Task 17.13 — Multi-devises (M-MA-13) **P2**

- MAD primaire
- EUR / USD pour fournisseurs étrangers (acier, équipements importés)
- Conversion temps réel via API BAM ou taux saisi manuellement
- Affichage prix en devise étrangère + équivalent MAD

---

## Task 17.14 — Calendrier prière chantier (M-MA-14) **P3**

Option : intégration horaires prière par ville (API Aladhan). Pauses planifiées dans le planning chantier.

Différenciateur culturel.

---

## Testing

```ts
describe('IceValidator', () => {
  it('valide ICE 15 chiffres avec clé', () => { /* … */ });
  it('refuse ICE incorrect', () => { /* … */ });
});

describe('RibValidator', () => {
  it('valide RIB 24 chiffres', () => { /* … */ });
});

describe('RetenueSourceService', () => {
  it('calcule 5 % HT sur situation marché public', () => { /* … */ });
});

describe('PaieEngineService — CIMR', () => {
  it('applique CIMR sur cadres', () => { /* … */ });
});

// e2e
test('Tous les écrans tiers ont leurs champs MA', async ({ page }) => {
  const tiers = ['/admin/societes/new', '/admin/referentiels/clients/new', '/achats/fournisseurs/new'];
  for (const url of tiers) {
    await page.goto(url);
    await expect(page.locator('input[name=ice]')).toBeVisible();
    await expect(page.locator('input[name=if]')).toBeVisible();
  }
});
```

## Dépendances inverses

- 03-achats (attestations légales sous-traitants)
- 07-marches (retenue source, indices BTP)
- 08-finance (TVA, RAS, timbre)
- 09-rh (CIMR, AMO, CNSS)
- 13-admin (paramètres fiscaux + référentiels banques/régions)
