/**
 * Calendar API Service — Auto-generated from calendar.entity.json
 * Safe to regenerate — custom logic goes in the facade.
 */

import { Injectable } from '@angular/core';
import { FeatureApiService } from '@lib/anatomy';
import type { Calendar, CalendarCreate, CalendarUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class CalendarsApiService extends FeatureApiService<Calendar, CalendarCreate, CalendarUpdate> {
  protected override basePath = '/api/v1/calendars';
  protected override searchFields = ['code', 'name'];
}
