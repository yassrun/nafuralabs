export type SearchCategory = 'recent' | 'pages' | 'records' | 'actions';

export interface SearchResult {
  id: string;
  label: string;
  icon: string;
  route: string;
  breadcrumb?: string;
  subtitle?: string;
  category: SearchCategory;
  score?: number;
  visitedAt?: string;
  /** When set, used with entityId for deduplication in recent items. */
  entityType?: string;
  entityId?: string;
}

/** Payload for tracking a recent visit (e.g. from a detail page). */
export interface RecentItem {
  entityType: string;
  entityId: string;
  title: string;
  subtitle?: string;
  route: string;
  visitedAt: string;
}
