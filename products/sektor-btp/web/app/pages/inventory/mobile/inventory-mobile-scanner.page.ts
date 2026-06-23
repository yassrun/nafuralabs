import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { map } from 'rxjs';

const OFFLINE_KEY = 'nf-scan-offline-queue';

export type ScanContext = 'RECEPTION' | 'SORTIE' | 'INVENTAIRE';

import { ButtonComponent } from '@lib/anatomy';

@Component({
  selector: 'app-inventory-mobile-scanner',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule, ButtonComponent],
  template: `
    <div class="wrap">
      <header>
        <h1>Scanner {{ contextLabel() }}</h1>
        <p class="sub">QR + EAN-13 — {{ offlineHint() }}</p>
      </header>

      @if (permissionDenied()) {
        <p class="warn">Caméra refusée : autorisez l’accès dans les paramètres du navigateur.</p>
      }

      <section class="scanner">
        <zxing-scanner
          [formats]="formats"
          [tryHarder]="true"
          (scanSuccess)="onScan($event)"
          (permissionResponse)="onPermission($event)"
        ></zxing-scanner>
      </section>

      <section class="manual">
        <label>Saisie manuelle (offline / secours)</label>
        <div class="row">
          <input #manual type="text" placeholder="Code-barres ou URL nafura://" />
          <nf-button type="button" (clicked)="submitManual(manual.value); manual.value = ''" variant="secondary">Valider</nf-button>
        </div>
      </section>

      @if (lastText()) {
        <section class="last">
          <strong>Dernier scan</strong>
          <code>{{ lastText() }}</code>
        </section>
      }

      @if (queue().length) {
        <section class="queue">
          <strong>File offline ({{ queue().length }})</strong>
          <ul>
            @for (row of queue(); track row.t) {
              <li>{{ row.context }} · {{ row.text }}</li>
            }
          </ul>
        </section>
      }
    </div>
  `,
  styles: [
    `
      .wrap {
        padding: 12px;
        max-width: 640px;
        margin: 0 auto;
        display: grid;
        gap: 12px;
      }
      h1 {
        margin: 0;
        font-size: 1.2rem;
      }
      .sub {
        margin: 4px 0 0;
        color: var(--nf-color-text-secondary);
        font-size: 0.85rem;
      }
      .scanner zxing-scanner {
        display: block;
        width: 100%;
        max-height: 320px;
      }
      .warn {
        color: var(--nf-color-warning-700);
        font-weight: 600;
      }
      .manual label {
        display: block;
        font-size: 0.85rem;
        margin-bottom: 6px;
      }
      .row {
        display: flex;
        gap: 8px;
      }
      .row input {
        flex: 1;
        padding: 8px;
      }
      .row button {
        padding: 8px 12px;
      }
      .last code {
        display: block;
        margin-top: 6px;
        word-break: break-all;
      }
      .queue ul {
        margin: 6px 0 0;
        padding-left: 1.1rem;
      }
    `,
  ],
})
export class InventoryMobileScannerPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly doc = inject(DOCUMENT);

  readonly formats = [BarcodeFormat.QR_CODE, BarcodeFormat.EAN_13];

  readonly context = toSignal(
    this.route.paramMap.pipe(map((p) => (p.get('context') ?? 'SORTIE').toUpperCase() as ScanContext)),
    { initialValue: (this.route.snapshot.paramMap.get('context') ?? 'SORTIE').toUpperCase() as ScanContext },
  );

  readonly contextLabel = computed(() => {
    switch (this.context()) {
      case 'RECEPTION':
        return 'réception BL';
      case 'INVENTAIRE':
        return 'inventaire';
      default:
        return 'sortie stock';
    }
  });

  readonly lastText = signal<string | null>(null);
  readonly permissionDenied = signal(false);
  readonly queue = signal<Array<{ t: number; context: string; text: string }>>(this.readQueue());

  readonly offlineHint = signal(typeof navigator !== 'undefined' && navigator.onLine ? 'en ligne' : 'hors ligne — file locale');

  onPermission(granted: boolean): void {
    this.permissionDenied.set(!granted);
  }

  onScan(text: string | null | undefined): void {
    if (text) this.handleDecoded(text);
  }

  submitManual(text: string): void {
    const t = text.trim();
    if (t) this.handleDecoded(t);
  }

  private handleDecoded(text: string): void {
    this.lastText.set(text);
    this.feedback();
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.pushOffline(text);
      return;
    }
    void this.routeByPayload(text);
  }

  private feedback(): void {
    try {
      const ctx = new AudioContext();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.value = 0.05;
      o.start();
      o.stop(ctx.currentTime + 0.08);
    } catch {
      /* ignore */
    }
    try {
      void navigator.vibrate?.(40);
    } catch {
      /* ignore */
    }
  }

  private readQueue(): Array<{ t: number; context: string; text: string }> {
    try {
      const raw = localStorage.getItem(OFFLINE_KEY);
      if (!raw) return [];
      const v = JSON.parse(raw) as Array<{ t: number; context: string; text: string }>;
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }

  private pushOffline(text: string): void {
    const row = { t: Date.now(), context: this.context(), text };
    const next = [...this.queue(), row];
    this.queue.set(next);
    try {
      localStorage.setItem(OFFLINE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  private async routeByPayload(text: string): Promise<void> {
    const n = text.match(/^nafura:\/\/article\/([^?]+)\??/i);
    if (n?.[1]) {
      await this.router.navigate(['/inventory/catalogue/articles', n[1]]);
      return;
    }
    if (text.startsWith('http')) {
      this.doc.defaultView?.open(text, '_blank', 'noopener');
      return;
    }
    await this.router.navigate(['/inventory/catalogue/articles'], { queryParams: { search: text } });
  }
}
