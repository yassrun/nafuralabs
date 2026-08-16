import { resolveRootView, resolveTreeConfig } from './root-view.util';
import type { JsonSchemaRoot } from '../../models/json-schema.model';
import type { UiSchema } from '../../models/ui-schema.model';

describe('root-view.util', () => {
  const flatSchema: JsonSchemaRoot = {
    type: 'object',
    properties: {
      fournisseurs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            raisonSociale: { type: 'string' },
          },
        },
      },
    },
  };

  const nestedSchema: JsonSchemaRoot = {
    type: 'object',
    properties: {
      lots: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            sousLots: {
              type: 'array',
              items: { type: 'object', properties: { designation: { type: 'string' } } },
            },
          },
        },
      },
    },
  };

  it('honours explicit rootView', () => {
    const ui: UiSchema = { rootView: 'DATA_TABLE', sections: [] };
    expect(resolveRootView(ui, nestedSchema, 'lots')).toBe('DATA_TABLE');
  });

  it('auto-detects TREE_TABLE for nested arrays', () => {
    const ui: UiSchema = { sections: [] };
    expect(resolveRootView(ui, nestedSchema, 'lots')).toBe('TREE_TABLE');
  });

  it('auto-detects DATA_TABLE for flat arrays', () => {
    const ui: UiSchema = { sections: [] };
    expect(resolveRootView(ui, flatSchema, 'fournisseurs')).toBe('DATA_TABLE');
  });

  it('auto-detects RECORD_TABLE when sections + arrays', () => {
    const ui: UiSchema = {
      sections: [{ title: 'H', fields: [{ path: 'a', label: 'A' }] }],
      arrays: [{ path: 'items', title: 'Items', columns: [{ path: 'x', label: 'X' }] }],
    };
    const schema: JsonSchemaRoot = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { type: 'object', properties: { x: { type: 'string' } } },
        },
      },
    };
    expect(resolveRootView(ui, schema, 'items')).toBe('RECORD_TABLE');
  });

  it('resolves tree config defaults', () => {
    const ui: UiSchema = {
      sections: [],
      arrays: [{ path: 'lots', title: 'Lots', columns: [{ path: 'code', label: 'Code' }] }],
    };
    const tree = resolveTreeConfig(ui, 'lots');
    expect(tree.path).toBe('lots');
    expect(tree.columns[0].path).toBe('code');
    expect(tree.childrenPaths.length).toBeGreaterThan(0);
  });
});
