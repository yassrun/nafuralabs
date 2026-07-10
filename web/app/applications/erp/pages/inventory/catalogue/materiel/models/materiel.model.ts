/**
 * Matériel Model — Catalogue des engins et matériels de la flotte
 */

import type { MaterielStatus } from '@applications/erp/inventory/models';

export interface Materiel {
  id: string;
  code: string;
  name: string;
  description?: string;
  familleId?: string;
  familleName?: string;
  marque?: string;
  modele?: string;
  numeroSerie: string;
  anneeMiseEnService?: number;
  puissanceCapacite?: string;
  status: MaterielStatus;
  dateDernierEntretien?: string;
  prochaineMaintenance?: string;
  notesMaintenance?: string;
  chantierActuelId?: string;
  chantierActuelName?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type MaterielListItem = Pick<
  Materiel,
  | 'id'
  | 'code'
  | 'name'
  | 'familleId'
  | 'familleName'
  | 'marque'
  | 'modele'
  | 'numeroSerie'
  | 'status'
  | 'chantierActuelId'
  | 'chantierActuelName'
  | 'isActive'
>;

export type MaterielCreate = Omit<Materiel, 'id' | 'createdAt' | 'updatedAt'>;

export type MaterielUpdate = Partial<MaterielCreate>;

export interface MaterielQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  familleId?: string;
  status?: MaterielStatus;
}
