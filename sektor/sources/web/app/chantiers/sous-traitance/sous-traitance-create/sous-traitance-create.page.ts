import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ButtonComponent,
  LOOKUP_SEARCHERS,
  NfSelectComponent,
  PageHeaderComponent,
  PageShellComponent,
  ToastService,
  type LookupSearchFn,
} from '@platform/lib/anatomy';
import { ChantierApiService } from '../../services/chantier-api.service';
import { BudgetApiService } from '../../budget/services/budget-api.service';
import type { BudgetNoeud } from '../../budget/models';
import { SousTraitanceApiService } from '../services/sous-traitance-api.service';

function flattenPostesVendus(nodes: BudgetNoeud[] | undefined): BudgetNoeud[] {
  const out: BudgetNoeud[] = [];
  for (const node of nodes ?? []) {
    if (node.type === 'POSTE' && node.nature !== 'INTERNE') out.push(node);
    out.push(...flattenPostesVendus(node.enfants));
  }
  return out;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addMonthsIso(from: string, months: number): string {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-sous-traitance-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageShellComponent,
    PageHeaderComponent,
    ButtonComponent,
    NfSelectComponent,
    TranslateModule,
  ],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig"></nf-page-header>

      <div class="panel">
        <label>{{ 'chantiers.sousTraitance.create.fields.chantier' | translate }}</label>
        <nf-select
          lookupKey="chantiers"
          [lookupSearch]="searchChantiers"
          [(ngModel)]="draft.chantierId"
          name="chantierId"
          [disabled]="!!routeChantierId"
          [selectedLabel]="chantierSelectedLabel()"
          [placeholder]="'chantiers.sousTraitance.create.fields.chantierPlaceholder' | translate"
          (ngModelChange)="onChantierChange($event)"
        />

        <label>{{ 'chantiers.sousTraitance.create.fields.noeud' | translate }}</label>
        <select class="fld" [(ngModel)]="draft.noeudId" name="noeudId" required>
          <option value="">{{ 'chantiers.sousTraitance.create.fields.noeudPlaceholder' | translate }}</option>
          @for (n of postes(); track n.id) {
            <option [value]="n.id">{{ n.code }} — {{ n.designation }}</option>
          }
        </select>

        <label>{{ 'chantiers.sousTraitance.create.fields.sousTraitant' | translate }}</label>
        <nf-select
          lookupKey="fournisseurs"
          [lookupSearch]="searchFournisseurs"
          [(ngModel)]="draft.sousTraitantId"
          name="sousTraitantId"
          [selectedLabel]="fournisseurSelectedLabel()"
          [placeholder]="'chantiers.sousTraitance.create.fields.sousTraitant' | translate"
          (ngModelChange)="onFournisseurChange($event)"
        />

        <label>{{ 'chantiers.sousTraitance.create.fields.objet' | translate }}</label>
        <input class="fld" type="text" [(ngModel)]="draft.objet" name="objet" required />

        <label>{{ 'chantiers.sousTraitance.create.fields.montantHt' | translate }}</label>
        <input class="fld" type="number" min="0" step="0.01" [(ngModel)]="draft.montantHt" name="montantHt" required />

        <label>{{ 'chantiers.sousTraitance.create.fields.bpu' | translate }}</label>
        <input class="fld" type="text" [(ngModel)]="draft.bpuFichier" name="bpuFichier"
          [placeholder]="'chantiers.sousTraitance.create.fields.bpuPlaceholder' | translate" />

        <div class="row">
          <div>
            <label>{{ 'chantiers.sousTraitance.create.fields.dateDebut' | translate }}</label>
            <input class="fld" type="date" [(ngModel)]="draft.dateDebut" name="dateDebut" required />
          </div>
          <div>
            <label>{{ 'chantiers.sousTraitance.create.fields.dateFin' | translate }}</label>
            <input class="fld" type="date" [(ngModel)]="draft.dateFin" name="dateFin" required />
          </div>
        </div>

        <div class="actions">
          <nf-button variant="secondary" (clicked)="cancel()">
            {{ 'chantiers.common.actions.cancel' | translate }}
          </nf-button>
          <nf-button variant="primary" [disabled]="saving()" (clicked)="submit()">
            {{ 'chantiers.sousTraitance.create.submit' | translate }}
          </nf-button>
        </div>
      </div>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .panel {
      max-width: 520px; background: var(--nf-color-surface); border: 1px solid var(--nf-color-border);
      border-radius: 0.75rem; padding: 1.25rem; display: grid; gap: 0.5rem;
    }
    label { font-size: 0.8rem; font-weight: 600; color: var(--nf-color-text-secondary); }
    .fld { width: 100%; padding: 7px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 0.75rem; }
  `],
})
export class SousTraitanceCreatePage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly budgetApi = inject(BudgetApiService);
  private readonly api = inject(SousTraitanceApiService);
  private readonly toast = inject(ToastService);
  private readonly lookupSearchers = inject(LOOKUP_SEARCHERS, { optional: true });

  private chantierHits: Array<{ value: string; label: string }> = [];
  private fournisseurHits: Array<{ value: string; label: string }> = [];

  readonly postes = signal<BudgetNoeud[]>([]);
  readonly saving = signal(false);
  readonly chantierSelectedLabel = signal('');
  readonly fournisseurSelectedLabel = signal('');
  routeChantierId = '';

  draft = {
    chantierId: '',
    noeudId: '',
    sousTraitantId: '',
    sousTraitantNom: '',
    objet: '',
    montantHt: 0,
    bpuFichier: '',
    dateDebut: todayIso(),
    dateFin: addMonthsIso(todayIso(), 3),
  };

  readonly headerConfig = {
    title: this.translate.instant('chantiers.sousTraitance.create.title'),
    subtitle: this.translate.instant('chantiers.sousTraitance.create.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('chantiers.routes.chantiersCrumb'), route: '/chantiers' },
      { label: this.translate.instant('chantiers.routes.sousTraitanceCrumb'), route: '/chantiers/sous-traitance' },
      { label: this.translate.instant('chantiers.sousTraitance.create.breadcrumb') },
    ],
  };

  readonly searchChantiers: LookupSearchFn = async (q) => {
    const hits = await (this.lookupSearchers?.['chantiers']?.(q) ?? Promise.resolve([]));
    this.chantierHits = hits;
    return hits;
  };

  readonly searchFournisseurs: LookupSearchFn = async (q) => {
    const hits = await (this.lookupSearchers?.['fournisseurs']?.(q) ?? Promise.resolve([]));
    this.fournisseurHits = hits;
    return hits;
  };

  ngOnInit(): void {
    const fromRoute = this.route.snapshot.queryParamMap.get('chantierId')?.trim() ?? '';
    const noeudFromRoute = this.route.snapshot.queryParamMap.get('noeudId')?.trim() ?? '';
    if (fromRoute) {
      this.routeChantierId = fromRoute;
      this.draft.chantierId = fromRoute;
      this.draft.noeudId = noeudFromRoute;
      void this.resolveChantierLabel(fromRoute);
      void this.loadPostes(fromRoute);
    }
  }

  onChantierChange(chantierId: string): void {
    this.draft.chantierId = chantierId ?? '';
    this.draft.noeudId = '';
    const hit = this.chantierHits.find((h) => h.value === chantierId);
    if (hit) this.chantierSelectedLabel.set(hit.label);
    else if (chantierId) void this.resolveChantierLabel(chantierId);
    else this.chantierSelectedLabel.set('');
    void this.loadPostes(chantierId);
  }

  onFournisseurChange(fournisseurId: string): void {
    this.draft.sousTraitantId = fournisseurId ?? '';
    const hit = this.fournisseurHits.find((h) => h.value === fournisseurId);
    if (hit) {
      this.fournisseurSelectedLabel.set(hit.label);
      this.draft.sousTraitantNom = hit.label;
    } else if (!fournisseurId) {
      this.fournisseurSelectedLabel.set('');
      this.draft.sousTraitantNom = '';
    }
  }

  private async resolveChantierLabel(id: string): Promise<void> {
    try {
      const c = await this.chantierApi.getById(id);
      this.chantierSelectedLabel.set(`${c.code} — ${c.name}`);
    } catch {
      this.chantierSelectedLabel.set(id);
    }
  }

  private async loadPostes(chantierId: string): Promise<void> {
    if (!chantierId) {
      this.postes.set([]);
      return;
    }
    try {
      const arbre = await this.budgetApi.getArbre(chantierId);
      this.postes.set(flattenPostesVendus(arbre?.lots));
    } catch {
      this.postes.set([]);
    }
  }

  cancel(): void {
    void this.router.navigate(['/chantiers/sous-traitance']);
  }

  async submit(): Promise<void> {
    const {
      chantierId,
      noeudId,
      sousTraitantId,
      sousTraitantNom,
      objet,
      montantHt,
      bpuFichier,
      dateDebut,
      dateFin,
    } = this.draft;
    if (!chantierId || !noeudId || !sousTraitantId.trim() || !objet.trim() || montantHt <= 0) {
      this.toast.error(this.translate.instant('chantiers.sousTraitance.create.errors.required'));
      return;
    }
    this.saving.set(true);
    try {
      await this.api.createForChantier(chantierId, {
        sousTraitantId: sousTraitantId.trim(),
        sousTraitantNom: (sousTraitantNom || this.fournisseurSelectedLabel()).trim() || sousTraitantId.trim(),
        objet: objet.trim(),
        montantHt,
        retenueGarantieTaux: 7,
        dateDebut,
        dateFin,
        status: 'BROUILLON',
        declarationArt187: false,
        noeudId,
        bpuFichier: bpuFichier.trim() || undefined,
      });
      this.toast.success(this.translate.instant('chantiers.sousTraitance.create.success'));
      void this.router.navigate(['/chantiers/sous-traitance']);
    } catch {
      this.toast.error(this.translate.instant('chantiers.sousTraitance.create.errors.failed'));
    } finally {
      this.saving.set(false);
    }
  }
}
