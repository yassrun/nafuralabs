import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';

import { ButtonComponent } from '../../atoms/button';
import { FileSlotComponent } from '../../molecules/file-slot/file-slot.component';
import type {
  FileSlotDensity,
  FileSlotFileEvent,
  FileSlotIdEvent,
  FileSlotModel,
} from '../../molecules/file-slot/file-slot.types';

/**
 * List of typed document slots.
 * `grouped !== true` → inline. `grouped === true` → folded under `groupTitle`.
 */
@Component({
  selector: 'nf-file-slots',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, FileSlotComponent],
  template: `
    <div
      class="nf-file-slots"
      [class.nf-file-slots--compact]="density() === 'compact'"
      [style.--nf-file-slots-cols]="columns()"
    >
      @if (inlineSlots().length) {
        <div class="nf-file-slots__inline" role="group" [attr.aria-label]="inlineLabel()">
          @for (slot of inlineSlots(); track slot.id) {
            <nf-file-slot
              [slot]="slot"
              [density]="density()"
              [accept]="accept()"
              [readonly]="readonly()"
              (file)="file.emit($event)"
              (open)="open.emit($event)"
              (remove)="remove.emit($event)"
              (extract)="extract.emit($event)"
              (dismiss)="dismiss.emit($event)"
            />
          }
        </div>
      }

      @if (showGroup()) {
        <div class="nf-file-slots__group">
          <div class="nf-file-slots__group-bar">
            <button
              type="button"
              class="nf-file-slots__toggle"
              [attr.aria-expanded]="groupOpen()"
              (click)="groupOpen.set(!groupOpen())"
            >
              <span class="nf-file-slots__chevron" [class.nf-file-slots__chevron--open]="groupOpen()">▸</span>
              {{ groupTitle() }}
              <span class="nf-file-slots__count">
                {{ filledGrouped() }}/{{ groupedSlots().length }}
              </span>
            </button>
            @if (!readonly() && showGroupAdd()) {
              <nf-button
                type="button"
                variant="ghost"
                [size]="density() === 'compact' ? 'xs' : 'sm'"
                (clicked)="onAdd()"
              >
                {{ groupAddLabel() }}
              </nf-button>
            }
          </div>
          @if (groupOpen()) {
            <div class="nf-file-slots__group-body">
              @for (slot of groupedSlots(); track slot.id) {
                <nf-file-slot
                  [slot]="slot"
                  density="compact"
                  [accept]="accept()"
                  [readonly]="readonly()"
                  (file)="file.emit($event)"
                  (open)="open.emit($event)"
                  (remove)="remove.emit($event)"
                  (extract)="extract.emit($event)"
                  (dismiss)="dismiss.emit($event)"
                />
              }
              <ng-content select="[fileSlotsGroup]" />
            </div>
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

      .nf-file-slots__inline {
        display: grid;
        grid-template-columns: repeat(var(--nf-file-slots-cols, 2), minmax(0, 1fr));
        gap: 12px;
      }

      .nf-file-slots--compact .nf-file-slots__inline {
        grid-template-columns: 1fr;
        gap: 6px;
      }

      @media (max-width: 720px) {
        .nf-file-slots__inline {
          grid-template-columns: 1fr;
        }
      }

      .nf-file-slots__group {
        margin-top: 10px;
      }

      .nf-file-slots--compact .nf-file-slots__group {
        margin-top: 8px;
      }

      .nf-file-slots__group-bar {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .nf-file-slots__toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 0;
        background: none;
        padding: 4px 0;
        font: inherit;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--nf-color-text-primary, var(--nf-text, #111827));
        cursor: pointer;
      }

      .nf-file-slots__chevron {
        display: inline-block;
        transition: transform 0.15s ease;
      }

      .nf-file-slots__chevron--open {
        transform: rotate(90deg);
      }

      .nf-file-slots__count {
        font-weight: 500;
        color: var(--nf-color-text-secondary, var(--nf-text-muted, #6b7280));
      }

      .nf-file-slots__group-body {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 8px;
      }
    `,
  ],
})
export class FileSlotsComponent {
  readonly slots = input<FileSlotModel[]>([]);
  readonly density = input<FileSlotDensity>('comfortable');
  readonly columns = input(2);
  readonly accept = input(
    '.pdf,.xlsx,.xls,.csv,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  readonly readonly = input(false);
  readonly inlineLabel = input('Documents');
  readonly groupTitle = input('Autres documents');
  readonly groupAddLabel = input('Ajouter');
  readonly showGroupAdd = input(false);
  readonly groupOpen = model(false);

  readonly file = output<FileSlotFileEvent>();
  readonly open = output<FileSlotIdEvent>();
  readonly remove = output<FileSlotIdEvent>();
  readonly extract = output<FileSlotIdEvent>();
  readonly dismiss = output<FileSlotIdEvent>();
  readonly add = output<void>();

  readonly inlineSlots = computed(() => this.slots().filter((s) => !s.grouped));
  readonly groupedSlots = computed(() => this.slots().filter((s) => s.grouped));
  readonly filledGrouped = computed(
    () => this.groupedSlots().filter((s) => !!(s.fileId || s.fileName)).length,
  );
  readonly showGroup = computed(
    () => this.groupedSlots().length > 0 || this.showGroupAdd(),
  );

  onAdd(): void {
    this.groupOpen.set(true);
    this.add.emit();
  }
}
