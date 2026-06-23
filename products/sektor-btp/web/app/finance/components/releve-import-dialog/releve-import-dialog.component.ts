import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import type { RapprochementLigneReleve } from '../../models';
import { RapprochementOfxService } from '../../services/rapprochement-ofx.service';
import { ButtonComponent } from '@lib/anatomy/components';


interface ParsedRow {
  date: string;
  libelle: string;
  reference?: string;
  recette: number;
  depense: number;
  __valid: boolean;
  __error?: string;
}

/**
 * Parser CSV simple — supporte délimiteurs , et ; — colonnes attendues :
 *   Date, Libellé, Référence, Crédit (recette), Débit (dépense)
 *
 * Formats date acceptés : YYYY-MM-DD ou DD/MM/YYYY.
 */
function parseCSV(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const sep = lines[0].includes(';') ? ';' : ',';
  const header = lines[0].split(sep).map((h) => h.trim().toLowerCase());

  const idx = {
    date: header.findIndex((h) => h.includes('date')),
    libelle: header.findIndex((h) => h.includes('libell') || h.includes('label') || h.includes('description')),
    reference: header.findIndex((h) => h.includes('ref') || h.includes('pi')),
    credit: header.findIndex((h) => h.includes('cred') || h.includes('recette') || h.includes('encaiss')),
    debit: header.findIndex((h) => h.includes('deb') || h.includes('depense') || h.includes('décaiss')),
    montant: header.findIndex((h) => h === 'montant' || h.includes('amount')),
  };

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));
    const dateRaw = idx.date >= 0 ? cols[idx.date] : '';
    const libelle = idx.libelle >= 0 ? cols[idx.libelle] : cols[1] || `Ligne ${i}`;
    const reference = idx.reference >= 0 ? cols[idx.reference] : '';
    const creditStr = idx.credit >= 0 ? cols[idx.credit] : '';
    const debitStr = idx.debit >= 0 ? cols[idx.debit] : '';
    const montantStr = idx.montant >= 0 ? cols[idx.montant] : '';

    const date = normaliseDate(dateRaw);
    let recette = 0;
    let depense = 0;
    if (montantStr) {
      const m = parseAmount(montantStr);
      if (m >= 0) recette = m;
      else depense = -m;
    } else {
      recette = parseAmount(creditStr || '0');
      depense = parseAmount(debitStr || '0');
    }

    const valid = !!date && (recette > 0 || depense > 0) && !!libelle;
    rows.push({
      date,
      libelle,
      reference: reference || undefined,
      recette,
      depense,
      __valid: valid,
      __error: !date ? 'Date invalide' : !libelle ? 'Libellé manquant' : (recette === 0 && depense === 0) ? 'Aucun montant' : undefined,
    });
  }
  return rows;
}

function normaliseDate(d: string): string {
  if (!d) return '';
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  // DD/MM/YYYY
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // DD-MM-YYYY
  const m2 = /^(\d{2})-(\d{2})-(\d{4})$/.exec(d);
  if (m2) return `${m2[3]}-${m2[2]}-${m2[1]}`;
  return '';
}

