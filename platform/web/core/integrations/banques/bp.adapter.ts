import { Injectable } from '@angular/core';

import { BanqueAdapterBase } from './banque-base.adapter';

/**
 * Banque Populaire (BPCE Maroc, groupe).
 * Réseau historique SFTP + fichiers XML / TXT.
 * Code SWIFT BCPOMAMC.
 */
@Injectable({ providedIn: 'root' })
export class BpAdapter extends BanqueAdapterBase {
  override readonly code = 'BP';
  override readonly nom = 'Banque Populaire';
  protected override readonly batchFormat = 'SFTP';
}
