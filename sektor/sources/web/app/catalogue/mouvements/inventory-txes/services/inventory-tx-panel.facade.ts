import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import type { LookupContext } from '@platform/lib/anatomy/types';
import type { InventoryTx, TxType } from '@app/catalogue/models';
import { InventoryMovementApiService } from '@app/catalogue/services/inventory-movement-api.service';

const TX_TYPES: TxType[] = ['RECEPTION', 'SORTIE', 'TRANSFERT', 'RETOUR', 'PERTE', 'INVENTAIRE'];

@Injectable({ providedIn: 'root' })
export class InventoryTxPanelFacade {
  private readonly movementApi = inject(InventoryMovementApiService);
  private readonly translate = inject(TranslateService);

  private lookupsSignal = signal<LookupContext>({});

  readonly lookups = computed(() => this.lookupsSignal());

  emptyDraft(): InventoryTx {
    return {
      id: '',
      txNumber: '',
      txType: 'SORTIE',
      txDate: new Date().toISOString().slice(0, 10),
      status: 'BROUILLON',
      reference: '',
      notes: '',
      lines: [],
    };
  }

  async ensureLookups(): Promise<void> {
    // Articles: line editors use openCatalogItemPicker / searchPicker — no dump.
    this.lookupsSignal.set({
      txTypes: TX_TYPES.map((t) => ({
        key: t,
        value: this.translate.instant(`inventory.enums.txType.${t}`),
      })),
      locations: [],
      articlesMatCons: [],
    });
  }

  private enrichers() {
    return {
      locationName: (id?: string) => {
        if (!id) return undefined;
        const loc = this.lookupsSignal()['locations']?.find((l) => l.key === id);
        return loc?.value?.split(' — ').slice(1).join(' — ');
      },
    };
  }

  async getItem(id: string): Promise<InventoryTx> {
    await this.ensureLookups();
    return this.movementApi.getDetail(id, this.enrichers());
  }

  async createItem(input: Partial<InventoryTx>): Promise<InventoryTx> {
    await this.ensureLookups();
    return this.movementApi.create(
      {
        ...input,
        txType: input.txType ?? 'SORTIE',
        txDate: input.txDate ?? new Date().toISOString().slice(0, 10),
        status: 'BROUILLON',
        lines: input.lines ?? [],
      },
      this.enrichers(),
    );
  }

  async updateItem(id: string, input: Partial<InventoryTx>): Promise<InventoryTx> {
    await this.ensureLookups();
    const current = await this.movementApi.getDetail(id, this.enrichers());
    if (current.status === 'VALIDE') {
      throw new Error(this.translate.instant('inventory.mouvement.tx.errors.cannotModifyValidated'));
    }
    return this.movementApi.update(
      id,
      { ...current, ...input, lines: input.lines ?? current.lines },
      this.enrichers(),
    );
  }

  async deleteItem(id: string): Promise<void> {
    const current = await this.movementApi.getDetail(id);
    if (current.status === 'VALIDE') {
      throw new Error(this.translate.instant('inventory.mouvement.tx.errors.cannotDeleteValidated'));
    }
    await this.movementApi.delete(id);
  }
}
