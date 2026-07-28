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
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { ConfirmDialogService } from '@lib/anatomy';

import type { ResultatGate } from '@app/features/etudes/models';

import type { BordereauTreeRow } from '../../utils/bordereau-tree.util';
import { DpuApiService } from '../../../bibliotheque-prix/services/dpu-api.service';
import { DpgfApiService } from '../../../metres/services/dpgf-api.service';
import { BordereauArbreComponent } from '../bordereau-arbre/bordereau-arbre.component';
import { PosteDecompositionPanelComponent } from '../poste-decomposition-panel/poste-decomposition-panel.component';

@Component({
  selector: 'app-decomposition-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    BordereauArbreComponent,
    PosteDecompositionPanelComponent,
  ],
  templateUrl: './decomposition-workspace.component.html',
  styleUrl: './decomposition-workspace.component.scss',
})
export class DecompositionWorkspaceComponent {
  private readonly dpgfApi = inject(DpgfApiService);
  private readonly dpuApi = inject(DpuApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly dpgfId = input.required<string>();
  readonly dossierId = input.required<string>();
  /** Absent tant que le CPS n’est pas indexé — masque alors « Proposer depuis le CPS ». */
  readonly cpsDocumentId = input<string | null>(null);
  readonly modifiable = input(true);
  readonly fgDefaut = input(10);
  readonly margeDefaut = input(17.5);
  readonly tvaDefaut = input(20);
  readonly focusNoeudId = input<string | null>(null);
  /** Gate fusionnée (décomposition + consultation) pour afficher la couverture. */
  readonly consultationGate = input<ResultatGate | undefined>(undefined);

  readonly change = output<void>();
  readonly dirtyChange = output<boolean>();

  readonly selectedPoste = signal<BordereauTreeRow | null>(null);
  readonly selectedKey = signal<string | null>(null);
  readonly mobileDetailOpen = signal(false);
  readonly search = signal('');
  readonly treeReloadToken = signal(0);
  readonly filtreAlertes = signal(false);
  readonly totalComposants = signal(0);
  readonly consultes = signal(0);
  readonly articlesAlerteIds = signal<string[]>([]);
  readonly posteDirty = signal(false);

  readonly nonConsultes = computed(() =>
    Math.max(0, this.totalComposants() - this.consultes()),
  );

  readonly alertesConsultation = computed(() => {
    const gate = this.consultationGate();
    if (!gate) return [];
    return gate.problemes.filter((p) => p.etape === 4);
  });

  readonly filterArticleIds = computed(() => {
    if (!this.filtreAlertes()) return null;
    const fromCouverture = this.articlesAlerteIds();
    if (fromCouverture.length) return fromCouverture;
    const fromGate = this.alertesConsultation()
      .map((a) => a.noeudId)
      .filter((id): id is string => !!id);
    return fromGate.length ? fromGate : [];
  });

  constructor() {
    effect(() => {
      const focusId = this.focusNoeudId();
      if (focusId) {
        this.mobileDetailOpen.set(true);
      }
    });
    effect(() => {
      const id = this.dpgfId();
      const token = this.treeReloadToken();
      if (id) void this.refreshCouverture(id, token);
    });
  }

  async onSelectPoste(row: BordereauTreeRow | null): Promise<void> {
    const current = this.selectedPoste();
    // Même poste : pas de rechargement ni de dialogue dirty.
    if (row && current && (row.key === current.key || (row.id && row.id === current.id))) {
      return;
    }
    if (this.posteDirty()) {
      const ok = await this.confirmDialog.confirm({
        title: 'Modifications non enregistrées',
        message:
          'Vous avez des modifications non enregistrées sur ce poste. Les abandonner pour changer de sélection ?',
        variant: 'danger',
        confirmLabel: 'Abandonner',
        cancelLabel: 'Rester sur le poste',
      });
      if (!ok) return;
      this.posteDirty.set(false);
      this.dirtyChange.emit(false);
    }
    this.applySelect(row);
  }

  onPosteDirty(dirty: boolean): void {
    this.posteDirty.set(dirty);
    this.dirtyChange.emit(dirty);
  }

  onBeforeSelectRequest(): void {
    // reserved for future panel-driven navigation
  }

  closeMobileDetail(): void {
    this.mobileDetailOpen.set(false);
  }

  onTreeChange(): void {
    this.change.emit();
    this.treeReloadToken.update((n) => n + 1);
  }

  onPosteChange(): void {
    this.posteDirty.set(false);
    this.dirtyChange.emit(false);
    this.treeReloadToken.update((n) => n + 1);
    this.change.emit();
  }

  /** Appelé par le parent avant de quitter l'étape. */
  async confirmerQuitterSiDirty(): Promise<boolean> {
    if (!this.posteDirty()) return true;
    return this.confirmDialog.confirm({
      title: 'Modifications non enregistrées',
      message:
        'Vous avez des modifications non enregistrées sur ce poste. Enregistrez-les ou abandonnez-les avant de continuer.',
      variant: 'danger',
      confirmLabel: 'Abandonner et continuer',
      cancelLabel: 'Rester sur le poste',
    });
  }

  private applySelect(row: BordereauTreeRow | null): void {
    this.selectedPoste.set(row);
    this.selectedKey.set(row?.key ?? null);
    if (row) this.mobileDetailOpen.set(true);
  }

  private async refreshCouverture(dpgfId: string, _token: number): Promise<void> {
    try {
      const arbre = await this.dpgfApi.getArbre(dpgfId);
      const articles = this.collectArticles(arbre.hierarchie ?? []);
      let total = 0;
      let consultes = 0;
      const alerteIds: string[] = [];
      const batchSize = 8;
      for (let i = 0; i < articles.length; i += batchSize) {
        const batch = articles.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (id) => {
            try {
              const list = await this.dpuApi.listByNoeud(id);
              let hasNonConsulte = false;
              for (const c of list[0]?.composants ?? []) {
                total += 1;
                if (c.sourcePrix === 'CONSULTE') {
                  consultes += 1;
                } else {
                  hasNonConsulte = true;
                }
              }
              if (hasNonConsulte) alerteIds.push(id);
            } catch {
              /* ignore */
            }
          }),
        );
      }
      this.totalComposants.set(total);
      this.consultes.set(consultes);
      this.articlesAlerteIds.set(alerteIds);
    } catch {
      this.totalComposants.set(0);
      this.consultes.set(0);
      this.articlesAlerteIds.set([]);
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
}
