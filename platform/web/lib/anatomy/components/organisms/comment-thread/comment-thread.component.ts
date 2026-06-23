import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CommentEntry {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  editedAt?: string;
  canEdit?: boolean;
  canDelete?: boolean;
}

@Component({
  selector: 'nf-comment-thread',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="nf-comment-thread">
      <header class="nf-comment-thread__header">
        <h3 class="nf-comment-thread__title">{{ title() }}</h3>
      </header>

      @if (!readonly()) {
        <div class="nf-comment-thread__composer">
          <textarea
            class="nf-comment-thread__textarea"
            [value]="draft()"
            [attr.placeholder]="placeholder()"
            (input)="onDraftInput($event)">
          </textarea>
          <button type="button" class="nf-comment-thread__btn" [disabled]="!canSubmit()" (click)="onSubmitComment()">
            {{ addLabel() }}
          </button>
        </div>
      }

      @if (comments().length === 0) {
        <p class="nf-comment-thread__empty">{{ emptyLabel() }}</p>
      } @else {
        <ul class="nf-comment-thread__list">
          @for (comment of comments(); track comment.id) {
            <li class="nf-comment-thread__item">
              <div class="nf-comment-thread__meta">
                <strong>{{ comment.author }}</strong>
                <time>{{ comment.createdAt | date:'short' }}</time>
                @if (comment.editedAt) {
                  <span class="nf-comment-thread__edited">({{ editedLabel() }})</span>
                }
              </div>

              @if (editingId() === comment.id) {
                <textarea
                  class="nf-comment-thread__textarea"
                  [value]="editingDraft()"
                  (input)="onEditDraftInput($event)">
                </textarea>
                <div class="nf-comment-thread__row-actions">
                  <button type="button" class="nf-comment-thread__btn" (click)="onSaveEdit(comment.id)">
                    {{ saveLabel() }}
                  </button>
                  <button type="button" class="nf-comment-thread__btn" (click)="onCancelEdit()">
                    {{ cancelLabel() }}
                  </button>
                </div>
              } @else {
                <p class="nf-comment-thread__body">{{ comment.body }}</p>
                <div class="nf-comment-thread__row-actions">
                  @if (!readonly() && comment.canEdit) {
                    <button type="button" class="nf-comment-thread__btn" (click)="onStartEdit(comment)">
                      {{ editLabel() }}
                    </button>
                  }
                  @if (!readonly() && comment.canDelete) {
                    <button type="button" class="nf-comment-thread__btn nf-comment-thread__btn--danger" (click)="onDelete(comment.id)">
                      {{ deleteLabel() }}
                    </button>
                  }
                </div>
              }
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .nf-comment-thread { display: grid; gap: var(--nf-space-3, 12px); }
    .nf-comment-thread__title { margin: 0; color: var(--nf-text-primary); font-size: var(--nf-font-size-md, 1rem); }
    .nf-comment-thread__composer { display: grid; gap: 8px; }
    .nf-comment-thread__textarea {
      min-height: 72px;
      border: 1px solid var(--nf-border-default);
      border-radius: 8px;
      padding: 8px;
      font: inherit;
      color: var(--nf-text-primary);
      background: var(--nf-surface-card);
    }
    .nf-comment-thread__btn {
      width: fit-content;
      border: 1px solid var(--nf-border-default);
      border-radius: 6px;
      padding: 4px 10px;
      cursor: pointer;
      background: transparent;
      color: var(--nf-text-secondary);
    }
    .nf-comment-thread__btn[disabled] { opacity: 0.5; cursor: not-allowed; }
    .nf-comment-thread__btn--danger { color: var(--nf-color-danger-600); border-color: var(--nf-color-danger-300); }
    .nf-comment-thread__empty { margin: 0; color: var(--nf-text-muted); }
    .nf-comment-thread__list { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; }
    .nf-comment-thread__item {
      border: 1px solid var(--nf-border-default);
      border-radius: 10px;
      padding: 10px;
      background: var(--nf-surface-card);
      display: grid;
      gap: 8px;
    }
    .nf-comment-thread__meta { display: inline-flex; gap: 8px; align-items: baseline; color: var(--nf-text-muted); font-size: var(--nf-font-size-xs, 0.75rem); }
    .nf-comment-thread__edited { font-style: italic; }
    .nf-comment-thread__body { margin: 0; color: var(--nf-text-secondary); white-space: pre-wrap; }
    .nf-comment-thread__row-actions { display: inline-flex; gap: 6px; }
  `],
})
export class CommentThreadComponent {
  comments = input<CommentEntry[]>([]);
  readonly = input<boolean>(false);
  title = input<string>('Comments');
  placeholder = input<string>('Write a comment...');
  emptyLabel = input<string>('No comments yet.');
  addLabel = input<string>('Add comment');
  editLabel = input<string>('Edit');
  deleteLabel = input<string>('Delete');
  saveLabel = input<string>('Save');
  cancelLabel = input<string>('Cancel');
  editedLabel = input<string>('edited');

  addComment = output<string>();
  editComment = output<{ id: string; body: string }>();
  deleteComment = output<string>();

  readonly draft = signal('');
  readonly editingId = signal<string | null>(null);
  readonly editingDraft = signal('');

  canSubmit(): boolean {
    return this.draft().trim().length > 0;
  }

  onDraftInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    this.draft.set(target?.value || '');
  }

  onSubmitComment(): void {
    const value = this.draft().trim();
    if (!value) return;
    this.addComment.emit(value);
    this.draft.set('');
  }

  onStartEdit(comment: CommentEntry): void {
    this.editingId.set(comment.id);
    this.editingDraft.set(comment.body);
  }

  onEditDraftInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    this.editingDraft.set(target?.value || '');
  }

  onSaveEdit(commentId: string): void {
    const value = this.editingDraft().trim();
    if (!value) return;
    this.editComment.emit({ id: commentId, body: value });
    this.editingId.set(null);
    this.editingDraft.set('');
  }

  onCancelEdit(): void {
    this.editingId.set(null);
    this.editingDraft.set('');
  }

  onDelete(commentId: string): void {
    this.deleteComment.emit(commentId);
  }
}

