import { Directive, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BasePageClass } from '../../../core/pages/base-page.class';
import { PageHeaderComponent } from '../components';
import { PageShellComponent } from '../components';
import { DashboardGridComponent } from '../components';
import { DashboardPanelComponent } from '../components';
import type { DashboardPageConfig, DashboardDataProvider } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// SHARED IMPORTS & STYLES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Common imports for config-driven dashboard pages.
 * Use in your component's imports array.
 */
export const ConfigDrivenDashboardPageImports = [
  CommonModule,
  PageShellComponent,
  PageHeaderComponent,
  DashboardGridComponent,
  DashboardPanelComponent,
] as const;

/**
 * Common styles for config-driven dashboard pages.
 * Use in your component's styles array.
 */
export const ConfigDrivenDashboardPageStyles = `
  :host {
    display: block;
    height: 100%;
  }

  nf-page-shell {
    height: 100%;
  }

  nf-page-header {
    flex: 0 0 auto;
  }

  nf-dashboard-grid {
    flex: 1 1 auto;
    min-height: 0;
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// BASE CLASS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Base class for config-driven dashboards.
 *
 * Subclass must provide:
 * - config: Dashboard page configuration
 * - dataProvider: Snapshot provider
 * - mapSnapshot: Map snapshot into view-model signals
 */
@Directive()
export abstract class ConfigDrivenDashboardPage<TSnapshot> extends BasePageClass {
  abstract readonly config: DashboardPageConfig;
  abstract readonly dataProvider: DashboardDataProvider<TSnapshot>;

  protected readonly snapshot = signal<TSnapshot | null>(null);
  protected readonly loading = signal(true);
  protected readonly dashboardError = signal<string | null>(null);

  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  protected override onPageInit(): void {
    void this.loadSnapshot();
    this.startAutoRefresh();
    this.onDashboardInit();
  }

  protected onDashboardInit(): void {
    // Optional hook for subclasses.
  }

  protected abstract mapSnapshot(snapshot: TSnapshot): void;

  protected async refreshSnapshot(): Promise<void> {
    const loader = this.dataProvider.refreshSnapshot
      ? this.dataProvider.refreshSnapshot.bind(this.dataProvider)
      : this.dataProvider.loadSnapshot.bind(this.dataProvider);
    await this.loadSnapshot(true, loader);
  }

  private startAutoRefresh(): void {
    const interval = this.config.refreshIntervalMs;
    if (!interval) {
      return;
    }

    this.refreshTimer = setInterval(() => {
      void this.refreshSnapshot();
    }, interval);

    this.destroyRef.onDestroy(() => this.clearRefreshTimer());
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private async loadSnapshot(
    isRefresh = false,
    loader: () => Promise<TSnapshot> = this.dataProvider.loadSnapshot.bind(this.dataProvider)
  ): Promise<void> {
    if (!isRefresh) {
      this.loading.set(true);
    }

    this.dashboardError.set(null);

    try {
      const snapshot = await loader();
      this.snapshot.set(snapshot);
      this.mapSnapshot(snapshot);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load dashboard';
      this.dashboardError.set(message);
    } finally {
      if (!isRefresh) {
        this.loading.set(false);
      }
    }
  }
}
