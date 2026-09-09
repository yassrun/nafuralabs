import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent, type ButtonSize, type ButtonVariant } from '../../atoms/button';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ActionMenuLevelComponent } from './action-menu-level.component';
import type { ActionMenuLeaf, ActionMenuNode } from './action-menu.types';

/**
 * Action Menu (`nf-action-menu`) — trigger button + recursive action tree.
 *
 * Two trigger styles:
 * - **labeled cascade** (e.g. « Status ▾ »): set `[label]` — chevron on the right
 * - **icon-only overflow « ⋯ »**: omit label — default icon `more-horizontal`
 *
 * Nodes: leaf items, submenus (`children`), dividers — recursive, rendered as
 * nested `mat-menu` panels (keyboard: arrows, → opens, ← / Échap closes).
 *
 * Leaf click → `actionClick(id)`. `confirm: true` on a leaf goes through
 * {@link ConfirmDialogService} first (platform rule: destructive actions
 * confirm before emit).
 *
 * @example Overflow « ⋯ » with nested submenu
 * ```html
 * <nf-action-menu [nodes]="[
 *   { id: 'duplicate', label: 'Dupliquer', icon: 'copy' },
 *   { kind: 'submenu', id: 'export', label: 'Exporter', icon: 'download', children: [
 *     { id: 'export-csv', label: 'CSV', icon: 'file' },
 *     { id: 'export-xlsx', label: 'Excel (.xlsx)', icon: 'file' },
 *   ]},
 *   { kind: 'divider' },
 *   { id: 'delete', label: 'Supprimer', icon: 'trash-2', danger: true, confirm: true },
 * ]" (actionClick)="onAction($event)" />
 * ```
 *
 * @example Status cascade
 * ```html
 * <nf-action-menu label="Status" [nodes]="statusNodes" (actionClick)="onStatus($event)" />
 * ```
 */
@Component({
  selector: 'nf-action-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    TranslateModule,
    ButtonComponent,
    ActionMenuLevelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-button
      [variant]="variant()"
      [size]="size()"
      [icon]="resolvedTriggerIcon()"
      [iconPosition]="resolvedIconPosition()"
      [iconLibrary]="iconLibrary()"
      [tooltip]="resolvedTooltip() | translate"
      [attr.aria-label]="(resolvedTooltip() || label() || 'Menu') | translate"
      [disabled]="disabled()"
      [matMenuTriggerFor]="root.menu()"
    >{{ label() | translate }}</nf-button>
    <nf-action-menu-level
      #root
      [nodes]="nodes()"
      [xPosition]="resolvedXPosition()"
      (nodeClick)="onNodeClick($event)"
    />
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        flex: 0 0 auto;
      }
    `,
  ],
})
export class ActionMenuComponent {
  private readonly confirmDialog = inject(ConfirmDialogService);

  /** Recursive menu tree (items · submenus · dividers). */
  readonly nodes = input.required<ActionMenuNode[]>();

  /** Trigger label. Empty → icon-only « ⋯ » overflow trigger. */
  readonly label = input<string>('');

  /** Trigger icon. Default: `chevron-down` with a label, `more-horizontal` without. */
  readonly triggerIcon = input<string>('');

  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('sm');
  readonly iconLibrary = input<'material' | 'lucide'>('lucide');
  readonly disabled = input<boolean>(false);

  /** Trigger tooltip. Default « More actions » when icon-only. */
  readonly tooltip = input<string>('');

  /**
   * Menu horizontal alignment vs trigger.
   * Default: `before` (right-aligned) for icon-only ⋯, `after` for labeled.
   */
  readonly xPosition = input<'before' | 'after' | undefined>(undefined);

  /** Leaf id, after optional confirm. */
  readonly actionClick = output<string>();

  readonly resolvedTriggerIcon = computed(() => {
    const icon = this.triggerIcon();
    if (icon) return icon;
    return this.label() ? 'chevron-down' : 'more-horizontal';
  });

  readonly resolvedIconPosition = computed(() =>
    this.label() ? ('right' as const) : ('left' as const)
  );

  readonly resolvedTooltip = computed(
    () => this.tooltip() || (this.label() ? '' : 'More actions')
  );

  readonly resolvedXPosition = computed(
    () => this.xPosition() ?? (this.label() ? 'after' : 'before')
  );

  async onNodeClick(node: ActionMenuLeaf): Promise<void> {
    if (node.confirm) {
      const ok = await this.confirmDialog.confirm({
        title: 'Confirm',
        message: node.label,
        confirmLabel: node.label,
        variant: node.danger ? 'danger' : 'default',
      });
      if (!ok) return;
    }
    this.actionClick.emit(node.id);
  }
}
