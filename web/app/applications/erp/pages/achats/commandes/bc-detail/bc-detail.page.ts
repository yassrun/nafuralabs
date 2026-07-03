import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ButtonComponent,
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { DetailActionEvent } from '@lib/anatomy/types';
import type { BCStatus, BonCommande, BonCommandeCreate, MatchingReception } from '@applications/erp/achats/models';
import { MatchingService } from '@applications/erp/achats/services/matching.service';
import type { Location } from '@applications/erp/inventory/models';
import { ErpLookupService } from '@applications/erp/shared/services/erp-lookup.service';
import { SubmitApprovalButtonComponent } from '@applications/erp/pages/approbations/components/submit-approval-button/submit-approval-button.component';

import { BcFacade, type ApiReceptionAchat } from '../services';
import { buildBcDetailConfig } from '../config';

interface ReceptionLineDraft {
  bonCommandeLigneId: string;
  articleId: string;
  articleLabel: string;
  remaining: number;
  quantiteRecue: number;
}

@Component({
  selector: 'app-bc-detail',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterLink, TranslateModule, ButtonComponent, ...ConfigDrivenDetailPageImports, SubmitApprovalButtonComponent],
  templateUrl: './bc-detail.page.html',
  styles: [ConfigDrivenDetailPageStyles, `
    .approval-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
      background: var(--nf-color-bg-subtle);
      border: 1px solid var(--nf-color-border);
      border-radius: 0.5rem;
    }
    .approval-bar__label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--nf-color-text-secondary);
    }
    .bc-rec {
      margin-bottom: 1rem;
      padding: 1rem;
      background: var(--nf-color-surface);
      border: 1px solid var(--nf-color-border);
      border-radius: 0.5rem;
    }
    .bc-rec h3 { margin: 0 0 0.75rem; font-size: 0.95rem; color: var(--nf-text-primary); }
    .bc-rec__meta { font-size: 12px; color: var(--nf-color-text-secondary); margin-bottom: 0.75rem; }
    .bc-rec__status { font-weight: 700; color: var(--nf-text-primary); }
    .bc-rec__status--bloque { color: var(--nf-color-danger-700); }
    .bc-rec table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .bc-rec th, .bc-rec td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--nf-color-bg-muted); }
    .bc-rec th { background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); }
    .bc-rec .num { text-align: right; font-variant-numeric: tabular-nums; }
    .bc-rec .bloq { color: var(--nf-color-danger-700); font-weight: 600; }
    .bc-rec-form {
      margin-bottom: 1rem;
      padding: 1rem;
      background: var(--nf-color-success-50);
      border: 1px solid var(--nf-color-success-200);
      border-radius: 0.5rem;
    }
    .bc-rec-form h3 { margin: 0 0 0.75rem; font-size: 0.95rem; }
    .bc-rec-form__row { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 0.75rem; }
    .bc-rec-form label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--nf-color-text-secondary); }
    .bc-rec-form select, .bc-rec-form input { padding: 6px 8px; border: 1px solid var(--nf-color-border); border-radius: 4px; min-width: 180px; }
    .bc-rec-qty-input { width: 80px; text-align: right; min-width: 0; }
    .bc-rec-form__actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
    .bc-rec-form button { padding: 6px 12px; border-radius: 4px; border: none; cursor: pointer; font-size: 13px; }
    .bc-rec-form button.primary { background: var(--nf-color-success-600); color: var(--nf-color-surface); }
    .bc-rec-form button.secondary { background: var(--nf-color-border); color: var(--nf-text-primary); }
    .bc-rec-list { margin: 0.5rem 0 0; padding-left: 1.25rem; font-size: 12px; color: var(--nf-color-text-secondary); }
  `],
})
export class BcDetailPage extends ConfigDrivenDetailPage<BonCommande> {
  private readonly crud = inject(BcFacade);
  private readonly matchingSvc = inject(MatchingService);
  private readonly erpLookup = inject(ErpLookupService);
  private readonly translate = inject(TranslateService);

  readonly matchSummary = signal<MatchingReception | null>(null);
  readonly receptions = signal<ApiReceptionAchat[]>([]);
  readonly locations = signal<Location[]>([]);
  readonly showReceptionForm = signal(false);
  readonly receptionSaving = signal(false);
  readonly destLocationId = signal('');
  readonly blNumero = signal('');
  readonly receptionLines = signal<ReceptionLineDraft[]>([]);

  constructor() {
    super();
    const matchingSvc = this.matchingSvc;
    effect((onCleanup) => {
      const bc = this.item();
      const mode = this.mode();
      let sub: { unsubscribe(): void } | undefined;
      onCleanup(() => { sub?.unsubscribe(); });
      if (!bc?.id || mode === 'create') {
        this.matchSummary.set(null);
        this.receptions.set([]);
        return;
      }
      sub = matchingSvc.loadMatchingForBc(bc.id).subscribe((m) => this.matchSummary.set(m));
      void this.loadReceptions(bc.id);
    });
  }

