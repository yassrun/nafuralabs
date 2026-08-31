import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ButtonComponent,
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
  LOOKUP_SEARCHERS,
  NfSelectComponent,
  type LookupSearchFn,
} from '@platform/lib/anatomy';
import type { DetailActionEvent, LookupItem } from '@platform/lib/anatomy/types';
import type { BCStatus, BonCommande, BonCommandeCreate, MatchingReception, BCLigne } from '@app/achats/models';
import type { DemandeAchat } from '@app/achats/models';
import { MatchingService } from '@app/achats/services/matching.service';
import { SubmitApprovalButtonComponent } from '@app/socle/approbations/components/submit-approval-button/submit-approval-button.component';
import { DocScanButtonComponent } from '@app/socle/shared/components/doc-scan-button/doc-scan-button.component';
import {
  findStringByAliases,
  normalizeDate,
  toNumber,
  extractLines,
} from '@app/socle/shared/utils/extraction-json.utils';

import { DemandeApiService } from '@app/achats/demandes/services/demande-api.service';
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
  imports: [CommonModule, DecimalPipe, FormsModule, RouterLink, TranslateModule, ButtonComponent, NfSelectComponent, DocScanButtonComponent, ...ConfigDrivenDetailPageImports, SubmitApprovalButtonComponent],
  templateUrl: './bc-detail.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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
    .bc-rec-form input { padding: 6px 8px; border: 1px solid var(--nf-color-border); border-radius: 4px; min-width: 180px; }
    .bc-rec-form nf-select { min-width: 280px; }
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
  private readonly translate = inject(TranslateService);
  private readonly demandeApi = inject(DemandeApiService);
  private readonly lookupSearchers = inject(LOOKUP_SEARCHERS, { optional: true });

  readonly searchLocationsDepot: LookupSearchFn = (q) =>
    this.lookupSearchers?.['locationsDepot']?.(q) ?? Promise.resolve([]);

  readonly matchSummary = signal<MatchingReception | null>(null);
  readonly receptions = signal<ApiReceptionAchat[]>([]);
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
      this.crud.ensureFournisseurLookup(bc);
      sub = matchingSvc.loadMatchingForBc(bc.id).subscribe((m) => this.matchSummary.set(m));
      void this.loadReceptions(bc.id);
    });
  }

  readonly facade = createDetailFacadeFromCrud<BonCommande, BonCommandeCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildBcDetailConfig(this.translate);

  override ngOnInit(): void {
    super.ngOnInit();
    if (this.mode() !== 'create') return;
    void this.prefillFromQuery();
  }

  private async prefillFromQuery(): Promise<void> {
    const q = this.route.snapshot.queryParamMap;
    const daId = q.get('daId')?.trim();
    const daNumero = q.get('daNumero')?.trim();
    const chantierId = q.get('chantierId')?.trim();
    const noeudId = q.get('noeudId')?.trim();
    const current = this.item() ?? ({} as BonCommande);
    let patch: Partial<BonCommande> = {
      ...current,
      ...(daId ? { daId } : {}),
      ...(daNumero ? { daNumero } : {}),
      ...(chantierId ? { chantierId } : {}),
      ...(noeudId ? { noeudId } : {}),
    };
    if (daId) {
      try {
        const da: DemandeAchat = await this.demandeApi.getById(daId);
        patch = {
          ...patch,
          daId: da.id,
          daNumero: da.numero,
          chantierId: patch.chantierId || da.chantierId,
          noeudId: patch.noeudId || da.noeudId,
          lignes: (da.lignes ?? []).map((l) => ({
            id: '',
            bcId: '',
            articleId: l.articleId,
            articleCode: l.articleCode,
            articleName: l.articleName,
            quantite: l.quantite,
            quantiteLivree: 0,
            quantiteFacturee: 0,
            uomCode: l.uomCode,
            prixUnitaireHt: l.prixEstimeHt ?? 0,
            totalHt: l.totalEstimeHt ?? (l.quantite * (l.prixEstimeHt ?? 0)),
            notes: l.notes,
          })),
        };
      } catch {
        // DA introuvable : on garde les query params.
      }
    }
    this.item.set({ ...current, ...patch } as BonCommande);
  }

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
  }

  updateLineQty(index: number, value: string): void {
    const qty = Number(value);
    this.receptionLines.update((rows) =>
      rows.map((r, i) =>
        i === index
          ? { ...r, quantiteRecue: Number.isFinite(qty) ? Math.max(0, qty) : 0 }
          : r,
      ),
    );
  }

  async submitReception(): Promise<void> {
    const bc = this.item();
    const dest = this.destLocationId().trim();
    if (!bc?.id) return;
    const over = this.receptionLines().find((l) => l.quantiteRecue > l.remaining);
    if (over) {
      this.showError(
        `Écart BL : ${over.quantiteRecue} reçus pour ${over.remaining} restants sur ${over.articleLabel}. Refusé.`,
      );
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
        ...(dest ? { destLocationId: dest } : {}),
        blNumero: this.blNumero().trim() || undefined,
        dateReception: new Date().toISOString().slice(0, 10),
        lignes,
      });
      const updated = await this.crud.getItem(bc.id);
      this.item.set(updated);
      this.showReceptionForm.set(false);
      await this.loadReceptions(bc.id);
      this.matchingSvc.loadMatchingForBc(bc.id).subscribe((m) => this.matchSummary.set(m));
      this.showSuccess(
        dest
          ? 'Réception enregistrée — mouvement stock RECEPTION créé.'
          : 'Réception directe chantier — sans magasin.',
      );
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
      globalThis.print();
      return;
    }

    await super.handleCustomAction(event);
  }

  private updateCommandeReference(data: Record<string, unknown>): void {
    const cmdReference = findStringByAliases(data, [
      'commandeNumber', 'numero', 'reference', 'docNumber', 'orderRef',
    ]);
    if (cmdReference) {
      this.item.update((current) => (current ? { ...current, numero: cmdReference } : current));
    }
  }

  private updateCommandeDate(data: Record<string, unknown>): void {
    const dateCommande = normalizeDate(findStringByAliases(data, [
      'commandeDate', 'dateCommande', 'date', 'orderDate', 'dateOrder',
    ]));
    if (dateCommande) {
      this.item.update((current) => (current ? { ...current, dateCreation: dateCommande } : current));
    }
  }

  private updateFournisseur(data: Record<string, unknown>): void {
    const supplierName = findStringByAliases(data, [
      'fournisseur', 'supplier', 'fournisseurName', 'vendorName',
    ]);
    if (supplierName) {
      const normalized = supplierName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const lookupData = this.lookups()['partenaires'] ?? [];
      const matched = lookupData.find((p: LookupItem) =>
        p.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalized),
      );
      if (matched) {
        const fournisseurId = String(matched.key);
        this.item.update((current) => (current ? {
          ...current,
          fournisseurId,
          fournisseurName: matched.value,
        } : current));
      }
    }
  }

  private updateLignes(data: Record<string, unknown>): void {
    const rawLines = extractLines(data, [
      'lignes', 'lines', 'items', 'details', 'lineItems',
    ]);

    if (rawLines.length > 0) {
      const current = this.item();
      if (!current) {
        return;
      }

      const mappedLignes: BCLigne[] = rawLines
        .map((line) => this.mapExtractedLine(line))
        .filter((l) => l.articleName || l.quantite > 0);

      if (mappedLignes.length > 0) {
        this.item.set({
          ...current,
          lignes: mappedLignes,
        });
      }
    }
  }

  private mapExtractedLine(line: Record<string, unknown>): BCLigne {
    const current = this.item();
    const articleId = findStringByAliases(line, [
      'articleId', 'article', 'articleCode', 'code', 'sku',
    ]) ?? '';
    const designation = findStringByAliases(line, [
      'designation', 'description', 'label', 'name', 'articleName',
    ]) ?? articleId;
    const quantite = toNumber(findStringByAliases(line, [
      'quantite', 'quantity', 'qte', 'qty', 'montantCommande',
    ]));
    const prixUnitaire = toNumber(findStringByAliases(line, [
      'prixUnitaire', 'price', 'unitPrice', 'prixUnitaireHt', 'pu',
    ]));

    return {
      id: '',
      bcId: current?.id ?? '',
      articleId,
      articleCode: articleId,
      articleName: designation,
      quantite: quantite || 0,
      quantiteLivree: 0,
      quantiteFacturee: 0,
      prixUnitaireHt: prixUnitaire || 0,
      totalHt: Math.round((quantite || 0) * (prixUnitaire || 0) * 100) / 100,
    };
  }

  onScanCommande(data: Record<string, unknown>): void {
    this.updateCommandeReference(data);
    this.updateCommandeDate(data);
    this.updateFournisseur(data);
    this.updateLignes(data);
    this.showSuccess(this.translate.instant('achats.commande.scan.success'));
  }
}
