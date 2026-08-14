/**
 * Costing Method Configuration Models
 */

export type CostingMethodType = 'AVCO' | 'FIFO' | 'STD';

export interface CostingMethodConfig {
  id: string;
  code: string;
  name: string;
  method: CostingMethodType;
  description?: string;
  isDefault?: boolean;
  isActive: boolean;
}

export type CostingMethodListItem = CostingMethodConfig;

export type CostingMethodCreate = Omit<CostingMethodConfig, 'id'>;

export type CostingMethodUpdate = Partial<CostingMethodCreate>;
