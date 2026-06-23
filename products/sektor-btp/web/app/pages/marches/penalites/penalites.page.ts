import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type { Marche, PenaliteMarche } from '../models';
import { ToastService } from '@lib/anatomy/components/services/toast.service';
import { ContratMarcheApiService } from '../contrats/services/contrat-marche-api.service';
import { PenaliteApiService } from './services/penalite-api.service';

interface PenaliteRow {
  marcheId: string;
  marcheNumero: string;
  chantierCode: string;
  clientNom: string;
  montantMarcheHt: number;
  tauxJourPercent: number;
  dateFinContractuelle: string;
  dateReceptionReelle?: string;
  joursRetard: number;
  montantPenalite: number;
  statut: 'EN_COURS' | 'APPLICABLE' | 'GRACE';
}

const TODAY = '2026-05-10';

function penaliteApiToRow(p: PenaliteMarche, marche?: Marche): PenaliteRow {
  const statut: PenaliteRow['statut'] =
    p.status === 'VALIDEE' ? 'APPLICABLE'
      : p.status === 'ANNULEE' ? 'GRACE'
        : 'EN_COURS';
  let dateFinContractuelle = '—';
  let dateReceptionReelle: string | undefined;
  let tauxJourPercent = 0;
  let montantMarcheHt = 0;
  if (marche) {
    const os = new Date(marche.dateOrdreService ?? TODAY);
    os.setMonth(os.getMonth() + marche.delaiExecutionMois);
    dateFinContractuelle = os.toISOString().slice(0, 10);
    dateReceptionReelle = marche.dateReceptionProvisoire ?? marche.dateReceptionDefinitive;
    tauxJourPercent = marche.penaliteRetardJourPercent ?? 0;
    montantMarcheHt = marche.montantTotalHt;
  }
  return {
    marcheId: p.marcheId,
    marcheNumero: p.marcheNumero,
    chantierCode: marche?.chantierCode ?? '—',
    clientNom: marche?.clientNom ?? '—',
    montantMarcheHt,
    tauxJourPercent,
    dateFinContractuelle,
    dateReceptionReelle,
    joursRetard: p.joursRetard,
    montantPenalite: p.montantHt,
    statut,
  };
}

