/**
 * Tag API Service — Auto-generated from tag.entity.json
 * Safe to regenerate — custom logic goes in the facade.
 */

import { Injectable } from '@angular/core';
import { FeatureApiService } from '@lib/anatomy';
import type { Tag, TagCreate, TagUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class TagsApiService extends FeatureApiService<Tag, TagCreate, TagUpdate> {
  protected override basePath = '/api/v1/tags';
  protected override searchFields = ['code', 'name'];
}
