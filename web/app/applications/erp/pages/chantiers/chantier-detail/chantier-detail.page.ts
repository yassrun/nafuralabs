import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';

import { BadgeComponent, ButtonComponent, EmptyStateComponent } from '@lib/anatomy/components';
import { PageHeaderComponent, PageShellComponent, ToastService, ConfirmDialogService } from '@lib/anatomy';
import { AttachmentListComponent } from '@platform/features/collaboration/doc-manager/components/attachment-list.component';
import {
  DOCUMENT_ATTACHMENT_CONFIG,
  ERP_ATTACHMENT_ENTITY_TYPES,
} from '@applications/erp/shared/config/attachment-detail.config';
import { PhotoChantierGalleryComponent } from '../components/photo-chantier-gallery/photo-chantier-gallery.component';
import type { BadgeVariant } from '@lib/anatomy/types';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';

import { ChantierApiService } from '../services/chantier-api.service';
import type { ChantierSummary } from '../services/chantier.mapper';
import type { Chantier, ChantierStatus, LotChantier, PhaseChantier } from '../../../chantiers/models';
import { ChantierLotApiService } from '../services/chantier-lot-api.service';
import { ChantierPhaseApiService } from '../services/chantier-phase-api.service';
import {
  CHANTIER_STATUS_KEYS,
  CHANTIER_TYPE_KEYS,
  PHASE_STATUS_KEYS,
} from '@applications/erp/shell/i18n-labels';
import { ContratMarcheApiService } from '../../marches/contrats/services/contrat-marche-api.service';
import type { Marche } from '../../marches/models';
import {
  SituationGenerationService,
  type SituationDraftBrouillon,
} from '../../marches/services/situation-generation.service';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

type DetailTab = 'overview' | 'lots' | 'phases' | 'budget' | 'situations' | 'documents' | 'photos';

const STATUS_VARIANT: Record<ChantierStatus, BadgeVariant> = {
  PROSPECT: 'info',
  EN_COURS: 'success',
  SUSPENDU: 'warning',
  TERMINE: 'default',
  RECEPTIONNE: 'success',
  CLOTURE: 'default',
  ANNULE: 'danger',
};

const PHASE_STATUS_CSS: Record<string, string> = {
  PLANIFIE: 'badge--info',
  EN_COURS: 'badge--success',
  TERMINE: 'badge--secondary',
  EN_RETARD: 'badge--danger',
};

