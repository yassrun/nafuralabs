/**
 * Print Dialog Component
 *
 * Entity print action: select template → preview PDF → download or (future) email.
 */

import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import {
  PrintTemplateApiService,
  type DocumentTemplateDto,
} from '../../../services/print-template-api.service';
import type { PrintDialogData } from './print-dialog.data';

@Component({
  selector: 'nf-print-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
  ],
  templateUrl: './print-dialog.component.html',
  styleUrl: './print-dialog.component.scss',
})
export class PrintDialogComponent implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<PrintDialogComponent>);
  private readonly data = inject<PrintDialogData>(MAT_DIALOG_DATA);
  private readonly templateApi = inject(PrintTemplateApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);

  readonly templates = signal<DocumentTemplateDto[]>([]);
  readonly templatesLoading = signal(true);
  readonly selectedTemplateId = signal<string | null>(null);
  readonly previewBlobUrl = signal<string | null>(null);
  readonly previewSafeUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.previewBlobUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });
  readonly previewLoading = signal(false);
  readonly previewError = signal<string | null>(null);

  private previewObjectUrl: string | null = null;

  readonly entityType = () => this.data.entityType;
  readonly entityId = () => this.data.entityId;
  readonly entityCode = () => this.data.entityCode ?? this.data.entityId;

  readonly hasTemplates = computed(() => this.templates().length > 0);
  readonly noTemplates = computed(
    () => !this.templatesLoading() && this.templates().length === 0
  );
  readonly singleTemplate = computed(() => this.templates().length === 1);
  readonly selectedTemplate = computed(() => {
    const id = this.selectedTemplateId();
    if (!id) return null;
    return this.templates().find((t) => t.id === id) ?? null;
  });
  readonly canDownload = computed(
    () => !!this.selectedTemplateId() && !!this.previewBlobUrl() && !this.previewLoading()
  );

  ngOnInit(): void {
    this.loadTemplates();
  }

  ngOnDestroy(): void {
    this.revokePreviewUrl();
  }

  close(): void {
    this.dialogRef.close();
  }

  private async loadTemplates(): Promise<void> {
    this.templatesLoading.set(true);
    this.previewError.set(null);
    try {
      const list = await this.templateApi.listByEntityType(this.data.entityType);
      this.templates.set(list);
      if (list.length === 1) {
        this.selectedTemplateId.set(list[0].id);
        this.loadPreview();
      } else if (list.length > 1) {
        this.selectedTemplateId.set(null);
      }
    } catch (err) {
      this.previewError.set('Failed to load templates');
    } finally {
      this.templatesLoading.set(false);
      this.cdr.markForCheck();
    }
  }

  onTemplateChange(templateId: string | null): void {
    this.selectedTemplateId.set(templateId);
    this.previewBlobUrl.set(null);
    this.previewError.set(null);
    if (templateId) {
      this.loadPreview();
    }
  }

  private async loadPreview(): Promise<void> {
    const templateId = this.selectedTemplateId();
    if (!templateId) return;

    this.revokePreviewUrl();
    this.previewLoading.set(true);
    this.previewError.set(null);
    this.cdr.markForCheck();

    try {
      const { blob } = await this.templateApi.renderPdf(templateId, {
        entityType: this.data.entityType,
        entityId: this.data.entityId,
      });
      const url = URL.createObjectURL(blob);
      this.previewObjectUrl = url;
      this.previewBlobUrl.set(url);
    } catch (err) {
      this.previewError.set('Failed to generate preview');
    } finally {
      this.previewLoading.set(false);
      this.cdr.markForCheck();
    }
  }

  private revokePreviewUrl(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
    this.previewBlobUrl.set(null);
  }

  downloadPdf(): void {
    const url = this.previewBlobUrl();
    const template = this.selectedTemplate();
    if (!url || !template) return;

    const templateSlug = (template.name ?? template.code ?? template.id)
      .replace(/\s+/g, '-')
      .toLowerCase();
    const code = this.entityCode().replace(/\s+/g, '-');
    const filename = `${this.data.entityType}-${code}-${templateSlug}.pdf`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  }
}
