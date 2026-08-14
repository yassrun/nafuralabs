import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthFacade } from '@platform/core/security/services/auth.facade';

import type { MarchePropose } from '@app/etudes/models';

import {
  DossierEtudeApiService,
  type ChargeEtudeCandidat,
} from '../services/dossier-etude-api.service';

type IaFieldKey =
  | 'objet'
  | 'clientNom'
  | 'dateLimiteDepot'
  | 'aoReference'
  | 'aoType'
  | 'ville'
  | 'dateOuverturePlis'
  | 'delaiExecutionJours'
  | 'estimationMoaHt'
  | 'cautionProvisoire'
  | 'cautionDefinitive';

type IaFieldState = 'proposed' | 'accepted' | 'rejected';

interface IaFieldProposal {
  value: string | number;
  status: IaFieldState;
}

type CpsPhase = 'idle' | 'uploading' | 'indexing' | 'ready' | 'partial' | 'error';

/**
 * Création unifiée dossier d'étude + AO (ERP-10) :
 * CPS optionnel → propositions IA champ/champ → MOA texte (pas Partner).
 */
@Component({
  selector: 'app-dossier-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './dossier-create.page.html',
  styleUrl: './dossier-create.page.scss',
})
export class DossierCreatePage implements OnInit {
  private readonly api = inject(DossierEtudeApiService);
  private readonly nav = inject(Router);
  private readonly auth = inject(AuthFacade);

  readonly objet = signal('');
  readonly clientNom = signal('');
  readonly chargeEtudeUserId = signal<string | null>(null);
  readonly dateLimiteDepot = signal('');
  readonly aoReference = signal('');
  readonly aoType = signal<'PUBLIC' | 'PRIVE'>('PUBLIC');
  readonly ville = signal('');
  readonly dateOuverturePlis = signal('');
  readonly delaiExecutionJours = signal<number | null>(null);
  readonly estimationMoaHt = signal<number | null>(null);
  readonly cautionProvisoire = signal<number | null>(null);
  readonly cautionDefinitive = signal<number | null>(null);

  readonly ingenieurs = signal<ChargeEtudeCandidat[]>([]);
  readonly enCours = signal(false);
  readonly erreur = signal<string | undefined>(undefined);

  /** Draft créé silencieusement pour uploader le CPS avant finalize. */
  readonly draftId = signal<string | null>(null);
  readonly cpsPieceId = signal<string | null>(null);
  readonly cpsFileName = signal<string | null>(null);
  readonly cpsPhase = signal<CpsPhase>('idle');
  readonly iaConfiance = signal<number | null>(null);
  readonly iaFields = signal<Partial<Record<IaFieldKey, IaFieldProposal>>>({});

  readonly peutCreer = computed(
    () =>
      !!this.objet().trim() &&
      !!this.clientNom().trim() &&
      !!this.chargeEtudeUserId() &&
      !!this.dateLimiteDepot() &&
      !this.enCours() &&
      this.cpsPhase() !== 'uploading' &&
      this.cpsPhase() !== 'indexing',
  );

  readonly hasPendingIa = computed(() =>
    (Object.keys(this.iaFields()) as IaFieldKey[]).some((k) => this.iaPending(k)),
  );

  async ngOnInit(): Promise<void> {
    try {
      const list = await this.api.listIngenieurs();
      this.ingenieurs.set(list);
      const me = this.auth.user();
      if (me?.id && list.some((c) => c.userId === me.id)) {
        this.chargeEtudeUserId.set(me.id);
      } else if (list.length === 1) {
        this.chargeEtudeUserId.set(list[0].userId);
      }
    } catch {
      this.erreur.set("Impossible de charger la liste des ingénieurs (rôle BTP_INGENIEUR).");
    }
  }

  iaStatus(key: IaFieldKey): IaFieldState | null {
    const f = this.iaFields()[key];
    if (!f || !this.isSuggestionValue(f.value)) return null;
    return f.status;
  }

  iaValue(key: IaFieldKey): string | number | null {
    const f = this.iaFields()[key];
    if (!f || !this.isSuggestionValue(f.value)) return null;
    return f.value;
  }

  /** Affiche Accepter/Ignorer seulement s'il y a une vraie proposition. */
  iaPending(key: IaFieldKey): boolean {
    return this.iaStatus(key) === 'proposed';
  }

  accepter(key: IaFieldKey): void {
    const prop = this.iaFields()[key];
    if (!prop || prop.status !== 'proposed' || !this.isSuggestionValue(prop.value)) return;
    this.applyValue(key, prop.value);
    this.patchIa(key, { ...prop, status: 'accepted' });
  }

