import { Injectable, signal } from '@angular/core';

import { AiAssistantApiService } from './ai-assistant-api.service';
import { ChatAction, ChatMessage } from './ai-assistant.types';

@Injectable({ providedIn: 'root' })
export class ChatPanelService {
  readonly isOpen = signal(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly isLoading = signal(false);
  readonly conversationId = signal<string | null>(null);

  constructor(private readonly api: AiAssistantApiService) {}

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  async sendMessage(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;

    const id = crypto.randomUUID();
    const now = new Date();

    const userMessage: ChatMessage = {
      id,
      role: 'user',
      content: trimmed,
      timestamp: now,
    };

    const loadingMessage: ChatMessage = {
      id: `${id}-loading`,
      role: 'assistant',
      content: '',
      timestamp: now,
      isLoading: true,
    };

    this.messages.update((current) => [...current, userMessage, loadingMessage]);
    this.isLoading.set(true);

    try {
      const conversationId = await this.ensureConversation();
      const result = await this.api.propose(conversationId, trimmed);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.response || 'Done.',
        timestamp: new Date(),
        actions: result.actions,
        dataCards: result.data,
        links: result.links,
      };

      this.messages.update((current) =>
        current.filter((m) => m.id !== loadingMessage.id).concat(assistantMessage)
      );
    } catch {
      this.messages.update((current) =>
        current.filter((m) => m.id !== loadingMessage.id).concat({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
          timestamp: new Date(),
        })
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  async approveAndExecute(actionId: string): Promise<void> {
    const conversationId = await this.ensureConversation();
    await this.api.approveAction(conversationId, actionId);
    await this.api.executeAction(conversationId, actionId);
    this.updateActionStatus(actionId, 'executed');
  }

  async rejectAction(actionId: string): Promise<void> {
    const conversationId = await this.ensureConversation();
    await this.api.rejectAction(conversationId, actionId);
    this.updateActionStatus(actionId, 'rejected');
  }

  clearConversation(): void {
    this.messages.set([]);
    this.conversationId.set(null);
  }

  private async ensureConversation(): Promise<string> {
    const existing = this.conversationId();
    if (existing) {
      return existing;
    }
    const created = await this.api.createConversation();
    this.conversationId.set(created);
    return created;
  }

  private updateActionStatus(actionId: string, status: ChatAction['status']): void {
    this.messages.update((messages) =>
      messages.map((message) => {
        if (!message.actions || message.actions.length === 0) {
          return message;
        }
        return {
          ...message,
          actions: message.actions.map((action) =>
            action.id === actionId ? { ...action, status } : action
          ),
        };
      })
    );
  }
}
