/**
 * Motif Mouvement Listing Routes
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { MotifMouvementListItem } from '../../models';

export const ROUTES: ListingRouteConfig<MotifMouvementListItem> = {
  detail: (item) => ['/inventory/configuration/motifs', item.id],
  create: ['/inventory/configuration/motifs/new'],
  list: ['/inventory/configuration/motifs'],
};
