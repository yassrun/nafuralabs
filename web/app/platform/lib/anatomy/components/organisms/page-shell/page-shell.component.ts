import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Page Shell Component
 *
 * Standard layout wrapper for feature pages.
 * Provides consistent padding, full-height flex layout, and optional scrolling.
 */
@Component({
  selector: 'nf-page-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="nf-page-shell"
      [class.nf-page-shell--scroll]="scroll()"
      [class.nf-page-shell--no-padding]="noPadding()">
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 0;
      }

      .nf-page-shell {
        display: flex;
        flex-direction: column;
        min-height: 100%;
        height: auto;
        padding: var(--nf-page-padding, var(--nf-space-4, 1rem));
        font-size: var(--nf-text-base, 0.875rem);
        line-height: var(--nf-leading-normal, 1.5);
        overflow: hidden;
        box-sizing: border-box;
      }

      .nf-page-shell--scroll {
        overflow: auto;
      }

      .nf-page-shell--no-padding {
        padding: 0;
      }
    `,
  ],
})
export class PageShellComponent {
  /** Enable scrolling for the page content */
  readonly scroll = input<boolean>(false);

  /** Remove default padding */
  readonly noPadding = input<boolean>(false);
}
