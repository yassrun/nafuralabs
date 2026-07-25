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
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
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
  applyTreeRollupTotals,
  countArticlesInNodes,
  countExploitableInNodes,
  getImportNoeudAt,
  importArbreToTreeNodes,
  importKeyToPath,
  noeudsDpgfToTreeNodes,
  type BordereauTreeRow,
  type ImportNoeudPreview,
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
 * Arbre DPGF — lecture / édition structurelle, ou brouillon d'import inline.
 * En mode sélection (étape Décomposition), seul un clic ARTICLE change le poste
 * affiché à droite ; lots / sous-lots ne font que naviguer l’arbre.
 */
@Component({
  selector: 'app-bordereau-arbre',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ButtonComponent,
    TreeTableComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './bordereau-arbre.component.html',
  styleUrl: './bordereau-arbre.component.scss',
})
export class BordereauArbreComponent {
  private readonly dpgfApi = inject(DpgfApiService);
  private readonly uomApi = inject(UnitOfMeasuresApiService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);

  /** Requis hors mode brouillon. */
  readonly dpgfId = input<string | undefined>(undefined);
  /** Brouillon d'extraction — édité en mémoire, sans dpgfId. */
  readonly draftArbre = input<ImportNoeudPreview[] | null>(null);
  /** Incrémente pour recharger un nouveau brouillon (nouvelle extraction). */
  readonly draftToken = input(0);
  readonly modifiable = input(true);
  /** Édition structurelle (lots/articles) — mode manuel ou brouillon. */
  readonly editionStructure = input(false);
  readonly selectionEnabled = input(false);
  readonly selectedKey = input<string | null>(null);
  readonly focusNoeudId = input<string | null>(null);
  readonly searchQuery = input('');
  /** Incrémente pour forcer un rechargement (ex. après chiffrage d’un poste). */
  readonly reloadToken = input(0);
  /** Filtre articles avec composants non consultés (ids). */
  readonly filterArticleIds = input<string[] | null>(null);

  readonly change = output<void>();
  readonly posteSelect = output<BordereauTreeRow | null>();
  readonly draftChange = output<ImportNoeudPreview[]>();

  readonly nodes = signal<NfTreeNode<BordereauTreeRow>[]>([]);
  readonly draftLocal = signal<ImportNoeudPreview[]>([]);
  readonly expandedKeys = signal<Set<string>>(new Set());
  readonly uniteOptions = signal<UniteOption[]>([]);
  readonly chargement = signal(false);
  readonly erreur = signal<string | undefined>(undefined);

  readonly isDraft = computed(() => this.draftArbre() != null);

  readonly compteArticles = computed(() => countArticlesInNodes(this.nodes()));
  readonly compteExploitables = computed(() => countExploitableInNodes(this.nodes()));
  readonly compteIgnores = computed(() =>
    Math.max(0, this.compteArticles() - this.compteExploitables()),
  );

  readonly filteredNodes = computed(() => {
    let list = this.nodes();
    const ids = this.filterArticleIds();
    if (ids?.length) {
      const allowed = new Set(ids);
      list = filterTreeByArticleIds(list, allowed);
    }
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return list;
    return filterTree(list, q);
  });

  readonly columns = computed<NfTreeTableColumn<BordereauTreeRow>[]>(() => {
    const selection = this.selectionEnabled();
    const cols: NfTreeTableColumn<BordereauTreeRow>[] = [
      { key: 'type', label: 'Type', width: selection ? '4.5rem' : '5.5rem' },
      { key: 'code', label: 'Code', width: selection ? '5.5rem' : '7rem' },
      { key: 'libelle', label: 'Libellé' },
      { key: 'unite', label: 'Unité', width: '5rem', align: 'center' },
      { key: 'quantite', label: 'Qté', width: '5.5rem', align: 'end' },
    ];
    if (selection) {
      cols.push(
        { key: 'pu', label: 'PU HT', width: '5.5rem', align: 'end' },
        { key: 'total', label: 'Total HT', width: '6.5rem', align: 'end' },
      );
    } else {
      cols.push({ key: 'total', label: 'Total HT', width: '7rem', align: 'end' });
    }
    if (this.showStructureActions()) {
      cols.push({ key: 'actions', label: 'Actions', width: '10.5rem', align: 'center' });
    }
    return cols;
  });

  readonly tableMinWidth = computed(() => (this.selectionEnabled() ? '36rem' : '42rem'));
  readonly showStructureActions = computed(
    () => this.modifiable() && !this.selectionEnabled() && (this.isDraft() || this.editionStructure()),
  );

