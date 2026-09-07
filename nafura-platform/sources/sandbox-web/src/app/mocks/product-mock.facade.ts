import { Injectable, signal } from '@angular/core';

export interface Product {
  id: string;
  code: string;
  name: string;
  status: 'Active' | 'Draft';
  description?: string;
}

const SEED: Product[] = [
  { id: 'prd-01', code: 'PRD-01', name: 'Ciment CPJ 45', status: 'Active', description: 'Sac 50 kg' },
  { id: 'prd-02', code: 'PRD-02', name: 'Fer 12 mm', status: 'Active', description: 'Barre 12 m' },
  { id: 'prd-03', code: 'PRD-03', name: 'Sable 0/2', status: 'Draft', description: 'm³' },
  { id: 'prd-04', code: 'PRD-04', name: 'Gravier 5/15', status: 'Active' },
  { id: 'prd-05', code: 'PRD-05', name: 'Béton C25/30', status: 'Draft' },
];

@Injectable({ providedIn: 'root' })
export class ProductMockFacade {
  private readonly store = signal<Product[]>([...SEED]);

  list(): Product[] {
    return this.store();
  }

  async getItem(id: string): Promise<Product> {
    const item = this.store().find((p) => p.id === id);
    if (!item) throw new Error(`Product ${id} not found`);
    return { ...item };
  }

  async createItem(input: Partial<Product>): Promise<Product> {
    const id = `prd-${Date.now()}`;
    const item: Product = {
      id,
      code: input.code ?? `PRD-${id.slice(-4)}`,
      name: input.name ?? 'New product',
      status: (input.status as Product['status']) ?? 'Draft',
      description: input.description,
    };
    this.store.update((xs) => [...xs, item]);
    return item;
  }

  async updateItem(id: string, input: Partial<Product>): Promise<Product> {
    let updated: Product | undefined;
    this.store.update((xs) =>
      xs.map((p) => {
        if (p.id !== id) return p;
        updated = { ...p, ...input, id };
        return updated;
      })
    );
    if (!updated) throw new Error(`Product ${id} not found`);
    return updated;
  }
}
