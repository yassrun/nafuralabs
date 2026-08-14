import { Component, inject, input, output, ChangeDetectionStrategy } from '@angular/core';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent } from '@platform/lib/anatomy';
import { safeRandomUUID } from '@platform/core/util/uuid';

import type { AvancementPhoto } from '../../../models';

@Component({
  selector: 'app-photo-uploader',
  standalone: true,
  imports: [TranslateModule, ButtonComponent],
  templateUrl: './photo-uploader.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./photo-uploader.component.scss'],
})
export class PhotoUploaderComponent {
  private readonly translate = inject(TranslateService);

  readonly photos = input<AvancementPhoto[]>([]);
  readonly changed = output<AvancementPhoto[]>();

  async onFilesSelected(event: Event): Promise<void> {
    const inputElement = event.target as HTMLInputElement | null;
    const files = inputElement?.files;
    if (!files || files.length === 0) {
      return;
    }

    const nextPhotos = [...this.photos()];
    for (const file of Array.from(files)) {
      nextPhotos.push({
        id: `upload-${safeRandomUUID()}`,
        name: file.name,
        url: await toDataUrl(file, this.translate),
        capturedAt: new Date().toISOString(),
        file,
      });
    }

    this.changed.emit(nextPhotos);
    inputElement.value = '';
  }

  removePhoto(photoId: string): void {
    this.changed.emit(this.photos().filter((photo) => photo.id !== photoId));
  }
}

function toDataUrl(file: File, translate: TranslateService): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(
      new Error(translate.instant('chantiers.avancement.errors.readFileFailed', { name: file.name })),
    );
    reader.readAsDataURL(file);
  });
}
