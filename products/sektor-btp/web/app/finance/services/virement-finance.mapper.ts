import type { VirementFournisseurRemiseLine, VirementInterne } from '../models';

export interface ApiVirementLine {
  id: string;
  beneficiaire: string;
  rib: string;
  montant: number;
  motif: string;
  referencePiece?: string;
}

export interface ApiVirement {
  id: string;
  numero: string;
  virementType: string;
  date: string;
  status: string;
  montant: number;
  motif?: string;
  reference?: string;
  compteSourceId?: string;
  compteSourceLibelle?: string;
  compteDestId?: string;
  compteDestLibelle?: string;
  bankCode?: string;
  executionDate?: string;
  generatedXml?: string;
  ecritureId?: string;
  notes?: string;
  lines?: ApiVirementLine[];
}

export function virementInterneToUi(row: ApiVirement): VirementInterne {
  return {
    id: row.id,
    numero: row.numero,
    date: row.date,
    compteSourceId: row.compteSourceId ?? '',
    compteSourceLibelle: row.compteSourceLibelle,
    compteDestId: row.compteDestId ?? '',
    compteDestLibelle: row.compteDestLibelle,
    montant: Number(row.montant),
    motif: row.motif ?? '',
    reference: row.reference,
    status: row.status as VirementInterne['status'],
    ecritureId: row.ecritureId,
    notes: row.notes,
  };
}

export function remiseLineToUi(row: ApiVirementLine): VirementFournisseurRemiseLine {
  return {
    id: row.id,
    beneficiaire: row.beneficiaire,
    rib: row.rib,
    montant: Number(row.montant),
    motif: row.motif,
    referencePiece: row.referencePiece,
  };
}