@Component({
  selector: 'app-chantier-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, PageShellComponent, PageHeaderComponent, BadgeComponent, ButtonComponent, EmptyStateComponent, MadCurrencyPipe, TranslateModule, AttachmentListComponent, PhotoChantierGalleryComponent],
  template: `
    <nf-page-shell [scroll]="true">
      @if (chantier(); as c) {
        <nf-page-header [config]="headerConfig()"></nf-page-header>

        <!-- Hero -->
        <section class="hero">
          <div class="hero__left">
            <p class="hero__kicker">{{ c.code }} · {{ c.ville }}</p>
            <h1 class="hero__title">{{ c.name }}</h1>
            @if (c.marcheReference) {
              <p class="hero__ref">{{ 'chantiers.chantier.detail.marcheRef' | translate:{ ref: c.marcheReference } }}</p>
            }
          </div>
          <div class="hero__right">
            <div class="kpis">
              <article class="kpi">
                <span class="kpi__label">{{ 'chantiers.chantier.detail.hero.avancement' | translate }}</span>
                <strong class="kpi__value kpi__value--lg">{{ c.avancementPercent }}%</strong>
                <div class="progress-bar"><div class="progress-fill" [style.width.%]="c.avancementPercent"></div></div>
              </article>
              <article class="kpi">
                <span class="kpi__label">{{ 'chantiers.chantier.detail.hero.budgetHt' | translate }}</span>
                <strong class="kpi__value">{{ c.budgetHt | mad }}</strong>
              </article>
              <article class="kpi">
                <span class="kpi__label">{{ 'chantiers.chantier.detail.hero.factureHt' | translate }}</span>
                <strong class="kpi__value">{{ c.facturesEmisesHt | mad }}</strong>
              </article>
              <article class="kpi">
                <span class="kpi__label">{{ 'chantiers.chantier.detail.hero.encaisseTtc' | translate }}</span>
                <strong class="kpi__value">{{ c.encaissementsTtc | mad }}</strong>
              </article>
            </div>
            <nf-badge [variant]="statusVariant(c.status)">{{ statusLabel(c.status) }}</nf-badge>
          </div>
        </section>

        <!-- Tabs -->
        <nav class="tabs">
          @for (tab of tabs(); track tab.id) {
            <nf-button type="button" class="tab" [class.tab--active]="activeTab() === tab.id" (clicked)="setTab(tab.id)" variant="ghost">
              {{ tab.label }}
            </nf-button>
          }
        </nav>

        <!-- Tab: Vue d'ensemble -->
        @if (activeTab() === 'overview') {
          <section class="tab-panel">
            <div class="info-grid">
              <article class="info-card">
                <h3>{{ 'chantiers.chantier.detail.sections.equipe' | translate }}</h3>
                <dl>
                  <dt>{{ 'chantiers.common.fields.client' | translate }}</dt><dd>{{ c.clientName ?? '—' }}</dd>
                  <dt>{{ 'chantiers.chantier.detail.labels.chefChantier' | translate }}</dt><dd>{{ c.chefChantierName ?? '—' }}</dd>
                  <dt>{{ 'chantiers.chantier.detail.labels.conducteurTravaux' | translate }}</dt><dd>{{ c.conducteurTravauxName ?? '—' }}</dd>
                  @if (c.ingenieurName) {
                    <dt>{{ 'chantiers.chantier.detail.labels.ingenieur' | translate }}</dt><dd>{{ c.ingenieurName }}</dd>
                  }
                </dl>
              </article>
              <article class="info-card">
                <h3>{{ 'chantiers.chantier.detail.sections.calendrier' | translate }}</h3>
                <dl>
                  <dt>{{ 'chantiers.chantier.detail.labels.ordreService' | translate }}</dt><dd>{{ (c.dateOrdreService ?? c.dateDebut) | date:'dd/MM/yyyy' }}</dd>
                  <dt>{{ 'chantiers.chantier.detail.labels.debut' | translate }}</dt><dd>{{ c.dateDebut | date:'dd/MM/yyyy' }}</dd>
                  <dt>{{ 'chantiers.chantier.detail.labels.finPrevue' | translate }}</dt><dd>{{ c.dateFinPrevue | date:'dd/MM/yyyy' }}</dd>
                  @if (c.dateFinReelle) {
                    <dt>{{ 'chantiers.chantier.detail.labels.finReelle' | translate }}</dt><dd>{{ c.dateFinReelle | date:'dd/MM/yyyy' }}</dd>
                  }
                </dl>
              </article>
              <article class="info-card">
                <h3>{{ 'chantiers.chantier.detail.sections.finances' | translate }}</h3>
                <dl>
                  <dt>{{ 'chantiers.chantier.detail.labels.budgetHt' | translate }}</dt><dd>{{ c.budgetHt | mad }}</dd>
                  <dt>{{ 'chantiers.chantier.detail.labels.tva' | translate }}</dt><dd>{{ c.tvaTaux }}%</dd>
                  <dt>{{ 'chantiers.chantier.detail.labels.cautionGarantie' | translate }}</dt><dd>{{ c.cautionGarantie ?? 7 }}%</dd>
                  @if (c.delaiPaiementJours) {
                    <dt>{{ 'chantiers.chantier.detail.labels.delaiPaiement' | translate }}</dt>
                    <dd>{{ 'chantiers.chantier.detail.labels.delaiPaiementJours' | translate:{ count: c.delaiPaiementJours } }}</dd>
                  }
                </dl>
              </article>
              @if (c.description) {
                <article class="info-card info-card--full">
                  <h3>{{ 'chantiers.chantier.detail.sections.description' | translate }}</h3>
                  <p>{{ c.description }}</p>
                </article>
              }
            </div>
          </section>
        }

        <!-- Tab: Lots -->
        @if (activeTab() === 'lots') {
          <section class="tab-panel">
            @if (lots().length) {
              <div class="tab-panel__toolbar">
                <nf-button variant="primary" icon="plus" iconLibrary="lucide" (clicked)="addLot()">
                  {{ 'chantiers.chantier.detail.lots.addCta' | translate }}
                </nf-button>
              </div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>{{ 'chantiers.chantier.detail.columns.code' | translate }}</th>
                    <th>{{ 'chantiers.chantier.detail.columns.designation' | translate }}</th>
                    <th class="num">{{ 'chantiers.chantier.detail.columns.quantite' | translate }}</th>
                    <th>{{ 'chantiers.chantier.detail.columns.unite' | translate }}</th>
                    <th class="num">{{ 'chantiers.chantier.detail.columns.prixUnitaireHt' | translate }}</th>
                    <th class="num">{{ 'chantiers.chantier.detail.columns.montantHt' | translate }}</th>
                    <th class="center">{{ 'chantiers.chantier.detail.columns.avancement' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (lot of lots(); track lot.id) {
                    <tr>
                      <td><strong>{{ lot.code }}</strong></td>
                      <td>{{ lot.designation }}</td>
                      <td class="num">{{ lot.quantite ?? '—' }}</td>
                      <td>{{ lot.unite ?? '—' }}</td>
                      <td class="num">{{ lot.prixUnitaireHt != null ? (lot.prixUnitaireHt | mad) : '—' }}</td>
                      <td class="num">{{ lot.montantHt != null ? (lot.montantHt | mad) : '—' }}</td>
                      <td class="center">
                        <div class="progress-wrap">
                          <div class="progress-bar sm"><div class="progress-fill" [style.width.%]="lot.avancementPercent"></div></div>
                          <span>{{ lot.avancementPercent }}%</span>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <nf-empty-state
                icon="layers"
                [title]="'chantiers.chantier.detail.empty.lotsTitle' | translate"
                [message]="'chantiers.chantier.detail.empty.lotsMessage' | translate"
                [actionLabel]="'chantiers.chantier.detail.lots.addCta' | translate"
                (action)="addLot()"></nf-empty-state>
            }
          </section>
        }

        <!-- Tab: Phases -->
        @if (activeTab() === 'phases') {
          <section class="tab-panel">
            <div class="tab-toolbar">
              <nf-button variant="primary" (clicked)="addPhase()">
                {{ 'chantiers.chantier.detail.phases.addAction' | translate }}
              </nf-button>
            </div>
            @if (phases().length) {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>{{ 'chantiers.chantier.detail.columns.code' | translate }}</th>
                    <th>{{ 'chantiers.chantier.detail.columns.designation' | translate }}</th>
                    <th>{{ 'chantiers.chantier.detail.columns.responsable' | translate }}</th>
                    <th>{{ 'chantiers.chantier.detail.columns.debut' | translate }}</th>
                    <th>{{ 'chantiers.chantier.detail.columns.fin' | translate }}</th>
                    <th class="center">{{ 'chantiers.chantier.detail.columns.avancement' | translate }}</th>
                    <th>{{ 'chantiers.chantier.detail.columns.status' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (phase of phases(); track phase.id) {
                    <tr>
                      <td><strong>{{ phase.code }}</strong></td>
                      <td>{{ phase.designation }}</td>
                      <td>{{ phase.responsableName ?? '—' }}</td>
                      <td class="date">{{ phase.dateDebut | date:'dd/MM/yy' }}</td>
                      <td class="date">{{ phase.dateFin | date:'dd/MM/yy' }}</td>
                      <td class="center">
                        <div class="progress-wrap">
                          <div class="progress-bar sm"><div class="progress-fill" [style.width.%]="phase.avancementPercent" [class.progress-fill--done]="phase.avancementPercent >= 100" [class.progress-fill--warn]="phase.status === 'EN_RETARD'"></div></div>
                          <span>{{ phase.avancementPercent }}%</span>
                        </div>
                      </td>
                      <td><span class="badge {{ phaseStatusCss(phase.status) }}">{{ phaseStatusLabel(phase.status) }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <nf-empty-state
                icon="timeline"
                [title]="'chantiers.chantier.detail.empty.phasesTitle' | translate"
                [message]="'chantiers.chantier.detail.empty.phasesMessage' | translate"></nf-empty-state>
            }
          </section>
        }

        <!-- Tab: Budget -->
        @if (activeTab() === 'budget') {
          <section class="tab-panel">
            <div class="info-grid">
              <article class="info-card">
                <h3>{{ 'chantiers.chantier.detail.sections.syntheseBudget' | translate }}</h3>
                <dl>
                  <dt>{{ 'chantiers.chantier.detail.labels.budgetHt' | translate }}</dt><dd>{{ c.budgetHt | mad }}</dd>
                  <dt>{{ 'chantiers.chantier.detail.labels.budgetTtc' | translate }}</dt><dd>{{ (c.budgetHt * (1 + c.tvaTaux / 100)) | mad }}</dd>
                  <dt>{{ 'chantiers.chantier.detail.labels.situationsCumulHt' | translate }}</dt><dd>{{ c.cumulSituationsHt | mad }}</dd>
                  <dt>{{ 'chantiers.chantier.detail.labels.factureHt' | translate }}</dt><dd>{{ c.facturesEmisesHt | mad }}</dd>
                  <dt>{{ 'chantiers.chantier.detail.labels.encaisseTtc' | translate }}</dt><dd>{{ c.encaissementsTtc | mad }}</dd>
                </dl>
              </article>
            </div>
            <a class="btn-link" [routerLink]="['/chantiers/budget', c.id]">{{ 'chantiers.chantier.detail.budget.viewFullCta' | translate }}</a>
          </section>
        }

        <!-- Tab: Situations -->
        @if (activeTab() === 'situations') {
          <section class="tab-panel">
            @if (marchePourChantier(); as mar) {
              <div class="sit-gen">
                <p class="tab-hint">
                  {{ 'chantiers.chantier.detail.situations.hint' | translate }}
                </p>
                <nf-button variant="primary" icon="file-plus" iconLibrary="lucide" (clicked)="genererSituationN()">
                  {{ 'chantiers.chantier.detail.situations.generateCta' | translate }}
                </nf-button>
              </div>
              @if (situationDraft(); as d) {
                <article class="draft-card">
                  <h3>{{ 'chantiers.chantier.detail.sections.brouillonCalcule' | translate }}</h3>
                  <dl>
                    <dt>{{ 'chantiers.chantier.detail.labels.marche' | translate }}</dt><dd>{{ d.marcheNumero }}</dd>
                    <dt>{{ 'chantiers.chantier.detail.labels.travauxPeriodeHt' | translate }}</dt><dd>{{ d.travauxPeriodeHt | mad }}</dd>
                    <dt>{{ 'chantiers.chantier.detail.labels.revisionK' | translate }}</dt><dd>{{ d.revisionKHt | mad }}</dd>
                    <dt>{{ 'chantiers.chantier.detail.labels.penalites' | translate }}</dt><dd>{{ d.penalitesHt | mad }}</dd>
                    <dt>{{ 'chantiers.chantier.detail.labels.rgPercent' | translate:{ percent: d.retenueGarantiePercent } }}</dt>
                    <dd>{{ d.retenueGarantieMontantHt | mad }}</dd>
                    <dt>{{ 'chantiers.chantier.detail.labels.netHt' | translate }}</dt><dd>{{ d.netHt | mad }}</dd>
                    <dt>{{ 'chantiers.chantier.detail.labels.tvaMontant' | translate:{ percent: d.tvaTaux } }}</dt><dd>{{ d.tvaMontantHt | mad }}</dd>
                    <dt>{{ 'chantiers.chantier.detail.labels.netTtc' | translate }}</dt><dd>{{ d.netTtc | mad }}</dd>
                  </dl>
                  @if (d.lignesLots.length) {
                    <h4>{{ 'chantiers.chantier.detail.sections.parLot' | translate }}</h4>
                    <table class="mini-table">
                      <thead><tr>
                        <th>{{ 'chantiers.chantier.detail.columns.lot' | translate }}</th>
                        <th class="num">{{ 'chantiers.chantier.detail.labels.montantHtPeriode' | translate }}</th>
                      </tr></thead>
                      <tbody>
                        @for (l of d.lignesLots; track l.lotCode) {
                          <tr><td>{{ l.lotCode }}</td><td class="num">{{ l.montantHtPeriode | mad }}</td></tr>
                        }
                      </tbody>
                    </table>
                  }
                </article>
              }
            } @else {
              <p class="tab-hint">{{ 'chantiers.chantier.detail.situations.noMarche' | translate }}</p>
              <nf-button variant="primary" icon="file-plus" iconLibrary="lucide" (clicked)="creerMarche()">
                {{ 'chantiers.chantier.detail.marche.createAction' | translate }}
              </nf-button>
            }
            <p class="tab-hint tab-hint--sep">
              <a [routerLink]="['/chantiers/situations']" [queryParams]="{ chantierId: c.id }">
                {{ 'chantiers.chantier.detail.situations.linkAll' | translate }}
              </a>
            </p>
          </section>
        }

        <!-- Tab: Documents -->
        @if (activeTab() === 'documents') {
          <section class="tab-panel">
            <nf-attachment-list
              [entityType]="attachmentEntityType"
              [entityId]="c.id"
              [attachmentConfig]="attachmentConfig" />
            <p class="tab-hint tab-hint--sep">
              <a [routerLink]="['/chantiers/documents']" [queryParams]="{ chantierId: c.id }">
                {{ 'chantiers.chantier.detail.documents.linkAll' | translate }}
              </a>
            </p>
          </section>
        }

        @if (activeTab() === 'photos') {
          <section class="tab-panel">
            <app-photo-chantier-gallery [chantierId]="c.id" />
          </section>
        }

        <div class="actions">
          <nf-button variant="secondary" icon="arrow-left" iconLibrary="lucide" (clicked)="goBack()">{{ 'chantiers.common.actions.backToList' | translate }}</nf-button>
          <nf-button variant="secondary" icon="pencil" iconLibrary="lucide" (clicked)="editChantier()">{{ 'chantiers.chantier.detail.actions.edit' | translate }}</nf-button>
          <nf-button variant="danger" icon="trash-2" iconLibrary="lucide" (clicked)="deleteChantier()">{{ 'chantiers.common.actions.delete' | translate }}</nf-button>
        </div>

      } @else {
        <nf-empty-state
          icon="search_off"
          [title]="'chantiers.chantier.detail.empty.notFoundTitle' | translate"
          [message]="'chantiers.chantier.detail.empty.notFoundMessage' | translate:{ ref: paramId() || '—' }"
          [actionLabel]="'chantiers.common.actions.backToList' | translate"
          (action)="goBack()">
        </nf-empty-state>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: start;
      gap: 1.25rem 1.5rem;
      padding: 1.25rem 1.5rem; border-radius: 1rem; margin-bottom: 1rem;
      background: linear-gradient(135deg, color-mix(in srgb, var(--nf-color-primary-500) 8%, transparent), color-mix(in srgb, var(--nf-color-surface) 97%, transparent));
      border: 1px solid color-mix(in srgb, var(--nf-color-primary-500) 12%, transparent);
    }
    .hero__left { min-width: 0; }
    .hero__kicker { margin: 0 0 0.25rem; font-size: 0.82rem; color: var(--nf-color-text-secondary); }
    .hero__title { margin: 0 0 0.3rem; font-size: 1.4rem; font-weight: 700; color: var(--nf-text-primary, var(--nf-color-text-primary)); }
    .hero__ref { margin: 0; font-size: 0.8rem; color: var(--nf-color-text-secondary); }
    .hero__right {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem 1.25rem;
    }

    .kpis { display: flex; gap: 1rem 1.25rem; flex-wrap: wrap; justify-content: flex-end; }
    .kpi { text-align: right; }
    .kpi__label { display: block; font-size: 0.72rem; color: var(--nf-color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.15rem; }
    .kpi__value { font-size: 0.95rem; font-weight: 700; color: var(--nf-text-primary, var(--nf-color-text-primary)); }
    .kpi__value--lg { font-size: 1.5rem; }

    .tabs { display: flex; gap: 0; border-bottom: 2px solid var(--nf-color-border); margin-bottom: 1.25rem; overflow-x: auto; }
    .tab { padding: 0.65rem 1.1rem; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; font-size: 0.88rem; font-weight: 500; color: var(--nf-color-text-secondary); cursor: pointer; white-space: nowrap; transition: color 120ms, border-color 120ms; }
    .tab:hover { color: var(--nf-text-primary, var(--nf-color-text-primary)); }
    .tab--active { color: var(--nf-color-primary-700); border-bottom-color: var(--nf-color-primary-700); font-weight: 600; }

    .tab-panel { padding-bottom: 1.5rem; }
    .tab-panel__toolbar { display: flex; justify-content: flex-end; margin-bottom: 0.75rem; }
    .tab-hint { font-size: 0.9rem; }
    .tab-hint a { color: var(--nf-color-primary-700); text-decoration: none; font-weight: 500; }
    .tab-hint a:hover { text-decoration: underline; }
    .tab-hint--sep { margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--nf-color-bg-muted); }
    .sit-gen { display: flex; flex-direction: column; align-items: flex-start; gap: 0.75rem; margin-bottom: 1rem; }
    .draft-card {
      margin-top: 0.5rem;
      padding: 1rem 1.25rem;
      border-radius: 0.75rem;
      background: var(--nf-color-bg-subtle);
      border: 1px solid var(--nf-color-border);
      max-width: 520px;
    }
    .draft-card h3 { margin: 0 0 0.75rem; font-size: 0.85rem; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
    .draft-card h4 { margin: 1rem 0 0.5rem; font-size: 0.8rem; color: var(--nf-color-text-secondary); }
    .mini-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    .mini-table th, .mini-table td { padding: 0.35rem 0.5rem; border-bottom: 1px solid var(--nf-color-border); text-align: left; }
    .mini-table th.num, .mini-table td.num { text-align: right; }

    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
    .info-card { padding: 1rem 1.25rem; border-radius: 0.75rem; background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); }
    .info-card--full { grid-column: 1 / -1; }
    .info-card h3 { margin: 0 0 0.75rem; font-size: 0.82rem; font-weight: 700; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }
    .info-card p { margin: 0; font-size: 0.9rem; color: var(--nf-color-text-secondary); line-height: 1.6; }
    dl { display: grid; grid-template-columns: auto 1fr; column-gap: 0.75rem; row-gap: 0.3rem; margin: 0; }
    dt { font-size: 0.8rem; color: var(--nf-color-text-muted); align-self: center; white-space: nowrap; }
    dd { margin: 0; font-size: 0.9rem; font-weight: 500; color: var(--nf-text-primary, var(--nf-color-text-primary)); }

    .data-table { width: 100%; border-collapse: collapse; font-size: 0.87rem; background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; overflow: hidden; }
    .data-table th { padding: 0.7rem 1rem; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-border); white-space: nowrap; }
    .data-table th.num { text-align: right; }
    .data-table th.center { text-align: center; }
    .data-table td { padding: 0.65rem 1rem; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }
    .data-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .data-table td.center { text-align: center; }
    .data-table td.date { white-space: nowrap; color: var(--nf-color-text-secondary); font-size: 0.8rem; }
    .data-table tbody tr:last-child td { border-bottom: none; }

    .progress-bar { height: 6px; background: var(--nf-color-border); border-radius: 3px; overflow: hidden; flex-shrink: 0; }
    .progress-bar.sm { width: 60px; }
    .progress-fill { height: 100%; background: var(--nf-color-primary-500); border-radius: 3px; transition: width 0.3s; }
    .progress-fill--warn { background: var(--nf-color-warning-500); }
    .progress-fill--done { background: var(--nf-color-success-600); }
    .progress-wrap { display: flex; align-items: center; gap: 6px; justify-content: center; font-size: 0.8rem; color: var(--nf-color-text-secondary); }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 600; white-space: nowrap; }
    .badge--info { background: var(--nf-color-primary-100); color: var(--nf-color-primary-700); }
    .badge--success { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .badge--warning { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .badge--danger { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .badge--secondary { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }

    .btn-link { display: inline-block; margin-top: 1rem; color: var(--nf-color-primary-700); font-size: 0.9rem; font-weight: 500; text-decoration: none; }
    .btn-link:hover { text-decoration: underline; }

    .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: flex-start; padding-top: 1rem; border-top: 1px solid var(--nf-color-bg-muted); margin-top: 0.5rem; }
    .tab-toolbar { display: flex; gap: 0.5rem; justify-content: flex-end; margin-bottom: 0.75rem; }
  `],
})
export class ChantierDetailPage {
  readonly attachmentEntityType = ERP_ATTACHMENT_ENTITY_TYPES.CHANTIER;
  readonly attachmentConfig = DOCUMENT_ATTACHMENT_CONFIG;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly lotApi = inject(ChantierLotApiService);
  private readonly phaseApi = inject(ChantierPhaseApiService);
  private readonly contratApi = inject(ContratMarcheApiService);
  private readonly situationGen = inject(SituationGenerationService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);
  private readonly audit = inject(ErpAuditService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly marchesCache = signal<Marche[]>([]);

  readonly situationDraft = signal<SituationDraftBrouillon | null>(null);
  readonly chantier = signal<Chantier | undefined>(undefined);
  readonly summary = signal<ChantierSummary | undefined>(undefined);
  readonly lots = signal<LotChantier[]>([]);
  readonly phases = signal<PhaseChantier[]>([]);

  readonly paramId = toSignal(
    this.route.paramMap.pipe(map((pm) => pm.get('id')?.trim() ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id')?.trim() ?? '' },
  );

  readonly tabs = computed(() => ([
    { id: 'overview' as DetailTab, label: this.translate.instant('chantiers.chantier.detail.tabs.overview') },
    { id: 'lots' as DetailTab, label: this.translate.instant('chantiers.chantier.detail.tabs.lots') },
    { id: 'phases' as DetailTab, label: this.translate.instant('chantiers.chantier.detail.tabs.phases') },
    { id: 'budget' as DetailTab, label: this.translate.instant('chantiers.chantier.detail.tabs.budget') },
    { id: 'situations' as DetailTab, label: this.translate.instant('chantiers.chantier.detail.tabs.situations') },
    { id: 'documents' as DetailTab, label: this.translate.instant('chantiers.chantier.detail.tabs.documents') },
    { id: 'photos' as DetailTab, label: this.translate.instant('chantiers.chantier.detail.tabs.photos') },
  ]));

  constructor() {
    void this.contratApi
      .getAll()
      .then(({ items }) => this.marchesCache.set(items))
      .catch(() => this.marchesCache.set([]));

    effect(() => {
      const id = this.paramId();
      if (!id) {
        this.chantier.set(undefined);
        this.summary.set(undefined);
        return;
      }
      void this.chantierApi
        .getSummary(id)
        .then((s) => {
          this.summary.set(s);
          this.chantier.set({
            ...s.chantier,
            avancementPercent: s.avancementPercent,
            budgetHt: s.budget.reviseHt > 0 ? s.budget.reviseHt : s.chantier.budgetHt,
          });
        })
        .catch(() => {
          this.summary.set(undefined);
          void this.chantierApi
            .getById(id)
            .then((c) => this.chantier.set(c))
            .catch(() => this.chantier.set(undefined));
        });
    });

    effect(() => {
      const c = this.chantier();
      if (!c?.id) {
        this.lots.set([]);
        return;
      }
      void this.lotApi
        .listByChantier(c.id)
        .then((rows) => this.lots.set(rows))
        .catch(() => this.lots.set([]));
    });

    effect(() => {
      const c = this.chantier();
      if (!c?.id) {
        this.phases.set([]);
        return;
      }
      void this.phaseApi
        .listByChantier(c.id)
        .then((rows) => this.phases.set(rows))
        .catch(() => this.phases.set([]));
    });
  }

  readonly activeTab = signal<DetailTab>(
    (this.route.snapshot.queryParamMap.get('tab') as DetailTab | null) ?? 'overview',
  );

  readonly marchePourChantier = computed(() => {
    const c = this.chantier();
    if (!c) return undefined;
    return this.marchesCache().find((m) => m.chantierId === c.id);
  });

  readonly headerConfig = computed(() => ({
    title: this.chantier()?.code ?? this.translate.instant('chantiers.chantier.detail.fallbackTitle'),
    subtitle: this.chantier()?.name,
    icon: 'construction',
    breadcrumbs: [
      { label: this.translate.instant('chantiers.routes.chantiersCrumb'), route: '/chantiers' },
      { label: this.chantier()?.code ?? this.translate.instant('chantiers.routes.chantierDetailCrumb') },
    ],
  }));

  setTab(tab: DetailTab): void {
    this.activeTab.set(tab);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab === 'overview' ? null : tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  statusLabel(s: ChantierStatus): string {
    const key = CHANTIER_STATUS_KEYS[s];
    if (!key) return s;
    const resolved = this.translate.instant(key);
    return resolved === key ? s : resolved;
  }
  statusVariant(s: ChantierStatus): BadgeVariant { return STATUS_VARIANT[s] ?? 'default'; }
  typeLabel(t: string): string {
    const key = CHANTIER_TYPE_KEYS[t as keyof typeof CHANTIER_TYPE_KEYS];
    if (!key) return t;
    const resolved = this.translate.instant(key);
    return resolved === key ? t : resolved;
  }
  phaseStatusLabel(s: string): string {
    const key = (PHASE_STATUS_KEYS as Record<string, string>)[s];
    if (!key) return s;
    const resolved = this.translate.instant(key);
    return resolved === key ? s : resolved;
  }
  phaseStatusCss(s: string): string { return PHASE_STATUS_CSS[s] ?? 'badge--secondary'; }

  goBack(): void {
    void this.router.navigate(['/chantiers']);
  }

  editChantier(): void {
    const c = this.chantier();
    if (!c?.id) return;
    void this.router.navigate(['/chantiers', c.id, 'edit']);
  }

  async deleteChantier(): Promise<void> {
    const c = this.chantier();
    if (!c?.id) return;
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('chantiers.chantier.detail.deleteTitle'),
      message: this.translate.instant('chantiers.chantier.detail.deleteConfirm', { code: c.code, name: c.name }),
      confirmLabel: this.translate.instant('chantiers.chantier.detail.deleteAction'),
      cancelLabel: this.translate.instant('chantiers.chantier.detail.cancel'),
      variant: 'danger',
      icon: 'delete',
    });
    if (!confirmed) return;
    try {
      await this.chantierApi.delete(c.id);
      this.audit.log('DELETE', 'chantier', c.id, c.code, c.name);
      this.toast.success(this.translate.instant('chantiers.chantier.detail.deleteSuccess'));
      void this.router.navigate(['/chantiers']);
    } catch {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.deleteFailed'));
    }
  }

  async addLot(): Promise<void> {
    const c = this.chantier();
    if (!c?.id) return;
    const result = await this.confirmDialog.prompt({
      title: this.translate.instant('chantiers.chantier.detail.lots.addTitle'),
      fields: [
        { key: 'code', label: 'chantiers.chantier.detail.lots.promptCode', required: true },
        { key: 'designation', label: 'chantiers.chantier.detail.lots.promptDesignation', required: true },
        { key: 'quantite', label: 'chantiers.chantier.detail.lots.promptQuantite', required: true },
        { key: 'unite', label: 'chantiers.chantier.detail.lots.promptUnite', required: true, initial: 'U' },
        { key: 'prixUnitaireHt', label: 'chantiers.chantier.detail.lots.promptPrixUnitaireHt', required: true },
      ],
      confirmLabel: this.translate.instant('chantiers.chantier.detail.lots.addAction'),
      cancelLabel: this.translate.instant('chantiers.chantier.detail.cancel'),
      icon: 'add',
    });
    if (!result) return;
    const code = result['code'];
    const designation = result['designation'];
    const quantite = parseFloat(result['quantite']?.replace(',', '.') ?? '');
    const unite = result['unite']?.trim();
    const prixUnitaireHt = parseFloat(result['prixUnitaireHt']?.replace(',', '.') ?? '');
    if (!code?.trim() || !designation?.trim() || !unite || Number.isNaN(quantite) || Number.isNaN(prixUnitaireHt)) {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.lots.invalidBpu'));
      return;
    }
    try {
      const lot = await this.lotApi.createForChantier(c.id, {
        code: code.trim(),
        designation: designation.trim(),
        quantite,
        unite,
        prixUnitaireHt,
        ordre: this.lots().length + 1,
      });
      this.lots.update((rows) => [...rows, lot]);
      this.toast.success(this.translate.instant('chantiers.chantier.detail.lots.createSuccess'));
    } catch {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.lots.createFailed'));
    }
  }

  async addPhase(): Promise<void> {
    const c = this.chantier();
    if (!c?.id) return;
    const today = new Date().toISOString().slice(0, 10);
    const in3m = new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().slice(0, 10);
    const result = await this.confirmDialog.prompt({
      title: this.translate.instant('chantiers.chantier.detail.phases.addTitle'),
      fields: [
        { key: 'code', label: 'chantiers.chantier.detail.phases.promptCode', required: true },
        { key: 'designation', label: 'chantiers.chantier.detail.phases.promptDesignation', required: true },
        { key: 'dateDebut', label: 'chantiers.chantier.detail.phases.promptDateDebut', required: true, initial: today },
        { key: 'dateFin', label: 'chantiers.chantier.detail.phases.promptDateFin', required: true, initial: in3m },
        { key: 'responsableName', label: 'chantiers.chantier.detail.phases.promptResponsable', required: false },
      ],
      confirmLabel: this.translate.instant('chantiers.chantier.detail.phases.addAction'),
      cancelLabel: this.translate.instant('chantiers.chantier.detail.cancel'),
      icon: 'timeline',
    });
    if (!result) return;
    try {
      const phase = await this.phaseApi.createForChantier(c.id, {
        code: result['code']?.trim(),
        designation: result['designation']?.trim(),
        dateDebut: result['dateDebut'],
        dateFin: result['dateFin'],
        responsableName: result['responsableName']?.trim() || undefined,
        avancementPercent: 0,
        status: 'PLANIFIE',
      });
      this.phases.update((rows) => [...rows, phase]);
      this.toast.success(this.translate.instant('chantiers.chantier.detail.phases.createSuccess'));
    } catch {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.phases.createFailed'));
    }
  }

  async creerMarche(): Promise<void> {
    const c = this.chantier();
    if (!c?.id) return;
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('chantiers.chantier.detail.marche.createTitle'),
      message: this.translate.instant('chantiers.chantier.detail.marche.createConfirm', { code: c.code }),
      confirmLabel: this.translate.instant('chantiers.chantier.detail.marche.createAction'),
      cancelLabel: this.translate.instant('chantiers.chantier.detail.cancel'),
      icon: 'description',
    });
    if (!confirmed) return;
    try {
      await this.contratApi.create({
        numero: c.marcheReference?.trim() || `MAR-${c.code}`,
        intitule: c.name,
        chantierId: c.id,
        chantierCode: c.code,
        chantierNom: c.name,
        clientId: c.clientId,
        clientNom: c.clientName ?? '',
        type: 'FORFAIT',
        nature: 'PRIVE_PME',
        montantInitialHt: c.budgetHt,
        tvaTaux: c.tvaTaux,
        retenueGarantieTaux: 7,
        retenueSourceTaux: 0,
        dateOrdreService: c.dateOrdreService ?? c.dateDebut,
        status: 'EN_EXECUTION',
      } as Partial<Marche>);
      const { items } = await this.contratApi.getAll();
      this.marchesCache.set(items);
      this.toast.success(this.translate.instant('chantiers.chantier.detail.marche.createSuccess'));
    } catch {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.marche.createFailed'));
    }
  }

  genererSituationN(): void {
    const c = this.chantier();
    const m = this.marchePourChantier();
    if (!c || !m) {
      this.situationDraft.set(null);
      return;
    }
    const lots = this.lots().map((l) => ({
      code: l.code,
      designation: l.designation,
      avancementPercent: l.avancementPercent ?? 0,
    }));
    const draft = this.situationGen.buildDraft({
      marcheId: m.id,
      marcheNumero: m.numero,
      chantierId: c.id,
      chantierCode: c.code,
      montantMarcheHt: m.montantTotalHt,
      avancementPercent: c.avancementPercent,
      cumulSituationsFactureHt: c.cumulSituationsHt ?? 0,
      revisionKHt: 0,
      penalitesHt: 0,
      retenueGarantiePercent: c.cautionGarantie ?? m.retenueGarantieTaux,
      tvaTaux: c.tvaTaux,
      lots,
    });
    this.situationDraft.set(draft);
  }
}
