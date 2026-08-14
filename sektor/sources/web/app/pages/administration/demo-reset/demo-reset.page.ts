import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, PageHeaderComponent, PageShellComponent } from '@lib/anatomy';

const DEMO_STORAGE_KEYS = [
  'nafura-erp-chantiers-mock-v1',
  'nafura-erp-rh-mock-v1',
  'nafura-societe-settings',
  'nafura-fiscal-settings',
  'shell.aiPanel.open',
];

@Component({
  selector: 'app-demo-reset',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, PageShellComponent, PageHeaderComponent, ButtonComponent],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig"></nf-page-header>

      <div class="demo-page">
        <!-- Société modèle -->
        <section class="info-card">
          <div class="card-icon">🏗</div>
          <div>
            <h2>{{ 'admin.demoReset.card.title' | translate }}</h2>
            <p>{{ 'admin.demoReset.card.identite' | translate }}</p>
            <p>{{ 'admin.demoReset.card.perimetre' | translate }}</p>
          </div>
        </section>

        <!-- Actions -->
        <div class="actions">
          <article class="action-card">
            <div class="action-icon">🔄</div>
            <div class="action-body">
              <h3>{{ 'admin.demoReset.actions.resetTitle' | translate }}</h3>
              <p>{{ 'admin.demoReset.actions.resetDesc' | translate }}</p>
            </div>
            <nf-button class="btn btn--reset" (clicked)="resetAll()" [disabled]="resetting()" variant="danger">
              {{ (resetting() ? 'admin.demoReset.actions.resetting' : 'admin.demoReset.actions.resetButton') | translate }}
            </nf-button>
          </article>

          <article class="action-card">
            <div class="action-icon">💾</div>
            <div class="action-body">
              <h3>{{ 'admin.demoReset.actions.exportTitle' | translate }}</h3>
              <p>{{ 'admin.demoReset.actions.exportDesc' | translate }}</p>
            </div>
            <nf-button class="btn btn--export" (clicked)="exportSnapshot()" variant="primary">{{ 'admin.demoReset.actions.exportButton' | translate }}</nf-button>
          </article>
        </div>

        @if (resetDone()) {
          <div class="success-banner">
            {{ 'admin.demoReset.success.banner' | translate }}
            <nf-button class="btn-reload" (clicked)="reload()" variant="ghost">{{ 'admin.demoReset.success.reload' | translate }}</nf-button>
          </div>
        }

        <!-- Contenu du seed -->
        <section class="seed-summary">
          <h3>{{ 'admin.demoReset.summary.title' | translate }}</h3>
          <div class="summary-grid">
            <div class="summary-item"><span class="sum-num">6</span><span>{{ 'admin.demoReset.summary.items.chantiers' | translate }}</span></div>
            <div class="summary-item"><span class="sum-num">12</span><span>{{ 'admin.demoReset.summary.items.marches' | translate }}</span></div>
            <div class="summary-item"><span class="sum-num">5</span><span>{{ 'admin.demoReset.summary.items.avenants' | translate }}</span></div>
            <div class="summary-item"><span class="sum-num">7</span><span>{{ 'admin.demoReset.summary.items.factures' | translate }}</span></div>
            <div class="summary-item"><span class="sum-num">6</span><span>{{ 'admin.demoReset.summary.items.cautions' | translate }}</span></div>
            <div class="summary-item"><span class="sum-num">15</span><span>{{ 'admin.demoReset.summary.items.employes' | translate }}</span></div>
            <div class="summary-item"><span class="sum-num">8</span><span>{{ 'admin.demoReset.summary.items.fournisseurs' | translate }}</span></div>
            <div class="summary-item"><span class="sum-num">6</span><span>{{ 'admin.demoReset.summary.items.approbations' | translate }}</span></div>
            <div class="summary-item"><span class="sum-num">3</span><span>{{ 'admin.demoReset.summary.items.ncHse' | translate }}</span></div>
            <div class="summary-item"><span class="sum-num">8</span><span>{{ 'admin.demoReset.summary.items.epi' | translate }}</span></div>
          </div>
        </section>
      </div>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .demo-page { max-width: 760px; display: flex; flex-direction: column; gap: 1.25rem; }

    .info-card { display: flex; gap: 1rem; align-items: flex-start; padding: 1.25rem 1.5rem; background: linear-gradient(135deg, rgba(13,148,136,0.06), rgba(255,255,255,0.98)); border: 1px solid rgba(13,148,136,0.2); border-radius: 1rem; }
    .card-icon { font-size: 2.5rem; flex-shrink: 0; }
    .info-card h2 { margin: 0 0 0.25rem; font-size: 1rem; font-weight: 700; color: var(--nf-text-primary); }
    .info-card p { margin: 0.15rem 0; font-size: 0.85rem; color: var(--nf-color-text-secondary); }

    .actions { display: flex; flex-direction: column; gap: 0.875rem; }
    .action-card { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; background: white; border: 1px solid var(--nf-color-border); border-radius: 0.875rem; }
    .action-icon { font-size: 1.75rem; flex-shrink: 0; }
    .action-body { flex: 1; }
    .action-body h3 { margin: 0 0 0.2rem; font-size: 0.95rem; font-weight: 700; color: var(--nf-text-primary); }
    .action-body p { margin: 0; font-size: 0.83rem; color: var(--nf-color-text-secondary); }
    .btn { padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; white-space: nowrap; }
    .btn--reset { background: var(--nf-color-danger-600); color: white; }
    .btn--reset:hover { background: var(--nf-color-danger-700); }
    .btn--reset:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn--export { background: var(--nf-color-primary-700); color: white; }
    .btn--export:hover { background: var(--nf-color-primary-800); }

    .success-banner { background: var(--nf-color-success-100); border: 1px solid var(--nf-color-success-300); border-radius: 0.75rem; padding: 1rem 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; font-size: 0.9rem; font-weight: 600; color: var(--nf-color-success-700); }
    .btn-reload { padding: 6px 14px; background: var(--nf-color-success-600); color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; }

    .seed-summary { background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 0.875rem; padding: 1.25rem 1.5rem; }
    .seed-summary h3 { margin: 0 0 1rem; font-size: 0.82rem; font-weight: 700; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.75rem; }
    .summary-item { display: flex; flex-direction: column; align-items: center; padding: 0.75rem; background: white; border-radius: 0.625rem; border: 1px solid var(--nf-color-border); text-align: center; }
    .sum-num { font-size: 1.75rem; font-weight: 800; color: var(--nf-color-teal-600, var(--nf-color-success-600)); line-height: 1; }
    .summary-item span:last-child { font-size: 0.75rem; color: var(--nf-color-text-secondary); margin-top: 0.25rem; }
  `],
})
export class DemoResetPage {
  private readonly translate = inject(TranslateService);

  readonly resetting = signal(false);
  readonly resetDone = signal(false);

  readonly headerConfig = {
    title: this.translate.instant('admin.demoReset.title'),
    subtitle: this.translate.instant('admin.demoReset.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('admin.common.breadcrumb.administration'), route: '/admin' },
      { label: this.translate.instant('admin.demoReset.breadcrumb') },
    ],
  };

  resetAll(): void {
    this.resetting.set(true);
    DEMO_STORAGE_KEYS.forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });
    setTimeout(() => {
      this.resetting.set(false);
      this.resetDone.set(true);
    }, 800);
  }

  exportSnapshot(): void {
    const snapshot: Record<string, unknown> = {};
    DEMO_STORAGE_KEYS.forEach(k => {
      try {
        const v = localStorage.getItem(k);
        if (v) snapshot[k] = JSON.parse(v);
      } catch {}
    });
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nafura-demo-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  reload(): void { window.location.reload(); }
}
