import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import {
  ORDRE_SERVICE_STATUS_KEYS,
  ORDRE_SERVICE_TYPE_KEYS,
} from '@applications/erp/shell/i18n-labels';
import {
  type OrdreService,
  type OrdreServiceStatus,
  type OrdreServiceType,
} from '../models';
import { ToastService } from '@lib/anatomy/components/services/toast.service';
import { OsApiService } from './services/os-api.service';

const STATUS_VARIANT: Record<OrdreServiceStatus, string> = {
  EMIS: 'info',
  RECEPTIONNE: 'success',
  CONTESTE: 'danger',
  CLOS: 'secondary',
};

import { SubmitApprovalButtonComponent } from '@applications/erp/pages/approbations/components/submit-approval-button/submit-approval-button.component';

@Component({
  selector: 'app-os-listing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, PageShellComponent, PageHeaderComponent, SubmitApprovalButtonComponent, TranslateModule],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="{
        title: 'marches.ordreService.title' | translate,
        subtitle: 'marches.ordreService.subtitle' | translate,
        breadcrumbs: [{ label: ('marches.module.title' | translate) }, { label: ('marches.ordreService.breadcrumb' | translate) }]
      }"></nf-page-header>

      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>{{ 'marches.ordreService.columns.numero' | translate }}</th>
            <th>{{ 'marches.ordreService.columns.marche' | translate }}</th>
            <th>{{ 'marches.ordreService.columns.chantier' | translate }}</th>
            <th>{{ 'marches.ordreService.columns.type' | translate }}</th>
            <th>{{ 'marches.ordreService.columns.emetteur' | translate }}</th>
            <th>{{ 'marches.ordreService.columns.objet' | translate }}</th>
            <th class="num">{{ 'marches.ordreService.columns.deltaDelai' | translate }}</th>
            <th>{{ 'marches.ordreService.columns.statut' | translate }}</th>
            <th>{{ 'marches.ordreService.columns.approbation' | translate }}</th>
          </tr></thead>
          <tbody>
            @for (o of rows(); track o.id) {
              <tr>
                <td><strong class="code">{{ o.numero }}</strong></td>
                <td><a class="link" [routerLink]="['/marches/contrats', o.marcheId]">{{ o.marcheId }}</a></td>
                <td>{{ o.chantierCode }}</td>
                <td>{{ typeKey(o.type) | translate }}</td>
                <td>{{ ('marches.common.emetteur.' + o.emetteur) | translate }}</td>
                <td class="obj">{{ o.objet }}</td>
                <td class="num">{{ o.impactDelai ?? '—' }}</td>
                <td><span class="badge badge--{{ statusVariant(o.status) }}">{{ statusKey(o.status) | translate }}</span></td>
                <td class="os-apr">
                  <app-submit-approval-button
                    entityType="OS"
                    [entityId]="o.id"
                    [entityRef]="o.numero"
                    [entitySummary]="o.numero + ' — ' + o.objet + ' — ' + o.chantierCode"
                    [montantConcerne]="o.impactCout || 0"
                    [chantierId]="o.chantierId"
                    [chantierCode]="o.chantierCode"
                    [disabled]="o.status === 'CLOS'">
                  </app-submit-approval-button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="9" class="empty">{{ 'marches.ordreService.empty' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>

      <p class="note">{{ 'marches.ordreService.note' | translate }}</p>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .table-wrap { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; max-height: calc(100vh - 280px); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { position: sticky; top: 0; padding: 10px 12px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-border); z-index: 1; }
    th.num { text-align: right; }
    td.os-apr { white-space: nowrap; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.obj { max-width: 220px; }
    .code { color: var(--nf-color-primary-700); }
    .link { color: var(--nf-color-primary-600); font-weight: 600; text-decoration: none; }
    .link:hover { text-decoration: underline; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap; }
    .badge--info { background: var(--nf-color-primary-100); color: var(--nf-color-primary-700); }
    .badge--success { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .badge--danger { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .badge--secondary { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }
    .empty { text-align: center; padding: 2rem; color: var(--nf-color-text-muted); }
    .note { margin-top: 1rem; font-size: 0.82rem; color: var(--nf-color-text-secondary); max-width: 720px; line-height: 1.5; }
  `],
})
export class OsListingPage implements OnInit {
  private readonly api = inject(OsApiService);
  private readonly toast = inject(ToastService);

  readonly ordres = signal<OrdreService[]>([]);

  ngOnInit(): void {
    void this.loadOrdres();
  }

  private async loadOrdres(): Promise<void> {
    try {
      const res = await this.api.getAll();
      this.ordres.set(res.items);
    } catch {
      this.ordres.set([]);
      this.toast.error('Impossible de charger les ordres de service.');
    }
  }

  readonly rows = computed(() => this.ordres());

  typeKey(t: OrdreServiceType): string {
    return ORDRE_SERVICE_TYPE_KEYS[t] ?? t;
  }

  statusKey(s: OrdreServiceStatus): string {
    return ORDRE_SERVICE_STATUS_KEYS[s] ?? s;
  }

  statusVariant(s: OrdreServiceStatus): string {
    return STATUS_VARIANT[s] ?? 'secondary';
  }
}
