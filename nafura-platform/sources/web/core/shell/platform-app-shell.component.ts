import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  Signal,
  Type,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { filter, map, startWith } from 'rxjs';

import { SidebarBadgeProvider, SidebarNode, ZoneConfig } from '../navigation/sidebar.types';
import { SidebarNavComponent } from '../navigation/sidebar-nav.component';
import { displayLabel, filterVisibleNodes, findActiveLabel } from '../navigation/sidebar-tree';
import { I18nService } from '../i18n';
import { AuthFacade } from '../security/services/auth.facade';
import { LanguageSelectorComponent } from '../components/language-selector/language-selector.component';
import { NotificationBellComponent } from '../../app/notification';
import { AiPanelService } from './ai-panel.service';
import { AiToggleWidget } from './widgets/ai-toggle.widget';
import { OrgSwitcherWidget } from './widgets/org-switcher.widget';
import { TenantMenuWidget } from './widgets/tenant-menu.widget';
import { UserMenuWidget } from './widgets/user-menu.widget';
import { ORG_CONTEXT_PORT } from './org-context.port';
import { ChatPanelComponent } from '../../features/ai-assistant/chat-panel.component';
import { CommandPaletteComponent } from './command-palette/command-palette.component';
import { CommandPaletteService } from './command-palette/command-palette.service';
import {
  AgentActionResponse,
  ConversationApiService,
  ConversationMessage,
  ConversationMode,
  ConversationSession,
  AssistantBlock,
  AssistantLink,
} from '../../app/conversation/services/conversation-api.service';
import { ONBOARDING_WIDGETS_PORT, SHELL_EXTENSIONS, componentForSlot } from './shell-extensions';
import { AssistantBlockRendererComponent } from '../../app/conversation/components/assistant-block-renderer.component';
import {
  DEFAULT_PLATFORM_APP_SHELL_OPTIONS,
  PlatformAppShellOptions,
} from './platform-app-shell.types';
import { ThemeService, ThemeModeService, type TenantBranding } from '../theme';
import { ShortcutsService } from '../shortcuts/shortcuts.service';
import { ShortcutsHelpComponent } from '../shortcuts/shortcuts-help.component';
import { OnboardingTourComponent } from '../onboarding/onboarding-tour.component';
import { OnboardingService } from '../onboarding/onboarding.service';
import { ApiConfigService } from '../config/api-config.service';
import { AppSettingsApiService } from '../../features/app-settings/models';
import { ApprovalsFacade } from '../../features/approvals/services/approvals-facade.service';
import { environment } from '@env';
import { TooltipDirective } from '../../lib/anatomy/components/atoms/tooltip/tooltip.directive';

type UiMessageRole = 'user' | 'assistant' | 'system' | 'tool';

interface UiConversationMessage {
  id: string;
  role: UiMessageRole;
  content: string;
  createdAt?: string;
  blocks?: AssistantBlock[];
  links?: AssistantLink[];
  summary?: string | null;
}

