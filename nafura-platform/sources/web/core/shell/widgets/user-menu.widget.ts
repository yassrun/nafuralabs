import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';

import { AvatarComponent } from '../../../lib/anatomy/components/atoms/avatar/avatar.component';
import { AuthFacade } from '../../security/services/auth.facade';

/**
 * Default sidebar-footer user menu — reusable chrome for any platform app.
 *
 * Override via SHELL_EXTENSIONS slot `sidebar-user-menu`.
 */
@Component({
  selector: 'nf-user-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, LucideAngularModule, TranslateModule, AvatarComponent],
  template: `
    <div class="naf-shell__user-menu">
      <button
        type="button"
        class="naf-shell__user-trigger"
        (click)="toggle($event)"
        [attr.aria-expanded]="open()">
        <nf-avatar [name]="displayName()" size="xs" />
        <span class="naf-shell__user-name">{{ displayName() }}</span>
        <lucide-icon name="chevron-down" [size]="18" class="naf-shell__icon naf-shell__user-chevron" aria-hidden="true"></lucide-icon>
      </button>

      @if (open()) {
        <div class="naf-shell__user-panel">
          <div class="naf-shell__user-panel-header">
            <nf-avatar [name]="displayName()" size="sm" />
            <div class="naf-shell__user-panel-info">
              <div class="naf-shell__user-panel-name">{{ displayName() }}</div>
              <div class="naf-shell__user-panel-email">{{ userEmail() }}</div>
            </div>
          </div>

          <div class="naf-shell__user-panel-divider"></div>

          @if (userSettingsEnabled()) {
            <a
              [routerLink]="userSettingsRoute()"
              class="naf-shell__user-panel-item"
              (click)="close()">
              <lucide-icon name="settings" [size]="18" class="naf-shell__icon" aria-hidden="true"></lucide-icon>
              {{ 'core.topbar.mySettings' | translate }}
            </a>
          }

          <div class="naf-shell__user-panel-divider"></div>

          <button
            type="button"
            class="naf-shell__user-panel-item naf-shell__user-panel-item--danger"
            (click)="logout()">
            <lucide-icon name="log-out" [size]="18" class="naf-shell__icon" aria-hidden="true"></lucide-icon>
            {{ 'core.topbar.logout' | translate }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; }

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

    :host-context(.naf-shell__sidebar-footer) {
      display: flex;
    }

    :host-context(.naf-shell__sidebar-footer) .naf-shell__user-trigger {
      width: 100%;
      justify-content: flex-start;
    }

    :host-context(.naf-shell__sidebar-footer) .naf-shell__user-panel {
      top: auto;
      bottom: calc(100% + var(--nf-space-1-5, 0.375rem));
      inset-inline-start: 0;
      inset-inline-end: auto;
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

    @media (max-width: 640px) {
      .naf-shell__user-name { display: none; }
      .naf-shell__user-chevron { display: none; }
    }
  `],
})
export class UserMenuWidget {
  private readonly auth = inject(AuthFacade);
  private readonly hostRef = inject(ElementRef);

  readonly userSettingsEnabled = input<boolean>(false);
  readonly userSettingsRoute = input<string>('/user-settings');
  readonly fallbackName = input<string>('');

  readonly open = signal(false);

  readonly displayName = computed(
    () => this.auth.displayName() || this.fallbackName(),
  );
  readonly userEmail = computed(() => this.auth.user()?.email || '');

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }

  logout(): void {
    this.close();
    void this.auth.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) {
      return;
    }
    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.close();
    }
  }
}
