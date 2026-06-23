import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { NUMBERING_SEQUENCES_COLUMNS } from './numbering-sequences-listing.config';
import type {
  NumberingSequenceItem,
  NumberingSequencePayload,
} from './numbering-sequences-api.service';
import { NumberingSequencesFacade } from './numbering-sequences.facade';
import { NumberingSequenceFormDialogComponent } from './numbering-sequence-form-dialog.component';

@Component({
  selector: 'app-numbering-sequences-listing-page',
  standalone: true,
  imports: [CommonModule, TranslateModule, NumberingSequenceFormDialogComponent],
  template: `
    <section class="numbering-page">
      <header class="numbering-page__header">
        <div>
          <h1>{{ 'administration.numberingSequences.title' | translate }}</h1>
          <p>{{ 'administration.numberingSequences.subtitle' | translate }}</p>
        </div>
        <button type="button" (click)="openCreate()">
          {{ 'administration.numberingSequences.actions.create' | translate }}
        </button>
      </header>

      <app-numbering-sequence-form-dialog
        *ngIf="formOpen()"
        [model]="editingItem()"
        [saving]="saving()"
        (saved)="onSave($event.id, $event.payload)"
        (cancelled)="closeForm()">
      </app-numbering-sequence-form-dialog>

      <p *ngIf="facade.loading()">{{ 'administration.numberingSequences.loading' | translate }}</p>
      <p *ngIf="facade.error()" class="numbering-page__error">{{ facade.error() }}</p>

      <table *ngIf="!facade.loading() && facade.hasItems()" class="numbering-page__table">
        <thead>
          <tr>
            <th *ngFor="let column of columns">{{ column.labelKey | translate }}</th>
            <th>{{ 'administration.numberingSequences.columns.actions' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of facade.items()">
            <td>{{ item.name }}</td>
            <td><code>{{ item.code }}</code></td>
            <td>{{ item.prefix || '-' }}</td>
            <td>{{ item.currentNumber }}</td>
            <td><code>{{ renderPreview(item) }}</code></td>
            <td><span class="numbering-page__badge">{{ ('administration.numberingSequences.resetPolicy.' + (item.resetPolicy || 'NEVER')) | translate }}</span></td>
            <td class="numbering-page__actions">
              <button type="button" (click)="openEdit(item)">
                {{ 'administration.numberingSequences.actions.edit' | translate }}
              </button>
              <button type="button" (click)="remove(item)">
                {{ 'administration.numberingSequences.actions.delete' | translate }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <p *ngIf="!facade.loading() && !facade.hasItems()">
        {{ 'administration.numberingSequences.empty' | translate }}
      </p>
    </section>
  `,
  styles: [
    `
      .numbering-page {
        padding: 1rem;
        display: grid;
        gap: 1rem;
      }
      .numbering-page__header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }
      .numbering-page__header h1 {
        margin: 0;
      }
      .numbering-page__header p {
        margin: 0.25rem 0 0;
        color: var(--nf-text-muted, #6b7280);
      }
      .numbering-page__table {
        width: 100%;
        border-collapse: collapse;
      }
      .numbering-page__table th,
      .numbering-page__table td {
        border-bottom: 1px solid var(--nf-border-default, #e5e7eb);
        padding: 0.5rem;
        text-align: left;
      }
      .numbering-page__actions {
        display: flex;
        gap: 0.4rem;
      }
      .numbering-page__error {
        color: var(--nf-color-danger-600, #b91c1c);
      }
      .numbering-page__badge {
        display: inline-block;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
        background: var(--nf-bg-muted, #f3f4f6);
        color: var(--nf-text-default, #374151);
      }
      code {
        font-family: var(--nf-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
      }
    `,
  ],
})
export class NumberingSequencesListingPage implements OnInit {
  readonly facade = inject(NumberingSequencesFacade);
  readonly columns = NUMBERING_SEQUENCES_COLUMNS;

  readonly formOpen = signal(false);
  readonly editingItem = signal<NumberingSequenceItem | null>(null);
  readonly saving = signal(false);

  async ngOnInit(): Promise<void> {
    await this.facade.load();
  }

  openCreate(): void {
    this.editingItem.set(null);
    this.formOpen.set(true);
  }

  openEdit(item: NumberingSequenceItem): void {
    this.editingItem.set(item);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingItem.set(null);
  }

  async onSave(id: string | null, payload: NumberingSequencePayload): Promise<void> {
    this.saving.set(true);
    try {
      await this.facade.save(payload, id);
      this.closeForm();
    } finally {
      this.saving.set(false);
    }
  }

  async remove(item: NumberingSequenceItem): Promise<void> {
    await this.facade.remove(item.id);
  }

  renderPreview(item: NumberingSequenceItem): string {
    const prefix = item.prefix ?? '';
    const sep = item.separator ?? '';
    const yearFormat = item.yearFormat ?? '';
    const padded = String(item.currentNumber).padStart(item.padLength, '0');
    const year = yearFormat ? (yearFormat.toUpperCase() === 'YY' ? String(new Date().getFullYear() % 100).padStart(2, '0') : String(new Date().getFullYear())) : '';
    let out = prefix;
    if (year) {
      if (sep) out += sep;
      out += year;
    }
    if (sep) out += sep;
    out += padded;
    return out;
  }
}
