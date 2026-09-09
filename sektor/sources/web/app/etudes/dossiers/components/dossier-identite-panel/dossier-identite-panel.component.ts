import { CommonModule, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ButtonComponent,
  NfInputComponent,
  NfSelectComponent,
  type NfSelectOption,
} from '@platform/lib/anatomy';

import type { DossierEtude, MarcheProposeMetadonnees } from '@app/etudes/models';

import {
  DossierEtudeApiService,
  type ChargeEtudeCandidat,
} from '../../services/dossier-etude-api.service';

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
  | 'cautionProvisoire';

type IaFieldState = 'proposed' | 'accepted' | 'rejected';

interface IaFieldProposal {
  value: string | number;
  status: IaFieldState;
}

type CpsPhase = 'idle' | 'loading' | 'ready' | 'partial';

const IA_KEYS: IaFieldKey[] = [
  'objet',
  'clientNom',
  'aoType',
  'dateLimiteDepot',
  'aoReference',
  'ville',
  'dateOuverturePlis',
  'delaiExecutionJours',
  'estimationMoaHt',
  'cautionProvisoire',
];

/**
 * Cadrage de l’étude — objet, MOA, chargé, type AO, échéance.
 * Les champs déduits du CPS portent le badge IA · CPS. Accepter / Refuser
 * seulement tant que la valeur n’est pas encore enregistrée.
 */
@Component({
  selector: 'app-dossier-identite-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NgTemplateOutlet,
    FormsModule,
    ButtonComponent,
    NfInputComponent,
    NfSelectComponent,
  ],
  templateUrl: './dossier-identite-panel.component.html',
  styleUrl: './dossier-identite-panel.component.scss',
})
export class DossierIdentitePanelComponent {
  private readonly api = inject(DossierEtudeApiService);

  readonly dossier = input.required<DossierEtude>();
  readonly modifiable = input(false);
  readonly saved = output<DossierEtude>();

  readonly objet = signal('');
  readonly clientNom = signal('');
  readonly chargeEtudeUserId = signal<string | null>(null);
  readonly dateLimiteDepot = signal('');
  readonly aoType = signal<'PUBLIC' | 'PRIVE' | ''>('');
  readonly aoReference = signal('');
  readonly ville = signal('');
  readonly dateOuverturePlis = signal('');
  readonly delaiExecutionJours = signal<number | null>(null);
  readonly estimationMoaHt = signal<number | null>(null);
  readonly cautionProvisoire = signal<number | null>(null);
  readonly ingenieurs = signal<ChargeEtudeCandidat[]>([]);
  readonly saving = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly ok = signal(false);
  readonly cpsPhase = signal<CpsPhase>('idle');
  readonly iaFields = signal<Partial<Record<IaFieldKey, IaFieldProposal>>>({});

  readonly hasPendingCps = computed(() =>
    IA_KEYS.some((k) => this.iaPending(k)),
  );

  readonly pendingCount = computed(
    () => IA_KEYS.filter((k) => this.iaPending(k)).length,
  );

  /** Bloque Continuer / Enregistrer seulement pendant l’indexation — pas la revue. */
  readonly cpsBlocking = computed(() => this.cpsPhase() === 'loading');

  readonly banner = computed((): { tone: 'error' | 'info' | 'success'; message: string } | undefined => {
    if (this.erreur()) return { tone: 'error', message: this.erreur()! };
    if (this.ok()) return { tone: 'success', message: 'Détails enregistrés.' };
    if (this.cpsPhase() === 'loading') {
      return { tone: 'info', message: 'Indexation CPS — les champs ne bougeront qu’en revue.' };
    }
    const n = this.pendingCount();
    if (n > 0) {
      return {
        tone: 'info',
        message: `${n} proposition${n > 1 ? 's' : ''} CPS — Enregistrer les confirme, ou Refuser champ par champ.`,
      };
    }
    return undefined;
  });

  readonly aoTypeOptions: NfSelectOption[] = [
    { value: 'PUBLIC', label: 'Public' },
    { value: 'PRIVE', label: 'Privé' },
  ];

