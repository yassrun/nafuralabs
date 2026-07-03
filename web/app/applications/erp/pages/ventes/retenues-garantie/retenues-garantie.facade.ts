import { Injectable, computed, inject, signal } from '@angular/core';

import type {
  RetenueGarantie,
  RetenueGarantieListItem,
} from '@applications/erp/ventes/models';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

import { RetenueGarantieApiService } from './services/retenue-garantie-api.service';
import { RetenueGarantieCalculService } from './services/retenue-garantie-calcul.service';

const REFERENCE_DATE = new Date('2026-05-08');

function toListItem(
  r: RetenueGarantie,
  delai: RetenueGarantieCalculService,
): RetenueGarantieListItem {
  return {
    ...r,
    delaiRestant: delai.delaiRestantJours(r.dateLiberationPrevue, REFERENCE_DATE),
  };
}

interface RetenueFilters {
  search?: string;
  status?: string;
  clientId?: string;
  chantierId?: string;
  hasCaution?: boolean;
  liberationsSous30j?: boolean;
}

@Injectable({ providedIn: 'root' })
export class RetenuesGarantieFacade {
  private readonly api = inject(RetenueGarantieApiService);
  private readonly delaiSvc = inject(RetenueGarantieCalculService);
  private readonly audit = inject(ErpAuditService);

  private readonly retenuesSignal = signal<RetenueGarantie[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly filtersSignal = signal<RetenueFilters>({});

  readonly retenues = computed(() => this.retenuesSignal());
  readonly banques = computed(() => [] as { id: string; nom: string }[]);
  readonly loading = computed(() => this.loadingSignal());
  readonly filters = computed(() => this.filtersSignal());

  readonly filtered = computed<RetenueGarantieListItem[]>(() => {
    const f = this.filtersSignal();
    return this.retenuesSignal()
      .map((r) => toListItem(r, this.delaiSvc))
      .filter((r) => {
        if (f.search) {
          const term = f.search.toLowerCase();
          if (
            !(
              r.chantierCode?.toLowerCase().includes(term) ||
              r.clientName?.toLowerCase().includes(term) ||
              r.chantierId.toLowerCase().includes(term)
            )
          ) {
            return false;
          }
        }
        if (f.status && r.status !== f.status) return false;
        if (f.clientId && r.clientId !== f.clientId) return false;
        if (f.chantierId && r.chantierId !== f.chantierId) return false;
        if (f.hasCaution && !r.cautionBanqueId) return false;
        if (f.liberationsSous30j) {
          if (
            r.delaiRestant === null ||
            r.delaiRestant === undefined ||
            r.delaiRestant > 30 ||
            r.status === 'LIBEREE'
          ) {
            return false;
          }
        }
        return true;
      });
  });

  setFilter<K extends keyof RetenueFilters>(
    key: K,
    value: RetenueFilters[K] | undefined,
  ): void {
    this.filtersSignal.update((current) => ({ ...current, [key]: value }));
  }

  resetFilters(): void {
    this.filtersSignal.set({});
  }

  async load(): Promise<void> {
    this.loadingSignal.set(true);
    try {
      const retenues = await this.api.list();
      this.retenuesSignal.set(retenues);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async demanderLiberation(id: string): Promise<void> {
    const updated = await this.api.demandeRestitution(id);
    this.replaceRetenue(updated);
    this.audit.log(
      'UPDATE',
      'RETENUE_GARANTIE',
      updated.id,
      updated.chantierCode ?? updated.chantierId,
      'Demande libération',
    );
  }

  async marquerLiberee(id: string, _dateLiberation?: string): Promise<void> {
    const current = this.retenuesSignal().find((r) => r.id === id);
    if (!current) return;
    const montant = current.resteARelibererHt;
    const updated = await this.api.restituer(id, montant);
    this.replaceRetenue(updated);
    this.audit.log(
      'UPDATE',
      'RETENUE_GARANTIE',
      updated.id,
      updated.chantierCode ?? updated.chantierId,
      'Libérée',
    );
  }

  async remplacerParCaution(
    id: string,
    caution: {
      banqueId: string;
      banque: string;
      montant: number;
      numero: string;
    },
  ): Promise<void> {
    this.retenuesSignal.update((current) =>
      current.map((r) =>
        r.id === id
          ? {
              ...r,
              cautionBanqueId: caution.banqueId,
              cautionBanque: caution.banque,
              cautionMontant: caution.montant,
              cautionNumero: caution.numero,
            }
          : r,
      ),
    );
    this.audit.log(
      'UPDATE',
      'RETENUE_GARANTIE',
      id,
      id,
      'Remplacement par caution bancaire',
    );
  }

  private replaceRetenue(updated: RetenueGarantie): void {
    this.retenuesSignal.update((current) =>
      current.map((r) => (r.id === updated.id ? updated : r)),
    );
  }
}
