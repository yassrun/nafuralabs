import { issuesForRootIndex, validateObjectDeep } from './nested-validation.util';
import type { JsonSchemaObject } from '../../doc-extractor/models/json-schema.model';

describe('nested-validation.util', () => {
  const lotItemSchema: JsonSchemaObject = {
    type: 'object',
    required: ['designation'],
    properties: {
      designation: { type: ['string', 'null'] },
      sousLots: {
        type: 'array',
        items: {
          type: 'object',
          required: ['designation'],
          properties: {
            designation: { type: ['string', 'null'] },
            postes: {
              type: 'array',
              items: {
                type: 'object',
                required: ['designation'],
                properties: {
                  designation: { type: ['string', 'null'] },
                },
              },
            },
          },
        },
      },
    },
  };

  it('accepts a nested tree without document codes', () => {
    const issues = validateObjectDeep(
      {
        designation: 'Terrassement',
        sousLots: [
          {
            designation: 'Section',
            postes: [{ designation: 'Article' }],
          },
        ],
      },
      lotItemSchema,
      'lots[0]',
      0,
    );
    expect(issues).toEqual([]);
  });

  it('still emits nested paths for missing business designations', () => {
    const issues = validateObjectDeep(
      {
        designation: 'Terrassement',
        sousLots: [
          {
            designation: 'Section',
            postes: [{ designation: null }],
          },
        ],
      },
      lotItemSchema,
      'lots[0]',
      0,
    );
    expect(
      issues.some((i) => i.path === 'lots[0].sousLots[0].postes[0].designation'),
    ).toBeTrue();
    expect(issues.every((i) => i.nature === 'SOURCE_GAP')).toBeTrue();
  });

  it('scopes issues to root index', () => {
    const all = [
      { path: 'lots[0].code', rowIndex: 0, kind: 'MISSING_REQUIRED' as const, message: 'x' },
      { path: 'lots[1].sousLots[0].designation', rowIndex: 0, kind: 'MISSING_REQUIRED' as const, message: 'y' },
    ];
    expect(issuesForRootIndex(all, 'lots', 0)).toHaveSize(1);
    expect(issuesForRootIndex(all, 'lots', 1)).toHaveSize(1);
  });
});