  readonly chargeEtudeOptions = signal<NfSelectOption[]>([]);

  private prefillPourCps = '';
  private prefillEnCours = false;

  constructor() {
    effect(() => {
      const d = this.dossier();
      untracked(() => {
        this.hydrate(d);
        if (this.modifiable()) void this.chargerPropositionsCps(d);
      });
    });
    void this.chargerIngenieurs();
  }

  iaStatus(key: string): IaFieldState | null {
    return this.iaFields()[key as IaFieldKey]?.status ?? null;
  }

  iaPending(key: string): boolean {
    return this.iaStatus(key) === 'proposed';
  }

  cpsMissing(key: string): boolean {
    const phase = this.cpsPhase();
    if (phase !== 'ready' && phase !== 'partial') return false;
    if (this.iaFields()[key as IaFieldKey]) return false;
    return isEmptyForCps(this.valeurCourante(key as IaFieldKey));
  }

  accepter(key: string): void {
    const k = key as IaFieldKey;
    const prop = this.iaFields()[k];
    if (!prop || prop.status !== 'proposed') return;
    this.applyValue(k, prop.value);
    this.patchIa(k, { ...prop, status: 'accepted' });
    this.ok.set(false);
  }

  ignorer(key: string): void {
    const k = key as IaFieldKey;
    const prop = this.iaFields()[k];
    if (!prop || prop.status !== 'proposed') return;
    this.clearValue(k);
    this.patchIa(k, { ...prop, status: 'rejected' });
    this.ok.set(false);
  }

  accepterTout(): void {
    IA_KEYS.forEach((k) => {
      if (this.iaPending(k)) this.accepter(k);
    });
  }

  ignorerTout(): void {
    IA_KEYS.forEach((k) => {
      if (this.iaPending(k)) this.ignorer(k);
    });
  }

  onChamp(key: IaFieldKey, raw: string | number | null): void {
    const numeric =
      key === 'delaiExecutionJours' ||
      key === 'estimationMoaHt' ||
      key === 'cautionProvisoire';
    if (numeric && (raw === '' || raw == null)) {
      this.clearValue(key);
    } else {
      this.applyValue(key, raw ?? '');
    }
    const prop = this.iaFields()[key];
    if (prop?.status === 'proposed') {
      const next = typeof raw === 'number' ? raw : String(raw ?? '');
      this.patchIa(key, { value: next, status: 'accepted' });
    }
    this.ok.set(false);
  }

