import {
  partitionDoubts,
  reclassifyDoubt,
  summarizeDoubts,
  type FieldIssue,
} from '@platform/app/document-extraction/models/extraction.model';

function villaIssues(): FieldIssue[] {
  const extraction: FieldIssue[] = [
    { path: 'u', rowIndex: 12, kind: 'TYPE_MISMATCH', message: 'M2 ?' },
    { path: 'code', rowIndex: 40, kind: 'FORMAT_INVALID', message: '1-1-7' },
    { path: 'qte', rowIndex: 88, kind: 'TYPE_MISMATCH', message: 'align' },
    { path: 'd', rowIndex: 101, kind: 'FORMAT_INVALID', message: 'wrap' },
  ];
  const sourceGap: FieldIssue[] = Array.from({ length: 75 }, (_, i) => ({
    path: 'qte',
    rowIndex: i,
    kind: 'MISSING_REQUIRED' as const,
    message: 'vide',
  }));
  return [...extraction, ...sourceGap];
}

describe('partitionDoubts', () => {
  it('never fuses extraction doubts with source gaps', () => {
    const { extraction: left, sourceGap: right } = partitionDoubts(villaIssues());
    expect(left).toHaveSize(4);
    expect(right).toHaveSize(75);
    expect(left.every((i) => i.kind !== 'MISSING_REQUIRED')).toBeTrue();
    expect(right.every((i) => i.kind === 'MISSING_REQUIRED')).toBeTrue();
  });
});

describe('summarizeDoubts', () => {
  it('exposes two counters and no fused review percent', () => {
    const summary = summarizeDoubts(villaIssues());
    expect(summary).toEqual({ extraction: 4, sourceGap: 75 });
    expect('percent' in summary).toBeFalse();
    expect(summary.extraction + summary.sourceGap).toBe(79);
  });
});

describe('reclassifyDoubt', () => {
  it('moves a source gap to extraction without mixing the rest', () => {
    const issues = villaIssues();
    const moved = reclassifyDoubt(issues[4], 'EXTRACTION');
    const next = [moved, ...issues.slice(5)];
    const summary = summarizeDoubts([...issues.slice(0, 4), ...next]);
    expect(summary.extraction).toBe(5);
    expect(summary.sourceGap).toBe(74);
  });
});
