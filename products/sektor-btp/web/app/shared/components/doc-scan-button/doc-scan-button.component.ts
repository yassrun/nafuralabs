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
import { firstValueFrom } from 'rxjs';

import { ButtonComponent, IconComponent } from '@lib/anatomy/components';
import { PermissionService } from '@core/security/services/permission.service';
import { TenantContextService } from '@platform/core/tenant/tenant.context';
import { DocTypeService } from '@platform/features/documents/doc-extractor/services/doc-type.service';
import type { JsonSchemaRoot } from '@platform/features/documents/doc-extractor/models/json-schema.model';
import type { UiSchema } from '@platform/features/documents/doc-extractor/models/ui-schema.model';

import { ErpDocScanService } from '../../services/erp-doc-scan.service';

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

  @Input() dataSchema: JsonSchemaRoot | null = null;
  @Input() presentationSchema: UiSchema | null = null;
  @Input() instructions = '';
  @Input() schemaName = '';

  @Input() domainKey = '';
  @Input() docTypeKey = '';

  @Input() labelKey = 'common.scan.button';
  @Input() accept = '.pdf,.png,.jpg,.jpeg,.webp';
  @Input() disabled = false;
  @Input() permission = '';

  @Output() readonly extracted = new EventEmitter<Record<string, unknown>>();
  @Output() readonly scanError = new EventEmitter<string>();

  readonly isScanning = signal(false);

  private readonly erpDocScan = inject(ErpDocScanService);
  private readonly docTypeService = inject(DocTypeService);
  private readonly tenantContext = inject(TenantContextService);
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
      const schemaArgs = await this.resolveSchemaArgs();
      const data = await this.erpDocScan.extractJson({
        file,
        ...schemaArgs,
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

  private async resolveSchemaArgs(): Promise<{
    dataSchema: JsonSchemaRoot;
    presentationSchema?: UiSchema;
    instructions?: string;
    schemaName?: string;
  }> {
    if (this.dataSchema) {
      return {
        dataSchema: this.dataSchema,
        presentationSchema: this.presentationSchema ?? undefined,
        instructions: this.instructions || undefined,
        schemaName: this.schemaName || undefined,
      };
    }

    if (!this.domainKey || !this.docTypeKey) {
      throw new Error('ERP_DOC_SCAN_SCHEMA_REQUIRED');
    }

    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) {
      throw new Error('ERP_DOC_SCAN_TENANT_MISSING');
    }

    const definition = await firstValueFrom(
      this.docTypeService.getActiveDefinition(this.domainKey, this.docTypeKey, tenantId),
    );
    return {
      dataSchema: definition.jsonSchema,
      presentationSchema: definition.uiSchema,
      instructions: definition.promptTemplate,
      schemaName: definition.name,
    };
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
