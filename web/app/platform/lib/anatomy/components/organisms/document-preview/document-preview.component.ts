import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DocumentPreviewType = 'auto' | 'pdf' | 'image' | 'text' | 'unsupported';

@Component({
  selector: 'nf-document-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="nf-document-preview">
      <header class="nf-document-preview__header">
        <h3 class="nf-document-preview__title">{{ title() }}</h3>
        <div class="nf-document-preview__actions">
          @if (sourceUrl()) {
            <button type="button" class="nf-document-preview__btn" (click)="onOpenExternal()">
              {{ openLabel() }}
            </button>
            @if (downloadable()) {
              <button type="button" class="nf-document-preview__btn" (click)="onDownload()">
                {{ downloadLabel() }}
              </button>
            }
          }
        </div>
      </header>

      <div class="nf-document-preview__body">
        @switch (resolvedType()) {
          @case ('image') {
            <img class="nf-document-preview__image" [src]="sourceUrl() || ''" [alt]="title()">
          }
          @case ('pdf') {
            <iframe class="nf-document-preview__frame" [src]="sourceUrl() || ''" [title]="title()"></iframe>
          }
          @case ('text') {
            <pre class="nf-document-preview__text">{{ textContent() }}</pre>
          }
          @default {
            <p class="nf-document-preview__empty">{{ emptyLabel() }}</p>
          }
        }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .nf-document-preview {
      border: 1px solid var(--nf-border-default);
      border-radius: 10px;
      background: var(--nf-surface-card);
      display: grid;
      grid-template-rows: auto 1fr;
      min-height: 360px;
    }
    .nf-document-preview__header {
      border-bottom: 1px solid var(--nf-border-default);
      padding: 10px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .nf-document-preview__title { margin: 0; color: var(--nf-text-primary); font-size: var(--nf-font-size-md, 1rem); }
    .nf-document-preview__actions { display: inline-flex; gap: 8px; }
    .nf-document-preview__btn {
      border: 1px solid var(--nf-border-default);
      border-radius: 6px;
      background: transparent;
      color: var(--nf-text-secondary);
      padding: 4px 8px;
      cursor: pointer;
    }
    .nf-document-preview__body { min-height: 0; }
    .nf-document-preview__frame {
      width: 100%;
      height: 100%;
      min-height: 320px;
      border: 0;
      background: var(--nf-surface-base);
    }
    .nf-document-preview__image {
      width: 100%;
      height: 100%;
      min-height: 320px;
      object-fit: contain;
      background: var(--nf-surface-base);
    }
    .nf-document-preview__text {
      margin: 0;
      padding: 12px;
      white-space: pre-wrap;
      color: var(--nf-text-secondary);
      font-family: var(--nf-font-family-mono, monospace);
    }
    .nf-document-preview__empty {
      margin: 0;
      padding: 16px 12px;
      color: var(--nf-text-muted);
    }
  `],
})
export class DocumentPreviewComponent {
  title = input<string>('Document Preview');
  sourceUrl = input<string | null>(null);
  sourceType = input<DocumentPreviewType>('auto');
  textContent = input<string>('');
  downloadable = input<boolean>(true);
  emptyLabel = input<string>('No document selected.');
  openLabel = input<string>('Open');
  downloadLabel = input<string>('Download');

  openExternal = output<string>();
  download = output<string>();

  readonly resolvedType = computed<DocumentPreviewType>(() => {
    const explicitType = this.sourceType();
    if (explicitType !== 'auto') return explicitType;

    const url = (this.sourceUrl() || '').toLowerCase();
    if (url.endsWith('.pdf')) return 'pdf';
    if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(url)) return 'image';
    if (this.textContent().trim().length > 0) return 'text';
    return 'unsupported';
  });

  onOpenExternal(): void {
    const url = this.sourceUrl();
    if (!url) return;
    this.openExternal.emit(url);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  onDownload(): void {
    const url = this.sourceUrl();
    if (!url) return;
    this.download.emit(url);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = '';
    link.click();
  }
}

