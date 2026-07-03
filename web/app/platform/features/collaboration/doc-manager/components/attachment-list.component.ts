/**
 * Polymorphic attachment list – upload/download/delete, drag-drop, embeddable.
 * Inputs: entityType, entityId, optional attachmentConfig for validation.
 */

import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AttachmentApiService, RecordAttachmentDto } from '../services/attachment-api.service';
import { AttachmentManagerComponent, AttachmentItem } from '../../../../lib/anatomy/components/organisms/attachment-manager/attachment-manager.component';
import type { AttachmentConfig } from '../../../../lib/anatomy/types';

const DEFAULT_MAX_FILES = 20;
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ALLOWED_TYPES: string[] = ['*'];

@Component({
  selector: 'nf-attachment-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, AttachmentManagerComponent],
  template: `
    <nf-attachment-manager
      [attachments]="attachmentItems()"
      [readonly]="readonly()"
      [title]="titleKey() | translate"
      [emptyLabel]="emptyLabelKey() | translate"
      [uploadLabel]="uploadLabelKey() | translate"
      [dragDropLabel]="dragDropLabelKey() | translate"
      [downloadLabel]="downloadLabelKey() | translate"
      [removeLabel]="removeLabelKey() | translate"
      [confirmRemoveMessage]="confirmRemoveMessageKey() | translate"
      [previewLabel]="previewLabelKey() | translate"
      [maxFiles]="effectiveConfig().maxFiles"
      [maxFileSize]="effectiveConfig().maxFileSize"
      [allowedTypes]="effectiveConfig().allowedTypes"
      [validationError]="validationError()"
      (uploadRequested)="onUpload($event)"
      (removeRequested)="onRemove($event)"
      (downloadRequested)="onDownload($event)"
    />
    @if (loading()) {
      <p class="nf-attachment-list__loading">{{ loadingLabelKey() | translate }}</p>
    }
    @if (error()) {
      <p class="nf-attachment-list__error">{{ error() }}</p>
    }
  `,
  styles: [`
    :host { display: block; }
    .nf-attachment-list__loading, .nf-attachment-list__error { margin: 8px 0; font-size: 0.875rem; }
    .nf-attachment-list__error { color: var(--nf-color-danger-600, #b91c1c); }
  `],
})
export class AttachmentListComponent {
  private readonly api = inject(AttachmentApiService);
  private readonly translate = inject(TranslateService);

  entityType = input.required<string>();
  entityId = input.required<string>();
  readonly = input<boolean>(false);
  /** Optional validation limits (maxFiles, maxFileSize, allowedTypes). */
  attachmentConfig = input<AttachmentConfig | undefined>(undefined);
  titleKey = input<string>('attachments.title');
  emptyLabelKey = input<string>('attachments.empty');
  uploadLabelKey = input<string>('attachments.upload');
  dragDropLabelKey = input<string>('attachments.dragDrop');
  downloadLabelKey = input<string>('attachments.download');
  removeLabelKey = input<string>('Delete');
  confirmRemoveMessageKey = input<string>('attachments.delete.confirm');
  previewLabelKey = input<string>('attachments.preview');
  loadingLabelKey = input<string>('Loading');

  /** Emitted when the list of attachments changes (so tab label can show count). */
  attachmentCountChange = output<number>();

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly validationError = signal<string | null>(null);
  readonly attachments = signal<RecordAttachmentDto[]>([]);

  readonly effectiveConfig = computed(() => {
    const c = this.attachmentConfig();
    return {
      maxFiles: c?.maxFiles ?? DEFAULT_MAX_FILES,
      maxFileSize: c?.maxFileSize ?? DEFAULT_MAX_FILE_SIZE,
      allowedTypes: c?.allowedTypes ?? DEFAULT_ALLOWED_TYPES,
    };
  });

  readonly attachmentItems = computed<AttachmentItem[]>(() => {
    return this.attachments().map((a) => ({
      id: a.id,
      name: a.fileName,
      url: this.api.getAttachmentDownloadUrl(a.fileUrl),
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      uploadedBy: a.uploadedBy,
      uploadedAt: a.uploadedAt,
    }));
  });

  constructor() {
    effect(() => {
      const et = this.entityType();
      const eid = this.entityId();
      if (et && eid) {
        this.load(et, eid);
      }
    });
  }

  private load(entityType: string, entityId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listAttachments(entityType, entityId, 0, 50).subscribe({
      next: (page) => {
        const list = page.content ?? [];
        this.attachments.set(list);
        this.loading.set(false);
        this.attachmentCountChange.emit(list.length);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to load attachments');
        this.loading.set(false);
      },
    });
  }

  onUpload(files: File[]): void {
    const et = this.entityType();
    const eid = this.entityId();
    if (!et || !eid || files.length === 0) return;
    this.validationError.set(null);
    this.error.set(null);

    const config = this.effectiveConfig();
    const currentCount = this.attachments().length;

    for (const file of files) {
      if (file.size > config.maxFileSize) {
        this.validationError.set(
          this.translate.instant('attachments.error.tooLarge', {
            maxSize: formatBytes(config.maxFileSize),
          })
        );
        return;
      }
      if (currentCount + files.length > config.maxFiles) {
        this.validationError.set(
          this.translate.instant('attachments.error.maxFiles', { max: config.maxFiles })
        );
        return;
      }
      if (!isAllowedType(file.type, config.allowedTypes)) {
        this.validationError.set(this.translate.instant('attachments.error.invalidType'));
        return;
      }
    }
    if (currentCount + files.length > config.maxFiles) {
      this.validationError.set(
        this.translate.instant('attachments.error.maxFiles', { max: config.maxFiles })
      );
      return;
    }

    this.loading.set(true);
    const uploads = files.map((file) => this.api.uploadAttachment(et, eid, file));
    forkJoin(uploads).subscribe({
      next: () => {
        this.validationError.set(null);
        this.load(et, eid);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Upload failed');
        this.loading.set(false);
      },
    });
  }

  onRemove(attachmentId: string): void {
    this.api.deleteAttachment(attachmentId).subscribe({
      next: () => {
        const et = this.entityType();
        const eid = this.entityId();
        if (et && eid) this.load(et, eid);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Delete failed');
      },
    });
  }

  onDownload(item: AttachmentItem): void {
    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAllowedType(mimeType: string, allowed: string[]): boolean {
  if (allowed.length === 0 || allowed.includes('*')) return true;
  const type = mimeType.toLowerCase();
  for (const pattern of allowed) {
    if (pattern === '*') return true;
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      if (type === prefix || type.startsWith(prefix + '/')) return true;
    }
    if (type === pattern) return true;
  }
  return false;
}
