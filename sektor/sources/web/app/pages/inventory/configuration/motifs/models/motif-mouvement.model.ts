/**
 * Motif Mouvement Configuration Models
 */

import type { TxType } from '../../../../../inventory/models';

export interface MotifMouvementConfig {
  id: string;
  code: string;
  name: string;
  txType: TxType;
  isActive: boolean;
}

export type MotifMouvementListItem = MotifMouvementConfig;

export type MotifMouvementCreate = Omit<MotifMouvementConfig, 'id'>;

export type MotifMouvementUpdate = Partial<MotifMouvementCreate>;
