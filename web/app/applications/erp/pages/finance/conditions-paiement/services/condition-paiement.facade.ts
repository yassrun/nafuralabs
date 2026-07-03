import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import type {
  ConditionPaiement,
  ConditionPaiementCreate,
  ConditionPaiementUpdate,
} from '@applications/erp/finance/models';

import { ConditionPaiementApiService } from './condition-paiement-api.service';

const TYPES: { key: string; value: string }[] = [
  { key: 'IMMEDIAT', value: 'Immédiat' },
  { key: 'DELAI_SIMPLE', value: 'Délai simple' },
  { key: 'FIN_DE_MOIS', value: 'Fin de mois' },
  { key: 'ECHEANCES_MULTIPLES', value: 'Échéances multiples' },
];

@Injectable({ providedIn: 'root' })
export class ConditionPaiementFacade extends GridFacade<
  ConditionPaiement,
  ConditionPaiementCreate,
  ConditionPaiementUpdate
> {
  protected override api = inject(ConditionPaiementApiService);

  private readonly lookupsSignal = signal<LookupContext>({
    conditionPaiementType: TYPES,
  });
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (!this.lookupsSignal()['conditionPaiementType']) {
      this.lookupsSignal.set({ conditionPaiementType: TYPES });
    }
  }
}
