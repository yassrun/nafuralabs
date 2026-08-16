import type { UiTreeConfig } from '../../models/ui-schema.model';

import {
  buildSmartImportTreeNodes,
  flattenSmartImportTree,
  getRelativeValue,
} from './tree-flatten.util';

describe('tree-flatten.util', () => {
  const tree: UiTreeConfig = {
    path: 'lots',
    childrenPaths: ['sousLots', 'postes'],
    columns: [{ path: 'code', label: 'Code' }],
    levelLabels: {
      lots: 'Lot',
      sousLots: 'Sous-lot',
      postes: 'Poste',
    },
  };

  const rows = [{
    status: 'READY' as const,
    issues: [{
      path: 'lots[0].sousLots[0].code',
      rowIndex: 0,
      kind: 'MISSING_REQUIRED' as const,
      message: 'Code requis',
    }],
    data: {
      code: 'L01',
      sousLots: [{
        code: '',
        postes: [{ code: 'P01' }],
      }],
    },
  }];

  it('builds nested nodes and preserves heterogeneous level metadata', () => {
    const nodes = buildSmartImportTreeNodes({ rows, tree });

    expect(nodes.length).toBe(1);
    expect(nodes[0].data.levelLabel).toBe('Lot');
    expect(nodes[0].data.status).toBe('NEEDS_REVIEW');
    expect(nodes[0].children?.[0].data.levelLabel).toBe('Sous-lot');
    expect(nodes[0].children?.[0].children?.[0].data.levelLabel).toBe('Poste');
    expect(nodes[0].children?.[0].data.issues.length).toBe(1);
    expect(nodes[0].children?.[0].key).toBe('lots[0].sousLots[0]');
  });

  it('keeps ignored root status on every descendant', () => {
    const ignoredRows = [{ ...rows[0], status: 'IGNORED' as const }];
    const flat = flattenSmartImportTree({ rows: ignoredRows, tree });

    expect(flat.every((node) => node.status === 'IGNORED')).toBeTrue();
  });

  it('reads dotted relative values safely', () => {
    expect(getRelativeValue({ amount: { value: 42 } }, 'amount.value')).toBe(42);
    expect(getRelativeValue({ amount: null }, 'amount.value')).toBeUndefined();
  });
});
