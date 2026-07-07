import {
  extractArrayRows,
  rowsWithIssues,
  validateRowRequired,
} from './smart-import.model';

describe('smart-import.model', () => {
  it('extractArrayRows returns object rows from array path', () => {
    const data = {
      fournisseurs: [
        { raisonSociale: 'ACME' },
        { raisonSociale: 'Beta SARL' },
      ],
    };
    expect(extractArrayRows(data, 'fournisseurs')).toHaveSize(2);
  });

  it('validateRowRequired flags missing raisonSociale', () => {
    const result = validateRowRequired({}, ['raisonSociale'], 0);
    expect(result.valid).toBeFalse();
    expect(result.issues[0].kind).toBe('MISSING_REQUIRED');
  });

  it('rowsWithIssues collects row indexes from validation', () => {
    const indexes = rowsWithIssues({
      state: 'INCOMPLETE',
      importPolicy: 'PARTIAL',
      issues: [
        { path: 'raisonSociale', rowIndex: 1, kind: 'MISSING_REQUIRED', message: 'x' },
        { path: 'ice', rowIndex: 3, kind: 'TYPE_MISMATCH', message: 'y' },
      ],
    });
    expect(indexes.has(1)).toBeTrue();
    expect(indexes.has(3)).toBeTrue();
    expect(indexes.has(0)).toBeFalse();
  });
});