@Component({
  selector: 'app-platform-shell',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet, RouterModule, LucideAngularModule, SidebarNavComponent, LanguageSelectorComponent, NotificationBellComponent, AiToggleWidget, UserMenuWidget, TenantMenuWidget, OrgSwitcherWidget, CommandPaletteComponent, ChatPanelComponent, ShortcutsHelpComponent, OnboardingTourComponent, TooltipDirective, AssistantBlockRendererComponent],
  template: `
    <div
      class="naf-shell"
      [class.naf-shell--sidebar-collapsed]="sidebarCollapsed()"
      [class.naf-shell--mobile-nav-open]="mobileNavOpen()"
      [class.naf-shell--conversation-open]="conversationOpen()"
      [class.naf-shell--conversation-overlay]="conversationOverlay()">

      <!-- ═══ TOPBAR ═══ -->
      <header class="naf-shell__topbar">
        <div class="naf-shell__topbar-left">
          <button
            type="button"
            class="naf-shell__icon-btn naf-shell__icon-btn--ghost"
            [disabled]="!resolvedShellOptions().sidebar.collapsible"
            (click)="toggleSidebar()"
            [attr.aria-label]="sidebarCollapsed() ? 'Expand navigation' : 'Collapse navigation'">
            <lucide-icon name="menu" [size]="20" class="naf-shell__icon" aria-hidden="true"></lucide-icon>
          </button>

          <div class="naf-shell__app-identity">
            <!-- Brand lockup lives in the sidebar only; topbar shows page context. -->
            <span
              class="naf-shell__page-title"
              *ngIf="resolvedShellOptions().topbar.showPageTitle && currentPageLabel() !== applicationTitle()">
              {{ translateLabel(currentPageLabel()) }}
            </span>
          </div>
        </div>

        <div class="naf-shell__topbar-center">
          <button
            *ngIf="resolvedShellOptions().widgets.search"
            type="button"
            class="naf-shell__search-trigger"
            [attr.aria-label]="translateLabel('core.search.trigger')"
            (click)="commandPalette.toggle()">
            <lucide-icon name="search" [size]="18" class="naf-shell__icon naf-shell__search-icon" aria-hidden="true"></lucide-icon>
            <span class="naf-shell__search-label">{{ translateLabel(resolvedShellOptions().search.placeholder || 'core.search.placeholder') }}</span>
            <kbd class="naf-shell__search-kbd">{{ searchShortcutLabel }}</kbd>
          </button>
        </div>

        <div class="naf-shell__topbar-right">
          @for (ext of headerExtensions(); track ext.component) {
            <ng-container *ngComponentOutlet="ext.component" />
          }
          @if (showDefaultOrgSwitcher()) {
            <nf-org-switcher />
          }

          @if (tenantSettingsEnabled()) {
            <nf-tenant-menu
              [tenantSettingsEnabled]="true"
              [tenantSettingsRoute]="'/organization/settings'"
              [organizationIdentityEnabled]="true"
              [organizationIdentityRoute]="'/organization/identity'"
              [fallbackName]="applicationTitle()" />
          }

          <app-language-selector *ngIf="resolvedShellOptions().widgets.languageSwitch" />

          @if (resolvedShellOptions().widgets.notifications) {
            @if (notificationWidget(); as ext) {
              <ng-container *ngComponentOutlet="ext" />
            } @else {
              <nf-notification-bell />
            }
          }

          @if (resolvedShellOptions().widgets.conversation && resolvedShellOptions().conversation.enabled) {
            @if (aiWidget(); as ext) {
              <ng-container *ngComponentOutlet="ext" />
            } @else {
              <nf-ai-toggle />
            }
          }
        </div>
      </header>

      <!-- ═══ WORKSPACE ═══ -->
      @if (mobileNavOpen()) {
        <button
          type="button"
          class="naf-shell__mobile-backdrop"
          aria-label="Fermer la navigation"
          (click)="closeMobileNav()"></button>
      }
      <div class="naf-shell__workspace">

        <!-- ═══ SIDEBAR ═══ -->
        <aside class="naf-shell__sidebar">
          <div class="naf-shell__sidebar-header">
            <img
              *ngIf="themeService.branding()?.logoUrl && !sidebarCollapsed()"
              [src]="brandingLogoUrl()"
              alt=""
              class="naf-shell__sidebar-logo" />
            <span
              *ngIf="applicationId() === 'erp' && (!themeService.branding()?.logoUrl || sidebarCollapsed())"
              class="naf-shell__sidebar-mark"
              aria-hidden="true">
              <svg viewBox="0 0 120 120" width="18" height="18" focusable="false">
                <rect x="26" y="26" width="68" height="68" rx="8" fill="none" stroke="#DCE6FF" stroke-width="6"/>
                <path d="M34 86 L80 86 A46 46 0 0 0 34 40 Z" fill="#F2D544"/>
                <circle cx="34" cy="40" r="6" fill="#DCE6FF"/>
              </svg>
            </span>
            <span
              *ngIf="(!themeService.branding()?.logoUrl || sidebarCollapsed()) && themeService.branding()?.tenantDisplayName"
              class="naf-shell__sidebar-name">{{ themeService.branding()?.tenantDisplayName }}</span>
            <span
              *ngIf="(!themeService.branding()?.logoUrl || sidebarCollapsed()) && !themeService.branding()?.tenantDisplayName && applicationId() === 'erp'"
              class="naf-shell__sidebar-lockup">
              <span class="naf-shell__sidebar-name">{{ applicationTitle() }}</span>
              <span class="naf-shell__sidebar-byline">by nafuralabs</span>
            </span>
            <span
              *ngIf="(!themeService.branding()?.logoUrl || sidebarCollapsed()) && !themeService.branding()?.tenantDisplayName && applicationId() !== 'erp'"
              class="naf-shell__sidebar-name">{{ applicationTitle() }}</span>
          </div>
          <nf-sidebar-nav
            [nodes]="navigationWithBadges()"
            [zones]="zoneConfig()"
            [collapsed]="sidebarCollapsed()"
            (expandRequest)="sidebarCollapsed.set(false)"
            (navigated)="closeMobileNav()" />

          @if (resolvedShellOptions().widgets.userMenu) {
            <footer class="naf-shell__sidebar-footer">
              @if (userMenuWidget(); as ext) {
                <ng-container *ngComponentOutlet="ext" />
              } @else {
                <nf-user-menu
                  [userSettingsEnabled]="userSettingsEnabled()"
                  [fallbackName]="applicationTitle()" />
              }
            </footer>
          }
        </aside>

        <!-- ═══ MAIN CONTENT ═══ -->
        <main class="naf-shell__content">
          @if (onboardingInviteWidget()) {
            <ng-container *ngComponentOutlet="onboardingInviteWidget()!" />
          }
          <router-outlet />
        </main>

        <!-- ═══ AI CONVERSATION PANEL ═══ -->
        <aside
          *ngIf="resolvedShellOptions().conversation.enabled"
          class="naf-shell__conversation"
          [attr.aria-hidden]="!conversationOpen()">
          <div class="naf-shell__conversation-header">
            <div class="naf-shell__conversation-title">
              {{ translateLabel(resolvedShellOptions().conversation.title) }}
            </div>
            <button
              type="button"
              class="naf-shell__icon-btn naf-shell__icon-btn--ghost naf-shell__icon-btn--sm"
              [attr.aria-label]="translateLabel('core.conversation.close')"
              (click)="toggleConversation()">
              <lucide-icon name="x" [size]="18" class="naf-shell__icon" aria-hidden="true"></lucide-icon>
            </button>
          </div>

          <div class="naf-shell__conversation-sessions">
            <button
              type="button"
              class="naf-shell__session-new"
              [attr.aria-label]="translateLabel('core.conversation.newChat')"
              (click)="startNewConversation()">
              <lucide-icon name="plus" [size]="14" class="naf-shell__icon" aria-hidden="true"></lucide-icon>
            </button>
            <select
              class="naf-shell__session-select"
              [value]="conversationSessionIds()[conversationMode()] ?? ''"
              (change)="onConversationSelect($event)">
              @if (conversationSessions().length === 0) {
                <option value="">{{ translateLabel('core.conversation.noHistory') }}</option>
              }
              @for (session of conversationSessions(); track session.id) {
                <option [value]="session.id">{{ conversationSessionLabel(session) }}</option>
              }
            </select>
          </div>

          <div #conversationBody class="naf-shell__conversation-body" [attr.aria-busy]="conversationSending() || conversationLoading()">
            <div
              *ngIf="conversationLoading() && !conversationSending() && conversationMessages().length === 0"
              class="naf-shell__conversation-state">
              {{ translateLabel('core.conversation.loading') }}
            </div>

            <div
              *ngIf="conversationLoading() && !conversationSending() && conversationMessages().length > 0"
              class="naf-shell__conversation-state">
              {{ translateLabel('core.conversation.refreshing') }}
            </div>

            <div *ngIf="conversationError()" class="naf-shell__conversation-error">
              {{ conversationError() }}
            </div>

            <div
              *ngIf="!conversationLoading() && !conversationError() && conversationMessages().length === 0"
              class="naf-shell__message naf-shell__message--assistant">
              <div class="naf-shell__message-role">{{ translateLabel('core.conversation.agent') }}</div>
              <div class="naf-shell__message-text">{{ translateLabel('core.conversation.welcome') }}</div>
            </div>

            <div
              *ngFor="let message of visibleConversationMessages(); trackBy: trackByMessage"
              class="naf-shell__message"
              [class.naf-shell__message--user]="message.role === 'user'"
              [class.naf-shell__message--assistant]="message.role === 'assistant'">
              <div class="naf-shell__message-role">{{ messageRoleLabel(message.role) }}</div>
              <div class="naf-shell__message-text" *ngIf="displayAssistantContent(message)">{{ displayAssistantContent(message) }}</div>
              @if (hasStructuredAssistantExtras(message)) {
                <nf-assistant-block-renderer
                  [summary]="assistantSummaryForRender(message)"
                  [blocks]="assistantBlocksForRender(message)"
                  [links]="message.links ?? []"
                  (navigate)="navigateConversationLink($event)" />
              }
            </div>

            <div
              *ngIf="conversationSending()"
              class="naf-shell__message naf-shell__message--assistant naf-shell__message--pending">
              <div class="naf-shell__message-role">{{ translateLabel('core.conversation.agent') }}</div>
              <div class="naf-shell__message-text naf-shell__message-pending">
                <span class="naf-shell__pending-dots" aria-hidden="true"></span>
                {{ translateLabel('core.conversation.preparingReply') }}
              </div>
            </div>

            <div *ngIf="agentActions().length" class="naf-shell__agent-block">
              <div class="naf-shell__agent-title">
                {{ translateLabel('core.conversation.actions.title') }}
              </div>

              <div
                *ngFor="let action of agentActions(); trackBy: trackByAgentAction"
                class="naf-shell__agent-action">
                <div class="naf-shell__agent-action-header">
                  <div class="naf-shell__agent-action-name">
                    {{ action.title || action.actionKey || action.toolKey }}
                  </div>
                  <div class="naf-shell__agent-action-status">
                    {{ agentStatusLabel(action.status) }}
                  </div>
                </div>

                <div class="naf-shell__agent-action-buttons">
                  <button
                    *ngIf="canApprove(action)"
                    type="button"
                    class="naf-shell__agent-btn"
                    [disabled]="agentActionBusyId() === action.id"
                    (click)="approveAction(action.id)">
                    {{ translateLabel('core.conversation.actions.approve') }}
                  </button>
                  <button
                    *ngIf="canApprove(action)"
                    type="button"
                    class="naf-shell__agent-btn naf-shell__agent-btn--ghost"
                    [disabled]="agentActionBusyId() === action.id"
                    (click)="rejectAction(action.id)">
                    {{ translateLabel('core.conversation.actions.reject') }}
                  </button>
                  <button
                    *ngIf="canExecute(action)"
                    type="button"
                    class="naf-shell__agent-btn"
                    [disabled]="agentActionBusyId() === action.id"
                    (click)="executeAction(action.id)">
                    {{ translateLabel('core.conversation.actions.execute') }}
                  </button>
                </div>

                <div *ngIf="action.error" class="naf-shell__agent-action-error">{{ action.error }}</div>
              </div>

              <div *ngIf="agentActions().length === 0" class="naf-shell__agent-empty">
                {{ translateLabel('core.conversation.actions.empty') }}
              </div>
            </div>
          </div>

          <div class="naf-shell__conversation-composer">
            <textarea
              class="naf-shell__conversation-input"
              rows="3"
              [value]="conversationDraft()"
              [placeholder]="translateLabel('core.conversation.placeholder')"
              [disabled]="conversationSending()"
              (input)="onConversationDraftInput($event)"
              (keydown)="onConversationKeydown($event)"></textarea>
            <div class="naf-shell__conversation-composer-actions">
              <span class="naf-shell__conversation-hint">{{ translateLabel('core.conversation.sendHint') }}</span>
              <button
                type="button"
                class="naf-shell__conversation-send"
                [disabled]="!conversationDraft().trim() || conversationSending()"
                (click)="sendConversationMessage()">
                <lucide-icon name="send" [size]="16" class="naf-shell__icon" aria-hidden="true"></lucide-icon>
                {{
                  conversationSending()
                    ? translateLabel('core.conversation.sendInProgress')
                    : translateLabel('core.conversation.send')
                }}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>

    @if (commandPalette.open()) {
      <nf-command-palette />
    }

    @if (shortcutsHelpOpen()) {
      <nf-shortcuts-help (close)="shortcutsHelpOpen.set(false)"></nf-shortcuts-help>
    }

    <!-- Onboarding tour overlay -->
    <nf-onboarding-tour></nf-onboarding-tour>

    <!-- Help / tour trigger button -->
    @if (resolvedShellOptions().widgets.conversation) {
      <button
        class="naf-shell__tour-btn"
        [nfTooltip]="tourHelpTooltip"
        position="left"
        (click)="onboarding.start('shell')">
        ?
      </button>
    }

    @if (!resolvedShellOptions().conversation.enabled) {
      <nf-chat-panel />
    }
  `,
  styles: [`
    /* ═══════════════════════════════════════════════════════════════════════
       HOST
       ═══════════════════════════════════════════════════════════════════════ */
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 100vh;
    }

    .naf-shell__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      flex-shrink: 0;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       SHELL GRID
       ═══════════════════════════════════════════════════════════════════════ */
    .naf-shell {
      --_sidebar-w: 260px;
      --_sidebar-collapsed-w: 64px;
      --_topbar-h: 48px;
      display: grid;
      grid-template-rows: var(--_topbar-h) 1fr;
      min-height: 100vh;
      background: var(--nf-surface-page, #f9fafb);
      color: var(--nf-text-primary, #111827);
      font-family: var(--nf-font-family-sans, sans-serif);
    }

    /* ═══════════════════════════════════════════════════════════════════════
       TOPBAR
       ═══════════════════════════════════════════════════════════════════════ */
    .naf-shell__topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--nf-space-3, 0.75rem);
      border-bottom: 1px solid var(--nf-border-default, #e5e7eb);
      padding: 0 var(--nf-space-4, 1rem);
      background: var(--nf-color-surface, #ffffff);
      position: sticky;
      top: 0;
      z-index: var(--nf-z-sticky, 200);
      height: var(--_topbar-h);
    }

    .naf-shell__topbar-left,
    .naf-shell__topbar-right {
      display: flex;
      align-items: center;
      gap: var(--nf-space-2, 0.5rem);
      min-width: 0;
    }

    .naf-shell__topbar-center {
      flex: 1;
      display: flex;
      justify-content: center;
      min-width: 0;
    }

    /* ─── App Identity ─── */
    .naf-shell__app-identity {
      display: flex;
      align-items: center;
      gap: var(--nf-space-2, 0.5rem);
      min-width: 0;
    }

    .naf-shell__brand-mark,
    .naf-shell__sidebar-mark {
      display: inline-grid;
      place-items: center;
      flex: 0 0 auto;
      width: 28px;
      height: 28px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--nf-color-primary-700, #122a75), var(--nf-color-primary-500, #1b3fae));
      color: var(--nf-color-text-inverse, #ffffff);
      font-size: var(--nf-font-size-sm, 0.875rem);
      font-weight: var(--nf-font-weight-bold, 700);
      letter-spacing: -0.03em;
      box-shadow: 0 8px 18px rgba(27, 63, 174, 0.22);
    }

    .naf-shell__app-name {
      font-size: var(--nf-font-size-sm, 0.875rem);
      font-weight: var(--nf-font-weight-bold, 700);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
      color: var(--nf-text-primary, #111827);
    }

    .naf-shell__page-title {
      font-size: var(--nf-font-size-sm, 0.875rem);
      font-weight: var(--nf-font-weight-medium, 500);
      color: var(--nf-text-primary, #111827);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 280px;
    }

    /* ─── Search Trigger ─── */
    .naf-shell__search-trigger {
      display: flex;
      align-items: center;
      gap: var(--nf-space-2, 0.5rem);
      padding: var(--nf-space-1-5, 0.375rem) var(--nf-space-3, 0.75rem);
      height: 34px;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: var(--nf-radius-lg, 0.5rem);
      background: var(--nf-color-bg-subtle, #f9fafb);
      color: var(--nf-text-muted, #6b7280);
      cursor: pointer;
      font-size: var(--nf-font-size-sm, 0.875rem);
      line-height: 1.2;
      min-width: 240px;
      max-width: 400px;
      transition: border-color var(--nf-transition-fast, 100ms ease),
                  background var(--nf-transition-fast, 100ms ease);
    }

    .naf-shell__search-trigger:hover {
      border-color: var(--nf-border-strong, #d1d5db);
      background: var(--nf-color-surface, #ffffff);
    }

    .naf-shell__search-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      color: var(--nf-text-muted, #6b7280);
    }

    .naf-shell__search-label {
      flex: 1;
      min-width: 0;
      display: block;
      text-align: start;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
    }

    .naf-shell__search-kbd {
      font-family: var(--nf-font-family-sans, sans-serif);
      font-size: var(--nf-font-size-xs, 0.75rem);
      padding: var(--nf-space-0-5, 0.125rem) var(--nf-space-1-5, 0.375rem);
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: var(--nf-radius-sm, 0.25rem);
      background: var(--nf-color-surface, #ffffff);
      color: var(--nf-text-muted, #6b7280);
      line-height: 1.2;
      flex-shrink: 0;
    }

    /* ─── Icon Buttons ─── */
    .naf-shell__icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: var(--nf-radius-lg, 0.5rem);
      border: 1px solid var(--nf-border-default, #e5e7eb);
      background: var(--nf-color-surface, #ffffff);
      color: var(--nf-text-secondary, #4b5563);
      cursor: pointer;
      transition: background var(--nf-transition-fast, 100ms ease),
                  border-color var(--nf-transition-fast, 100ms ease);
    }

    .naf-shell__icon-btn:hover:not(:disabled) {
      background: var(--nf-surface-hover, #f9fafb);
      border-color: var(--nf-border-strong, #d1d5db);
    }

    .naf-shell__icon-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .naf-shell__icon-btn.is-active {
      border-color: var(--nf-color-primary-300, #93c5fd);
      background: var(--nf-primary-subtle, #eff6ff);
      color: var(--nf-color-primary-700, #1d4ed8);
    }

    .naf-shell__icon-btn--ghost {
      border-color: transparent;
      background: transparent;
    }

    .naf-shell__icon-btn--ghost:hover:not(:disabled) {
      background: var(--nf-surface-hover, #f9fafb);
      border-color: transparent;
    }

    .naf-shell__icon-btn--sm {
      width: 28px;
      height: 28px;
    }

    .naf-shell__icon-btn--sm .naf-shell__icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    @media (pointer: coarse) {
      .naf-shell__icon-btn {
        width: 40px;
        height: 40px;
      }

      .naf-shell__search-trigger {
        height: 40px;
      }

    }

    /* ─── Tour button ─── */
    .naf-shell__tour-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1.5px solid var(--nf-border-default, #e5e7eb);
      background: var(--nf-color-surface, #fff);
      color: var(--nf-text-tertiary, #64748b);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 80ms;
    }
    .naf-shell__tour-btn:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
      color: #0f172a;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       WORKSPACE GRID
       ═══════════════════════════════════════════════════════════════════════ */
    .naf-shell__workspace {
      display: grid;
      grid-template-columns: var(--_sidebar-w) 1fr;
      min-height: 0;
      height: 100%;
      max-height: calc(100vh - var(--_topbar-h, 48px));
      overflow: hidden;
      transition: grid-template-columns var(--nf-transition-slow, 200ms ease);
    }

    .naf-shell--sidebar-collapsed .naf-shell__workspace {
      grid-template-columns: var(--_sidebar-collapsed-w) 1fr;
    }

    .naf-shell--conversation-open .naf-shell__workspace {
      grid-template-columns: var(--_sidebar-w) 1fr minmax(340px, 24vw);
    }

    .naf-shell--sidebar-collapsed.naf-shell--conversation-open .naf-shell__workspace {
      grid-template-columns: var(--_sidebar-collapsed-w) 1fr minmax(340px, 24vw);
    }

    /* Finance/journaux: overlay panel so wide accounting tables keep full width */
    .naf-shell--conversation-open.naf-shell--conversation-overlay .naf-shell__workspace {
      grid-template-columns: var(--_sidebar-w) 1fr;
    }

    .naf-shell--sidebar-collapsed.naf-shell--conversation-open.naf-shell--conversation-overlay .naf-shell__workspace {
      grid-template-columns: var(--_sidebar-collapsed-w) 1fr;
    }

    .naf-shell--conversation-open.naf-shell--conversation-overlay .naf-shell__conversation {
      position: fixed;
      top: var(--_topbar-h, 3.5rem);
      right: 0;
      bottom: 0;
      width: min(380px, 92vw);
      z-index: 120;
      box-shadow: var(--nf-shadow-lg, 0 10px 30px rgba(2, 6, 23, 0.12));
    }

    /* ═══════════════════════════════════════════════════════════════════════
       SIDEBAR
       ═══════════════════════════════════════════════════════════════════════ */
    .naf-shell__sidebar-header {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: var(--nf-space-2-5, 0.625rem);
      min-height: 40px;
      padding: var(--nf-space-2, 0.5rem) var(--nf-space-2, 0.5rem);
      margin-bottom: var(--nf-space-2, 0.5rem);
      border-bottom: 1px solid var(--nf-border-default, #e5e7eb);
    }
    .naf-shell__sidebar-logo {
      flex-shrink: 0;
      max-height: 40px;
      width: auto;
      object-fit: contain;
      display: block;
    }
    .naf-shell__sidebar-mark {
      flex-shrink: 0;
    }
    .naf-shell__sidebar-name {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--nf-color-text, #111827);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .naf-shell__sidebar-lockup {
      display: inline-flex;
      align-items: baseline;
      gap: 0.35rem;
      min-width: 0;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .naf-shell__sidebar-byline {
      font-size: 0.6875rem;
      font-weight: 400;
      color: var(--nf-text-muted, #6b7280);
      letter-spacing: 0.01em;
      flex-shrink: 0;
    }

    .naf-shell--sidebar-collapsed .naf-shell__sidebar-name,
    .naf-shell--sidebar-collapsed .naf-shell__sidebar-lockup {
      display: none;
    }
    .naf-shell__sidebar {
      border-inline-end: 1px solid var(--nf-border-default, #e5e7eb);
      background: var(--nf-color-surface, #ffffff);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      overflow-x: hidden;
      padding: var(--nf-space-3, 0.75rem) var(--nf-space-2, 0.5rem);
      /* Scroll shadow indicators */
      background:
        linear-gradient(var(--nf-color-surface, #ffffff) 30%, transparent) top,
        linear-gradient(transparent, var(--nf-color-surface, #ffffff) 70%) bottom,
        radial-gradient(farthest-side at 50% 0, rgba(0,0,0,0.06), transparent) top,
        radial-gradient(farthest-side at 50% 100%, rgba(0,0,0,0.06), transparent) bottom;
      background-repeat: no-repeat;
      background-size: 100% 32px, 100% 32px, 100% 8px, 100% 8px;
      background-attachment: local, local, scroll, scroll;
    }

    .naf-shell__sidebar-footer {
      flex: 0 0 auto;
      margin-top: var(--nf-space-3, 0.75rem);
      padding-top: var(--nf-space-3, 0.75rem);
      border-top: 1px solid var(--nf-border-default, #e5e7eb);
    }

    /* Navigation (zones, domains, links): nf-sidebar-nav, core/navigation. */

    /* ═══════════════════════════════════════════════════════════════════════
       MAIN CONTENT
       ═══════════════════════════════════════════════════════════════════════ */
    .naf-shell__content {
      min-width: 0;
      overflow: auto;
      padding: 0;
      background: var(--nf-surface-page, #f9fafb);
    }

    /* ═══════════════════════════════════════════════════════════════════════
       CONVERSATION PANEL
       ═══════════════════════════════════════════════════════════════════════ */
    .naf-shell__conversation {
      border-inline-start: 1px solid var(--nf-border-default, #e5e7eb);
      background: var(--nf-color-surface, #ffffff);
      display: none;
      grid-template-rows: auto auto auto 1fr auto;
      min-width: 0;
      min-height: 0;
      height: 100%;
      max-height: 100%;
      overflow: hidden;
    }

    .naf-shell--conversation-open .naf-shell__conversation {
      display: grid;
    }

    .naf-shell__conversation-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--nf-space-2, 0.5rem);
      padding: var(--nf-space-3, 0.75rem);
      border-bottom: 1px solid var(--nf-border-default, #e5e7eb);
    }

    .naf-shell__conversation-title {
      font-size: var(--nf-font-size-sm, 0.875rem);
      font-weight: var(--nf-font-weight-semibold, 600);
      color: var(--nf-text-primary, #111827);
    }

    .naf-shell__conversation-modes {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--nf-space-1, 0.25rem);
      padding: var(--nf-space-2, 0.5rem) var(--nf-space-3, 0.75rem);
      border-bottom: 1px solid var(--nf-border-subtle, #f3f4f6);
    }

    .naf-shell__mode-btn {
      border: 1px solid var(--nf-border-default, #e5e7eb);
      background: var(--nf-color-surface, #ffffff);
      color: var(--nf-text-secondary, #4b5563);
      font-size: var(--nf-font-size-xs, 0.75rem);
      font-weight: var(--nf-font-weight-semibold, 600);
      border-radius: var(--nf-radius-md, 0.375rem);
      padding: var(--nf-space-1-5, 0.375rem) var(--nf-space-2, 0.5rem);
      cursor: pointer;
      transition: background var(--nf-transition-fast, 100ms ease),
                  border-color var(--nf-transition-fast, 100ms ease);
    }

    .naf-shell__mode-btn.is-active {
      border-color: var(--nf-color-primary-300, #93c5fd);
      background: var(--nf-primary-subtle, #eff6ff);
      color: var(--nf-color-primary-700, #1d4ed8);
    }

    .naf-shell__conversation-sessions {
      display: flex;
      align-items: center;
      gap: var(--nf-space-2, 0.5rem);
      padding: 0 var(--nf-space-3, 0.75rem) var(--nf-space-2, 0.5rem);
      border-bottom: 1px solid var(--nf-border-subtle, #f3f4f6);
    }

    .naf-shell__session-new {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: var(--nf-radius-md, 0.375rem);
      background: var(--nf-color-surface, #ffffff);
      color: var(--nf-color-primary, #3b82f6);
      cursor: pointer;
      flex-shrink: 0;
    }

    .naf-shell__session-new:hover {
      background: var(--nf-primary-subtle, #eff6ff);
    }

    .naf-shell__session-select {
      flex: 1;
      min-width: 0;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: var(--nf-radius-md, 0.375rem);
      padding: var(--nf-space-1-5, 0.375rem) var(--nf-space-2, 0.5rem);
      font-size: var(--nf-font-size-xs, 0.75rem);
      color: var(--nf-text-primary, #111827);
      background: var(--nf-color-surface, #ffffff);
    }

    .naf-shell__conversation-body {
      padding: var(--nf-space-3, 0.75rem);
      display: flex;
      flex-direction: column;
      gap: var(--nf-space-2, 0.5rem);
      overflow-y: auto;
      min-height: 0;
    }

    .naf-shell__conversation-state {
      border: 1px solid var(--nf-color-info-100, #e0f2fe);
      background: var(--nf-color-info-50, #f0f9ff);
      color: var(--nf-color-info-700, #0369a1);
      border-radius: var(--nf-radius-lg, 0.5rem);
      padding: var(--nf-space-2, 0.5rem) var(--nf-space-3, 0.75rem);
      font-size: var(--nf-font-size-sm, 0.875rem);
    }

    .naf-shell__conversation-error {
      border: 1px solid var(--nf-color-danger-100, #fee2e2);
      background: var(--nf-danger-subtle, #fef2f2);
      color: var(--nf-color-danger-700, #b91c1c);
      border-radius: var(--nf-radius-lg, 0.5rem);
      padding: var(--nf-space-2, 0.5rem) var(--nf-space-3, 0.75rem);
      font-size: var(--nf-font-size-sm, 0.875rem);
    }

    .naf-shell__message {
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: var(--nf-radius-xl, 0.75rem);
      padding: var(--nf-space-2-5, 0.625rem) var(--nf-space-3, 0.75rem);
      background: var(--nf-color-bg-subtle, #f9fafb);
    }

    .naf-shell__message--user {
      background: var(--nf-primary-subtle, #eff6ff);
      border-color: var(--nf-color-primary-200, #bfdbfe);
    }

    .naf-shell__message-role {
      font-size: var(--nf-font-size-xs, 0.75rem);
      color: var(--nf-text-muted, #6b7280);
      margin-bottom: var(--nf-space-1, 0.25rem);
      font-weight: var(--nf-font-weight-semibold, 600);
    }

    .naf-shell__message-text {
      font-size: var(--nf-font-size-sm, 0.875rem);
      color: var(--nf-text-primary, #111827);
      white-space: pre-wrap;
      line-height: var(--nf-line-height-normal, 1.5);
    }

    .naf-shell__message--pending {
      border-style: dashed;
      opacity: 0.92;
    }

    .naf-shell__message-pending {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--nf-text-muted, #6b7280);
      font-style: italic;
    }

    .naf-shell__pending-dots {
      width: 0.55rem;
      height: 0.55rem;
      border-radius: 50%;
      background: var(--nf-color-primary-500, #2563eb);
      animation: naf-shell-pending-pulse 0.9s ease-in-out infinite;
    }

    @keyframes naf-shell-pending-pulse {
      0%, 100% { opacity: 0.35; transform: scale(0.85); }
      50% { opacity: 1; transform: scale(1); }
    }

    .naf-shell__agent-block {
      margin-top: var(--nf-space-2, 0.5rem);
      border-top: 1px solid var(--nf-border-default, #e5e7eb);
      padding-top: var(--nf-space-2, 0.5rem);
      display: flex;
      flex-direction: column;
      gap: var(--nf-space-2, 0.5rem);
    }

    .naf-shell__agent-title {
      font-size: var(--nf-font-size-xs, 0.75rem);
      color: var(--nf-text-muted, #6b7280);
      text-transform: uppercase;
      letter-spacing: var(--nf-letter-spacing-wide, 0.025em);
      font-weight: var(--nf-font-weight-bold, 700);
    }

    .naf-shell__agent-action {
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: var(--nf-radius-xl, 0.75rem);
      background: var(--nf-color-surface, #ffffff);
      padding: var(--nf-space-2-5, 0.625rem) var(--nf-space-3, 0.75rem);
      display: flex;
      flex-direction: column;
      gap: var(--nf-space-2, 0.5rem);
    }

    .naf-shell__agent-action-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--nf-space-2, 0.5rem);
    }

    .naf-shell__agent-action-name {
      font-size: var(--nf-font-size-sm, 0.875rem);
      font-weight: var(--nf-font-weight-semibold, 600);
      color: var(--nf-text-primary, #111827);
    }

    .naf-shell__agent-action-status {
      font-size: var(--nf-font-size-xs, 0.75rem);
      color: var(--nf-text-muted, #6b7280);
      background: var(--nf-color-bg-subtle, #f9fafb);
      border-radius: var(--nf-radius-full, 9999px);
      padding: var(--nf-space-0-5, 0.125rem) var(--nf-space-2, 0.5rem);
    }

    .naf-shell__agent-action-buttons {
      display: flex;
      gap: var(--nf-space-1-5, 0.375rem);
      flex-wrap: wrap;
    }

    .naf-shell__agent-btn {
      border: 1px solid var(--nf-color-primary, #3b82f6);
      background: var(--nf-color-primary, #3b82f6);
      color: var(--nf-color-text-inverse, #ffffff);
      border-radius: var(--nf-radius-md, 0.375rem);
      font-size: var(--nf-font-size-xs, 0.75rem);
      font-weight: var(--nf-font-weight-semibold, 600);
      padding: var(--nf-space-1, 0.25rem) var(--nf-space-2-5, 0.625rem);
      cursor: pointer;
      transition: background var(--nf-transition-fast, 100ms ease);
    }

    .naf-shell__agent-btn:hover:not(:disabled) {
      background: var(--nf-primary-hover, #2563eb);
    }

    .naf-shell__agent-btn:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .naf-shell__agent-btn--ghost {
      border-color: var(--nf-border-default, #e5e7eb);
      background: var(--nf-color-surface, #ffffff);
      color: var(--nf-text-primary, #111827);
    }

    .naf-shell__agent-btn--ghost:hover:not(:disabled) {
      background: var(--nf-surface-hover, #f9fafb);
    }

    .naf-shell__agent-action-error {
      font-size: var(--nf-font-size-sm, 0.875rem);
      color: var(--nf-color-danger-700, #b91c1c);
      background: var(--nf-danger-subtle, #fef2f2);
      border: 1px solid var(--nf-color-danger-100, #fee2e2);
      border-radius: var(--nf-radius-lg, 0.5rem);
      padding: var(--nf-space-1-5, 0.375rem) var(--nf-space-2, 0.5rem);
    }

    .naf-shell__agent-empty {
      font-size: var(--nf-font-size-sm, 0.875rem);
      color: var(--nf-text-muted, #6b7280);
      border: 1px dashed var(--nf-border-default, #e5e7eb);
      border-radius: var(--nf-radius-lg, 0.5rem);
      padding: var(--nf-space-2, 0.5rem) var(--nf-space-3, 0.75rem);
    }

    .naf-shell__conversation-composer {
      border-top: 1px solid var(--nf-border-default, #e5e7eb);
      padding: var(--nf-space-3, 0.75rem);
      display: flex;
      flex-direction: column;
      gap: var(--nf-space-2, 0.5rem);
      background: var(--nf-color-surface, #ffffff);
      flex-shrink: 0;
      box-shadow: 0 -6px 16px rgba(15, 23, 42, 0.06);
    }

    .naf-shell__conversation-composer-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--nf-space-2, 0.5rem);
    }

    .naf-shell__conversation-hint {
      font-size: var(--nf-font-size-xs, 0.75rem);
      color: var(--nf-text-muted, #6b7280);
    }

    .naf-shell__conversation-input {
      width: 100%;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: var(--nf-radius-lg, 0.5rem);
      padding: var(--nf-space-2, 0.5rem) var(--nf-space-3, 0.75rem);
      resize: vertical;
      font: inherit;
      font-size: var(--nf-font-size-sm, 0.875rem);
      color: var(--nf-text-primary, #111827);
      background: var(--nf-color-surface, #ffffff);
      transition: border-color var(--nf-transition-fast, 100ms ease);
    }

    .naf-shell__conversation-input:focus {
      outline: none;
      border-color: var(--nf-color-primary, #3b82f6);
      box-shadow: var(--nf-shadow-focus);
    }

    .naf-shell__conversation-input:disabled {
      opacity: 0.7;
      cursor: wait;
    }

    .naf-shell__conversation-send {
      display: inline-flex;
      align-items: center;
      gap: var(--nf-space-1-5, 0.375rem);
      border: none;
      border-radius: var(--nf-radius-md, 0.375rem);
      padding: var(--nf-space-2, 0.5rem) var(--nf-space-3, 0.75rem);
      background: var(--nf-color-primary, #3b82f6);
      color: var(--nf-color-text-inverse, #ffffff);
      font-size: var(--nf-font-size-sm, 0.875rem);
      font-weight: var(--nf-font-weight-semibold, 600);
      cursor: pointer;
      transition: background var(--nf-transition-fast, 100ms ease);
      flex-shrink: 0;
    }

    .naf-shell__conversation-send:hover:not(:disabled) {
      background: var(--nf-primary-hover, #2563eb);
    }

    .naf-shell__conversation-send:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       RESPONSIVE
       ═══════════════════════════════════════════════════════════════════════ */
    @media (max-width: 980px) {
      .naf-shell__app-name { max-width: 140px; }
      .naf-shell__page-title { display: none; }
      .naf-shell__search-trigger { display: none; }

      .naf-shell__workspace {
        grid-template-columns: 1fr;
        position: relative;
      }

      .naf-shell__sidebar {
        position: fixed;
        top: var(--_topbar-h, 56px);
        inset-inline-start: 0;
        bottom: 0;
        width: min(320px, 88vw);
        z-index: 120;
        max-height: none;
        transform: translateX(-100%);
        transition: transform var(--nf-transition-slow, 200ms ease);
        box-shadow: none;
      }

      .naf-shell--mobile-nav-open .naf-shell__sidebar {
        transform: translateX(0);
        box-shadow: 4px 0 24px rgba(15, 23, 42, 0.12);
      }

      .naf-shell__mobile-backdrop {
        position: fixed;
        inset: 0;
        z-index: 110;
        margin: 0;
        padding: 0;
        border: none;
        background: rgba(15, 23, 42, 0.45);
        cursor: pointer;
      }

      .naf-shell__conversation {
        display: none !important;
      }

      .naf-shell--conversation-open .naf-shell__conversation {
        position: fixed;
        top: var(--_topbar-h, 48px);
        right: 0;
        bottom: 0;
        width: min(380px, 92vw);
        z-index: 130;
        display: grid !important;
        box-shadow: var(--nf-shadow-lg, 0 10px 30px rgba(2, 6, 23, 0.12));
      }
    }

  `],
})
export class PlatformAppShellComponent implements OnInit {
  private readonly auth = inject(AuthFacade);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly conversationApi = inject(ConversationApiService);
  readonly aiPanel = inject(AiPanelService);
  readonly commandPalette = inject(CommandPaletteService);
  readonly themeService = inject(ThemeService);
  /** Injected so theme mode (light/dark/system) is applied from storage on app init */
  private readonly themeMode = inject(ThemeModeService);
  private readonly apiConfig = inject(ApiConfigService);
  private readonly appSettingsApi = inject(AppSettingsApiService);
  readonly approvalsFacade = inject(ApprovalsFacade);
  /** Emplacement 'header-tenant-switcher' — rempli par l'application, vide sinon. */
  private readonly shellExtensions = inject(SHELL_EXTENSIONS, { optional: true });
  private readonly onboardingWidgetsPort = inject(ONBOARDING_WIDGETS_PORT, { optional: true });
  readonly headerExtensions = computed(() =>
    (this.shellExtensions ?? []).filter((e) => e.slot === 'header-tenant-switcher'),
  );
  private readonly orgContext = inject(ORG_CONTEXT_PORT, { optional: true });
  readonly showDefaultOrgSwitcher = computed(
    () => !!this.orgContext && this.headerExtensions().length === 0,
  );
  readonly userMenuWidget = computed(() =>
    componentForSlot(this.shellExtensions, 'sidebar-user-menu')
      ?? componentForSlot(this.shellExtensions, 'header-user-menu'),
  );
  readonly notificationWidget = computed(() =>
    componentForSlot(this.shellExtensions, 'header-notifications'),
  );
  readonly aiWidget = computed(() =>
    componentForSlot(this.shellExtensions, 'header-ai'),
  );
  private readonly shortcuts = inject(ShortcutsService);
  readonly onboarding = inject(OnboardingService);
  private loadVersion = 0;
  private readonly conversationBody = viewChild<ElementRef<HTMLElement>>('conversationBody');

