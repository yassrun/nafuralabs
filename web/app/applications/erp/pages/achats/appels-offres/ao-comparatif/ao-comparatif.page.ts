import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {PageHeaderComponent, PageShellComponent, ToastService, ButtonComponent, ConfirmDialogService} from '@lib/anatomy';
import type { PageHeaderConfig } from '@lib/anatomy/components';
import type { AppelOffre, ScoringAO } from '@applications/erp/achats/models';

import { AoApiService, AoFacade } from '../services';

@Component({
  selector: 'app-ao-comparatif',
  standalone: true,
  imports: [
    ButtonComponent,CommonModule, DecimalPipe, RouterLink, TranslateModule, PageShellComponent, PageHeaderComponent],
  templateUrl: './ao-comparatif.page.html',
  styleUrl: './ao-comparatif.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AoComparatifPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly aoApi = inject(AoApiService);
  private readonly aoFacade = inject(AoFacade);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly ao = signal<AppelOffre | null>(null);
  readonly scores = signal<ScoringAO[]>([]);
  readonly loading = signal(true);
  readonly title = signal(this.translate.instant('achats.appelOffre.comparatif.headerTitle'));

  readonly pageHeaderConfig = computed((): PageHeaderConfig => {
    const a = this.ao();
    const tr = (k: string) => this.translate.instant(k);
    return {
      title: this.title(),
      subtitle: tr('achats.appelOffre.comparatif.headerSubtitle'),
      breadcrumbs: [
        { label: tr('achats.appelOffre.comparatif.breadcrumb.achats'), route: '/achats/commandes' },
        { label: tr('achats.appelOffre.comparatif.breadcrumb.ao'), route: '/achats/appels-offres' },
        { label: a?.numero ?? tr('achats.appelOffre.comparatif.breadcrumb.aoFallback'), route: a ? '/achats/appels-offres/' + a.id : '/achats/appels-offres' },
        { label: tr('achats.appelOffre.comparatif.breadcrumb.comparatif') },
      ],
    };
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((p) => {
      const id = p.get('id');
      if (!id) {
        this.loading.set(false);
        return;
      }
      void this.load(id);
    });
  }

  private async load(id: string): Promise<void> {
    this.loading.set(true);
    try {
      const [a, scores] = await Promise.all([
        this.aoApi.getById(id),
        this.aoApi.getComparatif(id),
      ]);
      this.ao.set(a);
      this.scores.set(scores);
      this.title.set(
        this.translate.instant('achats.appelOffre.comparatif.headerTitleWithNumero').replace('{numero}', a.numero),
      );
    } catch (e) {
      this.toast.error((e as Error).message ?? 'Erreur chargement comparatif');
      this.ao.set(null);
      this.scores.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async onRecompute(): Promise<void> {
    const id = this.ao()?.id;
    if (!id) return;
    try {
      this.scores.set(await this.aoApi.recomputeScoring(id));
      this.toast.success('Scores recalculés');
    } catch (e) {
      this.toast.error((e as Error).message ?? 'Erreur recalcul');
    }
  }

  totalHtFor(s: ScoringAO): number {
    return s.offre.reduce((acc, l) => acc + l.totalHt, 0);
  }

  delaiFor(s: ScoringAO): number {
    const ao = this.ao();
    const rep = ao?.reponses.find((r) => r.id === s.reponseId);
    return rep?.delaiLivraisonJours ?? 0;
  }

  async onAttribuer(s: ScoringAO): Promise<void> {
    const ao = this.ao();
    if (!ao) return;
    const top = this.scores().find((x) => x.recommandation === 'TOP');
    let justification: string | undefined;
    if (top && s.reponseId !== top.reponseId) {
      const result = await this.confirmDialog.prompt({
        title: this.translate.instant('achats.appelOffre.prompts.overrideJustification'),
        fields: [{ key: 'justification', label: 'achats.appelOffre.prompts.overrideJustification', required: true }],
        confirmLabel: 'OK',
        cancelLabel: this.translate.instant('common.actions.cancel'),
      });
      if (!result) return;
      const j = result['justification'];
      if (!j?.trim()) {
        this.toast.error(this.translate.instant('achats.common.errors.missingJustification'));
        return;
      }
      justification = j.trim();
    }
    try {
      const { ao: updated, bc } = await this.aoFacade.attribuer(ao.id, s.fournisseurId, justification);
      if (!bc) {
        this.toast.error('Aucun bon de commande généré.');
        this.ao.set(updated);
        return;
      }
      this.toast.success(
        this.translate.instant('achats.appelOffre.toasts.bcCreated').replace('{numero}', bc.numero),
      );
      await this.router.navigate(['/achats/commandes', bc.id]);
      this.ao.set(updated);
    } catch (e) {
      this.toast.error(
        (e as Error).message ?? this.translate.instant('achats.common.errors.attributionGeneric'),
      );
    }
  }
}
