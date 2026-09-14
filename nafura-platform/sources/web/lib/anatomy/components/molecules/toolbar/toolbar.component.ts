import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent, type ButtonSize, type ButtonVariant } from '../../atoms/button';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ActionMenuComponent } from '../action-menu';
import type { ActionMenuNode, ActionMenuSubmenu } from '../action-menu';

/**
 * One action in `nf-toolbar`.
 *
 * - Plain item → compact `nf-button` in the bar.
 * - Item with `children` → cascade trigger (« Status ▸ », recursive tree).
 * - Overflow: beyond `maxVisible`, non-pinned actions fold into « ⋯ ».
 */
export interface ToolbarAction {
  id: string;
  label?: string;
  icon?: string;
  variant?: ButtonVariant;
  /** Danger styling + pairs with `confirm` for destructive actions. */
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
  active?: boolean;
  tooltip?: string;
  /** When false, the action is not rendered. Default true. */
  visible?: boolean;
  /** Ask confirmation (ConfirmDialogService) before emitting. */
  confirm?: boolean;
  /**
   * Never fold into « ⋯ ». Default: true for `primary` and `danger`
   * variants, false otherwise.
   */
  pinned?: boolean;
  /** Cascade children — the item renders as a menu trigger instead of a button. */
  children?: ActionMenuNode[];
  /** Lower values render first. */
  order?: number;
}

/**
 * Toolbar (`nf-toolbar`) — standalone action bar, not tied to listings.
 *
 * Add as many actions as you want:
 * - `pinned` (default: primary/danger) always stay in the bar
 * - the rest fold into a recursive « ⋯ » overflow past `maxVisible`
 * - items with `children` render as cascades at the same level as buttons
 *
 * Content projection (first) for host extras. `confirm: true` routes through
 * {@link ConfirmDialogService} before `actionClick` — platform rule.
 *
 * @example
 * <nf-toolbar [actions]="[
 *   { id: 'approve', label: 'Approuver', variant: 'primary', icon: 'check' },
 *   { id: 'status', label: 'Status', children: statusNodes },
 *   { id: 'delete', label: 'Supprimer', icon: 'trash-2', danger: true, confirm: true },
 * ]" (actionClick)="onAction($event)" />
 */
@Component({
  selector: 'nf-toolbar',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonComponent, ActionMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="nf-toolbar" role="toolbar">
      <ng-content />
      @for (action of barActions(); track action.id) {
        @if (hasChildren(action)) {
          <nf-action-menu
            [label]="action.label ?? ''"
            [triggerIcon]="action.icon ?? ''"
            [variant]="action.variant ?? 'secondary'"
            [size]="size()"
            [nodes]="action.children ?? []"
            [disabled]="action.disabled ?? false"
            [tooltip]="action.tooltip ?? ''"
            (actionClick)="actionClick.emit($event)"
          />
        } @else {
          <nf-button
            [variant]="action.variant ?? (action.danger ? 'danger' : 'secondary')"
            [size]="size()"
            [icon]="action.icon"
            [disabled]="action.disabled ?? false"
            [loading]="action.loading ?? false"
            [active]="action.active ?? false"
            [tooltip]="(action.tooltip ?? action.label ?? '') | translate"
            [attr.aria-label]="(action.label ?? action.id) | translate"
            (clicked)="onItem(action)"
            >{{ (action.label ?? '') | translate }}</nf-button
          >
        }
      }
      @if (overflowNodes().length > 0) {
        <nf-action-menu
          [nodes]="overflowNodes()"
          [size]="size()"
          [tooltip]="overflowTooltip()"
          (actionClick)="actionClick.emit($event)"
        />
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        flex: 0 0 auto;
      }
      .nf-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--nf-space-2, 8px);
      }
    `,
  ],
})
export class ToolbarComponent {
  private readonly confirmDialog = inject(ConfirmDialogService);

  /** Bar actions — buttons and cascades, any count. */
  readonly actions = input<ToolbarAction[]>([]);

  /**
   * Max non-pinned actions kept in the bar; the rest fold into « ⋯ ».
   * Set to a high number (e.g. 99) to disable overflow. Default 4.
   */
  readonly maxVisible = input<number>(4);

  readonly size = input<ButtonSize>('xs');
  readonly overflowTooltip = input<string>('More actions');

  readonly actionClick = output<string>();

  /** Visible actions, order-respecting (stable, config order by default). */
  private readonly orderedActions = computed(() =>
    this.actions()
      .map((action, index) => ({ action, index }))
      .filter(({ action }) => action.visible !== false)
      .sort((a, b) => {
        const oa = a.action.order;
        const ob = b.action.order;
        if (oa == null && ob == null) return a.index - b.index;
        if (oa == null) return 1;
        if (ob == null) return -1;
        return oa !== ob ? oa - ob : a.index - b.index;
      })
      .map(({ action }) => action)
  );

  /** Actions rendered directly in the bar. */
  readonly barActions = computed((): ToolbarAction[] => {
    const all = this.orderedActions();
    const pinned = all.filter((a) => this.isPinned(a));
    const rest = all.filter((a) => !this.isPinned(a));
    const slots = Math.max(0, this.maxVisible() - pinned.length);
    return [...rest.slice(0, slots), ...pinned].sort(
      (a, b) => all.indexOf(a) - all.indexOf(b)
    );
  });

  /** Overflowed actions as menu nodes for the « ⋯ » cascade. */
  readonly overflowNodes = computed((): ActionMenuNode[] => {
    const inBar = new Set(this.barActions().map((a) => a.id));
    return this.orderedActions()
      .filter((a) => !inBar.has(a.id))
      .map((a): ActionMenuNode => {
        if (this.hasChildren(a)) {
          const submenu: ActionMenuSubmenu = {
            kind: 'submenu',
            id: a.id,
            label: a.label ?? a.id,
            icon: a.icon,
            disabled: a.disabled,
            children: a.children ?? [],
          };
          return submenu;
        }
        return {
          id: a.id,
          label: a.label ?? a.id,
          icon: a.icon,
          danger: a.danger,
          disabled: a.disabled,
          tooltip: a.tooltip,
          confirm: a.confirm,
        };
      });
  });

  hasChildren(action: ToolbarAction): boolean {
    return (action.children?.length ?? 0) > 0;
  }

  private isPinned(action: ToolbarAction): boolean {
    if (action.pinned != null) return action.pinned;
    const variant = action.variant ?? (action.danger ? 'danger' : 'secondary');
    return variant === 'primary' || variant === 'danger';
  }

  async onItem(action: ToolbarAction): Promise<void> {
    if (action.disabled || action.loading) return;
    if (action.confirm) {
      const ok = await this.confirmDialog.confirm({
        title: 'Confirm',
        message: action.label ?? action.id,
        confirmLabel: action.label ?? action.id,
        variant: action.danger ? 'danger' : 'default',
      });
      if (!ok) return;
    }
    this.actionClick.emit(action.id);
  }
}
