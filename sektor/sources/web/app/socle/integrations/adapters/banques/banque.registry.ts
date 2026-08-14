import { Injectable, inject } from '@angular/core';

import type { BanqueAdapter } from './banque.adapter';
import { AwbAdapter } from './awb.adapter';
import { BmceAdapter } from './bmce.adapter';
import { CihAdapter } from './cih.adapter';
import { BpAdapter } from './bp.adapter';

/**
 * Résout l'adaptateur banque depuis un code (AWB, BMCE, CIH, BP, ...).
 * Évite aux pages métier de faire un switch/case sur le code banque.
 */
@Injectable({ providedIn: 'root' })
export class BanqueAdapterRegistry {
  private readonly awb = inject(AwbAdapter);
  private readonly bmce = inject(BmceAdapter);
  private readonly cih = inject(CihAdapter);
  private readonly bp = inject(BpAdapter);

  /** Tous les adaptateurs enregistrés. */
  all(): BanqueAdapter[] {
    return [this.awb, this.bmce, this.cih, this.bp];
  }

  /** Adaptateur correspondant au code banque, ou `null` si inconnu. */
  resolve(code: string): BanqueAdapter | null {
    const up = code.toUpperCase();
    return this.all().find((a) => a.code === up) ?? null;
  }
}