  async enregistrer(): Promise<boolean> {
    const d = this.dossier();
    if (!this.modifiable() || this.saving()) return false;
    if (this.cpsPhase() === 'loading') {
      this.erreur.set('Attendez la fin de l’extraction CPS, ou saisissez à la main.');
      this.ok.set(false);
      return false;
    }
    // Enregistrer / Continuer confirment les propositions encore affichées.
    this.accepterTout();
    const objet = this.objet().trim();
    const clientNom = this.clientNom().trim();
    const chargeId = this.chargeEtudeUserId();
    if (!objet || placeholderIdentite(objet) || !clientNom || placeholderIdentite(clientNom) || !chargeId) {
      this.erreur.set('Objet, MOA et chargé d’étude sont obligatoires.');
      return false;
    }
    this.saving.set(true);
    this.erreur.set(undefined);
    this.ok.set(false);
    try {
      const charge = this.ingenieurs().find((i) => i.userId === chargeId);
      const maj = await this.api.update(d.id, {
        objet,
        clientNom,
        chargeEtudeUserId: chargeId,
        chargeEtudeNom: charge?.displayName ?? charge?.email,
        dateLimiteDepot: this.dateLimiteDepot() || undefined,
        aoType: this.aoType() || undefined,
        aoReference: this.aoReference().trim() || undefined,
        ville: this.ville().trim() || undefined,
        dateOuverturePlis: this.dateOuverturePlis() || undefined,
        delaiExecutionJours: this.delaiExecutionJours() ?? undefined,
        estimationMoaHt: this.estimationMoaHt() ?? undefined,
        cautionProvisoire: this.cautionProvisoire() ?? undefined,
        version: d.version,
      });
      this.saved.emit(maj);
      this.ok.set(true);
      return true;
    } catch (e) {
      const err = e as { error?: { message?: string; code?: string } };
      this.erreur.set(err?.error?.message ?? err?.error?.code ?? 'Enregistrement impossible.');
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  private hydrate(d: DossierEtude): void {
    this.chargeEtudeUserId.set(d.chargeEtudeUserId ?? null);
    if (!this.prefillEnCours) {
      this.objet.set(d.objet ?? '');
      this.clientNom.set(d.clientNom ?? '');
      this.dateLimiteDepot.set(toDateInput(d.aoDateLimiteDepot));
      const ao = d.aoType;
      this.aoType.set(ao === 'PRIVE' || ao === 'PUBLIC' ? ao : '');
      this.aoReference.set(d.aoReference ?? '');
      this.ville.set(d.aoVille ?? '');
      this.dateOuverturePlis.set(toDateInput(d.aoDateOuverturePlis));
      this.delaiExecutionJours.set(d.aoDelaiExecutionJours ?? null);
      this.estimationMoaHt.set(d.aoEstimationMoaHt ?? null);
      this.cautionProvisoire.set(d.aoCautionProvisoire ?? null);
      this.reapplyLocalIa();
    }
    this.ok.set(false);
    this.erreur.set(undefined);
  }

  private reapplyLocalIa(): void {
    const fields = this.iaFields();
    for (const key of IA_KEYS) {
      const prop = fields[key];
      if (!prop) continue;
      if (prop.status === 'proposed' || prop.status === 'accepted') {
        this.applyValue(key, prop.value);
      }
    }
  }

  private async chargerPropositionsCps(d: DossierEtude): Promise<void> {
    try {
      const docs = await this.api.listerDocuments(d.id);
      const cps = docs.find((p) => p.type === 'CPS' || p.type === 'CPS_ET_BORDEREAU');
      if (!cps?.id) {
        this.prefillPourCps = '';
        this.cpsPhase.set('idle');
        this.iaFields.set({});
        return;
      }
      if (this.prefillPourCps === cps.id) return;
      this.prefillPourCps = cps.id;
      this.prefillEnCours = true;
      this.cpsPhase.set('loading');
      this.iaFields.set({});
      try {
        for (const delay of [0, 2500, 5000, 8000]) {
          if (delay) await this.sleep(delay);
          const prop = await this.api.proposerMarche(d.id, cps.id);
          const meta = prop?.metadonnees;
          if (!meta || !this.hasMeta(meta)) continue;
          this.installerPropositions(meta);
          const n = this.pendingCount();
          this.cpsPhase.set(n > 0 ? 'ready' : 'partial');
          return;
        }
        this.cpsPhase.set('partial');
      } finally {
        this.prefillEnCours = false;
      }
    } catch {
      this.prefillPourCps = '';
      this.prefillEnCours = false;
      this.cpsPhase.set('idle');
    }
  }

  private hasMeta(meta: MarcheProposeMetadonnees): boolean {
    return Object.values(meta).some((v) => v != null && String(v).trim() !== '');
  }

  private installerPropositions(meta: MarcheProposeMetadonnees): void {
    const next: Partial<Record<IaFieldKey, IaFieldProposal>> = {};
    const take = (key: IaFieldKey, current: string | number | null, raw: string | number | null | undefined) => {
      if (!isSuggestionValue(raw)) return;
      if (!isEmptyForCps(current)) {
        next[key] = { value: current as string | number, status: 'accepted' };
        return;
      }
      next[key] = { value: raw as string | number, status: 'proposed' };
      this.applyValue(key, raw as string | number);
    };
    take('objet', this.objet(), meta.objet);
    take('clientNom', this.clientNom(), meta.donneurOrdre);
    take(
      'aoType',
      this.aoType(),
      meta.type === 'PRIVE' || meta.type === 'PUBLIC' ? meta.type : undefined,
    );
    take('dateLimiteDepot', this.dateLimiteDepot(), toDateInput(meta.dateLimiteDepot) || undefined);
    take('aoReference', this.aoReference(), meta.reference);
    take('ville', this.ville(), meta.ville);
    take(
      'dateOuverturePlis',
      this.dateOuverturePlis(),
      toDateInput(meta.dateOuverturePlis) || undefined,
    );
    take('delaiExecutionJours', this.delaiExecutionJours(), meta.delaiExecutionJours);
    take('estimationMoaHt', this.estimationMoaHt(), meta.estimationMoaHt);
    take('cautionProvisoire', this.cautionProvisoire(), meta.cautionProvisoire);
    this.iaFields.set(next);
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
        this.aoType.set(value === 'PRIVE' ? 'PRIVE' : value === 'PUBLIC' ? 'PUBLIC' : '');
        break;
      case 'ville':
        this.ville.set(String(value));
        break;
      case 'dateOuverturePlis':
        this.dateOuverturePlis.set(String(value));
        break;
      case 'delaiExecutionJours':
        this.delaiExecutionJours.set(value === '' ? null : Number(value));
        break;
      case 'estimationMoaHt':
        this.estimationMoaHt.set(value === '' ? null : Number(value));
        break;
      case 'cautionProvisoire':
        this.cautionProvisoire.set(value === '' ? null : Number(value));
        break;
    }
  }

  private clearValue(key: IaFieldKey): void {
    switch (key) {
      case 'objet':
        this.objet.set('');
        break;
      case 'clientNom':
        this.clientNom.set('');
        break;
      case 'dateLimiteDepot':
        this.dateLimiteDepot.set('');
        break;
      case 'aoReference':
        this.aoReference.set('');
        break;
      case 'aoType':
        this.aoType.set('');
        break;
      case 'ville':
        this.ville.set('');
        break;
      case 'dateOuverturePlis':
        this.dateOuverturePlis.set('');
        break;
      case 'delaiExecutionJours':
        this.delaiExecutionJours.set(null);
        break;
      case 'estimationMoaHt':
        this.estimationMoaHt.set(null);
        break;
      case 'cautionProvisoire':
        this.cautionProvisoire.set(null);
        break;
    }
  }

  private valeurCourante(key: IaFieldKey): string | number | null {
    switch (key) {
      case 'objet':
        return this.objet();
      case 'clientNom':
        return this.clientNom();
      case 'dateLimiteDepot':
        return this.dateLimiteDepot();
      case 'aoReference':
        return this.aoReference();
      case 'aoType':
        return this.aoType();
      case 'ville':
        return this.ville();
      case 'dateOuverturePlis':
        return this.dateOuverturePlis();
      case 'delaiExecutionJours':
        return this.delaiExecutionJours();
      case 'estimationMoaHt':
        return this.estimationMoaHt();
      case 'cautionProvisoire':
        return this.cautionProvisoire();
    }
  }

  private patchIa(key: IaFieldKey, prop: IaFieldProposal): void {
    this.iaFields.update((cur) => ({ ...cur, [key]: prop }));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  private async chargerIngenieurs(): Promise<void> {
    try {
      const list = await this.api.listIngenieurs();
      this.ingenieurs.set(list);
      this.chargeEtudeOptions.set(
        list.map((ing) => ({
          value: ing.userId,
          label: `${ing.displayName} — ${ing.email}`,
        })),
      );
    } catch {
      this.ingenieurs.set([]);
    }
  }
}

function toDateInput(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function placeholderIdentite(value: string | null | undefined): boolean {
  const v = (value ?? '').trim();
  return !v || v === 'Nouvelle étude' || v === 'À préciser';
}

function isEmptyForCps(current: string | number | null): boolean {
  if (current == null) return true;
  if (typeof current === 'number') return false;
  return placeholderIdentite(current);
}

function isSuggestionValue(raw: string | number | null | undefined): boolean {
  if (raw == null) return false;
  if (typeof raw === 'string') return raw.trim().length > 0;
  return !Number.isNaN(raw);
}
