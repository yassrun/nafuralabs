import { Injectable, computed, inject, signal } from '@angular/core';

import { ChartOfAccountApiService } from '@applications/erp/finance/services/chart-of-account-api.service';
import { JournalApiService } from '@applications/erp/finance/services/journal-api.service';
import type {
  Compte,
  CompteCreate,
  CompteUpdate,
  Journal,
  JournalCreate,
  JournalUpdate,
} from '@applications/erp/finance/models';

@Injectable({ providedIn: 'root' })
export class PlanComptableFacade {
  private readonly accountApi = inject(ChartOfAccountApiService);
  private readonly journalApi = inject(JournalApiService);

  private readonly _comptes = signal<Compte[]>([]);
  private readonly _journaux = signal<Journal[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly comptes = computed(() => this._comptes());
  readonly journaux = computed(() => this._journaux());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  readonly nbComptes = computed(() => this._comptes().length);
  readonly nbComptesActifs = computed(
    () => this._comptes().filter((c) => c.isActive).length,
  );
  readonly nbAuxiliaires = computed(
    () => this._comptes().filter((c) => c.isAuxiliaire).length,
  );

  async loadAll(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const [comptes, journaux] = await Promise.all([
        this.accountApi.listAll(),
        this.journalApi.listAll(),
      ]);
      this._comptes.set(comptes);
      this._journaux.set(journaux);
    } catch (e) {
      this._error.set((e as Error).message);
    } finally {
      this._loading.set(false);
    }
  }

  async createCompte(data: CompteCreate): Promise<Compte> {
    const created = await this.accountApi.create(data);
    this._comptes.set([...this._comptes(), created]);
    return created;
  }

  async updateCompte(id: string, data: CompteUpdate): Promise<Compte> {
    const updated = await this.accountApi.update(id, data);
    this._comptes.set(
      this._comptes().map((c) => (c.id === id ? updated : c)),
    );
    return updated;
  }

  async deleteCompte(id: string): Promise<void> {
    await this.accountApi.delete(id);
    this._comptes.set(this._comptes().filter((c) => c.id !== id));
  }

  async resetPlanComptable(): Promise<void> {
    const reset = await this.accountApi.resetToSeed();
    this._comptes.set(reset);
    const journaux = await this.journalApi.listAll();
    this._journaux.set(journaux);
  }

  async createJournal(data: JournalCreate): Promise<Journal> {
    const created = await this.journalApi.create(data);
    this._journaux.set([...this._journaux(), created]);
    return created;
  }

  async updateJournal(id: string, data: JournalUpdate): Promise<Journal> {
    const updated = await this.journalApi.update(id, data);
    this._journaux.set(
      this._journaux().map((j) => (j.id === id ? updated : j)),
    );
    return updated;
  }

  async deleteJournal(id: string): Promise<void> {
    await this.journalApi.delete(id);
    this._journaux.set(this._journaux().filter((j) => j.id !== id));
  }
}
