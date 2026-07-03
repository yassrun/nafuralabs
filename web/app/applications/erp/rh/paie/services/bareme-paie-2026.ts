/**
 * Barème paie marocain 2026.
 * Sources : CNSS circulaire 2025, DGI barème IGR 2025-2026.
 */
export const BAREME_PAIE_MA_2026 = {
  CNSS: {
    prestationsSocialesSalarialPercent: 4.48,
    prestationsSocialesPlafond: 6_000,
    prestationsFamilialesEmployeurPercent: 6.40,
    assuranceAccidentTravailEmployeurPercent: 1.03,
    cnssEmployeurPlafond: 6_000,
  },
  AMO: {
    salarialPercent: 2.26,
    employeurPercent: 4.11,
  },
  CIMR: {
    salarialPercentMin: 3,
    salarialPercentMax: 6,
    employeurPercentDefault: 6,
  },
  TFP: {
    employeurPercent: 1.6,
  },
  /** Barème IGR mensuel 2026 (tranches en MAD) */
  IGR_2026_MENSUEL: [
    { trancheJusquA: 2_500,    taux: 0,  abattement: 0 },
    { trancheJusquA: 4_166.67, taux: 10, abattement: 250 },
    { trancheJusquA: 5_000,    taux: 20, abattement: 666.67 },
    { trancheJusquA: 6_666.67, taux: 30, abattement: 1_166.67 },
    { trancheJusquA: 15_000,   taux: 34, abattement: 1_433.33 },
    { trancheJusquA: Infinity, taux: 38, abattement: 2_033.33 },
  ],
  FRAIS_PROFESSIONNELS: {
    pourcentage: 35,
    plafondMensuel: 35_000 / 12,  // 2 916,67 MAD/mois
  },
  CHARGES_FAMILIALES: {
    parPersonneACharge: 30,
    plafondPersonnes: 6,
  },
} as const;

export type BaremePaie2026 = typeof BAREME_PAIE_MA_2026;
