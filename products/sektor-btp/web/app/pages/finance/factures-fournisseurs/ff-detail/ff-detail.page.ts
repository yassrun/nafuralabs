import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { PageHeaderComponent, PageShellComponent, ToastService, ConfirmDialogService } from '@lib/anatomy';
import { ButtonComponent } from '@lib/anatomy/components';
import { AttachmentListComponent } from '@platform/features/collaboration/doc-manager/components/attachment-list.component';
import {
  DOCUMENT_ATTACHMENT_CONFIG,
  ERP_ATTACHMENT_ENTITY_TYPES,
} from '@applications/erp/shared/config/attachment-detail.config';
import { DateLocalizedPipe } from '@lib/anatomy/pipes';
import { SubmitApprovalButtonComponent } from '@applications/erp/pages/approbations/components/submit-approval-button/submit-approval-button.component';
import type { ComptaFournisseur } from '@applications/erp/finance/models';
import { ChartOfAccountApiService } from '@applications/erp/finance/services/chart-of-account-api.service';
import { FiscalSettingsService } from '@applications/erp/shell/fiscal-settings.service';
import { TvaAutoliquidationService } from '@applications/erp/finance/services/tva-autoliquidation.service';
import { FF_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import type { MatchingReception } from '@applications/erp/achats/models';
import { MatchingService } from '@applications/erp/achats/services/matching.service';
import { FfApiService } from '@applications/erp/pages/achats/factures-fournisseur/services/ff-api.service';
import { partnerToComptaFournisseur } from '@applications/erp/pages/achats/factures-fournisseur/services/ff.mapper';
import { PartnersApiService } from '@applications/erp/shared/services/partners-api.service';
import type {
  Compte,
  FactureFournisseur,
  FactureFournLigne,
  FactureFournStatus,
  FactureFournUpdate,
} from '@applications/erp/finance/models';

interface DraftLigne {
  designation: string;
  compteCode: string;
  axeAnalytique?: string;
  quantite: number;
  prixUnitaireHt: number;
  totalHt: number;
  tvaTaux: number;
}

type ComptaFournisseurAlias = ComptaFournisseur;

@Component({
  selector: 'app-ff-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    DateLocalizedPipe,
    PageShellComponent,
    PageHeaderComponent,
    SubmitApprovalButtonComponent,
    ButtonComponent,
    AttachmentListComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell scroll>
      <nf-page-header
        [config]="{
          title: title(),
          subtitle: subtitle(),
          breadcrumbs: [
            { label: t('finance.module.shortTitle'), route: '/finance/journaux' },
            { label: t('finance.factureFournisseur.title'), route: '/finance/factures-fournisseurs' },
            { label: title() }
          ]
        }">
      </nf-page-header>

      @if (loading()) {
        <div class="loading">{{ 'finance.common.labels.loading' | translate }}</div>
      } @else {
        @if (current(); as ff) {
          <section class="approval-bar">
            <span class="approval-bar__label">{{ 'finance.factureFournisseur.sections.approval' | translate }}</span>
            <app-submit-approval-button
              entityType="FF"
              [entityId]="ff.id"
              [entityRef]="ff.numeroInterne"
              [entitySummary]="ff.numeroInterne + ' — ' + (ff.fournisseurName ?? '') + ' — ' + fmt(displayTotals().ttc) + ' ' + t('finance.common.currency.mad')"
              [montantConcerne]="displayTotals().ht"
              [chantierId]="ff.chantierId"
              [disabled]="ff.status !== 'BROUILLON'">
            </app-submit-approval-button>
          </section>
        }
        @if (threeWay(); as tw) {
          <section class="match-card">
            <h3>{{ 'finance.factureFournisseur.matching.title' | translate }}</h3>
            <p class="match-card__meta">
              {{ 'finance.factureFournisseur.matching.bc' | translate }}
              <a [routerLink]="['/achats/commandes', tw.bcId]">{{ tw.bcNumero }}</a>
              — {{ 'finance.factureFournisseur.matching.bl' | translate }}
              @if (tw.receptionId) {
                <a [routerLink]="['/inventory/mouvements/receptions', tw.receptionId]">{{ tw.receptionNumero }}</a>
              } @else { {{ tw.receptionNumero }} }
              <br />
              {{ 'finance.factureFournisseur.matching.status' | translate }} :
              <span class="match-card__status" [class.match-card__status--bloque]="tw.status === 'ECART_BLOQUE'">{{ tw.status }}</span>
              @if (tw.matched3Way) { <span>{{ 'finance.factureFournisseur.matching.aligned' | translate }}</span> }
            </p>
            <table>
              <thead>
                <tr>
                  <th>{{ 'finance.factureFournisseur.matching.headers.article' | translate }}</th>
                  <th class="num">{{ 'finance.factureFournisseur.matching.headers.qteCommandee' | translate }}</th>
                  <th class="num">{{ 'finance.factureFournisseur.matching.headers.qteRecue' | translate }}</th>
                  <th class="num">{{ 'finance.factureFournisseur.matching.headers.qteFacturee' | translate }}</th>
                  <th class="num">{{ 'finance.factureFournisseur.matching.headers.puBc' | translate }}</th>
                  <th class="num">{{ 'finance.factureFournisseur.matching.headers.puFacture' | translate }}</th>
                  <th class="num">{{ 'finance.factureFournisseur.matching.headers.ecartQte' | translate }}</th>
                  <th class="num">{{ 'finance.factureFournisseur.matching.headers.ecartPx' | translate }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (l of tw.lignes; track l.articleId) {
                  <tr>
                    <td>{{ l.articleId }}</td>
                    <td class="num">{{ l.qteCommandee | number:'1.0-2' }}</td>
                    <td class="num">{{ l.qteRecue | number:'1.0-2' }}</td>
                    <td class="num">{{ l.qteFacturee | number:'1.0-2' }}</td>
                    <td class="num">{{ l.pxUnitaireBC | number:'1.0-2' }}</td>
                    <td class="num">{{ l.pxUnitaireFacture | number:'1.0-2' }}</td>
                    <td class="num">{{ l.ecartQte | number:'1.1-1' }}</td>
                    <td class="num">{{ l.ecartPx | number:'1.1-1' }}</td>
                    <td>@if (l.bloquant) { <span class="bloq">{{ 'finance.factureFournisseur.matching.bloquant' | translate }}</span> }</td>
                  </tr>
                }
              </tbody>
            </table>
          </section>
        }
        <section class="card">
          <h3>{{ 'finance.factureFournisseur.sections.identite' | translate }}</h3>
          <div class="grid">
            <label>
              <span>{{ 'finance.factureFournisseur.form.fields.fournisseur' | translate }} *</span>
              <select [ngModel]="fournisseurId()" (ngModelChange)="onFournisseur($event)" [disabled]="!editable()">
                <option value="">{{ 'finance.factureFournisseur.form.fields.fournisseurPlaceholder' | translate }}</option>
                @for (f of fournisseurs(); track f.id) {
                  <option [value]="f.id">{{ f.code }} — {{ f.name }}{{ f.nonResidentMaroc ? ' ' + t('finance.factureFournisseur.hints.fournisseurNonMaroc') : '' }}</option>
                }
              </select>
            </label>
            <label>
              <span>{{ 'finance.factureFournisseur.form.fields.numeroFournisseur' | translate }} *</span>
              <input type="text" [ngModel]="numeroFournisseur()" (ngModelChange)="numeroFournisseur.set($event)" [disabled]="!editable()" />
            </label>
            <label>
              <span>{{ 'finance.factureFournisseur.form.fields.dateFacture' | translate }} *</span>
              <input type="date" [ngModel]="dateFacture()" (ngModelChange)="dateFacture.set($event)" [disabled]="!editable()" />
            </label>
            <label>
              <span>{{ 'finance.factureFournisseur.form.fields.dateReception' | translate }}</span>
              <input type="date" [ngModel]="dateReception()" (ngModelChange)="dateReception.set($event)" [disabled]="!editable()" />
            </label>
            <label>
              <span>{{ 'finance.factureFournisseur.form.fields.dateEcheance' | translate }} *</span>
              <input type="date" [ngModel]="dateEcheance()" (ngModelChange)="dateEcheance.set($event)" [disabled]="!editable()" />
            </label>
            <label>
              <span>{{ 'finance.factureFournisseur.form.fields.bcNumero' | translate }}</span>
              <input type="text" [ngModel]="bcNumero()" (ngModelChange)="bcNumero.set($event)" [attr.placeholder]="'finance.factureFournisseur.form.fields.bcPlaceholder' | translate" [disabled]="!editable()" />
            </label>
            <label>
              <span>{{ 'finance.factureFournisseur.form.fields.chantier' | translate }}</span>
              <input type="text" [ngModel]="chantierName()" (ngModelChange)="chantierName.set($event)" [attr.placeholder]="'finance.factureFournisseur.form.fields.chantierPlaceholder' | translate" [disabled]="!editable()" />
            </label>
            <label>
              <span>{{ 'finance.factureFournisseur.form.fields.rubrique' | translate }}</span>
              <input type="text" [ngModel]="rubrique()" (ngModelChange)="rubrique.set($event)" [disabled]="!editable()" />
            </label>
          </div>
          @if (fournisseurNonResident()) {
            <p class="nr-hint" [innerHTML]="'finance.factureFournisseur.hints.nonResident' | translate"></p>
          } @else if (fournisseurId()) {
            <p class="b2b-hint" [innerHTML]="'finance.factureFournisseur.hints.residentB2b' | translate"></p>
          }
        </section>

        <section class="card">
          <div class="head">
            <h3>{{ 'finance.factureFournisseur.sections.lignes' | translate }}</h3>
            @if (editable()) {
              <nf-button variant="secondary" class="btn-secondary" (clicked)="addLigne()">{{ 'finance.factureFournisseur.lignes.addLigne' | translate }}</nf-button>
            }
          </div>
          <table class="lignes">
            <thead>
              <tr>
                <th>{{ 'finance.factureFournisseur.form.fields.designation' | translate }}</th>
                <th>{{ 'finance.factureFournisseur.form.fields.compte' | translate }}</th>
                <th>{{ 'finance.factureFournisseur.form.fields.axe' | translate }}</th>
                <th class="num">{{ 'finance.factureFournisseur.form.fields.quantite' | translate }}</th>
                <th class="num">{{ 'finance.factureFournisseur.form.fields.prixUnitaireHt' | translate }}</th>
                <th class="num">{{ 'finance.factureFournisseur.form.fields.totalHt' | translate }}</th>
                <th class="num">{{ 'finance.factureFournisseur.form.fields.tvaTaux' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (l of lignes(); track $index; let idx = $index) {
                <tr>
                  <td>
                    <input type="text" [ngModel]="l.designation" (ngModelChange)="updateLigne(idx, { designation: $event })" [disabled]="!editable()" />
                  </td>
                  <td>
                    <input list="comptes-list" [ngModel]="l.compteCode" (ngModelChange)="updateLigne(idx, { compteCode: $event })" [disabled]="!editable()" />
                  </td>
                  <td>
                    <input type="text" [ngModel]="l.axeAnalytique" (ngModelChange)="updateLigne(idx, { axeAnalytique: $event })" [disabled]="!editable()" />
                  </td>
                  <td class="num">
                    <input type="number" step="0.01" [ngModel]="l.quantite" (ngModelChange)="updateLigne(idx, { quantite: $event ?? 1 })" [disabled]="!editable()" />
                  </td>
                  <td class="num">
                    <input type="number" step="0.01" [ngModel]="l.prixUnitaireHt" (ngModelChange)="updateLigne(idx, { prixUnitaireHt: $event ?? 0 })" [disabled]="!editable()" />
                  </td>
                  <td class="num">{{ fmt(l.totalHt) }}</td>
                  <td class="num">
                    <input type="number" step="1" [ngModel]="l.tvaTaux" (ngModelChange)="updateLigne(idx, { tvaTaux: $event ?? 20 })" [disabled]="!editable()" />
                  </td>
                  <td>
                    @if (editable()) {
                      <nf-button variant="primary" class="btn-icon" (clicked)="removeLigne(idx)">×</nf-button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="8" class="empty">{{ 'finance.factureFournisseur.lignes.empty' | translate }}</td></tr>
              }
            </tbody>
          </table>
          <datalist id="comptes-list">
            @for (c of comptes(); track c.code) {
              <option [value]="c.code">{{ c.code }} — {{ c.libelle }}</option>
            }
          </datalist>
        </section>

        <section class="card recap">
          <div class="recap__row"><span>{{ 'finance.factureFournisseur.recap.totalHt' | translate }}</span><strong>{{ fmt(displayTotals().ht) }}</strong></div>
          <div class="recap__row"><span>{{ 'finance.factureFournisseur.recap.tvaFacture' | translate }}</span><strong>{{ fmt(displayTotals().tvaFacture) }}</strong></div>
          @if (displayTotals().tvaAutoliq > 0) {
            <div class="recap__row recap__row--auto"><span>{{ 'finance.factureFournisseur.recap.tvaAutoliq' | translate }}</span><strong>{{ fmt(displayTotals().tvaAutoliq) }}</strong></div>
          }
          @if (displayTotals().retenueTva > 0) {
            <div class="recap__row recap__row--retenue"><span>{{ 'finance.factureFournisseur.recap.retenueTva' | translate }}</span><strong>− {{ fmt(displayTotals().retenueTva) }}</strong></div>
          }
          <div class="recap__row big">
            <span>{{ (displayTotals().mode === 'AUTOLIQUIDATION' ? 'finance.factureFournisseur.recap.netAPayer' : 'finance.factureFournisseur.recap.totalTtc') | translate }}</span>
            <strong>{{ fmt(displayTotals().ttc) }}</strong>
          </div>
          @if (current()?.cumulRegleTtc) {
            <div class="recap__row"><span>{{ 'finance.factureFournisseur.recap.cumulRegle' | translate }}</span><strong>{{ fmt(current()!.cumulRegleTtc) }}</strong></div>
            <div class="recap__row big"><span>{{ 'finance.factureFournisseur.recap.resteARegler' | translate }}</span>
              <strong class="due">{{ fmt(current()!.resteARegler) }}</strong>
            </div>
          }
          @if (current()?.ecritureId) {
            <div class="recap__row link">
              <span>{{ 'finance.factureFournisseur.recap.ecritureComptable' | translate }}</span>
              <a [routerLink]="['/finance/journaux/ecritures', current()!.ecritureId]">
                {{ 'finance.factureFournisseur.recap.voirEcriture' | translate }}
              </a>
            </div>
          }
        </section>

        @if (current(); as ffDgi) {
          <section class="card dgi-links">
            <h3>{{ 'finance.factureFournisseur.sections.dgiLinks' | translate }}</h3>
            <p class="dgi-links__hint" [innerHTML]="'finance.factureFournisseur.hints.dgiHint' | translate"></p>
            <ul class="dgi-links__list">
              <li><a [routerLink]="['/rh/paie/declarations/etat-1208']">{{ 'finance.factureFournisseur.hints.etat1208Link' | translate }}</a> <span class="muted">{{ 'finance.factureFournisseur.hints.etat1208Note' | translate }}</span></li>
              <li><a [routerLink]="['/administration/parametres-fiscal']">{{ 'finance.factureFournisseur.hints.parametresFiscalLink' | translate }}</a> <span class="muted">{{ 'finance.factureFournisseur.hints.parametresFiscalNote' | translate }}</span></li>
            </ul>
          </section>
        }

        @if (current(); as c) {
          <section class="card">
            <h3>{{ 'finance.factureFournisseur.sections.activity' | translate }}</h3>
            <ul class="timeline">
              <li>
                <span class="dot dot--blue"></span>
                <div>
                  <strong>{{ 'finance.factureFournisseur.activity.creation' | translate }}</strong>
                  <span class="muted">{{ c.dateReception | dateLocalized }}</span>
                </div>
              </li>
              @if (c.status !== 'BROUILLON') {
                <li>
                  <span class="dot dot--green"></span>
                  <div>
                    <strong>{{ ('finance.factureFournisseur.activity.validee' | translate).replace('{state}', t(c.ecritureId ? 'finance.factureFournisseur.activity.ecritureGeneree' : 'finance.factureFournisseur.activity.ecritureEnAttente')) }}</strong>
                    <span class="muted">{{ c.dateReception | dateLocalized }}</span>
                  </div>
                </li>
              }
              @if (c.cumulRegleTtc > 0) {
                <li>
                  <span class="dot dot--green"></span>
                  <div>
                    <strong>{{ ('finance.factureFournisseur.activity.reglement' | translate).replace('{state}', t(c.status === 'PAYEE' ? 'finance.factureFournisseur.activity.complet' : 'finance.factureFournisseur.activity.partiel')).replace('{amount}', fmt(c.cumulRegleTtc)) }}</strong>
                  </div>
                </li>
              }
              @if (c.status === 'EN_LITIGE') {
                <li>
                  <span class="dot dot--red"></span>
                  <div>
                    <strong>{{ 'finance.factureFournisseur.activity.enLitige' | translate }}</strong>
                    <span class="muted">{{ c.motifLitige || t('finance.factureFournisseur.activity.motifManquant') }}</span>
                  </div>
                </li>
              }
            </ul>
          </section>
        }
      }

      @if (current(); as ffDoc) {
        <section class="card">
          <nf-attachment-list
            [entityType]="attachmentEntityType"
            [entityId]="ffDoc.id"
            [readonly]="!editable()"
            [attachmentConfig]="attachmentConfig" />
        </section>
      }

      <footer class="actions">
        @if (current(); as c) {
          @if (c.status === 'BROUILLON') {
            <nf-button variant="primary" class="btn-primary" (clicked)="onValider()">{{ 'finance.factureFournisseur.actions.validate' | translate }}</nf-button>
            <nf-button variant="secondary" class="btn-secondary" (clicked)="onSave()">{{ 'finance.factureFournisseur.actions.save' | translate }}</nf-button>
          } @else if (c.status === 'VALIDEE' && !c.ecritureId) {
            <nf-button variant="primary" class="btn-primary" (clicked)="onComptabiliser()">Comptabiliser · génère écriture AC</nf-button>
            <nf-button variant="secondary" class="btn-secondary" (clicked)="onLitige()">{{ 'finance.factureFournisseur.actions.litige' | translate }}</nf-button>
            <nf-button variant="danger" class="btn-danger" (clicked)="onAnnuler()">{{ 'finance.factureFournisseur.actions.annuler' | translate }}</nf-button>
          } @else if (c.status === 'VALIDEE' || c.status === 'COMPTABILISEE' || c.status === 'PARTIELLEMENT_PAYEE') {
            <nf-button variant="secondary" class="btn-secondary" (clicked)="onLitige()">{{ 'finance.factureFournisseur.actions.litige' | translate }}</nf-button>
            <nf-button variant="danger" class="btn-danger" (clicked)="onAnnuler()">{{ 'finance.factureFournisseur.actions.annuler' | translate }}</nf-button>
          }
        } @else {
          <nf-button variant="primary" class="btn-primary" (clicked)="onCreate()">{{ 'finance.factureFournisseur.actions.create' | translate }}</nf-button>
        }
        <a routerLink="/finance/factures-fournisseurs" class="btn-link">{{ 'finance.factureFournisseur.actions.retour' | translate }}</a>
      </footer>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .loading { padding: 32px; text-align: center; color: var(--nf-color-text-muted); }
    .approval-bar {
      display: flex; align-items: center; gap: 1rem;
      padding: 0.75rem 1rem; margin-bottom: 1rem;
      background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 0.5rem;
    }
    .approval-bar__label {
      font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--nf-color-text-secondary);
    }
    .card {
      background: white; border: 1px solid var(--nf-color-border); border-radius: 8px; padding: 16px;
      margin-bottom: 16px;
    }
    .card h3 { margin: 0 0 12px; font-size: 14px; }
    .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .grid label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--nf-color-text-secondary); }
    .grid input, .grid select { padding: 8px 10px; border: 1px solid var(--nf-color-primary-200); border-radius: 6px; font-size: 13px; }
    .lignes { width: 100%; border-collapse: collapse; font-size: 13px; }
    .lignes th { padding: 8px; background: var(--nf-color-bg-subtle); font-weight: 600; color: var(--nf-color-text-secondary); text-align: left; border-bottom: 1px solid var(--nf-color-border); }
    .lignes th.num { text-align: right; }
    .lignes td { padding: 4px; border-bottom: 1px solid var(--nf-color-bg-muted); }
    .lignes input { width: 100%; padding: 6px 8px; border: 1px solid var(--nf-color-border); border-radius: 4px; font-size: 12px; }
    .lignes .num { text-align: right; font-variant-numeric: tabular-nums; }
    .lignes .num input { text-align: right; }
    .btn-icon { background: transparent; border: none; color: var(--nf-color-danger-600); font-size: 16px; cursor: pointer; padding: 4px 8px; }
    .empty { padding: 16px; text-align: center; color: var(--nf-color-text-muted); }
    .recap { display: flex; flex-direction: column; gap: 6px; }
    .recap__row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
    .recap__row.big { font-size: 16px; padding: 8px 0; border-top: 1px solid var(--nf-color-border); margin-top: 4px; }
    .recap__row .due { color: var(--nf-color-warning-700); }
    .recap__row--auto strong { color: var(--nf-color-warning-800); }
    .recap__row--retenue strong { color: var(--nf-color-warning-700); }
    .nr-hint { margin: 12px 0 0; padding: 10px 12px; background: var(--nf-color-warning-50); border: 1px solid var(--nf-color-warning-300); border-radius: 8px; font-size: 13px; color: var(--nf-color-warning-900); line-height: 1.45; }
    .b2b-hint { margin: 12px 0 0; padding: 10px 12px; background: var(--nf-color-success-50); border: 1px solid var(--nf-color-success-300); border-radius: 8px; font-size: 13px; color: var(--nf-color-success-900); line-height: 1.45; }
    .dgi-links h3 { margin: 0 0 8px; font-size: 14px; }
    .dgi-links__hint { margin: 0 0 10px; font-size: 12px; color: var(--nf-color-text-secondary); line-height: 1.45; }
    .dgi-links__list { margin: 0; padding-left: 1.1rem; font-size: 13px; color: var(--nf-color-text-primary); }
    .dgi-links__list li { margin-bottom: 6px; }
    .dgi-links__list a { color: var(--nf-color-primary-700); text-decoration: none; font-weight: 600; }
    .dgi-links__list a:hover { text-decoration: underline; }
    .dgi-links .muted { font-weight: 400; color: var(--nf-color-text-muted); font-size: 12px; }
    .recap__row.link a { color: var(--nf-color-primary-700); text-decoration: none; }
    .timeline { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
    .timeline li { display: flex; gap: 12px; align-items: start; }
    .dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 6px; flex: 0 0 10px; }
    .dot--blue { background: var(--nf-color-primary-700); }
    .dot--green { background: var(--nf-color-success-600); }
    .dot--red { background: var(--nf-color-danger-600); }
    .timeline .muted { display: block; font-size: 11px; color: var(--nf-color-text-secondary); margin-top: 2px; }
    .actions { display: flex; gap: 12px; flex-wrap: wrap; padding: 16px 0; }
    button, .btn-link {
      padding: 8px 14px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;
      font-size: 13px; text-decoration: none;
    }
    .btn-primary { background: var(--nf-color-primary-700); color: white; }
    .btn-secondary { background: var(--nf-color-text-secondary); color: white; }
    .btn-danger { background: var(--nf-color-danger-600); color: white; }
    .btn-link { background: transparent; color: var(--nf-color-primary-700); padding: 8px 14px; }
    .match-card { background: var(--nf-color-warning-50); border: 1px solid var(--nf-color-warning-300); border-radius: 8px; padding: 14px 16px; margin-bottom: 16px; }
    .match-card h3 { margin: 0 0 8px; font-size: 14px; color: var(--nf-color-warning-900); }
    .match-card__meta { font-size: 12px; color: var(--nf-color-warning-800); margin-bottom: 8px; line-height: 1.5; }
    .match-card__status { font-weight: 700; }
    .match-card__status--bloque { color: var(--nf-color-danger-700); }
    .match-card table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    .match-card th, .match-card td { padding: 6px 8px; border-bottom: 1px solid var(--nf-color-warning-200); text-align: left; }
    .match-card th { background: var(--nf-color-warning-50); color: var(--nf-color-warning-900); }
    .match-card .num { text-align: right; font-variant-numeric: tabular-nums; }
    .match-card .bloq { color: var(--nf-color-danger-700); font-weight: 600; }
  `],
})
export class FfDetailPage {
  readonly attachmentEntityType = ERP_ATTACHMENT_ENTITY_TYPES.FF;
  readonly attachmentConfig = DOCUMENT_ATTACHMENT_CONFIG;

  private readonly ffApi = inject(FfApiService);
  private readonly partnersApi = inject(PartnersApiService);
  private readonly chartApi = inject(ChartOfAccountApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly fiscal = inject(FiscalSettingsService);
  private readonly tvaAutoliquidation = inject(TvaAutoliquidationService);
  private readonly matchingSvc = inject(MatchingService);
  private readonly translate = inject(TranslateService);

  readonly fournisseurs = signal<ComptaFournisseurAlias[]>([]);
  readonly comptes = signal<Compte[]>([]);
  readonly current = signal<FactureFournisseur | null>(null);
  readonly loading = signal(true);
  readonly threeWay = signal<MatchingReception | null>(null);

  readonly fournisseurId = signal<string>('');
  readonly numeroFournisseur = signal<string>('');
  readonly dateFacture = signal<string>(new Date().toISOString().slice(0, 10));
  readonly dateReception = signal<string>(new Date().toISOString().slice(0, 10));
  readonly dateEcheance = signal<string>('');
  readonly bcNumero = signal<string>('');
  readonly chantierName = signal<string>('');
  readonly rubrique = signal<string>('');
  readonly lignes = signal<DraftLigne[]>([
    { designation: '', compteCode: '6111', quantite: 1, prixUnitaireHt: 0, totalHt: 0, tvaTaux: 20 },
  ]);

  readonly editable = computed(() => {
    const c = this.current();
    return !c || c.status === 'BROUILLON';
  });

  readonly title = computed(() => {
    const c = this.current();
    if (!c) return this.translate.instant('finance.factureFournisseur.newTitle');
    return `${c.numeroInterne} — ${c.fournisseurName ?? ''}`;
  });

  readonly subtitle = computed(() => {
    const c = this.current();
    if (!c) return this.translate.instant('finance.factureFournisseur.draftSubtitle');
    const statusLabel = this.translate.instant(FF_STATUS_KEYS[c.status] ?? '');
    return `${statusLabel} · ${c.dateFacture}`;
  });

  readonly fournisseurNonResident = computed(() => {
    const id = this.fournisseurId();
    return !!this.fournisseurs().find((x) => x.id === id)?.nonResidentMaroc;
  });

  readonly displayTotals = computed(() => {
    const c = this.current();
    const isDraft = !c || c.status === 'BROUILLON';
    if (!isDraft && c) {
      return {
        ht: c.totalHt,
        tvaFacture: c.totalTva,
        tvaAutoliq: c.tvaAutoliquidationMontant ?? 0,
        retenueTva: c.retenueTvaMontant ?? 0,
        ttc: c.totalTtc,
        mode: (c.tvaFacturationMode ?? 'NORMAL') as 'NORMAL' | 'AUTOLIQUIDATION',
      };
    }
    const lignes = this.lignes();
    const ht = Math.round(lignes.reduce((s, l) => s + (Number(l.totalHt) || 0), 0) * 100) / 100;
    const tvaClassique =
      Math.round(lignes.reduce((s, l) => s + ((Number(l.totalHt) || 0) * (Number(l.tvaTaux) || 0)) / 100, 0) * 100) / 100;
    const f = this.fournisseurs().find((x) => x.id === this.fournisseurId());
    this.fiscal.settings();
    const tauxEquiv = ht > 0 ? Math.round((tvaClassique / ht) * 10000) / 100 : 20;
    const recap = this.tvaAutoliquidation.compute(ht, tauxEquiv, !!f?.nonResidentMaroc, {
      forceTvaClassique: !!f?.desactiveAutoliquidation,
    });
    return {
      ht,
      tvaFacture: recap.tvaSurFacture,
      tvaAutoliq: recap.tvaAutoliquidationDeclaree,
      retenueTva: recap.retenueTvaMontant,
      ttc: recap.netAPayerFournisseur,
      mode: recap.mode,
    };
  });

  constructor() {
    void this.loadLookups();

    this.route.paramMap.subscribe((p) => {
      const id = p.get('id');
      if (!id) {
        this.loading.set(false);
        return;
      }
      void this.loadFacture(id);
    });
  }

  private async loadLookups(): Promise<void> {
    try {
      const res = await this.partnersApi.listByRole('FOURNISSEUR', { page: 0, pageSize: 500 });
      this.fournisseurs.set(
        res.items.map(partnerToComptaFournisseur).filter((f) => f.isActive),
      );
    } catch {
      this.fournisseurs.set([]);
    }

    try {
      const rows = await this.chartApi.listAll();
      this.comptes.set(
        rows
          .filter((x) => x.isActive && (x.classe === 6 || x.classe === 2) && x.code.length >= 4 && !x.isAuxiliaire)
          .sort((a, b) => a.code.localeCompare(b.code)),
      );
    } catch {
      this.comptes.set([]);
    }
  }

  private async loadFacture(id: string): Promise<void> {
    this.loading.set(true);
    this.threeWay.set(null);
    try {
      const f = await this.ffApi.getById(id);
      this.applyFactureToForm(f);
      if (f.bcId) {
        this.matchingSvc.loadMatchingForFacture(f).subscribe((m) => this.threeWay.set(m));
      }
    } catch {
      this.current.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  private applyFactureToForm(f: FactureFournisseur): void {
    this.current.set(f);
    this.fournisseurId.set(f.fournisseurId);
    this.numeroFournisseur.set(f.numeroFournisseur);
    this.dateFacture.set(f.dateFacture);
    this.dateReception.set(f.dateReception);
    this.dateEcheance.set(f.dateEcheance);
    this.bcNumero.set(f.bcNumero ?? '');
    this.chantierName.set(f.chantierName ?? f.chantierId ?? '');
    this.rubrique.set(f.rubrique ?? '');
    this.lignes.set(
      f.lignes.map((l) => ({
        designation: l.designation,
        compteCode: l.compteCode,
        axeAnalytique: l.axeAnalytique,
        quantite: l.quantite ?? 1,
        prixUnitaireHt: l.prixUnitaireHt ?? l.totalHt,
        totalHt: l.totalHt,
        tvaTaux: l.tvaTaux,
      })),
    );
  }

  private buildUpdatePatch(): FactureFournUpdate {
    const f = this.fournisseurs().find((x) => x.id === this.fournisseurId());
    return {
      fournisseurId: this.fournisseurId(),
      fournisseurName: f?.name,
      numeroFournisseur: this.numeroFournisseur(),
      dateFacture: this.dateFacture(),
      dateReception: this.dateReception(),
      dateEcheance: this.dateEcheance(),
      bcNumero: this.bcNumero() || undefined,
      chantierId: this.chantierName() || undefined,
      chantierName: this.chantierName() || undefined,
      rubrique: this.rubrique() || f?.rubrique,
      lignes: this.toLignes(),
    };
  }

  t(key: string): string {
    return this.translate.instant(key);
  }

  onFournisseur(id: string): void {
    this.fournisseurId.set(id);
    const f = this.fournisseurs().find((x) => x.id === id);
    if (f) {
      this.rubrique.set(f.rubrique);
      const updated = [...this.lignes()];
      for (const l of updated) {
        if (!l.compteCode || l.compteCode === '6111') {
          l.compteCode = f.compteCharge;
        }
      }
      this.lignes.set(updated);
    }
  }

  addLigne(): void {
    const f = this.fournisseurs().find((x) => x.id === this.fournisseurId());
    this.lignes.set([
      ...this.lignes(),
      {
        designation: '',
        compteCode: f?.compteCharge ?? '6111',
        quantite: 1,
        prixUnitaireHt: 0,
        totalHt: 0,
        tvaTaux: 20,
      },
    ]);
  }

  removeLigne(idx: number): void {
    this.lignes.set(this.lignes().filter((_, i) => i !== idx));
  }

  updateLigne(idx: number, patch: Partial<DraftLigne>): void {
    const next = [...this.lignes()];
    const current = { ...next[idx], ...patch };
    if (patch.quantite != null || patch.prixUnitaireHt != null) {
      current.totalHt = Math.round(current.quantite * current.prixUnitaireHt * 100) / 100;
    }
    next[idx] = current;
    this.lignes.set(next);
  }

  private toLignes(): FactureFournLigne[] {
    return this.lignes()
      .filter((l) => l.totalHt > 0 || l.designation)
      .map((l, i) => ({
        id: '',
        factureId: '',
        ordre: i + 1,
        designation: l.designation || this.translate.instant('finance.factureFournisseur.lignes.defaultLabel').replace('{n}', String(i + 1)),
        compteCode: l.compteCode,
        axeAnalytique: l.axeAnalytique,
        quantite: l.quantite,
        prixUnitaireHt: l.prixUnitaireHt,
        totalHt: l.totalHt,
        tvaTaux: l.tvaTaux,
      }));
  }

  onCreate(): void {
    const f = this.fournisseurs().find((x) => x.id === this.fournisseurId());
    if (!f || !this.numeroFournisseur() || !this.dateFacture()) {
      this.toast.error(this.translate.instant('finance.factureFournisseur.toasts.missingFields'));
      return;
    }
    void this.ffApi
      .createFromUi({
        fournisseurId: f.id,
        fournisseurName: f.name,
        numeroFournisseur: this.numeroFournisseur(),
        dateFacture: this.dateFacture(),
        dateReception: this.dateReception() || this.dateFacture(),
        dateEcheance: this.dateEcheance() || this.dateFacture(),
        bcNumero: this.bcNumero() || undefined,
        chantierId: this.chantierName() || undefined,
        chantierName: this.chantierName() || undefined,
        rubrique: this.rubrique() || f.rubrique,
        status: 'BROUILLON',
        lignes: this.toLignes(),
      })
      .then((created) => {
        this.toast.success(
          this.translate.instant('finance.factureFournisseur.toasts.created').replace('{numero}', created.numeroInterne),
        );
        void this.router.navigate(['/finance/factures-fournisseurs', created.id]);
      })
      .catch((err: Error) =>
        this.toast.error(err.message ?? this.translate.instant('finance.factureFournisseur.toasts.error')),
      );
  }

  onSave(): void {
    const c = this.current();
    if (!c) {
      this.onCreate();
      return;
    }
    void this.ffApi
      .updateFromUi(c.id, this.buildUpdatePatch(), c)
      .then((updated) => {
        this.applyFactureToForm(updated);
        this.toast.success(this.translate.instant('finance.factureFournisseur.toasts.saved'));
      })
      .catch((err: Error) =>
        this.toast.error(err.message ?? this.translate.instant('finance.factureFournisseur.toasts.error')),
      );
  }

  async onValider(): Promise<void> {
    const c = this.current();
    if (!c) {
      this.onCreate();
      return;
    }
    if (c.bcId) {
      const m = await firstValueFrom(this.matchingSvc.loadMatchingForFacture(c));
      if (m && this.matchingSvc.blocksInvoiceValidation(m)) {
        this.toast.error(
          this.translate.instant('finance.factureFournisseur.matching.blockingError'),
        );
        return;
      }
    }
    try {
      await this.ffApi.updateFromUi(c.id, this.buildUpdatePatch(), c);
      const valid = await this.ffApi.validate(c.id);
      this.applyFactureToForm(valid);
      this.toast.success(this.translate.instant('finance.factureFournisseur.toasts.validated'));
    } catch (err) {
      this.toast.error((err as Error).message ?? this.translate.instant('finance.factureFournisseur.toasts.error'));
    }
  }

  async onComptabiliser(): Promise<void> {
    const c = this.current();
    if (!c) return;
    try {
      const updated = await this.ffApi.comptabiliser(c.id);
      this.applyFactureToForm(updated);
      this.toast.success('Facture comptabilisée — écriture AC générée');
    } catch (err) {
      this.toast.error((err as Error).message ?? this.translate.instant('finance.factureFournisseur.toasts.error'));
    }
  }

  async onLitige(): Promise<void> {
    const c = this.current();
    if (!c) return;
    const result = await this.confirmDialog.prompt({
      title: this.translate.instant('finance.factureFournisseur.prompts.motifLitige'),
      fields: [{
        key: 'motif',
        label: 'finance.factureFournisseur.prompts.motifLitige',
        required: true,
        initial: c.motifLitige ?? '',
      }],
      confirmLabel: 'OK',
      cancelLabel: this.translate.instant('common.actions.cancel'),
    });
    if (!result) return;
    const motif = result['motif'];
    if (!motif?.trim()) return;
    try {
      const updated = await this.ffApi.litige(c.id, motif.trim());
      this.applyFactureToForm(updated);
      this.toast.success(this.translate.instant('finance.factureFournisseur.toasts.litige'));
    } catch (err) {
      this.toast.error((err as Error).message ?? this.translate.instant('finance.factureFournisseur.toasts.error'));
    }
  }

  async onAnnuler(): Promise<void> {
    const c = this.current();
    if (!c) return;
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('finance.factureFournisseur.prompts.confirmAnnulation'),
      message: ' ',
      confirmLabel: this.translate.instant('finance.factureFournisseur.actions.annuler'),
      cancelLabel: this.translate.instant('common.actions.cancel'),
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const updated = await this.ffApi.cancel(c.id);
      this.applyFactureToForm(updated);
      this.toast.success(this.translate.instant('finance.factureFournisseur.toasts.annulee'));
    } catch (err) {
      this.toast.error((err as Error).message ?? this.translate.instant('finance.factureFournisseur.toasts.error'));
    }
  }

  private readonly locale = inject(LOCALE_ID);
  private readonly formatter = new Intl.NumberFormat(this.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  fmt(n?: number): string {
    if (n == null) return '0,00';
    return this.formatter.format(n);
  }
}
