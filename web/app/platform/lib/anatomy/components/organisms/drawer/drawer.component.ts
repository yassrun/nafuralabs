import { Component, input, output, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * Drawer position types.
 */
export type DrawerPosition = 'left' | 'right';

/**
 * Drawer size types.
 */
export type DrawerSize = 'sm' | 'md' | 'lg';

/**
 * Drawer Component
 *
 * Side panel for details/forms.
 *
 * @example
 * <nf-drawer
 *   [open]="showDetails"
 *   title="Item Details"
 *   size="md"
 *   (closed)="closeDetails()">
 *
 *   <div class="drawer-content">
 *     <!-- Detail content -->
 *   </div>
 *
 *   <div class="drawer-footer">
 *     <nf-button variant="primary" (clicked)="edit()">Edit</nf-button>
 *   </div>
 * </nf-drawer>
 */
@Component({
  selector: 'nf-drawer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    @if (open()) {
      <div
        class="nf-drawer__backdrop"
        (click)="onBackdropClick()"
      ></div>
    }

    <div [class]="drawerClasses()">
      @if (title()) {
        <div class="nf-drawer__header">
          <h2 class="nf-drawer__title">{{ title() }}</h2>
          <button
            mat-icon-button
            class="nf-drawer__close"
            aria-label="Close"
            (click)="onClose()"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>
      }

      <div class="nf-drawer__body">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .nf-drawer__backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      animation: nf-drawer-fade-in 0.2s ease-out;
    }

    @keyframes nf-drawer-fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .nf-drawer {
      position: fixed;
      top: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      background-color: var(--nf-color-background, #fff);
      box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
      z-index: 1001;
      transform: translateX(100%);
      transition: transform 0.3s ease-out;
    }

    // Position — semantics are user-facing ("trailing edge" vs "leading edge") :
    // in RTL the drawer naturally flips with the writing direction via inset-inline-*.
    .nf-drawer--right {
      inset-inline-end: 0;
      transform: translateX(100%);
    }

    .nf-drawer--left {
      inset-inline-start: 0;
      transform: translateX(-100%);
    }

    // RTL mirror : the X-axis translate must invert when the inline axis flips
    // (because translateX stays in physical X, while inset-inline-* flips).
    :host-context([dir="rtl"]) .nf-drawer--right {
      transform: translateX(-100%);
    }

    :host-context([dir="rtl"]) .nf-drawer--left {
      transform: translateX(100%);
    }

    .nf-drawer--open.nf-drawer--right,
    .nf-drawer--open.nf-drawer--left {
      transform: translateX(0);
    }

    // Sizes
    .nf-drawer--sm {
      width: 320px;
    }

    .nf-drawer--md {
      width: 480px;
    }

    .nf-drawer--lg {
      width: 640px;
    }

    .nf-drawer__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid var(--nf-color-border, #e0e0e0);
      flex-shrink: 0;
    }

    .nf-drawer__title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--nf-color-text, #333);
    }

    .nf-drawer__close {
      // Original physical: margin: -8px -12px -8px 0 (top right bottom left) —
      // pulls the icon button toward the trailing edge of the header.
      margin-block: -8px;
      margin-inline-start: 0;
      margin-inline-end: -12px;
    }

    .nf-drawer__body {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }
  `],
})
export class DrawerComponent {
  // Inputs
  position = input<DrawerPosition>('right');
  size = input<DrawerSize>('md');
  title = input<string | undefined>(undefined);
  open = input<boolean>(false);
  closeOnBackdrop = input<boolean>(true);
  closeOnEscape = input<boolean>(true);

  // Outputs
  openChange = output<boolean>();
  closed = output<void>();

  // Computed
  drawerClasses = computed(() => {
    const classes = [
      'nf-drawer',
      `nf-drawer--${this.position()}`,
      `nf-drawer--${this.size()}`,
    ];

    if (this.open()) {
      classes.push('nf-drawer--open');
    }

    return classes.join(' ');
  });

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.open() && this.closeOnEscape()) {
      this.onClose();
    }
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop()) {
      this.onClose();
    }
  }

  onClose(): void {
    this.openChange.emit(false);
    this.closed.emit();
  }
}
