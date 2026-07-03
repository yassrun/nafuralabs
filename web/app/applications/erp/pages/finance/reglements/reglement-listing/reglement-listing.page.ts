import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  LOCALE_ID,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { BankReconciliationApiService } from '@applications/erp/finance/services/bank-reconciliation-api.service';
import { ContrePartieLookupService } from '@applications/erp/finance/services/contre-partie-lookup.service';
import { ReglementApiService } from '@applications/erp/finance/services/reglement-api.service';
import { MODE_KEYS } from '@applications/erp/shell/i18n-labels';
import type {
  CompteFinancier,
  ContrePartie,
  Reglement,
  ReglementStatus,
  ReglementType,
} from '@applications/erp/finance/models';
import { ButtonComponent } from '@lib/anatomy/components';

@Component({
  selector: 'app-reglement-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reglement-listing.page.html',
  styleUrl: './reglement-listing.page.scss',
})
export class ReglementListingPage implements OnInit {
  private readonly bankApi = inject(BankReconciliationApiService);
  private readonly contrePartieLookup = inject(ContrePartieLookupService);
  private readonly reglementApi = inject(ReglementApiService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LOCALE_ID);

  readonly comptes = signal<CompteFinancier[]>([]);
  readonly contreParties = signal<ContrePartie[]>([]);
  readonly reglements = signal<Reglement[]>([]);
  readonly loading = signal(true);

  // Filters
  protected readonly filterType = signal<ReglementType | ''>('');
  protected readonly filterStatus = signal<ReglementStatus | ''>('');
  protected readonly filterMode = signal<string>('');
  protected readonly filterCompte = signal<string>('');
  protected readonly filterContrePartie = signal<string>('');
  protected readonly filterFrom = signal<string>('');
  protected readonly filterTo = signal<string>('');
  protected readonly filterText = signal<string>('');

  // Quick chips
  protected readonly chipActive = signal<'today' | 'week' | 'month' | 'drafts' | null>(null);

  readonly contrePartiesForFilter = computed(() => {
    const type = this.filterType();
    if (!type) return this.contreParties();
    return this.contreParties().filter((cp) => cp.type === type);
  });

  readonly filtered = computed(() => {
    let list = [...this.reglements()].sort((a, b) => (a.date < b.date ? 1 : -1));
    if (this.filterType()) list = list.filter((r) => r.type === this.filterType());
    if (this.filterStatus()) list = list.filter((r) => r.status === this.filterStatus());
    if (this.filterMode()) list = list.filter((r) => r.modePaiement === this.filterMode());
    if (this.filterCompte()) list = list.filter((r) => r.compteFinancierId === this.filterCompte());
    if (this.filterContrePartie()) {
      list = list.filter((r) => r.contrePartieId === this.filterContrePartie());
    }
    if (this.filterFrom()) list = list.filter((r) => r.date >= this.filterFrom());
    if (this.filterTo()) list = list.filter((r) => r.date <= this.filterTo());
    if (this.filterText()) {
      const t = this.filterText().toLowerCase();
      list = list.filter(
        (r) =>
          r.numero.toLowerCase().includes(t) ||
          (r.reference?.toLowerCase().includes(t) ?? false) ||
          r.contrePartieName?.toLowerCase().includes(t),
      );
    }
    return list;
  });

  readonly totalEncaisse = computed(() =>
    this.filtered()
      .filter((r) => r.type === 'CLIENT' && r.status === 'VALIDE')
      .reduce((s, r) => s + r.montantTotal, 0),
  );

  readonly totalDecaisse = computed(() =>
    this.filtered()
      .filter((r) => r.type !== 'CLIENT' && r.status === 'VALIDE')
      .reduce((s, r) => s + r.montantTotal, 0),
  );

  ngOnInit(): void {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const [rows, accounts, contreParties] = await Promise.all([
        this.reglementApi.listAll(),
        this.bankApi.listAccounts(),
        this.contrePartieLookup.listAllForFilter(),
      ]);
      this.reglements.set(rows);
      this.comptes.set(accounts);
      this.contreParties.set(contreParties);
    } finally {
      this.loading.set(false);
    }
  }

  applyChip(chip: 'today' | 'week' | 'month' | 'drafts'): void {
    this.chipActive.set(this.chipActive() === chip ? null : chip);
    const today = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    if (this.chipActive() === null) {
      this.filterFrom.set('');
      this.filterTo.set('');
      this.filterStatus.set('');
      return;
    }
    if (chip === 'today') {
      this.filterFrom.set(iso(today));
      this.filterTo.set(iso(today));
      this.filterStatus.set('');
    } else if (chip === 'week') {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay() + 1);
      this.filterFrom.set(iso(start));
      this.filterTo.set(iso(today));
      this.filterStatus.set('');
    } else if (chip === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      this.filterFrom.set(iso(start));
      this.filterTo.set(iso(today));
      this.filterStatus.set('');
    } else if (chip === 'drafts') {
      this.filterStatus.set('BROUILLON');
      this.filterFrom.set('');
      this.filterTo.set('');
    }
  }

  reset(): void {
    this.filterType.set('');
    this.filterStatus.set('');
    this.filterMode.set('');
    this.filterCompte.set('');
    this.filterContrePartie.set('');
    this.filterFrom.set('');
    this.filterTo.set('');
    this.filterText.set('');
    this.chipActive.set(null);
  }

  open(r: Reglement): void {
    this.router.navigate(['/finance/reglements', r.id]);
  }

  newReglement(type: ReglementType): void {
    this.router.navigate(['/finance/reglements/new'], { queryParams: { type } });
  }

  format(v: number): string {
    return v.toLocaleString(this.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(d: string): string {
    if (!d) return this.translate.instant('finance.common.dash');
    return new Date(d).toLocaleDateString(this.locale);
  }

  modeLabel(m: string): string {
    const key = MODE_KEYS[m as keyof typeof MODE_KEYS];
    if (!key) return m;
    const translated = this.translate.instant(key);
    return translated === key ? m : translated;
  }

  typeLabel(t: ReglementType): string {
    const key =
      t === 'CLIENT'
        ? 'finance.recouvrement.headers.client'
        : t === 'FOURNISSEUR'
          ? 'finance.factureFournisseur.form.fields.fournisseur'
          : 'finance.ecriture.form.fields.tiers';
    return this.translate.instant(key);
  }

  contrePartieFilterLabel(cp: ContrePartie): string {
    const kind = this.typeLabel(cp.type as ReglementType);
    return `${cp.name} (${kind})`;
  }

  typeIcon(t: ReglementType): string {
    return t === 'CLIENT' ? '💰' : t === 'FOURNISSEUR' ? '💸' : '👥';
  }

  statusLabel(s: ReglementStatus): string {
    const key =
      s === 'VALIDE'
        ? 'finance.common.toasts.validated'
        : s === 'BROUILLON'
          ? 'finance.declarations.status.BROUILLON'
          : 'finance.common.toasts.cancelled';
    return this.translate.instant(key);
  }

  statusVariant(s: ReglementStatus): string {
    return s === 'VALIDE' ? 'success' : s === 'BROUILLON' ? 'warning' : 'default';
  }
}
