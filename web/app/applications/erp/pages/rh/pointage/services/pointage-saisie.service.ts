import { Injectable, computed, effect, inject, signal } from '@angular/core';

import type { Pointage, PointageMode, AffectationEmploye, PointageSignatureMode } from '../models';
import { PlanningApiService } from '../../planning-equipes/services/planning-api.service';
import { PointageApiService } from './pointage-api.service';
import { PointageBatchApiService } from './pointage-batch-api.service';
import { PointagePhotoIdbService } from './pointage-photo-idb.service';
import { ErpAttachmentUploadService } from '@applications/erp/shared/services/erp-attachment-upload.service';
import { ERP_ATTACHMENT_ENTITY_TYPES } from '@applications/erp/shared/config/attachment-detail.config';

const STORAGE_KEY = 'nafura-erp-pointages-v2';
const LAST_SYNC_KEY = 'nafura-erp-pointages-last-sync';
const MIRROR_KEY = 'nafura-erp-pointages-server-mirror-v1';

function fingerprintPayload(
  p: Pick<Pointage, 'mode' | 'heuresNormales' | 'heureArrivee' | 'heureDepart' | 'signatureDataUrl'>,
): string {
  return JSON.stringify({
    mode: p.mode,
    heuresNormales: p.heuresNormales ?? 0,
    heureArrivee: p.heureArrivee ?? null,
    heureDepart: p.heureDepart ?? null,
    signatureDataUrl: p.signatureDataUrl ?? null,
  });
}

function hasBrowserStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function readStoredPointages(): Pointage[] {
  if (!hasBrowserStorage()) {
    return [];
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readLastSyncAt(): string | null {
  if (!hasBrowserStorage()) {
    return null;
  }

  return localStorage.getItem(LAST_SYNC_KEY);
}

function browserOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

function readMirror(): Record<string, string> {
  if (!hasBrowserStorage()) return {};
  try {
    const raw = localStorage.getItem(MIRROR_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeMirror(m: Record<string, string>): void {
  if (!hasBrowserStorage()) return;
  localStorage.setItem(MIRROR_KEY, JSON.stringify(m));
}

function newClientId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `client-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Offline-first pointage saisie — syncs via `POST /api/v1/rh/pointage-batches`. */
@Injectable({ providedIn: 'root' })
export class PointageSaisieService {
  private readonly photoIdb = inject(PointagePhotoIdbService);
  private readonly attachmentUpload = inject(ErpAttachmentUploadService);
  private readonly pointageApi = inject(PointageApiService);
  private readonly batchApi = inject(PointageBatchApiService);
  private readonly planningApi = inject(PlanningApiService);

  private readonly _pointages = signal<Pointage[]>(readStoredPointages());
  private readonly _affectations = signal<AffectationEmploye[]>([]);
  private readonly _serverPointages = signal<Pointage[]>([]);
  private readonly _contextKey = signal('');

  readonly photoPendingCount = signal(0);

  readonly affectations = computed(() => this._affectations());
  readonly pointages = computed(() => this._pointages());
  readonly online = signal(browserOnline());
  readonly syncing = signal(false);
  readonly lastSyncedAt = signal<string | null>(readLastSyncAt());
  readonly pendingPointageSyncCount = computed(() =>
    this._pointages().filter((pointage) => pointage.syncStatus === 'LOCAL').length,
  );
  readonly pendingConflictCount = computed(() =>
    this._pointages().filter((pointage) => pointage.syncStatus === 'CONFLICT').length,
  );
  readonly pendingSyncCount = computed(
    () => this.pendingPointageSyncCount() + this.photoPendingCount(),
  );

  private readonly bgSyncTimer = typeof window !== 'undefined'
    ? window.setInterval(() => {
        if (this.online() && this.pendingSyncCount() > 0) {
          void this.syncPending();
        }
      }, 45_000)
    : 0;

  constructor() {
    void this.refreshPhotoPending();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      window.addEventListener('visibilitychange', this.handleVisibility);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', this.handleSwMessage);
      }
    }

    effect(() => {
      if (!hasBrowserStorage()) {
        return;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._pointages()));

      const lastSyncedAt = this.lastSyncedAt();
      if (lastSyncedAt) {
        localStorage.setItem(LAST_SYNC_KEY, lastSyncedAt);
      } else {
        localStorage.removeItem(LAST_SYNC_KEY);
      }
    });

    if (this.online()) {
      void this.syncPending();
    }
  }

  /** Loads affectations + server pointages for the saisie screen context. */
  async loadContext(chantierId: string, date: string): Promise<void> {
    const key = `${chantierId}|${date}`;
    this._contextKey.set(key);

    try {
      const planning = await this.planningApi.getPlanning({ from: date, to: date, chantierId });
      if (this._contextKey() !== key) return;
      this._affectations.set(
        planning.affectations.filter((a) => a.chantierId === chantierId && !a.dateFin),
      );
    } catch {
      if (this._contextKey() !== key) return;
      this._affectations.set([]);
    }

    try {
      const rows = await this.pointageApi.listByDate(chantierId, date);
      if (this._contextKey() !== key) return;
      this._serverPointages.set(rows);
    } catch {
      if (this._contextKey() !== key) return;
      this._serverPointages.set([]);
    }
  }

  async refreshPhotoPending(): Promise<void> {
    try {
      const n = await this.photoIdb.countPending();
      this.photoPendingCount.set(n);
    } catch {
      this.photoPendingCount.set(0);
    }
  }

  private readonly handleOnline = (): void => {
    this.online.set(true);
    void this.syncPending();
  };

  private readonly handleOffline = (): void => {
    this.online.set(false);
  };

  private readonly handleVisibility = (): void => {
    if (document.visibilityState === 'visible' && this.online() && this.pendingSyncCount() > 0) {
      void this.syncPending();
    }
  };

  private readonly handleSwMessage = (ev: MessageEvent): void => {
    if (ev.data?.type === 'NAFURA_BG_SYNC') {
      void this.syncPending();
    }
  };

  private resolveSyncStatus(syncStatus?: Pointage['syncStatus']): Pointage['syncStatus'] {
    if (syncStatus === 'CONFLICT') {
      return 'CONFLICT';
    }

    return this.online() ? 'SYNCED' : 'LOCAL';
  }

  async syncPending(): Promise<void> {
    if (!this.online()) {
      return;
    }

    const ptPending = this.pendingPointageSyncCount();
    const photoPending = this.photoPendingCount();

    if (ptPending === 0 && photoPending === 0) {
      return;
    }

    this.syncing.set(true);

    try {
      const localRows = this._pointages().filter((p) => p.syncStatus === 'LOCAL');
      const batches = new Map<string, Pointage[]>();
      for (const row of localRows) {
        const batchId = row.journeeBatchId ?? row.id;
        const group = batches.get(batchId) ?? [];
        group.push(row);
        batches.set(batchId, group);
      }

      for (const [, rows] of batches) {
        if (!rows.length) continue;
        const sample = rows[0];
        const chefEmployeId = rows[0].employeId;
        const clientId = sample.journeeBatchId ?? newClientId();
        let photoUrl: string | undefined;
        const photoKey = this.photoIdb.photoKey(sample.date, sample.chantierId);
        const photoRec = await this.photoIdb.getPhoto(photoKey);
        if (photoRec?.syncStatus === 'PENDING') {
          const file = new File([photoRec.blob], `pointage-${sample.date}.jpg`, { type: 'image/jpeg' });
          photoUrl = await this.attachmentUpload.uploadFile(
            ERP_ATTACHMENT_ENTITY_TYPES.POINTAGE_BATCH,
            clientId,
            file,
          );
        }
        try {
          await this.batchApi.createBatch({
            clientId,
            chefEmployeId,
            chantierId: sample.chantierId,
            datePointage: sample.date,
            gpsLat: sample.geoloc?.lat,
            gpsLng: sample.geoloc?.lng,
            signatureUrl: sample.signatureDataUrl,
            photoUrl,
            status: sample.status,
            pointages: rows.map((p) => ({
              employeId: p.employeId,
              date: p.date,
              mode: p.mode,
              heureArrivee: p.heureArrivee,
              heureDepart: p.heureDepart,
              heuresNormales: p.heuresNormales,
              heuresSup: p.heuresSup,
              status: p.status,
            })),
          });

          const mirror = { ...readMirror() };
          this._pointages.update((list) =>
            list.map((pointage) => {
              if (!rows.some((r) => r.id === pointage.id)) {
                return pointage;
              }
              const localFp = fingerprintPayload(pointage);
              mirror[pointage.id] = localFp;
              return {
                ...pointage,
                syncStatus: 'SYNCED' as const,
                lastSyncedFingerprint: localFp,
              };
            }),
          );
          writeMirror(mirror);
          if (photoRec?.syncStatus === 'PENDING' && photoUrl) {
            await this.photoIdb.markPhotoSynced(photoKey);
          }
        } catch {
          const mirror = { ...readMirror() };
          this._pointages.update((list) =>
            list.map((pointage) => {
              if (!rows.some((r) => r.id === pointage.id) || pointage.syncStatus !== 'LOCAL') {
                return pointage;
              }
              const localFp = fingerprintPayload(pointage);
              const serverFp = mirror[pointage.id];
              const ack = pointage.lastSyncedFingerprint;
              const serverChanged =
                serverFp !== undefined &&
                (ack !== undefined ? serverFp !== ack : serverFp !== localFp);
              if (serverChanged) {
                return { ...pointage, syncStatus: 'CONFLICT' as const };
              }
              return pointage;
            }),
          );
        }
      }

      await this.refreshPhotoPending();
      this.lastSyncedAt.set(new Date().toISOString());
    } finally {
      this.syncing.set(false);
    }
  }

  getByDate(date: string, chantierId?: string): Pointage[] {
    const local = this._pointages().filter(
      (p) => p.date === date && (!chantierId || p.chantierId === chantierId),
    );
    const localIds = new Set(local.map((p) => p.employeId));
    const server = this._serverPointages().filter(
      (p) => p.date === date && (!chantierId || p.chantierId === chantierId) && !localIds.has(p.employeId),
    );
    return [...server, ...local];
  }

  getBrouillonsForDate(date: string, chantierId?: string): Pointage[] {
    return this.getByDate(date, chantierId).filter((p) => p.status === 'BROUILLON');
  }

  validerBrouillonsJournee(date: string, chantierId?: string): void {
    const toValidate = this.getBrouillonsForDate(date, chantierId);
    for (const p of toValidate) {
      this.savePointage({ ...p, status: 'VALIDE' });
    }
  }

  getByChantierMois(chantierId: string, mois: string): Pointage[] {
    return this._pointages().filter(
      (p) => p.chantierId === chantierId && p.date.startsWith(mois),
    );
  }

  getAffectationsByChantier(chantierId: string): AffectationEmploye[] {
    return this._affectations().filter((a) => a.chantierId === chantierId && !a.dateFin);
  }

  addAffectation(row: AffectationEmploye): void {
    this._affectations.update((list) => [...list, row]);
  }

  savePointage(p: Pointage): void {
    this._pointages.update((list) => {
      const idx = list.findIndex((x) => x.id === p.id);
      const prev = idx >= 0 ? list[idx] : undefined;
      const syncStatus = this.resolveSyncStatus(p.syncStatus);
      const merged: Pointage = {
        ...prev,
        ...p,
        syncStatus,
      };
      if (syncStatus === 'LOCAL') {
        merged.lastSyncedFingerprint = prev?.lastSyncedFingerprint ?? p.lastSyncedFingerprint;
      } else if (syncStatus === 'SYNCED' && merged.status === 'VALIDE') {
        merged.lastSyncedFingerprint = fingerprintPayload(merged);
      }

      const next =
        idx >= 0 ? list.map((x, i) => (i === idx ? merged : x)) : [...list, merged];

      if (merged.syncStatus === 'SYNCED' && merged.status === 'VALIDE') {
        const mirror = { ...readMirror() };
        mirror[merged.id] = merged.lastSyncedFingerprint ?? fingerprintPayload(merged);
        writeMirror(mirror);
        this.lastSyncedAt.set(new Date().toISOString());
      }

      return next;
    });

    if (this.online() && p.syncStatus !== 'CONFLICT') {
      void this.syncPending();
    }
  }

  saveJournee(
    date: string,
    chantierId: string,
    chantierCode: string,
    entries: Array<{ employeId: string; employeNom: string; mode: PointageMode; heureArrivee?: string; heureDepart?: string; notes?: string }>,
    options?: {
      geoloc?: Pointage['geoloc'];
      journeeBatchId?: string;
      signatureMode?: PointageSignatureMode;
      signaturesByEmployeId?: Record<string, string>;
      signatureCollectiveDataUrl?: string;
    },
  ): void {
    const batchId = options?.journeeBatchId ?? newClientId();
    const sigMode = options?.signatureMode ?? 'COLLECTIF';
    const collective = options?.signatureCollectiveDataUrl;
    const per = options?.signaturesByEmployeId ?? {};

    for (const e of entries) {
      const id = `pt-${date}-${e.employeId}`;
      const signatureDataUrl =
        sigMode === 'COLLECTIF'
          ? collective
          : per[e.employeId];
      this.savePointage({
        id,
        date,
        chantierId,
        chantierCode,
        employeId: e.employeId,
        employeNom: e.employeNom,
        mode: e.mode,
        heureArrivee: e.heureArrivee,
        heureDepart: e.heureDepart,
        heuresNormales: e.mode === 'PRESENT' ? 8 : 0,
        heuresSup: 0,
        pointePar: 'Chef chantier',
        geoloc: options?.geoloc,
        notes: e.notes,
        status: 'VALIDE',
        syncStatus: this.online() ? 'LOCAL' : 'LOCAL',
        journeeBatchId: batchId,
        signatureMode: sigMode,
        signatureDataUrl,
      });
    }
  }
}

/** @deprecated Use `PointageSaisieService`. */