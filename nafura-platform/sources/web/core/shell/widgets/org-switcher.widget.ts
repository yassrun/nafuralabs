import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '../../../lib/anatomy/components/atoms/button';
import { ORG_CONTEXT_PORT } from '../org-context.port';

/**
 * Default topbar org / site switcher — reusable chrome for pro multi-tenant apps.
 *
 * Override via SHELL_EXTENSIONS `header-tenant-switcher`, or omit the slot and
 * provide {@link ORG_CONTEXT_PORT}.
 */
@Component({
  selector: 'nf-org-switcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, TranslateModule, ButtonComponent],
  template: `
    @if (visible()) {
      <div class="switcher" [class.is-open]="open()">
        <nf-button
          type="button"
          class="switcher__trigger"
          variant="secondary"
          size="sm"
          icon="building-2"
          iconLibrary="lucide"
          (clicked)="toggle()"
          [attr.aria-expanded]="open()"
          [attr.aria-haspopup]="'menu'"
          [title]="triggerTooltip()">
          <span class="switcher__label">
            <span class="switcher__org">{{ currentOrgLabel() }}</span>
            @if (currentSiteLabel(); as site) {
              <span class="switcher__sep" aria-hidden="true">·</span>
              <span class="switcher__site">{{ site }}</span>
            }
          </span>
          <span class="switcher__caret" aria-hidden="true">▾</span>
        </nf-button>

        @if (open()) {
          <div class="switcher__panel" role="menu">
            <div class="switcher__section">
              <div class="switcher__section-label">{{ 'core.orgSwitcher.orgs' | translate }}</div>
              @for (org of orgs(); track org.id) {
                <nf-button
                  type="button"
                  class="switcher__item"
                  role="menuitemradio"
                  [attr.aria-checked]="org.id === currentOrgId()"
                  [class.is-active]="org.id === currentOrgId()"
                  (clicked)="selectOrg(org.id)"
                  variant="secondary">
                  <span class="switcher__item-main">{{ org.label }}</span>
                  @if (org.meta) {
                    <span class="switcher__item-meta">{{ org.meta }}</span>
                  }
                </nf-button>
              }
            </div>

            @if (sites().length > 0) {
              <div class="switcher__divider" role="separator"></div>
              <div class="switcher__section">
                <div class="switcher__section-label">{{ 'core.orgSwitcher.sites' | translate }}</div>
                @for (site of sites(); track site.id) {
                  <nf-button
                    type="button"
                    class="switcher__item switcher__item--site"
                    role="menuitemradio"
                    [attr.aria-checked]="site.id === currentSiteId()"
                    [class.is-active]="site.id === currentSiteId()"
                    (clicked)="selectSite(site.id)"
                    variant="ghost">
                    <span class="switcher__item-main">{{ site.label }}</span>
                    @if (site.meta) {
                      <span class="switcher__item-meta">{{ site.meta }}</span>
                    }
                  </nf-button>
                }
              </div>
            }

            <div class="switcher__divider" role="separator"></div>
            <a
              class="switcher__settings"
              [routerLink]="settingsRoute"
              (click)="close()">
              {{ 'core.orgSwitcher.settings' | translate }}
            </a>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; }

    .switcher { position: relative; display: inline-flex; align-items: center; }

    .switcher__trigger {
      --nf-button-icon-text-gap: 0.375rem;
      --nf-button-content-gap: 0.25rem;
      max-width: 280px;
    }

    .switcher__trigger ::ng-deep button {
      display: inline-flex;
      align-items: center;
      max-width: 280px;
      height: 34px;
      min-height: 34px;
      padding: 0 0.625rem;
      border-radius: 9999px;
    }

    .switcher.is-open .switcher__trigger ::ng-deep button {
      border-color: var(--nf-color-primary-300);
      background: var(--nf-primary-subtle, var(--nf-color-primary-50));
    }

    .switcher__label {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      min-width: 0;
      line-height: 1.1;
    }

    .switcher__org {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--nf-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .switcher__sep { flex-shrink: 0; color: var(--nf-text-muted); }
    .switcher__etab, .switcher__site {
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--nf-text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .switcher__caret { font-size: 11px; color: var(--nf-text-muted); flex-shrink: 0; }

    .switcher__panel {
      position: absolute;
      top: calc(100% + 0.375rem);
      right: 0;
      min-width: 320px;
      max-width: 380px;
      background: var(--nf-color-surface);
      border: 1px solid var(--nf-border-default);
      border-radius: 0.75rem;
      box-shadow: var(--nf-shadow-lg, 0 10px 30px rgba(2, 6, 23, 0.12));
      padding: 0.5rem;
      z-index: 200;
    }

    .switcher__section { display: flex; flex-direction: column; gap: 2px; }
    .switcher__section-label {
      font-size: 0.66rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 700;
      color: var(--nf-text-muted);
      padding: 0.375rem 0.5rem 0.25rem;
    }
    .switcher__divider { height: 1px; background: var(--nf-border-subtle); margin: 0.375rem 0; }

    .switcher__item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      width: 100%;
      padding: 0.5rem 0.625rem;
      border: none;
      border-radius: 0.5rem;
      background: transparent;
      text-align: left;
    }
    .switcher__item:hover { background: var(--nf-surface-hover); }
    .switcher__item.is-active {
      background: var(--nf-primary-subtle, var(--nf-color-primary-50));
      color: var(--nf-color-primary-700);
    }
    .switcher__item-main { font-size: 0.83rem; font-weight: 700; }
    .switcher__item-meta { font-size: 0.7rem; color: var(--nf-text-muted); }
    .switcher__item--site .switcher__item-main { font-weight: 600; }

    .switcher__settings {
      display: block;
      padding: 0.5rem 0.625rem;
      border-radius: 0.5rem;
      font-size: 0.83rem;
      font-weight: 600;
      color: var(--nf-color-primary-700, #1d4ed8);
      text-decoration: none;
    }
    .switcher__settings:hover { background: var(--nf-surface-hover); }

    @media (max-width: 980px) {
      .switcher__trigger { max-width: 200px; }
      .switcher__site, .switcher__sep { display: none; }
    }
  `],
})
export class OrgSwitcherWidget {
  private readonly org = inject(ORG_CONTEXT_PORT);
  private readonly hostRef = inject(ElementRef);

  readonly open = signal(false);
  readonly orgs = this.org.orgs;
  readonly sites = this.org.sites;
  readonly currentOrgId = this.org.currentOrgId;
  readonly currentSiteId = this.org.currentSiteId;
  readonly settingsRoute = this.org.settingsRoute;

  readonly visible = computed(() => this.orgs().length >= 1);

  readonly currentOrgLabel = computed(() => {
    const id = this.currentOrgId();
    return this.orgs().find((o) => o.id === id)?.label ?? '—';
  });

  readonly currentSiteLabel = computed(() => {
    const id = this.currentSiteId();
    return this.sites().find((s) => s.id === id)?.label ?? null;
  });

  readonly triggerTooltip = computed(() => {
    const parts = [this.currentOrgLabel(), this.currentSiteLabel()].filter(Boolean);
    return parts.join(' · ');
  });

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }

  selectOrg(id: string): void {
    if (id !== this.currentOrgId()) {
      this.org.selectOrg(id);
    }
    this.close();
  }

  selectSite(id: string): void {
    if (id !== this.currentSiteId()) {
      this.org.selectSite(id);
    }
    this.close();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.close();
  }
}