@Component({
  selector: 'app-penalites',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe, TranslateModule],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="{
        title: 'marches.penalites.title' | translate,
        subtitle: 'marches.penalites.subtitle' | translate,
        breadcrumbs: [{ label: ('marches.module.title' | translate) }, { label: ('marches.penalites.breadcrumb' | translate) }]
      }"></nf-page-header>

      <div class="summary-bar">
        <div class="sum-item">
          <span>{{ 'marches.penalites.summary.enRetard' | translate }}</span>
          <strong class="danger">{{ enRetard().length }}</strong>
        </div>
        <div class="sum-item">
          <span>{{ 'marches.penalites.summary.totalPenalites' | translate }}</span>
          <strong>{{ totalPenalites() | mad }}</strong>
        </div>
        <div class="sum-item">
          <span>{{ 'marches.penalites.summary.totalApplicables' | translate }}</span>
          <strong class="danger">{{ totalApplicables() | mad }}</strong>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>{{ 'marches.penalites.columns.marche' | translate }}</th>
            <th>{{ 'marches.penalites.columns.chantier' | translate }}</th>
            <th>{{ 'marches.penalites.columns.client' | translate }}</th>
            <th class="num">{{ 'marches.penalites.columns.montantMarcheHt' | translate }}</th>
            <th>{{ 'marches.penalites.columns.tauxJour' | translate }}</th>
            <th>{{ 'marches.penalites.columns.finContractuelle' | translate }}</th>
            <th>{{ 'marches.penalites.columns.finReelle' | translate }}</th>
            <th class="num">{{ 'marches.penalites.columns.joursRetard' | translate }}</th>
            <th class="num">{{ 'marches.penalites.columns.penalite' | translate }}</th>
            <th>{{ 'marches.penalites.columns.statut' | translate }}</th>
          </tr></thead>
          <tbody>
            @for (r of rows(); track r.marcheId + r.montantPenalite) {
              <tr [class.row--retard]="r.joursRetard > 0">
                <td><strong class="code">{{ r.marcheNumero }}</strong></td>
                <td>{{ r.chantierCode }}</td>
                <td class="client">{{ r.clientNom }}</td>
                <td class="num">{{ r.montantMarcheHt | mad }}</td>
                <td>{{ r.tauxJourPercent ? ('marches.penalites.tauxJourSuffix' | translate:{ rate: r.tauxJourPercent }) : '—' }}</td>
                <td class="date">{{ r.dateFinContractuelle !== '—' ? (r.dateFinContractuelle | date:'dd/MM/yyyy') : '—' }}</td>
                <td class="date">{{ r.dateReceptionReelle ? (r.dateReceptionReelle | date:'dd/MM/yyyy') : ('marches.penalites.finReelleEnCours' | translate) }}</td>
                <td class="num" [class.danger]="r.joursRetard > 0">{{ r.joursRetard }}</td>
                <td class="num" [class.danger]="r.montantPenalite > 0">{{ r.montantPenalite > 0 ? (r.montantPenalite | mad) : '—' }}</td>
                <td>
                  @switch (r.statut) {
                    @case ('APPLICABLE') { <span class="badge badge--danger">{{ 'marches.penalites.statuses.applicable' | translate }}</span> }
                    @case ('EN_COURS') { <span class="badge badge--warning">{{ 'marches.penalites.statuses.enCours' | translate }}</span> }
                    @default { <span class="badge badge--secondary">{{ 'marches.penalites.statuses.grace' | translate }}</span> }
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="10" class="empty">{{ 'marches.penalites.empty' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>

      <p class="note">{{ 'marches.penalites.note' | translate }}</p>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .summary-bar { display: flex; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .sum-item { padding: 0.875rem 1.1rem; background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0.875rem; min-width: 180px; }
    .sum-item span { display: block; font-size: 0.72rem; color: var(--nf-color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.2rem; }
    .sum-item strong { font-size: 1.1rem; font-weight: 700; color: var(--nf-color-text-primary); }
    .sum-item strong.danger { color: var(--nf-color-danger-600); }
    .table-wrap { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; max-height: calc(100vh - 380px); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { position: sticky; top: 0; padding: 9px 12px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-border); white-space: nowrap; z-index: 1; }
    th.num { text-align: right; }
    td { padding: 8px 12px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.date { white-space: nowrap; font-size: 12px; color: var(--nf-color-text-secondary); }
    td.client { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .code { color: var(--nf-color-primary-700); }
    .danger { color: var(--nf-color-danger-600); font-weight: 600; }
    .row--retard { background: var(--nf-color-danger-50); }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge--danger { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .badge--warning { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .badge--secondary { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }
    .empty { text-align: center; padding: 2rem; color: var(--nf-color-text-muted); }
    .note { font-size: 11px; color: var(--nf-color-text-muted); margin-top: 0.75rem; line-height: 1.6; }
  `],
})
export class PenalitesPage implements OnInit {
  private readonly api = inject(PenaliteApiService);
  private readonly contratApi = inject(ContratMarcheApiService);
  private readonly toast = inject(ToastService);

  readonly rowData = signal<PenaliteRow[]>([]);

  ngOnInit(): void {
    void this.loadRows();
  }

  private async loadRows(): Promise<void> {
    try {
      const [penalitesRes, contratsRes] = await Promise.all([
        this.api.getAll(),
        this.contratApi.getAll(),
      ]);
      const marcheById = new Map(contratsRes.items.map(m => [m.id, m]));
      const mapped = penalitesRes.items.map(p =>
        penaliteApiToRow(p, marcheById.get(p.marcheId)),
      );
      this.rowData.set(mapped.sort((a, b) => b.joursRetard - a.joursRetard));
    } catch {
      this.rowData.set([]);
      this.toast.error('Impossible de charger les pénalités de retard.');
    }
  }

  readonly rows = computed(() => this.rowData());

  readonly enRetard = computed(() => this.rows().filter(r => r.joursRetard > 0));
  readonly totalPenalites = computed(() => this.rows().reduce((s, r) => s + r.montantPenalite, 0));
  readonly totalApplicables = computed(() => this.rows().filter(r => r.statut === 'APPLICABLE').reduce((s, r) => s + r.montantPenalite, 0));
}