  readonly facade = createDetailFacadeFromCrud<BonCommande, BonCommandeCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildBcDetailConfig(this.translate);

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('achats.commande.createTitle');
    const item = this.item();
    return item ? `${item.numero} — ${item.fournisseurName ?? ''}` : this.translate.instant('achats.commande.detailTitle');
  }

  private async loadReceptions(bcId: string): Promise<void> {
    try {
      this.receptions.set(await this.crud.listReceptions(bcId));
    } catch {
      this.receptions.set([]);
    }
  }

  private async ensureLocations(): Promise<void> {
    if (this.locations().length) return;
    const rows = await this.erpLookup.locations();
    this.locations.set(
      rows
        .map((row) => row.data as Location | undefined)
        .filter((l): l is Location => {
          if (!l) return false;
          const type = String(l.type);
          // API returns WAREHOUSE; inventory UI uses ENTREPOT/DEPOT (see location-api.service).
          return type === 'DEPOT' || type === 'CHANTIER' || type === 'ENTREPOT' || type === 'WAREHOUSE';
        }),
    );
  }

  private openReceptionForm(bc: BonCommande): void {
    const lines: ReceptionLineDraft[] = (bc.lignes ?? [])
      .map((l) => {
        const remaining = Math.max(0, l.quantite - l.quantiteLivree);
        return {
          bonCommandeLigneId: l.id,
          articleId: l.articleId,
          articleLabel: l.articleName ?? l.articleCode ?? l.articleId,
          remaining,
          quantiteRecue: remaining,
        };
      })
      .filter((l) => l.remaining > 0);
    this.receptionLines.set(lines);
    this.destLocationId.set('');
    this.blNumero.set('');
    this.showReceptionForm.set(true);
    void this.ensureLocations();
  }

  updateLineQty(index: number, value: string): void {
    const qty = Number(value);
    this.receptionLines.update((rows) =>
      rows.map((r, i) =>
        i === index
          ? { ...r, quantiteRecue: Number.isFinite(qty) ? Math.min(Math.max(0, qty), r.remaining) : 0 }
          : r,
      ),
    );
  }

  async submitReception(): Promise<void> {
    const bc = this.item();
    const dest = this.destLocationId().trim();
    if (!bc?.id) return;
    if (!dest) {
      this.showError('Sélectionnez un dépôt ou chantier de destination.');
      return;
    }
    const lignes = this.receptionLines()
      .filter((l) => l.quantiteRecue > 0)
      .map((l) => ({
        bonCommandeLigneId: l.bonCommandeLigneId,
        articleId: l.articleId,
        quantiteRecue: l.quantiteRecue,
      }));
    if (!lignes.length) {
      this.showError('Indiquez au moins une quantité reçue.');
      return;
    }
    this.receptionSaving.set(true);
    try {
      await this.crud.createReception(bc.id, {
        destLocationId: dest,
        blNumero: this.blNumero().trim() || undefined,
        dateReception: new Date().toISOString().slice(0, 10),
        lignes,
      });
      const updated = await this.crud.getItem(bc.id);
      this.item.set(updated);
      this.showReceptionForm.set(false);
      await this.loadReceptions(bc.id);
      this.matchingSvc.loadMatchingForBc(bc.id).subscribe((m) => this.matchSummary.set(m));
      this.showSuccess('Réception enregistrée — mouvement stock RECEPTION créé.');
    } catch (e) {
      this.showError((e as Error).message ?? 'Erreur réception');
    } finally {
      this.receptionSaving.set(false);
    }
  }

  protected override async handleCustomAction(event: DetailActionEvent<BonCommande>): Promise<void> {
    const item = event.item;
    const statusMap: Partial<Record<string, BCStatus>> = {
      valider: 'VALIDE', envoyer: 'ENVOYE',
      accuser_reception: 'ACCUSE_RECEPTION', cloturer: 'CLOTURE', annuler: 'ANNULE',
    };

    if (event.actionId === 'receptionner' && item) {
      this.openReceptionForm(item);
      return;
    }

    if (event.actionId in statusMap && item) {
      const next = statusMap[event.actionId]!;
      const updated = await this.crud.changeStatus(item.id, next);
      this.item.set(updated);
      this.showSuccess(
        this.translate.instant('achats.commande.toasts.statusUpdated').replace('{numero}', updated.numero),
      );
      return;
    }

    if (event.actionId === 'imprimer_bc' && item) {
      window.print();
      return;
    }

    await super.handleCustomAction(event);
  }
}
