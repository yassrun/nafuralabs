
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';

import { ButtonComponent, ScreenComponent } from '@platform/lib/anatomy';
import type { PageHeaderConfig } from '@platform/lib/anatomy';
import { MadCurrencyPipe } from '@platform/lib/anatomy/pipes/mad-currency.pipe';

import { openCatalogItemPicker } from '@app/etudes/dossiers/components/catalog-item-pick-dialog/catalog-item-pick-dialog.component';
import { ErpLookupService, partnerLookupLabel } from '@app/socle/shared/services/erp-lookup.service';

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
    ScreenComponent,
    ButtonComponent,
    MadCurrencyPipe
],
  templateUrl: './comparateur-fournisseurs.page.html',
  styleUrl: './comparateur-fournisseurs.page.scss',
})
export class ComparateurFournisseursPage {
  private readonly api = inject(CatalogueFournisseurApiService);
  private readonly dialog = inject(MatDialog);
  private readonly erpLookup = inject(ErpLookupService);

  readonly headerConfig: PageHeaderConfig = {
    title: 'Comparateur fournisseurs',
    subtitle: 'Prix commercial et comparable — tri par prix / unité de base',
  };

  readonly articleId = signal('');
  readonly pickedArticleLabel = signal('');
  readonly fournisseurLabels = signal<Record<string, string>>({});
  readonly dateRef = signal(new Date().toISOString().slice(0, 10));
  readonly offres = signal<ComparateurOffre[]>([]);
  readonly chargement = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly searched = signal(false);

  async openArticlePicker(): Promise<void> {
    const result = await openCatalogItemPicker(this.dialog, {
      context: 'lookup',
      uniteOptions: [],
    });
    if (!result?.itemId) return;
    this.articleId.set(result.itemId);
    const label = [result.code, result.name].filter(Boolean).join(' — ') || result.name;
    this.pickedArticleLabel.set(label);
    this.searched.set(false);
    this.offres.set([]);
    this.erreur.set(undefined);
  }

  async comparer(): Promise<void> {
    const id = this.articleId().trim();
    if (!id) {
      this.erreur.set('Choisissez un article.');
      return;
    }
    this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      const rows = await this.api.comparer(id, this.dateRef() || null);
      this.offres.set(rows ?? []);
      await this.resolveFournisseurLabels(rows ?? []);
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

  fournisseurLabel(row: ComparateurOffre): string {
    const resolved = this.fournisseurLabels()[row.fournisseurId];
    if (resolved && !this.looksLikeUuid(resolved)) return resolved;
    if (row.designation?.trim() && !this.looksLikeUuid(row.designation)) return row.designation.trim();
    return resolved ?? '—';
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

  private async resolveFournisseurLabels(rows: ComparateurOffre[]): Promise<void> {
    const ids = [...new Set(rows.map((r) => r.fournisseurId).filter(Boolean))];
    const updates: Record<string, string> = {};
    await Promise.all(
      ids.map(async (id) => {
        if (this.fournisseurLabels()[id]) return;
        const partner = await this.erpLookup.partnerById(id);
        if (partner) updates[id] = partnerLookupLabel(partner);
      }),
    );
    if (Object.keys(updates).length) {
      this.fournisseurLabels.update((map) => ({ ...map, ...updates }));
    }
  }

  private looksLikeUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(value);
  }
}
