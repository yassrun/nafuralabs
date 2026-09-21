import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { ButtonComponent, type ButtonSize } from '../../atoms/button';
import type {
  FileSlotDensity,
  FileSlotFileEvent,
  FileSlotIdEvent,
  FileSlotModel,
} from './file-slot.types';

/**
 * Typed document slot: empty = dashed drop zone; filled = file + replace/delete.
 * Extract (IA) is optional and only rendered when `slot.extract` is set.
 */
@Component({
  selector: 'nf-file-slot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, LucideAngularModule],
  template: `
    <div
      class="nf-file-slot"
      [class.nf-file-slot--filled]="filled()"
      [class.nf-file-slot--over]="over()"
      [class.nf-file-slot--busy]="slot().busy"
      [class.nf-file-slot--required]="slot().required && !filled()"
      [class.nf-file-slot--compact]="density() === 'compact'"
      [class.nf-file-slot--locked]="slot().locked"
      [class.nf-file-slot--readonly]="readonly()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      <div class="nf-file-slot__head">
        <span class="nf-file-slot__type">{{ slot().type }}</span>
        @if (slot().required) {
          <span class="nf-file-slot__flag">Requis</span>
        } @else {
          <span class="nf-file-slot__flag">Optionnel</span>
        }
        @if (slot().hint) {
          <span class="nf-file-slot__hint">{{ slot().hint }}</span>
        }
      </div>

      @if (slot().label) {
        @if (density() === 'comfortable') {
          <h4 class="nf-file-slot__label">{{ slot().label }}</h4>
        } @else {
          <span class="nf-file-slot__label nf-file-slot__label--inline">{{ slot().label }}</span>
        }
      }

      @if (filled()) {
        <div class="nf-file-slot__file">
          <lucide-icon name="file-text" [size]="16" aria-hidden="true"></lucide-icon>
          <button
            type="button"
            class="nf-file-slot__name"
            data-testid="ouvrir-document"
            [disabled]="!!slot().opening"
            [attr.aria-busy]="slot().opening ? 'true' : null"
            [attr.title]="'Ouvrir ' + (slot().fileName || 'le document')"
            (click)="open.emit({ slotId: slot().id })"
          >
            {{ slot().opening ? 'Ouverture…' : slot().fileName || slot().fileId }}
          </button>
        </div>

        <div class="nf-file-slot__actions">
          @if (extractConfig(); as ex) {
            <nf-button
              type="button"
              class="nf-file-slot__extract"
              [variant]="ex.variant ?? 'primary'"
              [size]="btnSize()"
              [icon]="ex.icon ?? 'sparkles'"
              iconLibrary="lucide"
              [disabled]="ex.disabled || !!slot().busy"
              [loading]="!!ex.loading"
              (clicked)="extract.emit({ slotId: slot().id })"
            >
              {{ ex.label }}
            </nf-button>
          }

          @if (!readonly() && !slot().locked) {
            <label class="nf-file-slot__replace">
              <span>{{ slot().busy ? 'Remplacement…' : 'Remplacer' }}</span>
              <input
                type="file"
                [accept]="accept()"
                [disabled]="!!slot().busy"
                (change)="onFileChosen($event)"
              />
            </label>
            @if (density() === 'compact') {
              <nf-button
                type="button"
                variant="ghost"
                [size]="btnSize()"
                icon="trash-2"
                iconLibrary="lucide"
                tooltip="Retirer le document"
                aria-label="Retirer le document"
                [disabled]="!!slot().busy"
                (clicked)="remove.emit({ slotId: slot().id })"
              ></nf-button>
            } @else {
              <nf-button
                type="button"
                variant="danger"
                [size]="btnSize()"
                [disabled]="!!slot().busy"
                (clicked)="remove.emit({ slotId: slot().id })"
              >
                Retirer
              </nf-button>
            }
          } @else if (slot().locked && slot().lockedLabel) {
            <span class="nf-file-slot__lock">{{ slot().lockedLabel }}</span>
          }
        </div>
      } @else if (!readonly()) {
        <label class="nf-file-slot__drop">
          <lucide-icon name="upload" [size]="18" aria-hidden="true"></lucide-icon>
          <span class="nf-file-slot__drop-main">
            {{ slot().busy ? 'Envoi…' : slot().dropLabel || 'Déposer le fichier' }}
          </span>
          <span class="nf-file-slot__drop-sub">ou cliquez pour parcourir</span>
          <input
            type="file"
            [accept]="accept()"
            [disabled]="!!slot().busy"
            (change)="onFileChosen($event)"
          />
        </label>
      } @else {
        <p class="nf-file-slot__empty">{{ slot().emptyStatus || 'Non déposé' }}</p>
      }

      @if (!readonly() && slot().dismissible) {
        <div class="nf-file-slot__meta">
          @if (density() === 'compact') {
            <nf-button
              type="button"
              variant="ghost"
              [size]="btnSize()"
              icon="trash-2"
              iconLibrary="lucide"
              tooltip="Retirer le slot"
              aria-label="Retirer le slot"
              (clicked)="dismiss.emit({ slotId: slot().id })"
            ></nf-button>
          } @else {
            <nf-button
              type="button"
              variant="danger"
              [size]="btnSize()"
              (clicked)="dismiss.emit({ slotId: slot().id })"
            >
              Retirer le slot
            </nf-button>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .nf-file-slot {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-height: 180px;
        padding: 14px;
        border: 2px dashed var(--nf-color-border, var(--nf-border-default, #e5e7eb));
        border-radius: 8px;
        background: var(--nf-color-bg, var(--nf-surface-section, #fff));
        transition:
          border-color 0.15s ease,
          background 0.15s ease;
      }

      .nf-file-slot--required {
        border-color: color-mix(
          in srgb,
          var(--nf-color-primary-500, var(--nf-primary, #0b6e7a)) 45%,
          var(--nf-color-border, #e5e7eb)
        );
      }

      .nf-file-slot--filled {
        border-style: solid;
        border-width: 1px;
        border-color: var(--nf-color-border, var(--nf-border-default, #e5e7eb));
      }

      .nf-file-slot--over {
        border-color: var(--nf-color-primary-500, var(--nf-primary, #0b6e7a));
        background: color-mix(
          in srgb,
          var(--nf-color-primary-500, var(--nf-primary, #0b6e7a)) 8%,
          transparent
        );
      }

      .nf-file-slot--busy {
        opacity: 0.7;
        pointer-events: none;
      }

      .nf-file-slot__head {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .nf-file-slot__type {
        display: inline-flex;
        align-items: center;
        height: 22px;
        padding: 0 8px;
        border-radius: 4px;
        background: color-mix(
          in srgb,
          var(--nf-color-primary-500, var(--nf-primary, #0b6e7a)) 12%,
          transparent
        );
        color: var(--nf-color-primary-700, var(--nf-primary, #08545d));
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.04em;
      }

      .nf-file-slot__flag {
        font-size: 0.6875rem;
        font-weight: 600;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        color: var(--nf-color-text-muted, var(--nf-text-muted, #6b7280));
      }

      .nf-file-slot__hint {
        font-size: 0.6875rem;
        font-weight: 600;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        color: var(--nf-color-primary-600, var(--nf-primary, #0b6e7a));
      }

      .nf-file-slot__label {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--nf-color-text-primary, var(--nf-text, #111827));
      }

      .nf-file-slot__drop {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        flex: 1;
        margin-top: 4px;
        padding: 16px 12px;
        border-radius: 6px;
        background: var(--nf-color-bg-subtle, var(--nf-surface-muted, #f8fafc));
        cursor: pointer;
        text-align: center;
      }

      .nf-file-slot__drop lucide-icon {
        color: var(--nf-color-primary-500, var(--nf-primary, #0b6e7a));
      }

      .nf-file-slot__drop input,
      .nf-file-slot__replace input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
      }

      .nf-file-slot__drop-main {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--nf-color-text-primary, var(--nf-text, #111827));
      }

      .nf-file-slot__drop-sub {
        font-size: 0.75rem;
        color: var(--nf-color-text-secondary, var(--nf-text-muted, #6b7280));
      }

      .nf-file-slot__file {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
        padding: 8px 10px;
        border-radius: 6px;
        background: var(--nf-color-bg-subtle, var(--nf-surface-muted, #f8fafc));
        border: 1px solid var(--nf-color-border, var(--nf-border-default, #e5e7eb));
        min-width: 0;
      }

      .nf-file-slot__file lucide-icon {
        flex-shrink: 0;
        color: var(--nf-color-primary-500, var(--nf-primary, #0b6e7a));
      }

      .nf-file-slot__name {
        flex: 1 1 auto;
        min-width: 0;
        border: 0;
        background: none;
        padding: 0;
        text-align: left;
        font: inherit;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--nf-color-primary-600, var(--nf-primary, #0b6e7a));
        cursor: pointer;
        text-decoration: underline;
        text-underline-offset: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .nf-file-slot__name:disabled {
        opacity: 0.6;
        cursor: wait;
      }

      .nf-file-slot__replace {
        position: relative;
        align-self: flex-start;
        margin-top: 4px;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--nf-color-primary-600, var(--nf-primary, #0b6e7a));
        cursor: pointer;
        text-decoration: underline;
        text-underline-offset: 2px;
      }

      .nf-file-slot__lock {
        margin-left: auto;
        font-size: 0.7rem;
        color: var(--nf-color-text-tertiary, var(--nf-text-muted, #64748b));
        white-space: nowrap;
      }

      .nf-file-slot__empty {
        margin: 4px 0 0;
        font-size: 0.8125rem;
        color: var(--nf-color-text-secondary, var(--nf-text-muted, #6b7280));
      }

      .nf-file-slot__actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }

      .nf-file-slot__extract {
        align-self: center;
      }

      .nf-file-slot__meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 4px;
      }

      .nf-file-slot--compact {
        min-height: 0;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 10px;
        padding: 6px 8px;
      }

      .nf-file-slot--compact .nf-file-slot__label--inline {
        flex: 0 1 10rem;
        min-width: 0;
        font-size: 0.75rem;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .nf-file-slot--compact .nf-file-slot__head {
        flex: 0 0 auto;
      }

      .nf-file-slot--compact .nf-file-slot__file {
        flex: 1 1 12rem;
        margin: 0;
        padding: 4px 8px;
        min-width: 0;
      }

      .nf-file-slot--compact .nf-file-slot__actions {
        flex: 0 0 auto;
        margin-left: auto;
        gap: 6px;
        flex-wrap: nowrap;
      }

      .nf-file-slot--compact .nf-file-slot__drop {
        flex-direction: row;
        justify-content: flex-start;
        flex: 1 1 auto;
        margin: 0;
        padding: 4px 8px;
        gap: 8px;
        text-align: left;
      }

      .nf-file-slot--compact .nf-file-slot__drop-main {
        font-size: 0.75rem;
      }

      .nf-file-slot--compact .nf-file-slot__drop-sub {
        display: none;
      }

      .nf-file-slot--compact .nf-file-slot__replace {
        margin: 0;
        align-self: center;
        display: inline-flex;
        align-items: center;
        height: 26px;
        font-size: 0.75rem;
      }

      .nf-file-slot--compact .nf-file-slot__extract {
        margin-left: 0;
      }

      .nf-file-slot--compact .nf-file-slot__lock {
        margin-left: 0;
      }

      .nf-file-slot--compact .nf-file-slot__empty {
        margin: 0;
        flex: 1 1 auto;
      }

      .nf-file-slot--compact .nf-file-slot__meta {
        margin: 0;
        width: auto;
        margin-left: auto;
      }
    `,
  ],
})
export class FileSlotComponent {
  readonly slot = input.required<FileSlotModel>();
  readonly density = input<FileSlotDensity>('comfortable');
  readonly accept = input(
    '.pdf,.xlsx,.xls,.csv,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  readonly readonly = input(false);

  readonly btnSize = computed((): ButtonSize =>
    this.density() === 'compact' ? 'xs' : 'sm',
  );

  readonly file = output<FileSlotFileEvent>();
  readonly open = output<FileSlotIdEvent>();
  readonly remove = output<FileSlotIdEvent>();
  readonly extract = output<FileSlotIdEvent>();
  readonly dismiss = output<FileSlotIdEvent>();

  readonly over = signal(false);

  readonly filled = computed(() => {
    const s = this.slot();
    return !!(s.fileId || s.fileName);
  });

  readonly extractConfig = computed(() => this.slot().extract ?? null);

  onDragOver(event: DragEvent): void {
    if (this.readonly() || this.slot().busy || this.slot().locked) return;
    event.preventDefault();
    event.stopPropagation();
    this.over.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.over.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.over.set(false);
    if (this.readonly() || this.slot().busy || this.slot().locked) return;
    const dropped = event.dataTransfer?.files?.[0];
    if (dropped) this.file.emit({ slotId: this.slot().id, file: dropped });
  }

  onFileChosen(event: Event): void {
    const inputEl = event.target as HTMLInputElement | null;
    const chosen = inputEl?.files?.[0];
    if (chosen) this.file.emit({ slotId: this.slot().id, file: chosen });
    if (inputEl) inputEl.value = '';
  }
}
