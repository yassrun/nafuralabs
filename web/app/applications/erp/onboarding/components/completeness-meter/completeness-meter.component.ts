import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthFacade } from '@core/security/services/auth.facade';
import { environment } from '@env';
import { OnboardingApiService, type CompletenessResult, type CompletenessSection } from '../../services/onboarding-api.service';

const SECTION_ROUTES: Record<string, string> = {
  identity: '/administration/societe',
  preset: '/onboarding',
  chart: '/finance/plans-comptables',
  numbering: '/administration/numbering-sequences',
  articles: '/inventory/catalogue/articles',
  chantier: '/chantiers/new',
  team: '/administration/members',
};

import { ButtonComponent } from '@lib/anatomy';

@Component({
  selector: 'naf-completeness-meter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslateModule, ButtonComponent],
  template: `
    @if (environment.onboardingV2Enabled && score() !== null) {
      <div class="meter-wrap">
        <nf-button type="button" class="meter" (clicked)="togglePanel()" [attr.aria-expanded]="panelOpen()" variant="ghost" size="sm">
          <span class="meter__label">{{ 'onboarding.completeness.label' | translate }}</span>
          <span class="meter__value">{{ score() }}%</span>
          <span class="meter__bar" role="progressbar" [attr.aria-valuenow]="score()" aria-valuemin="0" aria-valuemax="100">
            <span class="meter__fill" [style.width.%]="score()"></span>
          </span>
        </nf-button>

        @if (panelOpen()) {
          <div class="meter-panel" role="dialog" aria-label="Configuration tenant">
            <p class="meter-panel__title">{{ 'onboarding.completeness.panelTitle' | translate }}</p>
            <ul class="meter-panel__list">
              @for (section of sections(); track section.id) {
                <li [class.is-done]="section.complete">
                  @if (sectionRoute(section); as route) {
                    <a [routerLink]="route" class="meter-panel__link" (click)="panelOpen.set(false)">
                      <span class="meter-panel__status">{{ section.complete ? '✓' : '○' }}</span>
                      {{ section.label }}
                    </a>
                  } @else {
                    <span class="meter-panel__link meter-panel__link--static">
                      <span class="meter-panel__status">{{ section.complete ? '✓' : '○' }}</span>
                      {{ section.label }}
                    </span>
                  }
                </li>
              }
            </ul>
            @if (score() !== null && score()! < 80) {
              <a routerLink="/administration/demo" class="meter-panel__demo" (click)="panelOpen.set(false)">
                {{ 'onboarding.completeness.loadDemo' | translate }}
              </a>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .meter-wrap { position: relative; }
    .meter {
      display: inline-flex; align-items: center; gap: 0.35rem;
      font-size: 0.75rem; color: var(--nf-text-secondary, var(--nf-text-muted));
      max-width: 160px; border: 0; background: transparent; cursor: pointer;
      padding: 2px 4px; border-radius: 6px;
    }
    .meter:hover { background: rgba(0,0,0,0.04); }
    .meter__bar {
      flex: 1; height: 4px; background: var(--nf-border-default); border-radius: 2px; overflow: hidden; min-width: 48px;
    }
    .meter__fill { display: block; height: 100%; background: var(--nf-color-success-600); transition: width 0.3s; }
    .meter-panel {
      position: absolute; top: calc(100% + 6px); inset-inline-end: 0; z-index: 400;
      min-width: 260px; max-width: 320px; padding: 0.75rem 1rem;
      background: var(--nf-color-surface); border: 1px solid var(--nf-border-default); border-radius: 10px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.12);
    }
    .meter-panel__title { font-weight: 600; font-size: 0.8125rem; margin: 0 0 0.5rem; color: var(--nf-text-primary); }
    .meter-panel__list { list-style: none; margin: 0; padding: 0; }
    .meter-panel__list li { margin: 0; }
    .meter-panel__link {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.35rem 0; font-size: 0.8125rem; color: var(--nf-text-primary); text-decoration: none;
    }
    .meter-panel__link:hover { color: var(--nf-color-primary-600); }
    .meter-panel__link--static { cursor: default; }
    .meter-panel__status { width: 1rem; flex-shrink: 0; color: var(--nf-color-success-600); }
    .meter-panel__list li:not(.is-done) .meter-panel__status { color: var(--nf-color-text-muted); }
    .meter-panel__demo {
      display: block; margin-top: 0.75rem; padding-top: 0.75rem;
      border-top: 1px solid var(--nf-color-bg-muted); font-size: 0.8125rem; font-weight: 600; color: var(--nf-color-primary-600);
      text-decoration: none;
    }
    .meter-panel__demo:hover { text-decoration: underline; }
  `],
})
export class CompletenessMeterComponent implements OnInit {
  readonly environment = environment;
  private readonly api = inject(OnboardingApiService);
  private readonly auth = inject(AuthFacade);

  readonly score = signal<number | null>(null);
  readonly sections = signal<CompletenessSection[]>([]);
  readonly panelOpen = signal(false);

  ngOnInit(): void {
    void this.refresh();
  }

  togglePanel(): void {
    this.panelOpen.update((v) => !v);
  }

  sectionRoute(section: CompletenessSection): string | null {
    if (section.complete) {
      return null;
    }
    return SECTION_ROUTES[section.id] ?? null;
  }

  private async refresh(): Promise<void> {
    const tenantId = this.auth.currentTenant()?.tenant.id;
    if (!tenantId || tenantId === 'pending-tenant') {
      return;
    }
    try {
      const result: CompletenessResult = await this.api.getCompleteness(tenantId);
      this.score.set(result.score);
      this.sections.set(result.sections);
    } catch {
      this.score.set(null);
      this.sections.set([]);
    }
  }
}
