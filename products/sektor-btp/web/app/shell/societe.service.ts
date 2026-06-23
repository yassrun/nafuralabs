import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { environment } from '@env';

import { AuthFacade } from '@core/security/services/auth.facade';
import {
  Etablissement,
  Societe,
} from '../pages/administration/societe/models';

/**
 * Singleton multi-tenancy state (Task 8.3).
 *
 * - Seeds 3 sociétés / 6 établissements (mock SOMACOM).
 * - Persiste l'identifiant courant dans localStorage (`nafura-current-societe`).
 * - À terme : à brancher sur l'API IAM pour ne lister que les sociétés accessibles
 *   à l'utilisateur courant (`User.companiesIds`).
 */

const STORAGE_KEY_SELECTION = 'nafura-current-societe';

interface PersistedSelection {
  societeId: string;
  etablissementId: string | null;
}

const SEED_SOCIETES: Societe[] = [
  {
    id: 'soc-somacom-btp',
    raisonSociale: 'SOMACOM BTP SARL',
    formeJuridique: 'SARL',
    ice: '001234567000088',
    if: '40123456',
    rc: 'Casa - 715869',
    patente: 'TP-20-99000',
    cnss: '7654321',
    tvaIntra: 'MA001234567',
    siegeAdresse: 'Bd Mohammed Zerktouni, Casablanca',
    isActive: true,
  },
  {
    id: 'soc-somacom-tp',
    raisonSociale: 'SOMACOM Travaux Publics SA',
    formeJuridique: 'SA',
    ice: '002468135000091',
    if: '40234567',
    rc: 'Rabat - 142387',
    patente: 'TP-31-22013',
    cnss: '8123456',
    siegeAdresse: 'Avenue Hassan II, Rabat',
    isActive: true,
  },
  {
    id: 'soc-somacom-logistique',
    raisonSociale: 'SOMACOM Logistique SARLAU',
    formeJuridique: 'SARLAU',
    ice: '003579246000074',
    if: '40345678',
    rc: 'Casa - 803211',
    patente: 'TP-20-77451',
    cnss: '9234567',
    siegeAdresse: 'Zone Logistique Zenata, Mohammedia',
    isActive: true,
  },
];

const SEED_ETABLISSEMENTS: Etablissement[] = [
  // SOMACOM BTP : siège + 2 bases chantier
  {
    id: 'etab-btp-siege',
    societeId: 'soc-somacom-btp',
    nom: 'Siège Casablanca',
    type: 'SIEGE',
    ville: 'Casablanca',
    adresse: 'Bd Mohammed Zerktouni, Résidence Yasmine B, Bureau 8',
    isActive: true,
  },
  {
    id: 'etab-btp-base-marrakech',
    societeId: 'soc-somacom-btp',
    nom: 'Base chantier Marrakech',
    type: 'CHANTIER_BASE',
    ville: 'Marrakech',
    adresse: 'Route de l\'Ourika, Km 8',
    isActive: true,
  },
  {
    id: 'etab-btp-base-agadir',
    societeId: 'soc-somacom-btp',
    nom: 'Base chantier Agadir',
    type: 'CHANTIER_BASE',
    ville: 'Agadir',
    adresse: 'Zone Industrielle Tassila',
    isActive: true,
  },
  // SOMACOM TP : siège Rabat + agence Tanger
  {
    id: 'etab-tp-siege',
    societeId: 'soc-somacom-tp',
    nom: 'Siège Rabat',
    type: 'SIEGE',
    ville: 'Rabat',
    adresse: 'Avenue Hassan II, Immeuble Atlas',
    isActive: true,
  },
  {
    id: 'etab-tp-agence-tanger',
    societeId: 'soc-somacom-tp',
    nom: 'Agence Tanger',
    type: 'AGENCE',
    ville: 'Tanger',
    adresse: 'Bd Mohamed VI, Tanger Ville',
    isActive: true,
  },
  // SOMACOM Logistique : siège Casa
  {
    id: 'etab-log-siege',
    societeId: 'soc-somacom-logistique',
    nom: 'Siège Logistique',
    type: 'SIEGE',
    ville: 'Casablanca',
    adresse: 'Zone Logistique Zenata, Mohammedia',
    isActive: true,
  },
];

const USE_DEMO_SOCIETES = environment.devAuthBypass;

function loadSelection(societes: Societe[], etablissements: Etablissement[]): PersistedSelection {
  const fallback: PersistedSelection = {
    societeId: societes[0]?.id ?? '',
    etablissementId: societes[0]
      ? etablissements.find((e) => e.societeId === societes[0].id && e.type === 'SIEGE')?.id ?? null
      : null,
  };
  if (!fallback.societeId) {
    return { societeId: '', etablissementId: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SELECTION);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PersistedSelection>;
    const societe = societes.find((s) => s.id === parsed.societeId);
    if (!societe) return fallback;
    const etabId = parsed.etablissementId ?? null;
    const etab = etabId
      ? etablissements.find((e) => e.id === etabId && e.societeId === societe.id)
      : null;
    return {
      societeId: societe.id,
      etablissementId: etab?.id
        ?? etablissements.find((e) => e.societeId === societe.id && e.type === 'SIEGE')?.id
        ?? null,
    };
  } catch {
    return fallback;
  }
}

