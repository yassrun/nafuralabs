# 10 — Paie marocaine + Fiscal MA

> **Sévérité** : P1
> **Estimation** : 1.5 sprint (S7 paie + S3 fiscal tiers parallèle)
> **Dépendances** : `01-foundations` (locale, currency), `08-administration` (paramètres fiscal)

## Findings traités

- [ ] **F-17** Calcul des retenues paie incohérent (CNSS sous-calculée pour brut 34 500 → 1 049 affiché vs ~3 000 attendu)
- [ ] **F-24** Spécificités fiscales/légales marocaines absentes ou partielles (IF/RC/Patente/RIB sur tiers, RAS 5%, timbre, autoliquidation TVA, TPCC)
- [ ] Checklist marché marocain (cf §6 audit)

## Goal

1. **Moteur paie marocain** complet et **certifié** (CNSS + AMO + IGR 2026 + frais pro + CIMR + BAP + DAMANCOM)
2. **Référentiel fiscal Maroc** sur tous les tiers : ICE / IF / RC / Patente / RIB
3. **Engine fiscal transversal** : TVA configurable, RAS 5%, timbre fiscal, autoliquidation
4. **Génération SIMPL-IS** (DGI) et **DAMANCOM** (CNSS)

## Context to read first

```
app/applications/erp/pages/rh/paie/                            # paie existante
app/applications/erp/rh/models/                                # models paie
app/applications/erp/rh/mock/rh-mock.service.ts                # service paie mock
app/applications/erp/pages/finance/factures-fournisseurs/      # factures fourn (TVA + RAS)
app/applications/erp/ventes/models/index.ts                    # FactureClient
```

---

## PARTIE A — Moteur paie marocain

### Task 10.1 — Référentiel taux paie 2026 (configurable admin)

**Fichier** : `app/applications/erp/rh/paie/services/bareme-paie-2026.ts`

```ts
export const BAREME_PAIE_MA_2026 = {
  CNSS: {
    prestationsSocialesSalarialPercent: 4.48,    // sur plafond
    prestationsSocialesPlafond: 6_000,
    prestationsFamilialesEmployeurPercent: 6.40,  // sans plafond mais limité au régime
    cnssEmployeurPlafond: 6_000,                  // sur prest sociales
  },
  AMO: {
    salarialPercent: 2.26,                        // sans plafond
    employeurPercent: 4.11,
  },
  CIMR: {
    salarialPercentMin: 3,                        // optionnel cadre, paramétrable société
    salarialPercentMax: 6,
    employeurPercentDefault: 6,
  },
  TFP: {
    employeurPercent: 1.6,                        // taxe formation professionnelle
  },
  IGR_2026_MENSUEL: [
    { trancheJusquA: 2_500, taux: 0,    abattement: 0 },
    { trancheJusquA: 4_166, taux: 10,   abattement: 250 },
    { trancheJusquA: 5_000, taux: 20,   abattement: 666.67 },
    { trancheJusquA: 6_666, taux: 30,   abattement: 1_166.67 },
    { trancheJusquA: 15_000, taux: 34,  abattement: 1_433.33 },
    { trancheJusquA: Infinity, taux: 38, abattement: 2_033.33 },
  ],
  FRAIS_PROFESSIONNELS: {
    pourcentage: 35,
    plafondMensuel: 35_000 / 12,                  // 2 916,67 MAD/mois
  },
  CHARGES_FAMILIALES: {
    parPersonneACharge: 30,                        // déduction mensuelle/personne
    plafondPersonnes: 6,
  },
};
```

### Task 10.2 — Service `PaieEngineService` (fichier core)

**Fichier** : `app/applications/erp/rh/paie/services/paie-engine.service.ts`

