
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';

import {
  ButtonComponent,
  ConfirmDialogService,
  PageHeaderComponent,
  PageShellComponent,
} from '@platform/lib/anatomy';
import type { PageHeaderConfig } from '@platform/lib/anatomy';

import {
  CatalogueApiService,
  type CatalogCandidat,
  type CatalogEdition,
} from '../services/catalogue-api.service';

type TabId = 'file' | 'editions';

@Component({
  selector: 'app-catalogue-console',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageShellComponent, PageHeaderComponent, ButtonComponent],
  templateUrl: './catalogue-console.page.html',
  styleUrl: './catalogue-console.page.scss',
})
export class CatalogueConsolePage implements OnInit {
  private readonly api = inject(CatalogueApiService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly headerConfig: PageHeaderConfig = {
    title: 'Console catalogue Sektor',
    subtitle: 'Hors application client — file candidats · G2 · éditions',
  };

  readonly tab = signal<TabId>('file');
  readonly candidats = signal<CatalogCandidat[]>([]);
  readonly editions = signal<CatalogEdition[]>([]);
  readonly selectedId = signal<string | undefined>(undefined);
  readonly chargement = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly message = signal<string | undefined>(undefined);

  readonly selected = computed(() => {
    const id = this.selectedId();
    return this.candidats().find((c) => c.id === id);
  });

  readonly exemples = computed(() => {
    const raw = this.selected()?.exemplesLibelles;
    if (!raw) return [] as string[];
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  });

  ngOnInit(): void {
    void this.refresh();
  }

  setTab(tab: TabId): void {
    this.tab.set(tab);
    this.message.set(undefined);
  }

  select(id: string): void {
    this.selectedId.set(id);
    this.message.set(undefined);
  }

  async refresh(): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      const [candidats, editions] = await Promise.all([
        this.api.candidats(),
        this.api.editions(),
      ]);
      this.candidats.set(candidats ?? []);
      this.editions.set(editions ?? []);
      if (this.selectedId() && !candidats.some((c) => c.id === this.selectedId())) {
        this.selectedId.set(undefined);
      }
    } catch (e) {
      const err = e as { error?: { code?: string; message?: string } };
      this.erreur.set(err?.error?.code ?? err?.error?.message ?? 'Chargement impossible.');
    } finally {
      this.chargement.set(false);
    }
  }

  async seedDemo(): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      const result = await this.api.seedDemo();
      this.message.set(
        result['seeded'] ? 'Seed demo appliqué (édition 2026.1).' : 'Seed déjà présent.',
      );
      await this.refresh();
    } catch (e) {
      const err = e as { error?: { code?: string; message?: string } };
      this.erreur.set(err?.error?.code ?? err?.error?.message ?? 'Seed impossible.');
    } finally {
      this.chargement.set(false);
    }
  }

  async publier(c: CatalogCandidat): Promise<void> {
    if (!c.eligible) return;
    const ok = await this.confirm.confirm({
      title: 'Publier dans le catalogue',
      message: `Créer « ${c.libellePropose} » (édition courante) ?`,
      confirmLabel: 'Publier',
    });
    if (!ok) return;
    this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      const out = await this.api.publier(c.id);
      this.message.set(`Publié · cle_stable = ${out.catalogCleCreee ?? '—'}`);
      this.selectedId.set(undefined);
      await this.refresh();
    } catch (e) {
      const err = e as { error?: { code?: string; message?: string } };
      this.erreur.set(err?.error?.code ?? err?.error?.message ?? 'Publication refusée.');
    } finally {
      this.chargement.set(false);
    }
  }

  async refuser(c: CatalogCandidat): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Refuser le candidat',
      message: `Refuser « ${c.libellePropose} » ?`,
      variant: 'danger',
      confirmLabel: 'Refuser',
    });
    if (!ok) return;
    this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      await this.api.refuser(c.id);
      this.message.set('Candidat refusé.');
      this.selectedId.set(undefined);
      await this.refresh();
    } catch (e) {
      const err = e as { error?: { code?: string; message?: string } };
      this.erreur.set(err?.error?.code ?? err?.error?.message ?? 'Refus impossible.');
    } finally {
      this.chargement.set(false);
    }
  }

  fmtNum(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return Number(value).toLocaleString('fr-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }
}
