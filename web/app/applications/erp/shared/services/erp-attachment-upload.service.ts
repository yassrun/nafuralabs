import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AttachmentApiService } from '@platform/features/collaboration/doc-manager/services/attachment-api.service';
import type { ErpAttachmentEntityType } from '@applications/erp/shared/config/attachment-detail.config';

/** Upload helpers for ERP features that store MinIO keys in legacy URL fields. */
@Injectable({ providedIn: 'root' })
export class ErpAttachmentUploadService {
  private readonly attachmentApi = inject(AttachmentApiService);

  async uploadFile(
    entityType: ErpAttachmentEntityType,
    entityId: string,
    file: File,
  ): Promise<string> {
    const attachment = await firstValueFrom(
      this.attachmentApi.uploadAttachment(entityType, entityId, file),
    );
    return attachment.fileUrl;
  }

  resolveDownloadUrl(storageKey: string): string {
    return this.attachmentApi.getAttachmentDownloadUrl(storageKey);
  }

  isStorageKey(value: string | undefined | null): boolean {
    if (!value?.trim()) {
      return false;
    }
    return !value.startsWith('/assets/') && !value.startsWith('http');
  }
}
