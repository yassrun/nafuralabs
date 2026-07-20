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

import {
  ButtonComponent,
  TreeTableComponent,
  type NfTreeNode,
  type NfTreeTableColumn,
} from '@lib/anatomy/components';

import { UnitOfMeasuresApiService } from '@app/pages/inventory/configuration/unit-of-measures/services/unit-of-measure-api.service';

import { DpgfApiService } from '../../../metres/services/dpgf-api.service';
import {
  collectExpandKeys,
  countArticlesInNodes,
  noeudsDpgfToTreeNodes,
  type BordereauTreeRow,
} from '../../utils/bordereau-tree.util';
import {
  mapToReferentialCode,
  toUniteOptions,
  uniteOptionsForValue,
  type UniteOption,
} from '../../utils/unite-options.util';

/**
 * Arbre DPGF persisté — nf-tree-table + unités référentiel + multi-sélection.
 */
@Component({
  selector: 'app-bordereau-arbre',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonComponent, TreeTableComponent],
  templateUrl: './bordereau-arbre.component.html',
  styleUrl: './bordereau-arbre.component.scss',
})
export class BordereauArbreComponent {
  private readonly dpgfApi = inject(DpgfApiService);
  private readonly uomApi = inject(UnitOfMeasuresApiService);

  readonly dpgfId = input.required<string>();
  readonly modifiable = input(true);
  readonly editionStructure = input(false);

  readonly change = output<void>();

  readonly nodes = signal<NfTreeNode<BordereauTreeRow>[]>([]);
  readonly expandedKeys = signal<Set<string>>(new Set());
  readonly selectedKeys = signal<Set<string>>(new Set());
  readonly uniteOptions = signal<UniteOption[]>([]);
  readonly chargement = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly compteArticles = computed(() => countArticlesInNodes(this.nodes()));
  readonly selectionCount = computed(() => this.selectedKeys().size);

  readonly columns = computed<NfTreeTableColumn<BordereauTreeRow>[]>(() => {
    const cols: NfTreeTableColumn<BordereauTreeRow>[] = [];
    if (this.modifiable()) {
      cols.push({ key: 'select', label: ' ', width: '2.75rem', align: 'center' });
    }
    cols.push(
      { key: 'type', label: 'Type', width: '5.5rem' },
      { key: 'code', label: 'Code', width: '7rem' },
      { key: 'libelle', label: 'Libellé' },
      { key: 'unite', label: 'Unité', width: '9rem', align: 'center' },
      { key: 'quantite', label: 'Quantité', width: '7rem', align: 'end' },
    );
    if (this.modifiable() && this.editionStructure()) {
      cols.push({ key: 'actions', label: ' ', width: '8rem', align: 'end' });
    }
    return cols;
  });

  constructor() {
    void this.chargerUnites();
    effect(() => {
      const id = this.dpgfId();
      if (id) void this.charger(id);
    });
  }

  isSelected(key: string): boolean {
    return this.selectedKeys().has(key);
  }

  toggleSelect(key: string, checked: boolean): void {
    const next = new Set(this.selectedKeys());
    if (checked) next.add(key);
    else next.delete(key);
    this.selectedKeys.set(next);
  }

  toggleSelectAll(checked: boolean): void {
    if (!checked) {
      this.selectedKeys.set(new Set());
      return;
    }
    const keys = new Set<string>();
    const walk = (list: NfTreeNode<BordereauTreeRow>[]) => {
      for (const n of list) {
        keys.add(n.key);
        if (n.children?.length) walk(n.children);
      }
    };
    walk(this.nodes());
    this.selectedKeys.set(keys);
  }

  optionsFor(row: BordereauTreeRow): UniteOption[] {
    return uniteOptionsForValue(this.uniteOptions(), row.unite);
  }

