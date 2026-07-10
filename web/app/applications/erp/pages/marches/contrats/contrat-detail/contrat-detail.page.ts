import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent, ButtonComponent } from '@lib/anatomy';
import { EmptyStateComponent } from '@lib/anatomy/components';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import {
  MARCHE_STATUS_KEYS,
  MARCHE_TYPE_KEYS,
  MARCHE_NATURE_KEYS,
  AVENANT_STATUS_KEYS,
  AVENANT_TYPE_KEYS,
  FACTURE_MARCHE_STATUS_KEYS,
  CAUTION_STATUS_KEYS,
  CAUTION_TYPE_KEYS,
} from '@applications/erp/shell/i18n-labels';
import { ToastService } from '@lib/anatomy/components/services/toast.service';
import { ContratMarcheApiService } from '../services/contrat-marche-api.service';
import { AvenantApiService } from '../../avenants/services/avenant-api.service';
import { CautionApiService } from '../../cautions/services/caution-api.service';
import { FactureMarcheApiService } from '../../factures/services/facture-marche-api.service';
import {
  MARCHE_STATUS_VARIANT,
  FACTURE_STATUS_VARIANT,
  type Marche,
  type MarcheStatus,
  type Avenant,
  type AvenantStatus,
  type FactureMarche,
  type FactureMarcheStatus,
  type CautionBancaire,
  type CautionStatus,
} from '../../models';

type DetailTab = 'identite' | 'avenants' | 'factures' | 'cautions' | 'revision';

const TABS: { id: DetailTab; labelKey: string }[] = [
  { id: 'identite', labelKey: 'marches.contrat.detail.tabs.identite' },
  { id: 'avenants', labelKey: 'marches.contrat.detail.tabs.avenants' },
  { id: 'factures', labelKey: 'marches.contrat.detail.tabs.factures' },
  { id: 'cautions', labelKey: 'marches.contrat.detail.tabs.cautions' },
  { id: 'revision', labelKey: 'marches.contrat.detail.tabs.revision' },
];

