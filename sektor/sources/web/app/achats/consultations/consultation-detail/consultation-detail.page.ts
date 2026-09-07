import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import { FieldTemplateDirective } from '@platform/lib/anatomy/components/organisms/entity-detail';
import {
  SmartImportTriggerComponent,
  type ReviewedExtraction,
} from '@platform/app/document-extraction/smart-import';

import { ItemsApiService } from '@app/catalogue/services/items-api.service';
import { partnerRaisonSocialeFromLabel } from '@app/socle/shared/services/erp-lookup.service';
import {
  DEVIS_CONSULTATION_IMPORT_DEFINITION,
  DevisConsultationImportService,
} from '@app/socle/shared/smart-import/handlers/devis-consultation-import.handler';

import { toPanierLigne, type ConsultationPanierLigne } from '../consultation-panier-ligne';
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

interface DestDraftRow {
  key: string;
  id?: string;
  fournisseurId: string;
  fournisseurNom: string;
  contacts: PartnerContactRow[];
  statut: string;
  sent: boolean;
}

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
  styles: [ConfigDrivenDetailPageStyles],
})
export class ConsultationDetailPage extends ConfigDrivenDetailPage<ConsultationAchat> {
  private readonly crud = inject(ConsultationFacade);
  private readonly api = inject(ConsultationAchatApiService);
  private readonly itemsApi = inject(ItemsApiService);
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
  readonly panierLignes = signal<ConsultationPanierLigne[]>([]);

  private fournisseurHits: Array<{ value: string; label: string }> = [];

  readonly searchFournisseurs: LookupSearchFn = async (q) => {
    const hits = await (this.lookupSearchers?.['fournisseurs']?.(q) ?? Promise.resolve([]));
    this.fournisseurHits = hits;
    return hits;
  };

