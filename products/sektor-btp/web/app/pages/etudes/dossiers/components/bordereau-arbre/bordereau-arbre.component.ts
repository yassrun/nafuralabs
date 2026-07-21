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
import { firstValueFrom } from 'rxjs';

import {
  ButtonComponent,
  TreeTableComponent,
  type NfTreeNode,
  type NfTreeTableColumn,
} from '@lib/anatomy/components';
import { ConfirmDialogService } from '@lib/anatomy';

import { UnitOfMeasuresApiService } from '@app/pages/inventory/configuration/unit-of-measures/services/unit-of-measure-api.service';

import { DpgfApiService } from '../../../metres/services/dpgf-api.service';
import {
  collectExpandKeys,
  countArticlesInNodes,
  noeudsDpgfToTreeNodes,
  type BordereauTreeRow,
} from '../../utils/bordereau-tree.util';
import { mapToReferentialCode, toUniteOptions, type UniteOption } from '../../utils/unite-options.util';
import {
  BordereauNoeudDialogComponent,
  childTypesFor,
  defaultChildType,
  siblingTypesFor,
  type BordereauNoeudDialogResult,
  type BordereauNoeudType,
} from '../bordereau-noeud-dialog/bordereau-noeud-dialog.component';

/**
 * Arbre DPGF persisté — lecture seule + Actions en popup (aligné chantier).
 */
@Component({
  selector: 'app-bordereau-arbre',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonComponent, TreeTableComponent],
  templateUrl: './bordereau-arbre.component.html',
  styleUrl: './bordereau-arbre.component.scss',
})
export class BordereauArbreComponent {
  private readonly dpgfApi = inject(DpgfApiService);
  private readonly uomApi = inject(UnitOfMeasuresApiService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly dpgfId = input.required<string>();
  readonly modifiable = input(true);
  /** Conservé pour compatibilité template parent — Actions toujours visibles si modifiable. */
  readonly editionStructure = input(false);

  readonly change = output<void>();

  readonly nodes = signal<NfTreeNode<BordereauTreeRow>[]>([]);
  readonly expandedKeys = signal<Set<string>>(new Set());
  readonly uniteOptions = signal<UniteOption[]>([]);
  readonly chargement = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly compteArticles = computed(() => countArticlesInNodes(this.nodes()));

  readonly columns = computed<NfTreeTableColumn<BordereauTreeRow>[]>(() => {
    const cols: NfTreeTableColumn<BordereauTreeRow>[] = [
      { key: 'type', label: 'Type', width: '5.5rem' },
      { key: 'code', label: 'Code', width: '7rem' },
      { key: 'libelle', label: 'Libellé' },
      { key: 'unite', label: 'Unité', width: '5.5rem', align: 'center' },
      { key: 'quantite', label: 'Quantité', width: '7rem', align: 'end' },
    ];
    if (this.modifiable()) {
      cols.push({ key: 'actions', label: 'Actions', width: '8.5rem', align: 'center' });
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

  async ajouterLot(): Promise<void> {
    if (!this.modifiable()) return;
    const result = await this.openNoeudDialog({
      mode: 'create',
      placement: 'root',
      allowedTypes: ['LOT'],
      defaultType: 'LOT',
      initial: { type: 'LOT', code: String(this.nodes().length + 1), libelle: '' },
    });
    if (!result) return;
    try {
      await this.dpgfApi.addNoeud(this.dpgfId(), {
        type: result.type,
        code: result.code,
        libelle: result.libelle,
      });
      await this.charger(this.dpgfId());
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.msg(e));
    }
  }

  async modifier(row: BordereauTreeRow): Promise<void> {
    if (!this.modifiable() || !row.id) return;
    const type = (row.type as BordereauNoeudType) || 'ARTICLE';
    const result = await this.openNoeudDialog({
      mode: 'edit',
      placement: 'sibling',
      allowedTypes: [type],
      defaultType: type,
      initial: {
        type,
        code: row.code,
        libelle: row.libelle,
        unite: row.unite,
        quantite: row.quantite,
      },
    });
    if (!result) return;
    try {
      await this.dpgfApi.updateNoeud(row.id, {
        code: result.code,
        libelle: result.libelle,
        unite: result.type === 'ARTICLE' ? result.unite ?? null : null,
        quantite: result.type === 'ARTICLE' ? result.quantite ?? null : null,
      });
      await this.charger(this.dpgfId());
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.msg(e));
    }
  }

  async ajouterEnfant(row: BordereauTreeRow): Promise<void> {
    if (!this.modifiable() || !row.id) return;
    const allowed = childTypesFor(row.type);
    if (allowed.length === 0) return;
    const def = defaultChildType(row.type);
    const result = await this.openNoeudDialog({
      mode: 'create',
      placement: 'child',
      allowedTypes: allowed,
      defaultType: def,
      initial: {
        type: def,
        code: `${row.code}-1`,
        libelle: '',
        unite: this.uniteOptions()[0]?.code ?? 'U',
        quantite: 1,
      },
    });
    if (!result) return;
    try {
      await this.dpgfApi.addNoeud(this.dpgfId(), {
        parentId: row.id,
        type: result.type,
        code: result.code,
        libelle: result.libelle,
        unite: result.unite,
        quantite: result.quantite,
      });
      await this.charger(this.dpgfId());
      this.expandedKeys.update((keys) => new Set([...keys, row.key]));
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.msg(e));
    }
  }

  async ajouterMemeNiveau(row: BordereauTreeRow): Promise<void> {
    if (!this.modifiable()) return;
    const allowed = siblingTypesFor(row.type);
    const result = await this.openNoeudDialog({
      mode: 'create',
      placement: 'sibling',
      allowedTypes: allowed,
      defaultType: (row.type as BordereauNoeudType) || 'ARTICLE',
      initial: {
        type: row.type,
        code: `${row.code}-bis`,
        libelle: '',
        unite: this.uniteOptions()[0]?.code ?? 'U',
        quantite: 1,
      },
    });
    if (!result) return;
    try {
      await this.dpgfApi.addNoeud(this.dpgfId(), {
        parentId: row.parentId ?? null,
        type: result.type,
        code: result.code,
        libelle: result.libelle,
        unite: result.unite,
        quantite: result.quantite,
      });
      await this.charger(this.dpgfId());
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.msg(e));
    }
  }

  async supprimer(row: BordereauTreeRow): Promise<void> {
    if (!this.modifiable() || !row.id) return;
    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer le nœud',
      message: `Supprimer « ${row.code} — ${row.libelle} » et ses éventuels enfants ?`,
      variant: 'danger',
      confirmLabel: 'Supprimer',
    });
    if (!confirmed) return;
    try {
      await this.dpgfApi.deleteNoeud(row.id);
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

  private async openNoeudDialog(partial: {
    mode: 'create' | 'edit';
    placement: 'root' | 'child' | 'sibling';
    allowedTypes: BordereauNoeudType[];
    defaultType: BordereauNoeudType;
    initial?: {
      type?: string;
      code?: string;
      libelle?: string;
      unite?: string | null;
      quantite?: number | null;
    };
  }): Promise<BordereauNoeudDialogResult | null> {
    const ref = this.dialog.open(BordereauNoeudDialogComponent, {
      width: '28rem',
      data: {
        ...partial,
        uniteOptions: this.uniteOptions(),
      },
    });
    return (await firstValueFrom(ref.afterClosed())) ?? null;
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
