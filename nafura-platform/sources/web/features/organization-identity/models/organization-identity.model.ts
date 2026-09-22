export type OrganizationFormeJuridique = 'SARL' | 'SA' | 'SARLAU' | 'SAS';

export interface OrganizationIdentity {
  raisonSociale: string;
  formeJuridique: string;
  capital: string;
  ice: string;
  identifiantFiscal: string;
  rc: string;
  patente: string;
  cnss: string;
  tvaIntra: string;
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  siteWeb: string;
  banque: string;
  rib: string;
}

export const EMPTY_ORGANIZATION_IDENTITY: OrganizationIdentity = {
  raisonSociale: '',
  formeJuridique: 'SARL',
  capital: '',
  ice: '',
  identifiantFiscal: '',
  rc: '',
  patente: '',
  cnss: '',
  tvaIntra: '',
  adresse: '',
  ville: '',
  telephone: '',
  email: '',
  siteWeb: '',
  banque: '',
  rib: '',
};

export const FORME_JURIDIQUE_OPTIONS: { value: OrganizationFormeJuridique; label: string }[] = [
  { value: 'SARL', label: 'SARL' },
  { value: 'SA', label: 'SA' },
  { value: 'SARLAU', label: 'SARL AU' },
  { value: 'SAS', label: 'SAS' },
];

export function isOrganizationIdentityEmpty(identity: OrganizationIdentity | null): boolean {
  return !identity?.raisonSociale?.trim();
}
