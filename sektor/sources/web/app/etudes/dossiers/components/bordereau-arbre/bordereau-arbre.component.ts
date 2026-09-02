import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import {
  TreeTableComponent,
  type NfTreeNode,
  type NfTreeTableColumn,
} from '@platform/lib/anatomy/components';
import { ButtonComponent, ConfirmDialogService, TooltipDirective } from '@platform/lib/anatomy';

import { UnitOfMeasuresApiService } from '@app/catalogue/configuration/unit-of-measures/services/unit-of-measure-api.service';

import type { NoeudDPGF } from '@app/etudes/models';
import { EtudeBannerComponent } from '../etude-banner/etude-banner.component';
import { DpgfApiService } from '../../../services/dpgf-api.service';
import {
  applyTreeRollupPostes,
  applyTreeRollupTotals,
  bordereauTableMinWidth,
  collectAllExpandableKeys,
  collectNonExploitableArticleKeys,
  countArticlesInNodes,
  countExploitableInNodes,
  expandAncestors,
  expandAncestorsOfNonExploitable,
  filterTreeByArticleIds,
  findFocusRow,
  findRowById,
  getImportNoeudAt,
  importArbreToTreeNodes,
  importKeyToPath,
  noeudsDpgfToTreeNodes,
  type BordereauTreeRow,
  type ImportNoeudPreview,
} from '../../utils/bordereau-tree.util';
import { resolveOrigineCout, type OrigineCoutUi } from '../../utils/poste-chiffrage-mode.util';
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
 * En mode sélection (étape Décomposition), double-clic ARTICLE ouvre le drawer
 * de chiffrage ; lots / sous-lots ne font que naviguer l’arbre.
 */