  readonly rowClass = (row: BordereauTreeRow): string => {
    const classes = [`arbre__row--${(row.type || '').toLowerCase()}`];
    if (this.selectedKey() && row.key === this.selectedKey()) {
      classes.push('arbre__row--selected');
    }
    if (row.nonExploitable) {
      classes.push('arbre__row--warn');
    }
    return classes.join(' ');
  };

  readonly rowTitle = (row: BordereauTreeRow): string | null => {
    if (row.nonExploitable) {
      return `${row.libelle} — article non exploitable (unité et quantité > 0 requises)`;
    }
    return row.libelle || null;
  };

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

  private lastDraftToken = -1;

  constructor() {
    void this.chargerUnites();
    effect(() => {
      const draft = this.draftArbre();
      const token = this.draftToken();
      if (draft != null) {
        // Reseed seulement sur nouvelle extraction (token), pas sur chaque edit locale.
        if (token !== this.lastDraftToken) {
          this.lastDraftToken = token;
          this.draftLocal.set(structuredClone(draft));
          this.refreshDraftNodes(true);
        }
        return;
      }
      this.lastDraftToken = -1;
      const id = this.dpgfId();
      this.reloadToken();
      if (id) void this.charger(id);
      else {
        this.nodes.set([]);
      }
    });
    effect(() => {
      const focusId = this.focusNoeudId();
      const nodes = this.nodes();
      if (!focusId || !nodes.length || this.isDraft()) return;
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
      if (!key || !nodes.length || this.isDraft()) return;
      const match = findRowByKey(nodes, key);
      if (match?.type === 'ARTICLE') {
        this.posteSelect.emit(match);
      }
    });
  }

  onRowClick(row: BordereauTreeRow): void {
    if (!this.selectionEnabled()) return;
    // Lots / sous-lots : navigation seule — on ne désélectionne le poste
    // que lors du choix d’un autre ARTICLE.
    if (row.type !== 'ARTICLE') return;
    this.posteSelect.emit(row);
  }

