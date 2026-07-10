/**
 * NumberingSequence Model — Auto-generated from numbering-sequence.entity.json
 * Do NOT edit fields here. Edit the .entity.json and regenerate.
 */

export interface NumberingSequence {
  id: string;
  code: string;
  name: string;
  prefix: string | null;
  separator: string | null;
  resetPolicy: string | null;
  yearFormat: string | null;
  lastResetAt: string | null;
  currentNumber: number;
  incrementBy: number;
  padLength: number;
  createdAt: string;
  updatedAt: string;
}

export type NumberingSequenceListItem = Pick<NumberingSequence,
  'id' | 'code' | 'name' | 'prefix' | 'separator' | 'resetPolicy' | 'yearFormat' | 'currentNumber' | 'padLength' | 'createdAt' | 'updatedAt'
>;

export type NumberingSequenceCreate = Omit<NumberingSequence, 'id' | 'createdAt' | 'updatedAt'>;

export type NumberingSequenceUpdate = Partial<NumberingSequenceCreate>;

export interface NumberingSequenceQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  code?: string;
  name?: string;
}
