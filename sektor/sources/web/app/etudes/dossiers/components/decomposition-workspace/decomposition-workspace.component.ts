
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, type MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { ButtonComponent, ConfirmDialogService } from '@platform/lib/anatomy';

import type { ResultatGate } from '@app/etudes/models';

import type { BordereauTreeRow } from '../../utils/bordereau-tree.util';
import { resolveOrigineCout } from '../../utils/poste-chiffrage-mode.util';
import { DpuApiService } from '@app/catalogue/bibliotheque-prix/services/dpu-api.service';
import { DpgfApiService } from '../../../services/dpgf-api.service';
import { BordereauArbreComponent } from '../bordereau-arbre/bordereau-arbre.component';
import { openGateProblemesDialog } from '../gate-blocage/gate-problemes-dialog.component';
import { openConsultationDecompoDialog } from '../consultation-decompo-dialog/consultation-decompo-dialog.component';
import {
  PosteChiffrageDrawerComponent,
  type PosteChiffrageDrawerData,
  type PosteChiffrageDrawerResult,
} from '../poste-chiffrage-drawer/poste-chiffrage-drawer.component';

@Component({
  selector: 'app-decomposition-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslateModule, BordereauArbreComponent, ButtonComponent],
  templateUrl: './decomposition-workspace.component.html',
  styleUrl: './decomposition-workspace.component.scss',
})
export class DecompositionWorkspaceComponent {
  private readonly dpgfApi = inject(DpgfApiService);
  private readonly dpuApi = inject(DpuApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly dialog = inject(MatDialog);

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

  readonly selectedKey = signal<string | null>(null);
  readonly search = signal('');
  readonly treeReloadToken = signal(0);
  readonly alerteFocusId = signal<string | null>(null);
  readonly totalComposants = signal(0);
  readonly consultes = signal(0);
  readonly articlesAlerteIds = signal<string[]>([]);
  readonly drawerDirty = signal(false);

  private readonly arbre = viewChild(BordereauArbreComponent);

  private drawerRef: MatDialogRef<
    PosteChiffrageDrawerComponent,
    PosteChiffrageDrawerResult | null
  > | null = null;
  private openingKey: string | null = null;

  readonly nonConsultes = computed(() =>
    Math.max(0, this.totalComposants() - this.consultes()),
  );

  readonly alertesConsultation = computed(() => {
    const gate = this.consultationGate();
    if (!gate) return [];
    return gate.problemes.filter((p) => p.etape === 4);
  });

  /** Couverture pertinente uniquement s’il y a des composants décomposés à suivre. */
  readonly aCouvertureComposants = computed(() => this.totalComposants() > 0);

  /** Filtre utile s’il reste des non-consultés ou des alertes gate consultation. */
  readonly peutFiltrerAlertes = computed(
    () =>
      this.nonConsultes() > 0 ||
      this.alertesConsultation().length > 0 ||
      this.articlesAlerteIds().length > 0,
  );

  /** Barre couverture : masquée si 0 composant et rien à filtrer (Estime/Forfait seuls). */
  readonly montreCouverture = computed(
    () => this.aCouvertureComposants() || this.peutFiltrerAlertes(),
  );

  /** Articles gate à révéler dans l’arbre (expand ciblé, max perf). */
  readonly arbreFocusId = computed(() => this.alerteFocusId() ?? this.focusNoeudId());

  readonly expandArticleIds = computed(() => {
    const gate = this.consultationGate();
    if (!gate) return [] as string[];
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const p of gate.problemes) {
      if (!p.noeudId || seen.has(p.noeudId)) continue;
      seen.add(p.noeudId);
      ids.push(p.noeudId);
      if (ids.length >= 40) break;
    }
    return ids;
  });

  constructor() {
    effect(() => {
      const id = this.dpgfId();
      const token = this.treeReloadToken();
      // `untracked` : `refreshCouverture()` fait des appels HTTP dont les
      // intercepteurs lisent des signaux globaux — sinon l’effet se relance seul.
      if (id) untracked(() => void this.refreshCouverture(id, token));
    });

  }

  async ouvrirConsultation(): Promise<void> {
    const ok = await openConsultationDecompoDialog(this.dialog, {
      dossierId: this.dossierId(),
      dpgfId: this.dpgfId(),
    });
    if (ok) this.change.emit();
  }

  ouvrirDetailsAlertes(): void {
    void openGateProblemesDialog(this.dialog, this.alertesConsultation()).then((picked) => {
      if (!picked?.noeudId) return;
      this.alerteFocusId.set(picked.noeudId);
    });
  }

