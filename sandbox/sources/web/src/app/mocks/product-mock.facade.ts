import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Product {
  id: string;
  code: string;
  name: string;
  status: 'Active' | 'Draft';
  category?: 'Matériau' | 'Outillage' | 'Consommable';
  description?: string;
  createdAt?: string;
}

interface ProductDto {
  id: string;
  code: string;
  name: string;
  status: string;
  category: string;
  description?: string | null;
  createdAt?: string | null;
}

interface ProductPageDto {
  content: ProductDto[];
}

/**
 * Products facade backed by the Sandbox Spring Boot API (H2).
 * Kept under `mocks/` path for stable imports; no in-memory seed.
 */
@Injectable({ providedIn: 'root' })
export class ProductMockFacade {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/sandbox/products`;
  private readonly store = signal<Product[]>([]);
  private loaded = false;

  list(): Product[] {
    return this.store();
  }

  async refresh(): Promise<Product[]> {
    const response = await firstValueFrom(this.http.get<ProductPageDto>(this.baseUrl, { params: { size: '100' } }));
    const mapped = response.content.map((row) => this.fromDto(row));
    this.store.set(mapped);
    this.loaded = true;
    return mapped;
  }

  async ensureLoaded(): Promise<Product[]> {
    if (!this.loaded) {
      return this.refresh();
    }
    return this.store();
  }

  async getItem(id: string): Promise<Product> {
    const row = await firstValueFrom(this.http.get<ProductDto>(`${this.baseUrl}/${id}`));
    return this.fromDto(row);
  }

  async createItem(input: Partial<Product>): Promise<Product> {
    const body = {
      code: input.code ?? `PRD-${Date.now().toString().slice(-4)}`,
      name: input.name ?? 'New product',
      status: input.status ?? 'Draft',
      category: input.category ?? 'Matériau',
      description: input.description ?? null,
    };
    const created = await firstValueFrom(this.http.post<ProductDto>(this.baseUrl, body));
    const item = this.fromDto(created);
    this.store.update((xs) => [...xs, item].sort((a, b) => a.code.localeCompare(b.code)));
    return item;
  }

  async updateItem(id: string, input: Partial<Product>): Promise<Product> {
    const body = {
      code: input.code,
      name: input.name,
      status: input.status,
      category: input.category,
      description: input.description,
    };
    const updated = await firstValueFrom(this.http.put<ProductDto>(`${this.baseUrl}/${id}`, body));
    const item = this.fromDto(updated);
    this.store.update((xs) => xs.map((p) => (p.id === id ? item : p)));
    return item;
  }

  async deleteItem(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
    this.store.update((xs) => xs.filter((p) => p.id !== id));
  }

  private fromDto(row: ProductDto): Product {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      status: row.status === 'Draft' ? 'Draft' : 'Active',
      category: (row.category as Product['category']) || undefined,
      description: row.description ?? undefined,
      createdAt: row.createdAt ? row.createdAt.slice(0, 10) : undefined,
    };
  }
}
