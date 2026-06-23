import { Injectable } from '@angular/core';

const DB_NAME = 'nafura-erp-pointage-v1';
const DB_VERSION = 1;
const STORE_PHOTOS = 'photos';

/** Max width after compression (Task 13.6). */
export const POINTAGE_PHOTO_MAX_WIDTH = 800;

export interface PointagePhotoRecord {
  key: string;
  blob: Blob;
  createdAt: string;
  /** Pending upload / sync to mock server */
  syncStatus: 'PENDING' | 'SYNCED';
}

function hasIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * IndexedDB storage for compressed chantier photos (Tasks 13.1 / 13.6).
 * Pointage rows stay in localStorage; blobs live here to avoid quota issues.
 */
@Injectable({ providedIn: 'root' })
export class PointagePhotoIdbService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  /** Resize image to max width, return JPEG blob (~quality 0.82). */
  async compressImageFile(file: File, maxWidth = POINTAGE_PHOTO_MAX_WIDTH): Promise<Blob> {
    const bitmap = await createImageBitmap(file);
    try {
      const ratio = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1;
      const w = Math.round(bitmap.width * ratio);
      const h = Math.round(bitmap.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unsupported');
      ctx.drawImage(bitmap, 0, 0, w, h);
      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          b => (b ? resolve(b) : reject(new Error('toBlob failed'))),
          'image/jpeg',
          0.82,
        );
      });
    } finally {
      bitmap.close();
    }
  }

  photoKey(date: string, chantierId: string): string {
    return `${date}::${chantierId}`;
  }

  async savePhoto(key: string, blob: Blob): Promise<void> {
    const db = await this.openDb();
    const rec: PointagePhotoRecord = {
      key,
      blob,
      createdAt: new Date().toISOString(),
      syncStatus: 'PENDING',
    };
    await this.txPromise(db, STORE_PHOTOS, 'readwrite', (store) => store.put(rec, key));
  }

  async getPhoto(key: string): Promise<PointagePhotoRecord | null> {
    const db = await this.openDb();
    return this.txPromise(db, STORE_PHOTOS, 'readonly', (store) => store.get(key)) as Promise<PointagePhotoRecord | null>;
  }

  async countPending(): Promise<number> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PHOTOS, 'readonly');
      const store = tx.objectStore(STORE_PHOTOS);
      const req = store.openCursor();
      let n = 0;
      req.onsuccess = () => {
        const cur = req.result;
        if (!cur) {
          resolve(n);
          return;
        }
        const v = cur.value as PointagePhotoRecord;
        if (v?.syncStatus === 'PENDING') n++;
        cur.continue();
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deletePhoto(key: string): Promise<void> {
    const db = await this.openDb();
    await this.txPromise(db, STORE_PHOTOS, 'readwrite', (store) => store.delete(key));
  }

  /** Mark a photo as synced after successful upload. */
  async markPhotoSynced(key: string): Promise<void> {
    const rec = await this.getPhoto(key);
    if (!rec) {
      return;
    }
    const db = await this.openDb();
    await this.txPromise(db, STORE_PHOTOS, 'readwrite', (store) =>
      store.put({ ...rec, syncStatus: 'SYNCED' }, key),
    );
  }

  /** @deprecated Use markPhotoSynced after real upload */
  async markAllPhotosSynced(): Promise<void> {
    const db = await this.openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_PHOTOS, 'readwrite');
      const store = tx.objectStore(STORE_PHOTOS);
      const req = store.openCursor();
      req.onsuccess = () => {
        const cur = req.result;
        if (!cur) {
          resolve();
          return;
        }
        const v = cur.value as PointagePhotoRecord;
        if (v?.syncStatus === 'PENDING') {
          cur.update({ ...v, syncStatus: 'SYNCED' });
        }
        cur.continue();
      };
      req.onerror = () => reject(req.error);
    });
  }

  private openDb(): Promise<IDBDatabase> {
    if (!hasIndexedDb()) {
      return Promise.reject(new Error('IndexedDB unavailable'));
    }
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onerror = () => reject(req.error);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
            db.createObjectStore(STORE_PHOTOS);
          }
        };
        req.onsuccess = () => resolve(req.result);
      });
    }
    return this.dbPromise;
  }

  private txPromise<T>(
    db: IDBDatabase,
    storeName: string,
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const req = fn(store);
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  }
}
