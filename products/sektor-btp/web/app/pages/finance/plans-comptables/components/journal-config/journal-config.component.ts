import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { JOURNAL_TYPE_KEYS } from '@applications/erp/shell/i18n-labels';
import type { Journal, JournalCreate, JournalType } from '../../models';
import { ButtonComponent } from '@lib/anatomy/components';


const ALL_TYPES: JournalType[] = [
  'VENTE',
  'ACHAT',
  'BANQUE',
  'CAISSE',
  'OPERATIONS_DIVERSES',
  'NOUVEAUX',
];

@Component({
  selector: 'app-journal-config',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="jr">
      <header class="jr__head">
        <strong>{{ 'finance.planComptable.journalConfig.title' | translate: { count: journaux.length } }}</strong>
        <nf-button variant="primary" class="jr__btn jr__btn--add" (clicked)="openCreate()">
          {{ 'finance.planComptable.journalConfig.newJournal' | translate }}
        </nf-button>
      </header>

      <table class="jr__table">
        <thead>
          <tr>
            <th>{{ 'finance.planComptable.journalConfig.cols.code' | translate }}</th>
            <th>{{ 'finance.planComptable.journalConfig.cols.libelle' | translate }}</th>
            <th>{{ 'finance.planComptable.journalConfig.cols.type' | translate }}</th>
            <th>{{ 'finance.planComptable.journalConfig.cols.contrepartie' | translate }}</th>
            <th>{{ 'finance.planComptable.journalConfig.cols.actif' | translate }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (j of journaux; track j.id) {
            @if (editingId() === j.id) {
              <tr class="jr__edit">
                <td>
                  <input type="text" [(ngModel)]="draft.code" maxlength="12" />
                </td>
                <td>
                  <input type="text" [(ngModel)]="draft.libelle" />
                </td>
                <td>
                  <select [(ngModel)]="draft.type">
                    @for (t of types; track t) {
                      <option [ngValue]="t">{{ typeLabel(t) | translate }}</option>
                    }
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    [(ngModel)]="draft.contrePartieDefautCode"
                    [attr.placeholder]="'finance.planComptable.journalConfig.contrepartiePlaceholder' | translate" />
                </td>
                <td>
                  <input type="checkbox" [(ngModel)]="draft.isActive" />
                </td>
                <td class="jr__actions">
                  <nf-button variant="primary" class="jr__btn jr__btn--save" (clicked)="save(j.id)">
                    {{ 'finance.common.actions.ok' | translate }}
                  </nf-button>
                  <nf-button variant="ghost" class="jr__btn jr__btn--ghost" (clicked)="cancel()">
                    {{ 'finance.common.actions.cancel' | translate }}
                  </nf-button>
                </td>
              </tr>
            } @else {
              <tr>
                <td><code>{{ j.code }}</code></td>
                <td>{{ j.libelle }}</td>
                <td>
                  <span class="jr__type">{{ typeLabel(j.type) | translate }}</span>
                </td>
                <td>
                  @if (j.contrePartieDefautCode) {
                    <code>{{ j.contrePartieDefautCode }}</code>
                  } @else {
                    <span class="jr__muted">{{ 'finance.common.dash' | translate }}</span>
                  }
                </td>
                <td>
                  @if (j.isActive) {
                    <span class="jr__badge jr__badge--ok">✓</span>
                  } @else {
                    <span class="jr__badge jr__badge--ko">×</span>
                  }
                </td>
                <td class="jr__actions">
                  <nf-button variant="ghost" class="jr__btn jr__btn--ghost" (clicked)="edit(j)">
                    {{ 'finance.common.actions.edit' | translate }}
                  </nf-button>
                  <nf-button variant="danger" class="jr__btn jr__btn--del" (clicked)="onDelete(j)">
                    {{ 'finance.common.actions.delete' | translate }}
                  </nf-button>
                </td>
              </tr>
            }
          }
          @if (creating()) {
            <tr class="jr__edit jr__edit--new">
              <td>
                <input
                  type="text"
                  [(ngModel)]="draft.code"
                  maxlength="12"
                  [attr.placeholder]="'finance.planComptable.journalConfig.codePlaceholder' | translate" />
              </td>
              <td>
                <input type="text" [(ngModel)]="draft.libelle" />
              </td>
              <td>
                <select [(ngModel)]="draft.type">
                  @for (t of types; track t) {
                    <option [ngValue]="t">{{ typeLabel(t) | translate }}</option>
                  }
                </select>
              </td>
              <td>
                <input
                  type="text"
                  [(ngModel)]="draft.contrePartieDefautCode"
                  [attr.placeholder]="'finance.planComptable.journalConfig.contrepartiePlaceholder' | translate" />
              </td>
              <td>
                <input type="checkbox" [(ngModel)]="draft.isActive" />
              </td>
              <td class="jr__actions">
                <nf-button variant="primary" class="jr__btn jr__btn--save" (clicked)="saveCreate()">
                  {{ 'finance.common.actions.create' | translate }}
                </nf-button>
                <nf-button variant="ghost" class="jr__btn jr__btn--ghost" (clicked)="cancel()">
                  {{ 'finance.common.actions.cancel' | translate }}
                </nf-button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .jr {
        background: var(--nf-color-surface);
        border: 1px solid var(--nf-color-border);
        border-radius: 10px;
        padding: 14px 16px;
      }
      .jr__head {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      .jr__btn {
        margin-left: auto;
        background: var(--nf-color-primary-700);
        color: var(--nf-color-surface);
        border: 0;
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 12px;
        cursor: pointer;
      }
      .jr__btn--add:hover {
        background: var(--nf-color-primary-800);
      }
      .jr__btn--save {
        background: var(--nf-color-success-600);
        margin-left: 0;
      }
      .jr__btn--save:hover {
        background: var(--nf-color-success-700);
      }
      .jr__btn--ghost {
        background: var(--nf-color-bg-muted);
        color: var(--nf-color-text-secondary);
        margin-left: 0;
      }
      .jr__btn--del {
        background: var(--nf-color-surface);
        color: var(--nf-color-danger-600);
        border: 1px solid var(--nf-color-danger-200);
        margin-left: 0;
      }
      .jr__btn--del:hover {
        background: var(--nf-color-danger-50);
      }
      .jr__actions {
        display: flex;
        gap: 6px;
        justify-content: flex-end;
        white-space: nowrap;
      }
      .jr__table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      .jr__table th {
        text-align: left;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--nf-color-text-secondary);
        font-weight: 600;
        padding: 8px;
        background: var(--nf-color-bg-subtle);
        border-bottom: 1px solid var(--nf-color-border);
      }
      .jr__table td {
        padding: 8px;
        border-bottom: 1px solid var(--nf-color-bg-muted);
        vertical-align: middle;
      }
      .jr__table code {
        background: var(--nf-color-primary-50);
        color: var(--nf-color-primary-700);
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
      }
      .jr__table input,
      .jr__table select {
        padding: 5px 8px;
        border: 1px solid var(--nf-color-primary-200);
        border-radius: 4px;
        font-size: 13px;
        width: 100%;
      }
      .jr__type {
        background: var(--nf-color-bg-muted);
        color: var(--nf-text-primary);
        padding: 2px 8px;
        font-size: 11px;
        border-radius: 999px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-weight: 600;
      }
      .jr__badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 999px;
        font-weight: bold;
        font-size: 12px;
      }
      .jr__badge--ok {
        background: var(--nf-color-success-100);
        color: var(--nf-color-success-800);
      }
      .jr__badge--ko {
        background: var(--nf-color-danger-100);
        color: var(--nf-color-danger-800);
      }
      .jr__muted {
        color: var(--nf-color-text-muted);
      }
      .jr__edit--new {
        background: var(--nf-color-primary-50);
      }
    `,
  ],
})
export class JournalConfigComponent {
  @Input() journaux: Journal[] = [];

  readonly types = ALL_TYPES;

  readonly editingId = signal<string | null>(null);
  readonly creating = signal<boolean>(false);

  draft: JournalCreate = {
    code: '',
    libelle: '',
    type: 'OPERATIONS_DIVERSES',
    contrePartieDefautCode: '',
    isActive: true,
  };

  @Output() readonly created = new EventEmitter<JournalCreate>();
  @Output() readonly updated = new EventEmitter<{
    id: string;
    patch: Partial<Journal>;
  }>();
  @Output() readonly deleted = new EventEmitter<Journal>();

  typeLabel(t: JournalType): string {
    return JOURNAL_TYPE_KEYS[t] ?? t;
  }

  openCreate(): void {
    this.draft = {
      code: '',
      libelle: '',
      type: 'OPERATIONS_DIVERSES',
      contrePartieDefautCode: '',
      isActive: true,
    };
    this.editingId.set(null);
    this.creating.set(true);
  }

  edit(j: Journal): void {
    this.creating.set(false);
    this.editingId.set(j.id);
    this.draft = { ...j };
  }

  cancel(): void {
    this.editingId.set(null);
    this.creating.set(false);
  }

  save(id: string): void {
    if (!this.draft.code.trim() || !this.draft.libelle.trim()) return;
    this.updated.emit({
      id,
      patch: {
        code: this.draft.code,
        libelle: this.draft.libelle,
        type: this.draft.type,
        contrePartieDefautCode: this.draft.contrePartieDefautCode,
        isActive: this.draft.isActive,
      },
    });
    this.editingId.set(null);
  }

  saveCreate(): void {
    if (!this.draft.code.trim() || !this.draft.libelle.trim()) return;
    this.created.emit({ ...this.draft });
    this.creating.set(false);
  }

  onDelete(j: Journal): void {
    this.deleted.emit(j);
  }
}
