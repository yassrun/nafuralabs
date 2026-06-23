import type { Fournisseur } from '@applications/erp/achats/models';
import type {
  ClientVente,
  ClientVenteCreate,
  ClientVenteType,
  ClientVenteUpdate,
} from '@applications/erp/ventes/models';

import type { Partner, PartnerCreate, PartnerUpdate } from './partners-api.service';

const CLIENT_TYPES: ClientVenteType[] = [
  'SA',
  'SARL',
  'SAS',
  'Particulier',
  'Administration',
  'Cooperative',
];

function parseClientType(forme?: string): ClientVenteType {
  if (forme && CLIENT_TYPES.includes(forme as ClientVenteType)) {
    return forme as ClientVenteType;
  }
  return 'SARL';
}

function newClientCode(): string {
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `CLI-${suffix}`;
}

export function partnerToFournisseur(partner: Partner): Fournisseur {
  return {
    id: partner.id,
    code: partner.code,
    raisonSociale: partner.raisonSociale,
    ice: partner.ice,
    contactPrincipalEmail: partner.email,
    contactPrincipalTel: partner.phone,
    pays: 'MA',
    conditionsPaiementParDefaut: '30 jours',
    categories: [],
    isActive: partner.isActive !== false,
    createdAt: new Date().toISOString(),
  };
}

export function partnerToClientVente(partner: Partner): ClientVente {
  return {
    id: partner.id,
    code: partner.code,
    nom: partner.raisonSociale,
    type: parseClientType(partner.formeJuridique),
    ice: partner.ice,
    ifFiscal: partner.identifiantFiscal,
    rc: partner.registreCommerce,
    patente: partner.patente,
    telephone: partner.phone,
    email: partner.email,
    ville: '',
    actif: partner.isActive !== false,
  };
}

export function clientVenteToPartnerCreate(data: ClientVenteCreate): PartnerCreate {
  return {
    code: newClientCode(),
    raisonSociale: data.nom,
    formeJuridique: data.type,
    ice: data.ice,
    identifiantFiscal: data.ifFiscal,
    registreCommerce: data.rc,
    patente: data.patente,
    email: data.email,
    phone: data.telephone,
    roles: ['CLIENT'],
  };
}

export function clientVenteToPartnerUpdate(data: ClientVenteUpdate): PartnerUpdate {
  return {
    raisonSociale: data.nom,
    formeJuridique: data.type,
    ice: data.ice,
    identifiantFiscal: data.ifFiscal,
    registreCommerce: data.rc,
    patente: data.patente,
    email: data.email,
    phone: data.telephone,
  };
}