```ts
@Injectable({ providedIn: 'root' })
export class PaieEngineService {
  /**
   * Calcule la fiche de paie complète d'un employé pour un mois donné.
   */
  calculerFiche(input: PaieInput): PaieResultat {
    // 1. Brut imposable = salaire base + primes + heures sup
    const brut = this.computeBrut(input);

    // 2. Cotisations salariales (CNSS plafonnée, AMO non plafonnée, CIMR si cadre)
    const cnss = Math.min(brut, BAREME.CNSS.prestationsSocialesPlafond) * BAREME.CNSS.prestationsSocialesSalarialPercent / 100;
    const amo = brut * BAREME.AMO.salarialPercent / 100;
    const cimr = input.estCadre ? brut * (input.cimrTauxSalarial ?? BAREME.CIMR.salarialPercentMin) / 100 : 0;
    const totalCotisationsSalariales = cnss + amo + cimr;

    // 3. Frais professionnels
    const fraisPro = Math.min(brut * BAREME.FRAIS_PROFESSIONNELS.pourcentage / 100, BAREME.FRAIS_PROFESSIONNELS.plafondMensuel);

    // 4. Salaire net imposable
    const netImposable = brut - totalCotisationsSalariales - fraisPro;

    // 5. Charges familiales
    const chargesFam = Math.min(input.personnesACharge ?? 0, BAREME.CHARGES_FAMILIALES.plafondPersonnes) * BAREME.CHARGES_FAMILIALES.parPersonneACharge;

    // 6. IGR
    const igr = this.computeIGR(netImposable - chargesFam);

    // 7. Salaire net
    const net = brut - totalCotisationsSalariales - igr;

    // 8. Charges patronales
    const cnssEmpl = Math.min(brut, BAREME.CNSS.cnssEmployeurPlafond) * BAREME.CNSS.prestationsFamilialesEmployeurPercent / 100;
    const amoEmpl = brut * BAREME.AMO.employeurPercent / 100;
    const cimrEmpl = input.estCadre ? brut * BAREME.CIMR.employeurPercentDefault / 100 : 0;
    const tfp = brut * BAREME.TFP.employeurPercent / 100;
    const totalChargesEmpl = cnssEmpl + amoEmpl + cimrEmpl + tfp;

    // 9. Coût total entreprise
    const coutTotal = brut + totalChargesEmpl;

    return { brut, cnss, amo, cimr, fraisPro, netImposable, chargesFam, igr, net, cnssEmpl, amoEmpl, cimrEmpl, tfp, coutTotal };
  }

  private computeIGR(netImposable: number): number {
    if (netImposable <= 0) return 0;
    for (const tranche of BAREME.IGR_2026_MENSUEL) {
      if (netImposable <= tranche.trancheJusquA) {
        return Math.max(0, netImposable * tranche.taux / 100 - tranche.abattement);
      }
    }
    return 0;
  }

  private computeBrut(input: PaieInput): number {
    return input.salaireBase + (input.primes ?? 0) + (input.heuresSupMontant ?? 0);
  }
}
```

**Tests obligatoires** :

```ts
describe('PaieEngineService', () => {
  it('cas test 1 : brut 5 000 MAD, célibataire sans charge', () => {
    const r = service.calculerFiche({ salaireBase: 5_000, estCadre: false, personnesACharge: 0 });
    // CNSS: min(5000, 6000) × 4.48% = 224
    // AMO: 5000 × 2.26% = 113
    // total cot. : 337
    // frais pro: min(5000 × 35%, 2916.67) = 1750
    // net imp.: 5000 - 337 - 1750 = 2913
    // IGR : tranche 2 (≤ 4166), 2913 × 10% - 250 = 41.30
    // net : 5000 - 337 - 41.30 = 4621.70
    expect(r.cnss).toBeCloseTo(224, 0);
    expect(r.amo).toBeCloseTo(113, 0);
    expect(r.igr).toBeCloseTo(41.30, 1);
    expect(r.net).toBeCloseTo(4621.70, 1);
  });

  it('cas test 2 : brut 34 500 MAD cadre 3 personnes à charge — corrige F-17', () => {
    const r = service.calculerFiche({ salaireBase: 34_500, estCadre: true, personnesACharge: 3, cimrTauxSalarial: 6 });
    // CNSS: min(34500, 6000) × 4.48% = 268.80
    // AMO: 34500 × 2.26% = 779.70
    // CIMR: 34500 × 6% = 2070
    // total cot.: 3118.50  ← BUG actuel : ne calcule que 1049 !
    expect(r.cnss + r.amo + r.cimr).toBeGreaterThan(3_000);
    // IGR ~10 678 (cohérent)
    expect(r.igr).toBeGreaterThan(10_000);
    expect(r.igr).toBeLessThan(11_000);
  });
});
```

### Task 10.3 — UI fiche de paie + journal paie

**Pages** :
- `/rh/paie` : listing fiches par mois
- `/rh/paie/:id` : détail avec décomposition complète + édition variables (primes, retenues exceptionnelles)
- `/rh/paie/journal` : agrégat société pour clôture mensuelle
- `/rh/paie/declarations/damancom` : génération XML DAMANCOM (CNSS)
- `/rh/paie/declarations/igr` : état 9421 annuel (IGR par employé)
- `/rh/paie/declarations/simpl-is` : retour DGI

