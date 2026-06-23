import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ChatPanelService } from './chat-panel.service';
import { ChatMessage } from './ai-assistant.types';
import { ChatActionCardComponent } from './chat-action-card.component';
import { ChatDataCardComponent } from './chat-data-card.component';

@Component({
  selector: 'nf-chat-panel',
  standalone: true,
  imports: [CommonModule, TranslateModule, ChatActionCardComponent, ChatDataCardComponent],
  template: `
    <button
      class="nf-chat-fab"
      type="button"
      [attr.aria-label]="'core.ai.assistant.title' | translate"
      (click)="toggleOpen()">
      <span class="nf-chat-fab__icon">🤖</span>
    </button>

    <section
      *ngIf="isOpen()"
      class="nf-chat-panel"
      role="dialog"
      aria-modal="false"
      [attr.aria-label]="'core.ai.assistant.title' | translate"
      (keydown.escape)="close()">
      <header class="nf-chat-panel__header">
        <h2 class="nf-chat-panel__title">{{ 'core.ai.assistant.title' | translate }}</h2>
        <div class="nf-chat-panel__header-actions">
          <button
            type="button"
            class="nf-chat-panel__btn nf-chat-panel__btn--ghost"
            (click)="clearConversation()">
            {{ 'core.ai.assistant.clear' | translate }}
          </button>
          <button
            type="button"
            class="nf-chat-panel__btn nf-chat-panel__btn--icon"
            (click)="close()">
            ✕
          </button>
        </div>
      </header>

      <div
        #scrollContainer
        class="nf-chat-panel__messages"
        role="log"
        aria-live="polite">
        <div
          *ngIf="messages().length === 0"
          class="nf-chat-panel__message nf-chat-panel__message--assistant">
          <div class="nf-chat-panel__bubble">
            Hi! I'm your AI assistant. I can help you navigate the platform,
            find data, and perform actions. What would you like to do?
          </div>
        </div>

        <ng-container *ngFor="let message of messages(); trackBy: trackByMessage">
          <div
            class="nf-chat-panel__message"
            [class.nf-chat-panel__message--user]="message.role === 'user'"
            [class.nf-chat-panel__message--assistant]="message.role === 'assistant'">
            <div class="nf-chat-panel__bubble">
              <ng-container *ngIf="!message.isLoading; else loadingTpl">
                <div class="nf-chat-panel__content">
                  {{ message.content }}
                </div>

                <div
                  *ngIf="message.links?.length"
                  class="nf-chat-panel__links">
                  <button
                    *ngFor="let link of message.links"
                    type="button"
                    class="nf-chat-panel__link"
                    (click)="navigate(link.route)">
                    {{ link.label }}
                  </button>
                </div>

                <div *ngIf="message.actions?.length" class="nf-chat-panel__cards">
                  <app-chat-action-card
                    *ngFor="let action of message.actions"
                    [action]="action"
                    (approve)="onApprove($event)"
                    (reject)="onReject($event)">
                  </app-chat-action-card>
                </div>

                <div *ngIf="message.dataCards?.length" class="nf-chat-panel__cards">
                  <app-chat-data-card
                    *ngFor="let card of message.dataCards"
                    [card]="card">
                  </app-chat-data-card>
                </div>
              </ng-container>
            </div>
          </div>
        </ng-container>

        <ng-template #loadingTpl>
          <div class="nf-chat-panel__typing">
            <span></span><span></span><span></span>
          </div>
        </ng-template>
      </div>

      <form class="nf-chat-panel__input" (submit)="onSubmit($event)">
        <textarea
          #textarea
          class="nf-chat-panel__textarea"
          [rows]="rows()"
          [value]="draft()"
          [disabled]="isLoading()"
          [placeholder]="'core.ai.assistant.placeholder' | translate"
          (input)="onDraftChange($event)"
          (keydown)="onKeydown($event)"></textarea>
        <button
          type="submit"
          class="nf-chat-panel__send"
          [disabled]="!draft().trim() || isLoading()">
          {{ 'core.ai.assistant.send' | translate }}
        </button>
      </form>
    </section>
  `,
  styles: [`
    :host {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 1200;
    }

    .nf-chat-fab {
      position: absolute;
      right: 1.5rem;
      bottom: 1.5rem;
      width: 3rem;
      height: 3rem;
      border-radius: 9999px;
      border: none;
      background: var(--nf-color-primary, #3b82f6);
      color: var(--nf-color-text-inverse, #ffffff);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--nf-shadow-lg);
      cursor: pointer;
      pointer-events: auto;
    }

    .nf-chat-panel {
      position: absolute;
      right: 1rem;
      bottom: 5rem;
      width: 400px;
      max-width: 100%;
      height: 60vh;
      max-height: calc(100vh - 6rem);
      background: var(--nf-color-surface, #ffffff);
      border-radius: 1rem;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      box-shadow: var(--nf-shadow-2xl);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      pointer-events: auto;
      animation: nf-chat-slide-up 160ms ease-out;
    }

    .nf-chat-panel__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--nf-border-default, #e5e7eb);
    }

    .nf-chat-panel__title {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .nf-chat-panel__header-actions {
      display: flex;
      gap: 0.25rem;
    }

    .nf-chat-panel__btn {
      border-radius: 9999px;
      border: 1px solid transparent;
      padding: 0.25rem 0.6rem;
      font-size: 0.75rem;
      cursor: pointer;
      background: transparent;
    }

    .nf-chat-panel__btn--ghost {
      border-color: var(--nf-border-default, #e5e7eb);
    }

    .nf-chat-panel__btn--icon {
      width: 1.8rem;
      height: 1.8rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .nf-chat-panel__messages {
      flex: 1;
      padding: 0.75rem;
      overflow-y: auto;
      background: var(--nf-surface-page, #f9fafb);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .nf-chat-panel__message {
      display: flex;
    }

    .nf-chat-panel__message--user {
      justify-content: flex-end;
    }

    .nf-chat-panel__message--assistant {
      justify-content: flex-start;
    }

    .nf-chat-panel__bubble {
      max-width: 80%;
      padding: 0.5rem 0.75rem;
      border-radius: 0.75rem;
      font-size: 0.8rem;
      line-height: 1.4;
      background: var(--nf-color-surface, #ffffff);
      border: 1px solid var(--nf-border-subtle, #e5e7eb);
    }

    .nf-chat-panel__message--user .nf-chat-panel__bubble {
      background: var(--nf-primary-subtle, #eff6ff);
      border-color: var(--nf-color-primary-200, #bfdbfe);
    }

    .nf-chat-panel__links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-top: 0.5rem;
    }
    .nf-chat-panel__cards {
      display: grid;
      gap: 0.4rem;
      margin-top: 0.5rem;
    }

    .nf-chat-panel__link {
      border-radius: 9999px;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      padding: 0.1rem 0.6rem;
      font-size: 0.75rem;
      cursor: pointer;
      background: var(--nf-color-surface, #ffffff);
    }

    .nf-chat-panel__input {
      padding: 0.5rem 0.75rem;
      border-top: 1px solid var(--nf-border-default, #e5e7eb);
      display: flex;
      gap: 0.5rem;
      align-items: flex-end;
    }

    .nf-chat-panel__textarea {
      flex: 1;
      border-radius: 0.75rem;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      padding: 0.4rem 0.6rem;
      font: inherit;
      font-size: 0.8rem;
      resize: none;
      background: var(--nf-color-surface, #ffffff);
    }

    .nf-chat-panel__send {
      border-radius: 9999px;
      border: none;
      padding: 0.4rem 0.9rem;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      background: var(--nf-color-primary, #3b82f6);
      color: var(--nf-color-text-inverse, #ffffff);
    }

    .nf-chat-panel__typing {
      display: inline-flex;
      gap: 0.2rem;
      align-items: center;
    }

    .nf-chat-panel__typing span {
      width: 0.25rem;
      height: 0.25rem;
      border-radius: 9999px;
      background: var(--nf-text-muted, #6b7280);
      animation: nf-chat-bounce 1s infinite ease-in-out;
    }

    .nf-chat-panel__typing span:nth-child(2) {
      animation-delay: 0.15s;
    }
    .nf-chat-panel__typing span:nth-child(3) {
      animation-delay: 0.3s;
    }

    @keyframes nf-chat-slide-up {
      from {
        transform: translateY(6px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes nf-chat-bounce {
      0%,
      80%,
      100% {
        transform: scale(0.8);
        opacity: 0.4;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }

    @media (max-width: 640px) {
      .nf-chat-panel {
        right: 0.5rem;
        left: 0.5rem;
        bottom: 4.5rem;
        width: auto;
      }
    }
  `],
})
export class ChatPanelComponent {
  private readonly chat = inject(ChatPanelService);
  private readonly router = inject(Router);

