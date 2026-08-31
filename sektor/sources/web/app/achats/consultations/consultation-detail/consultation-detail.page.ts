import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
  type NfSelectOption,
} from '@platform/lib/anatomy';
import { FieldTemplateDirective } from '@platform/lib/anatomy/components/organisms/entity-detail';
import {
  SmartImportTriggerComponent,
  type ReviewedExtraction,
} from '@platform/app/document-extraction/smart-import';

import {
  DEVIS_CONSULTATION_IMPORT_DEFINITION,
  DevisConsultationImportService,
} from '@app/socle/shared/smart-import/handlers/devis-consultation-import.handler';

import { buildConsultationDetailConfig } from '../config';
import {
  ConsultationAchatApiService,
  ConsultationFacade,
  type ConsultationAchat,
  type ConsultationDestinataire,
  type ConsultationDevisLigne,
  type ConsultationEnvoi,
  type PartnerContactRow,
} from '../services';

@Component({
  selector: 'app-consultation-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    ...ConfigDrivenDetailPageImports,
    FieldTemplateDirective,
    SmartImportTriggerComponent,
    ButtonComponent,
    NfSelectComponent,
  ],
  templateUrl: './consultation-detail.page.html',
  styleUrl: './consultation-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    ConfigDrivenDetailPageStyles,
    `
      .cs-import-block,
      .cs-dest-block {
        margin-top: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        max-width: 48rem;
      }
      .cs-import-block h2,
      .cs-dest-block h2 {
        margin: 0;
        font-size: 1rem;
      }
      .cs-callout {
        margin: 0;
        padding: 0.75rem 1rem;
        background: var(--nf-color-surface-muted, #f4f6f8);
        border-radius: 0.35rem;
      }
      .cs-hint,
      .cs-empty {
        margin: 0;
        color: var(--nf-color-text-secondary, #5c6570);
      }
      .cs-error {
        margin: 0;
        color: var(--nf-color-danger, #b42318);
      }
      .cs-import-block table,
      .cs-panier-table,
      .cs-dest-table,
      .cs-journal-table {
        width: 100%;
        border-collapse: collapse;
      }
      .cs-import-block th,
      .cs-import-block td,
      .cs-panier-table th,
      .cs-panier-table td,
      .cs-dest-table th,
      .cs-dest-table td,
      .cs-journal-table th,
      .cs-journal-table td {
        text-align: left;
        padding: 0.45rem 0.65rem;
        border-bottom: 1px solid var(--nf-color-border, #e2e5e9);
      }
      .cs-dest-add {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: flex-end;
      }
      .cs-dest-add nf-select {
        min-width: 16rem;
      }
      .cs-dest-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
      }
      .cs-dest-table td nf-smart-import-trigger {
        display: inline-flex;
      }
    `,
  ],
})
export class ConsultationDetailPage extends ConfigDrivenDetailPage<ConsultationAchat> {
  private readonly crud = inject(ConsultationFacade);
  private readonly api = inject(ConsultationAchatApiService);
  private readonly importer = inject(DevisConsultationImportService);
  private readonly translate = inject(TranslateService);
  private readonly lookupSearchers = inject(LOOKUP_SEARCHERS, { optional: true });

  readonly facade = createDetailFacadeFromCrud<ConsultationAchat>({
    crud: this.crud,
  });
  readonly config = buildConsultationDetailConfig(this.translate);
  readonly importDefinition = DEVIS_CONSULTATION_IMPORT_DEFINITION;
  readonly importHint = signal<string | undefined>(undefined);
  readonly importErreur = signal<string | undefined>(undefined);

  private fournisseurHits: Array<{ value: string; label: string }> = [];

  readonly searchFournisseurs: LookupSearchFn = async (q) => {
    const hits = await (this.lookupSearchers?.['fournisseurs']?.(q) ?? Promise.resolve([]));
    this.fournisseurHits = hits;
    return hits;
  };

  readonly draftFournisseurId = signal('');
  readonly draftFournisseurLabel = signal('');
  readonly draftContactId = signal('');
  readonly contactsEmail = signal<PartnerContactRow[]>([]);
  readonly sansEmailFournisseurId = signal<string | undefined>(undefined);
  readonly destErreur = signal<string | undefined>(undefined);
  readonly destSaving = signal(false);
  readonly envoyerErreur = signal<string | undefined>(undefined);
  readonly envoyerSaving = signal(false);

  get headerTitle(): string {
    const item = this.item();
    return item?.numero
      ? item.numero
      : this.translate.instant('achats.consultation.detailTitle');
  }

