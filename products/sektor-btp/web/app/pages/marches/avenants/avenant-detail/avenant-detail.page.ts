import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';
import { map } from 'rxjs';

import { PageHeaderComponent, PageShellComponent, ConfirmDialogService } from '@lib/anatomy';
import { ButtonComponent } from '@lib/anatomy/components';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { SubmitApprovalButtonComponent } from '@applications/erp/pages/approbations/components/submit-approval-button/submit-approval-button.component';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';
import { AVENANT_STATUS_KEYS, AVENANT_TYPE_KEYS } from '@applications/erp/shell/i18n-labels';
import {
  type Avenant,
  type AvenantStatus,
  type Marche,
} from '../../models';
import { ToastService } from '@lib/anatomy/components/services/toast.service';
import { AvenantApiService } from '../services/avenant-api.service';
import { ContratMarcheApiService } from '../../contrats/services/contrat-marche-api.service';

const STATUS_VARIANT: Record<AvenantStatus, string> = {
  BROUILLON: 'secondary',
  PROPOSE: 'warning',
  SIGNE: 'success',
  REJETE: 'danger',
};

@Component({
  selector: 'app-avenant-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    PageShellComponent,
    PageHeaderComponent,
    ButtonComponent,
    MadCurrencyPipe,
    SubmitApprovalButtonComponent,
    TranslateModule,
  ],
  template: `
    <nf-page-shell scroll>
      @if (avenant(); as a) {
        <nf-page-header [config]="{
          title: a.numero,
          subtitle: a.objet,
          breadcrumbs: [
            { label: ('marches.module.title' | translate) },
            { label: ('marches.avenant.listing.breadcrumb' | translate), route: '/marches/avenants' },
            { label: a.numero }
          ]
        }"></nf-page-header>

        <section class="approval-bar">
          <span class="approval-bar__label">{{ 'marches.avenant.detail.approval.label' | translate }}</span>
          <app-submit-approval-button
            entityType="AVN"
            [entityId]="a.id"
            [entityRef]="a.numero"
            [entitySummary]="approvalSummary(a)"
            [montantConcerne]="Math.abs(a.montantHt)"
            [chantierId]="marche()?.chantierId"
            [chantierCode]="marche()?.chantierCode"
            [disabled]="a.status === 'SIGNE' || a.status === 'REJETE'">
          </app-submit-approval-button>
        </section>

        @if (a.status === 'SIGNE' && !a.impactPropageLe) {
          <section class="propagate-bar">
            <div>
              <strong>{{ 'marches.avenant.detail.propagate.title' | translate }}</strong>
              <p class="propagate-bar__hint">{{ 'marches.avenant.detail.propagate.hint' | translate }}</p>
            </div>
            <nf-button variant="primary" icon="refresh-cw" (clicked)="onPropagateImpact(a)">{{ 'marches.avenant.detail.propagate.cta' | translate }}</nf-button>
          </section>
        }
        @if (a.status === 'SIGNE' && a.impactPropageLe) {
          <p class="propagate-done">{{ 'marches.avenant.detail.propagate.done' | translate:{ date: (a.impactPropageLe | date:'dd/MM/yyyy HH:mm') } }}</p>
        }

        <div class="grid">
          <article class="card">
            <h2>{{ 'marches.avenant.detail.sections.identite.title' | translate }}</h2>
            <dl>
              <dt>{{ 'marches.avenant.detail.sections.identite.marche' | translate }}</dt>
              <dd>
                <a [routerLink]="['/marches/contrats', a.marcheId]" class="link">{{ a.marcheNumero }}</a>
                @if (marche(); as m) {
                  <span class="muted"> · {{ m.intitule }}</span>
                }
              </dd>
              <dt>{{ 'marches.avenant.detail.sections.identite.chantier' | translate }}</dt>
              <dd>
                @if (marche(); as m) {
                  <a [routerLink]="['/chantiers', m.chantierId]" class="link">{{ m.chantierCode }}</a>
                  <span class="muted"> — {{ m.chantierNom }}</span>
                } @else {
                  —
                }
              </dd>
              <dt>{{ 'marches.avenant.detail.sections.identite.type' | translate }}</dt>
              <dd>{{ AVENANT_TYPE_KEYS[a.type] | translate }}</dd>
              <dt>{{ 'marches.avenant.detail.sections.identite.statut' | translate }}</dt>
              <dd>
                <span class="badge badge--{{ statusVariant(a.status) }}">{{ AVENANT_STATUS_KEYS[a.status] | translate }}</span>
              </dd>
            </dl>
          </article>

          <article class="card">
            <h2>{{ 'marches.avenant.detail.sections.montants.title' | translate }}</h2>
            <dl>
              <dt>{{ 'marches.avenant.detail.sections.montants.impactHt' | translate }}</dt>
              <dd [class.positive]="a.montantHt > 0" [class.negative]="a.montantHt < 0">
                @if (a.montantHt !== 0) {
                  {{ a.montantHt > 0 ? '+' : '' }}{{ a.montantHt | mad }}
                } @else {
                  —
                }
              </dd>
              <dt>{{ 'marches.avenant.detail.sections.montants.prolongation' | translate }}</dt>
              <dd>{{ a.prolongationJours > 0 ? ('marches.avenant.detail.prolongationJours' | translate:{ count: a.prolongationJours }) : '—' }}</dd>
              <dt>{{ 'marches.avenant.detail.sections.montants.dateSignature' | translate }}</dt>
              <dd>{{ (a.dateSignature ?? '—') | date:'dd/MM/yyyy' }}</dd>
            </dl>
          </article>

          <article class="card card--full">
            <h2>{{ 'marches.avenant.detail.sections.motif.title' | translate }}</h2>
            <p class="motif">{{ a.motif }}</p>
          </article>
        </div>
      } @else {
        <nf-page-header [config]="{
          title: ('marches.avenant.detail.empty.title' | translate),
          breadcrumbs: [{ label: ('marches.module.title' | translate) }, { label: ('marches.avenant.listing.breadcrumb' | translate), route: '/marches/avenants' }]
        }"></nf-page-header>
        <p class="empty"><a routerLink="/marches/avenants">{{ 'marches.avenant.detail.empty.backLink' | translate }}</a></p>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .approval-bar {
      display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
      margin-bottom: 1.25rem; padding: 0.75rem 1rem;
      background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 0.5rem;
    }
    .approval-bar__label { font-size: 0.8rem; font-weight: 600; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
    .propagate-bar {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
      margin-bottom: 1.25rem; padding: 0.85rem 1rem;
      background: var(--nf-color-success-50); border: 1px solid var(--nf-color-success-200); border-radius: 0.5rem;
    }
    .propagate-bar__hint { margin: 0.35rem 0 0; font-size: 0.82rem; color: var(--nf-color-success-700); max-width: 52rem; line-height: 1.45; }
    .propagate-done { margin: 0 0 1rem; font-size: 0.85rem; color: var(--nf-color-success-700); font-weight: 500; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
    .card { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; padding: 1rem 1.25rem; }
    .card--full { grid-column: 1 / -1; }
    .card h2 { margin: 0 0 0.75rem; font-size: 0.85rem; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
    dl { margin: 0; display: grid; grid-template-columns: 120px 1fr; gap: 0.35rem 1rem; font-size: 0.9rem; }
    dt { color: var(--nf-color-text-muted); }
    dd { margin: 0; color: var(--nf-color-text-primary); }
    .muted { color: var(--nf-color-text-secondary); font-size: 0.85rem; }
    .link { color: var(--nf-color-primary-500); font-weight: 600; text-decoration: none; }
    .link:hover { text-decoration: underline; }
    .motif { margin: 0; line-height: 1.5; color: var(--nf-color-text-primary); }
    .positive { color: var(--nf-color-success-700); font-weight: 600; }
    .negative { color: var(--nf-color-danger-700); font-weight: 600; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge--secondary { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }
    .badge--warning { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .badge--success { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .badge--danger { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .empty { padding: 2rem; text-align: center; }
  `],
})
export class AvenantDetailPage implements OnInit {
  protected readonly Math = Math;
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AvenantApiService);
  private readonly contratApi = inject(ContratMarcheApiService);
  private readonly toast = inject(ToastService);
  private readonly audit = inject(ErpAuditService);
  private readonly translate = inject(TranslateService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly AVENANT_STATUS_KEYS = AVENANT_STATUS_KEYS;
  readonly AVENANT_TYPE_KEYS = AVENANT_TYPE_KEYS;

  private readonly avenantId = toSignal(
    this.route.paramMap.pipe(map(p => p.get('avenantId') ?? '')),
    { initialValue: '' },
  );

  readonly avenant = signal<Avenant | undefined>(undefined);
  readonly marche = signal<Marche | undefined>(undefined);

  ngOnInit(): void {
    void this.loadDetail();
  }

  private async loadDetail(): Promise<void> {
    const id = this.avenantId();
    if (!id) return;
    try {
      const a = await this.api.getById(id);
      this.avenant.set(a);
      try {
        this.marche.set(await this.contratApi.getById(a.marcheId));
      } catch {
        this.marche.set(undefined);
      }
    } catch {
      this.avenant.set(undefined);
      this.marche.set(undefined);
      this.toast.error('Impossible de charger l\'avenant.');
    }
  }

  statusVariant(s: AvenantStatus): string {
    return STATUS_VARIANT[s] ?? 'secondary';
  }

  approvalSummary(a: Avenant): string {
    const ht = new Intl.NumberFormat(resolveLocale(this.translate), { maximumFractionDigits: 0 }).format(a.montantHt);
    return `${a.numero} — ${a.marcheNumero} — ${ht} MAD HT`;
  }

  async onPropagateImpact(a: Avenant): Promise<void> {
    const m = this.marche();
    const sign = a.montantHt >= 0 ? '+' : '';
    const lang = resolveLocale(this.translate);
    const recap = [
      this.translate.instant('marches.avenant.detail.messages.impactBudget', {
        code: m?.chantierCode ?? '',
        sign,
        amount: a.montantHt.toLocaleString(lang),
      }),
      a.prolongationJours
        ? this.translate.instant('marches.avenant.detail.messages.impactFin', { days: a.prolongationJours })
        : this.translate.instant('marches.avenant.detail.messages.impactFinUnchanged'),
      this.translate.instant('marches.avenant.detail.messages.impactCautions'),
    ].join('\n');
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('marches.avenant.detail.propagate.cta'),
      message: this.translate.instant('marches.avenant.detail.messages.confirmPropagate', { recap }),
      confirmLabel: this.translate.instant('marches.avenant.detail.propagate.cta'),
      cancelLabel: this.translate.instant('common.actions.cancel'),
      icon: 'sync_alt',
    });
    if (!confirmed) {
      return;
    }
    try {
      const updated = await this.api.propagerImpact(a.id);
      this.avenant.set(updated);
      try {
        this.marche.set(await this.contratApi.getById(a.marcheId));
      } catch {
        /* contrat refresh optional */
      }
      this.audit.log(
        'UPDATE',
        'AVENANT',
        a.id,
        a.numero,
        `Propagation impact — Δ ${a.montantHt.toLocaleString('fr-MA')} MAD HT, +${a.prolongationJours} j`,
      );
    } catch {
      this.toast.error(this.translate.instant('marches.avenant.detail.messages.failPropagate'));
    }
  }
}
