/**
 * Column Template Directive
 *
 * Used to define custom cell templates for entity listing columns.
 *
 * @example
 * ```html
 * <nf-entity-listing [config]="config" [facade]="facade">
 *   <ng-template nfColumn="status" let-value let-item="item">
 *     <nf-badge [variant]="getStatusVariant(value)">{{ value }}</nf-badge>
 *   </ng-template>
 * </nf-entity-listing>
 * ```
 */

import { Directive, Input, TemplateRef, inject } from '@angular/core';

@Directive({
  selector: '[nfColumn]',
  standalone: true,
})
export class ColumnTemplateDirective {
  /** Column key this template applies to */
  @Input({ required: true }) nfColumn!: string;

  readonly templateRef = inject(TemplateRef);
}
