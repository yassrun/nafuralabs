/**
 * Calendar Model — Auto-generated from calendar.entity.json
 * Do NOT edit fields here. Edit the .entity.json and regenerate.
 */

export interface Calendar {
  id: string;
  code: string;
  name: string;
  timeZoneId: string | null;
  description: string | null;
  isActive: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export type CalendarListItem = Pick<Calendar,
  'id' | 'code' | 'name' | 'isActive' | 'createdAt' | 'updatedAt'
>;

export type CalendarCreate = Omit<Calendar, 'id' | 'createdAt' | 'updatedAt'>;

export type CalendarUpdate = Partial<CalendarCreate>;

export interface CalendarQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  code?: string;
  name?: string;
}
