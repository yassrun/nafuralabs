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
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { filter, map, startWith } from 'rxjs';

import { SidebarIcon, SidebarNode, SidebarZoneGroup, ZoneConfig } from '../navigation/sidebar.types';
import { I18nService } from '../i18n';
import { AuthFacade } from '../security/services/auth.facade';
import { LanguageSelectorComponent } from '../components/language-selector/language-selector.component';
import { AvatarComponent } from '../../lib/anatomy/components/atoms/avatar/avatar.component';
import { NotificationBellComponent } from '../../features/collaboration/notification';
import { ChatPanelComponent } from '../../features/ai-assistant/chat-panel.component';
import { CommandPaletteComponent } from './command-palette/command-palette.component';
import { CommandPaletteService } from './command-palette/command-palette.service';
import {
  AgentActionResponse,
  ConversationApiService,
  ConversationMessage,
  ConversationMode,
  ConversationSession,
} from '../../features/ai/ai-conversation/services/conversation-api.service';
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
import { SocieteSwitcherComponent } from '@applications/erp/shell/components/societe-switcher/societe-switcher.component';
import { environment } from '@env';
import { SocieteService } from '@applications/erp/shell/societe.service';
import { TooltipDirective } from '../../lib/anatomy/components/atoms/tooltip/tooltip.directive';

type UiMessageRole = 'user' | 'assistant' | 'system' | 'tool';

interface UiConversationMessage {
  id: string;
  role: UiMessageRole;
  content: string;
  createdAt?: string;
}

const LUCIDE_ICON_ALIASES: Record<string, string> = {
  'alert-triangle':  'triangle-alert',
  'bar-chart':       'chart-bar',
  'bar-chart-2':     'chart-bar',
  'bar-chart-3':     'chart-column',
  'check-circle':    'circle-check',
  'check-circle-2':  'circle-check',
  'check-square':    'circle-check',
  'x-circle':        'circle-x',
  'layout-dashboard':'layout-dashboard',
  // `file-signature` does not exist in lucide-angular@0.563; fall back to file-pen.
  'file-signature':  'file-pen',
  // Material-style nav ids from erp-nav.generated (materiel section)
  'calendar-range':  'calendar-clock',
  'schedule':        'clock',
  'verified-user':   'shield-check',
  'scale-balanced':  'scale',
  'sliders':         'sliders-horizontal',
  'today':           'calendar',
  'table':           'table-2',
};