  readonly destDraft = signal<DestDraftRow[]>([]);
  readonly draftFournisseurId = signal('');
  readonly draftFournisseurLabel = signal('');
  readonly draftSelectedContactIds = signal<string[]>([]);
  readonly destContactsReady = signal(false);
  readonly contactsEmail = signal<PartnerContactRow[]>([]);
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
      this.applyItem(item);
      this.mode.set('view');
      await this.resolvePanier(item.clesStables ?? []);
    } catch {
      this.showError(this.translate.instant('achats.consultation.loadError'));
      this.navigateToList();
    } finally {
      this.isLoading.set(false);
    }
  }

  lignes(): ConsultationDevisLigne[] {
    return (this.item()?.devis ?? []).flatMap((d) => d.lignes ?? []);
  }

  destinataires(): DestDraftRow[] {
    return this.destDraft();
  }

  envois(): ConsultationEnvoi[] {
    return this.item()?.envois ?? [];
  }

  panierFige(): boolean {
    return this.envois().length > 0;
  }

  readonly destDirty = computed(() => {
    return snapshotDest(this.destDraft()) !== snapshotDest(this.serverDestRows());
  });

  canEnvoyer(): boolean {
    if (this.destDirty()) {
      return false;
    }
    const sent = new Set(this.envois().map((e) => e.destinataireId));
    return this.destDraft().some((d) => d.id && !sent.has(d.id));
  }

  readonly canAddDestinataire = computed(() => {
    if (!this.draftFournisseurId().trim() || !this.destContactsReady()) {
      return false;
    }
    return this.draftSelectedContactIds().length > 0;
  });

  statutDestinataire(row: DestDraftRow): string {
    if (!row.id) {
      return this.translate.instant('achats.consultation.destinataires.brouillon');
    }
    const code = (row.statut || 'EN_ATTENTE').toUpperCase();
    const key =
      code === 'DEVIS_RECU'
        ? 'achats.consultation.destinataires.devisRecu'
        : 'achats.consultation.destinataires.enAttente';
    return this.translate.instant(key);
  }

  contactsLabel(row: DestDraftRow): string {
    return row.contacts
      .map((c, i) => {
        const role = i === 0
          ? this.translate.instant('achats.consultation.destinataires.to')
          : this.translate.instant('achats.consultation.destinataires.cc');
        const nom = (c.nom || '').trim();
        const email = (c.email || '').trim();
        const who = [nom, email].filter(Boolean).join(' · ');
        return who ? `${who} (${role})` : role;
      })
      .join(', ');
  }

  isContactChecked(id: string): boolean {
    return this.draftSelectedContactIds().includes(id);
  }

  toggleDraftContact(id: string, checked: boolean): void {
    const current = this.draftSelectedContactIds();
    if (checked) {
      if (!current.includes(id)) {
        this.draftSelectedContactIds.set([...current, id]);
      }
      return;
    }
    this.draftSelectedContactIds.set(current.filter((x) => x !== id));
  }

  contactRole(index: number): string {
    return index === 0
      ? this.translate.instant('achats.consultation.destinataires.to')
      : this.translate.instant('achats.consultation.destinataires.cc');
  }

  async onFournisseurChange(id: string): Promise<void> {
    const value = (id || '').trim();
    this.draftFournisseurId.set(value);
    const hit = this.fournisseurHits.find((h) => h.value === value);
    this.draftFournisseurLabel.set(partnerRaisonSocialeFromLabel(hit?.label) || hit?.label || '');
    this.draftSelectedContactIds.set([]);
    this.destErreur.set(undefined);
    this.contactsEmail.set([]);
    this.destContactsReady.set(false);
    if (!value) return;
    try {
      const all = await this.api.listPartnerContacts(value);
      const withEmail = (all ?? [])
        .filter((c) => (c.email || '').trim())
        .sort((a, b) => Number(!!b.isPrimary) - Number(!!a.isPrimary));
      this.contactsEmail.set(withEmail);
      this.draftSelectedContactIds.set(withEmail.map((c) => c.id));
      this.destContactsReady.set(true);
    } catch {
      this.destErreur.set(this.translate.instant('achats.consultation.destinataires.error'));
    }
  }

  addDestinataire(): void {
    const fournisseurId = this.draftFournisseurId().trim();
    if (!fournisseurId || !this.canAddDestinataire()) return;
    const byId = new Map(this.contactsEmail().map((c) => [c.id, c]));
    const contacts = this.draftSelectedContactIds()
      .map((id) => byId.get(id))
      .filter((c): c is PartnerContactRow => !!c);
    if (!contacts.length) {
      this.destErreur.set(this.translate.instant('achats.consultation.destinataires.contactRequis'));
      return;
    }
    const existing = this.destDraft().find((d) => d.fournisseurId === fournisseurId);
    if (existing?.sent) {
      this.destErreur.set(this.translate.instant('achats.consultation.destinataires.doublon'));
      return;
    }
    const row: DestDraftRow = {
      key: existing?.key ?? `draft-${fournisseurId}`,
      id: existing?.id,
      fournisseurId,
      fournisseurNom: this.draftFournisseurLabel() || existing?.fournisseurNom || '',
      contacts,
      statut: existing?.statut || 'EN_ATTENTE',
      sent: false,
    };
    if (existing) {
      this.destDraft.set(this.destDraft().map((d) => (d.fournisseurId === fournisseurId ? row : d)));
    } else {
      this.destDraft.set([...this.destDraft(), row]);
    }
    this.resetDestDraft();
  }

  removeDestinataire(row: DestDraftRow): void {
    if (row.sent) return;
    this.destDraft.set(this.destDraft().filter((d) => d.key !== row.key));
  }

  async saveDestinataires(): Promise<void> {
    const current = this.item();
    if (!current || !this.destDirty()) return;
    this.destSaving.set(true);
    this.destErreur.set(undefined);
    try {
      const saved = await this.api.saveDestinataires(
        current.id,
        this.destDraft().map((d) => ({
          fournisseurId: d.fournisseurId,
          contactIds: d.contacts.map((c) => c.id),
        })),
      );
      this.applyItem(this.crud.enrich(saved));
    } catch (err) {
      const code = apiCode(err);
      if (code === 'consultation.destinataire.sans_email') {
        this.destErreur.set(this.translate.instant('achats.consultation.destinataires.sansEmail'));
      } else if (code === 'consultation.destinataire.doublon') {
        this.destErreur.set(this.translate.instant('achats.consultation.destinataires.doublon'));
      } else if (code === 'consultation.destinataire.contact_requis') {
        this.destErreur.set(this.translate.instant('achats.consultation.destinataires.contactRequis'));
      } else if (code === 'consultation.destinataire.deja_envoye') {
        this.destErreur.set(this.translate.instant('achats.consultation.destinataires.dejaEnvoye'));
      } else if (code === 'consultation.destinataire.contact_invalide') {
        this.destErreur.set(this.translate.instant('achats.consultation.destinataires.contactRequis'));
      } else {
        this.destErreur.set(this.translate.instant('achats.consultation.destinataires.saveError'));
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
      this.applyItem(this.crud.enrich(saved));
    } catch {
      this.envoyerErreur.set(this.translate.instant('achats.consultation.envoyerError'));
    } finally {
      this.envoyerSaving.set(false);
    }
  }

  private applyItem(item: ConsultationAchat): void {
    this.item.set(item);
    this.hydrateDestDraft(item);
  }

  private hydrateDestDraft(item: ConsultationAchat): void {
    const sent = new Set((item.envois ?? []).map((e) => e.destinataireId));
    this.destDraft.set((item.destinataires ?? []).map((d) => toDraftRow(d, sent.has(d.id))));
  }

  private serverDestRows(): DestDraftRow[] {
    const item = this.item();
    if (!item) return [];
    const sent = new Set((item.envois ?? []).map((e) => e.destinataireId));
    return (item.destinataires ?? []).map((d) => toDraftRow(d, sent.has(d.id)));
  }

  private resetDestDraft(): void {
    this.draftFournisseurId.set('');
    this.draftFournisseurLabel.set('');
    this.draftSelectedContactIds.set([]);
    this.contactsEmail.set([]);
    this.destContactsReady.set(false);
    this.destErreur.set(undefined);
  }

  private async resolvePanier(cles: string[]): Promise<void> {
    const unique = [...new Set(cles.map((c) => c.trim()).filter(Boolean))];
    if (!unique.length) {
      this.panierLignes.set([]);
      return;
    }
    const rows = await Promise.all(
      unique.map(async (cle) => toPanierLigne(cle, await this.itemsApi.getByCleStable(cle))),
    );
    this.panierLignes.set(rows);
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
      this.applyItem(this.crud.enrich(saved));
    } catch {
      this.importErreur.set(this.translate.instant('achats.consultation.import.error'));
    }
  }
}

function toDraftRow(d: ConsultationDestinataire, sent: boolean): DestDraftRow {
  const contacts: PartnerContactRow[] = (d.contacts ?? [])
    .filter((c) => c.id)
    .map((c) => ({
      id: c.id,
      partnerId: d.fournisseurId,
      nom: c.nom || '',
      email: c.email || d.contactEmail,
    }));
  if (!contacts.length && d.contactId) {
    contacts.push({
      id: d.contactId,
      partnerId: d.fournisseurId,
      nom: '',
      email: d.contactEmail,
    });
  }
  return {
    key: d.id,
    id: d.id,
    fournisseurId: d.fournisseurId,
    fournisseurNom: d.fournisseurNom,
    contacts,
    statut: d.statut,
    sent,
  };
}

function snapshotDest(rows: DestDraftRow[]): string {
  return JSON.stringify(
    rows.map((r) => ({
      fournisseurId: r.fournisseurId,
      contactIds: r.contacts.map((c) => c.id),
    })),
  );
}

function apiCode(err: unknown): string | undefined {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { code?: string } | undefined;
    return body?.code;
  }
  return undefined;
}
