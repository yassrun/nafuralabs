import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  NumberingSequenceItem,
  NumberingSequencePayload,
  NumberingSequencesApiService,
} from './numbering-sequences-api.service';

@Component({
  selector: 'app-numbering-sequence-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="numbering-dialog">
      <h3>
        {{
          modelId()
            ? ('administration.numberingSequences.dialog.editTitle' | translate)
            : ('administration.numberingSequences.dialog.createTitle' | translate)
        }}
      </h3>

      <div class="numbering-dialog__grid">
        <label>
          {{ 'administration.numberingSequences.fields.name' | translate }}
          <input [(ngModel)]="name" (ngModelChange)="queuePreview()" />
        </label>

        <label>
          {{ 'administration.numberingSequences.fields.code' | translate }}
          <input [(ngModel)]="code" [disabled]="!!modelId()" />
        </label>

        <label>
          {{ 'administration.numberingSequences.fields.prefix' | translate }}
          <input [(ngModel)]="prefix" (ngModelChange)="queuePreview()" />
        </label>

        <label>
          {{ 'administration.numberingSequences.fields.separator' | translate }}
          <select [(ngModel)]="separator" (ngModelChange)="queuePreview()">
            <option [ngValue]="null">{{ 'common.none' | translate }}</option>
            <option [ngValue]="'-'">-</option>
            <option [ngValue]="'/'">/</option>
            <option [ngValue]="'.'">.</option>
          </select>
        </label>

        <label>
          {{ 'administration.numberingSequences.fields.yearFormat' | translate }}
          <select [(ngModel)]="yearFormat" (ngModelChange)="queuePreview()">
            <option [ngValue]="null">{{ 'common.none' | translate }}</option>
            <option [ngValue]="'YYYY'">YYYY</option>
            <option [ngValue]="'YY'">YY</option>
          </select>
        </label>

        <label>
          {{ 'administration.numberingSequences.fields.padLength' | translate }}
          <input type="number" [(ngModel)]="padLength" (ngModelChange)="queuePreview()" />
        </label>

        <label>
          {{ 'administration.numberingSequences.fields.incrementBy' | translate }}
          <input type="number" [(ngModel)]="incrementBy" />
        </label>

        <label>
          {{
            modelId()
              ? ('administration.numberingSequences.fields.currentNumber' | translate)
              : ('administration.numberingSequences.fields.startingNumber' | translate)
          }}
          <input type="number" [(ngModel)]="currentNumber" (ngModelChange)="queuePreview()" />
        </label>

        <label>
          {{ 'administration.numberingSequences.fields.resetPolicy' | translate }}
          <select [(ngModel)]="resetPolicy">
            <option value="NEVER">{{ 'administration.numberingSequences.reset.never' | translate }}</option>
            <option value="YEARLY">{{ 'administration.numberingSequences.reset.yearly' | translate }}</option>
            <option value="MONTHLY">{{ 'administration.numberingSequences.reset.monthly' | translate }}</option>
          </select>
        </label>
      </div>

      <div class="numbering-dialog__preview">
        <strong>{{ 'administration.numberingSequences.preview' | translate }}:</strong> <code>{{ preview() || '-' }}</code>
      </div>

      <div class="numbering-dialog__actions">
        <button type="button" (click)="cancelled.emit()">
          {{ 'common.actions.cancel' | translate }}
        </button>
        <button
          type="button"
          [disabled]="!canSubmit() || saving()"
          (click)="submit()">
          {{
            saving()
              ? ('administration.numberingSequences.saving' | translate)
              : ('common.actions.save' | translate)
          }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .numbering-dialog {
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 12px;
        padding: 1rem;
        display: grid;
        gap: 0.75rem;
      }
      .numbering-dialog__grid {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }
      .numbering-dialog label {
        display: grid;
        gap: 0.35rem;
      }
      .numbering-dialog__preview {
        border: 1px dashed var(--nf-border-default, #d1d5db);
        border-radius: 8px;
        padding: 0.5rem;
      }
      .numbering-dialog__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }
      code {
        font-family: var(--nf-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
      }
    `,
  ],
})
export class NumberingSequenceFormDialogComponent {
  private readonly api = inject(NumberingSequencesApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly previewRequest$ = new Subject<void>();

  readonly model = input<NumberingSequenceItem | null>(null);
  readonly saving = input(false);

  readonly saved = output<{ id: string | null; payload: NumberingSequencePayload }>();
  readonly cancelled = output<void>();

  readonly modelId = signal<string | null>(null);
  readonly preview = signal('');

  name = '';
  code = '';
  prefix = '';
  separator: string | null = '-';
  yearFormat: string | null = 'YYYY';
  resetPolicy = 'YEARLY';
  padLength = 4;
  incrementBy = 1;
  currentNumber = 1;

  constructor() {
    effect(() => {
      const model = this.model();
      if (!model) {
        this.modelId.set(null);
        this.name = '';
        this.code = '';
        this.prefix = '';
        this.separator = '-';
        this.yearFormat = 'YYYY';
        this.resetPolicy = 'YEARLY';
        this.padLength = 4;
        this.incrementBy = 1;
        this.currentNumber = 1;
      } else {
        this.modelId.set(model.id);
        this.name = model.name;
        this.code = model.code;
        this.prefix = model.prefix ?? '';
        this.separator = model.separator;
        this.yearFormat = model.yearFormat;
        this.resetPolicy = model.resetPolicy ?? 'YEARLY';
        this.padLength = model.padLength;
        this.incrementBy = model.incrementBy;
        this.currentNumber = model.currentNumber;
      }
      this.queuePreview();
    });

    this.previewRequest$
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        void this.refreshPreview();
      });
  }

  canSubmit(): boolean {
    return this.name.trim().length > 0 && this.code.trim().length > 0;
  }

  queuePreview(): void {
    this.previewRequest$.next();
  }

  async refreshPreview(): Promise<void> {
    if (!this.prefix.trim()) {
      this.preview.set('');
      return;
    }
    try {
      const result = await this.api.preview({
        prefix: this.prefix.trim(),
        separator: this.separator,
        yearFormat: this.yearFormat,
        padLength: this.padLength,
        currentNumber: this.currentNumber,
      });
      this.preview.set(result);
    } catch {
      this.preview.set('');
    }
  }

  submit(): void {
    const payload: NumberingSequencePayload = {
      code: this.code.trim(),
      name: this.name.trim(),
      prefix: this.prefix.trim() || null,
      separator: this.separator,
      yearFormat: this.yearFormat,
      resetPolicy: this.resetPolicy,
      currentNumber: this.currentNumber,
      incrementBy: this.incrementBy,
      padLength: this.padLength,
    };
    this.saved.emit({ id: this.modelId(), payload });
  }
}
