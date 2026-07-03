import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { BankReconciliationApiService } from '@applications/erp/finance/services/bank-reconciliation-api.service';
import { CaisseApiService } from '@applications/erp/finance/services/caisse-api.service';
import { SoldeIndicatorComponent } from '@applications/erp/finance/components';
import type { CompteFinancier } from '@applications/erp/finance/models';
import { NumberLocalizedPipe } from '@lib/anatomy/pipes';
import { ButtonComponent } from '@lib/anatomy/components';


@Component({
  selector: 'app-compte-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule, SoldeIndicatorComponent, NumberLocalizedPipe, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cd">
      <header class="cd__head">
        <nf-button variant="ghost" class="cd__back" (clicked)="back()">{{ 'finance.compte.detail.back' | translate }}</nf-button>
        @if (compte(); as c) {
          <div class="cd__title-block">
            <div class="cd__breadcrumb">
              {{ (c.type === 'BANQUE' ? 'finance.compte.types.banque' : 'finance.compte.types.caisse') | translate }} · {{ c.code }}
            </div>
            <h1 class="cd__title">{{ c.libelle }}</h1>
          </div>
          <nf-button variant="primary" class="cd__btn" (clicked)="voirMouvements()">
            {{ 'finance.compte.detail.viewMouvements' | translate }}
          </nf-button>
        }
      </header>

      @if (compte(); as c) {
        <section class="cd__grid">
          <div class="cd__card">
            <h3>{{ 'finance.compte.detail.identification' | translate }}</h3>
            <dl>
              <div><dt>{{ 'finance.compte.list.columns.code' | translate }}</dt><dd>{{ c.code }}</dd></div>
              <div><dt>{{ 'finance.compte.list.columns.type' | translate }}</dt><dd>{{ (c.type === 'BANQUE' ? 'finance.compte.type.BANQUE' : 'finance.compte.type.CAISSE') | translate }}</dd></div>
              <div><dt>{{ 'finance.compte.detail.compteCgnc' | translate }}</dt><dd>{{ c.compteCgncCode }}</dd></div>
              <div><dt>{{ 'finance.compte.list.columns.devise' | translate }}</dt><dd>{{ c.devise }}</dd></div>
              <div><dt>{{ 'finance.common.filters.status' | translate }}</dt><dd>{{ (c.isActive ? 'finance.compte.detail.active' : 'finance.compte.detail.inactive') | translate }}</dd></div>
            </dl>
          </div>
          @if (c.type === 'BANQUE') {
            <div class="cd__card">
              <h3>{{ 'finance.compte.detail.coordonneesBancaires' | translate }}</h3>
              <dl>
                @if (c.banque) {<div><dt>{{ 'finance.compte.list.columns.banque' | translate }}</dt><dd>{{ c.banque }}</dd></div>}
                @if (c.agence) {<div><dt>{{ 'finance.compte.detail.agence' | translate }}</dt><dd>{{ c.agence }}</dd></div>}
                @if (c.rib) {<div><dt>{{ 'finance.compte.list.columns.rib' | translate }}</dt><dd class="cd__rib">{{ c.rib }}</dd></div>}
              </dl>
            </div>
          }
          <div class="cd__card">
            <h3>{{ 'finance.compte.detail.soldes' | translate }}</h3>
            <div class="cd__solde-block">
              <span class="cd__solde-label">{{ 'finance.compte.list.columns.soldeInitial' | translate }}</span>
              <span class="cd__solde-value">
                {{ c.soldeInitial | numberLocalized:'1.2-2' }} {{ c.devise }}
              </span>
            </div>
            <div class="cd__solde-block">
              <span class="cd__solde-label">{{ 'finance.compte.list.columns.soldeComptable' | translate }}</span>
              <app-solde-indicator [value]="c.soldeActuel" [currency]="c.devise" />
            </div>
          </div>
          @if (c.notes) {
            <div class="cd__card">
              <h3>{{ 'finance.compte.detail.notes' | translate }}</h3>
              <p>{{ c.notes }}</p>
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; width: 100%; height: 100%; overflow-y: auto; background: var(--nf-color-bg-subtle); }
      .cd { padding: 24px; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; }
      .cd__head { display: flex; align-items: center; gap: 16px; }
      .cd__back { background: transparent; border: 1px solid var(--nf-color-border); border-radius: 6px; padding: 6px 12px; font-size: 13px; color: var(--nf-color-text-secondary); cursor: pointer; }
      .cd__title-block { flex: 1; }
      .cd__breadcrumb { font-size: 11px; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
      .cd__title { margin: 4px 0 0; font-size: 22px; font-weight: 700; color: var(--nf-text-primary); }
      .cd__btn { padding: 8px 14px; border-radius: 6px; background: var(--nf-color-primary-600); color: white; border: none; font-weight: 600; font-size: 13px; cursor: pointer; }
      .cd__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px; }
      .cd__card { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 10px; padding: 16px; }
      .cd__card h3 { margin: 0 0 12px; font-size: 13px; color: var(--nf-color-text-secondary); font-weight: 600; text-transform: uppercase; }
      .cd__card dl { margin: 0; display: grid; grid-template-columns: 1fr 2fr; gap: 6px 12px; font-size: 13px; }
      .cd__card dt { font-weight: 500; color: var(--nf-color-text-secondary); }
      .cd__card dd { margin: 0; color: var(--nf-text-primary); font-weight: 500; }
      .cd__rib { font-family: ui-monospace, SF Mono, Menlo, monospace; font-size: 12px; }
      .cd__solde-block { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
      .cd__solde-label { font-size: 11px; color: var(--nf-color-text-secondary); text-transform: uppercase; }
      .cd__solde-value { font-size: 18px; font-weight: 700; color: var(--nf-text-primary); }
    `,
  ],
})
export class CompteDetailPage {
  private readonly bankApi = inject(BankReconciliationApiService);
  private readonly caisseApi = inject(CaisseApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly compteId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly compte = signal<CompteFinancier | undefined>(undefined);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    const banks = await this.bankApi.listAccounts();
    let found = banks.find((c) => c.id === this.compteId);
    if (!found) {
      found = await this.caisseApi.getCentrale(this.compteId);
      if (found) {
        const solde = await this.caisseApi.getSolde(this.compteId);
        found = { ...found, soldeActuel: solde };
      }
    }
    if (found) {
      this.compte.set(found);
    }
  }

  back(): void {
    this.router.navigate(['/finance/caisses']);
  }

  voirMouvements(): void {
    this.router.navigate(['/finance/caisses', this.compteId, 'mouvements']);
  }
}
