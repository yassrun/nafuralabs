/**
 * Anatomy Config - Default configurations and builders
 */

// ─── Listing Config ───────────────────────────────────────────────────────────

export { DEFAULT_LISTING_ACTIONS } from './default-listing-actions.config';

export {
  // Constants
  DEFAULT_PAGINATION,
  DEFAULT_VIEW_MODES,
  DEFAULT_FEATURES,
  // Builders
  buildListingActions,
  buildListingConfig,
} from './listing-config.builder';

export type {
  ListingActionsOverrides,
  ListingConfigRequired,
  ListingConfigOverrides,
} from './listing-config.builder';

// ─── Detail Config ────────────────────────────────────────────────────────────

export { DEFAULT_DETAIL_ACTIONS } from './default-detail-actions.config';

export {
  buildDetailActions,
  buildDetailConfig,
} from './detail-config.builder';

export type {
  DetailActionsOverrides,
  DetailConfigRequired,
  DetailConfigOverrides,
} from './detail-config.builder';
