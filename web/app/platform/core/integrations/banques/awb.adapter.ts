import { Injectable } from '@angular/core';

import { BanqueAdapterBase } from './banque-base.adapter';

/**
 * Attijariwafa Bank — Open Banking (REST/JSON via OAuth2).
 * Code SWIFT BCMAMAMC.
 */
@Injectable({ providedIn: 'root' })
export class AwbAdapter extends BanqueAdapterBase {
  override readonly code = 'AWB';
  override readonly nom = 'Attijariwafa Bank';
  protected override readonly batchFormat = 'JSON';
}
