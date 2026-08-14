/**
 * Polymorphic comment thread – list + composer, flat V1 (no reply UI).
 * Inputs: entityType, entityId.
 */

import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommentApiService, RecordCommentDto } from '../services/comment-api.service';
import {
  CommentThreadComponent as NfCommentThread,
  CommentEntry,
} from '../../../../lib/anatomy/components/organisms/comment-thread/comment-thread.component';
import { AuthFacade } from '../../../../core/security/services/auth.facade';

@Component({
  selector: 'nf-comment-thread-panel',
  standalone: true,
  imports: [CommonModule, NfCommentThread],
  template: `
    <nf-comment-thread
      [comments]="commentEntries()"
      [readonly]="readonly()"
      [title]="title()"
      [placeholder]="placeholder()"
      [emptyLabel]="emptyLabel()"
      [addLabel]="addLabel()"
      [editLabel]="editLabel()"
      [deleteLabel]="deleteLabel()"
      [saveLabel]="saveLabel()"
      [cancelLabel]="cancelLabel()"
      [editedLabel]="editedLabel()"
      (addComment)="onAddComment($event)"
      (editComment)="onEditComment($event)"
      (deleteComment)="onDeleteComment($event)"
    />
    @if (loading()) {
      <p class="nf-comment-thread-panel__loading">{{ loadingLabel() }}</p>
    }
    @if (error()) {
      <p class="nf-comment-thread-panel__error">{{ error() }}</p>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .nf-comment-thread-panel__loading,
      .nf-comment-thread-panel__error {
        margin: 8px 0;
        font-size: 0.875rem;
      }
      .nf-comment-thread-panel__error {
        color: var(--nf-color-danger-600, #b91c1c);
      }
    `,
  ],
})
export class CommentThreadPanelComponent {
  private readonly api = inject(CommentApiService);
  private readonly auth = inject(AuthFacade);

  entityType = input.required<string>();
  entityId = input.required<string>();
  readonly = input<boolean>(false);
  title = input<string>('Comments');
  placeholder = input<string>('Write a comment...');
  emptyLabel = input<string>('No comments yet.');
  loadingLabel = input<string>('Loading...');
  addLabel = input<string>('Add comment');
  editLabel = input<string>('Edit');
  deleteLabel = input<string>('Delete');
  saveLabel = input<string>('Save');
  cancelLabel = input<string>('Cancel');
  editedLabel = input<string>('edited');

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly comments = signal<RecordCommentDto[]>([]);

  private readonly currentEmail = computed(
    () => (this.auth.user()?.email ?? '').trim().toLowerCase(),
  );

  readonly commentEntries = computed<CommentEntry[]>(() => {
    const me = this.currentEmail();
    return this.comments().map((c) => {
      const mine = !!me && c.author?.trim().toLowerCase() === me;
      return {
        id: c.id,
        author: c.author,
        body: c.body,
        createdAt: c.createdAt,
        editedAt: c.editedAt,
        canEdit: mine,
        canDelete: mine,
      };
    });
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
    this.api.listComments(entityType, entityId, 0, 50).subscribe({
      next: (page) => {
        this.comments.set(page.content ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? err?.message ?? 'Failed to load comments');
        this.loading.set(false);
      },
    });
  }

  onAddComment(text: string): void {
    const et = this.entityType();
    const eid = this.entityId();
    if (!et || !eid) return;
    this.error.set(null);
    this.api.addComment(et, eid, text).subscribe({
      next: () => this.load(et, eid),
      error: (err) => {
        this.error.set(err?.error?.message ?? err?.message ?? 'Failed to add comment');
      },
    });
  }

  onEditComment(payload: { id: string; body: string }): void {
    const et = this.entityType();
    const eid = this.entityId();
    this.error.set(null);
    this.api.updateComment(payload.id, payload.body).subscribe({
      next: () => {
        if (et && eid) this.load(et, eid);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? err?.message ?? 'Failed to update comment');
      },
    });
  }

  onDeleteComment(commentId: string): void {
    this.api.deleteComment(commentId).subscribe({
      next: () => {
        const et = this.entityType();
        const eid = this.entityId();
        if (et && eid) this.load(et, eid);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? err?.message ?? 'Failed to delete comment');
      },
    });
  }
}
