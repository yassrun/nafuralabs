import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { DocumentPreviewComponent } from '../document-preview/document-preview.component';

export interface AttachmentItem {
  id: string;
  name: string;
  url?: string;
  mimeType?: string;
  sizeBytes?: number;
  uploadedBy?: string;
  uploadedAt?: string;
}

export interface AttachmentPreviewDialogData {
  title: string;
  url: string;
  type: 'pdf' | 'image';
}

/** Minimal dialog for PDF/image preview in attachment manager. */
@Component({
  selector: 'nf-attachment-preview-dialog',
  standalone: true,
  imports: [CommonModule, DocumentPreviewComponent],
  template: `
    <div class="nf-attachment-preview-dialog">
      <nf-document-preview
        [title]="data.title"
        [sourceUrl]="data.url"
        [sourceType]="data.type"
        [downloadable]="true"
      />
    </div>
  `,
  styles: [`
    .nf-attachment-preview-dialog {
      min-width: 360px;
      min-height: 400px;
      max-width: 90vw;
      max-height: 85vh;
    }
  `],
})
export class AttachmentPreviewDialogComponent {
  readonly data: AttachmentPreviewDialogData = inject(MAT_DIALOG_DATA);
}

@Component({
  selector: 'nf-attachment-manager',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="nf-attachment-manager">
      <header class="nf-attachment-manager__header">
        <h3 class="nf-attachment-manager__title">{{ title() }}</h3>
      </header>

      @if (!readonly()) {
        <div
          class="nf-attachment-manager__dropzone"
          [class.nf-attachment-manager__dropzone--over]="dragOver()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)">
          <input
            type="file"
            class="nf-attachment-manager__upload-input"
            [attr.accept]="acceptAttr()"
            [multiple]="multiple()"
            #fileInput
            (change)="onFilesPicked($event)">
          <button type="button" class="nf-attachment-manager__upload-btn" (click)="fileInput.click()">
            {{ uploadLabel() }}
          </button>
          <span class="nf-attachment-manager__dropzone-hint">{{ dragDropLabel() }}</span>
        </div>
        @if (validationError()) {
          <p class="nf-attachment-manager__validation-error">{{ validationError() }}</p>
        }
      }

      @if (attachments().length === 0) {
        <p class="nf-attachment-manager__empty">{{ emptyLabel() }}</p>
      } @else {
        <ul class="nf-attachment-manager__list">
          @for (file of attachments(); track file.id) {
            <li class="nf-attachment-manager__row">
              <div class="nf-attachment-manager__thumb" (click)="onPreview(file)">
                @if (isImage(file)) {
                  <img
                    [src]="file.url"
                    [alt]="file.name"
                    class="nf-attachment-manager__thumb-img"
                    loading="lazy">
                } @else {
                  <span class="nf-attachment-manager__thumb-placeholder">
                    {{ fileTypeLabel(file) }}
                  </span>
                }
              </div>
              <div class="nf-attachment-manager__meta">
                <strong class="nf-attachment-manager__name">{{ file.name }}</strong>
                <span class="nf-attachment-manager__details">
                  {{ formatSize(file.sizeBytes) }}
                  @if (file.uploadedAt) {
                    • {{ file.uploadedAt | date:'short' }}
                  }
                  @if (file.uploadedBy) {
                    • {{ file.uploadedBy }}
                  }
                </span>
              </div>
              <div class="nf-attachment-manager__actions">
                <button type="button" class="nf-attachment-manager__btn" (click)="onDownload(file)">
                  {{ downloadLabel() }}
                </button>
                @if (canPreview(file)) {
                  <button type="button" class="nf-attachment-manager__btn" (click)="onPreview(file)">
                    {{ previewLabel() }}
                  </button>
                }
                @if (!readonly()) {
                  <button
                    type="button"
                    class="nf-attachment-manager__btn nf-attachment-manager__btn--danger"
                    (click)="onRemoveClick(file)">
                    {{ removeLabel() }}
                  </button>
                }
              </div>
            </li>
          }
        </ul>
      }

      @if (lightboxUrl()) {
        <div
          class="nf-attachment-manager__lightbox"
          (click)="closeLightbox()"
          role="button"
          tabindex="0"
          (keydown.escape)="closeLightbox()">
          <img
            [src]="lightboxUrl()"
            alt="Preview"
            class="nf-attachment-manager__lightbox-img"
            (click)="$event.stopPropagation()">
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .nf-attachment-manager { display: flex; flex-direction: column; gap: var(--nf-space-3, 12px); }
    .nf-attachment-manager__header { display: flex; justify-content: space-between; gap: 10px; align-items: center; }
    .nf-attachment-manager__title { margin: 0; color: var(--nf-text-primary); font-size: var(--nf-font-size-md, 1rem); }
    .nf-attachment-manager__dropzone {
      border: 2px dashed var(--nf-border-default);
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      transition: border-color 0.2s, background 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .nf-attachment-manager__dropzone--over {
      border-color: var(--nf-color-primary-500, #6366f1);
      background: var(--nf-color-primary-50, rgba(99, 102, 241, 0.08));
    }
    .nf-attachment-manager__upload-input { display: none; }
    .nf-attachment-manager__upload-btn {
      border: 1px solid var(--nf-border-default);
      border-radius: 8px;
      padding: 8px 16px;
      background: var(--nf-surface-card);
      color: var(--nf-text-primary);
      cursor: pointer;
      font-size: 0.875rem;
    }
    .nf-attachment-manager__upload-btn:hover { background: var(--nf-surface-hover); }
    .nf-attachment-manager__dropzone-hint { color: var(--nf-text-muted); font-size: 0.8125rem; }
    .nf-attachment-manager__validation-error {
      margin: 0;
      font-size: 0.875rem;
      color: var(--nf-color-danger-600, #b91c1c);
    }
    .nf-attachment-manager__empty { margin: 0; color: var(--nf-text-muted); }
    .nf-attachment-manager__list { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; }
    .nf-attachment-manager__row {
      display: flex;
      align-items: center;
      gap: 12px;
      border: 1px solid var(--nf-border-default);
      border-radius: 8px;
      padding: 8px 10px;
      background: var(--nf-surface-card);
    }
    .nf-attachment-manager__thumb {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
      border-radius: 6px;
      overflow: hidden;
      background: var(--nf-surface-base);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .nf-attachment-manager__thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .nf-attachment-manager__thumb-placeholder {
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--nf-text-muted);
      text-transform: uppercase;
    }
    .nf-attachment-manager__meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .nf-attachment-manager__name { color: var(--nf-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.875rem; }
    .nf-attachment-manager__details { color: var(--nf-text-muted); font-size: var(--nf-font-size-xs, 0.75rem); }
    .nf-attachment-manager__actions { display: inline-flex; gap: 8px; flex-wrap: wrap; }
    .nf-attachment-manager__btn {
      border: 1px solid var(--nf-border-default);
      border-radius: 6px;
      padding: 4px 8px;
      background: transparent;
      color: var(--nf-text-secondary);
      cursor: pointer;
      font-size: 0.8125rem;
    }
    .nf-attachment-manager__btn:hover { background: var(--nf-surface-hover); }
    .nf-attachment-manager__btn--danger { color: var(--nf-color-danger-600); border-color: var(--nf-color-danger-300); }
    .nf-attachment-manager__lightbox {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      cursor: pointer;
    }
    .nf-attachment-manager__lightbox-img {
      max-width: 95vw;
      max-height: 95vh;
      object-fit: contain;
      cursor: default;
    }
  `],
})
export class AttachmentManagerComponent {
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);

  attachments = input<AttachmentItem[]>([]);
  readonly = input<boolean>(false);
  multiple = input<boolean>(true);
  title = input<string>('Attachments');
  emptyLabel = input<string>('No files attached.');
  uploadLabel = input<string>('Upload Files');
  dragDropLabel = input<string>('Drag files here or click to browse');
  downloadLabel = input<string>('Download');
  removeLabel = input<string>('Delete');
  confirmRemoveMessage = input<string>('Delete this file?');
  previewLabel = input<string>('Preview');
  maxFiles = input<number>(20);
  maxFileSize = input<number>(10 * 1024 * 1024);
  allowedTypes = input<string[]>(['*']);
  validationError = input<string | null>(null);

  uploadRequested = output<File[]>();
  removeRequested = output<string>();
  downloadRequested = output<AttachmentItem>();

  readonly dragOver = signal(false);
  readonly lightboxUrl = signal<string | null>(null);

  readonly acceptAttr = computed(() => {
    const types = this.allowedTypes();
    if (!types.length || types.includes('*')) return '*/*';
    return types.join(',');
  });

  isImage(file: AttachmentItem): boolean {
    const t = (file.mimeType || '').toLowerCase();
    return t.startsWith('image/');
  }

  isPdf(file: AttachmentItem): boolean {
    return (file.mimeType || '').toLowerCase() === 'application/pdf';
  }

  canPreview(file: AttachmentItem): boolean {
    return this.isImage(file) || this.isPdf(file);
  }

  fileTypeLabel(file: AttachmentItem): string {
    if (this.isPdf(file)) return 'PDF';
    return 'FILE';
  }

  formatSize(bytes?: number): string {
    if (bytes == null) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
    const files = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];
    if (files.length > 0) {
      this.uploadRequested.emit(files);
    }
  }

  onFilesPicked(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const files = target?.files ? Array.from(target.files) : [];
    if (files.length > 0) {
      this.uploadRequested.emit(files);
    }
    if (target) target.value = '';
  }

  async onRemoveClick(file: AttachmentItem): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.removeLabel(),
      message: this.confirmRemoveMessage(),
      confirmLabel: this.removeLabel(),
      variant: 'danger',
      icon: 'delete',
    });
    if (confirmed) {
      this.removeRequested.emit(file.id);
    }
  }

  onRemove(file: AttachmentItem): void {
    this.removeRequested.emit(file.id);
  }

  onDownload(file: AttachmentItem): void {
    this.downloadRequested.emit(file);
    if (file.url) {
      window.open(file.url, '_blank', 'noopener,noreferrer');
    }
  }

  onPreview(file: AttachmentItem): void {
    if (!file.url) return;
    if (this.isImage(file)) {
      this.lightboxUrl.set(file.url);
      return;
    }
    if (this.isPdf(file)) {
      this.dialog.open(AttachmentPreviewDialogComponent, {
        data: { title: file.name, url: file.url, type: 'pdf' as const },
        panelClass: 'nf-attachment-preview-panel',
        maxWidth: '90vw',
        maxHeight: '90vh',
      });
      return;
    }
  }

  closeLightbox(): void {
    this.lightboxUrl.set(null);
  }
}
