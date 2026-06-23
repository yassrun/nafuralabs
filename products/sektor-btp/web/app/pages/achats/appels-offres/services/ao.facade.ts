import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import type {
  AOStatus,
  AppelOffre,
  AppelOffreCreate,
  AppelOffreUpdate,
  BonCommande,
} from '@applications/erp/achats/models';
import { PartnersApiService } from '@applications/erp/shared/services/partners-api.service';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

import { AoApiService } from './ao-api.service';

@Injectable({ providedIn: 'root' })
export class AoFacade extends GridFacade<AppelOffre, AppelOffreCreate, AppelOffreUpdate> {
  protected override api = inject(AoApiService);
  private readonly partnersApi = inject(PartnersApiService);
  private readonly audit = inject(ErpAuditService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['fournisseurs']) return;
    const res = await this.partnersApi.listByRole('FOURNISSEUR', { page: 0, pageSize: 500 });
    this.lookupsSignal.set({
      fournisseurs: res.items.map((f) => ({
        key: f.id,
        value: `${f.code} — ${f.raisonSociale}`,
      })),
    });
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
    const partner = (await this.partnersApi.listByRole('FOURNISSEUR', { page: 0, pageSize: 500 }))
      .items.find((p) => p.id === fournisseurId);
    const { ao, bc } = await this.api.attribuer(
      aoId,
      fournisseurId,
      partner?.raisonSociale,
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
