import { CommonModule, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { PageHeaderConfig } from '@lib/anatomy/components';
import { ButtonComponent, PageHeaderComponent, PageShellComponent } from '@lib/anatomy/components';
import { ToastService } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';

import type { DPGF, Metre, NoeudDPGF } from '@applications/erp/etudes/models';
import { DpgfApiService } from '../services';
import { MetreFacade } from '../services';

interface FlatDpgfRow {
  depth: number;
  node: NoeudDPGF;
}

function flattenDpgf(nodes: NoeudDPGF[], depth = 0): FlatDpgfRow[] {
  const out: FlatDpgfRow[] = [];
  for (const n of nodes) {
    out.push({ depth, node: n });
    if (n.enfants?.length) out.push(...flattenDpgf(n.enfants, depth + 1));
  }
  return out;
}

function sommaireLots(nodes: NoeudDPGF[]): { code: string; libelle: string; total: number }[] {
  const rows: { code: string; libelle: string; total: number }[] = [];
  for (const lot of nodes) {
    if (lot.type !== 'LOT') continue;
    const sub = lot.enfants ?? [];
    let lotTotal = 0;
    for (const sl of sub) {
      const arts = sl.enfants?.filter((x) => x.type === 'ARTICLE') ?? [];
      lotTotal += arts.reduce((s, a) => s + (a.total ?? 0), 0);
    }
    rows.push({ code: lot.code, libelle: lot.libelle, total: Math.round(lotTotal * 100) / 100 });
  }
  return rows;
}

@Component({
  selector: 'app-metre-dpgf',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    RouterLink,
    TranslateModule,
    PageShellComponent,
    PageHeaderComponent,
    ButtonComponent,
    MadCurrencyPipe,
  ],
  templateUrl: './metre-dpgf.page.html',
  styleUrl: './metre-dpgf.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetreDpgfPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly metreFacade = inject(MetreFacade);
  private readonly dpgfApi = inject(DpgfApiService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly metre = signal<Metre | null>(null);
  readonly dpgf = signal<DPGF | null>(null);
  readonly loading = signal(true);
  readonly flatRows = computed(() => {
    const h = this.dpgf()?.hierarchie ?? [];
    return flattenDpgf(h);
  });
  readonly sommaire = computed(() => sommaireLots(this.dpgf()?.hierarchie ?? []));

  readonly pageHeaderConfig = computed((): PageHeaderConfig => {
    const m = this.metre();
    const t = (k: string) => this.translate.instant(k);
    return {
      title: 'etudesDpu.metreDpgfTitle',
      subtitle: 'etudesDpu.metreDpgfSubtitle',
      breadcrumbs: [
        { label: t('nav.etudes.metres'), route: '/etudes/metres' },
        {
          label: m?.numero ?? '—',
          route: m ? `/etudes/metres/${m.id}` : '/etudes/metres',
        },
        { label: t('etudesDpu.metreDpgfTitle') },
      ],
    };
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((p) => {
      const id = p.get('id');
      void this.load(id);
    });
  }

  private async load(metreId: string | null): Promise<void> {
    this.loading.set(true);
    if (!metreId) {
      this.metre.set(null);
      this.dpgf.set(null);
      this.loading.set(false);
      return;
    }
    try {
      const m = await this.metreFacade.getItem(metreId);
      this.metre.set(m);
      const allDpgf = await this.dpgfApi.listByMetre(metreId);
      const existing = allDpgf[0] ?? null;
      this.dpgf.set(existing ? await this.dpgfApi.getArbre(existing.id) : null);
    } catch {
      this.metre.set(null);
      this.dpgf.set(null);
      this.toast.error(this.translate.instant('etudesDpu.noMetre'));
    } finally {
      this.loading.set(false);
    }
  }

  async generate(): Promise<void> {
    const m = this.metre();
    if (!m) return;
    try {
      const created = await this.dpgfApi.createFromMetre(m.id);
      this.dpgf.set(created);
      this.toast.success(`${created.numero} — ${this.translate.instant('etudesDpu.toastDpgfOk')}`);
    } catch (e) {
      this.toast.error(String(e));
    }
  }

  async createDevis(): Promise<void> {
    const d = this.dpgf();
    if (!d) {
      this.toast.error(this.translate.instant('etudesDpu.toastNeedDpgf'));
      return;
    }
    await this.router.navigate(['/etudes/devis/from-dpgf', d.id]);
  }

  printPdf(): void {
    window.print();
  }

  rowPad(depth: number): string {
    return `${12 + depth * 16}px`;
  }
}
