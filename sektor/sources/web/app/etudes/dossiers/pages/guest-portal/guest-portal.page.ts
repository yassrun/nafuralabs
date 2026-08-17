import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs';

import { MadCurrencyPipe } from '@platform/lib/anatomy/pipes/mad-currency.pipe';

import type { NoeudDPGF, PrixDPU } from '@app/etudes/models';
import { BordereauArbreComponent } from '../../components/bordereau-arbre/bordereau-arbre.component';
import {
  PosteChiffrageDrawerComponent,
  type PosteChiffrageDrawerData,
  type PosteChiffrageDrawerResult,
} from '../../components/poste-chiffrage-drawer/poste-chiffrage-drawer.component';
import {
  GuestAccessApiService,
  guestArbreToNoeuds,
  guestDpuToPrix,
  type GuestNoeud,
  type GuestPurpose,
  type GuestSnapshot,
} from '../../services/guest-access-api.service';
import type { BordereauTreeRow } from '../../utils/bordereau-tree.util';

@Component({
  selector: 'app-guest-portal-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MadCurrencyPipe, BordereauArbreComponent],
  templateUrl: './guest-portal.page.html',
  styleUrl: './guest-portal.page.scss',
})
export class GuestPortalPage {
  private readonly api = inject(GuestAccessApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  readonly expectedPurpose = toSignal(
    this.route.data.pipe(map((d) => (d['purpose'] as GuestPurpose) ?? 'CLIENT_VIEW')),
    { initialValue: 'CLIENT_VIEW' as GuestPurpose },
  );

  readonly snapshot = signal<GuestSnapshot | undefined>(undefined);
  readonly loading = signal(true);
  readonly error = signal<string | undefined>(undefined);
  readonly uploading = signal(false);
  readonly uploaded = signal(false);
  readonly uploadError = signal<string | undefined>(undefined);
  readonly selectedKey = signal<string | null>(null);

  readonly isClient = computed(() => this.expectedPurpose() === 'CLIENT_VIEW');
  readonly mismatch = computed(() => {
    const snap = this.snapshot();
    const expected = this.expectedPurpose();
    return !!snap && snap.purpose !== expected;
  });

  readonly hierarchie = computed<NoeudDPGF[]>(() => guestArbreToNoeuds(this.snapshot()?.arbre));

  readonly token = computed(() => this.route.snapshot.paramMap.get('token') ?? '');

  constructor() {
    void this.load(this.token());
  }

  async onSelectPoste(row: BordereauTreeRow | null): Promise<void> {
    if (!row || row.type !== 'ARTICLE' || !row.id) return;
    this.selectedKey.set(row.key);
    const snap = this.snapshot();
    const node = findGuestNode(snap?.arbre, row.id);
    const dpu: PrixDPU | null = guestDpuToPrix(node?.dpu ?? { composants: node?.composants }, row.id);
    const data: PosteChiffrageDrawerData = {
      poste: structuredClone(row),
      dossierId: snap?.dossierId ?? '',
      cpsDocumentId: null,
      modifiable: false,
      fgDefaut: Number(node?.fraisGenerauxPercent ?? node?.dpu?.fraisGenerauxPercent ?? 10),
      margeDefaut: Number(node?.margePercent ?? node?.dpu?.margeBeneficiairePercent ?? 17.5),
      tvaDefaut: Number(node?.dpu?.tvaTaux ?? 20),
      guestReadOnly: true,
      guestToken: this.token(),
      externalDpu: dpu,
      externalDescriptifCps: node?.descriptifCps ?? node?.descriptif ?? null,
    };
    const ref = this.dialog.open<
      PosteChiffrageDrawerComponent,
      PosteChiffrageDrawerData,
      PosteChiffrageDrawerResult | null
    >(PosteChiffrageDrawerComponent, {
      panelClass: 'poste-chiffrage-drawer-panel',
      width: 'min(64rem, 96vw)',
      maxWidth: '96vw',
      height: '100vh',
      maxHeight: '100vh',
      position: { right: '0', top: '0' },
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      data,
    });
    await firstValueFrom(ref.afterClosed());
    this.selectedKey.set(null);
  }

  async onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploading.set(true);
    this.uploadError.set(undefined);
    try {
      await this.api.deposerDevis(this.token(), file);
      this.uploaded.set(true);
    } catch (e) {
      this.uploadError.set(this.message(e, 'Envoi impossible. Réessayez ou contactez Zenith Studio.'));
    } finally {
      this.uploading.set(false);
    }
  }

  private async load(token: string): Promise<void> {
    this.loading.set(true);
    this.error.set(undefined);
    try {
      this.snapshot.set(await this.api.resolve(token));
    } catch (e) {
      this.error.set(this.message(e, 'Lien invalide ou expiré.'));
    } finally {
      this.loading.set(false);
    }
  }

  private message(e: unknown, fallback: string): string {
    if (e instanceof HttpErrorResponse) {
      if (e.status === 404) return 'Lien invalide ou expiré.';
      if (e.status === 403) return 'Ce lien n’est pas destiné à cette page.';
    }
    return fallback;
  }
}

function findGuestNode(nodes: GuestNoeud[] | undefined, id: string): GuestNoeud | undefined {
  for (const node of nodes ?? []) {
    if (node.id === id) return node;
    const child = findGuestNode(node.enfants, id);
    if (child) return child;
  }
  return undefined;
}
