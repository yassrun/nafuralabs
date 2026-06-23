/**
 * Motif Mouvement Detail Routes
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { MotifMouvementConfig } from '../../models';

export const ROUTES: DetailRouteConfig<MotifMouvementConfig> = {
  list: ['/inventory/configuration/motifs'],
  edit: (item) => ['/inventory/configuration/motifs', item.id],
  view: (item) => ['/inventory/configuration/motifs', item.id],
};
