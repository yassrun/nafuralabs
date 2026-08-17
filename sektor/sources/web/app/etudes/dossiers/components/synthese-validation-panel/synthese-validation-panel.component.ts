import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { MadCurrencyPipe } from '@platform/lib/anatomy/pipes/mad-currency.pipe';
import { TranslateModule } from '@ngx-translate/core';

import type { DossierEtude, ProblemeGate, ResultatGate } from '@app/etudes/models';

import { resolveOrigineCout } from '../../utils/poste-chiffrage-mode.util';
import {
  DossierEtudeApiService,
  type AvisExecutionResume,
  type SyntheseCoutAffaire,
} from '../../services/dossier-etude-api.service';
import { DpgfApiService, type DpgfLotTotal } from '../../../metres/services/dpgf-api.service';
import { DpuApiService } from '@app/catalogue/bibliotheque-prix/services/dpu-api.service';
import { GateBlocageComponent } from '../gate-blocage/gate-blocage.component';
import { openGateProblemesDialog } from '../gate-blocage/gate-problemes-dialog.component';
import { RattrapagePanelComponent } from '../rattrapage-panel/rattrapage-panel.component';
import { CapitalisationPanelComponent } from '../capitalisation-panel/capitalisation-panel.component';

const ORIGINE_LABELS: Record<string, string> = {
  DECOMPOSE: 'décomposé',
  FORFAIT: 'forfait',
  ESTIME: 'estimé',
  DEDUIT: 'coût déduit',
};

@Component({
  selector: 'app-synthese-validation-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MadCurrencyPipe,
    TranslateModule,
    GateBlocageComponent,
    RattrapagePanelComponent,
    CapitalisationPanelComponent,
  ],
  templateUrl: './synthese-validation-panel.component.html',
  styleUrl: './synthese-validation-panel.component.scss',
})
export class SyntheseValidationPanelComponent {
  private readonly dpgfApi = inject(DpgfApiService);
  private readonly dpuApi = inject(DpuApiService);
  private readonly dossierApi = inject(DossierEtudeApiService);
  private readonly dialog = inject(MatDialog);

  readonly dossier = input.required<DossierEtude>();
  readonly gates = input<ResultatGate[]>([]);
  readonly modifiable = input(true);

  readonly corriger = output<ProblemeGate>();
  readonly change = output<void>();

  readonly totaux = signal<DpgfLotTotal[]>([]);
  readonly syntheseCout = signal<SyntheseCoutAffaire | null>(null);
  readonly avisResume = signal<AvisExecutionResume | null>(null);
  readonly filtreOrigine = signal<string | null>(null);
  readonly chargement = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly composantsTotal = signal(0);
  readonly composantsConsultes = signal(0);

  readonly statut = computed(() => this.dossier().status);

  readonly totalHt = computed(() =>
    this.totaux().reduce((acc, lot) => acc + Number(lot.total ?? 0), 0),
  );

  readonly couverturePct = computed(() => {
    const total = this.composantsTotal();
    if (total <= 0) return 100;
    return Math.round((this.composantsConsultes() / total) * 100);
  });

  readonly gateChiffrage = computed(() => this.gates().find((g) => g.etape === 5));
  readonly gateConsultation = computed(() => this.gates().find((g) => g.etape === 4));

  readonly problemesFinaux = computed((): ResultatGate | undefined => {
    const gates = this.gates().filter((g) => g.etape === 3 || g.etape === 5);
    const problemes = gates.flatMap((g) =>
      g.problemes.map((p) => ({ ...p, etape: g.etape })),
    );
    if (problemes.length === 0) return undefined;
    return {
      etape: 5,
      bloquant: gates.some((g) => g.bloquant && g.problemes.length > 0),
      problemes,
    };
  });

  readonly repartitionEntries = computed(() => {
    const s = this.syntheseCout();
    if (!s?.repartitionPercentParOrigine) return [];
    const order = ['DECOMPOSE', 'FORFAIT', 'ESTIME', 'DEDUIT'];
    return order
      .filter((k) => Number(s.repartitionPercentParOrigine[k] ?? 0) > 0)
      .map((k) => ({
        key: k,
        label: ORIGINE_LABELS[k] ?? k,
        percent: Number(s.repartitionPercentParOrigine[k] ?? 0),
        montant: Number(s.repartitionMontantParOrigine?.[k] ?? 0),
      }));
  });

  constructor() {
    effect(() => {
      const dpgfId = this.dossier().dpgfId;
      const dossierId = this.dossier().id;
      if (dpgfId && dossierId) void this.charger(dpgfId, dossierId);
    });
  }

  setFiltreOrigine(key: string | null): void {
    this.filtreOrigine.set(this.filtreOrigine() === key ? null : key);
  }

  private async charger(dpgfId: string, dossierId: string): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      const [lots, arbre, synthese, avis] = await Promise.all([
        this.dpgfApi.getTotauxByLot(dpgfId),
        this.dpgfApi.getArbre(dpgfId),
        this.dossierApi.getSyntheseCout(dossierId).catch(() => null),
        this.dossierApi.getAvisResume(dossierId).catch(() => null),
      ]);
      this.totaux.set(lots ?? []);
      this.syntheseCout.set(synthese);
      this.avisResume.set(avis);

      const articles = this.collectArticlesDecomposes(arbre.hierarchie ?? []);
      let total = 0;
      let consultes = 0;
      await Promise.all(
        articles.map(async (id) => {
          try {
            const list = await this.dpuApi.listByNoeud(id);
            const dpu = list[0];
            for (const c of dpu?.composants ?? []) {
              total += 1;
              if (c.sourcePrix === 'CONSULTE') consultes += 1;
            }
          } catch {
            /* ignore per-node failures */
          }
        }),
      );
      this.composantsTotal.set(total);
      this.composantsConsultes.set(consultes);
    } catch (e) {
      const err = e as { error?: { message?: string } };
      this.erreur.set(err?.error?.message ?? 'Impossible de charger la synthèse.');
    } finally {
      this.chargement.set(false);
    }
  }

  private collectArticlesDecomposes(
    nodes: {
      id?: string;
      type?: string;
      mode?: string | null;
      origineCout?: string | null;
      prixUnitaire?: number | null;
      enfants?: unknown[];
    }[],
  ): string[] {
    const ids: string[] = [];
    const walk = (list: typeof nodes) => {
      for (const n of list) {
        if (n.type === 'ARTICLE' && n.id) {
          const origine = resolveOrigineCout({
            origineCout: n.origineCout,
            mode: n.mode,
            prixUnitaire: n.prixUnitaire,
          });
          if (origine === 'DECOMPOSE') ids.push(n.id);
        }
        if (Array.isArray(n.enfants)) walk(n.enfants as typeof nodes);
      }
    };
    walk(nodes);
    return ids;
  }

  corrigerConsultation(probleme: ProblemeGate): void {
    this.corriger.emit({ ...probleme, etape: 4 });
  }

  ouvrirDetailsConsultation(): void {
    const gate = this.gateConsultation();
    if (!gate?.problemes.length) return;
    void openGateProblemesDialog(this.dialog, gate.problemes).then((picked) => {
      if (picked) this.corrigerConsultation(picked);
    });
  }

  readonly pretASoumettre = computed(
    () =>
      this.modifiable() && (this.problemesFinaux()?.problemes.length ?? 0) === 0,
  );
}
