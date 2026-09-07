import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';

import { BadgeComponent, ButtonComponent, EmptyStateComponent } from '@platform/lib/anatomy/components';
import { ScreenComponent, ToastService, ConfirmDialogService } from '@platform/lib/anatomy';
import { AttachmentListComponent } from '@platform/features/collaboration/doc-manager/components/attachment-list.component';
import {
  DOCUMENT_ATTACHMENT_CONFIG,
  ERP_ATTACHMENT_ENTITY_TYPES,
} from '@app/socle/shared/config/attachment-detail.config';
import { PhotoChantierGalleryComponent } from '../components/photo-chantier-gallery/photo-chantier-gallery.component';
import { ChantierLotsTabComponent } from '../components/chantier-lots-tab/chantier-lots-tab.component';
import { ChantierEquipeTabComponent } from '../components/chantier-equipe-tab/chantier-equipe-tab.component';
import { PilotageTabComponent } from '../components/pilotage-tab/pilotage-tab.component';
import { safePortefeuilleReturnUrl } from '../chantiers-listing/portefeuille-state';
import type { BadgeVariant } from '@platform/lib/anatomy/types';
import { MadCurrencyPipe } from '@platform/lib/anatomy/pipes/mad-currency.pipe';

import { ChantierApiService } from '../services/chantier-api.service';
import type { ChantierSummary } from '../services/chantier.mapper';
import type { Chantier, ChantierStatus } from '../models';
import { ChantierLotApiService } from '../services/chantier-lot-api.service';
import {
  CHANTIER_STATUS_KEYS,
  CHANTIER_TYPE_KEYS,
} from '@app/socle/shell/i18n-labels';
import { ContratMarcheApiService } from '../../marches/contrats/services/contrat-marche-api.service';
import type { Marche } from '../../marches/models';
import {
  SituationGenerationService,
  type SituationDraftBrouillon,
} from '../../marches/services/situation-generation.service';
import { ErpAuditService } from '@app/socle/shell/erp-audit.service';
import { AuthFacade } from '@platform/core/security/services/auth.facade';
import type { RecordAttachmentDto } from '@platform/features/collaboration/doc-manager/services/attachment-api.service';
import { DocumentsApiService } from '../documents/services/documents-api.service';
import { DossierEtudeApiService } from '@app/etudes/dossiers/services/dossier-etude-api.service';
import { chantierToMarcheDraft } from './chantier-marche-draft';
import {
  resolveActiveSituationReference,
  resolveRetenueGarantiePercent,
} from './situation-draft-policy';

type DetailTab = 'overview' | 'lots' | 'budget' | 'situations' | 'documents' | 'photos' | 'equipe';

const DETAIL_TABS: readonly DetailTab[] = [
  'overview',
  'equipe',
  'lots',
  'budget',
  'situations',
  'documents',
  'photos',
];

function normalizeDetailTab(tab: string | null): DetailTab {
  return DETAIL_TABS.includes(tab as DetailTab) ? (tab as DetailTab) : 'overview';
}

const STATUS_VARIANT: Record<ChantierStatus, BadgeVariant> = {
  PROSPECT: 'info',
  EN_PREPARATION: 'warning',
  EN_COURS: 'success',
  SUSPENDU: 'warning',
  TERMINE: 'default',
  RECEPTIONNE: 'success',
  CLOTURE: 'default',
  ANNULE: 'danger',
};

