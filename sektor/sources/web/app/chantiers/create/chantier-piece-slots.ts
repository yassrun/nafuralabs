export interface ChantierPieceSlot {
  tag: string;
  type: string;
  label: string;
  hint: string;
  required: boolean;
}

export const CADRAGE_PIECE_SLOTS: ChantierPieceSlot[] = [
  { tag: 'CPS', type: 'MARCHE', label: 'CPS du chantier', hint: 'Cahier des prescriptions spéciales applicable au chantier.', required: true },
  { tag: 'BDP', type: 'MARCHE', label: 'BDP du chantier', hint: 'Bordereau des prix du marché. Les lignes se chiffrent à l’étape suivante.', required: true },
];

export const PREPARATION_PIECE_SLOTS: ChantierPieceSlot[] = [
  { tag: 'MARCHE_SIGNE', type: 'MARCHE', label: 'Marché signé', hint: 'Le contrat signé, distinct de la référence commerciale de l’étude.', required: true },
  { tag: 'ORDRE_SERVICE', type: 'OS', label: 'Ordre de service', hint: 'Le document d’OS : sa référence et sa date d’effet engagent le démarrage.', required: true },
];

export const KNOWN_PIECE_TAGS = new Set([
  ...CADRAGE_PIECE_SLOTS.map((s) => s.tag),
  ...PREPARATION_PIECE_SLOTS.map((s) => s.tag),
]);

export const DEFAULT_EXTRA_SLOTS: ChantierPieceSlot[] = [
  { tag: 'PLAN', type: 'PLAN', label: 'PLA / Plans', hint: '', required: false },
  { tag: 'PPSPS', type: 'PPSPS', label: 'PPSPS', hint: '', required: false },
  { tag: 'PLAN_PREVENTION', type: 'PLAN_PREVENTION', label: 'Plan de prévention', hint: '', required: false },
];

export const AUTRE_TYPE_OPTIONS = [
  { value: 'PLAN', label: 'PLA / Plans' },
  { value: 'PPSPS', label: 'PPSPS' },
  { value: 'PLAN_PREVENTION', label: 'Plan de prévention' },
  { value: 'ATTESTATION_ASSURANCE', label: 'Attestation d’assurance' },
  { value: 'CAUTION_BANCAIRE', label: 'Caution bancaire' },
  { value: 'AUTRE', label: 'Custom' },
];