  ignorer(key: IaFieldKey): void {
    const prop = this.iaFields()[key];
    if (!prop || prop.status !== 'proposed') return;
    this.patchIa(key, { ...prop, status: 'rejected' });
  }

  accepterTout(): void {
    (Object.keys(this.iaFields()) as IaFieldKey[]).forEach((k) => {
      if (this.iaPending(k)) this.accepter(k);
    });
  }

  ignorerTout(): void {
    (Object.keys(this.iaFields()) as IaFieldKey[]).forEach((k) => {
      if (this.iaPending(k)) this.ignorer(k);
    });
  }

  async onCpsFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    await this.importerCps(file);
  }

  async importerCps(file: File): Promise<void> {
    if (!this.chargeEtudeUserId()) {
      this.erreur.set('Sélectionnez d’abord le chargé d’étude, puis importez le CPS.');
      return;
    }
    this.erreur.set(undefined);
    this.cpsPhase.set('uploading');
    this.cpsFileName.set(file.name);
    this.iaFields.set({});
    this.iaConfiance.set(null);

    try {
      const dossierId = await this.ensureDraft();
      const piece = await this.api.deposerDocument(dossierId, file, 'CPS');
      this.cpsPieceId.set(piece.id);
      this.cpsPhase.set('indexing');
      const prop = await this.pollProposition(dossierId, piece.id);
      if (!prop?.metadonnees) {
        this.cpsPhase.set('partial');
        this.erreur.set(
          'Extraction CPS partielle ou indisponible — complétez le formulaire manuellement.',
        );
        return;
      }
      this.applyProposition(prop);
      this.cpsPhase.set('ready');
    } catch (e) {
      this.cpsPhase.set('error');
      this.erreur.set(this.messageErreur(e, 'Import CPS échoué.'));
    }
  }

  async creer(): Promise<void> {
    if (!this.peutCreer()) return;

    const chargeId = this.chargeEtudeUserId()!;
    const charge = this.ingenieurs().find((c) => c.userId === chargeId);
    const payload = {
      objet: this.objet().trim(),
      clientNom: this.clientNom().trim(),
      chargeEtudeUserId: chargeId,
      chargeEtudeNom: charge?.displayName ?? charge?.email,
      dateLimiteDepot: this.dateLimiteDepot(),
      aoReference: this.aoReference().trim() || undefined,
      aoType: this.aoType(),
      ville: this.ville().trim() || undefined,
      dateOuverturePlis: this.dateOuverturePlis() || undefined,
      delaiExecutionJours: this.delaiExecutionJours() ?? undefined,
      estimationMoaHt: this.estimationMoaHt() ?? undefined,
      cautionProvisoire: this.cautionProvisoire() ?? undefined,
      cautionDefinitive: this.cautionDefinitive() ?? undefined,
    };

    this.enCours.set(true);
    this.erreur.set(undefined);
    try {
      const existingId = this.draftId();
      const dossier = existingId
        ? await this.api.update(existingId, payload)
        : await this.api.create(payload);
      this.draftId.set(null);
      await this.nav.navigate(['/etudes/dossiers', dossier.id]);
    } catch (e) {
      this.erreur.set(
        this.messageErreur(e, 'La création a échoué.', {
          403: "Vous n'avez pas la permission de créer un dossier d'étude.",
        }),
      );
      this.enCours.set(false);
    }
  }

  async annuler(): Promise<void> {
    const id = this.draftId();
    if (id) {
      try {
        await this.api.delete(id);
      } catch {
        /* orphan brouillon acceptable MVP */
      }
      this.draftId.set(null);
    }
    void this.nav.navigate(['/etudes/dossiers']);
  }

  private async ensureDraft(): Promise<string> {
    const existing = this.draftId();
    if (existing) return existing;
    const chargeId = this.chargeEtudeUserId()!;
    const charge = this.ingenieurs().find((c) => c.userId === chargeId);
    const draft = await this.api.create({
      objet: this.objet().trim() || 'Nouvelle étude',
      clientNom: this.clientNom().trim() || 'À préciser',
      chargeEtudeUserId: chargeId,
      chargeEtudeNom: charge?.displayName ?? charge?.email,
    });
    this.draftId.set(draft.id);
    return draft.id;
  }

  private async pollProposition(
    dossierId: string,
    cpsPieceId: string,
  ): Promise<MarchePropose | null> {
    // Attendre fin d'index CPS (sinon propose → 204 / meta vide).
    await this.waitCpsIndex(dossierId, cpsPieceId);

    for (const delay of [500, 1500, 3000, 5000]) {
      await this.sleep(delay);
      try {
        const prop = await this.api.proposerMarche(dossierId, cpsPieceId);
        if (this.hasMetaFields(prop?.metadonnees)) {
          return prop;
        }
      } catch {
        /* retry */
      }
    }
    return null;
  }

  private async waitCpsIndex(dossierId: string, cpsPieceId: string): Promise<void> {
    for (let i = 0; i < 40; i++) {
      try {
        const jobs = await this.api.listExtractionJobs(dossierId);
        const cpsJobs = jobs
          .filter((j) => j.jobType === 'CPS_INDEX')
          .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
        const job = cpsJobs.find((j) => j.dossierDocumentId === cpsPieceId) ?? cpsJobs[0];
        if (job?.status === 'SUCCEEDED') return;
        if (job?.status === 'FAILED' || job?.status === 'CANCELLED') return;
      } catch {
        /* ignore */
      }
      await this.sleep(1000);
    }
  }

  private hasMetaFields(meta: MarchePropose['metadonnees'] | null | undefined): boolean {
    if (!meta) return false;
    return Object.values(meta).some((v) => v != null && v !== '');
  }

  private applyProposition(prop: MarchePropose): void {
    this.iaConfiance.set(prop.confiance ?? 0.55);
    const meta = prop.metadonnees ?? {};
    const next: Partial<Record<IaFieldKey, IaFieldProposal>> = {};
    const put = (key: IaFieldKey, raw: string | number | null | undefined) => {
      if (!this.isSuggestionValue(raw)) return;
      next[key] = { value: raw as string | number, status: 'proposed' };
    };
    put('objet', meta.objet ?? undefined);
    put('clientNom', meta.donneurOrdre ?? undefined);
    put('dateLimiteDepot', this.asDateInput(meta.dateLimiteDepot));
    put('aoReference', meta.reference ?? undefined);
    put('aoType', meta.type === 'PRIVE' || meta.type === 'PUBLIC' ? meta.type : undefined);
    put('ville', meta.ville ?? undefined);
    put('dateOuverturePlis', this.asDateInput(meta.dateOuverturePlis));
    put('delaiExecutionJours', meta.delaiExecutionJours ?? undefined);
    put('estimationMoaHt', meta.estimationMoaHt ?? undefined);
    put('cautionProvisoire', meta.cautionProvisoire ?? undefined);
    put('cautionDefinitive', meta.cautionDefinitive ?? undefined);
    this.iaFields.set(next);
  }

  private isSuggestionValue(raw: string | number | null | undefined): boolean {
    if (raw == null) return false;
    if (typeof raw === 'string') return raw.trim().length > 0;
    return !Number.isNaN(raw);
  }

  private applyValue(key: IaFieldKey, value: string | number): void {
    switch (key) {
      case 'objet':
        this.objet.set(String(value));
        break;
      case 'clientNom':
        this.clientNom.set(String(value));
        break;
      case 'dateLimiteDepot':
        this.dateLimiteDepot.set(String(value));
        break;
      case 'aoReference':
        this.aoReference.set(String(value));
        break;
      case 'aoType':
        this.aoType.set(value === 'PRIVE' ? 'PRIVE' : 'PUBLIC');
        break;
      case 'ville':
        this.ville.set(String(value));
        break;
      case 'dateOuverturePlis':
        this.dateOuverturePlis.set(String(value));
        break;
      case 'delaiExecutionJours':
        this.delaiExecutionJours.set(Number(value));
        break;
      case 'estimationMoaHt':
        this.estimationMoaHt.set(Number(value));
        break;
      case 'cautionProvisoire':
        this.cautionProvisoire.set(Number(value));
        break;
      case 'cautionDefinitive':
        this.cautionDefinitive.set(Number(value));
        break;
    }
  }

  private patchIa(key: IaFieldKey, prop: IaFieldProposal): void {
    this.iaFields.update((cur) => ({ ...cur, [key]: prop }));
  }

  private asDateInput(raw: string | null | undefined): string | undefined {
    if (!raw) return undefined;
    // ISO date or LocalDate serialized as yyyy-MM-dd
    return raw.length >= 10 ? raw.slice(0, 10) : raw;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  private messageErreur(
    e: unknown,
    fallback: string,
    byStatus?: Record<number, string>,
  ): string {
    const err = e as { status?: number; error?: { message?: string; code?: string } };
    if (err?.status && byStatus?.[err.status]) return byStatus[err.status];
    return err?.error?.message ?? err?.error?.code ?? fallback;
  }
}
