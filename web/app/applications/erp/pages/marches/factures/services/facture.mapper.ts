import type { FactureMarche, FactureMarcheStatus } from '../../models';

export interface ApiFactureMarche {
  id: string;
  numero: string;
  contratMarcheId: string;
  marcheNumero?: string;
  chantierId?: string;
  chantierCode?: string;
  clientNom?: string;
  montantBrutHt: number | string;
  avanceDeduiteHt: number | string;
  retenueGarantieHt: number | string;
  netHt: number | string;
  tvaTaux: number | string;
  tvaMontant: number | string;
  netTtc: number | string;
  retenueSourceTaux: number | string;
  retenueSourceMontant: number | string;
  timbreFiscal: number | string;
  netAPayer: number | string;
  dateEmission?: string;
  dateEcheance?: string;
  status: string;
  factureClientId?: string;
}

function num(v: number | string | undefined | null, fallback = 0): number {
  if (v == null) return fallback;
  return typeof v === 'number' ? v : Number(v);
}

export function factureToUi(row: ApiFactureMarche): FactureMarche {
  const status = row.status as FactureMarcheStatus;
  const netAPayer = num(row.netAPayer);
  const netTtc = num(row.netTtc);
  const ras = num(row.retenueSourceMontant);
  return {
    id: row.id,
    numero: row.numero,
    marcheId: row.contratMarcheId,
    marcheNumero: row.marcheNumero ?? row.contratMarcheId,
    chantierId: row.chantierId ?? '',
    chantierCode: row.chantierCode ?? '',
    clientNom: row.clientNom ?? '',
    situationsIds: [],
    dateEmission: row.dateEmission ?? '',
    dateEcheance: row.dateEcheance ?? '',
    montantBrutHt: num(row.montantBrutHt),
    avanceDeduiteHt: num(row.avanceDeduiteHt),
    retenueGarantieHt: num(row.retenueGarantieHt),
    netHt: num(row.netHt),
    tvaTaux: num(row.tvaTaux, 20),
    tvaMontant: num(row.tvaMontant),
    netTtc,
    retenueSourceTaux: num(row.retenueSourceTaux),
    retenueSourceMontant: ras,
    timbreFiscal: num(row.timbreFiscal),
    netAPayer,
    status,
    paiements: status === 'PAYEE' ? [{
      id: `pay-${row.id}`,
      factureId: row.id,
      date: row.dateEcheance ?? row.dateEmission ?? '',
      montant: netAPayer,
      reference: `VIR-${row.numero}`,
      modePaiement: 'VIREMENT',
    }] : [],
  };
}

export function factureCreateToApi(data: Partial<FactureMarche>): Record<string, unknown> {
  return {
    id: data.id,
    numero: data.numero,
    contratMarcheId: data.marcheId,
    montantBrutHt: data.montantBrutHt,
    avanceDeduiteHt: data.avanceDeduiteHt,
    retenueGarantieHt: data.retenueGarantieHt,
    netHt: data.netHt,
    tvaTaux: data.tvaTaux,
    tvaMontant: data.tvaMontant,
    netTtc: data.netTtc,
    retenueSourceTaux: data.retenueSourceTaux,
    retenueSourceMontant: data.retenueSourceMontant,
    timbreFiscal: data.timbreFiscal,
    netAPayer: data.netAPayer,
    dateEmission: data.dateEmission,
    dateEcheance: data.dateEcheance,
    status: data.status,
  };
}
