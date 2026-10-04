import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '../../core/config/api-config.service';
import { formatRelativeTime } from '../../lib/anatomy/utils/relative-time';
import { AttachmentManagerComponent, type AttachmentItem } from '../../lib/anatomy/components/organisms/attachment-manager';
import { CommentThreadComponent, type CommentEntry } from '../../lib/anatomy/components/organisms/comment-thread';
import { ToastService } from '../../lib/anatomy/components/services/toast.service';

interface AttachmentBody {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  sizeBytes?: number;
  uploadedBy?: string;
  uploadedAt?: string;
}
interface CommentBody {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  editedAt?: string;
}
interface PageOf<T> {
  content?: T[];
}

/**
 * Files and notes of a saved record. The entity key is the lifecycle `entity`, or the last segment of the endpoint.
 * Read follows the record's read permission; adding and deleting follow its update permission (enforced by the API).
 */
@Component({
  selector: 'nf-record-collaboration',
  standalone: true,
  imports: [TranslateModule, AttachmentManagerComponent, CommentThreadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (kind() === 'attachments') {
      <nf-attachment-manager
        [title]="title() || ('Attachments' | translate)"
        [attachments]="files()"
        [readonly]="!canUpdate()"
        [allowedTypes]="accept()"
        [maxFileSize]="maxBytes()"
        [emptyLabel]="'No files attached.' | translate"
        [uploadLabel]="'Upload Files' | translate"
        [downloadLabel]="'Download' | translate"
        [removeLabel]="'Delete' | translate"
        [previewLabel]="'Preview' | translate"
        (uploadRequested)="upload($event)"
        (removeRequested)="removeFile($event)"
        (downloadRequested)="download($event)" />
    } @else {
      <nf-comment-thread
        [title]="title() || ('Notes' | translate)"
        [comments]="notes()"
        [readonly]="!canUpdate()"
        [placeholder]="'Write a comment...' | translate"
        [emptyLabel]="'No comments yet.' | translate"
        [addLabel]="'Add comment' | translate"
        [editLabel]="'Edit' | translate"
        [deleteLabel]="'Delete' | translate"
        [saveLabel]="'Save' | translate"
        [cancelLabel]="'Cancel' | translate"
        (addComment)="add($event)"
        (editComment)="edit($event)"
        (deleteComment)="removeNote($event)"
        (replyComment)="reply($event)" />
    }
  `,
})
export class RecordCollaborationComponent {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiConfigService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly kind = input.required<'attachments' | 'comments'>();
  readonly entityType = input.required<string>();
  readonly entityId = input.required<string>();
  readonly canUpdate = input(false);
  readonly title = input('');
  readonly accept = input<string[]>(['*']);
  readonly maxSizeMb = input<number | undefined>(undefined);

  readonly files = signal<AttachmentItem[]>([]);
  readonly notes = signal<CommentEntry[]>([]);
  private readonly me = signal('');

  readonly maxBytes = () => (this.maxSizeMb() ?? 10) * 1024 * 1024;

  constructor() {
    effect(() => {
      this.entityType();
      this.entityId();
      this.kind();
      void this.reload();
    });
  }

  async reload(): Promise<void> {
    try {
      if (this.kind() === 'attachments') {
        const page = await firstValueFrom(
          this.http.get<PageOf<AttachmentBody>>(this.url('/api/v1/platform/collaboration/attachments'), {
            params: { entityType: this.entityType(), entityId: this.entityId(), size: 50 },
          }),
        );
        const items = await Promise.all((page.content ?? []).map((file) => this.withPreview(file)));
        this.files.set(items);
      } else {
        const page = await firstValueFrom(
          this.http.get<PageOf<CommentBody>>(this.url('/api/v1/platform/collaboration/comments'), {
            params: { entityType: this.entityType(), entityId: this.entityId(), size: 100 },
          }),
        );
        this.notes.set((page.content ?? []).map((note) => this.entry(note)));
        if (!this.me()) {
          const session = await firstValueFrom(this.http.get<{ email?: string }>(this.url('/api/v1/me/session')));
          this.me.set(session.email ?? '');
          this.notes.set((page.content ?? []).map((note) => this.entry(note)));
        }
      }
    } catch {
      this.toast.error(this.translate.instant('Unable to load data'));
    }
  }

  async upload(files: File[]): Promise<void> {
    for (const file of files) {
      const body = new FormData();
      body.append('file', file);
      body.append('entityType', this.entityType());
      body.append('entityId', this.entityId());
      await firstValueFrom(this.http.post(this.url('/api/v1/platform/collaboration/attachments/upload'), body, { params: this.gateParams() }));
    }
    await this.reload();
  }

  async removeFile(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(this.url(`/api/v1/platform/collaboration/attachments/${id}`), { params: this.gateParams() }));
    await this.reload();
  }

  async download(file: AttachmentItem): Promise<void> {
    const source = this.files().find((item) => item.id === file.id);
    const key = source?.url ? undefined : undefined;
    const stored = (source as AttachmentItem & { key?: string } | undefined)?.key;
    if (!stored) return;
    const blob = await firstValueFrom(
      this.http.get(this.url('/api/v1/platform/collaboration/attachments/download'), { params: { key: stored, ...this.gateParams() }, responseType: 'blob' }),
    );
    saveBlob(blob, file.name);
  }

  async add(text: string): Promise<void> {
    await firstValueFrom(
      this.http.post(this.url('/api/v1/platform/collaboration/comments'), {
        entityType: this.entityType(),
        entityId: this.entityId(),
        text,
      }, { params: this.gateParams() }),
    );
    await this.reload();
  }

  async reply(event: { parentId: string; body: string }): Promise<void> {
    await firstValueFrom(
      this.http.post(this.url('/api/v1/platform/collaboration/comments/reply'), {
        entityType: this.entityType(),
        entityId: this.entityId(),
        parentCommentId: event.parentId,
        text: event.body,
      }, { params: this.gateParams() }),
    );
    await this.reload();
  }

  async edit(event: { id: string; body: string }): Promise<void> {
    await firstValueFrom(this.http.patch(this.url(`/api/v1/platform/collaboration/comments/${event.id}`), { text: event.body }, { params: this.gateParams() }));
    await this.reload();
  }

  async removeNote(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(this.url(`/api/v1/platform/collaboration/comments/${id}`), { params: this.gateParams() }));
    await this.reload();
  }

  private gateParams(): Record<string, string> {
    return { entityType: this.entityType(), entityId: this.entityId() };
  }

  private entry(note: CommentBody): CommentEntry {
    const mine = !!this.me() && note.author.toLowerCase() === this.me().toLowerCase();
    return {
      id: note.id,
      author: note.author,
      body: note.body,
      createdAt: note.createdAt,
      editedAt: note.editedAt,
      canEdit: mine,
      canDelete: mine,
    };
  }

  private async withPreview(file: AttachmentBody): Promise<AttachmentItem & { key: string }> {
    let url: string | undefined;
    if (file.mimeType?.startsWith('image/') || file.mimeType === 'application/pdf') {
      try {
        const blob = await firstValueFrom(
          this.http.get(this.url('/api/v1/platform/collaboration/attachments/download'), {
            params: { key: file.fileUrl, ...this.gateParams() },
            responseType: 'blob',
          }),
        );
        url = URL.createObjectURL(blob);
      } catch {
        url = undefined;
      }
    }
    return {
      id: file.id,
      name: file.fileName,
      url,
      key: file.fileUrl,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      uploadedBy: file.uploadedBy,
      uploadedAt: file.uploadedAt,
    };
  }

  private url(path: string): string {
    return this.api.getApiBaseUrl().replace(/\/+$/, '') + path;
  }
}

function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
