import { Injectable } from '@angular/core';

import { BanqueAdapterBase } from './banque-base.adapter';

/**
 * CIH Bank — OpenAPI (REST/JSON via OAuth2).
 * Code SWIFT CIHMMAMC.
 */
@Injectable({ providedIn: 'root' })
export class CihAdapter extends BanqueAdapterBase {
  override readonly code = 'CIH';
  override readonly nom = 'CIH Bank';
  protected override readonly batchFormat = 'JSON';
}
