import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { BadgeComponent, ButtonComponent, EmptyStateComponent } from '@lib/anatomy/components';
import { ConfigDrivenDashboardPageImports } from '@lib/anatomy';

import type { Chantier } from '../../../chantiers/models';
import { ChantierApiService } from '../services/chantier-api.service';

@Component({
  selector: 'app-chantier-detail-placeholder',
  standalone: true,
  imports: [CommonModule, ...ConfigDrivenDashboardPageImports, BadgeComponent, ButtonComponent, EmptyStateComponent, TranslateModule],
  template: `
    <nf-page-shell [scroll]="true">
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      @if (chantier(); as current) {
        <section class="chantier-placeholder">
          <div class="chantier-placeholder__hero">
            <div>
              <p>{{ current.code }} · {{ current.ville }}</p>
              <h2>{{ current.name }}</h2>
            </div>
            <nf-badge variant="info">{{ current.avancementPercent }}%</nf-badge>
          </div>

          <div class="chantier-placeholder__grid">
            <article><h3>Client</h3><p>{{ current.clientName }}</p></article>
            <article><h3>Chef chantier</h3><p>{{ current.chefChantierName }}</p></article>
            <article><h3>Conducteur travaux</h3><p>{{ current.conducteurTravauxName }}</p></article>
            <article><h3>Budget</h3><p>{{ current.budgetHt | number:'1.0-0' }} MAD HT</p></article>
          </div>

          <div class="chantier-placeholder__actions">
            <nf-button variant="secondary" icon="arrow-left" iconLibrary="lucide" (clicked)="goBack()">{{ 'chantiers.planning.placeholder.backToPlanning' | translate }}</nf-button>
          </div>
        </section>
      } @else {
        <nf-empty-state
          icon="construction"
          [title]="'chantiers.chantier.detail.empty.notFoundTitle' | translate"
          message="Le chantier demandé est introuvable."
          [actionLabel]="'chantiers.planning.placeholder.backToPlanning' | translate"
          (action)="goBack()">
        </nf-empty-state>
      }
    </nf-page-shell>
  `,
  styles: [
    `
      .chantier-placeholder { display: grid; gap: 1rem; }
      .chantier-placeholder__hero { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding: 1.2rem; border-radius: 1.2rem; background: linear-gradient(135deg, rgba(15, 118, 110, 0.1), rgba(255, 255, 255, 0.96)); }
      .chantier-placeholder__hero p, .chantier-placeholder__hero h2 { margin: 0; }
      .chantier-placeholder__hero p { margin-bottom: 0.4rem; color: var(--nf-color-text-secondary); }
      .chantier-placeholder__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 1rem; }
      .chantier-placeholder__grid article { padding: 1rem; border-radius: 1rem; background: var(--nf-color-bg-subtle); }
      .chantier-placeholder__grid h3, .chantier-placeholder__grid p { margin: 0; }
      .chantier-placeholder__grid h3 { margin-bottom: 0.35rem; font-size: 0.85rem; color: var(--nf-color-text-secondary); }
      .chantier-placeholder__actions { display: flex; justify-content: flex-end; }
    `,
  ],
})
export class ChantierDetailPlaceholderPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly chantierApi = inject(ChantierApiService);

  readonly chantier = signal<Chantier | null>(null);

  constructor() {
    void this.loadChantier();
  }

  headerConfig() {
    const current = this.chantier();
    return {
      title: current?.code ?? 'Fiche chantier',
      subtitle: current?.name ?? 'Detail chantier',
      icon: 'construction',
    };
  }

  private async loadChantier(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!id) return;
    try {
      this.chantier.set(await this.chantierApi.getById(id));
    } catch {
      this.chantier.set(null);
    }
  }

  goBack(): void {
    void this.router.navigate(['/chantiers/planning']);
  }
}