  async onSelectPoste(row: BordereauTreeRow | null): Promise<void> {
    if (!row || row.type !== 'ARTICLE' || !row.id) return;

    const currentKey = this.selectedKey();
    if (this.drawerRef && (row.key === currentKey || this.openingKey === row.key)) {
      return;
    }

    if (this.drawerRef) {
      const instance = this.drawerRef.componentInstance;
      if (instance?.isDirty()) {
        const ok = await this.confirmDialog.confirm({
          title: 'Modifications non enregistrées',
          message:
            'Vous avez des modifications non enregistrées sur ce poste. Les abandonner pour ouvrir un autre article ?',
          variant: 'danger',
          confirmLabel: 'Abandonner',
          cancelLabel: 'Rester sur le poste',
        });
        if (!ok) return;
      }
      this.drawerRef.close({ saved: false });
      this.drawerRef = null;
      this.drawerDirty.set(false);
      this.dirtyChange.emit(false);
    }

    await this.openDrawer(row);
  }

  /** Appelé par le parent avant de quitter l'étape. */
  async confirmerQuitterSiDirty(): Promise<boolean> {
    if (!this.drawerDirty() && !this.drawerRef?.componentInstance?.isDirty()) {
      return true;
    }
    const ok = await this.confirmDialog.confirm({
      title: 'Modifications non enregistrées',
      message:
        'Vous avez des modifications non enregistrées sur ce poste. Enregistrez-les ou abandonnez-les avant de continuer.',
      variant: 'danger',
      confirmLabel: 'Abandonner et continuer',
      cancelLabel: 'Rester sur le poste',
    });
    if (ok && this.drawerRef) {
      this.drawerRef.close({ saved: false });
      this.drawerRef = null;
      this.drawerDirty.set(false);
      this.dirtyChange.emit(false);
    }
    return ok;
  }

  onTreeChange(): void {
    this.change.emit();
    this.treeReloadToken.update((n) => n + 1);
  }

  private async openDrawer(row: BordereauTreeRow): Promise<void> {
    this.openingKey = row.key;
    this.selectedKey.set(row.key);

    // Copie isolée : le drawer ne mutera jamais la ligne live de l’arbre.
    const data: PosteChiffrageDrawerData = {
      poste: structuredClone(row),
      dossierId: this.dossierId(),
      cpsDocumentId: this.cpsDocumentId(),
      modifiable: this.modifiable(),
      fgDefaut: this.fgDefaut(),
      margeDefaut: this.margeDefaut(),
      tvaDefaut: this.tvaDefaut(),
      onDirtyChange: (dirty) => {
        this.drawerDirty.set(dirty);
        this.dirtyChange.emit(dirty);
      },
    };

    const ref = this.dialog.open<
      PosteChiffrageDrawerComponent,
      PosteChiffrageDrawerData,
      PosteChiffrageDrawerResult | null
    >(PosteChiffrageDrawerComponent, {
      panelClass: 'poste-chiffrage-drawer-panel',
      width: 'min(64rem, 96vw)',
      maxWidth: '96vw',
      height: '100vh',
      maxHeight: '100vh',
      position: { right: '0', top: '0' },
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      disableClose: true,
      data,
    });

    this.drawerRef = ref;

    try {
      const result = await firstValueFrom(ref.afterClosed());
      this.drawerRef = null;
      this.openingKey = null;
      this.selectedKey.set(null);
      this.drawerDirty.set(false);
      this.dirtyChange.emit(false);
      // Extraire / créer / ajouter persisté en base puis ✕ (« Tout est à jour ») :
      // saved=false mais le DPGF a changé — recharger l’arbre + synthèse.
      if (result?.saved && result.snapshot) {
        this.arbre()?.applyPosteSnapshot(result.snapshot);
      }
      this.treeReloadToken.update((n) => n + 1);
      this.change.emit();
    } catch {
      this.drawerRef = null;
      this.openingKey = null;
      this.selectedKey.set(null);
      this.drawerDirty.set(false);
      this.dirtyChange.emit(false);
    }
  }

  private async refreshCouverture(dpgfId: string, _token: number): Promise<void> {
    try {
      const arbre = await this.dpgfApi.getArbre(dpgfId);
      // Uniquement les articles décomposés : en prix fourni la décomp. est un brouillon.
      const articles = this.collectArticlesDecomposes(arbre.hierarchie ?? []);
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

  /** Articles dont le mode actif n’est pas prix fourni (consultation pertinente). */
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
}
