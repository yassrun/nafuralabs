import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '../../../../core/config/api-config.service';

export type ConversationMode = 'ASK' | 'AGENT';

export interface ConversationSession {
  id: string;
  applicationId: string;
  title?: string | null;
  mode: ConversationMode;
  scopeType?: 'TENANT' | 'GLOBAL' | string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConversationMessage {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL' | string;
  content: string;
  requestId?: string | null;
  costUsd?: number | null;
  tokensIn?: number | null;
  tokensOut?: number | null;
  tokensTotal?: number | null;
  createdAt?: string;
}

export interface SendAskMessageRequest {
  content: string;
  systemInstruction?: string;
  responseSchema?: string;
  metadata?: Record<string, unknown>;
  domainKey?: string;
  featureKey?: string;
  resourceKey?: string;
  actionKey?: string;
}

export interface SendAskMessageResponse {
  conversation: ConversationSession;
  userMessage: ConversationMessage;
  assistantMessage: ConversationMessage;
}

export interface AgentProposeRequest {
  content: string;
  systemInstruction?: string;
  metadata?: Record<string, unknown>;
  domainKey?: string;
  featureKey?: string;
  resourceKey?: string;
  actionKey?: string;
}

export interface AgentRunResponse {
  id: string;
  status: string;
  model?: string | null;
  llmRequestId?: string | null;
  llmCostUsd?: number | null;
  error?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgentActionResponse {
  id: string;
  runId: string;
  toolKey: string;
  title?: string | null;
  actionKey?: string | null;
  permissionKey?: string | null;
  entitlementKey?: string | null;
  requiresApproval: boolean;
  status: 'PROPOSED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'FAILED' | string;
  argsJson?: string | null;
  resultJson?: string | null;
  error?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgentMessageResponse {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL' | string;
  content: string;
  requestId?: string | null;
  createdAt?: string;
}

export interface AgentProposeResponse {
  run: AgentRunResponse;
  actions: AgentActionResponse[];
  userMessage: AgentMessageResponse;
  assistantMessage: AgentMessageResponse;
}

export interface PagedConversationSessions {
  content: ConversationSession[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class ConversationApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  async createConversation(
    applicationId: string,
    mode: ConversationMode,
    title?: string
  ): Promise<ConversationSession> {
    return firstValueFrom(
      this.http.post<ConversationSession>(
        this.resolveUrl('/api/ai/conversations'),
        { applicationId, mode, title }
      )
    );
  }

  async listConversations(
    applicationId: string,
    page = 0,
    size = 20
  ): Promise<PagedConversationSessions> {
    const params = new HttpParams()
      .set('applicationId', applicationId)
      .set('page', String(page))
      .set('size', String(size));
    return firstValueFrom(
      this.http.get<PagedConversationSessions>(
        this.resolveUrl('/api/ai/conversations'),
        { params }
      )
    );
  }

  async listMessages(conversationId: string, applicationId: string): Promise<ConversationMessage[]> {
    const params = new HttpParams().set('applicationId', applicationId);
    return firstValueFrom(
      this.http.get<ConversationMessage[]>(
        this.resolveUrl(`/api/ai/conversations/${conversationId}/messages`),
        { params }
      )
    );
  }

  async sendAskMessage(
    conversationId: string,
    applicationId: string,
    request: SendAskMessageRequest
  ): Promise<SendAskMessageResponse> {
    const params = new HttpParams().set('applicationId', applicationId);
    return firstValueFrom(
      this.http.post<SendAskMessageResponse>(
        this.resolveUrl(`/api/ai/conversations/${conversationId}/messages`),
        request,
        { params }
      )
    );
  }

  async proposeActions(
    conversationId: string,
    applicationId: string,
    request: AgentProposeRequest
  ): Promise<AgentProposeResponse> {
    const params = new HttpParams().set('applicationId', applicationId);
    return firstValueFrom(
      this.http.post<AgentProposeResponse>(
        this.resolveUrl(`/api/ai/conversations/${conversationId}/agent/propose`),
        request,
        { params }
      )
    );
  }

  async listActions(conversationId: string, applicationId: string): Promise<AgentActionResponse[]> {
    const params = new HttpParams().set('applicationId', applicationId);
    return firstValueFrom(
      this.http.get<AgentActionResponse[]>(
        this.resolveUrl(`/api/ai/conversations/${conversationId}/agent/actions`),
        { params }
      )
    );
  }

  async approveAction(conversationId: string, actionId: string, applicationId: string): Promise<AgentActionResponse> {
    const params = new HttpParams().set('applicationId', applicationId);
    return firstValueFrom(
      this.http.post<AgentActionResponse>(
        this.resolveUrl(`/api/ai/conversations/${conversationId}/agent/actions/${actionId}/approve`),
        {},
        { params }
      )
    );
  }

  async rejectAction(conversationId: string, actionId: string, applicationId: string): Promise<AgentActionResponse> {
    const params = new HttpParams().set('applicationId', applicationId);
    return firstValueFrom(
      this.http.post<AgentActionResponse>(
        this.resolveUrl(`/api/ai/conversations/${conversationId}/agent/actions/${actionId}/reject`),
        {},
        { params }
      )
    );
  }

  async executeAction(conversationId: string, actionId: string, applicationId: string): Promise<AgentActionResponse> {
    const params = new HttpParams().set('applicationId', applicationId);
    return firstValueFrom(
      this.http.post<AgentActionResponse>(
        this.resolveUrl(`/api/ai/conversations/${conversationId}/agent/actions/${actionId}/execute`),
        {},
        { params }
      )
    );
  }

  private resolveUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    const base = this.apiConfig.getApiBaseUrl().replace(/\/+$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  }
}
