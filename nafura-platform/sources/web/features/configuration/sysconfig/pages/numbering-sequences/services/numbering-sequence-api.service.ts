/**
 * NumberingSequence API Service — Auto-generated from numbering-sequence.entity.json
 * Safe to regenerate — custom logic goes in the facade.
 */

import { Injectable } from '@angular/core';
import { FeatureApiService } from '@lib/anatomy';
import type { NumberingSequence, NumberingSequenceCreate, NumberingSequenceUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class NumberingSequencesApiService extends FeatureApiService<NumberingSequence, NumberingSequenceCreate, NumberingSequenceUpdate> {
  protected override basePath = '/api/v1/numbering-sequences';
  protected override searchFields = ['code', 'name', 'prefix'];
}
