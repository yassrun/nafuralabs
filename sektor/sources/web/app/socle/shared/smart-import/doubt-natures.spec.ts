import {
  partitionDoubts,
  type FieldIssue,
} from '@platform/features/documents/doc-extractor/models/extraction.model';

describe('partitionDoubts', () => {
  it('never fuses extraction doubts with source gaps', () => {
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
    const { extraction: left, sourceGap: right } = partitionDoubts([
      ...extraction,
      ...sourceGap,
    ]);
    expect(left).toHaveSize(4);
    expect(right).toHaveSize(75);
    expect(left.every((i) => i.kind !== 'MISSING_REQUIRED')).toBeTrue();
    expect(right.every((i) => i.kind === 'MISSING_REQUIRED')).toBeTrue();
  });
});
