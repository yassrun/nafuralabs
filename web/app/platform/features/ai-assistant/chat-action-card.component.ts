import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import type { ChatAction } from './ai-assistant.types';

@Component({
  selector: 'app-chat-action-card',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <article class="chat-action-card">
      <div class="chat-action-card__header">
        <strong>{{ action().description }}</strong>
        <span class="chat-action-card__status" [class]="statusClass()">{{ statusLabel() | translate }}</span>
      </div>

      <div class="chat-action-card__actions" *ngIf="action().status === 'pending'">
        <button type="button" (click)="approve.emit(action().id)">
          {{ 'core.ai.assistant.action.approve' | translate }}
        </button>
        <button type="button" (click)="reject.emit(action().id)">
          {{ 'core.ai.assistant.action.reject' | translate }}
        </button>
      </div>
    </article>
  `,
  styles: [
    `
      .chat-action-card {
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 10px;
        padding: 0.5rem 0.6rem;
        display: grid;
        gap: 0.5rem;
      }
      .chat-action-card__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
      }
      .chat-action-card__status {
        font-size: 0.75rem;
        padding: 0.1rem 0.45rem;
        border-radius: 999px;
        border: 1px solid var(--nf-border-default, #d1d5db);
      }
      .is-pending {
        background: #f3f4f6;
      }
      .is-approved {
        background: #dbeafe;
      }
      .is-rejected {
        background: #fee2e2;
      }
      .is-executed {
        background: #dcfce7;
      }
      .chat-action-card__actions {
        display: flex;
        gap: 0.4rem;
      }
    `,
  ],
})
export class ChatActionCardComponent {
  readonly action = input.required<ChatAction>();
  readonly approve = output<string>();
  readonly reject = output<string>();

  statusLabel(): string {
    switch (this.action().status) {
      case 'approved':
        return 'core.conversation.actions.status.approved';
      case 'rejected':
        return 'core.conversation.actions.status.rejected';
      case 'executed':
        return 'core.ai.assistant.action.executed';
      default:
        return 'core.ai.assistant.action.pending';
    }
  }

  statusClass(): string {
    return `is-${this.action().status}`;
  }
}
