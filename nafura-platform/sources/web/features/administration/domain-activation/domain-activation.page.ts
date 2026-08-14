import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  LucideAngularModule,
} from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';
import { firstValueFrom } from 'rxjs';

import {
  PageHeaderComponent,
  PageShellComponent,
  ToastService,
  ConfirmDialogService,
} from '@lib/anatomy';
import { PermissionService } from '@core/security/services/permission.service';

import type { DomainActivationStatus } from './models/domain-activation.model';
import { DomainActivationApiService } from './services/domain-activation-api.service';

/** Lucide icon names we support for domain cards; fallback is layout-grid */
const DOMAIN_ICON_NAMES = new Set([
  'layout-grid',
  'lock',
  'banknote',
  'package',
  'users',
  'file-text',
  'calculator',
  'truck',
  'building',
  'layers',
]);

@Component({
  selector: 'app-domain-activation-page',
  standalone: true,
  imports: [
    CommonModule,
    MatSlideToggleModule,
    MatTooltipModule,
    TranslateModule,
    LucideAngularModule,
    PageShellComponent,
    PageHeaderComponent,
  ],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      @if (loading()) {
        <p class="domain-activation__state domain-activation__state--loading">
          {{ 'administration.domains.loading' | translate }}
        </p>
      } @else if (error()) {
        <p class="domain-activation__state domain-activation__state--error">
          {{ error() }}
        </p>
      } @else if (domains().length === 0) {
        <p class="domain-activation__empty">
          {{ 'administration.domains.empty' | translate }}
        </p>
      } @else {
        <div class="domain-activation__grid">
          @for (domain of domains(); track domain.domainId) {
            <article
              class="domain-card"
              [class.domain-card--active]="domain.isActive"
              [class.domain-card--locked]="domain.isLocked">
              <div class="domain-card__header">
                <lucide-icon
                  [name]="domainIconName(domain)"
                  [size]="24"
                  class="domain-card__icon"
                  aria-hidden="true">
                </lucide-icon>
                <h3 class="domain-card__name">{{ domain.name }}</h3>
                @if (domain.isLocked) {
                  <lucide-icon
                    name="lock"
                    [size]="18"
                    class="domain-card__lock"
                    [matTooltip]="'administration.domains.locked' | translate"
                    matTooltipPosition="above">
                  </lucide-icon>
                }
              </div>

              <p class="domain-card__meta">
                {{ 'administration.domains.entities' | translate: { count: domain.entityCount } }}
              </p>
              @if (domain.entities.length) {
                <p class="domain-card__preview">
                  {{ entityPreview(domain) }}
                </p>
              }

              <div class="domain-card__footer">
                <span class="domain-card__status">
                  <span
                    class="domain-card__pill"
                    [class.domain-card__pill--active]="domain.isActive">
                    {{
                      (domain.isActive ? 'administration.domains.active' : 'administration.domains.inactive')
                        | translate
                    }}
                  </span>
                  @if (domain.isActive && domain.activatedAt) {
                    <span class="domain-card__since">
                      {{ 'administration.domains.since' | translate: { date: formatDate(domain.activatedAt) } }}
                    </span>
                  }
                </span>
                <span class="domain-card__toggle">
                  @if (savingId() === domain.domainId) {
                    <span class="domain-card__spinner" aria-hidden="true"></span>
                  } @else {
                    <mat-slide-toggle
                      [checked]="domain.isActive"
                      [disabled]="domain.isLocked || !canWrite()"
                      [matTooltip]="
                        domain.isLocked
                          ? ('administration.domains.locked' | translate)
                          : (!canWrite() ? ('administration.domains.readOnlyTooltip' | translate) : '')
                      "
                      matTooltipPosition="above"
                      (change)="onToggle($event.checked, domain)">
                    </mat-slide-toggle>
                  }
                </span>
              </div>
            </article>
          }
        </div>
      }
    </nf-page-shell>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      .domain-activation__state,
      .domain-activation__empty {
        margin: 0;
        padding: 1rem 0;
        color: var(--nf-color-text-secondary, #64748b);
      }

      .domain-activation__state--loading {
        color: var(--nf-color-text, #334155);
      }

      .domain-activation__state--error {
        color: var(--nf-color-danger, #b91c1c);
      }

      .domain-activation__empty {
        font-size: 0.9375rem;
      }

      .domain-activation__grid {
        display: grid;
        gap: 1.25rem;
        grid-template-columns: 1fr;
      }

      @media (min-width: 600px) {
        .domain-activation__grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (min-width: 960px) {
        .domain-activation__grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      .domain-card {
        border: 1px solid var(--nf-color-border, #e2e8f0);
        border-radius: 12px;
        background: var(--nf-color-surface, #ffffff);
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .domain-card--locked {
        opacity: 0.85;
        background: var(--nf-color-gray-50, #f8fafc);
      }

      .domain-card--active {
        border-color: var(--nf-color-primary-200, #93c5fd);
        box-shadow: 0 0 0 1px var(--nf-color-primary-100, #bfdbfe) inset;
      }

      .domain-card__header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .domain-card__icon {
        font-size: 1.5rem;
        line-height: 1;
        opacity: 0.9;
      }

      .domain-card__name {
        margin: 0;
        font-size: 1.0625rem;
        font-weight: 600;
        flex: 1;
      }

      .domain-card__lock {
        font-size: 1rem;
        opacity: 0.7;
      }

      .domain-card__meta {
        margin: 0;
        font-size: 0.875rem;
        color: var(--nf-color-text-secondary, #64748b);
      }

      .domain-card__preview {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--nf-color-text-secondary, #64748b);
        line-height: 1.4;
      }

      .domain-card__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-top: auto;
        padding-top: 0.5rem;
        border-top: 1px solid var(--nf-color-border-subtle, #f1f5f9);
      }

      .domain-card__status {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }

      .domain-card__pill {
        display: inline-block;
        border-radius: 9999px;
        padding: 0.2rem 0.6rem;
        font-size: 0.75rem;
        font-weight: 500;
        background: var(--nf-color-gray-200, #e2e8f0);
        color: var(--nf-color-gray-800, #1e293b);
      }

      .domain-card__pill--active {
        background: var(--nf-color-success-200, #bbf7d0);
        color: var(--nf-color-success-800, #166534);
      }

      .domain-card__since {
        font-size: 0.75rem;
        color: var(--nf-color-text-secondary, #64748b);
      }

      .domain-card__toggle {
        flex-shrink: 0;
      }

      .domain-card__spinner {
        display: inline-block;
        width: 24px;
        height: 24px;
        border: 2px solid var(--nf-color-primary-200, #bfdbfe);
        border-top-color: var(--nf-color-primary, #2563eb);
        border-radius: 50%;
        animation: domain-spin 0.7s linear infinite;
      }

      @keyframes domain-spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class DomainActivationPage {
  private readonly api = inject(DomainActivationApiService);
  private readonly permissionService = inject(PermissionService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly translate = inject(TranslateService);

  readonly domains = signal<DomainActivationStatus[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly savingId = signal<string | null>(null);

  readonly canWrite = computed(() =>
    this.permissionService.hasPermission('administration.domains.write')
  );

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('administration.domains.title'),
    subtitle: this.translate.instant('administration.domains.subtitle'),
    icon: 'puzzle',
  }));

  constructor() {
    void this.loadDomains();
  }

  domainIconName(domain: DomainActivationStatus): string {
    const name = (domain.icon ?? 'layout-grid').toLowerCase().replace(/_/g, '-');
    return DOMAIN_ICON_NAMES.has(name) ? name : 'layout-grid';
  }

  entityPreview(domain: DomainActivationStatus): string {
    const first = domain.entities.slice(0, 3);
    return first.length ? first.join(', ') + (domain.entities.length > 3 ? '...' : '') : '';
  }

  formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(resolveLocale(this.translate), {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  }

  async onToggle(checked: boolean, domain: DomainActivationStatus): Promise<void> {
    if (domain.isLocked || !this.canWrite()) return;

    if (checked) {
      await this.activate(domain);
    } else {
      await this.deactivate(domain);
    }
  }

  private async activate(domain: DomainActivationStatus): Promise<void> {
    this.savingId.set(domain.domainId);
    try {
      const updated = await firstValueFrom(this.api.activateDomain(domain.domainId));
      this.domains.update((items) =>
        items.map((item) => (item.domainId === updated.domainId ? updated : item))
      );
      this.toast.success(
        this.translate.instant('administration.domains.activate.success', { name: updated.name })
      );
    } catch {
      this.toast.error(this.translate.instant('administration.domains.toggleError'));
      this.domains.update((items) =>
        items.map((item) => (item.domainId === domain.domainId ? { ...item, isActive: false } : item))
      );
    } finally {
      this.savingId.set(null);
    }
  }

  private async deactivate(domain: DomainActivationStatus): Promise<void> {
    const title = this.translate.instant('administration.domains.deactivate.confirm.title', {
      name: domain.name,
    });
    const message = this.translate.instant('administration.domains.deactivate.confirm.message', {
      name: domain.name,
    });
    const confirmLabel = this.translate.instant('administration.domains.deactivate.confirm.confirmLabel');
    const confirmed = await this.confirmDialog.confirm({
      title,
      message,
      confirmLabel,
      variant: 'danger',
      icon: 'warning',
    });
    if (!confirmed) return;

    this.savingId.set(domain.domainId);
    try {
      const updated = await firstValueFrom(this.api.deactivateDomain(domain.domainId));
      this.domains.update((items) =>
        items.map((item) => (item.domainId === updated.domainId ? updated : item))
      );
      this.toast.success(
        this.translate.instant('administration.domains.deactivate.success', { name: updated.name })
      );
    } catch {
      this.toast.error(this.translate.instant('administration.domains.toggleError'));
      this.domains.update((items) =>
        items.map((item) => (item.domainId === domain.domainId ? { ...item, isActive: true } : item))
      );
    } finally {
      this.savingId.set(null);
    }
  }

  private async loadDomains(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const items = await firstValueFrom(this.api.getDomains());
      this.domains.set(items);
    } catch {
      this.error.set(this.translate.instant('administration.domains.error'));
    } finally {
      this.loading.set(false);
    }
  }
}