  async ajouterLot(): Promise<void> {
    if (!this.modifiable()) return;
    const n = this.nodes().length + 1;
    try {
      await this.dpgfApi.addNoeud(this.dpgfId(), {
        type: 'LOT',
        code: String(n),
        libelle: `Lot ${n}`,
      });
      await this.charger(this.dpgfId());
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.msg(e));
    }
  }

  async ajouterArticle(row: BordereauTreeRow): Promise<void> {
    if (!this.modifiable() || !row.id) return;
    const defaultUnite = this.uniteOptions()[0]?.code ?? 'U';
    try {
      await this.dpgfApi.addNoeud(this.dpgfId(), {
        parentId: row.id,
        type: 'ARTICLE',
        code: `${row.code}-1`,
        libelle: 'Nouvel article',
        unite: defaultUnite,
        quantite: 1,
      });
      await this.charger(this.dpgfId());
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.msg(e));
    }
  }

  async onUniteChange(row: BordereauTreeRow, code: string): Promise<void> {
    row.unite = code || null;
    await this.sauverArticle(row);
  }

  async sauverArticle(row: BordereauTreeRow): Promise<void> {
    if (!this.modifiable() || row.type !== 'ARTICLE' || !row.id) return;
    const mapped = mapToReferentialCode(row.unite, this.uniteOptions());
    row.unite = mapped;
    try {
      await this.dpgfApi.updateNoeud(row.id, {
        unite: mapped,
        quantite:
          row.quantite == null || Number.isNaN(Number(row.quantite)) ? null : Number(row.quantite),
      });
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.msg(e));
    }
  }

  async supprimer(row: BordereauTreeRow): Promise<void> {
    if (!this.modifiable() || !row.id) return;
    try {
      await this.dpgfApi.deleteNoeud(row.id);
      await this.charger(this.dpgfId());
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.msg(e));
    }
  }

  async supprimerSelection(): Promise<void> {
    if (!this.modifiable() || this.selectedKeys().size === 0) return;
    const keyToId = new Map<string, string>();
    const walk = (list: NfTreeNode<BordereauTreeRow>[]) => {
      for (const n of list) {
        if (n.data.id) keyToId.set(n.key, n.data.id);
        if (n.children?.length) walk(n.children);
      }
    };
    walk(this.nodes());

    const ids = [...this.selectedKeys()]
      .map((k) => keyToId.get(k))
      .filter((id): id is string => !!id);

    // Supprimer feuilles d'abord : trier par profondeur décroissante via parcours
    const depthById = new Map<string, number>();
    const walkDepth = (list: NfTreeNode<BordereauTreeRow>[], depth: number) => {
      for (const n of list) {
        if (n.data.id) depthById.set(n.data.id, depth);
        if (n.children?.length) walkDepth(n.children, depth + 1);
      }
    };
    walkDepth(this.nodes(), 0);
    ids.sort((a, b) => (depthById.get(b) ?? 0) - (depthById.get(a) ?? 0));

    this.erreur.set(undefined);
    try {
      for (const id of ids) {
        await this.dpgfApi.deleteNoeud(id);
      }
      this.selectedKeys.set(new Set());
      await this.charger(this.dpgfId());
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.msg(e));
    }
  }

  expandAll(): void {
    const keys = new Set<string>();
    const walk = (list: NfTreeNode<BordereauTreeRow>[]) => {
      for (const n of list) {
        if (n.children?.length) {
          keys.add(n.key);
          walk(n.children);
        }
      }
    };
    walk(this.nodes());
    this.expandedKeys.set(keys);
  }

  collapseAll(): void {
    this.expandedKeys.set(new Set());
  }

  private async chargerUnites(): Promise<void> {
    try {
      const page = await this.uomApi.getAll({ page: 0, pageSize: 500, sortBy: 'code' });
      this.uniteOptions.set(toUniteOptions(page.items ?? []));
    } catch {
      this.uniteOptions.set(toUniteOptions([]));
    }
  }

  private async charger(dpgfId: string): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      const dpgf = await this.dpgfApi.getArbre(dpgfId);
      const nodes = noeudsDpgfToTreeNodes(dpgf.hierarchie ?? []);
      // Map unités affichées vers codes référentiel
      const opts = this.uniteOptions();
      const remap = (list: NfTreeNode<BordereauTreeRow>[]) => {
        for (const n of list) {
          if (n.data.type === 'ARTICLE') {
            n.data.unite = mapToReferentialCode(n.data.unite, opts);
          }
          if (n.children?.length) remap(n.children);
        }
      };
      remap(nodes);
      this.nodes.set(nodes);
      this.expandedKeys.set(collectExpandKeys(nodes, 0));
      this.selectedKeys.set(new Set());
    } catch (e) {
      this.erreur.set(this.msg(e));
      this.nodes.set([]);
    } finally {
      this.chargement.set(false);
    }
  }

  private msg(e: unknown): string {
    const err = e as { error?: { message?: string; code?: string } };
    return err?.error?.code ?? err?.error?.message ?? 'Impossible de charger l’arbre.';
  }
}
