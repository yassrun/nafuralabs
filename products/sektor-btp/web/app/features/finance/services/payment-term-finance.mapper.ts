import type { PaymentTermInstallmentInputDto } from './payment-term-api.types';
import type {
  ConditionPaiement,
  ConditionPaiementCreate,
  ConditionPaiementType,
  ConditionPaiementUpdate,
  EcheancePaiement,
} from '../models';

/** API row from `/api/v1/payment-terms` (BTP detail DTO). */
export interface ApiPaymentTermDetail {
  id: string;
  code: string;
  name: string;
  days: number;
  termType?: string;
  isDefault?: boolean;
  notes?: string;
  isActive?: boolean;
  installments?: PaymentTermInstallmentInputDto[];
}

export function paymentTermToCondition(row: ApiPaymentTermDetail): ConditionPaiement {
  const installments = (row.installments ?? []).map((line, index) => toEcheance(row.id, line, index));
  return {
    id: row.id,
    code: row.code,
    libelle: row.name,
    type: (row.termType ?? 'DELAI_SIMPLE') as ConditionPaiementType,
    delaiJours: row.days,
    echeances: installments.length ? installments : undefined,
    isActive: row.isActive ?? true,
    isDefaut: row.isDefault ?? false,
    notes: row.notes,
  };
}

function toEcheance(
  conditionId: string,
  line: PaymentTermInstallmentInputDto,
  index: number,
): EcheancePaiement {
  return {
    id: `${conditionId}-ech-${line.lineOrder ?? index + 1}`,
    conditionId,
    ordre: line.lineOrder ?? index + 1,
    pourcentage: Number(line.percentage),
    delaiJours: line.daysOffset ?? 0,
    description: line.description ?? '',
  };
}

export function conditionToPaymentTermCreate(data: ConditionPaiementCreate): Record<string, unknown> {
  return {
    code: data.code,
    name: data.libelle,
    days: data.delaiJours ?? (data.type === 'IMMEDIAT' ? 0 : 30),
    termType: data.type,
    isDefault: data.isDefaut,
    notes: data.notes,
    isActive: data.isActive,
    installments: (data.echeances ?? []).map(toInstallmentInput),
  };
}

export function conditionToPaymentTermUpdate(data: ConditionPaiementUpdate): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (data.code !== undefined) patch['code'] = data.code;
  if (data.libelle !== undefined) patch['name'] = data.libelle;
  if (data.delaiJours !== undefined) patch['days'] = data.delaiJours;
  if (data.type !== undefined) patch['termType'] = data.type;
  if (data.isDefaut !== undefined) patch['isDefault'] = data.isDefaut;
  if (data.notes !== undefined) patch['notes'] = data.notes;
  if (data.isActive !== undefined) patch['isActive'] = data.isActive;
  if (data.echeances !== undefined) patch['installments'] = data.echeances.map(toInstallmentInput);
  return patch;
}

function toInstallmentInput(ech: EcheancePaiement): PaymentTermInstallmentInputDto {
  return {
    lineOrder: ech.ordre,
    percentage: ech.pourcentage,
    daysOffset: ech.delaiJours,
    description: ech.description,
  };
}
