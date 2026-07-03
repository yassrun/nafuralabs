import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import type { BonCommande } from '../models';
import type { MatchingReception, MatchingTolerance } from '../models/matching.models';
import type { FactureFournisseur } from '../../finance/models';
import type { InventoryTx } from '../../inventory/models';
import { FfApiService } from '../../pages/achats/factures-fournisseur/services/ff-api.service';
import {
  BcApiService,
  receptionAchatToInventoryTx,
} from '../../pages/achats/commandes/services/bc-api.service';

import { computeMatchingThreeWay, DEFAULT_MATCHING_TOLERANCE } from './matching-three-way';

@Injectable({ providedIn: 'root' })
export class MatchingService {
  private readonly bcApi = inject(BcApiService);
  private readonly ffApi = inject(FfApiService);

  /** Réceptions (BL) liées au BC via GET …/bons-commande-achat/{id}/receptions. */
  getReceptionsForBc(bcId: string, bcNumero?: string): Observable<InventoryTx[]> {
    return from(this.bcApi.listReceptions(bcId)).pipe(
      map((rows) => rows.map((r) => receptionAchatToInventoryTx(r, bcNumero))),
    );
  }

  computeForBc(
    bc: BonCommande,
    receptions: InventoryTx[],
    facture: FactureFournisseur | null | undefined,
    tolerance?: MatchingTolerance,
  ): MatchingReception {
    return computeMatchingThreeWay(bc, receptions, facture, tolerance ?? DEFAULT_MATCHING_TOLERANCE);
  }

  /** Résout la première facture fournisseur brouillon ou validée liée au n° BC. */
  findFactureForBc(bcId: string, bcNumero: string): Observable<FactureFournisseur | null> {
    return from(this.ffApi.listByBc(bcId)).pipe(
      map((rows) => {
        if (rows.length) {
          return rows.find((f) => f.status === 'BROUILLON') ?? rows[0] ?? null;
        }
        return null;
      }),
      catchError(() => of(null)),
    );
  }

  loadMatchingForBc(bcId: string, tolerance?: MatchingTolerance): Observable<MatchingReception | null> {
    return from(this.ffApi.getMatchingByBc(bcId, tolerance)).pipe(
      catchError(() =>
        from(this.bcApi.getById(bcId)).pipe(
          switchMap((bc) =>
            combineLatest([
              this.getReceptionsForBc(bc.id, bc.numero),
              this.findFactureForBc(bc.id, bc.numero),
            ]).pipe(
              map(([receptions, ff]) => this.computeForBc(bc, receptions, ff, tolerance)),
            ),
          ),
          catchError(() => of(null)),
        ),
      ),
    );
  }

  /** Utilise la facture courante comme tiers « facture » du 3-way (écran FF). */
  loadMatchingForFacture(ff: FactureFournisseur, tolerance?: MatchingTolerance): Observable<MatchingReception | null> {
    const bcId = ff.bcId;
    if (!bcId) return of(null);
    if (ff.id) {
      return from(this.ffApi.getMatching(ff.id, tolerance)).pipe(
        catchError(() => this.loadMatchingForBc(bcId, tolerance)),
      );
    }
    return this.loadMatchingForBc(bcId, tolerance);
  }

  /** Bloque la validation comptable si statut ECART_BLOQUE. */
  blocksInvoiceValidation(m: MatchingReception): boolean {
    return m.status === 'ECART_BLOQUE';
  }
}
