import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, IconComponent } from '@lib/anatomy/components';
import { PermissionService } from '@core/security/services/permission.service';

import { ErpDocScanService } from '../../services/erp-doc-scan.service';

/**
 * Reusable scan-document button.
 *
 * Renders a button + hidden file input. On file selection, calls the Doxura
 * extraction API and emits `extracted` with the raw JSON or `scanError` on
 * failure — keeping mapping logic in the caller.
 */
@Component({
  selector: 'erp-doc-scan-button',
  standalone: true,
  imports: [ButtonComponent, IconComponent, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (canScan()) {
      <input
        #fileInput
        class="dsb__file-input"
        type="file"
        [attr.accept]="accept"
        (change)="onFileSelected($event)" />

      <nf-button
        variant="secondary"
        [disabled]="disabled || isScanning()"
        (clicked)="triggerInput()">
        @if (isScanning()) {
          <nf-icon name="loader-circle" />
          {{ 'common.scan.scanning' | translate }}
        } @else {
          <nf-icon name="scan-line" />
          {{ labelKey | translate }}
        }
      </nf-button>
    }
  `,
  styles: [`
    .dsb__file-input { display: none; }
  `],
})
export class DocScanButtonComponent {
  @ViewChild('fileInput') private readonly fileInput?: ElementRef<HTMLInputElement>;

  @Input() domainKey = '';
  @Input() docTypeKey = '';
  @Input() labelKey = 'common.scan.button';
  @Input() accept = '.pdf,.png,.jpg,.jpeg,.webp';
  @Input() disabled = false;
  /** When set, the button is hidden unless the user has this permission. */
  @Input() permission = '';

  @Output() readonly extracted = new EventEmitter<Record<string, unknown>>();
  @Output() readonly scanError = new EventEmitter<string>();

  readonly isScanning = signal(false);

  private readonly erpDocScan = inject(ErpDocScanService);
  private readonly translate = inject(TranslateService);
  private readonly permissionService = inject(PermissionService);

  readonly canScan = computed(() =>
    !this.permission || this.permissionService.hasPermission(this.permission),
  );

  triggerInput(): void {
    if (this.isScanning() || this.disabled) {
      return;
    }

    const input = this.fileInput?.nativeElement;
    if (!input) {
      return;
    }

    input.value = '';
    input.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (!file) {
      return;
    }

    this.isScanning.set(true);
    try {
      const data = await this.erpDocScan.extractJson({
        file,
        domainKey: this.domainKey,
        docTypeKey: this.docTypeKey,
      });
      this.extracted.emit(data);
    } catch (err) {
      const message = (err as Error).message;
      const key = this.resolveErrorKey(message);
      this.scanError.emit(this.translate.instant(key));
    } finally {
      input.value = '';
      this.isScanning.set(false);
    }
  }

  private resolveErrorKey(message: string): string {
    if (message === 'ERP_DOC_SCAN_TENANT_MISSING') {
      return 'common.scan.tenantMissing';
    }
    if (message === 'ERP_DOC_SCAN_FAILED') {
      return 'common.scan.failed';
    }
    return 'common.scan.error';
  }
}
