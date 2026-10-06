/**
 * SSE client for platform notifications (Bearer auth — EventSource cannot set headers).
 * Single host client: used by {@link PlatformNotificationsService}.
 */
import { Injectable, inject, signal } from '@angular/core';

import { ApiConfigService } from '../../core/config/api-config.service';
import { AuthFacade } from '../../core/security/services/auth.facade';
import { AuthStateStore } from '../../core/security/state/auth.state';
import { TenantContextService } from '../../core/tenant/tenant.context';

export type PlatformNotificationStreamPayload = {
  type?: string;
  reason?: string;
  id?: string;
  title?: string;
  body?: string;
  source?: string;
  actionUrl?: string;
  entityType?: string;
  entityId?: string;
  sentAt?: string;
  isRead?: boolean;
};

type StreamListener = (payload: PlatformNotificationStreamPayload) => void;

const STREAM_PATH = '/api/v1/platform/collaboration/notifications/stream';
const RECONNECT_MS = 5_000;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable({ providedIn: 'root' })
export class PlatformNotificationStreamService {
  private readonly apiConfig = inject(ApiConfigService);
  private readonly auth = inject(AuthFacade);
  private readonly authState = inject(AuthStateStore);
  private readonly tenantContext = inject(TenantContextService);

  private abort: AbortController | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly listeners = new Set<StreamListener>();

  readonly latestEvent = signal<PlatformNotificationStreamPayload | null>(null);
  readonly connected = signal(false);

  subscribe(listener: StreamListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  connect(): void {
    this.disconnect(false);
    const token = this.auth.accessToken();
    if (!token) {
      this.connected.set(false);
      return;
    }
    this.abort = new AbortController();
    void this.runStream(token, this.abort.signal);
  }

  disconnect(clearReconnect = true): void {
    if (clearReconnect && this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.abort?.abort();
    this.abort = null;
    this.connected.set(false);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer != null) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, RECONNECT_MS);
  }

  private dispatch(payload: PlatformNotificationStreamPayload): void {
    this.latestEvent.set(payload);
    for (const listener of this.listeners) {
      listener(payload);
    }
  }

  private async runStream(token: string, signal: AbortSignal): Promise<void> {
    const url = `${this.apiConfig.apiBaseUrl()}${STREAM_PATH}`;
    const tenantId = this.resolveTenantId();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    };
    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal,
      });
      if (!response.ok || !response.body) {
        this.connected.set(false);
        this.scheduleReconnect();
        return;
      }

      this.connected.set(true);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        buffer = this.consumeBuffer(buffer);
      }
      this.connected.set(false);
      if (!signal.aborted) {
        this.scheduleReconnect();
      }
    } catch {
      this.connected.set(false);
      if (!signal.aborted) {
        this.scheduleReconnect();
      }
    }
  }

  private consumeBuffer(buffer: string): string {
    const blocks = buffer.split('\n\n');
    const remainder = blocks.pop() ?? '';
    for (const block of blocks) {
      const payload = this.parseSseBlock(block);
      if (payload) {
        this.dispatch(payload);
      }
    }
    return remainder;
  }

  private parseSseBlock(block: string): PlatformNotificationStreamPayload | null {
    let eventName = 'message';
    const dataLines: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim());
      }
    }
    if (dataLines.length === 0) {
      return null;
    }
    const raw = dataLines.join('\n');
    try {
      return JSON.parse(raw) as PlatformNotificationStreamPayload;
    } catch {
      return { type: eventName, title: raw };
    }
  }

  private resolveTenantId(): string | null {
    let tenantId = this.tenantContext.tenantId();
    if (!tenantId) {
      tenantId = this.authState.currentTenantId();
    }
    if (!tenantId) {
      tenantId = this.authState.loadPersistedSession()?.tenantId ?? null;
    }
    return tenantId && UUID_RE.test(tenantId) ? tenantId : null;
  }
}
