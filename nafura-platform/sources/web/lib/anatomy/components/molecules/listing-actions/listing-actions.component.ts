import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  ButtonListComponent,
  type ButtonListItem,
} from '../button-list';
import type { ButtonSize } from '../../atoms/button';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

/** Alias — same shape as `nf-button-list` items. */
export type ListingActionItem = ButtonListItem;

/** List = Export/New… · Tree = expand/collapse + add node / add child / delete. */
export type ListingActionsMode = 'list' | 'tree';

const TREE_RESERVED_IDS = new Set([
  'expand-all',
  'collapse-all',
  'toggle-select',
  'add-node',
  'add-child',
  'delete',
]);

/** Extra with the same id overlays the built-in; reserved ids that are not built-in stay hidden. */
function overlayTreeActions(
  builtIn: ListingActionItem[],
  extras: ListingActionItem[],
): ListingActionItem[] {
  const extraById = new Map(extras.map((a) => [a.id, a]));
  const merged = builtIn
    .map((base) => {
      const extra = extraById.get(base.id);
      return extra ? { ...base, ...extra, id: base.id } : base;
    })
    .filter((a) => a.visible !== false);
  const extraOnly = extras.filter(
    (a) => !TREE_RESERVED_IDS.has(a.id) && a.visible !== false
  );
  return [...extraOnly, ...merged];
}

/**
 * Listing Actions (`nf-listing-actions`)
 *
 * Top-right toolbar for **nf-listing** and **nf-tree**.
 *
 * Content projection (first): platform extras such as
 * **`nf-smart-import-action`** — sparkles menu button + tooltip
 * (info champs · import unitaire · import bulk).
 *
 * Then selection actions, then resolved actions.
 *
 * Tree mode:
 * - fold toggle + multi-select toggle — left of the toolbar
 * - add-node / add-child / delete — right
 *
 * Same-id extras overlay built-ins (`add-node` → « Ajouter un article »).
 * `{ visible: false }` hides a built-in. New ids are prepended.
 *
 * **Delete always goes through {@link ConfirmDialogService}** (platform rule)
 * before `actionClick` emits `'delete'`.
 *
 * @example List with magic import
 * ```html
 * <nf-listing-actions [actions]="globals" (actionClick)="…">
 *   <nf-smart-import-action [definition]="def" (completed)="…" />
 * </nf-listing-actions>
 * ```
 */
@Component({
  selector: 'nf-listing-actions',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonListComponent],
  host: {
    '[class.nf-listing-actions--start]': 'placement() === "start"',
  },
  template: `
    <div class="nf-listing-actions" role="toolbar" [attr.aria-label]="'Actions' | translate">
      <ng-content />
      @if (selectionActions().length > 0) {
        <nf-button-list
          [actions]="selectionActions()"
          [size]="size()"
          [iconLibrary]="iconLibrary()"
          (actionClick)="onActionClick($event)"
        />
      }
      @if (resolvedActions().length > 0) {
        <nf-button-list
          [actions]="resolvedActions()"
          [size]="size()"
          [iconLibrary]="iconLibrary()"
          (actionClick)="onActionClick($event)"
        />
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        flex: 0 0 auto;
        margin-left: auto;
      }

      :host.nf-listing-actions--start {
        margin-left: 0;
      }

      .nf-listing-actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: var(--nf-space-2, 8px);
      }

      :host.nf-listing-actions--start .nf-listing-actions {
        justify-content: flex-start;
      }
    `,
  ],
})
export class ListingActionsComponent {
  private readonly confirmDialog = inject(ConfirmDialogService);

  mode = input<ListingActionsMode>('list');

  /** Extra actions (list: Export/New… · tree: optional extras). */
  actions = input<ListingActionItem[]>([]);

  /** List mode: selection-scoped actions. */
  selectionActions = input<ListingActionItem[]>([]);

  /** Tree: selected node id (null = none). */
  selectedId = input<string | null>(null);

  /** Tree: selected node may receive a child (`node.allowsChildren`). */
  canAddChild = input<boolean>(true);

  /** Tree: allow delete on selection (default true). */
  canDelete = input<boolean>(true);

  /** Include the expand/collapse toggle. Put it on the left via `placement="start"`. */
  showFoldActions = input<boolean>(true);

