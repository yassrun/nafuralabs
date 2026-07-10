import type {
  AttestationFournisseur,
  AttestationFournisseurCreate,
  AttestationFournisseurStatus,
  AttestationFournisseurType,
  AttestationFournisseurUpdate,
  AttestationTypeStatus,
  PartnerAttestationsStatus,
} from '@applications/erp/achats/models';

export interface ApiAttestationFournisseur {
  id: string;
  tenantId?: string;
  partnerId: string;
  type: string;
  dateEmission: string;
  dateExpiration: string;
  scanUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiAttestationTypeStatus {
  type: string;
  status: string;
  attestationId?: string;
  dateExpiration?: string;
  present: boolean;
}

export interface ApiPartnerAttestationsStatus {
  partnerId: string;
  chips: ApiAttestationTypeStatus[];
  reglementBloque: boolean;
}

export function attestationToUi(row: ApiAttestationFournisseur): AttestationFournisseur {
  return {
    id: row.id,
    partnerId: row.partnerId,
    type: row.type as AttestationFournisseurType,
    dateEmission: row.dateEmission,
    dateExpiration: row.dateExpiration,
    scanUrl: row.scanUrl,
    status: row.status as AttestationFournisseurStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function attestationCreateToApi(
  data: AttestationFournisseurCreate,
): Record<string, unknown> {
  return {
    partnerId: data.partnerId,
    type: data.type,
    dateEmission: data.dateEmission,
    dateExpiration: data.dateExpiration,
    scanUrl: data.scanUrl,
  };
}

export function attestationUpdateToApi(
  data: AttestationFournisseurUpdate,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (data.partnerId !== undefined) body['partnerId'] = data.partnerId;
  if (data.type !== undefined) body['type'] = data.type;
  if (data.dateEmission !== undefined) body['dateEmission'] = data.dateEmission;
  if (data.dateExpiration !== undefined) body['dateExpiration'] = data.dateExpiration;
  if (data.scanUrl !== undefined) body['scanUrl'] = data.scanUrl;
  return body;
}

export function partnerAttestationsStatusToUi(
  row: ApiPartnerAttestationsStatus,
): PartnerAttestationsStatus {
  return {
    partnerId: row.partnerId,
    reglementBloque: row.reglementBloque,
    chips: (row.chips ?? []).map(
      (chip): AttestationTypeStatus => ({
        type: chip.type as AttestationFournisseurType,
        status: chip.status as AttestationFournisseurStatus,
        attestationId: chip.attestationId,
        dateExpiration: chip.dateExpiration,
        present: chip.present,
      }),
    ),
  };
}
