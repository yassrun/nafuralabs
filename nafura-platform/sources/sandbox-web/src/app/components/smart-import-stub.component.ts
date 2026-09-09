import { Component, ChangeDetectionStrategy, output } from '@angular/core';

import {
  SmartImportActionComponent,
  type ReviewedExtraction,
} from '@platform/app/document-extraction/smart-import';

import { PRODUCT_IMPORT_DEFINITION } from '../mocks/product-import.definition';

/**
 * Showroom host for `nf-smart-import-action` with a Product ExtractionDefinition.
 * File import still needs extraction API + tenant; Info champs works offline from the schema.
 */
@Component({
  selector: 'sb-smart-import-stub',
  standalone: true,
  imports: [SmartImportActionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-smart-import-action
      [definition]="definition"
      (completed)="completed.emit($event)"
    />
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
    `,
  ],
})
export class SmartImportStubComponent {
  readonly definition = PRODUCT_IMPORT_DEFINITION;
  readonly completed = output<ReviewedExtraction>();
}
