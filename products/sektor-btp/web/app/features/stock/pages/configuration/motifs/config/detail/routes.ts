/**
 * Motif Mouvement Detail Routes
 */

import type { DetailRouteConfig } from '@lib/anatomy/types';
import type { MotifMouvementConfig } from '../../models';

export const ROUTES: DetailRouteConfig<MotifMouvementConfig> = {
  list: ['/stock/configuration/motifs'],
  edit: (item) => ['/stock/configuration/motifs', item.id],
  view: (item) => ['/stock/configuration/motifs', item.id],
};
