import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { BankReconciliationApiService } from '@applications/erp/finance/services/bank-reconciliation-api.service';
import { VirementApiService } from '@applications/erp/finance/services/virement-api.service';
import type { CompteFinancier, VirementInterne } from '@applications/erp/finance/models';
import { ButtonComponent } from '@lib/anatomy/components';

@Component({
  selector: 'app-virement-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './virement-listing.page.html',
  styleUrl: './virement-listing.page.scss',
})
export class VirementListingPage {
  private readonly api = inject(VirementApiService);
  private readonly bankApi = inject(BankReconciliationApiService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LOCALE_ID);

  protected readonly comptes = signal<CompteFinancier[]>([]);
  protected readonly virements = signal<VirementInterne[]>([]);

  protected readonly filterStatus = signal<VirementInterne['status'] | ''>('');
  protected readonly filterSource = signal<string>('');
  protected readonly filterDest = signal<string>('');
  protected readonly filterFrom = signal<string>('');
  protected readonly filterTo = signal<string>('');
  protected readonly filterText = signal<string>('');

  readonly filtered = computed(() => {
    let list = [...this.virements()].sort((a, b) => (a.date < b.date ? 1 : -1));
    if (this.filterStatus()) list = list.filter((v) => v.status === this.filterStatus());
    if (this.filterSource()) list = list.filter((v) => v.compteSourceId === this.filterSource());
    if (this.filterDest()) list = list.filter((v) => v.compteDestId === this.filterDest());
    if (this.filterFrom()) list = list.filter((v) => v.date >= this.filterFrom());
    if (this.filterTo()) list = list.filter((v) => v.date <= this.filterTo());
    if (this.filterText()) {
      const t = this.filterText().toLowerCase();
      list = list.filter(
        (v) =>
          v.numero.toLowerCase().includes(t) ||
          v.motif.toLowerCase().includes(t) ||
          (v.reference?.toLowerCase().includes(t) ?? false),
      );
    }
    return list;
  });

  readonly totalMontant = computed(() =>
    this.filtered()
      .filter((v) => v.status === 'VALIDE')
      .reduce((s, v) => s + v.montant, 0),
  );

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    const [accounts, rows] = await Promise.all([
      this.bankApi.listAccounts(),
      this.api.listInternes(),
    ]);
    this.comptes.set(accounts);
    this.virements.set(rows);
  }

  open(v: VirementInterne): void {
    this.router.navigate(['/finance/virements', v.id]);
  }

  newVirement(): void {
    this.router.navigate(['/finance/virements/new']);
  }

  reset(): void {
    this.filterStatus.set('');
    this.filterSource.set('');
    this.filterDest.set('');
    this.filterFrom.set('');
    this.filterTo.set('');
    this.filterText.set('');
  }

  format(v: number): string {
    return v.toLocaleString(this.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(this.locale);
  }

  statusVariant(s: string): string {
    return s === 'VALIDE' ? 'success' : s === 'BROUILLON' ? 'warning' : 'default';
  }

  statusLabel(s: string): string {
    const key =
      s === 'VALIDE'
        ? 'finance.common.toasts.validated'
        : s === 'BROUILLON'
          ? 'finance.declarations.status.BROUILLON'
          : 'finance.common.toasts.cancelled';
    return this.translate.instant(key);
  }
}