@Component({
  selector: 'app-chantier-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ScreenComponent, BadgeComponent, ButtonComponent, EmptyStateComponent, MadCurrencyPipe, TranslateModule, AttachmentListComponent, PhotoChantierGalleryComponent, ChantierLotsTabComponent, ChantierEquipeTabComponent, PilotageTabComponent],
  template: `
    <nf-screen [header]="headerConfig()" [scroll]="true">
      @if (chantier(); as c) {

        <!-- AC-1 — une seule identité de page : le header porte code + nom. Ici seulement
             le statut, le client et la source, sans second H1 ni code dupliqué. -->
        <div class="chantier-meta">
          <nf-badge [variant]="statusVariant(c.status)">{{ statusLabel(c.status) }}</nf-badge>
          <span class="chantier-meta__client">{{ c.clientName ?? '—' }}</span>
          @if (provenance(); as p) {
            @if (p.dossierEtudeId && etudeNumero()) {
              <span class="chantier-meta__sep" aria-hidden="true">·</span>
              <button type="button" class="chantier-meta__link" (click)="openEtude()">
                {{ etudeNumero() }}
              </button>
            }
            @if (p.devisId && p.devisNumero) {
              <span class="chantier-meta__sep" aria-hidden="true">·</span>
              <button type="button" class="chantier-meta__link" (click)="openDevis()">
                {{ p.devisNumero }}
              </button>
            }
            @if (p.sourceVente === 'MARCHE') {
              <span class="chantier-meta__src">· Marché</span>
            }
          }
        </div>

        <!-- Tabs -->
        <nav class="tabs" role="tablist">
          @for (tab of tabs(); track tab.id) {
            <button
              type="button"
              class="tab"
              role="tab"
              [class.tab--active]="activeTab() === tab.id"
              [attr.aria-selected]="activeTab() === tab.id"
              (click)="setTab(tab.id)">
              {{ tab.labelKey | translate }}
            </button>
          }
        </nav>

        <!-- Tab: Pilotage (défaut — AC-16) — consomme strictement le read model cockpit -->
        @if (activeTab() === 'overview') {
          <section class="tab-panel">
            <app-pilotage-tab [chantierId]="c.id" />
            <dl class="contract-dates contract-dates--inline">
              <dt>{{ 'chantiers.chantier.detail.labels.ordreService' | translate }}</dt>
              <dd>{{ contractDateLabel(c.dateOrdreService) }}</dd>
              <dt>{{ 'chantiers.chantier.detail.labels.debut' | translate }}</dt>
              <dd>{{ contractDateLabel(c.dateDebut) }}</dd>
              <dt>{{ 'chantiers.chantier.detail.labels.finPrevue' | translate }}</dt>
              <dd>{{ contractDateLabel(c.dateFinPrevue) }}</dd>
            </dl>
          </section>
        }

        <!-- Tab: Lots -->
        @if (activeTab() === 'lots') {
          <app-chantier-lots-tab [chantierId]="c.id" />
        }

        <!-- Tab: Budget -->
        @if (activeTab() === 'budget') {
          <section class="tab-panel">
            <div class="info-grid">
              <article class="info-card">
                <!-- AC-3/AC-12 — vente active et budget révisé nommés distinctement ; aucune absence en zéro. -->
                <h3>{{ 'chantiers.chantier.detail.sections.syntheseBudget' | translate }}</h3>
                <dl>
                  <dt>{{ 'chantiers.chantier.detail.labels.venteActiveHt' | translate }}</dt>
                  <dd>{{ venteActiveHt() != null ? (venteActiveHt()! | mad) : ('chantiers.common.values.notAvailable' | translate) }}</dd>
                  <dt>{{ 'chantiers.chantier.detail.labels.budgetReviseHt' | translate }}</dt>
                  <dd>{{ budgetReviseHt() != null ? (budgetReviseHt()! | mad) : ('chantiers.common.values.notAvailable' | translate) }}</dd>
                  <dt>{{ 'chantiers.chantier.detail.labels.debourseInitialHt' | translate }}</dt>
                  <dd>{{ debourseInitialHt() != null ? (debourseInitialHt()! | mad) : ('chantiers.common.values.notAvailable' | translate) }}</dd>
                  @if (margeProjetee(); as m) {
                    <dt>{{ 'chantiers.chantier.detail.labels.margeProjetee' | translate }}</dt>
                    <dd>{{ m.valeur | mad }}<span class="pct-inline"> · {{ m.pct != null ? (m.pct | number:'1.0-2') + ' %' : '—' }}</span></dd>
                  }
                  <dt>{{ 'chantiers.chantier.detail.labels.situationsCumulHt' | translate }}</dt>
                  <dd>{{ c.cumulSituationsHt != null ? (c.cumulSituationsHt | mad) : ('chantiers.common.values.notAvailable' | translate) }}</dd>
                  <dt>{{ 'chantiers.chantier.detail.labels.factureHt' | translate }}</dt>
                  <dd>{{ c.facturesEmisesHt != null ? (c.facturesEmisesHt | mad) : ('chantiers.common.values.notAvailable' | translate) }}</dd>
                  <dt>{{ 'chantiers.chantier.detail.labels.encaisseTtc' | translate }}</dt>
                  <dd>{{ c.encaissementsTtc != null ? (c.encaissementsTtc | mad) : ('chantiers.common.values.notAvailable' | translate) }}</dd>
                </dl>
              </article>
            </div>
            <a class="btn-link" [routerLink]="['/chantiers/budget', c.id]">{{ 'chantiers.chantier.detail.budget.viewFullCta' | translate }}</a>
          </section>
        }

        <!-- Tab: Situations -->
        @if (activeTab() === 'situations') {
          <section class="tab-panel">
            @if (canGenerateSituationDraft()) {
              <div class="sit-gen">
                <p class="tab-hint">
                  {{ situationHintKey() | translate }}
                </p>
                <div class="tab-actions">
                  <nf-button variant="primary" icon="file-plus" iconLibrary="lucide" (clicked)="genererSituationN()">
                    {{ 'chantiers.chantier.detail.situations.generateCta' | translate }}
                  </nf-button>
                  @if (!marchePourChantier()) {
                    <nf-button variant="secondary" icon="file-plus" iconLibrary="lucide" (clicked)="creerMarche()">
                      {{ 'chantiers.chantier.detail.marche.createAction' | translate }}
                    </nf-button>
                  }
                </div>
              </div>
              @if (situationDraft(); as d) {
                <article class="draft-card">
                  <h3>{{ 'chantiers.chantier.detail.sections.brouillonCalcule' | translate }}</h3>
                  <dl>
                    <dt>{{ situationReferenceLabelKey() | translate }}</dt><dd>{{ d.marcheNumero }}</dd>
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
              <p class="tab-hint">{{ 'chantiers.chantier.detail.situations.noReference' | translate }}</p>
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
              [attachmentConfig]="attachmentConfig"
              (attachmentUploaded)="registerChantierDocument($event)" />
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

        @if (activeTab() === 'equipe') {
          <section class="tab-panel">
            <app-chantier-equipe-tab [chantierId]="c.id" />
          </section>
        }

        <div class="actions">
          <nf-button variant="secondary" icon="arrow-left" iconLibrary="lucide" (clicked)="goBack()">{{ 'chantiers.common.actions.backToList' | translate }}</nf-button>
          <nf-button variant="secondary" icon="pencil" iconLibrary="lucide" (clicked)="editChantier()">{{ 'chantiers.chantier.detail.actions.edit' | translate }}</nf-button>
          @if (canReceptionProvisoire()) {
            <nf-button variant="primary" icon="clipboard-check" iconLibrary="lucide" (clicked)="receptionProvisoire()">{{ 'chantiers.chantier.detail.actions.receptionProvisoire' | translate }}</nf-button>
          }
          @if (canReceptionDefinitive()) {
            <nf-button variant="primary" icon="badge-check" iconLibrary="lucide" (clicked)="receptionDefinitive()">{{ 'chantiers.chantier.detail.actions.receptionDefinitive' | translate }}</nf-button>
          }
          @if (canCloreChantier()) {
            <nf-button variant="secondary" icon="archive" iconLibrary="lucide" (clicked)="cloreChantier()">{{ 'chantiers.chantier.detail.actions.clore' | translate }}</nf-button>
          }
          @if (canDeleteChantier()) {
            <nf-button variant="danger" icon="trash-2" iconLibrary="lucide" (clicked)="deleteChantier()">{{ 'chantiers.common.actions.delete' | translate }}</nf-button>
          }
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
    </nf-screen>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .chantier-meta {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0 0.75rem;
      font-size: 0.9rem; color: var(--nf-color-text-secondary);
    }
    .chantier-meta__src { color: var(--nf-color-text-muted); }
    .chantier-meta__sep { color: var(--nf-color-text-muted); }
    .chantier-meta__link {
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--nf-color-primary-700, #1d4ed8);
      font: inherit;
      cursor: pointer;
      text-decoration: none;
    }
    .chantier-meta__link:hover { text-decoration: underline; }

    .contract-dates {
      display: grid; grid-template-columns: auto 1fr; gap: 0.35rem 1rem; margin: 0.75rem 0 1rem;
      font-size: 0.9rem;
    }
    .contract-dates--inline {
      margin-top: 1rem; padding: 0.75rem 1rem; border: 1px solid var(--nf-color-border);
      border-radius: 0.6rem; background: var(--nf-color-surface);
    }
    .contract-dates dt { color: var(--nf-color-text-secondary); }

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
    .tab:focus-visible { outline: 2px solid var(--nf-color-primary-600); outline-offset: -2px; border-radius: 0.25rem; }
    .tab--active { color: var(--nf-color-primary-700); border-bottom-color: var(--nf-color-primary-700); font-weight: 600; }

    .tab-panel { padding-bottom: 1.5rem; }
    .tab-panel__toolbar { display: flex; justify-content: flex-end; margin-bottom: 0.75rem; }
    .tab-hint { font-size: 0.9rem; }
    .tab-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
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
    .info-card__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
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
  private readonly contratApi = inject(ContratMarcheApiService);
  private readonly situationGen = inject(SituationGenerationService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);
  private readonly audit = inject(ErpAuditService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly documentsApi = inject(DocumentsApiService);
  private readonly dossierApi = inject(DossierEtudeApiService);
  private readonly auth = inject(AuthFacade);

  readonly marchesCache = signal<Marche[]>([]);

  readonly situationDraft = signal<SituationDraftBrouillon | null>(null);
  readonly chantier = signal<Chantier | undefined>(undefined);
  readonly canDeleteChantier = computed(() => this.chantier()?.lifecycleStatus === 'BROUILLON');
  readonly canReceptionProvisoire = computed(() => this.chantier()?.lifecycleStatus === 'EN_COURS');
  readonly canReceptionDefinitive = computed(() => this.chantier()?.lifecycleStatus === 'RECEPTIONNE_PROVISOIRE');
  readonly canCloreChantier = computed(() => this.chantier()?.lifecycleStatus === 'RECEPTIONNE_DEFINITIF');
  readonly summary = signal<ChantierSummary | undefined>(undefined);
  /** Numéro dossier étude (snapshot) — chargé depuis l'API quand dossierEtudeId est présent. */
  readonly etudeNumero = signal<string | null>(null);

  readonly paramId = toSignal(
    this.route.paramMap.pipe(map((pm) => pm.get('id')?.trim() ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id')?.trim() ?? '' },
  );

  /** P1-16 — les onglets portent des CLÉS de libellé ; la traduction est rendue par le pipe
   * (`| translate`) dans le template — réactive au chargement/au changement de langue. */
  readonly tabs = computed(() => ([
    { id: 'overview' as DetailTab, labelKey: 'chantiers.chantier.detail.tabs.pilotage' },
    { id: 'equipe' as DetailTab, labelKey: 'chantiers.chantier.detail.tabs.equipe' },
    { id: 'lots' as DetailTab, labelKey: 'chantiers.chantier.detail.tabs.lots' },
    { id: 'budget' as DetailTab, labelKey: 'chantiers.chantier.detail.tabs.budget' },
    { id: 'situations' as DetailTab, labelKey: 'chantiers.chantier.detail.tabs.situations' },
    { id: 'documents' as DetailTab, labelKey: 'chantiers.chantier.detail.tabs.documents' },
    { id: 'photos' as DetailTab, labelKey: 'chantiers.chantier.detail.tabs.photos' },
  ]));

  constructor() {
    const initialTab = this.route.snapshot.queryParamMap.get('tab');
    if (initialTab && normalizeDetailTab(initialTab) === 'overview') {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { tab: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }

    void this.contratApi
      .getAll()
      .then(({ items }) => this.marchesCache.set(items))
      .catch(() => this.marchesCache.set([]));

    effect(() => {
      const id = this.paramId();
      if (!id) {
        this.chantier.set(undefined);
        this.summary.set(undefined);
        this.etudeNumero.set(null);
        return;
      }
      void this.chantierApi
        .getSummary(id)
        .then((s) => {
          this.summary.set(s);
          this.chantier.set({
            ...s.chantier,
            avancementPercent: s.avancementPercent,
          });
          void this.loadEtudeNumero(s.chantier.dossierEtudeId);
        })
        .catch(() => {
          this.summary.set(undefined);
          void this.chantierApi
            .getById(id)
            .then((c) => {
              this.chantier.set(c);
              void this.loadEtudeNumero(c.dossierEtudeId);
            })
            .catch(() => {
              this.chantier.set(undefined);
              this.etudeNumero.set(null);
            });
        });
    });
  }

  readonly activeTab = toSignal(
    this.route.queryParamMap.pipe(map((q) => normalizeDetailTab(q.get('tab')))),
    { initialValue: normalizeDetailTab(this.route.snapshot.queryParamMap.get('tab')) },
  );

  readonly marchePourChantier = computed(() => {
    const c = this.chantier();
    if (!c) return undefined;
    return this.marchesCache().find((m) => m.chantierId === c.id);
  });

  readonly activeSituationReference = computed(() => {
    return resolveActiveSituationReference(this.chantier(), this.marchePourChantier());
  });

  readonly canGenerateSituationDraft = computed(() => this.activeSituationReference() != null);
  readonly situationReferenceLabelKey = computed(() => this.activeSituationReference()?.labelKey ?? 'chantiers.chantier.detail.labels.reference');
  readonly situationHintKey = computed(() => this.activeSituationReference()?.hintKey ?? 'chantiers.chantier.detail.situations.hint');

  /**
   * AC-3/AC-12 — vente active HT : le devis accepté (snapshot), jamais un coût ni un fallback.
   * AC-14 — absente si la source manque, jamais zéro.
   */
  readonly venteActiveHt = computed(() => {
    const summary = this.summary();
    if (summary?.montantVenteActifHt != null && summary.montantVenteActifHt > 0) {
      return summary.montantVenteActifHt;
    }
    return null;
  });

  /** AC-12 — budget révisé HT : dernier coût prévu, dérivé de l'arbre. */
  readonly budgetReviseHt = computed(() => {
    const summary = this.summary();
    if (summary?.budgetReviseHt != null) {
      return summary.budgetReviseHt;
    }
    return summary?.budget.reviseHt ?? null;
  });

  /** AC-12 — déboursé initial (snapshot), absent en création directe. */
  readonly debourseInitialHt = computed(() => this.summary()?.debourseInitialHt ?? null);

  /** AC-12 — marge projetée valeur et taux (formules du dictionnaire, jamais saisies). */
  readonly margeProjetee = computed(() => {
    const s = this.summary();
    if (s?.margeProjeteeHt == null) return null;
    return { valeur: s.margeProjeteeHt, pct: s.margeProjeteePct ?? null };
  });

  /** AC-15 — provenance : ouvrir l'étude et le devis par identifiant exact du snapshot. */
  readonly provenance = computed(() => {
    const c = this.chantier();
    return {
      dossierEtudeId: c?.dossierEtudeId ?? null,
      devisId: c?.devisId ?? null,
      devisNumero: c?.devisNumero ?? null,
      devisVersion: c?.devisVersion ?? null,
      sourceVente: c?.sourceVente ?? null,
    };
  });

  readonly displayBudgetHt = computed(() => {
    const summary = this.summary();
    const chantier = this.chantier();
    if (summary?.budget.reviseHt && summary.budget.reviseHt > 0) {
      return summary.budget.reviseHt;
    }
    return chantier?.budgetHt ?? 0;
  });

  readonly budgetHtLabelKey = computed(() => {
    const summary = this.summary();
    const chantier = this.chantier();
    if (
      summary?.budget.reviseHt &&
      summary.budget.reviseHt > 0 &&
      chantier &&
      Math.abs(summary.budget.reviseHt - chantier.budgetHt) > 0.01
    ) {
      return 'chantiers.chantier.detail.labels.budgetReviseHt';
    }
    return 'chantiers.chantier.detail.labels.venteHt';
  });

  readonly budgetTtcLabelKey = computed(() =>
    this.budgetHtLabelKey() === 'chantiers.chantier.detail.labels.budgetReviseHt'
      ? 'chantiers.chantier.detail.labels.budgetReviseTtc'
      : 'chantiers.chantier.detail.labels.venteTtc',
  );

  readonly headerConfig = computed(() => ({
    title: this.chantier()?.code ?? this.translate.instant('chantiers.chantier.detail.fallbackTitle'),
    // P1-16 — la donnée chantier expose `label` (pas `name`) ; sous-titre jamais vide si label présent.
    subtitle: this.chantier()?.label ?? this.chantier()?.name ?? undefined,
    icon: 'construction',
    breadcrumbs: [
      { label: this.translate.instant('chantiers.routes.chantiersCrumb'), route: '/chantiers' },
      { label: this.chantier()?.code ?? this.translate.instant('chantiers.routes.chantierDetailCrumb') },
    ],
  }));

  setTab(tab: DetailTab): void {
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

  async registerChantierDocument(attachment: RecordAttachmentDto): Promise<void> {
    const c = this.chantier();
    if (!c?.id) return;
    try {
      await this.documentsApi.createForChantier(c.id, {
        type: 'AUTRE',
        titre: attachment.fileName.replace(/\.[^.]+$/, ''),
        fichier: attachment.fileName,
        storageKey: attachment.fileUrl,
        taille: attachment.sizeBytes ?? 0,
        uploadedAt: attachment.uploadedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        uploadedPar: attachment.uploadedBy ?? this.auth.displayName(),
      });
    } catch {
      this.toast.warning(this.translate.instant('chantiers.documents.create.errors.syncFailed'));
    }
  }

  /** AC-8 — charge le numéro étude du snapshot pour lien cliquable sur la fiche chantier. */
  private async loadEtudeNumero(dossierEtudeId: string | null | undefined): Promise<void> {
    if (!dossierEtudeId) {
      this.etudeNumero.set(null);
      return;
    }
    try {
      const syn = await this.dossierApi.synthese(dossierEtudeId);
      this.etudeNumero.set(syn.numero ?? null);
    } catch {
      this.etudeNumero.set(null);
    }
  }

  openPlanning(): void {
    const c = this.chantier();
    if (!c?.id) return;
    void this.router.navigate(['/chantiers/planning'], { queryParams: { chantier: c.id } });
  }

  /** AC-15 — depuis le chantier, ouvrir le devis accepté par son identifiant exact. */
  openDevis(): void {
    const id = this.provenance()?.devisId;
    if (id) void this.router.navigate(['/etudes/devis', id]);
  }

  /** AC-15 — depuis le chantier, ouvrir l'étude gagnée par son identifiant exact. */
  openEtude(): void {
    const id = this.provenance()?.dossierEtudeId;
    if (id) void this.router.navigate(['/etudes/dossiers', id]);
  }

  openAvancement(): void {
    const c = this.chantier();
    if (!c?.id) return;
    void this.router.navigate(['/chantiers/avancements/saisie', c.id]);
  }

  openAttachements(): void {
    const c = this.chantier();
    if (!c?.id) return;
    void this.router.navigate(['/chantiers/attachements'], { queryParams: { chantierId: c.id } });
  }

  openJournal(): void {
    const c = this.chantier();
    if (!c?.id) return;
    void this.router.navigate(['/chantiers/journal'], { queryParams: { chantierId: c.id } });
  }

  /** AC-183 — date contractuelle absente : « Non défini », jamais un fallback inventé. */
  contractDateLabel(value?: string | null): string {
    if (!value?.trim()) {
      return this.translate.instant('chantiers.common.values.notDefined');
    }
    return value.slice(0, 10);
  }

  goBack(): void {
    void this.router.navigateByUrl(
      safePortefeuilleReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')),
    );
  }

  editChantier(): void {
    const c = this.chantier();
    if (!c?.id) return;
    void this.router.navigate(['/chantiers', c.id, 'edit']);
  }

  async deleteChantier(): Promise<void> {
    const c = this.chantier();
    if (!c?.id) return;
    if (!this.canDeleteChantier()) {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.deleteFailedDraftOnly'));
      return;
    }
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
    } catch (error) {
      this.toast.error(this.resolveDeleteErrorMessage(error));
    }
  }

  private resolveDeleteErrorMessage(error: unknown): string {
    const draftOnlyKey = 'chantiers.chantier.detail.deleteFailedDraftOnly';
    const genericKey = 'chantiers.chantier.detail.deleteFailed';

    if (error instanceof HttpErrorResponse) {
      const apiMessage = this.readApiErrorMessage(error);
      if (error.status === 409 || this.isDraftOnlyDeleteError(apiMessage)) {
        return this.translate.instant(draftOnlyKey);
      }
      if (apiMessage) {
        return apiMessage;
      }
    }

    return this.translate.instant(genericKey);
  }

  private readApiErrorMessage(error: HttpErrorResponse): string | null {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error.trim();
    }
    if (error.error && typeof error.error === 'object') {
      const message = (error.error as Record<string, unknown>)['message'];
      if (typeof message === 'string' && message.trim()) {
        return message.trim();
      }
    }
    return null;
  }

  private isDraftOnlyDeleteError(message: string | null): boolean {
    if (!message) return false;
    const normalized = message.toLowerCase();
    return normalized.includes('only draft chantiers can be deleted')
        || normalized.includes('seuls les chantiers brouillon');
  }

  async receptionProvisoire(): Promise<void> {
    const c = this.chantier();
    if (!c?.id || !this.canReceptionProvisoire()) return;
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('chantiers.chantier.detail.actions.receptionProvisoireTitle'),
      message: this.translate.instant('chantiers.chantier.detail.actions.receptionProvisoireConfirm', { code: c.code }),
      confirmLabel: this.translate.instant('chantiers.chantier.detail.actions.receptionProvisoireAction'),
      cancelLabel: this.translate.instant('chantiers.chantier.detail.cancel'),
      icon: 'clipboard-check',
    });
    if (!confirmed) return;
    try {
      const updated = await this.chantierApi.receptionProvisoire(c.id);
      this.chantier.set(updated);
      this.audit.log('UPDATE', 'chantier', c.id, c.code, 'reception-provisoire');
      this.toast.success(this.translate.instant('chantiers.chantier.detail.actions.receptionProvisoireSuccess'));
    } catch {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.actions.receptionProvisoireFailed'));
    }
  }

  async receptionDefinitive(): Promise<void> {
    const c = this.chantier();
    if (!c?.id || !this.canReceptionDefinitive()) return;
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('chantiers.chantier.detail.actions.receptionDefinitiveTitle'),
      message: this.translate.instant('chantiers.chantier.detail.actions.receptionDefinitiveConfirm', { code: c.code }),
      confirmLabel: this.translate.instant('chantiers.chantier.detail.actions.receptionDefinitiveAction'),
      cancelLabel: this.translate.instant('chantiers.chantier.detail.cancel'),
      icon: 'badge-check',
    });
    if (!confirmed) return;
    try {
      const updated = await this.chantierApi.receptionDefinitive(c.id);
      this.chantier.set(updated);
      this.audit.log('UPDATE', 'chantier', c.id, c.code, 'reception-definitive');
      this.toast.success(this.translate.instant('chantiers.chantier.detail.actions.receptionDefinitiveSuccess'));
    } catch {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.actions.receptionDefinitiveFailed'));
    }
  }

  async cloreChantier(): Promise<void> {
    const c = this.chantier();
    if (!c?.id || !this.canCloreChantier()) return;
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('chantiers.chantier.detail.actions.cloreTitle'),
      message: this.translate.instant('chantiers.chantier.detail.actions.cloreConfirm', { code: c.code }),
      confirmLabel: this.translate.instant('chantiers.chantier.detail.actions.cloreAction'),
      cancelLabel: this.translate.instant('chantiers.chantier.detail.cancel'),
      icon: 'archive',
    });
    if (!confirmed) return;
    try {
      const updated = await this.chantierApi.clore(c.id);
      this.chantier.set(updated);
      this.audit.log('UPDATE', 'chantier', c.id, c.code, 'clore');
      this.toast.success(this.translate.instant('chantiers.chantier.detail.actions.cloreSuccess'));
    } catch {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.actions.cloreFailed'));
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
      await this.contratApi.create(chantierToMarcheDraft(c));
      const { items } = await this.contratApi.getAll();
      this.marchesCache.set(items);
      this.toast.success(this.translate.instant('chantiers.chantier.detail.marche.createSuccess'));
    } catch {
      this.toast.error(this.translate.instant('chantiers.chantier.detail.marche.createFailed'));
    }
  }

  async genererSituationN(): Promise<void> {
    const c = this.chantier();
    const reference = this.activeSituationReference();
    if (!c?.id || !reference) {
      this.situationDraft.set(null);
      return;
    }
    let lots;
    try {
      lots = await this.lotApi.listByChantier(c.id);
    } catch {
      this.situationDraft.set(null);
      return;
    }
    const draft = this.situationGen.buildDraft({
      marcheId: reference.id,
      marcheNumero: reference.numero,
      chantierId: c.id,
      chantierCode: c.code,
      montantMarcheHt: reference.montantHt,
      avancementPercent: c.avancementPercent,
      cumulSituationsFactureHt: c.cumulSituationsHt ?? 0,
      revisionKHt: 0,
      penalitesHt: 0,
      retenueGarantiePercent: resolveRetenueGarantiePercent(c, this.marchePourChantier()),
      tvaTaux: c.tvaTaux,
      lots: lots.map((l) => ({
        code: l.code,
        designation: l.designation,
        avancementPercent: l.avancementPercent ?? 0,
      })),
    });
    this.situationDraft.set(draft);
  }
}
