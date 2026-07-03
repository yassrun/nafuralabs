import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, PageHeaderComponent, PageShellComponent, ToastService } from '@lib/anatomy/components';
import { ChartOfAccountApiService } from '@applications/erp/finance/services/chart-of-account-api.service';
import { JournalApiService } from '@applications/erp/finance/services/journal-api.service';
import { JournalEntryApiService } from '@applications/erp/finance/services/journal-entry-api.service';
import type { Compte, Journal, LigneEcriture } from '@applications/erp/finance/models';

interface SaisieLigne {
  ordre: number;
  compteCode: string;
  libelle: string;
  debit: number;
  credit: number;
  axeAnalytique?: string;
  tiersName?: string;
}

@Component({
  selector: 'app-ecriture-saisie',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, PageShellComponent, PageHeaderComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig">
      </nf-page-header>

      <section class="form-grid">
        <label>
          <span>{{ 'finance.ecriture.form.fields.journal' | translate }} *</span>
          <select [ngModel]="journalCode()" (ngModelChange)="journalCode.set($event)" required>
            <option value="">{{ 'finance.ecriture.saisie.selectPlaceholder' | translate }}</option>
            @for (j of journaux(); track j.id) {
              <option [value]="j.code">{{ j.code }} — {{ j.libelle }}</option>
            }
          </select>
        </label>
        <label>
          <span>{{ 'finance.ecriture.form.fields.date' | translate }} *</span>
          <input type="date" [ngModel]="date()" (ngModelChange)="date.set($event)" required />
        </label>
        <label>
          <span>{{ 'finance.ecriture.form.fields.reference' | translate }}</span>
          <input type="text" [ngModel]="reference()" (ngModelChange)="reference.set($event)"
            [attr.placeholder]="'finance.ecriture.saisie.referencePlaceholder' | translate" />
        </label>
        <label class="full">
          <span>{{ 'finance.ecriture.form.fields.libelle' | translate }} *</span>
          <input type="text" [ngModel]="libelle()" (ngModelChange)="libelle.set($event)"
            [attr.placeholder]="'finance.ecriture.saisie.libellePlaceholder' | translate" required />
        </label>
      </section>

      <section class="lignes">
        <div class="lignes__head">
          <h3>{{ 'finance.ecriture.saisie.lignesSection' | translate }}</h3>
          <nf-button variant="secondary" class="btn-secondary" (clicked)="addLigne()">{{ 'finance.ecriture.form.ligne.addLigne' | translate }}</nf-button>
        </div>
        <table>
          <thead>
            <tr>
              <th>{{ 'finance.ecriture.form.ligne.compte' | translate }}</th>
              <th>{{ 'finance.ecriture.form.ligne.libelle' | translate }}</th>
              <th>{{ 'finance.ecriture.form.ligne.tiers' | translate }}</th>
              <th>{{ 'finance.ecriture.form.ligne.axeAnalytique' | translate }}</th>
              <th class="num">{{ 'finance.ecriture.form.ligne.debit' | translate }}</th>
              <th class="num">{{ 'finance.ecriture.form.ligne.credit' | translate }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (l of lignes(); track $index; let idx = $index) {
              <tr>
                <td>
                  <input
                    list="comptes-list"
                    [ngModel]="l.compteCode"
                    (ngModelChange)="updateLigne(idx, { compteCode: $event })"
                    [attr.placeholder]="'finance.ecriture.saisie.comptePlaceholder' | translate" />
                </td>
                <td>
                  <input
                    type="text"
                    [ngModel]="l.libelle"
                    (ngModelChange)="updateLigne(idx, { libelle: $event })" />
                </td>
                <td>
                  <input
                    type="text"
                    [ngModel]="l.tiersName"
                    (ngModelChange)="updateLigne(idx, { tiersName: $event })"
                    [attr.placeholder]="'finance.common.dash' | translate" />
                </td>
                <td>
                  <input
                    type="text"
                    [ngModel]="l.axeAnalytique"
                    (ngModelChange)="updateLigne(idx, { axeAnalytique: $event })"
                    [attr.placeholder]="'finance.ecriture.saisie.axePlaceholder' | translate" />
                </td>
                <td class="num">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    [ngModel]="l.debit"
                    (ngModelChange)="updateLigne(idx, { debit: $event ?? 0, credit: 0 })" />
                </td>
                <td class="num">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    [ngModel]="l.credit"
                    (ngModelChange)="updateLigne(idx, { credit: $event ?? 0, debit: 0 })" />
                </td>
                <td>
                  <nf-button variant="primary" class="btn-icon" (clicked)="removeLigne(idx)"
                    [attr.title]="'finance.common.actions.delete' | translate">
                    ×
                  </nf-button>
                </td>
              </tr>
            }
          </tbody>
        </table>
        <datalist id="comptes-list">
          @for (c of comptes(); track c.code) {
            <option [value]="c.code">{{ c.code }} — {{ c.libelle }}</option>
          }
        </datalist>
      </section>

      <footer class="sticky">
        <div class="totals">
          <span>{{ 'finance.ecriture.list.columns.totalDebit' | translate }} : <strong>{{ formatNum(totals().debit) }}</strong></span>
          <span>{{ 'finance.ecriture.list.columns.totalCredit' | translate }} : <strong>{{ formatNum(totals().credit) }}</strong></span>
          <span [class.warn]="!totals().equilibre" [class.ok]="totals().equilibre">
            Δ = {{ formatNum(totals().delta) }}
            {{ totals().equilibre ? '✓' : '⚠' }}
          </span>
        </div>
        <div class="cta">
          <nf-button variant="ghost" class="btn-link" (clicked)="onCancel()">{{ 'finance.common.actions.cancel' | translate }}</nf-button>
          <nf-button variant="primary" class="btn-primary" (clicked)="onValider()"  [disabled]="!canSubmit()">
            {{ 'finance.common.actions.validate' | translate }}
          </nf-button>
          <nf-button variant="secondary" class="btn-secondary" (clicked)="onBrouillon()"  [disabled]="!canSubmitDraft()">
            {{ 'finance.ecriture.saisie.saveDraft' | translate }}
          </nf-button>
        </div>
      </footer>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .form-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; padding: 16px;
      background: white; border: 1px solid var(--nf-color-border); border-radius: 8px; margin-bottom: 16px;
    }
    .form-grid label { display: flex; flex-direction: column; font-size: 12px; color: var(--nf-color-text-secondary); gap: 4px; }
    .form-grid .full { grid-column: 1 / -1; }
    .form-grid input, .form-grid select { padding: 8px 10px; border: 1px solid var(--nf-color-primary-200); border-radius: 6px; font-size: 13px; }
    .lignes { background: white; border: 1px solid var(--nf-color-border); border-radius: 8px; padding: 0; margin-bottom: 76px; overflow: hidden; }
    .lignes__head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--nf-color-bg-subtle); }
    .lignes h3 { margin: 0; font-size: 14px; }
    .lignes table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .lignes th { padding: 8px 10px; background: var(--nf-color-bg-subtle); font-weight: 600; color: var(--nf-color-text-secondary); text-align: left; border-bottom: 1px solid var(--nf-color-border); }
    .lignes th.num { text-align: right; }
    .lignes td { padding: 4px 6px; border-bottom: 1px solid var(--nf-color-bg-muted); }
    .lignes input { width: 100%; padding: 6px 8px; border: 1px solid var(--nf-color-border); border-radius: 4px; font-size: 12px; }
    .lignes .num input { text-align: right; font-variant-numeric: tabular-nums; }
    .btn-icon { background: transparent; border: none; color: var(--nf-color-danger-600); font-size: 16px; cursor: pointer; padding: 4px 8px; }
    .sticky {
      position: sticky; bottom: 0; background: white; border-top: 2px solid var(--nf-color-primary-200);
      padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px;
      box-shadow: 0 -2px 8px rgba(15, 23, 42, 0.05); flex-wrap: wrap;
    }
    .totals { display: flex; gap: 24px; align-items: center; font-size: 13px; }
    .ok { color: var(--nf-color-success-600); font-weight: 600; }
    .warn { color: var(--nf-color-danger-600); font-weight: 600; }
    .cta { display: flex; gap: 12px; }
    button { padding: 8px 14px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; }
    .btn-primary { background: var(--nf-color-primary-700); color: white; }
    .btn-primary:disabled { background: var(--nf-color-primary-200); cursor: not-allowed; }
    .btn-secondary { background: var(--nf-color-text-secondary); color: white; }
    .btn-secondary:disabled { background: var(--nf-color-primary-200); cursor: not-allowed; }
    .btn-link { background: transparent; color: var(--nf-color-primary-700); }
  `],
})
export class EcritureSaisiePage {
  private readonly journalApi = inject(JournalApiService);
  private readonly accountApi = inject(ChartOfAccountApiService);
  private readonly entryApi = inject(JournalEntryApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly headerConfig = {
    title: this.translate.instant('finance.ecriture.saisie.title'),
    subtitle: this.translate.instant('finance.ecriture.saisie.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('finance.module.shortTitle'), route: '/finance/journaux' },
      { label: this.translate.instant('finance.journal.entityNamePlural'), route: '/finance/journaux' },
      { label: this.translate.instant('finance.ecriture.saisie.crumb') },
    ],
  };

  readonly journaux = signal<Journal[]>([]);
  readonly comptes = signal<Compte[]>([]);

  readonly journalCode = signal<string>('');
  readonly date = signal<string>(new Date().toISOString().slice(0, 10));
  readonly reference = signal<string>('');
  readonly libelle = signal<string>('');
  readonly lignes = signal<SaisieLigne[]>([
    { ordre: 1, compteCode: '', libelle: '', debit: 0, credit: 0 },
    { ordre: 2, compteCode: '', libelle: '', debit: 0, credit: 0 },
  ]);

  readonly totals = computed(() => {
    const debit = this.lignes().reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const credit = this.lignes().reduce((s, l) => s + (Number(l.credit) || 0), 0);
    const delta = Math.round((debit - credit) * 100) / 100;
    return { debit, credit, delta, equilibre: Math.abs(delta) < 0.01 };
  });

  readonly canSubmit = computed(() => {
    return (
      !!this.journalCode() &&
      !!this.date() &&
      !!this.libelle().trim() &&
      this.lignes().some((l) => l.compteCode && (l.debit > 0 || l.credit > 0)) &&
      this.totals().equilibre &&
      this.totals().debit > 0
    );
  });

  readonly canSubmitDraft = computed(() => {
    return !!this.journalCode() && !!this.date() && !!this.libelle().trim();
  });

  constructor() {
    void this.journalApi.listAll().then((j) => this.journaux.set(j.filter((x) => x.isActive)));
    void this.accountApi.listAll().then((c) =>
      this.comptes.set(
        c
          .filter((x) => x.isActive && x.code.length >= 4 && !x.isAuxiliaire)
          .sort((a, b) => a.code.localeCompare(b.code)),
      ),
    );
  }

  addLigne(): void {
    const ordre = this.lignes().length + 1;
    this.lignes.set([...this.lignes(), { ordre, compteCode: '', libelle: '', debit: 0, credit: 0 }]);
  }

  removeLigne(idx: number): void {
    this.lignes.set(this.lignes().filter((_, i) => i !== idx));
  }

  updateLigne(idx: number, patch: Partial<SaisieLigne>): void {
    const next = [...this.lignes()];
    next[idx] = { ...next[idx], ...patch };
    this.lignes.set(next);
  }

  onValider(): void {
    this.submit('VALIDEE');
  }

  onBrouillon(): void {
    this.submit('BROUILLON');
  }

  onCancel(): void {
    this.router.navigate(['/finance/journaux']);
  }

  private submit(status: 'BROUILLON' | 'VALIDEE'): void {
    const lignes: Omit<LigneEcriture, 'id' | 'ecritureId' | 'ordre'>[] = this.lignes()
      .filter((l) => l.compteCode && (l.debit > 0 || l.credit > 0))
      .map((l) => {
        const compte = this.comptes().find((c) => c.code === l.compteCode);
        return {
          compteCode: l.compteCode,
          compteLibelle: compte?.libelle,
          libelle: l.libelle || this.libelle(),
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          axeAnalytique: l.axeAnalytique || undefined,
          tiersName: l.tiersName || undefined,
        };
      });

    const date = this.date();
    const exercice = new Date(date).getUTCFullYear();
    const periode = new Date(date).getUTCMonth() + 1;

    const journal = this.journaux().find((j) => j.code === this.journalCode());
    if (!journal) {
      this.toast.error('Journal introuvable');
      return;
    }

    void this.entryApi
      .createWithJournal(journal.id, {
        journalCode: this.journalCode(),
        dateEcriture: date,
        exercice,
        periode,
        reference: this.reference() || undefined,
        libelle: this.libelle(),
        status,
        origine: 'MANUELLE',
        lignes: lignes.map((l, i) => ({
          ...l,
          id: '',
          ecritureId: '',
          ordre: i + 1,
        })),
      })
      .then(async (ec) => {
        const finalEc =
          status === 'VALIDEE' && ec.status === 'BROUILLON'
            ? await this.entryApi.postEntry(ec.id)
            : ec;
        const key =
          status === 'VALIDEE'
            ? 'finance.ecriture.toasts.validatedNumero'
            : 'finance.ecriture.toasts.savedNumero';
        this.toast.success(this.translate.instant(key, { numero: finalEc.numero }));
        this.router.navigate(['/finance/journaux/ecritures', finalEc.id]);
      })
      .catch((err: Error) =>
        this.toast.error(err.message ?? this.translate.instant('finance.common.toasts.error')),
      );
  }

  private readonly locale = inject(LOCALE_ID);
  private readonly formatter = new Intl.NumberFormat(this.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  formatNum(n: number): string {
    return this.formatter.format(n);
  }
}
