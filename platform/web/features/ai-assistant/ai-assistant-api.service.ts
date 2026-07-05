import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '../../core/config/api-config.service';
import { ChatAction, ChatDataCard, ChatLink } from './ai-assistant.types';

interface ConversationSessionResponse {
  id: string;
}

interface AgentActionResponseDto {
  id: string;
  title: string | null;
  toolKey: string;
  status: string;
  requiresApproval: boolean;
  resultJson?: string | null;
  error?: string | null;
}

interface AssistantTurnResponseDto {
  intent?: string;
  summary?: string | null;
  blocks?: Array<{ type: string; title?: string; content?: string; data?: Record<string, unknown> }>;
  links?: Array<{ label: string; route: string; icon?: string; autoNavigate?: boolean }>;
  actions?: AgentActionResponseDto[] | null;
  assistantMessage?: { content?: string | null } | null;
}

export interface AssistantProposeResponse {
  response: string;
  actions: ChatAction[];
  data: ChatDataCard[];
  links: ChatLink[];
}

@Injectable({ providedIn: 'root' })
export class AiAssistantApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  async createConversation(): Promise<string> {
    const url = this.resolveUrl('/api/ai/conversations');
    const response = await firstValueFrom(
      this.http.post<ConversationSessionResponse>(url, {
        mode: 'ASSISTANT',
      })
    );
    return response.id;
  }

  async propose(
    conversationId: string,
    message: string
  ): Promise<AssistantProposeResponse> {
    const url = this.resolveUrl(
      `/api/ai/conversations/${conversationId}/turn`
    );
    const response = await firstValueFrom(
      this.http.post<AssistantTurnResponseDto>(url, { content: message })
    );

    return {
      response: response.summary ?? response.assistantMessage?.content ?? '',
      actions: (response.actions ?? []).map((action) => this.toChatAction(action)),
      data: (response.blocks ?? [])
        .filter((block) => block.type === 'KPI' || block.type === 'LIST')
        .map((block) => ({
          title: block.title ?? 'Result',
          type: block.type === 'KPI' ? 'kpi' as const : 'list' as const,
          data: block.data ?? { value: block.content },
        })),
      links: (response.links ?? []).map((link) => ({
        label: link.label,
        route: link.route,
        icon: link.icon,
      })),
    };
  }

  async listActions(conversationId: string): Promise<ChatAction[]> {
    const url = this.resolveUrl(
      `/api/ai/conversations/${conversationId}/agent/actions`
    );
    const response = await firstValueFrom(
      this.http.get<AgentActionResponseDto[]>(url)
    );
    return (response ?? []).map((action) => this.toChatAction(action));
  }

  async approveAction(
    conversationId: string,
    actionId: string
  ): Promise<ChatAction> {
    const url = this.resolveUrl(
      `/api/ai/conversations/${conversationId}/agent/actions/${actionId}/approve`
    );
    const response = await firstValueFrom(this.http.post<AgentActionResponseDto>(url, {}));
    return this.toChatAction(response);
  }

  async rejectAction(
    conversationId: string,
    actionId: string
  ): Promise<ChatAction> {
    const url = this.resolveUrl(
      `/api/ai/conversations/${conversationId}/agent/actions/${actionId}/reject`
    );
    const response = await firstValueFrom(this.http.post<AgentActionResponseDto>(url, {}));
    return this.toChatAction(response);
  }

  async executeAction(
    conversationId: string,
    actionId: string
  ): Promise<ChatAction> {
    const url = this.resolveUrl(
      `/api/ai/conversations/${conversationId}/agent/actions/${actionId}/execute`
    );
    const response = await firstValueFrom(this.http.post<AgentActionResponseDto>(url, {}));
    return this.toChatAction(response);
  }

  private toChatAction(action: AgentActionResponseDto): ChatAction {
    return {
      id: action.id,
      description: action.title || action.toolKey,
      status: this.mapStatus(action.status),
      requiresConfirmation: action.requiresApproval,
    };
  }

  private mapStatus(status: string | null | undefined): ChatAction['status'] {
    switch ((status ?? '').toUpperCase()) {
      case 'APPROVED':
        return 'approved';
      case 'REJECTED':
        return 'rejected';
      case 'EXECUTED':
        return 'executed';
      case 'PENDING_APPROVAL':
      case 'PROPOSED':
      default:
        return 'pending';
    }
  }

  private resolveUrl(path: string): string {
    const base = this.apiConfig.getApiBaseUrl().replace(/\/+$/, '');
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalized}`;
  }
}
