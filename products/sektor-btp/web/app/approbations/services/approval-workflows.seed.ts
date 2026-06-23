import type { ApprovalWorkflow, ApprovateurConfig, EtapeWorkflow } from '../models/approval-workflow.models';

const st = (ordre: number, type: EtapeWorkflow['type'], refs: ApprovateurConfig[]): EtapeWorkflow => ({
  ordre,
  type,
  approbateurs: refs,
});

const role = (ref: string): ApprovateurConfig => ({ type: 'ROLE', ref });

/**
 * Les 5 workflows nominatifs (spec 12.1) + définitions complémentaires par type métier.
 * BC : tranche « standard » vs « ≥ 500 k MAD » (3 étapes série).
 */
export const APPROVAL_WORKFLOW_SEEDS: ApprovalWorkflow[] = [
  {
    id: 'wf-bc-500k',
    nom: 'BC — montant élevé (≥ 500 k MAD HT)',
    entityType: 'BC',
    conditions: [{ champ: 'montant', operateur: '>=', valeur: 500_000 }],
    etapes: [
      st(0, 'SERIE', [role('CONDUCTEUR_TRAVAUX')]),
      st(1, 'SERIE', [role('DAF')]),
      st(2, 'SERIE', [role('DG')]),
    ],
    delaiSLAJours: 4,
    escaladeApresJ: 5,
    actif: true,
  },
  {
    id: 'wf-bc-std',
    nom: 'BC — standard (< 500 k MAD HT)',
    entityType: 'BC',
    conditions: [],
    etapes: [st(0, 'SERIE', [role('CONDUCTEUR_TRAVAUX')])],
    delaiSLAJours: 4,
    escaladeApresJ: 4,
    actif: true,
  },
  {
    id: 'wf-conge',
    nom: 'Congés — manager chantier',
    entityType: 'CONGE',
    conditions: [],
    etapes: [st(0, 'SERIE', [role('CONDUCTEUR_TRAVAUX')])],
    delaiSLAJours: 3,
    actif: true,
  },
  {
    id: 'wf-paie',
    nom: 'Paie mensuelle — DAF puis DG',
    entityType: 'PAIE',
    conditions: [],
    etapes: [st(0, 'SERIE', [role('DAF')]), st(1, 'SERIE', [role('DG')])],
    delaiSLAJours: 2,
    escaladeApresJ: 3,
    actif: true,
  },
  {
    id: 'wf-vir',
    nom: 'Virement interne — contrôle DAF',
    entityType: 'VIR',
    conditions: [],
    etapes: [st(0, 'SERIE', [role('DAF')])],
    delaiSLAJours: 2,
    actif: true,
  },
  {
    id: 'wf-da-daf',
    nom: 'DA — DAF si montant > 50 k',
    entityType: 'DA',
    conditions: [{ champ: 'montant', operateur: '>', valeur: 50_000 }],
    etapes: [st(0, 'SERIE', [role('CONDUCTEUR_TRAVAUX')]), st(1, 'SERIE', [role('DAF')])],
    delaiSLAJours: 4,
    actif: true,
  },
  {
    id: 'wf-da-std',
    nom: 'DA — conducteur seul',
    entityType: 'DA',
    conditions: [],
    etapes: [st(0, 'SERIE', [role('CONDUCTEUR_TRAVAUX')])],
    delaiSLAJours: 4,
    actif: true,
  },
  {
    id: 'wf-ao',
    nom: "AO — validation attribution",
    entityType: 'AO',
    conditions: [],
    etapes: [st(0, 'SERIE', [role('DAF')]), st(1, 'SERIE', [role('DG')])],
    delaiSLAJours: 5,
    actif: true,
  },
  {
    id: 'wf-ff',
    nom: 'Facture fournisseur',
    entityType: 'FF',
    conditions: [],
    etapes: [st(0, 'SERIE', [role('COMPTABLE')]), st(1, 'SERIE', [role('DAF')])],
    delaiSLAJours: 3,
    actif: true,
  },
  {
    id: 'wf-sit',
    nom: 'Situation de travaux',
    entityType: 'SIT',
    conditions: [],
    etapes: [st(0, 'SERIE', [role('CONDUCTEUR_TRAVAUX')]), st(1, 'SERIE', [role('DAF')])],
    delaiSLAJours: 5,
    actif: true,
  },
  {
    id: 'wf-avn',
    nom: 'Avenant marché',
    entityType: 'AVN',
    conditions: [],
    etapes: [st(0, 'SERIE', [role('DAF')]), st(1, 'SERIE', [role('DG')])],
    delaiSLAJours: 5,
    actif: true,
  },
  {
    id: 'wf-os',
    nom: 'Ordre de service MOA/MOE',
    entityType: 'OS',
    conditions: [],
    etapes: [st(0, 'SERIE', [role('CONDUCTEUR_TRAVAUX')]), st(1, 'SERIE', [role('DAF')])],
    delaiSLAJours: 4,
    actif: true,
  },
  {
    id: 'wf-note-frais-low',
    nom: 'Note de frais — manager seul (≤ 5 k)',
    entityType: 'NOTE_FRAIS',
    conditions: [{ champ: 'montant', operateur: '<=', valeur: 5_000 }],
    etapes: [st(0, 'SERIE', [role('MANAGER')])],
    delaiSLAJours: 5,
    actif: true,
  },
  {
    id: 'wf-note-frais-high',
    nom: 'Note de frais — escalade DAF (> 5 k)',
    entityType: 'NOTE_FRAIS',
    conditions: [{ champ: 'montant', operateur: '>', valeur: 5_000 }],
    etapes: [st(0, 'SERIE', [role('MANAGER')]), st(1, 'SERIE', [role('DAF')])],
    delaiSLAJours: 5,
    actif: true,
  },
  {
    id: 'wf-contrat-st',
    nom: 'Contrat sous-traitance',
    entityType: 'CONTRAT_ST',
    conditions: [],
    etapes: [st(0, 'SERIE', [role('DAF')]), st(1, 'SERIE', [role('DG')])],
    delaiSLAJours: 7,
    actif: true,
  },
  {
    id: 'wf-facture-client',
    nom: 'Facture client',
    entityType: 'FACTURE_CLIENT',
    conditions: [],
    etapes: [st(0, 'SERIE', [role('DAF')])],
    delaiSLAJours: 3,
    actif: true,
  },
];

/** Résolution rôle → libellé démo (Task 13 branchera RBAC réel). */
export const APPROBateur_ROLE_LABELS: Record<string, { roleId: string; nom: string }> = {
  CONDUCTEUR_TRAVAUX: { roleId: 'CONDUCTEUR_TRAVAUX', nom: 'Karim El Idrissi' },
  DAF: { roleId: 'DAF', nom: 'Amal Bennani' },
  DG: { roleId: 'DG', nom: 'Omar Tazi' },
  COMPTABLE: { roleId: 'COMPTABLE', nom: 'Service comptabilité' },
  MANAGER: { roleId: 'MANAGER', nom: 'Manager direct' },
};

export function resolveApprobateurDisplay(cfg: ApprovateurConfig): { roleId: string; nom: string } {
  if (cfg.type === 'ROLE') {
    const r = APPROBateur_ROLE_LABELS[cfg.ref];
    if (r) return r;
    return { roleId: cfg.ref, nom: cfg.ref };
  }
  return { roleId: cfg.ref, nom: cfg.ref };
}
