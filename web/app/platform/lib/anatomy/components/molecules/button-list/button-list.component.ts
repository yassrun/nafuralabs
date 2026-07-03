import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent, ButtonVariant, ButtonSize } from '../../atoms/button';

/** Variant for sort order: ghost => tertiary => secondary => danger => primary (primary last, right). */
const VARIANT_ORDER: Record<ButtonVariant, number> = {
  ghost: 0,
  tertiary: 1,
  secondary: 2,
  stroked: 2,
  danger: 3,
  primary: 4,
};

/**
 * Single action for the button list (MVP).
 * - variant: primary | secondary | tertiary (with or without icon, or icon-only when label empty).
 * - disabled, active, loading, visible: optional; visible defaults to true.
 */
export interface ButtonListItem {
  id: string;
  /** Button variant. Default secondary if omitted. */
  variant?: ButtonVariant;
  /** Button label; empty string = icon-only (set ariaLabel for a11y). */
  label?: string;
  icon?: string;
  ariaLabel?: string;
  /** Tooltip text shown on hover. */
  tooltip?: string;
  /** Lower values are rendered first. */
  order?: number;
  disabled?: boolean;
  active?: boolean;
  loading?: boolean;
  /** When false, button is not rendered. Default true. */
  visible?: boolean;
}

/**
 * Display mode. Kept for API compatibility; MVP only renders horizontal.
 */
export type ButtonListView = 'list' | 'horizontal' | 'icons' | 'menu';

/**
 * Responsive config. Kept for API compatibility.
 */
export interface ButtonListResponsiveConfig {
  breakpointPx: number;
  fallbackView: 'menu' | 'icons';
}

/**
 * Button List Component (MVP)
 *
 * Renders a horizontal list of buttons. List size applied to all buttons.
 * Actions sorted by variant: secondary (and tertiary) first, primary last.
 * Each action: variant, icon, label, disabled, active, loading, visible.
 */
@Component({
  selector: 'nf-button-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonComponent],
  template: `
    <div class="nf-button-list">
      @for (action of sortedActions(); track action.id) {
        <nf-button
          [variant]="action.variant ?? 'secondary'"
          [size]="size()"
          [icon]="action.icon"
          [iconLibrary]="iconLibrary()"
          [disabled]="action.disabled ?? false"
          [active]="action.active ?? false"
          [loading]="action.loading ?? false"
          [tooltip]="(action.tooltip ?? action.ariaLabel ?? '') | translate"
          [attr.aria-label]="(action.ariaLabel ?? action.label ?? action.id) | translate"
          (clicked)="onActionClick(action.id)">
          {{ (action.label || '') | translate }}
        </nf-button>
      }
    </div>
  `,
  styles: [
    `
      .nf-button-list {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--nf-button-list-gap, 4px);
      }
    `,
  ],
})
export class ButtonListComponent {
  actions = input.required<ButtonListItem[]>();
  /** Size applied to all buttons. */
  size = input<ButtonSize>('sm');
  /** Icon library for buttons: 'lucide' (default in button list) or 'material'. Use Lucide kebab-case names (e.g. trash-2, plus). */
  iconLibrary = input<'material' | 'lucide'>('lucide');

  /** Kept for API compatibility; MVP ignores. */
  view = input<ButtonListView>('horizontal');
  /** Kept for API compatibility; MVP ignores. */
  responsive = input<ButtonListResponsiveConfig | undefined>(undefined);
  menuTriggerIcon = input<string>('more_vert');
  menuTriggerAriaLabel = input<string>('Actions');
  variant = input<ButtonVariant>('secondary');

  actionClick = output<string>();

  /** Filter visible actions (preserves original order from config). */
  sortedActions = computed(() => {
    return this.actions()
      .map((action, index) => ({ action, index }))
      .filter(({ action }) => action.visible !== false)
      .sort((a, b) => {
        const oa = a.action.order;
        const ob = b.action.order;
        if (oa == null && ob == null) return a.index - b.index;
        if (oa == null) return 1;
        if (ob == null) return -1;
        if (oa !== ob) return oa - ob;
        return a.index - b.index;
      })
      .map(({ action }) => action);
  });

  onActionClick(id: string): void {
    this.actionClick.emit(id);
  }
}
