/**
 * Motif Mouvement Listing Routes
 */

import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { MotifMouvementListItem } from '../../models';

export const ROUTES: ListingRouteConfig<MotifMouvementListItem> = {
  detail: (item) => ['/stock/configuration/motifs', item.id],
  create: ['/stock/configuration/motifs/new'],
  list: ['/stock/configuration/motifs'],
};