  readonly shortcutsHelpOpen = signal(false);
  readonly onboardingInviteWidget = signal<Type<unknown> | null>(null);

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const handled = this.shortcuts.handle(event, {
      toggleAi: () => this.toggleConversation(),
      openCommandPalette: () => { event.preventDefault(); this.commandPalette.toggle(); },
      openShortcutHelp: () => { event.preventDefault(); this.shortcutsHelpOpen.update(v => !v); },
    });
    if (handled && event.key !== 'g') event.preventDefault();
  }

  // ─── Inputs ──────────────────────────────────────────────────────
  readonly applicationId = input.required<string>();
  readonly applicationName = input.required<string>();
  readonly navigation = input<SidebarNode[]>([]);
  readonly zoneConfig = input<ZoneConfig[]>([]);
  readonly shellOptions = input<PlatformAppShellOptions>({});
  readonly userSettingsEnabled = input<boolean>(false);
  readonly tenantSettingsEnabled = input<boolean>(false);

  // ─── Shell State ─────────────────────────────────────────────────
  readonly sidebarCollapsed = signal<boolean>(
    Boolean(DEFAULT_PLATFORM_APP_SHELL_OPTIONS.sidebar.initiallyCollapsed)
  );
  readonly mobileNavOpen = signal<boolean>(false);

  // ─── Conversation State ──────────────────────────────────────────
  readonly conversationOpen = this.aiPanel.open;
  readonly conversationMode = signal<ConversationMode>('ASSISTANT');
  readonly conversationDraft = signal<string>('');
  readonly conversationMessages = signal<UiConversationMessage[]>([]);
  readonly visibleConversationMessages = computed(() =>
    this.conversationMessages().filter((message) => this.messageHasVisibleBody(message))
  );
  readonly conversationLoading = signal<boolean>(false);
  readonly conversationSending = signal<boolean>(false);
  readonly conversationError = signal<string | null>(null);
  readonly conversationSessionIds = signal<Record<ConversationMode, string | null>>({
    ASK: null,
    AGENT: null,
    ASSISTANT: null,
  });
  readonly conversationSessions = signal<ConversationSession[]>([]);
  readonly agentActions = signal<AgentActionResponse[]>([]);
  readonly agentActionBusyId = signal<string | null>(null);

  // ─── Platform Detection ────────────────────────────────────────
  readonly searchShortcutLabel = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform) ? '⌘K' : 'Ctrl+K';
  readonly tourHelpTooltip =
    "Demarrer le tour d'accueil Nafura (navigation, raccourcis, alertes)";

  // ─── Computed ────────────────────────────────────────────────────
  private readonly currentUrl: Signal<string> = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly resolvedShellOptions = computed(() => mergeShellOptions(this.shellOptions()));

  /** On finance journal screens, float the AI panel instead of squeezing tables. */
  readonly conversationOverlay = computed(() => {
    const url = this.currentUrl();
    return url.includes('/finance/journaux') || url.includes('/finance/ecritures');
  });

  readonly visibleNavigation = computed(() => filterVisibleNodes(this.navigation()));

  /** Pending approvals counted on the approvals entry, wherever the product placed it. */
  readonly navigationWithBadges = computed(() => {
    const pending: SidebarBadgeProvider = () => {
      const count = this.approvalsFacade.pendingCount();
      return count > 0 ? { value: count, variant: 'info' } : null;
    };
    const withBadge = (node: SidebarNode): SidebarNode => ({
      ...node,
      badge: node.id === 'approvals' && !node.children?.length ? pending : node.badge,
      children: node.children?.map(withBadge),
    });
    return this.navigation().map(withBadge);
  });

  readonly currentPageLabel = computed(() => {
    const activeLabel = findActiveLabel(this.visibleNavigation(), this.currentUrl());
    return activeLabel || this.applicationTitle();
  });

  /** Application title from manifest (i18n key {applicationId}.application.title), fallback to config applicationName. */
  readonly applicationTitle = computed(() => {
    const key = `${this.applicationId()}.application.title`;
    const translated = this.i18n.instant(key);
    if (translated && translated !== key) return translated;
    return this.applicationName();
  });

  /** Full URL for branding logo (relative API path + base URL). */
  readonly brandingLogoUrl = computed(() => {
    const b = this.themeService.branding();
    const url = b?.logoUrl;
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = this.apiConfig.getApiBaseUrl();
    return base.endsWith('/') ? base + url.replace(/^\//, '') : base + (url.startsWith('/') ? url : '/' + url);
  });

  readonly displayName = computed(() => this.auth.displayName() || this.applicationTitle());

  constructor() {
    // Widgets d'onboarding fournis par l'application via ONBOARDING_WIDGETS_PORT.
    // Le drapeau environment.onboardingV2Enabled et le chargement paresseux sont portes
    // par l'implementation applicative — la plateforme ne connait pas ces composants.
    if (this.onboardingWidgetsPort) {
      void this.onboardingWidgetsPort.load().then((widgets) => {
        if (!widgets) {
          return;
        }
        if (widgets.inviteBanner) {
          this.onboardingInviteWidget.set(widgets.inviteBanner);
        }
        this.cdr.markForCheck();
      });
    }

    effect(() => {
      this.aiPanel.syncFromOptions(this.resolvedShellOptions().conversation);
    }, { allowSignalWrites: true });

    effect(() => {
      const options = this.resolvedShellOptions();
      const isOpen = this.conversationOpen();
      const mode = this.conversationMode();
      const appId = this.applicationId();
      if (!options.conversation.enabled || !isOpen || !appId) {
        return;
      }
      if (untracked(() => this.conversationSending())) {
        return;
      }
      this.restoreStoredSessionIds();
      void this.loadConversationSessions(mode);
      void this.refreshConversation(mode);
    });

    effect(() => {
      const url = this.currentUrl();
      this.onboarding.maybeAutoStartForUrl(url);
    });
  }

  ngOnInit(): void {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.closeMobileNav();
    });
    this.appSettingsApi.getBranding().subscribe({
      next: (b) => this.themeService.setBranding(b),
      error: () => {
        this.themeService.applyPrimaryColor(null);
        this.themeService.applyDocumentChrome(null);
      },
    });
    void this.approvalsFacade.refreshPendingCount();
  }

  // ─── Actions ─────────────────────────────────────────────────────
  toggleSidebar(): void {
    if (!this.resolvedShellOptions().sidebar.collapsible) {
      return;
    }
    if (this.isMobileViewport()) {
      this.mobileNavOpen.update((v) => !v);
      if (this.mobileNavOpen()) {
        this.sidebarCollapsed.set(false);
      }
      return;
    }
    this.sidebarCollapsed.update((v) => !v);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 980px)').matches;
  }

  toggleConversation(): void {
    this.aiPanel.toggle(this.resolvedShellOptions().conversation.enabled);
  }

  setConversationMode(mode: ConversationMode): void {
    if (this.conversationMode() === mode) {
      return;
    }
    this.conversationMode.set(mode);
    this.conversationError.set(null);
    this.conversationMessages.set([]);
    this.agentActions.set([]);
    void this.loadConversationSessions(mode);
  }

  onConversationKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }
    event.preventDefault();
    void this.sendConversationMessage();
  }

  onConversationSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value?.trim();
    if (!value) {
      return;
    }
    const mode = this.conversationMode();
    this.conversationSessionIds.update((current) => ({ ...current, [mode]: value }));
    this.storeSessionId(mode, value);
    this.conversationError.set(null);
    void this.refreshConversation(mode);
  }

  async startNewConversation(): Promise<void> {
    const mode = this.conversationMode();
    this.conversationSessionIds.update((current) => ({ ...current, [mode]: null }));
    this.storeSessionId(mode, null);
    this.conversationMessages.set([]);
    this.agentActions.set([]);
    this.conversationError.set(null);
    this.conversationDraft.set('');

    const conversationId = await this.ensureConversationSession(mode, true);
    if (!conversationId) {
      return;
    }
    await this.loadConversationSessions(mode);
    await this.refreshConversation(mode);
  }

  conversationSessionLabel(session: ConversationSession): string {
    if (session.title?.trim()) {
      return session.title.trim();
    }
    if (session.updatedAt) {
      const date = new Date(session.updatedAt);
      if (!Number.isNaN(date.getTime())) {
        return this.i18n.instant('core.conversation.sessionUntitled', {
          date: date.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }),
        });
      }
    }
    return this.translateLabel('core.conversation.sessionDefault');
  }

  onConversationDraftInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    this.conversationDraft.set(target?.value ?? '');
  }

  async sendConversationMessage(): Promise<void> {
    const content = this.conversationDraft().trim();
    if (!content || this.conversationSending()) {
      return;
    }

    const mode = this.conversationMode();
    const applicationId = this.applicationId();
    const conversationId = await this.ensureConversationSession(mode);
    if (!conversationId) {
      return;
    }

    this.conversationSending.set(true);
    this.conversationError.set(null);
    this.conversationMessages.update((messages) => [
      ...messages,
      { id: `local-${Date.now()}`, role: 'user', content },
    ]);
    this.conversationDraft.set('');
    this.scrollConversationToBottom(true);
    try {
      const domainKey = this.resolveConversationDomainKey();
      const turnResponse = await this.conversationApi.sendTurn(conversationId, applicationId, {
        content,
        domainKey,
        currentRoute: this.currentUrl(),
      });
      if (turnResponse.actions?.length && !this.isPlannerDump(turnResponse.assistantMessage?.content ?? '')) {
        this.agentActions.set(turnResponse.actions);
      }
      if (turnResponse.assistantMessage) {
        const rawAssistant =
          turnResponse.assistantMessage.content?.trim() ||
          turnResponse.summary?.trim() ||
          '';
        const assistantContent = this.sanitizeAssistantContent(rawAssistant);
        const fallbackLinks = this.fallbackCreateLinks(content, rawAssistant);
        const links = (turnResponse.links?.length ? turnResponse.links : fallbackLinks) ?? [];
        const emptyReply = this.translateLabel('core.conversation.emptyReply');
        const summary =
          turnResponse.summary?.trim() &&
          !this.isPlannerDump(turnResponse.summary) &&
          turnResponse.summary.trim() !== assistantContent
            ? turnResponse.summary.trim()
            : undefined;
        const blocks = (turnResponse.blocks ?? []).filter(
          (block) =>
            !((block.type === 'TEXT' || !block.type) && this.isPlannerDump(block.content ?? '')) &&
            !((block.type === 'TEXT' || !block.type) && (block.content ?? '').trim() === assistantContent)
        );
        const userFromTurn = turnResponse.userMessage
          ? this.mapConversationMessage({
              id: turnResponse.userMessage.id,
              role: turnResponse.userMessage.role || 'USER',
              content: turnResponse.userMessage.content || content,
              createdAt: turnResponse.userMessage.createdAt,
            })
          : { id: `user-${Date.now()}`, role: 'user' as const, content };
        this.conversationMessages.update((messages) => [
          ...messages.filter((m) => !m.id.startsWith('local-')),
          userFromTurn,
          {
            id: turnResponse.assistantMessage!.id,
            role: 'assistant',
            content:
              assistantContent ||
              (links.length ? 'Voici l’écran pour continuer.' : emptyReply),
            summary,
            blocks,
            links,
            createdAt: turnResponse.assistantMessage!.createdAt,
          },
        ]);
        const auto = links.find((link) => link.route && link.autoNavigate);
        if (auto?.route && !this.looksLikeHowto(content)) {
          this.navigateConversationLink(auto.route);
        }
      } else {
        await this.loadConversationSessions(mode);
        await this.refreshConversation(mode);
        if (!this.hasVisibleAssistantAfterUser(content)) {
          this.appendFailedAssistantReply();
          this.conversationError.set(this.translateLabel('core.conversation.emptyReply'));
        }
      }
    } catch (error) {
      // A duplicate unauthenticated POST can return 401 while the real request still
      // completes on the backend — reload history before surfacing a false error.
      try {
        await this.refreshConversation(mode);
        if (this.hasVisibleAssistantAfterUser(content)) {
          this.conversationError.set(null);
          return;
        }
      } catch {
        // Fall through to error handling below.
      }
      this.conversationMessages.update((messages) => {
        const kept = messages.filter((m) => !m.id.startsWith('local-'));
        if (!kept.some((m) => m.role === 'user' && m.content.trim() === content)) {
          kept.push({ id: `user-${Date.now()}`, role: 'user', content });
        }
        return kept;
      });
      this.appendFailedAssistantReply();
      this.conversationError.set(this.extractErrorMessage(error));
    } finally {
      this.conversationSending.set(false);
      this.scrollConversationToBottom();
    }
  }

  navigateConversationLink(route: string): void {
    if (!route) return;
    void this.router.navigateByUrl(this.resolveRoute(route));
  }

  async approveAction(actionId: string): Promise<void> {
    await this.updateAgentAction(actionId, 'approve');
  }

  async rejectAction(actionId: string): Promise<void> {
    await this.updateAgentAction(actionId, 'reject');
  }

  async executeAction(actionId: string): Promise<void> {
    await this.updateAgentAction(actionId, 'execute');
  }

  canApprove(action: AgentActionResponse): boolean {
    return action.status === 'PROPOSED' || action.status === 'PENDING_APPROVAL';
  }

  canExecute(action: AgentActionResponse): boolean {
    return action.status === 'APPROVED';
  }

  messageRoleLabel(role: UiMessageRole): string {
    if (role === 'user') return this.displayName();
    if (role === 'assistant') return this.translateLabel('core.conversation.agent');
    if (role === 'system') return this.translateLabel('core.conversation.roles.system');
    return this.translateLabel('core.conversation.roles.tool');
  }

  agentStatusLabel(status: string | undefined): string {
    const value = (status || '').toUpperCase();
    const key = `core.conversation.actions.status.${value.toLowerCase()}`;
    const translated = this.i18n.instant(key);
    return translated && translated !== key ? translated : value || '-';
  }

  // ─── Track-by Functions ──────────────────────────────────────────
  trackByMessage = (_index: number, message: { id: string }): string => message.id;
  trackByAgentAction = (_index: number, action: AgentActionResponse): string => action.id;

  messageHasVisibleBody(message: UiConversationMessage): boolean {
    if (message.role === 'user') {
      return !!message.content?.trim();
    }
    return !!this.displayAssistantContent(message) || this.hasStructuredAssistantExtras(message);
  }

  /** Avoid rendering summary/TEXT when they duplicate the bubble content. */
  hasStructuredAssistantExtras(message: UiConversationMessage): boolean {
    return (
      !!this.assistantSummaryForRender(message) ||
      this.assistantBlocksForRender(message).length > 0 ||
      (message.links?.length ?? 0) > 0
    );
  }

  displayAssistantContent(message: UiConversationMessage): string {
    return this.formatAssistantText(this.sanitizeAssistantContent(message.content ?? ''));
  }

  private sanitizeAssistantContent(content: string): string {
    const trimmed = content.trim();
    if (!trimmed) {
      return '';
    }
    if (this.isPlannerDump(trimmed)) {
      return '';
    }
    return content;
  }

  private formatAssistantText(content: string): string {
    return content
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1');
  }

  private hasVisibleAssistantAfterUser(userContent: string): boolean {
    const messages = this.conversationMessages();
    const userIndex = [...messages]
      .map((message, index) => ({ message, index }))
      .reverse()
      .find(({ message }) => message.role === 'user' && message.content.trim() === userContent)
      ?.index;
    if (userIndex === undefined) {
      return false;
    }
    return messages.slice(userIndex + 1).some((message) => this.messageHasVisibleBody(message));
  }

  private appendFailedAssistantReply(): void {
    const text = this.translateLabel('core.conversation.emptyReply');
    this.conversationMessages.update((messages) => {
      const last = messages[messages.length - 1];
      if (last?.role === 'assistant' && last.content.trim() === text) {
        return messages;
      }
      return [
        ...messages,
        { id: `empty-${Date.now()}`, role: 'assistant', content: text },
      ];
    });
  }

  private isPlannerDump(content: string): boolean {
    const trimmed = content.trim();
    return (
      trimmed.includes('toolKey') &&
      (trimmed.includes('requiresApproval') ||
        trimmed.includes('safetyAssessment') ||
        trimmed.includes('"steps"') ||
        trimmed.includes('"operation"'))
    );
  }

  private fallbackCreateLinks(userText: string, assistantContent: string): AssistantLink[] {
    if (!this.isPlannerDump(assistantContent)) {
      return [];
    }
    const spoken = userText.toLowerCase();
    if (!/(ajout|cré|cree|create|new)/i.test(spoken)) {
      return [];
    }
    if (!/article/.test(spoken)) {
      return [];
    }
    return [
      {
        label: 'Créer — Articles',
        route: '/inventory/catalogue/articles/new',
        autoNavigate: false,
      },
    ];
  }

  private looksLikeHowto(text: string): boolean {
    return /\b(comment|o[uù]|how|aide)\b/i.test(text);
  }

  assistantSummaryForRender(message: UiConversationMessage): string | null {
    const summary = message.summary?.trim();
    if (!summary || summary === message.content.trim()) {
      return null;
    }
    return summary;
  }

  assistantBlocksForRender(message: UiConversationMessage): AssistantBlock[] {
    const content = message.content.trim();
    return (message.blocks ?? []).filter(
      (block) =>
        !((block.type === 'TEXT' || !block.type) && (block.content ?? '').trim() === content)
    );
  }

  // ─── Helpers ─────────────────────────────────────────────────────
  resolveRoute(route: string | undefined): string {
    if (!route || !route.trim()) {
      return '/feature-unavailable/unknown';
    }
    const normalized = route.trim();
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }

  /** Maps current URL to AI schema domain for focused prompts. Product apps may override via conversation context. */
  private resolveConversationDomainKey(): string | undefined {
    return undefined;
  }

  translateLabel(label: string | undefined): string {
    return displayLabel(label, (key) => this.i18n.instant(key));
  }

  // ─── Private: Conversation ───────────────────────────────────────
  private scrollConversationToBottom(force = false): void {
    const el = this.conversationBody()?.nativeElement;
    if (!el) {
      return;
    }
    requestAnimationFrame(() => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (force || distanceFromBottom < 80) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }

  private async refreshConversation(mode: ConversationMode, allowStaleRecovery = true): Promise<void> {
    const applicationId = this.applicationId();
    const conversationId = await this.ensureConversationSession(mode);
    if (!conversationId) return;

    const version = ++this.loadVersion;
    this.conversationLoading.set(true);
    this.conversationError.set(null);

    try {
      const [messages, actions] = await Promise.all([
        this.conversationApi.listMessages(conversationId, applicationId),
        mode === 'AGENT' || mode === 'ASSISTANT'
          ? this.conversationApi.listActions(conversationId, applicationId)
          : Promise.resolve<AgentActionResponse[]>([]),
      ]);
      if (version !== this.loadVersion) return;
      this.conversationMessages.set(this.decorateLoadedMessages(messages));
      this.agentActions.set(actions);
    } catch (error) {
      if (version !== this.loadVersion) return;
      // Stale localStorage session: 404/403 after ownership check, or legacy 500
      // when ResponseStatusException was swallowed by the global handler.
      if (
        allowStaleRecovery &&
        error instanceof HttpErrorResponse &&
        (error.status === 404 || error.status === 403 || error.status === 500)
      ) {
        this.conversationSessionIds.update((current) => ({ ...current, [mode]: null }));
        this.storeSessionId(mode, null);
        const recreated = await this.ensureConversationSession(mode, true);
        if (recreated) {
          await this.refreshConversation(mode, false);
          return;
        }
      }
      this.conversationError.set(this.extractErrorMessage(error));
    } finally {
      if (version === this.loadVersion) {
        this.conversationLoading.set(false);
        this.scrollConversationToBottom();
      }
    }
  }

  private async loadConversationSessions(mode: ConversationMode): Promise<void> {
    try {
      const page = await this.conversationApi.listConversations(this.applicationId(), 0, 30);
      const sessions = (page.content ?? []).filter((session) => session.mode === mode);
      this.conversationSessions.set(sessions);
    } catch {
      // Non-blocking: history dropdown stays empty if list fails.
    }
  }

  private async ensureConversationSession(mode: ConversationMode, forceNew = false): Promise<string | null> {
    if (!forceNew) {
      const known = this.conversationSessionIds()[mode];
      if (known) {
        return known;
      }
    }

    try {
      const session = await this.conversationApi.createConversation(this.applicationId(), mode);
      this.conversationSessionIds.update((current) => ({ ...current, [mode]: session.id }));
      this.storeSessionId(mode, session.id);
      this.conversationSessions.update((list) => [session, ...list.filter((item) => item.id !== session.id)]);
      return session.id;
    } catch (error) {
      this.conversationError.set(this.extractErrorMessage(error));
      return null;
    }
  }

  private restoreStoredSessionIds(): void {
    this.conversationSessionIds.update((current) => ({
      ASK: current.ASK ?? this.readStoredSessionId('ASK'),
      AGENT: current.AGENT ?? this.readStoredSessionId('AGENT'),
      ASSISTANT: current.ASSISTANT ?? this.readStoredSessionId('ASSISTANT'),
    }));
  }

  private sessionStorageKey(mode: ConversationMode): string {
    return `shell.aiSession.${this.applicationId()}.${mode}`;
  }

  private readStoredSessionId(mode: ConversationMode): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    try {
      return localStorage.getItem(this.sessionStorageKey(mode));
    } catch {
      return null;
    }
  }

  private storeSessionId(mode: ConversationMode, conversationId: string | null): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      const key = this.sessionStorageKey(mode);
      if (conversationId) {
        localStorage.setItem(key, conversationId);
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      // ignore quota / privacy errors
    }
  }

  private async updateAgentAction(
    actionId: string,
    operation: 'approve' | 'reject' | 'execute'
  ): Promise<void> {
    if (this.conversationMode() !== 'AGENT' && this.conversationMode() !== 'ASSISTANT') return;
    const conversationId = this.conversationSessionIds()[this.conversationMode()];
    if (!conversationId) return;

    this.agentActionBusyId.set(actionId);
    this.conversationError.set(null);
    try {
      if (operation === 'approve') {
        await this.conversationApi.approveAction(conversationId, actionId, this.applicationId());
      } else if (operation === 'reject') {
        await this.conversationApi.rejectAction(conversationId, actionId, this.applicationId());
      } else {
        await this.conversationApi.executeAction(conversationId, actionId, this.applicationId());
      }
      await this.refreshConversation('AGENT');
    } catch (error) {
      this.conversationError.set(this.extractErrorMessage(error));
    } finally {
      this.agentActionBusyId.set(null);
    }
  }

  private decorateLoadedMessages(messages: ConversationMessage[]): UiConversationMessage[] {
    const mapped = messages.map((m) => this.mapConversationMessage(m));
    return mapped.map((message, index) => {
      if (message.role !== 'assistant') {
        return message;
      }
      const previous = mapped[index - 1];
      const raw = messages[index]?.content ?? '';
      const links = previous?.role === 'user' ? this.fallbackCreateLinks(previous.content, raw) : [];
      if (!links.length) {
        return message;
      }
      return {
        ...message,
        content: message.content || 'Voici l’écran pour continuer.',
        links,
      };
    });
  }

  private mapConversationMessage(message: ConversationMessage): UiConversationMessage {
    const role = (message.role || '').toUpperCase();
    return {
      id: message.id,
      role:
        role === 'USER' ? 'user'
        : role === 'SYSTEM' ? 'system'
        : role === 'TOOL' ? 'tool'
        : 'assistant',
      content: this.sanitizeAssistantContent(message.content || ''),
      createdAt: message.createdAt,
    };
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) return error.error;
      if (error.error && typeof error.error === 'object') {
        const value = (error.error as Record<string, unknown>)['message'];
        if (typeof value === 'string' && value.trim()) return value;
      }
      if (typeof error.message === 'string' && error.message.trim()) return error.message;
    }
    return this.translateLabel('core.conversation.errorGeneric');
  }
}

function mergeShellOptions(options: PlatformAppShellOptions | undefined): Required<PlatformAppShellOptions> {
  const provided = options || {};
  return {
    widgets: {
      ...DEFAULT_PLATFORM_APP_SHELL_OPTIONS.widgets,
      ...(provided.widgets || {}),
    },
    sidebar: {
      ...DEFAULT_PLATFORM_APP_SHELL_OPTIONS.sidebar,
      ...(provided.sidebar || {}),
    },
    topbar: {
      ...DEFAULT_PLATFORM_APP_SHELL_OPTIONS.topbar,
      ...(provided.topbar || {}),
    },
    conversation: {
      ...DEFAULT_PLATFORM_APP_SHELL_OPTIONS.conversation,
      ...(provided.conversation || {}),
    },
    search: {
      ...DEFAULT_PLATFORM_APP_SHELL_OPTIONS.search,
      ...(provided.search || {}),
    },
  };
}