function parseAmount(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

@Component({
  selector: 'app-releve-import-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rid">
      <header class="rid__head">
        <h2>{{ 'finance.import.dialog.title' | translate }}</h2>
        <nf-button variant="primary" class="rid__close" (clicked)="cancel.emit()">{{ 'finance.common.actions.close' | translate }}</nf-button>
      </header>

      <div class="rid__body">
        @if (!rows().length) {
          <div class="rid__upload">
            <label class="rid__upload-zone">
              <input
                type="file"
                accept=".csv,.txt,.ofx,.qfx"
                (change)="onFileChange($event)"
                hidden
              />
              <div class="rid__upload-icon">📥</div>
              <div class="rid__upload-text">
                {{ 'finance.import.dialog.uploadText' | translate }}
              </div>
              <div class="rid__upload-hint">
                {{ 'finance.import.dialog.uploadHint' | translate }}
              </div>
            </label>

            <div class="rid__paste">
              <label class="rid__paste-label">{{ 'finance.import.dialog.pasteLabel' | translate }}</label>
              <textarea
                [ngModel]="rawText()"
                (ngModelChange)="rawText.set($event)"
                rows="6"
                [attr.placeholder]="'finance.import.dialog.pastePlaceholder' | translate"
                class="rid__paste-input"
              ></textarea>
              <nf-button variant="primary" class="rid__btn" (clicked)="parseText()"  [disabled]="!rawText().trim()">
                {{ 'finance.import.dialog.analyze' | translate }}
              </nf-button>
            </div>
          </div>
        } @else {
          <div class="rid__preview">
            <div class="rid__preview-head">
              <span class="rid__count">
                <strong>{{ validRows().length }}</strong> {{ 'finance.import.dialog.validLines' | translate }}
                @if (invalidRows().length > 0) {
                  · <span class="rid__count--err">{{ 'finance.import.dialog.errorLines' | translate: { count: invalidRows().length } }}</span>
                }
              </span>
              <nf-button variant="ghost" class="rid__btn rid__btn--ghost" (clicked)="reset()">
                {{ 'finance.import.dialog.restart' | translate }}
              </nf-button>
            </div>
            <div class="rid__table-wrap">
              <table class="rid__table">
                <thead>
                  <tr>
                    <th>{{ 'finance.import.releve.headers.date' | translate }}</th>
                    <th>{{ 'finance.import.releve.headers.libelle' | translate }}</th>
                    <th>{{ 'finance.import.dialog.refShort' | translate }}</th>
                    <th class="rid__th-num">{{ 'finance.import.releve.headers.credit' | translate }}</th>
                    <th class="rid__th-num">{{ 'finance.import.releve.headers.debit' | translate }}</th>
                    <th>{{ 'finance.common.filters.status' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of rows(); track $index) {
                    <tr [class.rid__row--invalid]="!r.__valid">
                      <td>{{ r.date || ('finance.common.dash' | translate) }}</td>
                      <td>{{ r.libelle }}</td>
                      <td>{{ r.reference || ('finance.common.dash' | translate) }}</td>
                      <td class="rid__td-num">
                        @if (r.recette > 0) {
                          {{ format(r.recette) }}
                        } @else {
                          {{ 'finance.common.dash' | translate }}
                        }
                      </td>
                      <td class="rid__td-num">
                        @if (r.depense > 0) {
                          {{ format(r.depense) }}
                        } @else {
                          {{ 'finance.common.dash' | translate }}
                        }
                      </td>
                      <td>
                        @if (r.__valid) {
                          <span class="rid__ok">✓</span>
                        } @else {
                          <span class="rid__err">✕ {{ r.__error }}</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </div>

      <footer class="rid__foot">
        <nf-button variant="ghost" class="rid__btn rid__btn--ghost" (clicked)="cancel.emit()">
          {{ 'finance.common.actions.cancel' | translate }}
        </nf-button>
        <nf-button variant="primary" class="rid__btn" (clicked)="confirmImport()"  [disabled]="validRows().length === 0">
          {{ 'finance.import.dialog.importCount' | translate: { count: validRows().length } }}
        </nf-button>
      </footer>
    </div>
  `,
  styles: [
    `
      .rid {
        display: flex;
        flex-direction: column;
        background: var(--nf-color-surface);
        border-radius: 12px;
        max-height: 85vh;
        width: 760px;
        max-width: 95vw;
        overflow: hidden;
      }
      .rid__head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 18px;
        border-bottom: 1px solid var(--nf-color-border);
      }
      .rid__head h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--nf-text-primary);
      }
      .rid__close {
        background: transparent;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: var(--nf-color-text-secondary);
        width: 32px;
        height: 32px;
        border-radius: 4px;
      }
      .rid__close:hover {
        background: var(--nf-color-bg-muted);
        color: var(--nf-text-primary);
      }
      .rid__body {
        flex: 1;
        overflow-y: auto;
        padding: 18px;
      }
      .rid__upload {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }
      .rid__upload-zone {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 36px 24px;
        border: 2px dashed var(--nf-color-border);
        border-radius: 10px;
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
      }
      .rid__upload-zone:hover {
        border-color: var(--nf-color-primary-600);
        background: var(--nf-color-primary-50);
      }
      .rid__upload-icon {
        font-size: 36px;
      }
      .rid__upload-text {
        font-weight: 600;
        color: var(--nf-text-primary);
      }
      .rid__upload-hint {
        font-size: 12px;
        color: var(--nf-color-text-secondary);
      }
      .rid__paste {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .rid__paste-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--nf-color-text-secondary);
      }
      .rid__paste-input {
        width: 100%;
        padding: 10px 12px;
        border-radius: 6px;
        border: 1px solid var(--nf-color-border);
        font-family: ui-monospace, SF Mono, Menlo, monospace;
        font-size: 12px;
        resize: vertical;
      }
      .rid__btn {
        padding: 8px 16px;
        border-radius: 6px;
        background: var(--nf-color-primary-600);
        color: white;
        border: none;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        align-self: flex-start;
      }
      .rid__btn:disabled {
        background: var(--nf-color-border);
        cursor: not-allowed;
      }
      .rid__btn:hover:not(:disabled) {
        background: var(--nf-color-primary-700);
      }
      .rid__btn--ghost {
        background: transparent;
        color: var(--nf-color-text-secondary);
        border: 1px solid var(--nf-color-border);
      }
      .rid__btn--ghost:hover:not(:disabled) {
        background: var(--nf-color-bg-subtle);
      }
      .rid__preview {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .rid__preview-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .rid__count strong {
        color: var(--nf-color-success-700);
      }
      .rid__count--err {
        color: var(--nf-color-danger-700);
      }
      .rid__table-wrap {
        max-height: 360px;
        overflow-y: auto;
        border: 1px solid var(--nf-color-border);
        border-radius: 6px;
      }
      .rid__table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }
      .rid__table th {
        position: sticky;
        top: 0;
        background: var(--nf-color-bg-subtle);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--nf-color-text-secondary);
        padding: 8px 10px;
        text-align: left;
        border-bottom: 1px solid var(--nf-color-border);
      }
      .rid__th-num {
        text-align: right;
      }
      .rid__table td {
        padding: 6px 10px;
        border-bottom: 1px solid var(--nf-color-bg-muted);
        color: var(--nf-color-text-primary);
      }
      .rid__td-num {
        text-align: right;
        font-variant-numeric: tabular-nums;
        font-weight: 500;
      }
      .rid__row--invalid {
        background: var(--nf-color-danger-50);
      }
      .rid__ok {
        color: var(--nf-color-success-700);
        font-weight: 700;
      }
      .rid__err {
        color: var(--nf-color-danger-700);
        font-size: 11px;
      }
      .rid__foot {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 14px 18px;
        border-top: 1px solid var(--nf-color-border);
        background: var(--nf-color-bg-subtle);
      }
    `,
  ],
})
export class ReleveImportDialogComponent {
  private readonly ofx = inject(RapprochementOfxService);
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LOCALE_ID);

  readonly imported = output<RapprochementLigneReleve[]>();
  readonly cancel = output<void>();

  protected readonly rawText = signal<string>('');
  protected readonly rows = signal<ParsedRow[]>([]);

  readonly validRows = computed(() => this.rows().filter((r) => r.__valid));
  readonly invalidRows = computed(() => this.rows().filter((r) => !r.__valid));

  private translateError(err?: string): string | undefined {
    if (!err) return err;
    const map: Record<string, string> = {
      'Date invalide': 'finance.import.releve.errors.invalidDate',
      'Libellé manquant': 'finance.import.dialog.errors.missingLibelle',
      'Aucun montant': 'finance.import.dialog.errors.noAmount',
    };
    return map[err] ? this.translate.instant(map[err]) : err;
  }

  onFileChange(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const txt = String(reader.result ?? '');
      this.rawText.set(txt);
      const name = (file.name ?? '').toLowerCase();
      if (name.endsWith('.ofx') || name.endsWith('.qfx')) {
        const parsed = this.ofx.parseOfx(txt);
        const mapped: ParsedRow[] = parsed.map((r) => ({
          date: r.date,
          libelle: r.libelle,
          reference: r.reference,
          recette: r.recette,
          depense: r.depense,
          __valid: true,
        }));
        this.rows.set(mapped);
      } else {
        this.rows.set(parseCSV(txt));
      }
    };
    reader.readAsText(file);
  }

  parseText(): void {
    const t = this.rawText();
    if (t.includes('<OFX') || t.includes('OFXHEADER')) {
      const parsed = this.ofx.parseOfx(t);
      this.rows.set(
        parsed.map((r) => ({
          date: r.date,
          libelle: r.libelle,
          reference: r.reference,
          recette: r.recette,
          depense: r.depense,
          __valid: true,
        })),
      );
    } else {
      this.rows.set(parseCSV(t));
    }
  }

  reset(): void {
    this.rows.set([]);
    this.rawText.set('');
  }

  confirmImport(): void {
    const rows = this.validRows();
    const stamp = Date.now();
    const lignes: RapprochementLigneReleve[] = rows.map((r, idx) => ({
      id: `releve-${stamp}-${idx + 1}`,
      rapprochementId: '',
      date: r.date,
      libelle: r.libelle,
      reference: r.reference,
      recette: r.recette,
      depense: r.depense,
    }));
    this.imported.emit(lignes);
  }

  format(v: number): string {
    return v.toLocaleString(this.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
