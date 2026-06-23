import { Injectable, inject } from '@angular/core';

import { FfApiService } from '@applications/erp/pages/achats/factures-fournisseur/services/ff-api.service';
import { FactureApiService } from '@applications/erp/pages/ventes/factures/services/facture-api.service';
import type { FactureFournisseur } from '@applications/erp/finance/models';
import type { FactureClient } from '@applications/erp/ventes/models';

import type { FactureOuverte } from '../models';

const CLOSED_STATUSES = new Set(['PAYEE', 'ANNULEE', 'AVOIRISEE', 'BROUILLON']);

function isOpenClient(f: Pick<FactureClient, 'resteTtc' | 'status'>): boolean {
  return f.resteTtc > 0 && !CLOSED_STATUSES.has(f.status);
}

function isOpenFournisseur(f: Pick<FactureFournisseur, 'resteARegler' | 'status'>): boolean {
  return f.resteARegler > 0 && !CLOSED_STATUSES.has(f.status);
}

function clientToFactureOuverte(f: FactureClient): FactureOuverte {
  return {
    id: f.id,
    type: 'CLIENT',
    numero: f.numero,
    contrePartieId: f.clientId,
    contrePartieName: f.clientName ?? '',
    date: f.dateEmission,
    echeance: f.dateEcheance,
    totalTtc: f.netAPayerTtc,
    cumulRegleTtc: f.cumulEncaisseTtc,
    resteARegler: f.resteTtc,
    status: f.status,
    reference: f.chantierCode ?? f.notes,
  };
}

function fournisseurToFactureOuverte(f: FactureFournisseur): FactureOuverte {
  return {
    id: f.id,
    type: 'FOURNISSEUR',
    numero: f.numeroInterne,
    contrePartieId: f.fournisseurId,
    contrePartieName: f.fournisseurName ?? '',
    date: f.dateFacture,
    echeance: f.dateEcheance,
    totalTtc: f.netAPayerTtc,
    cumulRegleTtc: f.cumulRegleTtc,
    resteARegler: f.resteARegler,
    status: f.status,
    reference: f.bcNumero ?? f.numeroFournisseur ?? f.notes,
  };
}

function sortByEcheance(a: FactureOuverte, b: FactureOuverte): number {
  return a.echeance < b.echeance ? -1 : a.echeance > b.echeance ? 1 : 0;
}

@Injectable({ providedIn: 'root' })
export class FacturesOuvertesService {
  private readonly factureApi = inject(FactureApiService);
  private readonly ffApi = inject(FfApiService);

  async list(
    type: 'CLIENT' | 'FOURNISSEUR',
    contrePartieId?: string,
  ): Promise<FactureOuverte[]> {
    if (type === 'CLIENT') {
      const res = await this.factureApi.getAll(
        contrePartieId
          ? { page: 0, pageSize: 500, clientId: contrePartieId }
          : { page: 0, pageSize: 500 },
      );
      return res.items
        .filter(isOpenClient)
        .map(clientToFactureOuverte)
        .sort(sortByEcheance);
    }

    const rows = await this.ffApi.list(
      contrePartieId
        ? { page: 0, pageSize: 500, fournisseurId: contrePartieId }
        : { page: 0, pageSize: 500 },
    );
    return rows.filter(isOpenFournisseur).map(fournisseurToFactureOuverte).sort(sortByEcheance);
  }
}
