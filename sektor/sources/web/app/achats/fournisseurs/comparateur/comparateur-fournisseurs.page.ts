
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonComponent, PageHeaderComponent, PageShellComponent } from '@platform/lib/anatomy';
import type { PageHeaderConfig } from '@platform/lib/anatomy';
import { MadCurrencyPipe } from '@platform/lib/anatomy/pipes/mad-currency.pipe';

import {
  CatalogueFournisseurApiService,
  type ComparateurOffre,
} from '../services/catalogue-fournisseur-api.service';

@Component({
  selector: 'app-comparateur-fournisseurs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    PageShellComponent,
    PageHeaderComponent,
    ButtonComponent,
    MadCurrencyPipe
],
  templateUrl: './comparateur-fournisseurs.page.html',
  styleUrl: './comparateur-fournisseurs.page.scss',
})
export class ComparateurFournisseursPage {
  private readonly api = inject(CatalogueFournisseurApiService);

  readonly headerConfig: PageHeaderConfig = {
    title: 'Comparateur fournisseurs',
    subtitle: 'Prix commercial et comparable — tri par prix / unité de base',
  };

  readonly articleId = signal('');
  readonly dateRef = signal(new Date().toISOString().slice(0, 10));
  readonly offres = signal<ComparateurOffre[]>([]);
  readonly chargement = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly searched = signal(false);

  async comparer(): Promise<void> {
    const id = this.articleId().trim();
    if (!id) {
      this.erreur.set('Saisissez un UUID article.');
      return;
    }
    this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      const rows = await this.api.comparer(id, this.dateRef() || null);
      this.offres.set(rows ?? []);
      this.searched.set(true);
    } catch (e) {
      const err = e as { error?: { code?: string; message?: string } };
      this.erreur.set(err?.error?.code ?? err?.error?.message ?? 'Comparaison impossible.');
      this.offres.set([]);
      this.searched.set(true);
    } finally {
      this.chargement.set(false);
    }
  }

  fmtNum(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '—';
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '—';
  }

  comparableLabel(row: ComparateurOffre): string {
    const prix = this.fmtNum(row.prixNormalise);
    if (prix === '—') return '—';
    const uom = row.uomNormaliseCode ? ` DH/${row.uomNormaliseCode}` : ' DH';
    return `${prix}${uom}`;
  }
}
