import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { LettrageApiService } from '@applications/erp/finance/services/lettrage-api.service';
import { LettrageService } from '@applications/erp/finance/services/lettrage.service';
import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { ButtonComponent } from '@lib/anatomy/components';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type {
  Lettrage,
  LettrageCandidateLigne,
  LettrageLigneKey,
} from '@applications/erp/finance/models';

@Component({
  selector: 'app-lettrage-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    PageShellComponent,
    PageHeaderComponent,
    ButtonComponent,
    MadCurrencyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lettrage.page.html',
  styleUrl: '../_finance-r2.shared.scss',
})
export class LettragePage {
  private readonly lettrageApi = inject(LettrageApiService);
  private readonly lettrage = inject(LettrageService);

  protected readonly compteRadical = signal<'3421' | '4411'>('3421');
  protected readonly candidats = signal<LettrageCandidateLigne[]>([]);
  protected readonly historique = signal<Lettrage[]>([]);
  protected readonly selected = signal<Set<string>>(new Set());
  protected readonly tolerance = signal(0.01);
  protected readonly allowPartiel = signal(false);
  protected readonly busy = signal(false);
  protected readonly err = signal<string | null>(null);

  readonly totals = signal(this.lettrage.computeTotals([]));

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.busy.set(true);
    this.err.set(null);
    try {
      const [cand, hist] = await Promise.all([
        this.lettrageApi.listNonLettrees(this.compteRadical()),
        this.lettrageApi.listHistorique(),
      ]);
      this.candidats.set(cand);
      this.historique.set(hist);
      this.selected.set(new Set());
      this.recalcTotals();
    } catch (e) {
      this.err.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.busy.set(false);
    }
  }

  onCompteChange(v: '3421' | '4411'): void {
    this.compteRadical.set(v);
    void this.reload();
  }

  toggle(key: LettrageLigneKey): void {
    const s = new Set(this.selected());
    if (s.has(key)) s.delete(key);
    else s.add(key);
    this.selected.set(s);
    this.recalcTotals();
  }

  recalcTotals(): void {
    const keys = this.selected();
    const rows = this.candidats().filter((c) => keys.has(c.ligneKey));
    this.totals.set(this.lettrage.computeTotals(rows));
  }

  async suggestAuto(): Promise<void> {
    this.busy.set(true);
    this.err.set(null);
    try {
      const keys = await this.lettrageApi.autoMatch(this.compteRadical());
      if (!keys.length) {
        this.err.set('Aucune paire évidente trouvée.');
        return;
      }
      this.selected.set(new Set(keys));
      this.recalcTotals();
    } catch (e) {
      this.err.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.busy.set(false);
    }
  }

  async lettrer(): Promise<void> {
    const keys = [...this.selected()] as LettrageLigneKey[];
    if (!keys.length) return;
    this.busy.set(true);
    this.err.set(null);
    try {
      await this.lettrageApi.createLettrage({
        ligneKeys: keys,
        comptePcg: this.compteRadical(),
        tolerance: this.tolerance(),
        allowPartiel: this.allowPartiel(),
      });
      await this.reload();
    } catch (e) {
      this.err.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.busy.set(false);
    }
  }

  async delettrer(code: string): Promise<void> {
    this.busy.set(true);
    try {
      await this.lettrageApi.deleteByCode(code);
      await this.reload();
    } catch (e) {
      this.err.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.busy.set(false);
    }
  }

  exportCsv(): void {
    const csv = this.lettrage.exportLettragesCsv(
      this.historique().map((h) => ({
        codeLettrage: h.codeLettrage,
        comptePcg: h.comptePcg,
        status: h.status,
        totalDebit: h.totalDebit,
        totalCredit: h.totalCredit,
        difference: h.difference,
        createdAt: h.createdAt,
      })),
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lettrages.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
