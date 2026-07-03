/**
 * Polymorphic comment thread – list + input, threaded replies, embeddable.
 * Inputs: entityType, entityId.
 */

import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommentApiService, RecordCommentDto } from '../services/comment-api.service';
import { CommentThreadComponent as NfCommentThread, CommentEntry } from '../../../../lib/anatomy/components/organisms/comment-thread/comment-thread.component';

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
      (addComment)="onAddComment($event)"
      (deleteComment)="onDeleteComment($event)"
    />
    @if (loading()) {
      <p class="nf-comment-thread-panel__loading">{{ loadingLabel() }}</p>
    }
    @if (error()) {
      <p class="nf-comment-thread-panel__error">{{ error() }}</p>
    }
  `,
  styles: [`
    :host { display: block; }
    .nf-comment-thread-panel__loading, .nf-comment-thread-panel__error { margin: 8px 0; font-size: 0.875rem; }
    .nf-comment-thread-panel__error { color: var(--nf-color-danger-600, #b91c1c); }
  `],
})
export class CommentThreadPanelComponent {
  private readonly api = inject(CommentApiService);

  entityType = input.required<string>();
  entityId = input.required<string>();
  readonly = input<boolean>(false);
  title = input<string>('Comments');
  placeholder = input<string>('Write a comment...');
  emptyLabel = input<string>('No comments yet.');
  loadingLabel = input<string>('Loading...');

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly comments = signal<RecordCommentDto[]>([]);

  readonly commentEntries = computed<CommentEntry[]>(() => {
    return this.comments().map((c) => ({
      id: c.id,
      author: c.author,
      body: c.body,
      createdAt: c.createdAt,
      editedAt: c.editedAt,
      canEdit: false,
      canDelete: true,
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
    this.api.listComments(entityType, entityId, 0, 50).subscribe({
      next: (page) => {
        this.comments.set(page.content ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to load comments');
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
      next: () => {
        this.load(et, eid);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to add comment');
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
        this.error.set(err?.message ?? 'Failed to delete comment');
      },
    });
  }
}