**Acceptance criteria** :
- [ ] Tests unitaires service paie ≥ 95% couverture
- [ ] 5 cas test validés manuellement avec un expert paie MA
- [ ] PDF fiche de paie conforme avec en-tête société + ICE/IF/CNSS
- [ ] Export DAMANCOM XML conforme
- [ ] Cumul annuel par employé visible

---

## PARTIE B — Référentiel fiscal tiers

### Task 10.4 — Étendre modèles tiers avec champs MA

**Cibles** : `ClientVente`, `Fournisseur`, `Employe`, `Marche.client`

**Champs à ajouter** :

```ts
interface TiersFiscalMA {
  ice?: string;                                  // 15 chiffres
  if?: string;                                   // Identifiant Fiscal
  rc?: string;                                   // Registre Commerce (ex. "Casa - 715869")
  patente?: string;                              // Numéro patente
  cnssMatricule?: string;                        // pour employés et fournisseurs
  formeJuridique?: 'SARL' | 'SARL_AU' | 'SA' | 'SAS' | 'SNC' | 'PARTICULIER' | 'ADMINISTRATION' | 'COOPERATIVE' | 'AUTO_ENTREPRENEUR';
  ribsBancaires: RibBancaire[];                  // multiples
  estAdministrationPublique: boolean;            // si oui → RAS 5% applicable
}
```

**Composants** : utiliser `<nf-ice-input>`, `<nf-rib-input>` (cf 04-Task 4.6).

**Acceptance criteria** :
- [ ] 4 entités tiers ont les champs MA complets
- [ ] Validation au save : ICE 15 chiffres, IF strict
- [ ] Affichage dans détail : section « Identification fiscale » dédiée

### Task 10.5 — Engine fiscal centralisé

**Fichiers** :
- `app/applications/erp/finance/services/tva-engine.service.ts`
- `app/applications/erp/finance/services/retenue-source.service.ts`
- `app/applications/erp/finance/services/timbre-fiscal.service.ts`
- `app/applications/erp/finance/services/autoliquidation.service.ts`

Voir détails Task 6.7 dans `06-marches-facturation.md`.

**Cible** : ces services sont consommés par tout module qui produit une facture (Marchés, Achats, Ventes).

### Task 10.6 — Génération exports DGI

**Pages** :
- `/finance/declarations/simpl-is` : déclaration TVA mensuelle (annexe ventes/achats)
- `/finance/declarations/state-9421` : annuel IGR par employé (cf paie)
- `/finance/declarations/state-1208` : déclaration de revenus catégoriels

**Format** : XML conforme aux schémas DGI publiés. Mock initial : générer XML factice valide structurellement.

**Acceptance criteria** :
- [ ] 3 templates XML DGI fonctionnels
- [ ] Téléchargement direct depuis l'UI

---

## Checklist marché marocain (issue de §6 audit)

| Domaine | Fonctionnalité | Tâche |
|---|---|---|
| Fiscal | TVA 20/14/10 BTP | 10.5 |
| Fiscal | RAS 5% marchés publics | 10.5 + 06 |
| Fiscal | Timbre fiscal espèces | 10.5 |
| Fiscal | SIMPL-IS DGI | 10.6 |
| Fiscal | Annexe ventes/achats | 10.6 |
| Social | CNSS / AMO / CIMR / IGR 2026 | 10.1 + 10.2 |
| Social | DAMANCOM mensuel | 10.3 |
| Social | État 9421 annuel | 10.3 |
| Marché public | Cautions provisoire/définitive/RG 7% | 06 |
| Marché public | Formule révision K (CCAG-T) | 06 |
| Marché public | DGD | 06 |
| Banque | Virements multi-RIB (AWB, BMCE, CIH…) | 08 (référentiel banques) |
| Banque | Effet de commerce LCN | déjà OK Finance |
| Référentiel tiers | ICE, IF, RC, Patente | 10.4 |
| Bilingue | FR/AR + RTL | 03 |
| BTP | BPU/Forfait/Régie | 06 |
| BTP | Sous-traitance art. 187 CGI | 02 (Task 2.3 ST) |
| BTP | Métré + DQE + biblio prix | déjà partiel |
| BTP | Avancement physique pondéré | déjà OK |
| BTP | Pointage chantier mobile | 13 |
| BTP | Carnet d'attachement | nouvelle tâche (cf 13) |
| BTP | Journal de chantier | nouvelle tâche (cf 13) |
| HSE | Registres | 09 |
| Pilotage | Marge projetée chantier | 07 |
| Pilotage | Cash-flow prévisionnel | 07 |
