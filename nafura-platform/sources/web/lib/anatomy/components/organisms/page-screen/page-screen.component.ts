import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  PageHeaderComponent,
  type PageHeaderAction,
  type PageHeaderConfig,
} from '../../molecules/page-header';
import { PageShellComponent } from '../page-shell';

/**
 * Screen chrome for one route: header + breadcrumbs + body.
 * Listing / detail / dashboard / special fill the body.
 */
@Component({
  selector: 'nf-screen',
  standalone: true,
  imports: [CommonModule, PageShellComponent, PageHeaderComponent],
  template: `
    <nf-page-shell [scroll]="scroll()" [noPadding]="noPadding()">
      <nf-page-header [config]="header()" (actionClick)="actionClick.emit($event)">
        <ng-content select="[actions]"></ng-content>
      </nf-page-header>
      <div class="nf-screen__body">
        <ng-content></ng-content>
      </div>
    </nf-page-shell>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 0;
        height: 100%;
      }

      nf-page-shell {
        flex: 1 1 auto;
        min-height: 0;
        height: 100%;
      }

      .nf-screen__body {
        display: flex;
        flex-direction: column;
        flex: 1 1 0;
        min-height: 0;
      }
    `,
  ],
})
export class ScreenComponent {
  /** Title, subtitle, breadcrumbs (and rare header actions via config). */
  readonly header = input.required<PageHeaderConfig>();

  /** Scroll the whole screen (long forms). Default: body fills, listing scrolls inside. */
  readonly scroll = input<boolean>(false);

  readonly noPadding = input<boolean>(false);

  readonly actionClick = output<{ type: 'primary' | 'secondary'; action: PageHeaderAction }>();
}
