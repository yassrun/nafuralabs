/**
 * Field Template Directive
 *
 * Allows custom field templates in entity-detail component.
 *
 * @example
 * ```html
 * <nf-entity-detail [config]="config" [mode]="'edit'" [item]="item">
 *   <ng-template nfField="customField" let-control let-field="field">
 *     <my-custom-input [formControl]="control" [config]="field.config">
 *     </my-custom-input>
 *   </ng-template>
 * </nf-entity-detail>
 * ```
 */

import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[nfField]',
  standalone: true,
})
export class FieldTemplateDirective {
  @Input() nfField!: string;

  constructor(public templateRef: TemplateRef<any>) {}
}
