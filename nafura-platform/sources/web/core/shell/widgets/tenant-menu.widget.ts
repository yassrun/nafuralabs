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
 * Top-bar tenant / organization menu — mirror of {@link UserMenuWidget}.
 * Holds tenant preferences (org settings), not personal user settings.
 */
@Component({
  selector: 'nf-tenant-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, LucideAngularModule, TranslateModule, AvatarComponent],
  template: `
    <div class="naf-shell__tenant-menu">
      <button
        type="button"
        class="naf-shell__tenant-trigger"
        (click)="toggle($event)"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="'core.topbar.tenantMenu' | translate">
        <nf-avatar [name]="tenantName()" size="xs" />
        <span class="naf-shell__tenant-name">{{ tenantName() }}</span>
        <lucide-icon
          name="chevron-down"
          [size]="18"
          class="naf-shell__icon naf-shell__tenant-chevron"
          aria-hidden="true"></lucide-icon>
      </button>

      @if (open()) {
        <div class="naf-shell__tenant-panel">
          <div class="naf-shell__tenant-panel-header">
            <nf-avatar [name]="tenantName()" size="sm" />
            <div class="naf-shell__tenant-panel-info">
              <div class="naf-shell__tenant-panel-name">{{ tenantName() }}</div>
              @if (tenantSubtitle()) {
                <div class="naf-shell__tenant-panel-meta">{{ tenantSubtitle() }}</div>
              }
            </div>
          </div>

          <div class="naf-shell__tenant-panel-divider"></div>

          @if (tenantSettingsEnabled()) {
            <a
              [routerLink]="tenantSettingsRoute()"
              class="naf-shell__tenant-panel-item"
              (click)="close()">
              <lucide-icon name="sliders-horizontal" [size]="18" class="naf-shell__icon" aria-hidden="true"></lucide-icon>
              {{ 'core.topbar.orgSettings' | translate }}
            </a>
          }
          @if (organizationIdentityEnabled()) {
            <a
              [routerLink]="organizationIdentityRoute()"
              class="naf-shell__tenant-panel-item"
              (click)="close()">
              <lucide-icon name="building-2" [size]="18" class="naf-shell__icon" aria-hidden="true"></lucide-icon>
              {{ 'core.topbar.orgIdentity' | translate }}
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; }

    .naf-shell__tenant-menu {
      position: relative;
    }

    .naf-shell__tenant-trigger {
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

    .naf-shell__tenant-trigger:hover {
      border-color: var(--nf-border-strong, #d1d5db);
    }

    .naf-shell__tenant-name {
      font-size: var(--nf-font-size-sm, 0.875rem);
      max-width: 140px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--nf-text-primary, #111827);
    }

    .naf-shell__tenant-chevron {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      color: var(--nf-text-muted, #6b7280);
    }

    .naf-shell__tenant-panel {
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

    .naf-shell__tenant-panel-header {
      display: flex;
      align-items: center;
      gap: var(--nf-space-2-5, 0.625rem);
      padding: var(--nf-space-2, 0.5rem);
    }

    .naf-shell__tenant-panel-info {
      min-width: 0;
    }

    .naf-shell__tenant-panel-name {
      font-size: var(--nf-font-size-sm, 0.875rem);
      font-weight: var(--nf-font-weight-semibold, 600);
      color: var(--nf-text-primary, #111827);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .naf-shell__tenant-panel-meta {
      font-size: var(--nf-font-size-xs, 0.75rem);
      color: var(--nf-text-muted, #6b7280);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .naf-shell__tenant-panel-divider {
      height: 1px;
      background: var(--nf-border-subtle, #f3f4f6);
      margin: var(--nf-space-1, 0.25rem) 0;
    }

    .naf-shell__tenant-panel-item {
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

    .naf-shell__tenant-panel-item:hover {
      background: var(--nf-surface-hover, #f9fafb);
    }

    .naf-shell__tenant-panel-item .naf-shell__icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--nf-text-muted, #6b7280);
    }

    @media (max-width: 640px) {
      .naf-shell__tenant-name { display: none; }
      .naf-shell__tenant-chevron { display: none; }
    }
  `],
})
export class TenantMenuWidget {
  private readonly auth = inject(AuthFacade);
  private readonly hostRef = inject(ElementRef);

  readonly tenantSettingsEnabled = input<boolean>(true);
  readonly tenantSettingsRoute = input<string>('/organization/settings');
  readonly organizationIdentityEnabled = input<boolean>(true);
  readonly organizationIdentityRoute = input<string>('/organization/identity');
  /** Shown when auth has no current tenant (lab / single-tenant). */
  readonly fallbackName = input<string>('Organisation');
  readonly fallbackKey = input<string>('');

  readonly open = signal(false);

  readonly tenantName = computed(() => {
    const membership = this.auth.currentTenant();
    const fromMembership = membership?.tenant?.name?.trim();
    if (fromMembership) return fromMembership;
    const fromCtx = this.auth.tenantContext()?.tenant?.name?.trim();
    if (fromCtx) return fromCtx;
    return this.fallbackName();
  });

  readonly tenantSubtitle = computed(() => {
    const membership = this.auth.currentTenant();
    const slug = membership?.tenant?.slug?.trim();
    if (slug) return slug;
    const ctxSlug = this.auth.tenantContext()?.tenant?.slug?.trim();
    if (ctxSlug) return ctxSlug;
    return this.fallbackKey() || '';
  });

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
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
