import { Injectable } from '@angular/core';

import { BanqueAdapterBase } from './banque-base.adapter';

/**
 * BMCE Bank of Africa — historiquement SFTP/XML.
 * Code SWIFT BMCEMAMC.
 */
@Injectable({ providedIn: 'root' })
export class BmceAdapter extends BanqueAdapterBase {
  override readonly code = 'BMCE';
  override readonly nom = 'BMCE Bank of Africa';
  protected override readonly batchFormat = 'XML';
}