@Component({
  selector: 'app-platform-shell',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet, RouterModule, LucideAngularModule, LanguageSelectorComponent, AvatarComponent, NotificationBellComponent, CommandPaletteComponent, ChatPanelComponent, ShortcutsHelpComponent, OnboardingTourComponent, SocieteSwitcherComponent, TooltipDirective],
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
            <!-- Brand lockup lives in the sidebar only; topbar shows page context to avoid duplicating "Nafura Sektor". -->
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
          <app-societe-switcher (change)="onSocieteSwitcherChange()" />
          @if (onboardingMeterWidget()) {
            <ng-container *ngComponentOutlet="onboardingMeterWidget()!" />
          }

          <app-language-selector *ngIf="resolvedShellOptions().widgets.languageSwitch" />

          <nf-notification-bell *ngIf="resolvedShellOptions().widgets.notifications" />

          <button
            *ngIf="resolvedShellOptions().widgets.conversation && resolvedShellOptions().conversation.enabled"
            type="button"
            class="naf-shell__ai-toggle"
            [class.is-active]="conversationOpen()"
            [attr.aria-label]="translateLabel('core.conversation.toggle')"
            (click)="toggleConversation()">
            <lucide-icon name="sparkles" [size]="16" class="naf-shell__icon" aria-hidden="true"></lucide-icon>
            <span class="naf-shell__ai-toggle-label">AI</span>
          </button>

          <!-- User menu -->
          <div *ngIf="resolvedShellOptions().widgets.userMenu" class="naf-shell__user-menu">
            <button
              type="button"
              class="naf-shell__user-trigger"
              (click)="toggleUserMenu($event)"
              [attr.aria-expanded]="userMenuOpen()">
              <nf-avatar [name]="displayName()" size="xs" />
              <span class="naf-shell__user-name">{{ displayName() }}</span>
              <lucide-icon name="chevron-down" [size]="18" class="naf-shell__icon naf-shell__user-chevron" aria-hidden="true"></lucide-icon>
            </button>

            <div class="naf-shell__user-panel" *ngIf="userMenuOpen()">
              <div class="naf-shell__user-panel-header">
                <nf-avatar [name]="displayName()" size="sm" />
                <div class="naf-shell__user-panel-info">
                  <div class="naf-shell__user-panel-name">{{ displayName() }}</div>
                  <div class="naf-shell__user-panel-email">{{ userEmail() }}</div>
                </div>
              </div>

              <div class="naf-shell__user-panel-divider"></div>

              <a
                *ngIf="userSettingsEnabled()"
                [routerLink]="'/user-settings'"
                class="naf-shell__user-panel-item"
                (click)="closeUserMenu()">
                <lucide-icon name="settings" [size]="18" class="naf-shell__icon" aria-hidden="true"></lucide-icon>
                {{ translateLabel('core.topbar.mySettings') }}
              </a>
              <a
                *ngIf="appSettingsEnabled()"
                [routerLink]="'/administration/settings'"
                class="naf-shell__user-panel-item"
                (click)="closeUserMenu()">
                <lucide-icon name="sliders-horizontal" [size]="18" class="naf-shell__icon" aria-hidden="true"></lucide-icon>
                {{ translateLabel('core.topbar.appSettings') }}
              </a>

              <div class="naf-shell__user-panel-divider"></div>

              <button
                type="button"
                class="naf-shell__user-panel-item naf-shell__user-panel-item--danger"
                (click)="logout()">
                <lucide-icon name="log-out" [size]="18" class="naf-shell__icon" aria-hidden="true"></lucide-icon>
                {{ translateLabel('core.topbar.logout') }}
              </button>
            </div>
          </div>
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
          <nav class="naf-shell__nav" aria-label="Application navigation">
            <ng-container *ngIf="zoneGroups().length > 0; else emptyNav">
              <ng-container *ngFor="let group of zoneGroups(); let groupIdx = index; trackBy: trackByZone">
                <div *ngIf="group.label" class="naf-shell__zone-header">
                  <span class="naf-shell__zone-label">{{ translateLabel(group.label) }}</span>
                </div>
                <div *ngIf="!group.label && groupIdx > 0" class="naf-shell__zone-divider"></div>

                <!-- Domain nodes in this zone -->
                <div
                  class="naf-shell__domain"
                  *ngFor="let domain of group.nodes; trackBy: trackByNodeId">

                  <!-- Divider before (if node requests it) -->
                  <div *ngIf="domain.dividerBefore" class="naf-shell__zone-divider"></div>

                  <!-- Domain header (collapsible) -->
                  <button
                    type="button"
                    class="naf-shell__domain-header"
                    [class.is-expanded]="expandedDomains().has(domain.id)"
                    [title]="sidebarCollapsed() ? translateLabel(domain.label) : ''"
                    (click)="onDomainClick(domain)">
                    <span
                      *ngIf="resolveNavIcon(domain.icon) as domainIcon"
                      class="naf-shell__domain-icon">
                      <lucide-icon [name]="domainIcon" [size]="20" class="naf-shell__icon" aria-hidden="true"></lucide-icon>
                    </span>
                    <span class="naf-shell__domain-label">{{ translateLabel(domain.label) }}</span>
                    <lucide-icon
                      *ngIf="nodeChildren(domain).length > 0"
                      name="chevron-right"
                      [size]="18"
                      class="naf-shell__icon naf-shell__domain-chevron"
                      aria-hidden="true"></lucide-icon>
                  </button>

                  <!-- Domain children (sections + entities) -->
                  <div
                    class="naf-shell__domain-body"
                    *ngIf="expandedDomains().has(domain.id) && !sidebarCollapsed()">

                    <ng-container *ngFor="let child of nodeChildren(domain); trackBy: trackByNodeId">
                      <!-- If child has children → it's a section/subsection -->
                      <ng-container *ngIf="nodeChildren(child).length > 0; else leafLink">
                        <div class="naf-shell__section">
                          <div class="naf-shell__section-label">{{ translateLabel(child.label) }}</div>
                          <a
                            class="naf-shell__link"
                            *ngFor="let item of nodeChildren(child); trackBy: trackByNodeId"
                            [routerLink]="resolveRoute(item.route)"
                            routerLinkActive="is-active"
                            [routerLinkActiveOptions]="{ exact: item.exactMatch ?? false }">
                            <span
                              *ngIf="resolveNavIcon(item.icon) as itemIcon"
                              class="naf-shell__link-icon">
                              <lucide-icon [name]="itemIcon" [size]="15" class="naf-shell__icon" aria-hidden="true"></lucide-icon>
                            </span>
                            {{ translateLabel(item.label) }}
                          </a>
                        </div>
                      </ng-container>

                      <!-- If child is a leaf → direct link (e.g., admin items) -->
                      <ng-template #leafLink>
                        <a
                          class="naf-shell__link naf-shell__link--direct"
                          *ngIf="child.route"
                          [routerLink]="resolveRoute(child.route)"
                          routerLinkActive="is-active"
                          [routerLinkActiveOptions]="{ exact: child.exactMatch ?? false }">
                          <span
                            *ngIf="resolveNavIcon(child.icon) as childIcon"
                            class="naf-shell__link-icon">
                            <lucide-icon [name]="childIcon" [size]="15" class="naf-shell__icon" aria-hidden="true"></lucide-icon>
                          </span>
                          {{ translateLabel(child.label) }}
                          <span
                            *ngIf="child.id === 'approvals' && approvalsFacade.pendingCount() > 0"
                            class="naf-shell__link-badge">
                            {{ approvalsFacade.pendingCount() }}
                          </span>
                        </a>
                      </ng-template>
                    </ng-container>
                  </div>

                  <!-- Divider after (if node requests it) -->
                  <div *ngIf="domain.dividerAfter" class="naf-shell__zone-divider"></div>
                </div>
              </ng-container>
            </ng-container>
          </nav>
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

          <div class="naf-shell__conversation-modes">
            <button
              type="button"
              class="naf-shell__mode-btn"
              [class.is-active]="conversationMode() === 'ASK'"
              (click)="setConversationMode('ASK')">
              {{ translateLabel('core.conversation.mode.ask') }}
            </button>
            <button
              type="button"
              class="naf-shell__mode-btn"
              [class.is-active]="conversationMode() === 'AGENT'"
              (click)="setConversationMode('AGENT')">
              {{ translateLabel('core.conversation.mode.agent') }}
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

          <div class="naf-shell__conversation-body">
            <div *ngIf="conversationLoading()" class="naf-shell__conversation-state">
              {{ translateLabel('core.conversation.loading') }}
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
              *ngFor="let message of conversationMessages(); trackBy: trackByMessage"
              class="naf-shell__message"
              [class.naf-shell__message--user]="message.role === 'user'"
              [class.naf-shell__message--assistant]="message.role === 'assistant'">
              <div class="naf-shell__message-role">{{ messageRoleLabel(message.role) }}</div>
              <div class="naf-shell__message-text">{{ message.content }}</div>
            </div>

            <div *ngIf="conversationMode() === 'AGENT'" class="naf-shell__agent-block">
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

    <ng-template #emptyNav>
      <div class="naf-shell__empty">{{ translateLabel('core.navigation.empty') }}</div>
    </ng-template>

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

      .naf-shell__ai-toggle {
        height: 40px;
      }
    }

    /* ─── AI Toggle Pill ─── */
    .naf-shell__ai-toggle {
      display: inline-flex;
      align-items: center;
      gap: var(--nf-space-1, 0.25rem);
      height: 34px;
      padding: 0 var(--nf-space-2-5, 0.625rem);
      border-radius: var(--nf-radius-full, 9999px);
      border: 1px solid var(--nf-border-default, #e5e7eb);
      background: var(--nf-color-surface, #ffffff);
      color: var(--nf-text-secondary, #4b5563);
      cursor: pointer;
      font-size: var(--nf-font-size-xs, 0.75rem);
      font-weight: var(--nf-font-weight-semibold, 600);
      transition: background var(--nf-transition-fast, 100ms ease),
                  border-color var(--nf-transition-fast, 100ms ease),
                  color var(--nf-transition-fast, 100ms ease);
    }

    .naf-shell__ai-toggle:hover {
      border-color: var(--nf-color-primary-300, #93c5fd);
      background: var(--nf-primary-subtle, #eff6ff);
      color: var(--nf-color-primary-700, #1d4ed8);
    }

    .naf-shell__ai-toggle.is-active {
      border-color: var(--nf-color-primary, #3b82f6);
      background: var(--nf-color-primary, #3b82f6);
      color: var(--nf-color-text-inverse, #ffffff);
    }

    .naf-shell__ai-toggle .naf-shell__icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .naf-shell__ai-toggle-label {
      letter-spacing: var(--nf-letter-spacing-wide, 0.025em);
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

    /* ─── User Menu ─── */
    .naf-shell__user-menu {
      position: relative;
    }

    .naf-shell__user-trigger {
      display: flex;
      align-items: center;
      gap: var(--nf-space-1, 0.25rem);
      border: 1px solid var(--nf-border-default, #e5e7eb);
      background: var(--nf-color-surface, #ffffff);
      border-radius: var(--nf-radius-full, 9999px);
      padding: var(--nf-space-1, 0.25rem) var(--nf-space-2, 0.5rem) var(--nf-space-1, 0.25rem) var(--nf-space-1, 0.25rem);
      cursor: pointer;
      transition: border-color var(--nf-transition-fast, 100ms ease);
    }

    .naf-shell__user-trigger:hover {
      border-color: var(--nf-border-strong, #d1d5db);
    }

    .naf-shell__user-name {
      font-size: var(--nf-font-size-sm, 0.875rem);
      max-width: 120px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--nf-text-primary, #111827);
    }

    .naf-shell__user-chevron {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      color: var(--nf-text-muted, #6b7280);
      transition: transform var(--nf-transition-fast, 100ms ease);
    }

    .naf-shell__user-panel {
      position: absolute;
      top: calc(100% + var(--nf-space-1-5, 0.375rem));
      inset-inline-end: 0;
      min-width: 240px;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: var(--nf-radius-xl, 0.75rem);
      background: var(--nf-color-surface, #ffffff);
      box-shadow: var(--nf-shadow-lg);
      padding: var(--nf-space-2, 0.5rem);
      z-index: var(--nf-z-dropdown, 100);
    }

    .naf-shell__user-panel-header {
      display: flex;
      align-items: center;
      gap: var(--nf-space-2-5, 0.625rem);
      padding: var(--nf-space-2, 0.5rem);
    }

    .naf-shell__user-panel-info {
      min-width: 0;
    }

    .naf-shell__user-panel-name {
      font-size: var(--nf-font-size-sm, 0.875rem);
      font-weight: var(--nf-font-weight-semibold, 600);
      color: var(--nf-text-primary, #111827);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .naf-shell__user-panel-email {
      font-size: var(--nf-font-size-xs, 0.75rem);
      color: var(--nf-text-muted, #6b7280);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .naf-shell__user-panel-divider {
      height: 1px;
      background: var(--nf-border-subtle, #f3f4f6);
      margin: var(--nf-space-1, 0.25rem) 0;
    }

    .naf-shell__user-panel-item {
      display: flex;
      align-items: center;
      gap: var(--nf-space-2, 0.5rem);
      width: 100%;
      padding: var(--nf-space-2, 0.5rem);
      border: none;
      border-radius: var(--nf-radius-md, 0.375rem);
      background: transparent;
      color: var(--nf-text-primary, #111827);
      font-size: var(--nf-font-size-sm, 0.875rem);
      text-decoration: none;
      cursor: pointer;
      transition: background var(--nf-transition-fast, 100ms ease);
    }

    .naf-shell__user-panel-item:hover {
      background: var(--nf-surface-hover, #f9fafb);
    }

    .naf-shell__user-panel-item .naf-shell__icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--nf-text-muted, #6b7280);
    }

    .naf-shell__user-panel-item--danger {
      color: var(--nf-danger, #ef4444);
    }

    .naf-shell__user-panel-item--danger:hover {
      background: var(--nf-danger-subtle, #fef2f2);
    }

    .naf-shell__user-panel-item--danger .naf-shell__icon {
      color: var(--nf-danger, #ef4444);
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
      overflow-y: auto;
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

    .naf-shell__nav {
      display: flex;
      flex-direction: column;
      gap: var(--nf-space-1, 0.25rem);
    }

    /* ─── Zone Divider ─── */
    .naf-shell__zone-divider {
      height: 1px;
      background: var(--nf-border-default, #e5e7eb);
      margin: var(--nf-space-2, 0.5rem) var(--nf-space-2, 0.5rem);
    }

    .naf-shell__zone-header {
      padding: 0 var(--nf-space-2, 0.5rem) var(--nf-space-1, 0.25rem);
      margin-top: var(--nf-space-5, 1.25rem);
    }

    .naf-shell__zone-header:first-child {
      margin-top: var(--nf-space-1, 0.25rem);
    }

    .naf-shell__zone-label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--nf-text-muted, #6b7280);
      display: block;
      padding-bottom: var(--nf-space-1, 0.25rem);
      border-bottom: 1px solid var(--nf-border-subtle, #f3f4f6);
    }

    /* ─── Domain Header ─── */
    .naf-shell__domain-header {
      display: flex;
      align-items: center;
      gap: var(--nf-space-2, 0.5rem);
      width: 100%;
      padding: var(--nf-space-2, 0.5rem);
      border: none;
      border-radius: var(--nf-radius-lg, 0.5rem);
      background: transparent;
      color: var(--nf-text-primary, #111827);
      font-size: var(--nf-font-size-sm, 0.875rem);
      font-weight: var(--nf-font-weight-semibold, 600);
      cursor: pointer;
      transition: background var(--nf-transition-fast, 100ms ease),
                  color var(--nf-transition-fast, 100ms ease);
      text-align: start;
    }

    .naf-shell__domain-header:hover {
      background: var(--nf-surface-hover, #f9fafb);
      color: var(--nf-text-primary, #111827);
    }

    .naf-shell__domain-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      color: var(--nf-color-primary, #3b82f6);
    }

    .naf-shell__domain-header:hover .naf-shell__domain-icon,
    .naf-shell__domain-header.is-expanded .naf-shell__domain-icon {
      color: var(--nf-color-primary-700, #1d4ed8);
    }

    .naf-shell__domain-label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .naf-shell__domain-chevron {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      color: var(--nf-text-muted, #6b7280);
      transition: transform var(--nf-transition-normal, 150ms ease);
      flex-shrink: 0;
    }

    .naf-shell__domain-header.is-expanded .naf-shell__domain-chevron {
      transform: rotate(90deg);
    }

    /* RTL : mirror chevron-right so it visually points toward the inline-end
       side regardless of writing direction; keep the existing 90° rotation
       on the expanded state. */
    :host-context([dir="rtl"]) .naf-shell__domain-chevron {
      transform: scaleX(-1);
    }

    :host-context([dir="rtl"]) .naf-shell__domain-header.is-expanded .naf-shell__domain-chevron {
      transform: scaleX(-1) rotate(90deg);
    }

    /* Collapsed sidebar: hide labels, center icon */
    .naf-shell--sidebar-collapsed .naf-shell__domain-header {
      justify-content: center;
      padding: var(--nf-space-2, 0.5rem);
    }

    .naf-shell--sidebar-collapsed .naf-shell__domain-label,
    .naf-shell--sidebar-collapsed .naf-shell__domain-chevron {
      display: none;
    }

    .naf-shell--sidebar-collapsed .naf-shell__zone-header,
    .naf-shell--sidebar-collapsed .naf-shell__zone-divider {
      display: none;
    }

    /* ─── Domain Body (children) ─── */
    .naf-shell__domain-body {
      padding-inline-start: var(--nf-space-2, 0.5rem);
      margin-bottom: var(--nf-space-1, 0.25rem);
    }

    /* ─── Section (subsection) ─── */
    .naf-shell__section {
      margin-top: var(--nf-space-1, 0.25rem);
    }

    .naf-shell__section-label {
      padding: var(--nf-space-1, 0.25rem) var(--nf-space-2, 0.5rem);
      font-size: var(--nf-font-size-xs, 0.75rem);
      font-weight: var(--nf-font-weight-medium, 500);
      text-transform: uppercase;
      letter-spacing: var(--nf-letter-spacing-wide, 0.025em);
      color: var(--nf-text-muted, #6b7280);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ─── Nav Links ─── */
    .naf-shell__link {
      display: flex;
      align-items: center;
      gap: var(--nf-space-2, 0.5rem);
      padding-block: var(--nf-space-1-5, 0.375rem);
      padding-inline-start: var(--nf-space-4, 1rem);
      padding-inline-end: var(--nf-space-2, 0.5rem);
      border-radius: var(--nf-radius-md, 0.375rem);
      color: var(--nf-text-muted, #6b7280);
      text-decoration: none;
      font-size: 0.8125rem;
      font-weight: var(--nf-font-weight-normal, 400);
      transition: background var(--nf-transition-fast, 100ms ease),
                  color var(--nf-transition-fast, 100ms ease);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border-inline-start: 2px solid transparent;
    }

    .naf-shell__link:hover {
      background: var(--nf-surface-hover, #f9fafb);
      color: var(--nf-text-primary, #111827);
    }

    .naf-shell__link.is-active {
      background: var(--nf-primary-subtle, #eff6ff);
      color: var(--nf-color-primary-700, #1d4ed8);
      font-weight: var(--nf-font-weight-medium, 500);
      border-inline-start-color: var(--nf-color-primary, #3b82f6);
    }

    .naf-shell__link--direct {
      padding-inline-start: var(--nf-space-2, 0.5rem);
    }

    .naf-shell__link-icon {
      font-size: 15px !important;
      width: 15px !important;
      height: 15px !important;
      color: var(--nf-text-muted, #9ca3af);
      flex-shrink: 0;
    }

    .naf-shell__link--direct.is-active .naf-shell__link-icon {
      color: var(--nf-color-primary-700, #1d4ed8);
    }

    .naf-shell__link-badge {
      margin-inline-start: auto;
      min-width: 1.25rem;
      padding: 0 6px;
      font-size: 0.6875rem;
      font-weight: 600;
      line-height: 1.25rem;
      text-align: center;
      border-radius: 9999px;
      background: var(--nf-color-primary, #3b82f6);
      color: #fff;
    }

    /* ─── Empty State ─── */
    .naf-shell__empty {
      font-size: var(--nf-font-size-sm, 0.875rem);
      color: var(--nf-text-muted, #6b7280);
      padding: var(--nf-space-4, 1rem) var(--nf-space-2, 0.5rem);
      text-align: center;
    }

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

    @media (max-width: 640px) {
      .naf-shell__user-name { display: none; }
      .naf-shell__user-chevron { display: none; }
      .naf-shell__ai-toggle-label { display: none; }
    }
  `],
})
export class PlatformAppShellComponent implements OnInit {
  private readonly auth = inject(AuthFacade);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly conversationApi = inject(ConversationApiService);
  private readonly elementRef = inject(ElementRef);
  readonly commandPalette = inject(CommandPaletteService);
  readonly themeService = inject(ThemeService);
  /** Injected so theme mode (light/dark/system) is applied from storage on app init */
  private readonly themeMode = inject(ThemeModeService);
  private readonly apiConfig = inject(ApiConfigService);
  private readonly appSettingsApi = inject(AppSettingsApiService);
  readonly approvalsFacade = inject(ApprovalsFacade);
  private readonly societeService = inject(SocieteService, { optional: true });
  private readonly shortcuts = inject(ShortcutsService);
  readonly onboarding = inject(OnboardingService);
  private loadVersion = 0;

  readonly shortcutsHelpOpen = signal(false);
  readonly onboardingInviteWidget = signal<Type<unknown> | null>(null);
  readonly onboardingMeterWidget = signal<Type<unknown> | null>(null);

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
  readonly appSettingsEnabled = input<boolean>(false);

  // ─── Shell State ─────────────────────────────────────────────────
  readonly sidebarCollapsed = signal<boolean>(
    Boolean(DEFAULT_PLATFORM_APP_SHELL_OPTIONS.sidebar.initiallyCollapsed)
  );
  readonly mobileNavOpen = signal<boolean>(false);
  readonly expandedDomains = signal<Set<string>>(new Set());
  /** Domains the user explicitly collapsed — auto-expand won't override these */
  private readonly manuallyCollapsed = new Set<string>();
  readonly userMenuOpen = signal<boolean>(false);

  // ─── Conversation State ──────────────────────────────────────────
  readonly conversationOpen = signal<boolean>((() => {
    // F-18: default closed; restore from localStorage if user previously opened it
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('shell.aiPanel.open') : null;
    if (stored !== null) return stored === '1';
    return Boolean(DEFAULT_PLATFORM_APP_SHELL_OPTIONS.conversation.initiallyOpen);
  })());
  readonly conversationMode = signal<ConversationMode>('ASK');
  readonly conversationDraft = signal<string>('');
  readonly conversationMessages = signal<UiConversationMessage[]>([]);
  readonly conversationLoading = signal<boolean>(false);
  readonly conversationSending = signal<boolean>(false);
  readonly conversationError = signal<string | null>(null);
  readonly conversationSessionIds = signal<Record<ConversationMode, string | null>>({
    ASK: null,
    AGENT: null,
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

  readonly visibleNavigation = computed(() => this.filterVisibleNodes(this.navigation()));

  readonly zoneGroups = computed((): SidebarZoneGroup[] => {
    const nodes = this.visibleNavigation();
    const zones = this.zoneConfig();
    const zoneOrderMap = new Map<string, { label: string; order: number }>();
    for (const zone of zones) {
      zoneOrderMap.set(zone.id, { label: zone.label, order: zone.order });
    }

    const groups = new Map<string, SidebarNode[]>();

    for (const node of nodes) {
      const zone = node.zone || 'default';
      if (!groups.has(zone)) {
        groups.set(zone, []);
      }
      groups.get(zone)!.push(node);
    }

    // Sort within each zone by order
    for (const list of groups.values()) {
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    return Array.from(groups.entries())
      .map(([zone, zoneNodes]) => ({
        zone,
        label: zoneOrderMap.get(zone)?.label || '',
        order: zoneOrderMap.get(zone)?.order ?? 9999,
        nodes: zoneNodes,
      }))
      .sort((a, b) => a.order - b.order);
  });

  readonly currentPageLabel = computed(() => {
    const activeLabel = this.findActiveLabel(this.visibleNavigation(), this.currentUrl());
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
  readonly userEmail = computed(() => this.auth.user()?.email || '');

  constructor() {
    if (environment.onboardingV2Enabled) {
      void import('@applications/erp/onboarding/onboarding-shell-widgets.component').then((m) => {
        this.onboardingInviteWidget.set(m.OnboardingInviteBannerWidgetComponent);
        this.onboardingMeterWidget.set(m.OnboardingCompletenessWidgetComponent);
        this.cdr.markForCheck();
      });
    }

    // Auto-expand domains that contain the active route (unless user manually collapsed)
    // Also enforces single-expanded-per-zone rule
    effect(() => {
      const url = this.currentUrl();
      const nodes = this.visibleNavigation();
      const activeDomainId = this.findActiveDomainId(nodes, url);
      if (activeDomainId && !this.expandedDomains().has(activeDomainId) && !this.manuallyCollapsed.has(activeDomainId)) {
        this.expandedDomains.update((set) => {
          const next = new Set(set);
          // Collapse siblings in the same zone
          const targetZone = this.findNodeZone(activeDomainId);
          if (targetZone) {
            for (const group of this.zoneGroups()) {
              if (group.zone === targetZone) {
                for (const node of group.nodes) {
                  if (node.id !== activeDomainId) {
                    next.delete(node.id);
                  }
                }
              }
            }
          }
          next.add(activeDomainId);
          return next;
        });
      }
    });

    // Auto-expand: (1) domains with meta.expanded: true, (2) single top-level group with children (e.g. Administration-only apps)
    effect(() => {
      const nodes = this.visibleNavigation();
      const expandedByZone = new Map<string, string>(); // zone → first domainId
      for (const node of nodes) {
        if (node.meta?.['expanded'] === true) {
          const zone = node.zone || 'default';
          if (!expandedByZone.has(zone)) {
            expandedByZone.set(zone, node.id);
          }
        }
      }
      // When there is only one top-level group and it has children, expand it so all items (e.g. Domain Activation, Subscriptions) are visible without clicking
      if (nodes.length === 1 && nodes[0].children?.length) {
        const zone = nodes[0].zone || 'default';
        if (!expandedByZone.has(zone)) {
          expandedByZone.set(zone, nodes[0].id);
        }
      }
      if (expandedByZone.size > 0) {
        this.expandedDomains.update((set) => {
          const next = new Set(set);
          for (const id of expandedByZone.values()) {
            next.add(id);
          }
          return next;
        });
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const options = this.resolvedShellOptions();
      if (!options.conversation.enabled && this.conversationOpen()) {
        this.conversationOpen.set(false);
        return;
      }
      if (options.conversation.enabled && options.conversation.initiallyOpen && !this.conversationOpen()) {
        this.conversationOpen.set(true);
      }
    });

    effect(() => {
      const options = this.resolvedShellOptions();
      const isOpen = this.conversationOpen();
      const mode = this.conversationMode();
      const appId = this.applicationId();
      if (!options.conversation.enabled || !isOpen || !appId) {
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

  // ─── Click Outside (user menu) ───────────────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.userMenuOpen()) {
      return;
    }
    const target = event.target as HTMLElement;
    const userMenu = this.elementRef.nativeElement.querySelector('.naf-shell__user-menu');
    if (userMenu && !userMenu.contains(target)) {
      this.userMenuOpen.set(false);
    }
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

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.userMenuOpen.update((v) => !v);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  /**
   * Hook for SocieteSwitcher (Task 8.3). Today the switcher already mutates the
   * service state ; we only re-trigger CD so any branding/title bound on the
   * current société picks up the change immediately.
   */
  onSocieteSwitcherChange(): void {
    const svc = this.societeService;
    if (!svc) {
      return;
    }
    const demoPrimaryBySociete: Record<string, string> = {
      'soc-somacom-btp': '#0d9488',
      'soc-somacom-tp': '#1d4ed8',
      'soc-somacom-logistique': '#7c3aed',
    };
    const id = svc.currentSocieteId();
    const b = this.themeService.branding();
    const fallback = b?.primaryColor && /^#/.test(b.primaryColor) ? b.primaryColor : null;
    this.themeService.applyPrimaryColor(demoPrimaryBySociete[id] ?? fallback);
    const soc = svc.currentSociete();
    if (soc) {
      const merged: TenantBranding = {
        logoUrl: b?.logoUrl ?? null,
        faviconUrl: b?.faviconUrl ?? null,
        primaryColor: demoPrimaryBySociete[id] ?? b?.primaryColor ?? null,
        tenantDisplayName: soc.raisonSociale,
      };
      this.themeService.applyDocumentChrome(merged);
    } else if (b) {
      this.themeService.applyDocumentChrome({
        logoUrl: b.logoUrl ?? null,
        faviconUrl: b.faviconUrl ?? null,
        primaryColor: demoPrimaryBySociete[id] ?? b.primaryColor ?? null,
        tenantDisplayName: b.tenantDisplayName ?? null,
      });
    } else {
      this.themeService.applyDocumentChrome(null);
    }
    this.cdr.markForCheck();
  }

  toggleDomain(domainId: string): void {
    this.expandedDomains.update((set) => {
      const next = new Set(set);
      if (next.has(domainId)) {
        next.delete(domainId);
        this.manuallyCollapsed.add(domainId);
      } else {
        // Single-expanded-per-zone: collapse other domains in the same zone
        const targetZone = this.findNodeZone(domainId);
        if (targetZone) {
          for (const group of this.zoneGroups()) {
            if (group.zone === targetZone) {
              for (const node of group.nodes) {
                if (node.id !== domainId && next.has(node.id)) {
                  next.delete(node.id);
                  this.manuallyCollapsed.add(node.id);
                }
              }
            }
          }
        }
        next.add(domainId);
        this.manuallyCollapsed.delete(domainId);
      }
      return next;
    });
    this.cdr.markForCheck();
  }

  /** Find the zone a domain node belongs to */
  private findNodeZone(domainId: string): string | null {
    for (const group of this.zoneGroups()) {
      if (group.nodes.some(n => n.id === domainId)) {
        return group.zone;
      }
    }
    return null;
  }

  onDomainClick(domain: SidebarNode): void {
    if (this.sidebarCollapsed()) {
      // Expand sidebar and expand this domain
      this.sidebarCollapsed.set(false);
      this.manuallyCollapsed.delete(domain.id);
      this.expandedDomains.update((set) => {
        const next = new Set(set);
        next.add(domain.id);
        return next;
      });
      this.cdr.markForCheck();
    } else if (this.nodeChildren(domain).length > 0) {
      this.toggleDomain(domain.id);
    } else if (domain.route) {
      void this.router.navigateByUrl(this.resolveRoute(domain.route));
      this.closeMobileNav();
    }
  }

  isDomainExpanded(domainId: string): boolean {
    return this.expandedDomains().has(domainId);
  }

  logout(): void {
    this.closeUserMenu();
    void this.auth.logout();
  }

  toggleConversation(): void {
    if (!this.resolvedShellOptions().conversation.enabled) {
      return;
    }
    this.conversationOpen.update((v) => {
      const next = !v;
      try { localStorage.setItem('shell.aiPanel.open', next ? '1' : '0'); } catch {}
      return next;
    });
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
    try {
      if (mode === 'ASK') {
        await this.conversationApi.sendAskMessage(conversationId, applicationId, { content });
      } else {
        await this.conversationApi.proposeActions(conversationId, applicationId, { content });
      }
      await this.loadConversationSessions(mode);
      await this.refreshConversation(mode);
    } catch (error) {
      this.conversationDraft.set(content);
      this.conversationMessages.update((messages) => messages.filter((m) => !m.id.startsWith('local-')));
      this.conversationError.set(this.extractErrorMessage(error));
    } finally {
      this.conversationSending.set(false);
    }
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
    if (role === 'user') return this.translateLabel('core.conversation.you');
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
  trackByNodeId = (_index: number, node: SidebarNode): string => node.id;
  trackByMessage = (_index: number, message: { id: string }): string => message.id;
  trackByAgentAction = (_index: number, action: AgentActionResponse): string => action.id;
  trackByZone = (index: number, group: SidebarZoneGroup): string => group.zone;

  // ─── Helpers ─────────────────────────────────────────────────────
  nodeChildren(node: SidebarNode): SidebarNode[] {
    return Array.isArray(node.children) ? node.children : [];
  }

  /** Count how many section-level children (children that themselves have children) a domain has */
  sectionCount(domain: SidebarNode): number {
    return this.nodeChildren(domain).filter(c => this.nodeChildren(c).length > 0).length;
  }

  resolveRoute(route: string | undefined): string {
    if (!route || !route.trim()) {
      return '/feature-unavailable/unknown';
    }
    const normalized = route.trim();
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }

  translateLabel(label: string | undefined): string {
    if (!label) return '';
    const translated = this.i18n.instant(label);
    if (translated && translated !== label) return translated;
    return this.humanize(label);
  }

  resolveNavIcon(icon: SidebarIcon | undefined): string {
    if (typeof icon !== 'string') return '';
    const normalized = icon.trim().toLowerCase().replace(/_/g, '-');
    if (!normalized) return '';
    return LUCIDE_ICON_ALIASES[normalized] || normalized;
  }

  // ─── Private: Conversation ───────────────────────────────────────
  private async refreshConversation(mode: ConversationMode): Promise<void> {
    const applicationId = this.applicationId();
    const conversationId = await this.ensureConversationSession(mode);
    if (!conversationId) return;

    const version = ++this.loadVersion;
    this.conversationLoading.set(true);
    this.conversationError.set(null);

    try {
      const [messages, actions] = await Promise.all([
        this.conversationApi.listMessages(conversationId, applicationId),
        mode === 'AGENT'
          ? this.conversationApi.listActions(conversationId, applicationId)
          : Promise.resolve<AgentActionResponse[]>([]),
      ]);
      if (version !== this.loadVersion) return;
      this.conversationMessages.set(messages.map((m) => this.mapConversationMessage(m)));
      this.agentActions.set(actions);
    } catch (error) {
      if (version !== this.loadVersion) return;
      if (error instanceof HttpErrorResponse && (error.status === 404 || error.status === 403)) {
        this.conversationSessionIds.update((current) => ({ ...current, [mode]: null }));
        this.storeSessionId(mode, null);
        const recreated = await this.ensureConversationSession(mode, true);
        if (recreated) {
          await this.refreshConversation(mode);
          return;
        }
      }
      this.conversationError.set(this.extractErrorMessage(error));
    } finally {
      if (version === this.loadVersion) this.conversationLoading.set(false);
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
    if (this.conversationMode() !== 'AGENT') return;
    const conversationId = this.conversationSessionIds().AGENT;
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

  private mapConversationMessage(message: ConversationMessage): UiConversationMessage {
    const role = (message.role || '').toUpperCase();
    return {
      id: message.id,
      role:
        role === 'USER' ? 'user'
        : role === 'SYSTEM' ? 'system'
        : role === 'TOOL' ? 'tool'
        : 'assistant',
      content: message.content || '',
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

  // ─── Private: Navigation ─────────────────────────────────────────
  private filterVisibleNodes(nodes: SidebarNode[]): SidebarNode[] {
    const result: SidebarNode[] = [];
    for (const node of nodes || []) {
      if (node.visible === false) continue;
      const children = this.filterVisibleNodes(node.children || []);
      if (children.length === 0 && !node.route) continue;
      result.push(children.length > 0 ? { ...node, children } : { ...node, children: undefined });
    }
    return result;
  }

  private findActiveLabel(nodes: SidebarNode[], url: string): string | null {
    const normalizedUrl = this.normalizeUrl(url);
    let winnerLabel: string | null = null;
    let winnerScore = -1;

    const visit = (node: SidebarNode): void => {
      if (node.route) {
        const route = this.normalizeUrl(node.route);
        if (route && normalizedUrl.startsWith(route)) {
          const score = route.length;
          if (score > winnerScore) {
            winnerScore = score;
            winnerLabel = node.label;
          }
        }
      }
      for (const child of node.children || []) {
        visit(child);
      }
    };

    for (const node of nodes) visit(node);
    return winnerLabel;
  }

  private findActiveDomainId(nodes: SidebarNode[], url: string): string | null {
    const normalizedUrl = this.normalizeUrl(url);
    for (const domain of nodes) {
      const visit = (node: SidebarNode): boolean => {
        if (node.route) {
          const route = this.normalizeUrl(node.route);
          if (route && normalizedUrl.startsWith(route)) return true;
        }
        for (const child of node.children || []) {
          if (visit(child)) return true;
        }
        return false;
      };
      if (visit(domain)) return domain.id;
    }
    return null;
  }

  private normalizeUrl(value: string): string {
    if (!value) return '';
    let normalized = value.trim();
    if (!normalized.startsWith('/')) normalized = `/${normalized}`;
    return normalized.replace(/\/+$/, '');
  }

  private humanize(value: string): string {
    const parts = value.includes('.') ? value.split('.') : [value];
    let key = parts[parts.length - 1] || value;
    if (parts.length >= 2 && key.toLowerCase() === 'title') {
      key = parts[0] || key;
    }
    const spaced = key
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();
    return spaced.replace(/\b\w/g, (char) => char.toUpperCase());
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
