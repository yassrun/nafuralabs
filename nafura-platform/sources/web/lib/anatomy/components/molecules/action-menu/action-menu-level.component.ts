import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';

import type {
  ActionMenuDivider,
  ActionMenuLeaf,
  ActionMenuNode,
  ActionMenuSubmenu,
} from './action-menu.types';

/**
 * One menu level (a `<mat-menu>` panel) of `nf-action-menu`.
 *
 * Recursive: submenu nodes render another `nf-action-menu-level` right after
 * their trigger item. Content is lazy (`matMenuContent`) so nested levels only
 * instantiate when the parent panel opens.
 *
 * Internal building block — consumers use `nf-action-menu`.
 */
@Component({
  selector: 'nf-action-menu-level',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatTooltipModule, LucideAngularModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-menu class="nf-action-menu-panel" [xPosition]="xPosition()">
      <ng-template matMenuContent>
        @for (node of renderedNodes(); track trackKey($index, node)) {
          @if (isDivider(node)) {
            <div class="nf-action-menu-panel__divider" role="separator"></div>
          } @else if (isSubmenu(node)) {
            <button
              mat-menu-item
              type="button"
              class="nf-action-menu-item"
              [disabled]="node.disabled ?? false"
              [matMenuTriggerFor]="sub.menu()"
            >
              @if (node.icon) {
                <lucide-icon
                  [name]="node.icon"
                  [size]="16"
                  class="nf-action-menu-item__icon"
                />
              }
              <span class="nf-action-menu-item__label">{{ node.label | translate }}</span>
              <lucide-icon
                name="chevron-right"
                [size]="14"
                class="nf-action-menu-item__chevron"
              />
            </button>
            <nf-action-menu-level
              #sub
              [nodes]="node.children"
              (nodeClick)="nodeClick.emit($event)"
            />
          } @else {
            <button
              mat-menu-item
              type="button"
              class="nf-action-menu-item"
              [class.nf-action-menu-item--danger]="isDanger(node)"
              [disabled]="isLeafDisabled(node)"
              [matTooltip]="leafTooltip(node)"
              [matTooltipDisabled]="!leafTooltip(node)"
              (click)="onLeaf(node)"
            >
              @if (node.icon) {
                <lucide-icon
                  [name]="node.icon"
                  [size]="16"
                  class="nf-action-menu-item__icon"
                />
              }
              <span class="nf-action-menu-item__label">{{ node.label | translate }}</span>
            </button>
          }
        }
      </ng-template>
    </mat-menu>
  `,
  styles: [
    `
      .nf-action-menu-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
      }
      .nf-action-menu-item__icon {
        display: inline-flex;
        flex: 0 0 auto;
        color: var(--nf-text-muted, #6b7280);
      }
      .nf-action-menu-item__label {
        flex: 1 1 auto;
        text-align: left;
      }
      .nf-action-menu-item__chevron {
        display: inline-flex;
        flex: 0 0 auto;
        margin-left: auto;
        color: var(--nf-text-muted, #6b7280);
      }
      .nf-action-menu-item--danger,
      .nf-action-menu-item--danger .nf-action-menu-item__icon {
        color: var(--nf-color-danger, #d32f2f);
      }
      .nf-action-menu-panel__divider {
        height: 1px;
        margin: 4px 8px;
        background: var(--nf-color-border, #e5e7eb);
      }
    `,
  ],
})
export class ActionMenuLevelComponent {
  /** Nodes rendered in this panel. */
  readonly nodes = input.required<ActionMenuNode[]>();

  /**
   * Horizontal alignment vs trigger. Root level: 'before' for a right-aligned
   * « ⋯ » trigger. Nested levels keep the default 'after' (open to the right,
   * top-aligned — Material nested positioning).
   */
  readonly xPosition = input<'before' | 'after'>('after');

  /** Leaf click — bubbles up through every level to nf-action-menu. */
  readonly nodeClick = output<ActionMenuLeaf>();

  /** MatMenu of this level — the parent trigger attaches to it. */
  readonly menu = viewChild.required(MatMenu);

  readonly renderedNodes = computed(() => this.nodes().filter((n) => n.visible !== false));

  isDivider(node: ActionMenuNode): node is ActionMenuDivider {
    return node.kind === 'divider';
  }

  /** Submenu with actual children — empty submenus fall through as disabled items. */
  isSubmenu(node: ActionMenuNode): node is ActionMenuSubmenu {
    return node.kind === 'submenu' && (node.children?.length ?? 0) > 0;
  }

  isDanger(node: ActionMenuNode): boolean {
    return node.kind !== 'divider' && node.kind !== 'submenu' && (node.danger ?? false);
  }

  isLeafDisabled(node: ActionMenuNode): boolean {
    if (node.kind === 'divider') return true;
    if (node.kind === 'submenu') return true; // empty submenu (non-empty = isSubmenu branch)
    return node.disabled ?? false;
  }

  leafTooltip(node: ActionMenuNode): string {
    return node.kind !== 'divider' && node.kind !== 'submenu' ? (node.tooltip ?? '') : '';
  }

  trackKey(index: number, node: ActionMenuNode): string {
    return node.kind === 'divider' ? `divider-${index}` : node.id;
  }

  onLeaf(node: ActionMenuNode): void {
    if (node.kind === 'divider' || node.kind === 'submenu') return;
    if (node.disabled) return;
    this.nodeClick.emit(node);
  }
}
