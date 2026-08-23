import { Injectable, LOCALE_ID, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@platform/lib/anatomy';
import type { LookupContext } from '@platform/lib/anatomy/types';
import type {
  DAStatus,
  DemandeAchat,
  DemandeAchatCreate,
  DemandeAchatUpdate,
} from '@app/achats/models';
import { ErpAuditService, AuditAction } from '@app/socle/shell/erp-audit.service';

import { DemandeApiService } from './demande-api.service';

@Injectable({ providedIn: 'root' })
export class DemandeFacade extends GridFacade<DemandeAchat, DemandeAchatCreate, DemandeAchatUpdate> {
  protected override api = inject(DemandeApiService);
  private readonly audit = inject(ErpAuditService);
  private readonly locale = inject(LOCALE_ID);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['chantiers']) return;
    this.lookupsSignal.set({ chantiers: [] });
  }

  async changeStatus(id: string, next: DAStatus, note?: string): Promise<DemandeAchat> {
    let result: DemandeAchat;
    switch (next) {
      case 'SOUMISE':
        result = await this.api.submit(id);
        break;
      case 'APPROUVEE':
        result = await this.api.approve(id);
        break;
      case 'REJETEE':
        if (!note?.trim()) {
          throw new Error('Le motif de rejet est obligatoire');
        }
        result = await this.api.reject(id, note.trim());
        break;
      case 'CONVERTIE':
        result = await this.api.convertToAo(id);
        break;
      default:
        result = await this.api.update(id, { status: next, notes: note });
    }
    const action: AuditAction =
      next === 'APPROUVEE' ? 'APPROVE' :
      next === 'REJETEE' ? 'REJECT' :
      next === 'SOUMISE' ? 'SUBMIT' : 'UPDATE';
    this.audit.log(action, 'DA', result.id, result.numero ?? result.id,
      `Statut → ${next}${note ? ` (${note})` : ''}`);
    return result;
  }

  protected override onCreateSuccess(item: DemandeAchat): void {
    this.audit.log('CREATE', 'DA', item.id, item.numero ?? item.id,
      item.totalEstimeHt ? `Estimé HT : ${item.totalEstimeHt.toLocaleString(this.locale)} MAD` : undefined);
  }

  protected override onUpdateSuccess(item: DemandeAchat): void {
    this.audit.log('UPDATE', 'DA', item.id, item.numero ?? item.id);
  }

  protected override onDeleteSuccess(): void {
    this.audit.log('DELETE', 'DA', '—', 'DA supprimée');
  }
}