@Component({
  selector: 'app-bordereau-arbre',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TreeTableComponent,
    ButtonComponent,
    TooltipDirective,
    EtudeBannerComponent,
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
  /** false : le parent affiche l’erreur dans le bandeau du wizard. */
  readonly inlineBanner = input(true);
  readonly selectionEnabled = input(false);
  readonly selectedKey = input<string | null>(null);
  readonly focusNoeudId = input<string | null>(null);
  /** Code article (ex. a/1) — fallback quand l’arbre d’extraction n’a pas d’UUID. */
  readonly focusCode = input<string | null>(null);
  /** Incrémenté à chaque « Voir dans l’arbre » pour re-cibler le même nœud. */
  readonly focusToken = input(0);
  /**
   * Articles à révéler (expand ancêtres) — ex. postes gate incomplets étape Coût.
   * Ciblé (≤40) pour éviter un expand-all coûteux sur gros bordereau.
   */
  readonly expandArticleIds = input<readonly string[]>([]);
  readonly searchQuery = input('');
  /** Incrémente pour forcer un rechargement (ex. après chiffrage d’un poste). */
  readonly reloadToken = input(0);
  /** Filtre articles avec composants non consultés (ids). */
  readonly filterArticleIds = input<string[] | null>(null);
  /** Arbre déjà chargé (portail invité) — pas d’appel DPGF authentifié. */
  readonly externalHierarchie = input<NoeudDPGF[] | null>(null);
  /** Clic simple ouvre le poste (invité) — sinon double-clic comme l’étape Coût. */
  readonly openOnClick = input(false);

  readonly change = output<void>();
  readonly posteSelect = output<BordereauTreeRow | null>();
  readonly draftChange = output<ImportNoeudPreview[]>();

  readonly nodes = signal<NfTreeNode<BordereauTreeRow>[]>([]);
  readonly draftLocal = signal<ImportNoeudPreview[]>([]);
  readonly expandedKeys = signal<Set<string>>(new Set());
  readonly uniteOptions = signal<UniteOption[]>([]);
  readonly chargement = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  /** Force remount nf-tree-table (expand state / PU stale après mutation arbre). */
  readonly tableEpoch = signal(0);

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
      // Étape Coût : un filtre « alertes » ne doit pas masquer les postes à chiffrer.
      if (this.selectionEnabled()) {
        for (const id of collectIncompleteArticleIds(list)) allowed.add(id);
      }
      list = filterTreeByArticleIds(list, allowed);
    }
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return list;
    return filterTree(list, q);
  });

  readonly columns = computed<NfTreeTableColumn<BordereauTreeRow>[]>(() => {
    const selection = this.selectionEnabled();
    const cols: NfTreeTableColumn<BordereauTreeRow>[] = [
      { key: 'type', label: 'Type', width: selection ? '3.75rem' : '4.25rem' },
      { key: 'code', label: 'Code', width: selection ? '5rem' : '5.5rem', cssClass: 'arbre__col-code' },
      { key: 'libelle', label: 'Libellé', width: '40%', cssClass: 'arbre__col-libelle' },
      { key: 'spacer', label: '', cssClass: 'arbre__col-spacer' },
      {
        key: 'unite',
        label: 'Unité',
        width: '4.25rem',
        align: 'center',
        stickyEnd: true,
        cssClass: 'arbre__col-metric',
      },
      {
        key: 'quantite',
        label: 'Qté',
        width: '4.5rem',
        align: 'end',
        stickyEnd: true,
        cssClass: 'arbre__col-metric',
      },
    ];
    if (selection) {
      cols.push(
        {
          key: 'pu',
          label: 'PU HT',
          width: '5rem',
          align: 'end',
          stickyEnd: true,
          cssClass: 'arbre__col-metric',
        },
        {
          key: 'total',
          label: 'Total HT',
          width: '5.75rem',
          align: 'end',
          stickyEnd: true,
          cssClass: 'arbre__col-metric',
        },
      );
    } else {
      cols.push({
        key: 'postes',
        label: 'Postes',
        width: '4.5rem',
        align: 'end',
        stickyEnd: true,
        cssClass: 'arbre__col-metric',
      });
    }
    if (this.showStructureActions()) {
      cols.push({
        key: 'actions',
        label: 'Actions',
        width: '8.5rem',
        align: 'center',
        stickyEnd: true,
        cssClass: 'arbre__col-actions',
      });
    }
    return cols;
  });

  readonly showStructureActions = computed(
    () => this.modifiable() && !this.selectionEnabled() && (this.isDraft() || this.editionStructure()),
  );

  /**
   * Plancher des colonnes fixes (Type…Actions). Le libellé prend le reste
   * et s’ellipse ; sous ce plancher le scroll H apparaît, sticky à droite.
   */
  readonly tableMinWidth = computed(() =>
    bordereauTableMinWidth({
      selection: this.selectionEnabled(),
      structureActions: this.showStructureActions(),
    }),
  );
  /** Remplit le parent flex (dossier fill) — un seul scroll vertical. */
  readonly tableScrollHeight = '100%';

  private readonly focusedRowKey = signal<string | null>(null);

  readonly rowClass = computed(() => {
    const selected = this.selectedKey();
    const focused = this.focusedRowKey();
    return (row: BordereauTreeRow): string => {
      const classes = [`arbre__row--${(row.type || '').toLowerCase()}`];
      if (selected && (row.key === selected || row.id === selected)) {
        classes.push('arbre__row--selected');
      }
      if (focused && row.key === focused) {
        classes.push('arbre__row--focus');
      }
      if (row.nonExploitable) {
        classes.push('arbre__row--warn');
      }
      return classes.join(' ');
    };
  });

  readonly rowTitle = (row: BordereauTreeRow): string | null => {
    if (row.nonExploitable) {
      return `${row.libelle} — article non exploitable (unité et quantité > 0 requises)`;
    }
    if (this.selectionEnabled() && row.type === 'ARTICLE') {
      return this.openOnClick()
        ? `${row.libelle} — clic pour ouvrir le détail`
        : `${row.libelle} — double-clic pour ouvrir le chiffrage`;
    }
    return null;
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

  /** Badge mode — articles chiffrés uniquement (PU > 0), étape Coût. */
  origineBadge(row: BordereauTreeRow): { label: string; kind: OrigineCoutUi } | null {
    if (!this.selectionEnabled() || row.type !== 'ARTICLE') return null;
    const hasPu = row.prixUnitaire != null && row.prixUnitaire > 0;
    // Pas de badge tant que le poste n'a pas de prix (ERP-66).
    if (!hasPu) return null;
    const origine = resolveOrigineCout({
      origineCout: row.origineCout,
      mode: row.mode,
      prixUnitaire: row.prixUnitaire,
    });
    if (!origine) return null;
    const label =
      origine === 'DECOMPOSE' ? 'Décomposé' : origine === 'FORFAIT' ? 'Forfait' : 'Estimé';
    return { label, kind: origine };
  }

  estCoutDeduit(row: BordereauTreeRow): boolean {
    return this.selectionEnabled() && row.type === 'ARTICLE' && !!row.coutDeduit;
  }

  private lastDraftToken = -1;
  private lastFocusFingerprint = '';
  private lastExpandFingerprint = '';
  private readonly host = inject(ElementRef<HTMLElement>);

  constructor() {
    effect(() => {
      if (this.externalHierarchie() != null) return;
      untracked(() => void this.chargerUnites());
    });
    effect(() => {
      const external = this.externalHierarchie();
      const draft = this.draftArbre();
      const draftToken = this.draftToken();
      const id = this.dpgfId();
      const token = this.reloadToken();
      // `untracked` : `charger()` passe par les intercepteurs HTTP, qui lisent des
      // signaux globaux (token / tenant). Sans ça l’arbre se recharge en boucle.
      untracked(() => {
        if (external != null) {
          const nodes = noeudsDpgfToTreeNodes(external);
          applyTreeRollupTotals(nodes);
          applyTreeRollupPostes(nodes);
          this.nodes.set(nodes);
          this.expandedKeys.set(collectAllExpandableKeys(nodes));
          this.tableEpoch.update((e) => e + 1);
          this.chargement.set(false);
          return;
        }
        if (draft != null) {
          // Reseed seulement sur nouvelle extraction (token), pas sur chaque edit locale.
          if (draftToken !== this.lastDraftToken) {
            this.lastDraftToken = draftToken;
            this.draftLocal.set(structuredClone(draft));
            this.refreshDraftNodes(true);
          }
          return;
        }
        this.lastDraftToken = -1;
        if (id) {
          // Rechargement silencieux si on a déjà des nœuds (évite le flash pendant/après le drawer).
          void this.charger(id, { silent: token > 0 && this.nodes().length > 0 });
        } else {
          this.nodes.set([]);
        }
      });
    });
    effect(() => {
      const focusId = this.focusNoeudId();
      const focusCode = this.focusCode();
      const token = this.focusToken();
      const nodes = this.nodes();
      untracked(() => this.applyFocus(focusId, focusCode, nodes, token, false));
    });
    effect(() => {
      const nodes = this.nodes();
      const fromGate = this.expandArticleIds();
      const selectionOn = this.selectionEnabled();
      untracked(() => {
        if (!nodes.length) return;
        const warnKeys = collectNonExploitableArticleKeys(nodes);
        const costIds =
          selectionOn && !this.isDraft()
            ? collectIncompleteArticleIds(nodes).slice(0, 40)
            : [];
        const ids = fromGate.length > 0 ? [...fromGate] : costIds;
        const fp = `${warnKeys.join(',')}|${ids.join(',')}|${nodes.length}`;
        if (fp === this.lastExpandFingerprint) return;
        if (warnKeys.length === 0 && ids.length === 0) {
          this.lastExpandFingerprint = fp;
          return;
        }
        this.lastExpandFingerprint = fp;
        const keys = new Set(this.expandedKeys());
        for (const k of expandAncestorsOfNonExploitable(nodes)) keys.add(k);
        for (const id of ids) {
          const match = findRowById(nodes, id);
          if (!match) continue;
          for (const k of expandAncestors(nodes, match.key)) keys.add(k);
        }
        this.expandedKeys.set(keys);
        if (warnKeys.length > 0) this.scrollToFirstIncomplete();
      });
    });
  }

  /** Recible un nœud (id persisté ou code d’extraction) même si l’URL n’a pas changé. */
  revelerNoeud(id?: string | null, code?: string | null): void {
    this.applyFocus(id ?? null, code ?? null, this.nodes(), Date.now(), true);
  }

  private applyFocus(
    id: string | null,
    code: string | null,
    nodes: NfTreeNode<BordereauTreeRow>[],
    token: number,
    force: boolean,
  ): void {
    if (!id && !code) {
      this.focusedRowKey.set(null);
      this.lastFocusFingerprint = '';
      return;
    }
    if (!nodes.length) return;
    const fingerprint = `${id ?? ''}|${code ?? ''}|${token}`;
    if (!force && fingerprint === this.lastFocusFingerprint) return;
    const match = findFocusRow(nodes, id, code);
    if (!match) return;
    this.lastFocusFingerprint = fingerprint;
    this.focusedRowKey.set(match.key);
    const keys = new Set(this.expandedKeys());
    for (const k of expandAncestors(nodes, match.key)) keys.add(k);
    this.expandedKeys.set(keys);
    if (match.type === 'ARTICLE' && this.selectionEnabled()) {
      this.posteSelect.emit(match);
    }
    this.scrollToRowKey(match.key);
  }

  /**
   * Applique le snapshot renvoyé par le drawer après « Enregistrer et fermer ».
   * Sans cet appel, la tree reste intacte (copie isolée dans le modal).
   */
  applyPosteSnapshot(snap: {
    noeudId: string;
    prixUnitaire: number | null;
    total: number | null;
    mode: string | null;
    origineCout?: string | null;
    prixFourniBase?: number | null;
    coutUnitaire?: number | null;
    fraisGenerauxPercent?: number | null;
    margePercent?: number | null;
    descriptif?: string | null;
    coutDeduit?: boolean;
  }): void {
    const next = structuredClone(this.nodes());
    const walk = (list: NfTreeNode<BordereauTreeRow>[]): boolean => {
      for (const n of list) {
        if (n.data.id === snap.noeudId) {
          n.data.prixUnitaire = snap.prixUnitaire;
          n.data.total = snap.total;
          n.data.mode = snap.mode;
          if (snap.origineCout !== undefined) n.data.origineCout = snap.origineCout;
          if (snap.coutUnitaire !== undefined) n.data.coutUnitaire = snap.coutUnitaire;
          if (snap.prixFourniBase !== undefined) n.data.prixFourniBase = snap.prixFourniBase;
          if (snap.fraisGenerauxPercent !== undefined) {
            n.data.fraisGenerauxPercent = snap.fraisGenerauxPercent;
          }
          if (snap.margePercent !== undefined) n.data.margePercent = snap.margePercent;
          if (snap.descriptif !== undefined) n.data.descriptif = snap.descriptif;
          if (snap.coutDeduit !== undefined) n.data.coutDeduit = snap.coutDeduit;
          return true;
        }
        if (n.children?.length && walk(n.children)) return true;
      }
      return false;
    };
    if (!walk(next)) return;
    applyTreeRollupTotals(next);
    this.nodes.set(next);
    this.tableEpoch.update((e) => e + 1);
  }

  onRowClick(row: BordereauTreeRow): void {
    if (!this.openOnClick()) return;
    this.emitPoste(row);
  }

  onRowDblClick(row: BordereauTreeRow): void {
    if (!this.selectionEnabled()) return;
    this.emitPoste(row);
  }

  private emitPoste(row: BordereauTreeRow): void {
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
    this.expandedKeys.set(collectAllExpandableKeys(this.nodes()));
  }

  collapseAll(): void {
    this.expandedKeys.set(new Set());
  }

  /** Déplie le chemin jusqu’aux articles « incomplet » et scroll vers le premier. */
  revelerIncomplets(): void {
    const nodes = this.nodes();
    const keys = expandAncestorsOfNonExploitable(nodes);
    this.expandedKeys.set(keys);
    this.scrollToFirstIncomplete();
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
    applyTreeRollupPostes(nodes);
    this.nodes.set(nodes);
    if (resetExpand) {
      this.expandedKeys.set(expandAncestorsOfNonExploitable(nodes));
      this.scrollToFirstIncomplete();
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

  private scrollToFirstIncomplete(): void {
    queueMicrotask(() => {
      this.host.nativeElement
        .querySelector('.arbre__row--warn')
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  private scrollToRowKey(key: string): void {
    const tryScroll = (): boolean => {
      const escaped = CSS.escape(key);
      const el = this.host.nativeElement.querySelector(`[data-row-key="${escaped}"]`);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return !!el;
    };
    queueMicrotask(() => {
      if (tryScroll()) return;
      setTimeout(tryScroll, 80);
    });
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

  private async charger(
    dpgfId: string,
    opts: { silent?: boolean } = {},
  ): Promise<void> {
    if (!opts.silent) this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      const dpgf = await this.dpgfApi.getArbre(dpgfId);
      const nodes = noeudsDpgfToTreeNodes(dpgf.hierarchie ?? []);
      const optsUnite = this.uniteOptions();
      const remap = (list: NfTreeNode<BordereauTreeRow>[]) => {
        for (const n of list) {
          if (n.data.type === 'ARTICLE') {
            n.data.unite = mapToReferentialCode(n.data.unite, optsUnite);
          }
          if (n.children?.length) remap(n.children);
        }
      };
      remap(nodes);
      applyTreeRollupTotals(nodes);
      applyTreeRollupPostes(nodes);
      const previous = this.expandedKeys();
      this.nodes.set(nodes);
      this.tableEpoch.update((e) => e + 1);
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
      } else if (this.selectionEnabled()) {
        this.expandedKeys.set(collectAllExpandableKeys(nodes));
      } else {
        this.expandedKeys.set(expandAncestorsOfNonExploitable(nodes));
        this.scrollToFirstIncomplete();
      }
    } catch (e) {
      this.erreur.set(this.msg(e));
      this.nodes.set([]);
    } finally {
      if (!opts.silent) this.chargement.set(false);
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

/** Articles sans coût / origine — fallback expand si la gate n’a pas encore de noeudId. */
function collectIncompleteArticleIds(nodes: NfTreeNode<BordereauTreeRow>[]): string[] {
  const ids: string[] = [];
  const walk = (list: NfTreeNode<BordereauTreeRow>[]) => {
    for (const node of list) {
      const row = node.data;
      if (row.type === 'ARTICLE' && row.id) {
        const cout = row.coutUnitaire;
        const pu = row.prixUnitaire;
        const hasCout = cout != null && cout > 0;
        const hasPu = pu != null && pu > 0;
        const origine = resolveOrigineCout({
          origineCout: row.origineCout,
          mode: row.mode,
          prixUnitaire: row.prixUnitaire,
        });
        if (!origine || (!hasCout && !hasPu)) {
          ids.push(row.id);
        }
      }
      if (node.children?.length) walk(node.children);
    }
  };
  walk(nodes);
  return ids;
}
