import { buildInstructionsForMode } from './import-mode.util';

describe('import-mode.util', () => {
  it('adds bulk hint to base instructions', () => {
    const result = buildInstructionsForMode('Base rules.', 'articles', 'bulk');
    expect(result).toContain('Base rules.');
    expect(result).toContain('BULK TABLE');
    expect(result).toContain('"articles"');
  });

  it('adds single-record hint', () => {
    const result = buildInstructionsForMode(undefined, 'fournisseurs', 'single');
    expect(result).toContain('SINGLE RECORD');
    expect(result).toContain('"fournisseurs"');
  });
});