@Component({
  selector: 'app-contrat-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, PageShellComponent, PageHeaderComponent, EmptyStateComponent, MadCurrencyPipe, TranslateModule, ButtonComponent],
  template: `
    <nf-page-shell scroll>
      @if (marche(); as m) {
        <nf-page-header [config]="headerConfig()"></nf-page-header>

        <!-- Hero -->
        <section class="hero">
          <div class="hero__left">
            <p class="hero__kicker">
              {{ m.numero }}
              @if (m.nature === 'PUBLIC') { <span class="ras-badge">{{ 'marches.contrat.detail.ras' | translate }}</span> }
            </p>
            <h1 class="hero__title">{{ m.intitule }}</h1>
            <p class="hero__sub">
              <a [routerLink]="['/chantiers', m.chantierId]" class="link">{{ m.chantierCode }}</a>
              · {{ m.clientNom }}
            </p>
          </div>
          <div class="hero__right">
            <span class="badge badge--{{ statusVariant(m.status) }}">{{ MARCHE_STATUS_KEYS[m.status] | translate }}</span>
          </div>
        </section>

        <!-- KPIs -->
        <div class="kpis">
          <article class="kpi">
            <span>{{ 'marches.contrat.detail.kpis.montantInitialHt' | translate }}</span>
            <strong>{{ m.montantInitialHt | mad }}</strong>
          </article>
          @if (m.montantAvenantsHt !== 0) {
            <article class="kpi">
              <span>{{ 'marches.contrat.detail.kpis.avenantsHt' | translate }}</span>
              <strong [class.positive]="m.montantAvenantsHt > 0" [class.negative]="m.montantAvenantsHt < 0">
                {{ m.montantAvenantsHt > 0 ? '+' : '' }}{{ m.montantAvenantsHt | mad }}
              </strong>
            </article>
          }
          <article class="kpi kpi--accent">
            <span>{{ 'marches.contrat.detail.kpis.totalHt' | translate }}</span>
            <strong>{{ m.montantTotalHt | mad }}</strong>
          </article>
          <article class="kpi">
            <span>{{ 'marches.contrat.detail.kpis.factureHt' | translate }}</span>
            <strong>{{ m.cumulFactureHt | mad }}</strong>
            <small>{{ 'marches.contrat.detail.kpis.pctMarche' | translate:{ pct: pctFacture(m) } }}</small>
          </article>
          <article class="kpi">
            <span>{{ 'marches.contrat.detail.kpis.encaisseHt' | translate }}</span>
            <strong>{{ m.cumulEncaisseHt | mad }}</strong>
          </article>
          <article class="kpi">
            <span>{{ 'marches.contrat.detail.kpis.avancement' | translate }}</span>
            <strong>{{ m.avancementPercent }}%</strong>
            <div class="progress-bar"><div class="progress-fill" [style.width.%]="m.avancementPercent"></div></div>
          </article>
        </div>

        <!-- Tabs -->
        <nav class="tabs">
          @for (tab of tabs; track tab.id) {
            <nf-button variant="ghost" size="sm" [active]="activeTab() === tab.id" (clicked)="setTab(tab.id)">{{ tab.labelKey | translate }}</nf-button>
          }
        </nav>

        <!-- Tab: Identité -->
        @if (activeTab() === 'identite') {
          <section class="tab-panel">
            <div class="info-grid">
              <article class="info-card">
                <h3>{{ 'marches.contrat.detail.identite.moa.title' | translate }}</h3>
                <dl>
                  <dt>{{ 'marches.contrat.detail.identite.moa.raisonSociale' | translate }}</dt><dd>{{ m.clientNom }}</dd>
                  @if (m.clientIce) { <dt>{{ 'marches.contrat.detail.identite.moa.ice' | translate }}</dt><dd class="mono">{{ m.clientIce }}</dd> }
                  @if (m.clientIf) { <dt>{{ 'marches.contrat.detail.identite.moa.if' | translate }}</dt><dd class="mono">{{ m.clientIf }}</dd> }
                  @if (m.clientRc) { <dt>{{ 'marches.contrat.detail.identite.moa.rc' | translate }}</dt><dd class="mono">{{ m.clientRc }}</dd> }
                  <dt>{{ 'marches.contrat.detail.identite.moa.nature' | translate }}</dt><dd>{{ MARCHE_NATURE_KEYS[m.nature] | translate }}</dd>
                </dl>
              </article>
              <article class="info-card">
                <h3>{{ 'marches.contrat.detail.identite.caracteristiques.title' | translate }}</h3>
                <dl>
                  <dt>{{ 'marches.contrat.detail.identite.caracteristiques.type' | translate }}</dt><dd>{{ MARCHE_TYPE_KEYS[m.type] | translate }}</dd>
                  <dt>{{ 'marches.contrat.detail.identite.caracteristiques.tva' | translate }}</dt><dd>{{ m.tvaTaux }}%</dd>
                  <dt>{{ 'marches.contrat.detail.identite.caracteristiques.retenueGarantie' | translate }}</dt><dd>{{ m.retenueGarantieTaux }}%</dd>
                  <dt>{{ 'marches.contrat.detail.identite.caracteristiques.retenueSource' | translate }}</dt><dd>{{ m.retenueSourceTaux > 0 ? m.retenueSourceTaux + '%' : '—' }}</dd>
                  @if (m.avanceForfaitairePercent) {
                    <dt>{{ 'marches.contrat.detail.identite.caracteristiques.avanceForfaitaire' | translate }}</dt><dd>{{ m.avanceForfaitairePercent }}%</dd>
                  }
                </dl>
              </article>
              <article class="info-card">
                <h3>{{ 'marches.contrat.detail.identite.calendrier.title' | translate }}</h3>
                <dl>
                  <dt>{{ 'marches.contrat.detail.identite.calendrier.ordreService' | translate }}</dt><dd>{{ (m.dateOrdreService ?? '—') | date:'dd/MM/yyyy' }}</dd>
                  <dt>{{ 'marches.contrat.detail.identite.calendrier.delaiExecution' | translate }}</dt><dd>{{ 'marches.contrat.detail.identite.calendrier.delaiExecutionMois' | translate:{ count: m.delaiExecutionMois } }}</dd>
                  @if (m.penaliteRetardJourPercent) {
                    <dt>{{ 'marches.contrat.detail.identite.calendrier.penaliteRetardJour' | translate }}</dt><dd>{{ m.penaliteRetardJourPercent }}%</dd>
                  }
                  @if (m.dateReceptionProvisoire) {
                    <dt>{{ 'marches.contrat.detail.identite.calendrier.receptionProvisoire' | translate }}</dt><dd>{{ m.dateReceptionProvisoire | date:'dd/MM/yyyy' }}</dd>
                  }
                  @if (m.dateReceptionDefinitive) {
                    <dt>{{ 'marches.contrat.detail.identite.calendrier.receptionDefinitive' | translate }}</dt><dd>{{ m.dateReceptionDefinitive | date:'dd/MM/yyyy' }}</dd>
                  }
                </dl>
              </article>
            </div>
          </section>
        }

        <!-- Tab: Avenants -->
        @if (activeTab() === 'avenants') {
          <section class="tab-panel">
            @if (avenants().length) {
              <table class="data-table">
                <thead><tr>
                  <th>{{ 'marches.contrat.detail.avenants.columns.numero' | translate }}</th>
                  <th>{{ 'marches.contrat.detail.avenants.columns.type' | translate }}</th>
                  <th>{{ 'marches.contrat.detail.avenants.columns.objet' | translate }}</th>
                  <th class="num">{{ 'marches.contrat.detail.avenants.columns.montantHt' | translate }}</th>
                  <th>{{ 'marches.contrat.detail.avenants.columns.delaiPlus' | translate }}</th>
                  <th>{{ 'marches.contrat.detail.avenants.columns.signature' | translate }}</th>
                  <th>{{ 'marches.contrat.detail.avenants.columns.statut' | translate }}</th>
                </tr></thead>
                <tbody>
                  @for (a of avenants(); track a.id) {
                    <tr class="row-link" [routerLink]="['/marches/avenants', a.id]">
                      <td><strong class="code">{{ a.numero }}</strong></td>
                      <td class="type-sm">{{ AVENANT_TYPE_KEYS[a.type] | translate }}</td>
                      <td class="objet">{{ a.objet }}</td>
                      <td class="num" [class.positive]="a.montantHt > 0" [class.negative]="a.montantHt < 0">
                        {{ a.montantHt !== 0 ? (a.montantHt > 0 ? '+' : '') : '' }}{{ a.montantHt | mad }}
                      </td>
                      <td>{{ a.prolongationJours > 0 ? ('marches.contrat.detail.avenants.delaiJoursPlus' | translate:{ count: a.prolongationJours }) : '—' }}</td>
                      <td class="date">{{ (a.dateSignature ?? '—') | date:'dd/MM/yyyy' }}</td>
                      <td><span class="badge badge--{{ avenantStatusVariant(a.status) }}">{{ AVENANT_STATUS_KEYS[a.status] | translate }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <p class="empty-hint">{{ 'marches.contrat.detail.avenants.empty' | translate }}</p>
            }
          </section>
        }

        <!-- Tab: Factures -->
        @if (activeTab() === 'factures') {
          <section class="tab-panel">
            @if (factures().length) {
              <table class="data-table">
                <thead><tr>
                  <th>{{ 'marches.contrat.detail.factures.columns.numero' | translate }}</th>
                  <th class="num">{{ 'marches.contrat.detail.factures.columns.brutHt' | translate }}</th>
                  <th class="num">{{ 'marches.contrat.detail.factures.columns.rg' | translate:{ rate: m.retenueGarantieTaux } }}</th>
                  <th class="num">{{ 'marches.contrat.detail.factures.columns.netHt' | translate }}</th>
                  <th class="num">{{ 'marches.contrat.detail.factures.columns.tva' | translate }}</th>
                  @if (m.retenueSourceTaux > 0) { <th class="num">{{ 'marches.contrat.detail.factures.columns.ras' | translate:{ rate: m.retenueSourceTaux } }}</th> }
                  <th class="num">{{ 'marches.contrat.detail.factures.columns.netAPayer' | translate }}</th>
                  <th>{{ 'marches.contrat.detail.factures.columns.emission' | translate }}</th>
                  <th>{{ 'marches.contrat.detail.factures.columns.echeance' | translate }}</th>
                  <th>{{ 'marches.contrat.detail.factures.columns.statut' | translate }}</th>
                </tr></thead>
                <tbody>
                  @for (f of factures(); track f.id) {
                    <tr>
                      <td><a [routerLink]="['/marches/factures', f.id]" class="code">{{ f.numero }}</a></td>
                      <td class="num">{{ f.montantBrutHt | mad }}</td>
                      <td class="num danger-text">−{{ f.retenueGarantieHt | mad }}</td>
                      <td class="num">{{ f.netHt | mad }}</td>
                      <td class="num">{{ f.tvaMontant | mad }}</td>
                      @if (m.retenueSourceTaux > 0) {
                        <td class="num danger-text">−{{ f.retenueSourceMontant | mad }}</td>
                      }
                      <td class="num accent-text"><strong>{{ f.netAPayer | mad }}</strong></td>
                      <td class="date">{{ f.dateEmission | date:'dd/MM/yy' }}</td>
                      <td class="date">{{ f.dateEcheance | date:'dd/MM/yy' }}</td>
                      <td><span class="badge badge--{{ factureStatusVariant(f.status) }}">{{ FACTURE_MARCHE_STATUS_KEYS[f.status] | translate }}</span></td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td><strong>{{ 'marches.contrat.detail.factures.columns.total' | translate }}</strong></td>
                    <td class="num"><strong>{{ totalFacture() | mad }}</strong></td>
                    <td [attr.colspan]="m.retenueSourceTaux > 0 ? 7 : 6"></td>
                  </tr>
                </tfoot>
              </table>
            } @else {
              <p class="empty-hint">{{ 'marches.contrat.detail.factures.empty' | translate }}</p>
            }
          </section>
        }

        <!-- Tab: Cautions -->
        @if (activeTab() === 'cautions') {
          <section class="tab-panel">
            @if (cautions().length) {
              <table class="data-table">
                <thead><tr>
                  <th>{{ 'marches.contrat.detail.cautions.columns.numero' | translate }}</th>
                  <th>{{ 'marches.contrat.detail.cautions.columns.type' | translate }}</th>
                  <th>{{ 'marches.contrat.detail.cautions.columns.banque' | translate }}</th>
                  <th class="num">{{ 'marches.contrat.detail.cautions.columns.montant' | translate }}</th>
                  <th>{{ 'marches.contrat.detail.cautions.columns.emission' | translate }}</th>
                  <th>{{ 'marches.contrat.detail.cautions.columns.validite' | translate }}</th>
                  <th>{{ 'marches.contrat.detail.cautions.columns.levee' | translate }}</th>
                  <th>{{ 'marches.contrat.detail.cautions.columns.statut' | translate }}</th>
                </tr></thead>
                <tbody>
                  @for (c of cautions(); track c.id) {
                    <tr>
                      <td><strong class="code">{{ c.numero }}</strong></td>
                      <td>{{ CAUTION_TYPE_KEYS[c.type] | translate }}</td>
                      <td>{{ c.banqueEmettrice }}</td>
                      <td class="num">{{ c.montant | mad }}</td>
                      <td class="date">{{ c.dateEmission | date:'dd/MM/yy' }}</td>
                      <td class="date" [class.expiry-warn]="isExpiryWarning(c.dateValiditeJusquA, c.status)">
                        {{ c.dateValiditeJusquA | date:'dd/MM/yy' }}
                      </td>
                      <td class="date">{{ c.dateLevee ? (c.dateLevee | date:'dd/MM/yy') : '—' }}</td>
                      <td><span class="badge badge--{{ cautionStatusVariant(c.status) }}">{{ CAUTION_STATUS_KEYS[c.status] | translate }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <p class="empty-hint">{{ 'marches.contrat.detail.cautions.empty' | translate }}</p>
            }
          </section>
        }

        <!-- Tab: Révision K -->
        @if (activeTab() === 'revision') {
          <section class="tab-panel">
            @if (m.formuleRevisionK; as fk) {
              <div class="revision-card">
                <h3>{{ 'marches.contrat.detail.revision.title' | translate }}</h3>
                <p class="formula">{{ 'marches.contrat.detail.revision.formula' | translate:{ fixe: fk.termeFixe, terme: formuleK(fk) } }}</p>
                <table class="data-table">
                  <thead><tr>
                    <th>{{ 'marches.contrat.detail.revision.columns.indice' | translate }}</th>
                    <th class="num">{{ 'marches.contrat.detail.revision.columns.coefficient' | translate }}</th>
                    <th class="num">{{ 'marches.contrat.detail.revision.columns.valeurBase' | translate }}</th>
                  </tr></thead>
                  <tbody>
                    @for (t of fk.termesVariables; track t.indiceCode) {
                      <tr>
                        <td><strong>{{ t.indiceCode }}</strong></td>
                        <td class="num">{{ t.coefficient }}</td>
                        <td class="num">{{ t.indiceBaseValeur }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <p class="empty-hint">{{ 'marches.contrat.detail.revision.empty' | translate }}</p>
            }
          </section>
        }

        <div class="back-action">
          <nf-button variant="secondary" (clicked)="goBack()">{{ 'marches.common.actions.back' | translate }}</nf-button>
        </div>

      } @else {
        <nf-empty-state icon="gavel"
          [title]="'marches.contrat.detail.empty.title' | translate"
          [message]="'marches.contrat.detail.empty.message' | translate"
          [actionLabel]="'marches.contrat.detail.empty.action' | translate"
          (action)="goBack()"></nf-empty-state>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .hero { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding: 1.1rem 1.4rem; border-radius: 1rem; margin-bottom: 1rem; background: linear-gradient(135deg, rgba(30,64,175,0.06), rgba(255,255,255,0.98)); border: 1px solid rgba(30,64,175,0.1); }
    .hero__left { flex: 1; min-width: 0; }
    .hero__kicker { margin: 0 0 0.25rem; font-size: 0.8rem; color: var(--nf-color-text-secondary); display: flex; align-items: center; gap: 0.5rem; }
    .hero__title { margin: 0 0 0.25rem; font-size: 1.25rem; font-weight: 700; color: var(--nf-color-text-primary); }
    .hero__sub { margin: 0; font-size: 0.82rem; color: var(--nf-color-text-secondary); }
    .link { color: var(--nf-color-primary-600); text-decoration: none; font-weight: 600; }
    .link:hover { text-decoration: underline; }
    .ras-badge { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); padding: 1px 7px; border-radius: 4px; font-size: 11px; font-weight: 700; }

    .kpis { display: flex; gap: 0.875rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
    .kpi { padding: 0.875rem 1.1rem; background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; min-width: 140px; }
    .kpi--accent { background: var(--nf-color-primary-50); border-color: var(--nf-color-primary-200); }
    .kpi span { display: block; font-size: 0.72rem; color: var(--nf-color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.25rem; }
    .kpi strong { display: block; font-size: 1rem; font-weight: 700; color: var(--nf-color-text-primary); }
    .kpi small { display: block; font-size: 0.72rem; color: var(--nf-color-text-secondary); margin-top: 0.15rem; }
    .progress-bar { height: 5px; background: var(--nf-color-border); border-radius: 3px; overflow: hidden; margin-top: 0.4rem; }
    .progress-fill { height: 100%; background: var(--nf-color-primary-500); border-radius: 3px; }

    .tabs { display: flex; gap: 4px; border-bottom: 2px solid var(--nf-color-border); margin-bottom: 1.25rem; overflow-x: auto; padding-bottom: 2px; }

    .tab-panel { padding-bottom: 1.5rem; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    .info-card { padding: 1rem 1.25rem; border-radius: 0.75rem; background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); }
    .info-card h3 { margin: 0 0 0.7rem; font-size: 0.78rem; font-weight: 700; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }
    dl { display: grid; grid-template-columns: auto 1fr; column-gap: 0.75rem; row-gap: 0.3rem; margin: 0; }
    dt { font-size: 0.78rem; color: var(--nf-color-text-muted); white-space: nowrap; }
    dd { margin: 0; font-size: 0.87rem; font-weight: 500; color: var(--nf-color-text-primary); }
    .mono { font-family: monospace; font-size: 0.8rem; }

    .data-table { width: 100%; border-collapse: collapse; font-size: 0.86rem; background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; overflow: hidden; }
    .data-table th { padding: 0.65rem 1rem; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-border); white-space: nowrap; }
    .data-table th.num { text-align: right; }
    .data-table tr.row-link { cursor: pointer; transition: background 80ms; }
    .data-table tr.row-link:hover { background: var(--nf-color-bg-subtle); }
    .data-table td { padding: 0.6rem 1rem; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    .data-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .data-table td.date { white-space: nowrap; color: var(--nf-color-text-secondary); font-size: 0.8rem; }
    .data-table td.objet { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .data-table td.type-sm { font-size: 0.78rem; }
    .data-table tfoot .total-row td { border-top: 2px solid var(--nf-color-border); background: var(--nf-color-bg-subtle); padding: 0.65rem 1rem; font-size: 0.86rem; }
    .data-table tfoot .total-row td.num { text-align: right; }

    .code { color: var(--nf-color-primary-700); text-decoration: none; font-weight: 600; }
    a.code:hover { text-decoration: underline; }
    .positive { color: var(--nf-color-success-700); }
    .negative { color: var(--nf-color-danger-700); }
    .danger-text { color: var(--nf-color-danger-700); }
    .accent-text { color: var(--nf-color-primary-700); }
    .expiry-warn { color: var(--nf-color-warning-700); font-weight: 600; }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap; }
    .badge--info { background: var(--nf-color-primary-100); color: var(--nf-color-primary-700); }
    .badge--success { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .badge--warning { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .badge--danger { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .badge--secondary { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }

    .revision-card { background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; padding: 1.25rem; }
    .revision-card h3 { margin: 0 0 0.5rem; font-size: 0.9rem; font-weight: 700; }
    .formula { font-family: monospace; font-size: 0.9rem; color: var(--nf-color-primary-700); margin: 0 0 1rem; }
    .empty-hint { color: var(--nf-color-text-muted); font-size: 0.9rem; padding: 1.5rem 0; }
    .back-action { padding-top: 1rem; border-top: 1px solid var(--nf-color-bg-muted); margin-top: 0.5rem; }
    .back-action { margin-top: 1rem; }
  `],
})
export class ContratDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ContratMarcheApiService);
  private readonly avenantApi = inject(AvenantApiService);
  private readonly cautionApi = inject(CautionApiService);
  private readonly factureApi = inject(FactureMarcheApiService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly tabs = TABS;
  readonly activeTab = signal<DetailTab>('identite');
  readonly marche = signal<Marche | undefined>(undefined);
  readonly avenants = signal<Avenant[]>([]);
  readonly factures = signal<FactureMarche[]>([]);
  readonly cautions = signal<CautionBancaire[]>([]);

  readonly MARCHE_STATUS_KEYS = MARCHE_STATUS_KEYS;
  readonly MARCHE_TYPE_KEYS = MARCHE_TYPE_KEYS;
  readonly MARCHE_NATURE_KEYS = MARCHE_NATURE_KEYS;
  readonly AVENANT_STATUS_KEYS = AVENANT_STATUS_KEYS;
  readonly AVENANT_TYPE_KEYS = AVENANT_TYPE_KEYS;
  readonly FACTURE_MARCHE_STATUS_KEYS = FACTURE_MARCHE_STATUS_KEYS;
  readonly CAUTION_STATUS_KEYS = CAUTION_STATUS_KEYS;
  readonly CAUTION_TYPE_KEYS = CAUTION_TYPE_KEYS;

  ngOnInit(): void {
    void this.loadMarche();
  }

  private async loadMarche(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!id) return;
    if (id === 'new') {
      void this.router.navigate(['/marches/contrats/new'], { replaceUrl: true });
      return;
    }
    try {
      const [marche, avenants, cautions, factures] = await Promise.all([
        this.api.getById(id),
        this.avenantApi.listByMarche(id),
        this.cautionApi.listByMarche(id),
        this.factureApi.listByMarche(id),
      ]);
      this.marche.set(marche);
      this.avenants.set(avenants);
      this.cautions.set(cautions);
      this.factures.set(factures);
    } catch {
      this.marche.set(undefined);
      this.avenants.set([]);
      this.cautions.set([]);
      this.factures.set([]);
      this.toast.error('Impossible de charger le contrat de marché.');
    }
  }

  readonly headerConfig = computed(() => {
    const m = this.marche();
    return {
      title: m?.numero ?? this.translate.instant('marches.contrat.detail.headerTitleFallback'),
      subtitle: m?.intitule,
      breadcrumbs: [
        { label: this.translate.instant('marches.module.title') },
        { label: this.translate.instant('marches.contrat.listing.breadcrumb'), route: '/marches/contrats' },
        { label: m?.numero ?? this.translate.instant('marches.contrat.detail.headerCrumbFallback') },
      ],
    };
  });

  readonly totalFacture = computed(() => this.factures().reduce((s, f) => s + f.montantBrutHt, 0));

  setTab(tab: DetailTab): void { this.activeTab.set(tab); }

  pctFacture(m: ReturnType<typeof this.marche>): number {
    if (!m || m.montantTotalHt === 0) return 0;
    return Math.round(m.cumulFactureHt / m.montantTotalHt * 100);
  }

  isExpiryWarning(date: string, status: CautionStatus): boolean {
    if (status === 'LEVEE' || status === 'EXPIRE') return false;
    const d = new Date(date);
    const warn = new Date();
    warn.setDate(warn.getDate() + 30);
    return d < warn;
  }

  statusVariant(s: MarcheStatus): string { return MARCHE_STATUS_VARIANT[s] ?? 'secondary'; }

  avenantStatusVariant(s: AvenantStatus): string {
    const map: Record<AvenantStatus, string> = { BROUILLON: 'secondary', PROPOSE: 'warning', SIGNE: 'success', REJETE: 'danger' };
    return map[s] ?? 'secondary';
  }

  factureStatusVariant(s: FactureMarcheStatus): string { return FACTURE_STATUS_VARIANT[s] ?? 'secondary'; }

  cautionStatusVariant(s: CautionStatus): string {
    const map: Record<CautionStatus, string> = { EMISE: 'info', ACTIVE: 'success', LEVEE: 'secondary', EXPIRE: 'danger', JOUE: 'danger' };
    return map[s] ?? 'secondary';
  }

  formuleK(fk: { termesVariables: Array<{ coefficient: number; indiceCode: string }> }): string {
    return fk.termesVariables.map(t => t.coefficient + '·' + t.indiceCode).join(' + ');
  }

  goBack(): void { void this.router.navigate(['/marches/contrats']); }
}
