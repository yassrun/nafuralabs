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

import { ButtonComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { TranslateModule } from '@ngx-translate/core';

import type { DossierEtude, ProblemeGate, ResultatGate } from '@app/etudes/models';

import { DpgfApiService, type DpgfLotTotal } from '../../../metres/services/dpgf-api.service';
import { DpuApiService } from '../../../bibliotheque-prix/services/dpu-api.service';
import { GateBlocageComponent } from '../gate-blocage/gate-blocage.component';

@Component({
  selector: 'app-synthese-validation-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MadCurrencyPipe, TranslateModule, GateBlocageComponent, ButtonComponent],
  templateUrl: './synthese-validation-panel.component.html',
  styleUrl: './synthese-validation-panel.component.scss',
})
export class SyntheseValidationPanelComponent {
  private readonly dpgfApi = inject(DpgfApiService);
  private readonly dpuApi = inject(DpuApiService);

  readonly dossier = input.required<DossierEtude>();
  readonly gates = input<ResultatGate[]>([]);
  readonly modifiable = input(true);

  readonly corriger = output<ProblemeGate>();
  readonly change = output<void>();

  readonly totaux = signal<DpgfLotTotal[]>([]);
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

  constructor() {
    effect(() => {
      const dpgfId = this.dossier().dpgfId;
      if (dpgfId) void this.charger(dpgfId);
    });
  }

  private async charger(dpgfId: string): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      const [lots, arbre] = await Promise.all([
        this.dpgfApi.getTotauxByLot(dpgfId),
        this.dpgfApi.getArbre(dpgfId),
      ]);
      this.totaux.set(lots ?? []);

      const articles = this.collectArticles(arbre.hierarchie ?? []);
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

  private collectArticles(
    nodes: { id?: string; type?: string; enfants?: unknown[] }[],
  ): string[] {
    const ids: string[] = [];
    const walk = (list: typeof nodes) => {
      for (const n of list) {
        if (n.type === 'ARTICLE' && n.id) ids.push(n.id);
        if (Array.isArray(n.enfants)) walk(n.enfants as typeof nodes);
      }
    };
    walk(nodes);
    return ids;
  }

  corrigerConsultation(probleme: ProblemeGate): void {
    this.corriger.emit({ ...probleme, etape: 4 });
  }

  readonly pretASoumettre = computed(
    () =>
      this.modifiable() && (this.problemesFinaux()?.problemes.length ?? 0) === 0,
  );
}
