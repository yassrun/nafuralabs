import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ToastService } from '@lib/anatomy/components/services/toast.service';

import { ChantierApiService } from '../pages/chantiers/services/chantier-api.service';

function normalizeLegacyChantierId(raw: string): string {
  const t = raw.trim();
  const compact = /^ch(\d{3})$/i.exec(t);
  if (compact) return `ch-${compact[1].toLowerCase()}`;
  return t;
}

function extractNumericSuffixFromChantierCode(code: string): string | null {
  const m = /-(\d{3})$/i.exec(code.trim());
  return m ? m[1] : null;
}

/**
 * Drill-down depuis une ligne de listing (DA, BC, facture, HSE, etc.)
 * vers la fiche chantier `/chantiers/:id`.
 */
@Injectable({ providedIn: 'root' })
export class ChantierDrilldownService {
  private readonly router = inject(Router);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly toast = inject(ToastService);

  private lookupCache = new Map<string, string>();

  /**
   * @returns true si la navigation a été lancée ou si l’utilisateur a été informé (action consommée).
   */
  tryNavigateFromRow(row: unknown): boolean {
    void this.resolveCanonicalChantierId(row).then((id) => {
      if (!id) {
        this.toast.warning('Impossible d’ouvrir le chantier : lien indisponible ou chantier non renseigné.');
        return;
      }
      void this.router.navigate(['/chantiers', id]);
    });
    return true;
  }

  async resolveCanonicalChantierId(row: unknown): Promise<string | null> {
    if (!row || typeof row !== 'object') {
      return null;
    }
    const r = row as Record<string, unknown>;

    const fromId = await this.tryResolveId(r['chantierId'] as string | undefined);
    if (fromId) {
      return fromId;
    }

    const codeRaw = r['chantierCode'];
    if (typeof codeRaw !== 'string' || !codeRaw.trim()) {
      return null;
    }
    return this.tryResolveCode(codeRaw.trim());
  }

  private async tryResolveId(id: string | undefined): Promise<string | null> {
    if (!id || typeof id !== 'string') {
      return null;
    }
    const trimmed = id.trim();
    if (!trimmed) {
      return null;
    }
    const resolved = await this.resolveViaApi(trimmed);
    if (resolved) {
      return resolved;
    }
    const norm = normalizeLegacyChantierId(trimmed);
    if (norm !== trimmed) {
      return this.resolveViaApi(norm);
    }
    return null;
  }

  private async tryResolveCode(code: string): Promise<string | null> {
    const byCode = await this.resolveViaApi(code);
    if (byCode) {
      return byCode;
    }
    const suffix = extractNumericSuffixFromChantierCode(code);
    if (suffix) {
      return this.resolveViaApi(`ch-${suffix}`);
    }
    return null;
  }

  private async resolveViaApi(key: string): Promise<string | null> {
    const cached = this.lookupCache.get(key);
    if (cached) {
      return cached;
    }
    try {
      await this.chantierApi.getById(key);
      this.lookupCache.set(key, key);
      return key;
    } catch {
      const rows = await this.chantierApi.lookup(key);
      const match = rows.find((r) => r.id === key || r.code === key);
      if (match) {
        this.lookupCache.set(key, match.id);
        return match.id;
      }
      return null;
    }
  }
}
