import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { GridFacade } from '@platform/lib/anatomy';
import type { LookupContext, LookupItem } from '@platform/lib/anatomy/types';
import type {
  Devis,
  DevisCreate,
  DevisUpdate,
} from '@app/etudes/models';
import { ApiConfigService } from '@platform/core/config/api-config.service';

import { DevisApiService } from './devis-api.service';
import {
  ErpLookupService,
  partnerLookupLabel,
} from '@app/socle/shared/services/erp-lookup.service';

@Injectable({ providedIn: 'root' })
export class DevisFacade extends GridFacade<Devis, DevisCreate, DevisUpdate> {
  protected override api = inject(DevisApiService);
  private readonly erpLookup = inject(ErpLookupService);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private readonly lookupsSignal = signal<LookupContext>({});
  override readonly lookups = computed(() => this.lookupsSignal());

  override async ensureLookups(): Promise<void> {
    if (this.lookupsSignal()['clients']) return;
    const [{ items: devis }, partners] = await Promise.all([
      this.api.getAll({ page: 0, pageSize: 500 }),
      this.erpLookup.partnersByRole('CLIENT'),
    ]);
    const clientMap = new Map<string, LookupItem>();
    for (const p of partners) {
      const label = partnerLookupLabel(p);
      const id = String(p.key);
      clientMap.set(id, { key: id, value: label });
    }
    for (const d of devis) {
      if (!d.clientId || clientMap.has(d.clientId)) continue;
      clientMap.set(d.clientId, {
        key: d.clientId,
        value: d.clientName ? `${d.clientName}` : d.clientId,
      });
    }
    this.lookupsSignal.set({
      clients: [...clientMap.values()],
      partnerContacts: this.lookupsSignal()['partnerContacts'] ?? [],
    });
  }

  /** Charge les contacts Partner pour le client courant (référentiel contactClientId). */
  async loadPartnerContacts(clientId: string | null | undefined): Promise<void> {
    const base = { ...this.lookupsSignal() };
    if (!clientId) {
      this.lookupsSignal.set({ ...base, partnerContacts: [] });
      return;
    }
    try {
      const url = `${this.apiConfig.getApiBaseUrl().replace(/\/+$/, '')}/api/v1/partners/${clientId}/contacts`;
      const contacts = await firstValueFrom(
        this.http.get<Array<{ id: string; nom: string; fonction?: string; isPrimary?: boolean }>>(url),
      );
      const items: LookupItem[] = (contacts ?? []).map((c) => ({
        key: c.id,
        value: c.fonction ? `${c.nom} - ${c.fonction}` : c.nom,
      }));
      this.lookupsSignal.set({ ...base, partnerContacts: items });
    } catch {
      this.lookupsSignal.set({ ...base, partnerContacts: [] });
    }
  }

  /** Garantit une entrée clients pour le devis courant (évite select vide en view). */
  ensureClientLookup(devis: Devis): void {
    if (!devis.clientId) return;
    const base = { ...this.lookupsSignal() };
    const clients = [...(base['clients'] ?? [])];
    if (!clients.some((c) => c.key === devis.clientId)) {
      clients.push({
        key: devis.clientId,
        value: devis.clientName
          ? `${devis.clientName}`
          : devis.clientId,
      });
      this.lookupsSignal.set({ ...base, clients });
    }
  }

  ensureContactLookup(contactId: string, label: string): void {
    const base = { ...this.lookupsSignal() };
    const contacts = [...(base['partnerContacts'] ?? [])];
    if (!contacts.some((c) => c.key === contactId)) {
      contacts.push({ key: contactId, value: label });
      this.lookupsSignal.set({ ...base, partnerContacts: contacts });
    }
  }

  async executeTransition(
    id: string,
    endpoint: string,
    payload?: Record<string, unknown>,
  ): Promise<Devis> {
    if (endpoint === 'lose') {
      const motif = String(payload?.['note'] ?? payload?.['motif'] ?? '');
      return this.api.lose(id, motif);
    }
    return this.api.executeTransition<Devis>(id, endpoint, payload);
  }

  async emit(id: string): Promise<Devis> {
    return this.api.submit(id);
  }

  async newVersion(id: string, modifications: string): Promise<Devis> {
    return this.api.createVersion(id, modifications);
  }

  async approve(id: string): Promise<Devis> {
    return this.api.approve(id);
  }

  async lose(id: string, motif: string): Promise<Devis> {
    return this.api.lose(id, motif);
  }

  async cancel(id: string): Promise<Devis> {
    return this.api.cancel(id);
  }

  async negotiate(id: string): Promise<Devis> {
    return this.api.negotiate(id);
  }
}