  @ViewChild('scrollContainer') private readonly scrollContainer?: ElementRef<HTMLElement>;
  @ViewChild('textarea') private readonly textarea?: ElementRef<HTMLTextAreaElement>;

  readonly isOpen = this.chat.isOpen;
  readonly messages = this.chat.messages;
  readonly isLoading = this.chat.isLoading;
  readonly draft = signal('');
  readonly rows = computed(() => {
    const length = this.draft().length;
    if (length < 80) return 1;
    if (length < 200) return 2;
    if (length < 320) return 3;
    return 4;
  });

  constructor() {
    effect(() => {
      const _messages = this.messages();
      if (!this.scrollContainer) return;
      const el = this.scrollContainer.nativeElement;
      queueMicrotask(() => {
        el.scrollTop = el.scrollHeight;
      });
    });
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    const isMac = navigator.platform.toLowerCase().includes('mac');
    const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;
    if (cmdOrCtrl && event.shiftKey && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      this.toggleOpen();
    }
  }

  trackByMessage(_index: number, message: ChatMessage): string {
    return message.id;
  }

  toggleOpen(): void {
    this.chat.toggle();
    if (this.chat.isOpen()) {
      queueMicrotask(() => this.focusTextarea());
    }
  }

  close(): void {
    this.chat.close();
  }

  clearConversation(): void {
    this.chat.clearConversation();
  }

  onDraftChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    this.draft.set(target?.value ?? '');
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const text = this.draft().trim();
    if (!text) return;
    await this.chat.sendMessage(text);
    this.draft.set('');
    this.focusTextarea();
  }

  async onApprove(actionId: string): Promise<void> {
    await this.chat.approveAndExecute(actionId);
  }

  async onReject(actionId: string): Promise<void> {
    await this.chat.rejectAction(actionId);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.onSubmit(event);
    }
  }

  navigate(route: string): void {
    if (!route) return;
    void this.router.navigateByUrl(route);
  }

  private focusTextarea(): void {
    const el = this.textarea?.nativeElement;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }
}

