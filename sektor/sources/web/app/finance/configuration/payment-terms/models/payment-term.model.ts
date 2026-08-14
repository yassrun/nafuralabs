/**
 * PaymentTerm Model — Auto-generated from payment-term.entity.json
 * Do NOT edit fields here. Edit the .entity.json and regenerate.
 */

export interface PaymentTerm {
  id: string;
  code: string;
  name: string;
  days: number;
  discountDays?: number;
  discountPercent?: number;
  description?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PaymentTermListItem = Pick<PaymentTerm,
  'id' | 'code' | 'name' | 'days' | 'isActive' | 'createdAt' | 'updatedAt'
>;

export type PaymentTermCreate = Omit<PaymentTerm, 'id' | 'createdAt' | 'updatedAt'>;

export type PaymentTermUpdate = Partial<PaymentTermCreate>;

export interface PaymentTermQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  code?: string;
  name?: string;
}
