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
 * Tree mode (2 add actions only):
 * - **add-node** — always: no selection → root; selection → same level (sibling)
 * - **add-child** — only if a node is selected and `canAddChild`
 * - expand-all / collapse-all / delete (when selected; delete → ConfirmDialog)
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

      .nf-listing-actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: var(--nf-space-2, 8px);
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

  /** Tree: selected node may receive a child (false for leaf/article). */
  canAddChild = input<boolean>(true);

  /** Tree: allow delete on selection (default true). */
  canDelete = input<boolean>(true);

  /**
   * Platform rule: delete always asks for confirmation before emit.
   * Keep `true` unless a parent already confirmed (rare).
   */
  requireDeleteConfirm = input<boolean>(true);

  expandAllLabel = input<string>('Expand all');
  collapseAllLabel = input<string>('Collapse all');
  addNodeLabel = input<string>('Add node');
  addChildLabel = input<string>('Add child');
  deleteLabel = input<string>('Delete');

  /** Confirm dialog copy (defaults = ConfirmDialogService.confirmDelete). */
  deleteConfirmTitle = input<string>('Confirm Delete');
  deleteConfirmMessage = input<string>(
    'Are you sure you want to delete this item? This action cannot be undone.'
  );
  deleteConfirmLabel = input<string>('Delete');

  size = input<ButtonSize>('sm');
  iconLibrary = input<'material' | 'lucide'>('lucide');

  actionClick = output<string>();

  readonly resolvedActions = computed((): ListingActionItem[] => {
    const extras = this.actions().filter((a) => a.visible !== false);

    if (this.mode() !== 'tree') {
      return extras;
    }

    const selected = !!this.selectedId();
    const allowChild = selected && this.canAddChild();
    const allowDelete = selected && this.canDelete();

    const treeBuiltIn: ListingActionItem[] = [
      {
        id: 'expand-all',
        label: '',
        icon: 'unfold-vertical',
        variant: 'ghost',
        ariaLabel: this.expandAllLabel(),
        tooltip: this.expandAllLabel(),
      },
      {
        id: 'collapse-all',
        label: '',
        icon: 'fold-vertical',
        variant: 'ghost',
        ariaLabel: this.collapseAllLabel(),
        tooltip: this.collapseAllLabel(),
      },
      {
        id: 'add-node',
        label: this.addNodeLabel(),
        variant: allowChild ? 'secondary' : 'primary',
        icon: 'plus',
      },
    ];

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

    const reserved = new Set(treeBuiltIn.map((a) => a.id));
    return [...extras.filter((a) => !reserved.has(a.id)), ...treeBuiltIn];
  });

  async onActionClick(id: string): Promise<void> {
    if (id === 'delete' && this.requireDeleteConfirm()) {
      const ok = await this.confirmDialog.confirm({
        title: this.deleteConfirmTitle(),
        message: this.deleteConfirmMessage(),
        confirmLabel: this.deleteConfirmLabel(),
        variant: 'danger',
        icon: 'delete',
      });
      if (!ok) return;
    }
    this.actionClick.emit(id);
  }
}
