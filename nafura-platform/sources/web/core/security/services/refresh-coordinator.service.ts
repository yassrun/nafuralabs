/**
 * Refresh Coordinator Service
 *
 * Implements single-flight pattern for token refresh to prevent race conditions.
 * Coordinates refresh across multiple tabs using BroadcastChannel.
 */

import { Injectable, inject } from '@angular/core';
import { AuthFacade } from './auth.facade';

interface RefreshMessage {
  type: 'refresh-started' | 'refresh-complete' | 'refresh-failed';
  tabId?: string;
  success?: boolean;
}

@Injectable({ providedIn: 'root' })
export class RefreshCoordinatorService {
  private refreshInFlight: Promise<boolean> | null = null;
  private readonly channel: BroadcastChannel | null = null;
  private readonly authFacade = inject(AuthFacade);
  private readonly tabId = this.generateTabId();

  constructor() {
    // Initialize BroadcastChannel if available (not in all browsers)
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('auth-refresh');

      // Listen for refresh events from other tabs
      this.channel.onmessage = (event: MessageEvent<RefreshMessage>) => {
        this.handleBroadcastMessage(event.data);
      };
    }
  }

  /**
   * Execute token refresh with single-flight pattern.
   * Multiple concurrent calls will share the same refresh promise.
   */
  async refreshToken(): Promise<boolean> {
    // If refresh already in flight, return the existing promise
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    // Notify other tabs that we're starting refresh
    this.broadcast({ type: 'refresh-started', tabId: this.tabId });

    // Start refresh
    this.refreshInFlight = this.authFacade.refreshToken()
      .then(result => {
        this.broadcast({ 
          type: result ? 'refresh-complete' : 'refresh-failed', 
          tabId: this.tabId,
          success: result 
        });
        return result;
      })
      .catch(error => {
        this.broadcast({ 
          type: 'refresh-failed', 
          tabId: this.tabId,
          success: false 
        });
        throw error;
      })
      .finally(() => {
        // Clear in-flight flag after a short delay to allow other tabs to sync
        setTimeout(() => {
          this.refreshInFlight = null;
        }, 100);
      });

    return this.refreshInFlight;
  }

  /**
   * Handle broadcast messages from other tabs.
   */
  private handleBroadcastMessage(message: RefreshMessage): void {
    // Ignore messages from this tab
    if (message.tabId === this.tabId) {
      return;
    }

    switch (message.type) {
      case 'refresh-started':
        // Another tab started refresh, wait for it to complete
        // The refresh promise will be set when we call refreshToken()
        break;

      case 'refresh-complete':
        // Another tab completed refresh successfully
        // Clear our in-flight flag and let next call trigger new refresh
        if (this.refreshInFlight) {
          this.refreshInFlight = null;
        }
        break;

      case 'refresh-failed':
        // Another tab failed refresh, clear our in-flight flag
        if (this.refreshInFlight) {
          this.refreshInFlight = null;
        }
        break;
    }
  }

  /**
   * Broadcast message to other tabs.
   */
  private broadcast(message: RefreshMessage): void {
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (error) {
        console.warn('Failed to broadcast refresh message:', error);
      }
    }
  }

  /**
   * Generate unique tab ID for this instance.
   */
  private generateTabId(): string {
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup: close broadcast channel.
   */
  ngOnDestroy(): void {
    if (this.channel) {
      this.channel.close();
    }
  }
}
