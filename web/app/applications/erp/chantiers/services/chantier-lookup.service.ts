import { Injectable, inject } from '@angular/core';

import type { LookupContext } from '@lib/anatomy/types';

import { ErpLookupService } from '../../shared/services/erp-lookup.service';

@Injectable({ providedIn: 'root' })
export class ChantierLookupService {
  private readonly erpLookup = inject(ErpLookupService);

  async listOptions(search?: string): Promise<Array<{ key: string; value: string }>> {
    const items = await this.erpLookup.chantiers(search);
    return items.map((item) => ({
      key: String(item.key),
      value: item.value,
    }));
  }

  async asLookupContext(key = 'chantiers'): Promise<LookupContext> {
    const options = await this.listOptions();
    return { [key]: options };
  }
}