  async ajouterLot(): Promise<void> {
    if (!this.showStructureActions()) return;
    const result = await this.openNoeudDialog({
      mode: 'create',
      placement: 'root',
      allowedTypes: ['LOT'],
      defaultType: 'LOT',
      initial: {
        type: 'LOT',
        code: String((this.isDraft() ? this.draftLocal() : this.nodes()).length + 1),
        libelle: '',
      },
    });
    if (!result) return;
    if (this.isDraft()) {
      const root = structuredClone(this.draftLocal());
      root.push(this.toImportNoeud(result));
      this.commitDraft(root);
      return;
    }
    try {
      await this.dpgfApi.addNoeud(this.dpgfId()!, {
        type: result.type,
        code: result.code,
        libelle: result.libelle,
      });
      await this.charger(this.dpgfId()!);
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.msg(e));
    }
  }

  async modifier(row: BordereauTreeRow): Promise<void> {
    if (!this.showStructureActions()) return;
    if (this.isDraft()) {
      const path = importKeyToPath(row.key);
      if (!path) return;
      const noeud = getImportNoeudAt(this.draftLocal(), path);
      if (!noeud) return;
      const type = (noeud.type ?? 'ARTICLE').toUpperCase() as BordereauNoeudType;
      const result = await this.openNoeudDialog({
        mode: 'edit',
        placement: 'sibling',
        allowedTypes: [type],
        defaultType: type,
        initial: {
          type,
          code: noeud.code ?? '',
          libelle: noeud.libelle ?? '',
          unite: noeud.unite,
          quantite: noeud.quantite,
        },
      });
      if (!result) return;
      const root = structuredClone(this.draftLocal());
      const target = getImportNoeudAt(root, path);
      if (!target) return;
      target.type = result.type;
      target.code = result.code;
      target.libelle = result.libelle;
      target.unite = result.type === 'ARTICLE' ? result.unite : null;
      target.quantite = result.type === 'ARTICLE' ? result.quantite : null;
      this.commitDraft(root, false);
      return;
    }
    if (!row.id) return;
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
      await this.charger(this.dpgfId()!);
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.msg(e));
    }
  }

  async ajouterEnfant(row: BordereauTreeRow): Promise<void> {
    if (!this.showStructureActions()) return;
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
    if (this.isDraft()) {
      const path = importKeyToPath(row.key);
      if (!path) return;
      const root = structuredClone(this.draftLocal());
      const parent = getImportNoeudAt(root, path);
      if (!parent) return;
      if (!parent.enfants) parent.enfants = [];
      parent.enfants.push(this.toImportNoeud(result));
      this.commitDraft(root, false);
      this.expandedKeys.update((keys) => new Set([...keys, row.key]));
      return;
    }
    if (!row.id) return;
    try {
      await this.dpgfApi.addNoeud(this.dpgfId()!, {
        parentId: row.id,
        type: result.type,
        code: result.code,
        libelle: result.libelle,
        unite: result.unite,
        quantite: result.quantite,
      });
      await this.charger(this.dpgfId()!);
      this.expandedKeys.update((keys) => new Set([...keys, row.key]));
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.msg(e));
    }
  }

  async ajouterMemeNiveau(row: BordereauTreeRow): Promise<void> {
    if (!this.showStructureActions()) return;
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
    if (this.isDraft()) {
      const path = importKeyToPath(row.key);
      if (!path) return;
      const root = structuredClone(this.draftLocal());
      if (path.length === 1) {
        root.splice(path[0] + 1, 0, this.toImportNoeud(result));
      } else {
        const parent = getImportNoeudAt(root, path.slice(0, -1));
        if (!parent) return;
        if (!parent.enfants) parent.enfants = [];
        parent.enfants.splice(path[path.length - 1] + 1, 0, this.toImportNoeud(result));
      }
      this.commitDraft(root, false);
      return;
    }
    try {
      await this.dpgfApi.addNoeud(this.dpgfId()!, {
        parentId: row.parentId ?? null,
        type: result.type,
        code: result.code,
        libelle: result.libelle,
        unite: result.unite,
        quantite: result.quantite,
      });
      await this.charger(this.dpgfId()!);
      this.change.emit();
    } catch (e) {
      this.erreur.set(this.msg(e));
    }
  }

  async supprimer(row: BordereauTreeRow): Promise<void> {
    if (!this.showStructureActions()) return;
    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer le nœud',
      message: `Supprimer « ${row.code} — ${row.libelle} » et ses éventuels enfants ?`,
      variant: 'danger',
      confirmLabel: 'Supprimer',
    });
    if (!confirmed) return;
    if (this.isDraft()) {
      const path = importKeyToPath(row.key);
      if (!path) return;
      const root = structuredClone(this.draftLocal());
      if (path.length === 1) {
        root.splice(path[0], 1);
      } else {
        const parent = getImportNoeudAt(root, path.slice(0, -1));
        if (!parent?.enfants) return;
        parent.enfants.splice(path[path.length - 1], 1);
      }
      this.commitDraft(root);
      return;
    }
    if (!row.id) return;
    try {
      await this.dpgfApi.deleteNoeud(row.id);
      if (this.selectedKey() === row.key) this.posteSelect.emit(null);
      await this.charger(this.dpgfId()!);
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

  private commitDraft(root: ImportNoeudPreview[], resetExpand = true): void {
    this.draftLocal.set(root);
    this.refreshDraftNodes(resetExpand);
    this.draftChange.emit(root);
  }

  private refreshDraftNodes(resetExpand = true): void {
    this.remapDraftUnites();
    const nodes = importArbreToTreeNodes(this.draftLocal());
    this.nodes.set(nodes);
    if (resetExpand) {
      // Collapsed by default — user expands via chevrons / expand-all.
      this.expandedKeys.set(new Set());
    }
  }

  private remapDraftUnites(): void {
    const opts = this.uniteOptions();
    const walk = (list: ImportNoeudPreview[]) => {
      for (const n of list) {
        const type = (n.type ?? 'ARTICLE').toUpperCase();
        if (type === 'ARTICLE') {
          n.unite = mapToReferentialCode(n.unite, opts);
        }
        if (n.enfants?.length) walk(n.enfants);
      }
    };
    walk(this.draftLocal());
  }

  private toImportNoeud(result: BordereauNoeudDialogResult): ImportNoeudPreview {
    return {
      type: result.type,
      code: result.code,
      libelle: result.libelle,
      unite: result.type === 'ARTICLE' ? result.unite : null,
      quantite: result.type === 'ARTICLE' ? result.quantite : null,
      enfants: [],
    };
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
      autoFocus: 'first-tabbable',
      restoreFocus: true,
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
      applyTreeRollupTotals(nodes);
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
        this.expandedKeys.set(valid);
      } else {
        // Collapsed by default (lots only).
        this.expandedKeys.set(new Set());
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

function filterTreeByArticleIds(
  nodes: NfTreeNode<BordereauTreeRow>[],
  allowed: Set<string>,
): NfTreeNode<BordereauTreeRow>[] {
  const out: NfTreeNode<BordereauTreeRow>[] = [];
  for (const node of nodes) {
    const children = node.children?.length
      ? filterTreeByArticleIds(node.children, allowed)
      : [];
    const keepArticle =
      node.data.type === 'ARTICLE' && node.data.id != null && allowed.has(node.data.id);
    if (keepArticle || children.length) {
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
