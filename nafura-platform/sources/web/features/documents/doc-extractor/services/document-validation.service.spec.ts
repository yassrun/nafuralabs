import { DocumentValidationService } from './document-validation.service';
import { JsonSchemaRoot } from '../models/json-schema.model';
import { UiSchema } from '../models/ui-schema.model';

describe('DocumentValidationService', () => {
  const service = new DocumentValidationService();

  it('blocks validation and identifies the invalid row when one record misses a required field', () => {
    const schema: JsonSchemaRoot = {
      type: 'object',
      properties: {
        invoices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              number: { type: 'string' },
              total: { type: 'number' },
            },
            required: ['number', 'total'],
          },
        },
      },
      required: ['invoices'],
    };
    const presentation: UiSchema = {
      sections: [],
      arrays: [{
        path: 'invoices',
        title: 'Invoices',
        columns: [
          { path: 'number', label: 'Invoice number' },
          { path: 'total', label: 'Total' },
        ],
      }],
    };

    const result = service.validateDocument(
      {
        invoices: [
          { number: 'INV-1', total: 100 },
          { number: '', total: 50 },
        ],
      },
      schema,
      presentation
    );

    expect(result.isValid).toBeFalse();
    expect(result.errors).toContain(jasmine.objectContaining({
      field: 'invoices[1].number',
      code: 'REQUIRED_FIELD_MISSING',
    }));
  });
});
