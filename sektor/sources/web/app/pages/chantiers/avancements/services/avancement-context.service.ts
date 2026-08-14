import { Injectable, inject, signal } from '@angular/core';

import { AuthFacade } from '@platform/core/security/services/auth.facade';
import type { LotChantier as ApiLotChantier, PosteBudgetaire } from '@app/chantiers/models';
import { ChantierApiService } from '../../services/chantier-api.service';
import { ChantierLotApiService } from '../../services/chantier-lot-api.service';
import { PosteBudgetaireApiService } from '../../services/poste-budgetaire-api.service';
import { EmployeApiService } from '../../../rh/employes/services/employe-api.service';

import type {
  AvancementListItem,
  ChantierAvancement,
  ChantierStatus,
  EmployeLookup,
  LotChantier,
  LotStatus,
  SaisieLineDefinition,
} from '../models';
import type { Chantier } from '@app/chantiers/models';
import { buildSaisieLineDefinitions } from '../utils/saisie-line.util';

function mapChantierStatus(status: Chantier['status']): ChantierStatus {
  if (status === 'TERMINE') return 'TERMINE';
  if (status === 'SUSPENDU') return 'SUSPENDU';
  return 'EN_COURS';
}

function chantierToAvancement(c: Chantier): ChantierAvancement {
  return {
    id: c.id,
    code: c.code,
    name: c.name,
    client: c.clientName ?? '',
    budgetHt: c.budgetHt ?? 0,
    status: mapChantierStatus(c.status),
    startDate: c.dateDebut ?? '',
    endDate: c.dateFinPrevue ?? '',
    conducteurId: c.conducteurTravauxId ?? '',
    chefChantierId: c.chefChantierId ?? '',
    avancementPercent: c.avancementPercent ?? 0,
    isActive: c.status === 'EN_COURS' || c.status === 'SUSPENDU',
  };
}

function lotToAvancementLot(
  lot: ApiLotChantier,
  dernier?: AvancementListItem,
): LotChantier {
  const avancementPercent = dernier?.pourcentage ?? lot.avancementPercent ?? 0;
  const status: LotStatus = avancementPercent >= 100 ? 'TERMINE' : 'EN_COURS';
  return {
    id: lot.id,
    chantierId: lot.chantierId,
    code: lot.code,
    designation: lot.designation,
    parentLotId: lot.parentLotId,
    unite: lot.unite ?? 'U',
    quantite: lot.quantite ?? 0,
    prixUnitaireHt: lot.prixUnitaireHt,
    montantHt: lot.montantHt,
    cumulQuantite: dernier?.cumulQuantite ?? 0,
    avancementPercent,
    status,
    ordre: lot.ordre ?? 0,
  };
}

@Injectable({ providedIn: 'root' })
export class AvancementContextService {
  private readonly chantierApi = inject(ChantierApiService);
  private readonly lotApi = inject(ChantierLotApiService);
  private readonly posteApi = inject(PosteBudgetaireApiService);
  private readonly employeApi = inject(EmployeApiService);
  private readonly auth = inject(AuthFacade);

  private readonly chantiersSignal = signal<ChantierAvancement[]>([]);
  private readonly lotsSignal = signal<LotChantier[]>([]);
  private readonly postesByLotIdSignal = signal<Record<string, PosteBudgetaire[]>>({});
  private readonly employeesSignal = signal<EmployeLookup[]>([]);
  private loaded = false;

  getCurrentUser(): EmployeLookup {
    const user = this.auth.user();
    return {
      id: user?.id ?? '',
      name: user ? `${user.profile.firstName ?? ''} ${user.profile.lastName ?? ''}`.trim() : '',
      role: '',
      preferredChantierIds: [],
      isAdmin: user?.isSuperAdmin ?? false,
    };
  }

  getEmployees(): EmployeLookup[] {
    return this.employeesSignal();
  }

  getChantiers(): ChantierAvancement[] {
    return [...this.chantiersSignal()].sort((a, b) => a.code.localeCompare(b.code));
  }

  getLots(chantierId?: string): LotChantier[] {
    const lots = chantierId
      ? this.lotsSignal().filter((lot) => lot.chantierId === chantierId)
      : this.lotsSignal();
    return [...lots].sort((left, right) => {
      if (left.chantierId !== right.chantierId) {
        return left.chantierId.localeCompare(right.chantierId);
      }
      return left.ordre - right.ordre;
    });
  }

  getPostesByLotId(chantierId?: string): Record<string, PosteBudgetaire[]> {
    const postesByLotId = this.postesByLotIdSignal();
    if (!chantierId) return postesByLotId;
    const lotIds = new Set(this.getLots(chantierId).map((lot) => lot.id));
    return Object.fromEntries(
      Object.entries(postesByLotId).filter(([lotId]) => lotIds.has(lotId)),
    );
  }

  getSaisieLines(chantierId: string): SaisieLineDefinition[] {
    return buildSaisieLineDefinitions(this.getLots(chantierId), this.getPostesByLotId(chantierId));
  }

  getActiveSaisieLines(chantierId: string): SaisieLineDefinition[] {
    return this.getSaisieLines(chantierId).filter((line) => {
      const percent = line.kind === 'poste'
        ? 0
        : line.lot.avancementPercent;
      return percent < 100;
    });
  }

  getActiveLotsForChantier(chantierId: string): LotChantier[] {
    return this.getLots(chantierId).filter((lot) => lot.avancementPercent < 100);
  }

  async ensureBaseData(): Promise<void> {
    if (this.loaded) return;
    const [chantiersRes, employesRes] = await Promise.all([
      this.chantierApi.getAll({ page: 0, pageSize: 500 }),
      this.employeApi.getAll({ page: 0, pageSize: 500 }),
    ]);
    this.chantiersSignal.set(chantiersRes.items.map(chantierToAvancement));
    this.employeesSignal.set(
      employesRes.items.map((e) => ({
        id: e.id,
        name: `${e.prenom} ${e.nom}`.trim(),
        role: e.poste ?? '',
        preferredChantierIds: [],
      })),
    );
    this.loaded = true;
  }

  async loadLotsForChantier(chantierId: string, dernierByLotId: Record<string, AvancementListItem>): Promise<void> {
    const apiLots = await this.lotApi.listByChantier(chantierId);
    const mapped = apiLots.map((lot) => lotToAvancementLot(lot, dernierByLotId[lot.id]));
    this.lotsSignal.update((current) => {
      const others = current.filter((lot) => lot.chantierId !== chantierId);
      return [...others, ...mapped];
    });

    const settled = await Promise.allSettled(
      apiLots.map(async (lot) => [lot.id, await this.posteApi.listByLot(lot.id)] as const),
    );
    const postesForChantier: Record<string, PosteBudgetaire[]> = {};
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        const [lotId, postes] = result.value;
        postesForChantier[lotId] = postes;
      }
    }
    this.postesByLotIdSignal.update((current) => {
      const others = Object.fromEntries(
        Object.entries(current).filter(([lotId]) => !apiLots.some((lot) => lot.id === lotId)),
      );
      return { ...others, ...postesForChantier };
    });
  }

  canEdit(item: AvancementListItem): boolean {
    if (item.status !== 'BROUILLON') return false;
    const user = this.getCurrentUser();
    return Boolean(user.isAdmin || !item.saisieParId || item.saisieParId === user.id);
  }
}
