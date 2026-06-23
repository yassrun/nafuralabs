import { Injectable, computed, inject, signal } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type { LookupContext } from '@lib/anatomy/types';
import type {
  Ouvrage,
  OuvrageCreate,
  OuvrageUpdate,
} from '@applications/erp/etudes/models';

import { OuvrageApiService } from './ouvrage-api.service';

const CATEGORIES: { key: string; value: string }[] = [
  { key: 'TERRASSEMENT', value: 'Terrassement' },
  { key: 'GO', value: 'Gros œuvre' },
  { key: 'CHARPENTE', value: 'Charpente' },
  { key: 'ETANCHEITE', value: 'Étanchéité' },
  { key: 'CLOISON', value: 'Cloisons' },
  { key: 'REVETEMENT', value: 'Revêtements' },
  { key: 'MENUISERIE', value: 'Menuiserie' },
  { key: 'ELECTRICITE', value: 'Électricité' },
  { key: 'PLOMBERIE', value: 'Plomberie' },
  { key: 'CLIM', value: 'CVC / Clim' },
  { key: 'PEINTURE', value: 'Peinture' },
  { key: 'VRD', value: 'VRD' },
  { key: 'AUTRE', value: 'Autre' },
];

@Injectable({ providedIn: 'root' })
export class OuvrageFacade extends GridFacade<Ouvrage, OuvrageCreate, OuvrageUpdate> {
  protected override api = inject(OuvrageApiService);

  private readonly lookupsSignal = signal<LookupContext>({
    ouvrageCategory: CATEGORIES,
  });
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (!this.lookupsSignal()['ouvrageCategory']) {
      this.lookupsSignal.set({ ouvrageCategory: CATEGORIES });
    }
  }
}
