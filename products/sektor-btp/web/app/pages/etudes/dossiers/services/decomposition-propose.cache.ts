import { Injectable } from '@angular/core';

import type { DecompositionPropose } from '../services/dossier-etude-api.service';

/**
 * Cache session des propositions IA.
 * Conserve toujours la réponse ayant le plus de composants afin qu'une réponse
 * Gemini plus courte ne remplace jamais une extraction plus complète.
 */
@Injectable({ providedIn: 'root' })
export class DecompositionProposeCache {
  private readonly store = new Map<string, DecompositionPropose>();
  private readonly inflight = new Map<string, Promise<DecompositionPropose | null>>();
  private readonly storagePrefix = 'sektor:decomposition-propose:v2:';

  key(dossierId: string, articleId: string, cpsDocumentId?: string | null): string {
    return `${dossierId}|${articleId}|${cpsDocumentId?.trim() || ''}`;
  }

  getOrLoad(
    dossierId: string,
    articleId: string,
    cpsDocumentId: string | null | undefined,
    loader: () => Promise<DecompositionPropose | null>,
  ): Promise<DecompositionPropose | null> {
    const k = this.key(dossierId, articleId, cpsDocumentId);
    const cached = this.read(k);
    if (cached) return Promise.resolve(cached);
    return this.load(k, loader);
  }

  /** Relance l'IA, mais conserve l'ancienne réponse si la nouvelle est plus courte. */
  refresh(
    dossierId: string,
    articleId: string,
    cpsDocumentId: string | null | undefined,
    loader: () => Promise<DecompositionPropose | null>,
  ): Promise<DecompositionPropose | null> {
    return this.load(this.key(dossierId, articleId, cpsDocumentId), loader);
  }

  private load(
    key: string,
    loader: () => Promise<DecompositionPropose | null>,
  ): Promise<DecompositionPropose | null> {
    const cached = this.read(key);
    const existing = this.inflight.get(key);
    if (existing) return existing;

    const promise = loader()
      .then((fresh) => {
        const best = this.count(fresh) > this.count(cached) ? fresh : cached;
        if (best) this.write(key, best);
        return best ?? null;
      })
      .finally(() => {
        this.inflight.delete(key);
      });
    this.inflight.set(key, promise);
    return promise;
  }

  private read(key: string): DecompositionPropose | undefined {
    const memory = this.store.get(key);
    if (memory) return memory;
    if (typeof sessionStorage === 'undefined') return undefined;
    try {
      const raw = sessionStorage.getItem(this.storagePrefix + key);
      if (!raw) return undefined;
      const value = JSON.parse(raw) as DecompositionPropose;
      this.store.set(key, value);
      return value;
    } catch {
      return undefined;
    }
  }

  private write(key: string, value: DecompositionPropose): void {
    this.store.set(key, value);
    if (typeof sessionStorage === 'undefined') return;
    try {
      sessionStorage.setItem(this.storagePrefix + key, JSON.stringify(value));
    } catch {
      // Le cache mémoire reste disponible si le stockage navigateur est plein/bloqué.
    }
  }

  private count(value?: DecompositionPropose | null): number {
    return (value?.matched?.length ?? 0) + (value?.missing?.length ?? 0);
  }
}
