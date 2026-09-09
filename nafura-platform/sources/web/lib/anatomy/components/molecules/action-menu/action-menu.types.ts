/**
 * nf-action-menu — types.
 *
 * A menu is a recursive tree of nodes rendered in a mat-menu panel:
 * leaf items, submenus (nodes with children) and dividers.
 */

/** Leaf action: click → emit id (after optional confirm). */
export interface ActionMenuLeaf {
  kind?: 'item';
  id: string;
  label: string;
  icon?: string;
  /** Danger styling (red). Pair with `confirm` for destructive actions. */
  danger?: boolean;
  disabled?: boolean;
  tooltip?: string;
  /** When false, the node is not rendered. Default true. */
  visible?: boolean;
  /** Ask confirmation (ConfirmDialogService) before emitting `actionClick`. */
  confirm?: boolean;
}

/** Submenu: opens a nested panel with its own children. */
export interface ActionMenuSubmenu {
  kind: 'submenu';
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  /** When false, the node is not rendered. Default true. */
  visible?: boolean;
  children: ActionMenuNode[];
}

/** Visual separator between groups. */
export interface ActionMenuDivider {
  kind: 'divider';
  /** When false, the divider is not rendered. Default true. */
  visible?: boolean;
}

export type ActionMenuNode = ActionMenuLeaf | ActionMenuSubmenu | ActionMenuDivider;