  protected override async loadItem(id: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const item = await this.facade.loadById(id);
      this.item.set(item);
      this.mode.set('view');
    } catch {
      this.showError(this.translate.instant('achats.consultation.loadError'));
      this.navigateToList();
    } finally {
      this.isLoading.set(false);
    }
  }

  panierCles(): string[] {
    return this.item()?.clesStables ?? [];
  }

  lignes(): ConsultationDevisLigne[] {
    return (this.item()?.devis ?? []).flatMap((d) => d.lignes ?? []);
  }

  destinataires(): ConsultationDestinataire[] {
    return this.item()?.destinataires ?? [];
  }

  envois(): ConsultationEnvoi[] {
    return this.item()?.envois ?? [];
  }

  panierFige(): boolean {
    return this.envois().length > 0;
  }

  canEnvoyer(): boolean {
    const sent = new Set(this.envois().map((e) => e.destinataireId));
    return this.destinataires().some((d) => d.id && !sent.has(d.id));
  }

  statutDestinataire(row: ConsultationDestinataire): string {
    const code = (row.statut || 'EN_ATTENTE').toUpperCase();
    const key =
      code === 'DEVIS_RECU'
        ? 'achats.consultation.destinataires.devisRecu'
        : 'achats.consultation.destinataires.enAttente';
    return this.translate.instant(key);
  }

  contactSelectOptions(): NfSelectOption[] {
    return this.contactsEmail().map((c) => ({
      value: c.id,
      label: `${c.nom} — ${c.email ?? ''}`.trim(),
    }));
  }

  async onFournisseurChange(id: string): Promise<void> {
    const value = (id || '').trim();
    this.draftFournisseurId.set(value);
    const hit = this.fournisseurHits.find((h) => h.value === value);
    this.draftFournisseurLabel.set(hit?.label ?? '');
    this.draftContactId.set('');
    this.sansEmailFournisseurId.set(undefined);
    this.destErreur.set(undefined);
    this.contactsEmail.set([]);
    if (!value) return;
    try {
      const all = await this.api.listPartnerContacts(value);
      const withEmail = (all ?? []).filter((c) => (c.email || '').trim());
      this.contactsEmail.set(withEmail);
      if (withEmail.length === 0) {
        this.sansEmailFournisseurId.set(value);
      } else if (withEmail.length === 1) {
        this.draftContactId.set(withEmail[0].id);
      }
    } catch {
      this.destErreur.set(this.translate.instant('achats.consultation.destinataires.error'));
    }
  }

  async addDestinataire(): Promise<void> {
    const current = this.item();
    const fournisseurId = this.draftFournisseurId().trim();
    if (!current || !fournisseurId) return;
    const contacts = this.contactsEmail();
    if (contacts.length > 1 && !this.draftContactId().trim()) {
      this.destErreur.set(this.translate.instant('achats.consultation.destinataires.contactRequis'));
      return;
    }
    this.destSaving.set(true);
    this.destErreur.set(undefined);
    try {
      const body: { fournisseurId: string; contactId?: string } = { fournisseurId };
      if (contacts.length > 1) {
        body.contactId = this.draftContactId().trim();
      }
      const saved = await this.api.addDestinataire(current.id, body);
      this.item.set(this.crud.enrich(saved));
      this.resetDestDraft();
    } catch (err) {
      const code = apiCode(err);
      if (code === 'consultation.destinataire.sans_email') {
        this.sansEmailFournisseurId.set(fournisseurId);
      } else if (code === 'consultation.destinataire.doublon') {
        this.destErreur.set(this.translate.instant('achats.consultation.destinataires.doublon'));
      } else if (code === 'consultation.destinataire.contact_requis') {
        this.destErreur.set(this.translate.instant('achats.consultation.destinataires.contactRequis'));
      } else {
        this.destErreur.set(this.translate.instant('achats.consultation.destinataires.error'));
      }
    } finally {
      this.destSaving.set(false);
    }
  }

  async envoyer(): Promise<void> {
    const current = this.item();
    if (!current || !this.canEnvoyer()) return;
    this.envoyerSaving.set(true);
    this.envoyerErreur.set(undefined);
    try {
      const saved = await this.api.envoyer(current.id);
      this.item.set(this.crud.enrich(saved));
    } catch {
      this.envoyerErreur.set(this.translate.instant('achats.consultation.envoyerError'));
    } finally {
      this.envoyerSaving.set(false);
    }
  }

  private resetDestDraft(): void {
    this.draftFournisseurId.set('');
    this.draftFournisseurLabel.set('');
    this.draftContactId.set('');
    this.contactsEmail.set([]);
    this.sansEmailFournisseurId.set(undefined);
    this.destErreur.set(undefined);
  }

  async onSmartImportComplete(result: ReviewedExtraction, destinataireId: string): Promise<void> {
    const current = this.item();
    if (!current || !destinataireId) {
      return;
    }
    this.importHint.set(undefined);
    this.importErreur.set(undefined);
    try {
      const saved = await this.importer.persist(current.id, result.data, 'import', destinataireId);
      if (!saved) {
        this.importHint.set(
          this.translate.instant('achats.consultation.import.emptyHint'),
        );
        return;
      }
      this.item.set(this.crud.enrich(saved));
    } catch {
      this.importErreur.set(this.translate.instant('achats.consultation.import.error'));
    }
  }
}

function apiCode(err: unknown): string | undefined {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { code?: string } | undefined;
    return body?.code;
  }
  return undefined;
}

