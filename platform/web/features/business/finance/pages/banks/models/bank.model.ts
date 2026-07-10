/**
 * Bank Model — Auto-generated from bank.entity.json
 * Do NOT edit fields here. Edit the .entity.json and regenerate.
 */

export interface Bank {
  id: string;
  code: string;
  name: string;
  swiftCode: string | null;
  countryId: string | null;
  isActive: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export type BankListItem = Pick<Bank,
  'id' | 'code' | 'name' | 'swiftCode' | 'countryId' | 'isActive' | 'createdAt' | 'updatedAt'
>;

export type BankCreate = Omit<Bank, 'id' | 'createdAt' | 'updatedAt'>;

export type BankUpdate = Partial<BankCreate>;

export interface BankQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  code?: string;
  name?: string;
  countryId?: string;
}
