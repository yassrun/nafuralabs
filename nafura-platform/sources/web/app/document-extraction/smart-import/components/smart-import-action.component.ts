import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';

import { ButtonComponent, type ButtonSize } from '@lib/anatomy';
import type {
  ExtractionDefinition,
  ReviewedExtraction,
  SmartImportMode,
  SmartImportPhase,
} from '../models/smart-import.model';
import type { SmartImportError } from '../models/smart-import.errors';
import { SmartImportFlowService } from '../services/smart-import-flow.service';

@Component({
  selector: 'nf-smart-import-action',
  standalone: true,
  imports: [ButtonComponent, TranslateModule, MatMenuModule, LucideAngularModule],
  providers: [SmartImportFlowService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.entitykey]': 'definition.key',
    class: 'nf-smart-import-action',
  },
  template: `
    <input
      #fileInput
      type="file"
      class="nf-smart-import-action__input"
      [attr.accept]="accept"
      (change)="onFileSelected($event)" />

    <nf-button
      variant="secondary"
      [size]="size"
      icon="sparkles"
      iconLibrary="lucide"
      [loading]="isBusy()"
      [disabled]="disabled"
      [matMenuTriggerFor]="importMenu"
      [tooltip]="'platform.smartImport.menu.tooltip' | translate"
      [attr.aria-label]="'platform.smartImport.menu.open' | translate"
      [attr.aria-haspopup]="'menu'">
      <span class="nf-smart-import-action__label">
        {{ phaseLabel() | translate }}
        @if (!isBusy()) {
          <lucide-icon
            name="chevron-down"
            [size]="14"
            class="nf-smart-import-action__chevron"
            aria-hidden="true" />
        }
      </span>
    </nf-button>

    <mat-menu #importMenu="matMenu" xPosition="before" class="nf-smart-import-action__menu">
      <button mat-menu-item type="button" class="nf-smart-import-menu-item" (click)="openHelp()">
        <lucide-icon name="help-circle" [size]="14" class="nf-smart-import-menu-item__icon" />
        <span>{{ 'platform.smartImport.menu.fieldInfo' | translate }}</span>
      </button>
      <button mat-menu-item type="button" class="nf-smart-import-menu-item" (click)="startImport('single')">
        <lucide-icon name="file-text" [size]="14" class="nf-smart-import-menu-item__icon" />
        <span>{{ 'platform.smartImport.menu.importSingle' | translate }}</span>
      </button>
      <button mat-menu-item type="button" class="nf-smart-import-menu-item" (click)="startImport('bulk')">
        <lucide-icon name="upload" [size]="14" class="nf-smart-import-menu-item__icon" />
        <span>{{ 'platform.smartImport.menu.importBulk' | translate }}</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    :host { display: inline-flex; }
    .nf-smart-import-action__input { display: none; }

    .nf-smart-import-action__label {
      display: inline-flex;
      align-items: center;
      gap: .3rem;
    }

    .nf-smart-import-action__chevron {
      opacity: .85;
      flex-shrink: 0;
    }

    .nf-smart-import-menu-item {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      font-size: 0.8125rem !important;
      height: 32px !important;
      min-height: 32px !important;
      line-height: 32px !important;
    }

    .nf-smart-import-menu-item__icon {
      color: var(--nf-text-muted, #6b7280);
      flex-shrink: 0;
    }
  `],
})
export class SmartImportActionComponent {
  @ViewChild('fileInput') private readonly fileInput?: ElementRef<HTMLInputElement>;

  @Input({ required: true }) definition!: ExtractionDefinition;
  @Input() disabled = false;
  @Input() accept = '.xlsx,.xls,.csv,.pdf';
  /** Button size — use 'xs' inside compact listing toolbars. */
  @Input() size: ButtonSize = 'md';

  @Output() readonly completed = new EventEmitter<ReviewedExtraction>();
  @Output() readonly cancelled = new EventEmitter<void>();
  @Output() readonly failed = new EventEmitter<SmartImportError>();

  readonly phase = signal<SmartImportPhase>('IDLE');

  private readonly flow = inject(SmartImportFlowService);
  private pendingMode: SmartImportMode = 'bulk';

  isBusy(): boolean {
    return ['PREFLIGHT', 'EXTRACTING'].includes(this.phase());
  }

  phaseLabel(): string {
    const phase = this.phase();
    return phase === 'IDLE' || phase === 'COMPLETED' || phase === 'FAILED'
      ? 'platform.smartImport.button'
      : `platform.smartImport.phase.${phase.toLowerCase()}`;
  }

  openHelp(): void {
    if (this.isBusy() || this.disabled) return;
    try {
      this.flow.openHelp(this.definition);
    } catch (error) {
      this.failed.emit(this.flow.handleError(this.definition, error));
    }
  }

  startImport(mode: SmartImportMode): void {
    if (this.isBusy() || this.disabled) return;
    this.pendingMode = mode;
    const input = this.fileInput?.nativeElement;
    if (!input) return;
    input.value = '';
    input.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (!file) return;

    const mode = this.pendingMode;
    const result = await this.flow.importFile(
      this.definition,
      file,
      (phase) => this.phase.set(phase),
      mode,
    );
    if (!result) {
      if (this.phase() === 'IDLE') {
        this.cancelled.emit();
      }
      input.value = '';
      return;
    }
    this.completed.emit(result);
    input.value = '';
  }
}
