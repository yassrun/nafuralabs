import { LOT_CHANTIER_EXTRACTION_SCHEMA } from './lot-chantier.schema';
import type {
  JsonSchemaArray,
  JsonSchemaObject,
} from '@platform/app/document-extraction/models/json-schema.model';

describe('LOT_CHANTIER_EXTRACTION_SCHEMA', () => {
  it('extracts business values without document codes', () => {
    const root = LOT_CHANTIER_EXTRACTION_SCHEMA.dataSchema;
    const lots = root.properties?.['lots'] as JsonSchemaArray;
    const lot = lots.items as JsonSchemaObject;
    const child = (lot.properties?.['children'] as JsonSchemaArray).items as JsonSchemaObject;
    const nestedPoste = (child.properties?.['postes'] as JsonSchemaArray)
      .items as JsonSchemaObject;
    const directPoste = (lot.properties?.['postes'] as JsonSchemaArray)
      .items as JsonSchemaObject;

    expect(lot?.required).toEqual(['designation']);
    expect(lot?.properties?.['code']).toBeUndefined();
    expect(lot?.properties?.['sousLots']).toBeUndefined();
    expect(child?.properties?.['code']).toBeUndefined();
    expect(nestedPoste?.required).toEqual(['designation']);
    expect(nestedPoste?.properties?.['code']).toBeUndefined();
    expect(directPoste?.properties?.['code']).toBeUndefined();
    expect(child.properties?.['children']).toBeDefined();
  });

  it('does not display source codes in the review tree', () => {
    const paths = LOT_CHANTIER_EXTRACTION_SCHEMA.presentationSchema.tree?.columns.map(
      (column) => column.path,
    );
    expect(paths).not.toContain('code');
    expect(LOT_CHANTIER_EXTRACTION_SCHEMA.presentationSchema.tree?.childrenPaths).toEqual([
      'children',
      'postes',
    ]);
    expect(LOT_CHANTIER_EXTRACTION_SCHEMA.instructions).toContain(
      'Ignore source numbering',
    );
  });
});
