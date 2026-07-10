import type { Partner } from '@applications/erp/shared/services/partners-api.service';
import type { ComptaFournisseur } from '@applications/erp/finance/models';
import type {
  FactureFournisseur,
  FactureFournCreate,
  FactureFournLigne,
  FactureFournUpdate,
} from '@applications/erp/finance/models';

export interface ApiFactureFournisseur {
  id: string;
  numeroInterne: string;
  numeroFournisseur?: string;
  fournisseurId: string;
  fournisseurName?: string;
  bcId?: string;
  bcNumero?: string;
  receptionId?: string;
  receptionNumero?: string;
  chantierId?: string;
  chantierName?: string;
  rubrique?: string;
  dateFacture: string;
  dateReception?: string;
  dateEcheance: string;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  netAPayerTtc: number;
  cumulRegleTtc: number;
  resteARegler: number;
  status: string;
  matchingStatus?: string;
  notes?: string;
  motifLitige?: string;
  journalEntryId?: string;
  lignes?: ApiFactureFournisseurLigne[];
}

export interface ApiFactureFournisseurLigne {
  id: string;
  factureId?: string;
  ordre: number;
  designation: string;
  bcLigneId?: string;
  compteCode: string;
  axeAnalytique?: string;
  axeAnalytiqueLibelle?: string;
  quantite?: number;
  prixUnitaireHt?: number;
  totalHt: number;
  tvaTaux: number;
}

export interface FfCreatePayload {
  numeroFournisseur?: string;
  fournisseurId: string;
  fournisseurName?: string;
  bcId?: string;
  bcNumero?: string;
  chantierId?: string;
  chantierName?: string;
  rubrique?: string;
  dateFacture: string;
  dateReception?: string;
  dateEcheance: string;
  status?: string;
  notes?: string;
  lignes: FfLignePayload[];
}

export interface FfLignePayload {
  ordre?: number;
  designation: string;
  bcLigneId?: string;
  compteCode: string;
  axeAnalytique?: string;
  axeAnalytiqueLibelle?: string;
  quantite?: number;
  prixUnitaireHt?: number;
  totalHt: number;
  tvaTaux?: number;
}

export function apiFactureToUi(row: ApiFactureFournisseur): FactureFournisseur {
  return {
    id: row.id,
    numeroInterne: row.numeroInterne,
    numeroFournisseur: row.numeroFournisseur ?? '',
    fournisseurId: row.fournisseurId,
    fournisseurName: row.fournisseurName,
    bcId: row.bcId,
    bcNumero: row.bcNumero,
    receptionId: row.receptionId,
    receptionNumero: row.receptionNumero,
    chantierId: row.chantierId,
    chantierName: row.chantierName,
    rubrique: row.rubrique,
    dateFacture: row.dateFacture,
    dateReception: row.dateReception ?? row.dateFacture,
    dateEcheance: row.dateEcheance,
    totalHt: Number(row.totalHt),
    totalTva: Number(row.totalTva),
    totalTtc: Number(row.totalTtc),
    netAPayerTtc: Number(row.netAPayerTtc),
    cumulRegleTtc: Number(row.cumulRegleTtc ?? 0),
    resteARegler: Number(row.resteARegler),
    status: row.status as FactureFournisseur['status'],
    ecritureId: row.journalEntryId,
    notes: row.notes,
    motifLitige: row.motifLitige,
    lignes: (row.lignes ?? []).map((l) => apiLigneToUi(l, row.id)),
  };
}

function apiLigneToUi(l: ApiFactureFournisseurLigne, factureId: string): FactureFournLigne {
  return {
    id: l.id,
    factureId: l.factureId ?? factureId,
    ordre: l.ordre,
    designation: l.designation,
    bcLigneId: l.bcLigneId,
    compteCode: l.compteCode,
    axeAnalytique: l.axeAnalytique,
    axeAnalytiqueLibelle: l.axeAnalytiqueLibelle,
    quantite: l.quantite != null ? Number(l.quantite) : undefined,
    prixUnitaireHt: l.prixUnitaireHt != null ? Number(l.prixUnitaireHt) : undefined,
    totalHt: Number(l.totalHt),
    tvaTaux: Number(l.tvaTaux),
  };
}

export function uiLignesToPayload(lignes: FactureFournLigne[]): FfLignePayload[] {
  return lignes
    .filter((l) => l.totalHt > 0 || l.designation)
    .map((l, i) => ({
      ordre: l.ordre ?? i + 1,
      designation: l.designation || `Ligne ${i + 1}`,
      bcLigneId: l.bcLigneId,
      compteCode: l.compteCode,
      axeAnalytique: l.axeAnalytique,
      axeAnalytiqueLibelle: l.axeAnalytiqueLibelle,
      quantite: l.quantite,
      prixUnitaireHt: l.prixUnitaireHt,
      totalHt: l.totalHt,
      tvaTaux: l.tvaTaux,
    }));
}

export function uiCreateToPayload(input: FactureFournCreate): FfCreatePayload {
  return {
    numeroFournisseur: input.numeroFournisseur,
    fournisseurId: input.fournisseurId,
    fournisseurName: input.fournisseurName,
    bcId: input.bcId,
    bcNumero: input.bcNumero,
    chantierId: input.chantierId,
    chantierName: input.chantierName,
    rubrique: input.rubrique,
    dateFacture: input.dateFacture,
    dateReception: input.dateReception,
    dateEcheance: input.dateEcheance,
    status: input.status ?? 'BROUILLON',
    notes: input.notes,
    lignes: uiLignesToPayload(input.lignes ?? []),
  };
}

export function uiUpdateToPayload(patch: FactureFournUpdate, base: FactureFournisseur): FfCreatePayload {
  return {
    numeroFournisseur: patch.numeroFournisseur ?? base.numeroFournisseur,
    fournisseurId: patch.fournisseurId ?? base.fournisseurId,
    fournisseurName: patch.fournisseurName ?? base.fournisseurName,
    bcId: patch.bcId ?? base.bcId,
    bcNumero: patch.bcNumero ?? base.bcNumero,
    chantierId: patch.chantierId ?? base.chantierId,
    chantierName: patch.chantierName ?? base.chantierName,
    rubrique: patch.rubrique ?? base.rubrique,
    dateFacture: patch.dateFacture ?? base.dateFacture,
    dateReception: patch.dateReception ?? base.dateReception,
    dateEcheance: patch.dateEcheance ?? base.dateEcheance,
    status: base.status,
    notes: patch.notes ?? base.notes,
    lignes: uiLignesToPayload(patch.lignes ?? base.lignes),
  };
}

export function partnerToComptaFournisseur(partner: Partner): ComptaFournisseur {
  return {
    id: partner.id,
    code: partner.code,
    name: partner.raisonSociale,
    ice: partner.ice,
    conditionPaiementId: 'cp-30j',
    compteCgncCode: '4411',
    compteCharge: '6111',
    rubrique: '',
    isActive: partner.isActive !== false,
  };
}
