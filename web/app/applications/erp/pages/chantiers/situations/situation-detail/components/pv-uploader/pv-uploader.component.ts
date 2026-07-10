import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';

import type { SituationDocument } from '@applications/erp/chantiers/models';
import { DateLocalizedPipe } from '@lib/anatomy/pipes';
import { ButtonComponent } from '@lib/anatomy';
import { safeRandomUUID } from '@core/util/uuid';

@Component({
  selector: 'app-pv-uploader',
  standalone: true,
  imports: [CommonModule, DateLocalizedPipe, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pvu" [class.pvu--readonly]="readonly">
      @if (currentDoc()) {
        <div class="pvu__file">
          <span class="pvu__icon">📄</span>
          <a class="pvu__name" [href]="currentDoc()!.url" target="_blank" rel="noopener">
            {{ currentDoc()!.name }}
          </a>
          <span class="pvu__date">
            uploadé le
            {{ currentDoc()!.uploadedAt | dateLocalized: 'shortDate' }}
          </span>
          @if (!readonly) {
            <nf-button variant="ghost" class="pvu__btn" (clicked)="remove()">
              Retirer
            </nf-button>
          }
        </div>
      } @else {
        <label class="pvu__drop" [class.pvu__drop--disabled]="readonly">
          <input
            type="file"
            accept="application/pdf,image/*"
            [disabled]="readonly"
            (change)="onFileSelected($event)" />
          <span class="pvu__drop-icon">⬆</span>
          <span class="pvu__drop-text">
            Déposer le PV signé du MOA (PDF / image)
          </span>
        </label>
      }
    </div>
  `,
  styles: [
    `
      .pvu {
        display: block;
        font-size: 13px;

        &__file {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: var(--nf-color-success-50, #f0fdf4);
          border: 1px solid var(--nf-color-success-200, #bbf7d0);
          border-radius: 6px;
        }

        &__icon {
          font-size: 18px;
        }

        &__name {
          font-weight: 600;
          color: var(--nf-color-success-700);
          text-decoration: none;
          flex: 1;

          &:hover {
            text-decoration: underline;
          }
        }

        &__date {
          font-size: 12px;
          color: var(--nf-color-text-secondary);
        }

        &__btn {
          flex-shrink: 0;
        }

        &__drop {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 24px;
          border: 2px dashed var(--nf-color-border);
          border-radius: 8px;
          background: var(--nf-color-bg-subtle);
          color: var(--nf-color-text-secondary);
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;

          input {
            display: none;
          }

          &:hover:not(.pvu__drop--disabled) {
            border-color: var(--nf-color-primary-500);
            background: var(--nf-color-primary-50);
          }

          &--disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        }

        &__drop-icon {
          font-size: 22px;
        }

        &__drop-text {
          font-size: 13px;
          font-weight: 500;
        }
      }
    `,
  ],
})
export class PvUploaderComponent {
  private _doc = signal<SituationDocument | null>(null);
  private _readonly = false;

  @Input() set doc(value: SituationDocument | null | undefined) {
    this._doc.set(value ?? null);
  }
  @Input() set readonly(value: boolean) {
    this._readonly = value;
  }
  get readonly(): boolean {
    return this._readonly;
  }

  @Output() readonly docChange = new EventEmitter<SituationDocument | null>();

  readonly currentDoc = this._doc.asReadonly();

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const doc: SituationDocument = {
      id: safeRandomUUID(),
      name: file.name,
      url,
      uploadedAt: new Date().toISOString(),
    };
    this._doc.set(doc);
    this.docChange.emit(doc);
    input.value = '';
  }

  remove(): void {
    this._doc.set(null);
    this.docChange.emit(null);
  }
}
