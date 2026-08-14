import { Component, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '@lib/anatomy';
import { AttachmentApiService } from '@platform/features/collaboration/doc-manager/services/attachment-api.service';
import { ApiConfigService } from '@platform/core/config/api-config.service';

import {
  PhotoChantierApiService,
  type PhotoChantierApiRow,
} from '../../services/photo-chantier-api.service';

@Component({
  selector: 'app-photo-chantier-gallery',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonComponent],
  template: `
    <section class="gallery">
      <div class="gallery__toolbar">
        <label class="gallery__upload">
          <nf-button variant="primary" iconLibrary="lucide" icon="camera">
            {{ 'chantiers.photos.upload' | translate }}
          </nf-button>
          <input type="file" accept="image/*" capture="environment" (change)="onFileSelected($event)" />
        </label>
        <input
          class="gallery__zone"
          type="text"
          [placeholder]="'chantiers.photos.zonePlaceholder' | translate"
          [value]="zone()"
          (input)="zone.set($any($event.target).value)" />
        @if (uploading()) {
          <span class="gallery__status">{{ 'chantiers.photos.uploading' | translate }}</span>
        }
      </div>

      <div class="gallery__grid">
        @for (photo of photos(); track photo.id) {
          <article class="gallery__card">
            <img [src]="photoUrl(photo)" [alt]="photo.filename" loading="lazy" />
            <div class="gallery__meta">
              <span class="gallery__name">{{ photo.filename }}</span>
              @if (photo.zone) {
                <span class="gallery__zone-tag">{{ photo.zone }}</span>
              }
              <span class="gallery__date">{{ photo.takenAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="gallery__actions">
              <nf-button variant="ghost" size="sm" iconLibrary="lucide" icon="download" (clicked)="download(photo)">
                {{ 'attachments.download' | translate }}
              </nf-button>
              <nf-button variant="ghost" size="sm" iconLibrary="lucide" icon="trash-2" (clicked)="remove(photo)">
                {{ 'common.actions.delete' | translate }}
              </nf-button>
            </div>
          </article>
        } @empty {
          <p class="gallery__empty">{{ 'chantiers.photos.empty' | translate }}</p>
        }
      </div>
    </section>
  `,
  styles: [`
    .gallery { display: flex; flex-direction: column; gap: 1rem; }
    .gallery__toolbar { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
    .gallery__upload { position: relative; cursor: pointer; }
    .gallery__upload input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .gallery__zone {
      flex: 1; min-width: 160px; max-width: 280px;
      padding: 7px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px;
    }
    .gallery__status { font-size: 12px; color: var(--nf-color-text-secondary); }
    .gallery__grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.875rem;
    }
    .gallery__card {
      border: 1px solid var(--nf-color-border); border-radius: 0.75rem; overflow: hidden;
      background: var(--nf-color-surface);
    }
    .gallery__card img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; background: var(--nf-color-bg-muted); }
    .gallery__meta { padding: 0.5rem 0.65rem; display: flex; flex-direction: column; gap: 0.15rem; }
    .gallery__name { font-size: 0.78rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .gallery__zone-tag { font-size: 0.7rem; color: var(--nf-color-primary-700); }
    .gallery__date { font-size: 0.68rem; color: var(--nf-color-text-muted); }
    .gallery__actions { display: flex; gap: 0.25rem; padding: 0 0.5rem 0.5rem; }
    .gallery__empty { grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--nf-color-text-muted); }
  `],
})
export class PhotoChantierGalleryComponent {
  private readonly api = inject(PhotoChantierApiService);
  private readonly attachmentApi = inject(AttachmentApiService);
  private readonly apiConfig = inject(ApiConfigService);

  readonly chantierId = input.required<string>();

  readonly photos = signal<PhotoChantierApiRow[]>([]);
  readonly zone = signal('');
  readonly uploading = signal(false);

  constructor() {
    effect(() => {
      const id = this.chantierId();
      if (id) {
        void this.load(id);
      }
    });
  }

  photoUrl(photo: PhotoChantierApiRow): string {
    if (
      photo.storagePath &&
      !photo.storagePath.startsWith('photos/') &&
      !photo.storagePath.includes('#size=')
    ) {
      return this.attachmentApi.getAttachmentDownloadUrl(photo.storagePath);
    }
    return `${this.apiConfig.apiBaseUrl()}/api/v1/photos/${photo.id}/content`;
  }

  async onFileSelected(event: Event): Promise<void> {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    if (!file) return;
    this.uploading.set(true);
    try {
      await this.api.uploadPhoto(this.chantierId(), file, {
        zone: this.zone() || undefined,
        uploadedBy: 'field-user',
      });
      await this.load(this.chantierId());
    } finally {
      this.uploading.set(false);
      inputEl.value = '';
    }
  }

  download(photo: PhotoChantierApiRow): void {
    window.open(this.photoUrl(photo), '_blank', 'noopener,noreferrer');
  }

  async remove(photo: PhotoChantierApiRow): Promise<void> {
    await this.api.deletePhoto(photo.id);
    await this.load(this.chantierId());
  }

  private async load(chantierId: string): Promise<void> {
    try {
      this.photos.set(await this.api.listByChantier(chantierId));
    } catch {
      this.photos.set([]);
    }
  }
}
