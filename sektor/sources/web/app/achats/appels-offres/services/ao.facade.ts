import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@platform/lib/anatomy';
import type { LookupContext } from '@platform/lib/anatomy/types';
import type {
  AOStatus,
  AppelOffre,
  AppelOffreCreate,
  AppelOffreUpdate,
  BonCommande,
} from '@app/achats/models';
import { PartnersApiService } from '@app/socle/shared/services/partners-api.service';
import { ErpAuditService } from '@app/socle/shell/erp-audit.service';

import { AoApiService } from './ao-api.service';

@Injectable({ providedIn: 'root' })
export class AoFacade extends GridFacade<AppelOffre, AppelOffreCreate, AppelOffreUpdate> {
  protected override api = inject(AoApiService);
  private readonly partnersApi = inject(PartnersApiService);
  private readonly audit = inject(ErpAuditService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['chantiers']) return;
    this.lookupsSignal.set({ chantiers: [] });
  }

  async changeStatus(id: string, next: AOStatus): Promise<AppelOffre> {
    let result: AppelOffre;
    switch (next) {
      case 'PUBLIEE':
        result = await this.api.publish(id);
        break;
      case 'CLOTUREE':
        result = await this.api.cloreReception(id);
        break;
      default:
        result = await this.api.update(id, { status: next });
    }
    this.audit.log('UPDATE', 'AO', result.id, result.numero ?? result.id, `Statut → ${next}`);
    return result;
  }

  async attribuer(
    aoId: string,
    fournisseurId: string,
    overrideJustification?: string,
  ): Promise<{ ao: AppelOffre; bc: BonCommande | null }> {
    let raisonSociale: string | undefined;
    try {
      const partner = await this.partnersApi.getById(fournisseurId);
      raisonSociale = partner.raisonSociale;
    } catch {
      raisonSociale = undefined;
    }
    const { ao, bc } = await this.api.attribuer(
      aoId,
      fournisseurId,
      raisonSociale,
    );
    if (overrideJustification?.trim()) {
      this.audit.log(
        'UPDATE',
        'AO',
        ao.id,
        ao.numero ?? ao.id,
        `Attribution hors recommandation — ${overrideJustification.trim()}`,
      );
    } else {
      this.audit.log('APPROVE', 'AO', ao.id, ao.numero ?? ao.id, 'Attribué');
    }
    this.audit.log('CREATE', 'BC', bc.id, bc.numero ?? bc.id, `Généré depuis AO ${ao.numero ?? ao.id}`);
    return { ao, bc };
  }

  protected override onCreateSuccess(item: AppelOffre): void {
    this.audit.log('CREATE', 'AO', item.id, item.numero ?? item.id);
  }

  protected override onUpdateSuccess(item: AppelOffre): void {
    this.audit.log('UPDATE', 'AO', item.id, item.numero ?? item.id);
  }

  protected override onDeleteSuccess(): void {
    this.audit.log('DELETE', 'AO', '—', 'AO supprimé');
  }
}
