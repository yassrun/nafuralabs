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
 * Arbre DPGF — lecture + Actions en popup.
 * En mode sélection (étape Décomposition), le clic sur un ARTICLE ouvre le panneau détail.
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
  readonly selectionEnabled = input(false);
  readonly selectedKey = input<string | null>(null);
  readonly focusNoeudId = input<string | null>(null);
  readonly searchQuery = input('');
  /** Incrémente pour forcer un rechargement (ex. après chiffrage d’un poste). */
  readonly reloadToken = input(0);

  readonly change = output<void>();
  readonly posteSelect = output<BordereauTreeRow | null>();

  readonly nodes = signal<NfTreeNode<BordereauTreeRow>[]>([]);
  readonly expandedKeys = signal<Set<string>>(new Set());
  readonly uniteOptions = signal<UniteOption[]>([]);
  readonly chargement = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly compteArticles = computed(() => countArticlesInNodes(this.nodes()));

  readonly filteredNodes = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.nodes();
    return filterTree(this.nodes(), q);
  });

  readonly columns = computed<NfTreeTableColumn<BordereauTreeRow>[]>(() => {
    const cols: NfTreeTableColumn<BordereauTreeRow>[] = [
      { key: 'type', label: 'Type', width: '5.5rem' },
      { key: 'code', label: 'Code', width: '7rem' },
      { key: 'libelle', label: 'Libellé' },
      { key: 'unite', label: 'Unité', width: '5.5rem', align: 'center' },
      { key: 'quantite', label: 'Quantité', width: '7rem', align: 'end' },
    ];
    if (this.selectionEnabled()) {
      cols.push({ key: 'pu', label: 'PU HT', width: '6.5rem', align: 'end' });
    }
    if (this.modifiable()) {
      cols.push({ key: 'actions', label: 'Actions', width: '9.5rem', align: 'center' });
    }
    return cols;
  });

  readonly rowClass = (row: BordereauTreeRow): string => {
    const classes = [`arbre__row--${(row.type || '').toLowerCase()}`];
    if (this.selectedKey() && row.key === this.selectedKey()) {
      classes.push('arbre__row--selected');
    }
    return classes.join(' ');
  };

  readonly rowTitle = (row: BordereauTreeRow): string | null => row.libelle || null;

  typeCourt(type: string | undefined): string {
    switch ((type ?? '').toUpperCase()) {
      case 'LOT':
        return 'Lot';
      case 'SOUS_LOT':
        return 'S-lot';
      case 'ARTICLE':
        return 'Art.';
      default:
        return type ?? '';
    }
  }

  /** Adoucit les libellés TOUT EN MAJUSCULES pour alléger la lecture. */
  softLabel(value: string | undefined): string {
    const text = (value ?? '').trim();
    if (!text) return '';
    const letters = text.replace(/[^A-Za-zÀ-ÿ]/g, '');
    if (letters.length < 4) return text;
    const upper = letters.replace(/[^A-ZÀ-Ÿ]/g, '').length;
    if (upper / letters.length < 0.7) return text;
    return text
      .toLocaleLowerCase('fr-FR')
      .replace(/(^|[\s\-_/])([\p{L}])/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase('fr-FR'));
  }

  constructor() {
    void this.chargerUnites();
    effect(() => {
      const id = this.dpgfId();
      this.reloadToken();
      if (id) void this.charger(id);
    });
    effect(() => {
      const focusId = this.focusNoeudId();
      const nodes = this.nodes();
      if (!focusId || !nodes.length) return;
      const match = findRowById(nodes, focusId);
      if (!match) return;
      this.expandedKeys.set(expandAncestors(nodes, match.key));
      if (match.type === 'ARTICLE') {
        this.posteSelect.emit(match);
      }
    });
    effect(() => {
      const key = this.selectedKey();
      const nodes = this.nodes();
      if (!key || !nodes.length) return;
      const match = findRowByKey(nodes, key);
      if (match?.type === 'ARTICLE') {
        this.posteSelect.emit(match);
      }
    });
  }

  onRowClick(row: BordereauTreeRow): void {
    if (!this.selectionEnabled()) return;
    if (row.type !== 'ARTICLE') {
      this.posteSelect.emit(null);
      return;
    }
    this.posteSelect.emit(row);
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
      if (this.selectedKey() === row.key) this.posteSelect.emit(null);
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

  stop(event: Event): void {
    event.stopPropagation();
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
      const previous = this.expandedKeys();
      this.nodes.set(nodes);
      if (previous.size > 0) {
        const valid = new Set<string>();
        const walk = (list: NfTreeNode<BordereauTreeRow>[]) => {
          for (const n of list) {
            if (previous.has(n.key) && n.children?.length) valid.add(n.key);
            if (n.children?.length) walk(n.children);
          }
        };
        walk(nodes);
        this.expandedKeys.set(valid.size ? valid : collectExpandKeys(nodes, 0));
      } else {
        this.expandedKeys.set(collectExpandKeys(nodes, 0));
      }
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

function filterTree(
  nodes: NfTreeNode<BordereauTreeRow>[],
  query: string,
): NfTreeNode<BordereauTreeRow>[] {
  const out: NfTreeNode<BordereauTreeRow>[] = [];
  for (const node of nodes) {
    const children = node.children?.length ? filterTree(node.children, query) : [];
    const hay = `${node.data.code} ${node.data.libelle}`.toLowerCase();
    if (hay.includes(query) || children.length) {
      out.push({
        ...node,
        children: children.length ? children : undefined,
        leaf: !children.length,
      });
    }
  }
  return out;
}

function findRowById(
  nodes: NfTreeNode<BordereauTreeRow>[],
  id: string,
): BordereauTreeRow | null {
  for (const node of nodes) {
    if (node.data.id === id) return node.data;
    if (node.children?.length) {
      const found = findRowById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function findRowByKey(
  nodes: NfTreeNode<BordereauTreeRow>[],
  key: string,
): BordereauTreeRow | null {
  for (const node of nodes) {
    if (node.key === key) return node.data;
    if (node.children?.length) {
      const found = findRowByKey(node.children, key);
      if (found) return found;
    }
  }
  return null;
}

function expandAncestors(
  nodes: NfTreeNode<BordereauTreeRow>[],
  targetKey: string,
): Set<string> {
  const keys = new Set<string>();
  const walk = (list: NfTreeNode<BordereauTreeRow>[], trail: string[]): boolean => {
    for (const node of list) {
      const next = [...trail, node.key];
      if (node.key === targetKey) {
        trail.forEach((k) => keys.add(k));
        return true;
      }
      if (node.children?.length && walk(node.children, next)) {
        keys.add(node.key);
        return true;
      }
    }
    return false;
  };
  walk(nodes, []);
  return keys;
}