  /**
   * Tree fold toggle: `true` = arbre ouvert → bouton « tout replier » (chevrons-up).
   * `false` = arbre fermé → bouton « tout déplier » (chevrons-down).
   */
  treeExpanded = input<boolean>(false);

  /** Include the multi-select toggle (list-checks). Put it on the left via `placement="start"`. */
  showBulkSelect = input<boolean>(false);

  /** Multi-select mode is on — icon flips to close. */
  bulkSelectActive = input<boolean>(false);

  /** Include add-node / add-child / delete. */
  showMutateActions = input<boolean>(true);

  /** `start` = left of the toolbar (no auto margin). `end` = right (default). */
  placement = input<'start' | 'end'>('end');

  /**
   * Platform rule: delete always asks for confirmation before emit.
   * Keep `true` unless a parent already confirmed (rare).
   */
  requireDeleteConfirm = input<boolean>(true);

  expandAllLabel = input<string>('Expand all');
  collapseAllLabel = input<string>('Collapse all');
  bulkSelectLabel = input<string>('Select rows');
  cancelSelectLabel = input<string>('Cancel selection');
  addNodeLabel = input<string>('Add node');
  addChildLabel = input<string>('Add child');
  deleteLabel = input<string>('Delete');

  /** Confirm dialog copy (defaults = ConfirmDialogService.confirmDelete). */
  deleteConfirmTitle = input<string>('Confirm Delete');
  deleteConfirmMessage = input<string>(
    'Are you sure you want to delete this item? This action cannot be undone.'
  );
  deleteConfirmLabel = input<string>('Delete');
  deleteConfirmCancelLabel = input<string>('Cancel');

  size = input<ButtonSize>('sm');
  iconLibrary = input<'material' | 'lucide'>('lucide');

  actionClick = output<string>();

  readonly resolvedActions = computed((): ListingActionItem[] => {
    const extras = this.actions();

    if (this.mode() !== 'tree') {
      return extras.filter((a) => a.visible !== false);
    }

    const selected = !!this.selectedId();
    const allowChild = selected && this.canAddChild();
    const allowDelete = selected && this.canDelete();
    const treeBuiltIn: ListingActionItem[] = [];

    if (this.showFoldActions()) {
      const expanded = this.treeExpanded();
      treeBuiltIn.push({
        id: expanded ? 'collapse-all' : 'expand-all',
        label: '',
        icon: expanded ? 'chevrons-up' : 'chevrons-down',
        variant: 'secondary',
        order: 0,
        ariaLabel: expanded ? this.collapseAllLabel() : this.expandAllLabel(),
        tooltip: expanded ? this.collapseAllLabel() : this.expandAllLabel(),
      });
    }

    if (this.showBulkSelect()) {
      const on = this.bulkSelectActive();
      treeBuiltIn.push({
        id: 'toggle-select',
        label: '',
        icon: on ? 'x' : 'list-checks',
        variant: 'secondary',
        active: on,
        order: 1,
        ariaLabel: on ? this.cancelSelectLabel() : this.bulkSelectLabel(),
        tooltip: on ? this.cancelSelectLabel() : this.bulkSelectLabel(),
      });
    }

    if (this.showMutateActions()) {
      treeBuiltIn.push({
        id: 'add-node',
        label: this.addNodeLabel(),
        variant: allowChild ? 'secondary' : 'primary',
        icon: 'plus',
      });

      if (allowChild) {
        treeBuiltIn.push({
          id: 'add-child',
          label: this.addChildLabel(),
          variant: 'primary',
          icon: 'corner-down-right',
        });
      }

      if (allowDelete) {
        treeBuiltIn.push({
          id: 'delete',
          label: this.deleteLabel(),
          variant: 'danger',
          icon: 'trash-2',
        });
      }
    }

    return overlayTreeActions(treeBuiltIn, extras);
  });

  async onActionClick(id: string): Promise<void> {
    if (id === 'delete' && this.requireDeleteConfirm()) {
      const ok = await this.confirmDialog.confirm({
        title: this.deleteConfirmTitle(),
        message: this.deleteConfirmMessage(),
        confirmLabel: this.deleteConfirmLabel(),
        cancelLabel: this.deleteConfirmCancelLabel(),
        variant: 'danger',
        icon: 'delete',
      });
      if (!ok) return;
    }
    this.actionClick.emit(id);
  }
}
