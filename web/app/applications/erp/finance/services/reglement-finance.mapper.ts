import type {
  Reglement,
  ReglementCreate,
  ReglementImputation,
  ReglementType,
  ReglementUpdate,
} from '../models';

export interface ApiReglementImputation {
  id?: string;
  factureId: string;
  factureNumero?: string;
  factureDate?: string;
  factureDueDate?: string;
  factureRemaining?: number;
  allocatedAmount: number;
}

export interface ApiReglement {
  id: string;
  numero: string;
  reglementType: string;
  reglementDate: string;
  paymentModeCode: string;
  reference?: string;
  issuingBank?: string;
  partnerId: string;
  partnerName?: string;
  financialAccountId: string;
  financialAccountLabel?: string;
  totalAmount: number;
  status: string;
  journalEntryId?: string;
  notes?: string;
  createdAt?: string;
  imputations?: ApiReglementImputation[];
}

function mapTypeToUi(type: string): ReglementType {
  switch (type) {
    case 'ENCAISSEMENT_CLIENT':
      return 'CLIENT';
    case 'PAIEMENT_FOURNISSEUR':
      return 'FOURNISSEUR';
    case 'PAIEMENT_EMPLOYE':
      return 'EMPLOYE';
    default:
      return type as ReglementType;
  }
}

function mapTypeFromUi(type: ReglementType): string {
  switch (type) {
    case 'CLIENT':
      return 'ENCAISSEMENT_CLIENT';
    case 'FOURNISSEUR':
      return 'PAIEMENT_FOURNISSEUR';
    case 'EMPLOYE':
      return 'PAIEMENT_EMPLOYE';
    default:
      return type;
  }
}

export function reglementToUi(row: ApiReglement): Reglement {
  return {
    id: row.id,
    numero: row.numero,
    type: mapTypeToUi(row.reglementType),
    date: row.reglementDate,
    modePaiement: row.paymentModeCode as Reglement['modePaiement'],
    reference: row.reference,
    banqueEmise: row.issuingBank,
    contrePartieId: row.partnerId,
    contrePartieName: row.partnerName,
    compteFinancierId: row.financialAccountId,
    compteFinancierLibelle: row.financialAccountLabel,
    montantTotal: Number(row.totalAmount),
    imputations: (row.imputations ?? []).map((imp) => imputationToUi(row.id, imp)),
    status: row.status as Reglement['status'],
    ecritureId: row.journalEntryId,
    notes: row.notes,
    createdAt: row.createdAt ?? new Date().toISOString(),
  };
}

function imputationToUi(reglementId: string, imp: ApiReglementImputation): ReglementImputation {
  return {
    id: imp.id ?? `${reglementId}-${imp.factureId}`,
    reglementId,
    factureId: imp.factureId,
    factureNumero: imp.factureNumero,
    factureDate: imp.factureDate,
    factureEcheance: imp.factureDueDate,
    factureRestant: imp.factureRemaining != null ? Number(imp.factureRemaining) : undefined,
    montantImpute: Number(imp.allocatedAmount),
  };
}

export function reglementCreateToApi(data: ReglementCreate): Record<string, unknown> {
  return {
    reglementType: mapTypeFromUi(data.type),
    reglementDate: data.date,
    paymentModeCode: data.modePaiement,
    reference: data.reference,
    issuingBank: data.banqueEmise,
    partnerId: data.contrePartieId,
    partnerName: data.contrePartieName,
    financialAccountId: data.compteFinancierId,
    financialAccountLabel: data.compteFinancierLibelle,
    totalAmount: data.montantTotal,
    status: data.status,
    notes: data.notes,
    imputations: (data.imputations ?? []).map(imputationToApi),
  };
}

export function reglementUpdateToApi(data: ReglementUpdate): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (data.date !== undefined) patch['reglementDate'] = data.date;
  if (data.modePaiement !== undefined) patch['paymentModeCode'] = data.modePaiement;
  if (data.reference !== undefined) patch['reference'] = data.reference;
  if (data.banqueEmise !== undefined) patch['issuingBank'] = data.banqueEmise;
  if (data.contrePartieName !== undefined) patch['partnerName'] = data.contrePartieName;
  if (data.compteFinancierId !== undefined) patch['financialAccountId'] = data.compteFinancierId;
  if (data.compteFinancierLibelle !== undefined) {
    patch['financialAccountLabel'] = data.compteFinancierLibelle;
  }
  if (data.montantTotal !== undefined) patch['totalAmount'] = data.montantTotal;
  if (data.notes !== undefined) patch['notes'] = data.notes;
  if (data.imputations !== undefined) patch['imputations'] = data.imputations.map(imputationToApi);
  return patch;
}

function imputationToApi(imp: ReglementImputation): Record<string, unknown> {
  return {
    factureId: imp.factureId,
    factureNumero: imp.factureNumero,
    factureDate: imp.factureDate,
    factureDueDate: imp.factureEcheance,
    factureRemaining: imp.factureRestant,
    allocatedAmount: imp.montantImpute,
  };
}
