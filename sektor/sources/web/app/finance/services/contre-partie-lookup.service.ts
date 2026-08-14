import { Injectable, inject } from '@angular/core';

import { ErpLookupService } from '../../shared/services/erp-lookup.service';
import type { ContrePartie } from '../models';
import { partnerToContrePartie } from './partner-contre-partie.mapper';

@Injectable({ providedIn: 'root' })
export class ContrePartieLookupService {
  private readonly erpLookup = inject(ErpLookupService);

  async listByReglementType(
    type: 'CLIENT' | 'FOURNISSEUR' | 'EMPLOYE',
  ): Promise<ContrePartie[]> {
    if (type === 'EMPLOYE') {
      const items = await this.erpLookup.employes();
      return items.map((e) => ({
        id: String(e.key),
        type: 'EMPLOYE',
        name: e.value,
      }));
    }

    const role = type === 'CLIENT' ? 'CLIENT' : 'FOURNISSEUR';
    const items = await this.erpLookup.partnersByRole(role);
    return items.map((p) =>
      partnerToContrePartie(
        {
          id: String(p.key),
          code: String((p.data as Record<string, unknown> | undefined)?.['code'] ?? ''),
          raisonSociale: p.value,
          ice: (p.data as Record<string, unknown> | undefined)?.['ice'] as string | undefined,
        },
        type,
      ),
    );
  }

  /** Clients + fournisseurs + employés — pour filtres listing. */
  async listAllForFilter(): Promise<ContrePartie[]> {
    const [clients, fournisseurs, employes] = await Promise.all([
      this.listByReglementType('CLIENT'),
      this.listByReglementType('FOURNISSEUR'),
      this.listByReglementType('EMPLOYE'),
    ]);
    return [...clients, ...fournisseurs, ...employes];
  }
}