function persistSelection(selection: PersistedSelection): void {
  try {
    localStorage.setItem(STORAGE_KEY_SELECTION, JSON.stringify(selection));
  } catch {
    /* localStorage indisponible : tampis, état perdu au reload */
  }
}

@Injectable({ providedIn: 'root' })
export class SocieteService {
  private readonly auth = inject(AuthFacade);

  private readonly _societes = signal<Societe[]>(USE_DEMO_SOCIETES ? SEED_SOCIETES : []);
  private readonly _etablissements = signal<Etablissement[]>(USE_DEMO_SOCIETES ? SEED_ETABLISSEMENTS : []);

  private readonly _initialSelection = loadSelection(this._societes(), this._etablissements());
  private readonly _currentSocieteId = signal<string>(this._initialSelection.societeId);
  private readonly _currentEtablissementId = signal<string | null>(
    this._initialSelection.etablissementId,
  );

  constructor() {
    if (!USE_DEMO_SOCIETES) {
      effect(() => {
        const membership = this.auth.currentTenant();
        const tenant = membership?.tenant;
        if (!tenant?.id || !tenant.name) {
          this._societes.set([]);
          this._etablissements.set([]);
          this._currentSocieteId.set('');
          this._currentEtablissementId.set(null);
          return;
        }
        this.bindTenantOrganization(tenant.id, tenant.name);
      });
    }
  }

  /** Maps the active IAM tenant to a single société / siège (no SOMACOM demo data). */
  bindTenantOrganization(tenantId: string, tenantName: string): void {
    const societeId = `tenant-${tenantId}`;
    if (this._currentSocieteId() === societeId && this._societes().length === 1) {
      return;
    }
    const societe: Societe = {
      id: societeId,
      raisonSociale: tenantName,
      formeJuridique: 'SARL',
      ice: '',
      if: '',
      rc: '',
      patente: '',
      cnss: '',
      siegeAdresse: '',
      isActive: true,
    };
    const etablissement: Etablissement = {
      id: `etab-${tenantId}-siege`,
      societeId,
      nom: 'Siège',
      type: 'SIEGE',
      ville: '',
      adresse: '',
      isActive: true,
    };
    this._societes.set([societe]);
    this._etablissements.set([etablissement]);
    this._currentSocieteId.set(societeId);
    this._currentEtablissementId.set(etablissement.id);
    persistSelection({ societeId, etablissementId: etablissement.id });
  }

  readonly societes = this._societes.asReadonly();
  readonly etablissements = this._etablissements.asReadonly();
  readonly currentSocieteId = this._currentSocieteId.asReadonly();
  readonly currentEtablissementId = this._currentEtablissementId.asReadonly();

  readonly currentSociete = computed<Societe | null>(
    () => this._societes().find((s) => s.id === this._currentSocieteId()) ?? null,
  );

  readonly etablissementsForCurrentSociete = computed<Etablissement[]>(() => {
    const socId = this._currentSocieteId();
    return this._etablissements().filter((e) => e.societeId === socId);
  });

  readonly currentEtablissement = computed<Etablissement | null>(() => {
    const id = this._currentEtablissementId();
    if (!id) return null;
    return this._etablissements().find((e) => e.id === id) ?? null;
  });

  /** Returns établissements bound to a specific société (utilities for listing pages). */
  getEtablissementsBySocieteId(societeId: string): Etablissement[] {
    return this._etablissements().filter((e) => e.societeId === societeId);
  }

  setCurrentSociete(id: string): void {
    const found = this._societes().find((s) => s.id === id);
    if (!found) return;
    if (this._currentSocieteId() === id) return;
    this._currentSocieteId.set(id);
    // Réinitialise sur le siège de la société sélectionnée si l'établissement courant
    // n'appartient pas à la nouvelle société.
    const siege = this._etablissements().find(
      (e) => e.societeId === id && e.type === 'SIEGE',
    );
    const fallbackEtabId = siege?.id
      ?? this._etablissements().find((e) => e.societeId === id)?.id
      ?? null;
    this._currentEtablissementId.set(fallbackEtabId);
    persistSelection({
      societeId: id,
      etablissementId: this._currentEtablissementId(),
    });
  }

  setCurrentEtablissement(id: string | null): void {
    if (id === null) {
      this._currentEtablissementId.set(null);
      persistSelection({ societeId: this._currentSocieteId(), etablissementId: null });
      return;
    }
    const etab = this._etablissements().find((e) => e.id === id);
    if (!etab) return;
    if (etab.societeId !== this._currentSocieteId()) {
      // Si on choisit un étab d'une autre société, on bascule aussi la société.
      this._currentSocieteId.set(etab.societeId);
    }
    this._currentEtablissementId.set(id);
    persistSelection({
      societeId: this._currentSocieteId(),
      etablissementId: id,
    });
  }

  /** Test/QA helper — réinitialise la sélection sur la première société active. */
  resetSelection(): void {
    const first = this._societes().find((s) => s.isActive) ?? this._societes()[0];
    if (!first) return;
    const siege = this._etablissements().find(
      (e) => e.societeId === first.id && e.type === 'SIEGE',
    );
    this._currentSocieteId.set(first.id);
    this._currentEtablissementId.set(siege?.id ?? null);
    try {
      localStorage.removeItem(STORAGE_KEY_SELECTION);
    } catch {
      /* noop */
    }
  }
}
