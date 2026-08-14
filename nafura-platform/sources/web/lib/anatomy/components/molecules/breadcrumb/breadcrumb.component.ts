import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { BreadcrumbItem } from '../../../types';

/**
 * Breadcrumb Component
 *
 * Navigation breadcrumb trail.
 *
 * @example
 * <nf-breadcrumb [items]="[
 *   { label: 'Home', route: '/' },
 *   { label: 'Locations', route: '/locations' },
 *   { label: 'New Location' }
 * ]"></nf-breadcrumb>
 */
@Component({
  selector: 'nf-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, LucideAngularModule],
  template: `
    <nav class="nf-breadcrumb" aria-label="Breadcrumb">
      <ol class="nf-breadcrumb__list">
        @for (item of items(); track item.label; let last = $last) {
          <li class="nf-breadcrumb__item">
            @if (item.route && !last) {
              <a
                class="nf-breadcrumb__link"
                [routerLink]="item.route"
                [queryParams]="item.queryParams"
              >
                @if (item.icon) {
                  <lucide-icon class="nf-breadcrumb__icon" [name]="item.icon" [size]="13"></lucide-icon>
                }
                {{ item.label | translate }}
              </a>
            } @else {
              <span class="nf-breadcrumb__text" [class.nf-breadcrumb__text--current]="last">
                @if (item.icon) {
                  <lucide-icon class="nf-breadcrumb__icon" [name]="item.icon" [size]="13"></lucide-icon>
                }
                {{ item.label | translate }}
              </span>
            }
            @if (!last) {
              <span class="nf-breadcrumb__separator" aria-hidden="true">{{ separator() }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: [`
    .nf-breadcrumb {
      font-size: var(--nf-breadcrumb-font-size, 0.75rem);
    }

    .nf-breadcrumb__list {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .nf-breadcrumb__item {
      display: flex;
      align-items: center;
    }

    .nf-breadcrumb__link,
    .nf-breadcrumb__text {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      text-decoration: none;
    }

    .nf-breadcrumb__link {
      color: var(--nf-breadcrumb-link-color, var(--nf-color-text-tertiary, #9ca3af));

      &:hover {
        color: var(--nf-breadcrumb-link-hover-color, var(--nf-color-text-secondary, #6b7280));
        text-decoration: underline;
      }
    }

    .nf-breadcrumb__text {
      color: var(--nf-breadcrumb-text-color, var(--nf-color-text-tertiary, #9ca3af));
    }

    .nf-breadcrumb__text--current {
      color: var(--nf-breadcrumb-current-color, var(--nf-color-text-secondary, #6b7280));
      font-weight: 500;
    }

    .nf-breadcrumb__separator {
      margin: 0 6px;
      color: var(--nf-breadcrumb-separator-color, var(--nf-color-text-disabled, #d1d5db));
    }

    .nf-breadcrumb__icon {
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
    }
  `],
})
export class BreadcrumbComponent {
  items = input.required<BreadcrumbItem[]>();
  separator = input<string>('/');
}
