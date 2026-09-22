import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';

import { AiPanelService } from '../../../core/shell/ai-panel.service';
import { ConversationApiService, ConversationMessage } from '../../../app/conversation/services/conversation-api.service';
import { APP_SHELL_CONFIG } from '../app-shell.config';

/** Side panel toggled by `nf-ai-toggle` via {@link AiPanelService}. */
@Component({
  selector: 'nf-app-shell-ai-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, TranslateModule],
  template: `
    <aside
      class="nf-app-shell-ai-panel"
      [class.is-open]="aiPanel.open()"
      [attr.aria-hidden]="!aiPanel.open()"
      [attr.aria-label]="'core.conversation.title' | translate">
      <header class="nf-app-shell-ai-panel__header">
        <div class="nf-app-shell-ai-panel__title">
          <lucide-icon name="sparkles" [size]="16" aria-hidden="true"></lucide-icon>
          <span>{{ 'core.conversation.title' | translate }}</span>
        </div>
        <button
          type="button"
          class="nf-app-shell-ai-panel__close"
          [attr.aria-label]="'core.conversation.close' | translate"
          (click)="aiPanel.setOpen(false)">
          <lucide-icon name="x" [size]="18" aria-hidden="true"></lucide-icon>
        </button>
      </header>

      <div class="nf-app-shell-ai-panel__body">
        <div class="nf-app-shell-ai-panel__messages">
          @if (messages().length === 0) {
            <p class="nf-app-shell-ai-panel__welcome">Posez une question à l'assistant.</p>
          }
          @for (message of messages(); track message.id) {
            <p class="nf-app-shell-ai-panel__message" [class.is-user]="message.role === 'USER'">
              {{ message.content }}
            </p>
          }
          @if (error()) {
            <p class="nf-app-shell-ai-panel__error">{{ error() }}</p>
          }
        </div>
        <form class="nf-app-shell-ai-panel__composer" (submit)="send()">
          <textarea
            rows="3"
            [value]="draft()"
            placeholder="Écrire un message..."
            (input)="draft.set($any($event.target).value)"></textarea>
          <button type="submit" [disabled]="sending() || !draft().trim()">
            <lucide-icon name="send" [size]="15" aria-hidden="true"></lucide-icon>
            Envoyer
          </button>
        </form>
      </div>
    </aside>
  `,
  styles: [`
    :host {
      display: contents;
    }
    .nf-app-shell-ai-panel {
      grid-column: -1;
      grid-row: 2;
      display: flex;
      flex-direction: column;
      width: 0;
      min-width: 0;
      overflow: hidden;
      border-left: 0 solid var(--nf-border-default, #e2e8f0);
      background: var(--nf-color-surface, #ffffff);
      transition: width 160ms ease, border-width 160ms ease;
    }
    .nf-app-shell-ai-panel.is-open {
      width: var(--nf-app-shell-ai-width, 360px);
      border-left-width: 1px;
    }
    .nf-app-shell-ai-panel__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-height: 48px;
      padding: 0 12px;
      border-bottom: 1px solid var(--nf-border-default, #e2e8f0);
    }
    .nf-app-shell-ai-panel__title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--nf-text-primary, #172033);
      white-space: nowrap;
    }
    .nf-app-shell-ai-panel__close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: var(--nf-text-muted, #64748b);
      cursor: pointer;
    }
    .nf-app-shell-ai-panel__close:hover {
      background: var(--nf-surface-hover, #f8fafc);
      color: var(--nf-text-primary, #172033);
    }
    .nf-app-shell-ai-panel__body {
      flex: 1;
      min-height: 0;
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
    }
    .nf-app-shell-ai-panel__messages {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 8px;
    }
    .nf-app-shell-ai-panel__welcome {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.5;
      color: var(--nf-text-muted, #64748b);
    }
    .nf-app-shell-ai-panel__message {
      align-self: flex-start;
      max-width: 90%;
      margin: 0;
      padding: 8px 10px;
      border-radius: 8px;
      background: var(--nf-surface-hover, #f1f5f9);
      white-space: pre-wrap;
      line-height: 1.45;
    }
    .nf-app-shell-ai-panel__message.is-user {
      align-self: flex-end;
      background: var(--nf-color-primary, #2563eb);
      color: white;
    }
    .nf-app-shell-ai-panel__error { margin: 0; color: #b91c1c; }
    .nf-app-shell-ai-panel__composer { display: grid; gap: 8px; }
    .nf-app-shell-ai-panel__composer textarea {
      resize: vertical;
      min-height: 72px;
      padding: 8px;
      border: 1px solid var(--nf-border-default, #e2e8f0);
      border-radius: 8px;
      font: inherit;
    }
    .nf-app-shell-ai-panel__composer button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-height: 34px;
      border: 0;
      border-radius: 8px;
      background: var(--nf-color-primary, #2563eb);
      color: white;
      cursor: pointer;
    }
    .nf-app-shell-ai-panel__composer button:disabled { opacity: 0.5; cursor: default; }
    @media (max-width: 800px) {
      .nf-app-shell-ai-panel {
        position: fixed;
        top: var(--nf-app-shell-topbar-height, 56px);
        right: 0;
        bottom: 0;
        z-index: 30;
        grid-column: auto;
        grid-row: auto;
        box-shadow: var(--nf-shadow-lg, 0 10px 30px rgb(15 23 42 / 12%));
      }
      .nf-app-shell-ai-panel.is-open {
        width: min(100vw, var(--nf-app-shell-ai-width, 360px));
      }
    }
  `],
})
export class AppShellAiPanelComponent {
  readonly aiPanel = inject(AiPanelService);
  private readonly api = inject(ConversationApiService);
  private readonly config = inject(APP_SHELL_CONFIG);
  readonly messages = signal<ConversationMessage[]>([]);
  readonly draft = signal('');
  readonly sending = signal(false);
  readonly error = signal<string | null>(null);
  private conversationId: string | null = null;

  async send(): Promise<void> {
    const content = this.draft().trim();
    if (!content || this.sending()) return;
    this.sending.set(true);
    this.error.set(null);
    this.draft.set('');
    try {
      if (!this.conversationId) {
        const session = await this.api.createConversation(this.config.applicationId ?? 'application', 'ASSISTANT');
        this.conversationId = session.id;
      }
      const response = await this.api.sendTurn(this.conversationId, this.config.applicationId ?? 'application', { content });
      const next: ConversationMessage[] = [];
      if (response.userMessage) next.push(response.userMessage);
      if (response.assistantMessage) next.push(response.assistantMessage);
      this.messages.update((messages) => [...messages, ...next]);
    } catch {
      this.error.set('Impossible de contacter l’assistant.');
      this.draft.set(content);
    } finally {
      this.sending.set(false);
    }
  }
}
