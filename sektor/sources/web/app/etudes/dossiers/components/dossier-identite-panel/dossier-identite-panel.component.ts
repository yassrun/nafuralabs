import { CommonModule } from '@angular/common';
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
  NfInputComponent,
  NfSelectComponent,
  type NfSelectOption,
} from '@platform/lib/anatomy';

import type { DossierEtude, MarcheProposeMetadonnees } from '@app/etudes/models';

import {
  DossierEtudeApiService,
  type ChargeEtudeCandidat,
} from '../../services/dossier-etude-api.service';

/**
 * Cadrage de l’étude — objet, MOA, chargé, type AO, échéance.
 * Éditable tant que le dossier est BROUILLON / EN_ETUDE (API `update`).
 */
@Component({
  selector: 'app-dossier-identite-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
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
  readonly prefillCps = signal(false);

  readonly banner = computed((): { tone: 'error' | 'info' | 'success'; message: string } | undefined => {
    if (this.erreur()) return { tone: 'error', message: this.erreur()! };
    if (this.ok()) return { tone: 'success', message: 'Détails enregistrés.' };
    if (this.prefillCps()) {
      return { tone: 'info', message: 'Champs AO préremplis depuis le CPS — vérifiez-les.' };
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
        if (this.modifiable()) void this.prefillDepuisCps(d);
      });
    });
    void this.chargerIngenieurs();
  }

  async enregistrer(): Promise<boolean> {
    const d = this.dossier();
    if (!this.modifiable() || this.saving()) return false;
    const objet = this.objet().trim();
    const clientNom = this.clientNom().trim();
    const chargeId = this.chargeEtudeUserId();
    if (!objet || !clientNom || !chargeId) {
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
    this.objet.set(d.objet ?? '');
    this.clientNom.set(d.clientNom ?? '');
    this.chargeEtudeUserId.set(d.chargeEtudeUserId ?? null);
    if (this.prefillEnCours) return;
    this.dateLimiteDepot.set(toDateInput(d.aoDateLimiteDepot));
    const ao = d.aoType;
    this.aoType.set(ao === 'PRIVE' || ao === 'PUBLIC' ? ao : '');
    this.aoReference.set(d.aoReference ?? '');
    this.ville.set(d.aoVille ?? '');
    this.dateOuverturePlis.set(toDateInput(d.aoDateOuverturePlis));
    this.delaiExecutionJours.set(d.aoDelaiExecutionJours ?? null);
    this.estimationMoaHt.set(d.aoEstimationMoaHt ?? null);
    this.cautionProvisoire.set(d.aoCautionProvisoire ?? null);
    this.ok.set(false);
    this.erreur.set(undefined);
  }

  private async prefillDepuisCps(d: DossierEtude): Promise<void> {
    try {
      const docs = await this.api.listerDocuments(d.id);
      const cps = docs.find((p) => p.type === 'CPS' || p.type === 'CPS_ET_BORDEREAU');
      if (!cps?.id || this.prefillPourCps === cps.id) return;
      this.prefillPourCps = cps.id;
      this.prefillEnCours = true;
      try {
        for (const delay of [0, 2500, 5000, 8000]) {
          if (delay) await this.sleep(delay);
          const prop = await this.api.proposerMarche(d.id, cps.id);
          const meta = prop?.metadonnees;
          if (!meta || !this.hasMeta(meta)) continue;
          const applied = this.applyEmptyFromMeta(meta);
          if (applied) {
            await this.api.appliquerPropositionMarche(d.id, { metadonnees: applied });
            const fresh = await this.api.getById(d.id);
            this.prefillCps.set(true);
            this.saved.emit(fresh);
          }
          return;
        }
        this.prefillPourCps = '';
      } finally {
        this.prefillEnCours = false;
      }
    } catch {
      this.prefillPourCps = '';
      this.prefillEnCours = false;
    }
  }

  private hasMeta(meta: MarcheProposeMetadonnees): boolean {
    return Object.values(meta).some((v) => v != null && String(v).trim() !== '');
  }

  /** Ne remplit que les champs encore vides — n’écrase pas la saisie. */
  private applyEmptyFromMeta(meta: MarcheProposeMetadonnees): MarcheProposeMetadonnees | null {
    const out: MarcheProposeMetadonnees = {};
    const takeStr = (current: string, suggested: string | null | undefined): string | undefined => {
      if (placeholderIdentite(current) && suggested?.trim()) return suggested.trim();
      return undefined;
    };
    const objet = takeStr(this.objet(), meta.objet);
    if (objet) {
      this.objet.set(objet);
      out.objet = objet;
    }
    const moa = takeStr(this.clientNom(), meta.donneurOrdre);
    if (moa) {
      this.clientNom.set(moa);
      out.donneurOrdre = moa;
    }
    if (!this.aoType() && (meta.type === 'PUBLIC' || meta.type === 'PRIVE')) {
      this.aoType.set(meta.type);
      out.type = meta.type;
    }
    const dateLimite = toDateInput(meta.dateLimiteDepot);
    if (!this.dateLimiteDepot() && dateLimite) {
      this.dateLimiteDepot.set(dateLimite);
      out.dateLimiteDepot = dateLimite;
    }
    if (!this.aoReference().trim() && meta.reference?.trim()) {
      this.aoReference.set(meta.reference.trim());
      out.reference = meta.reference.trim();
    }
    if (!this.ville().trim() && meta.ville?.trim()) {
      this.ville.set(meta.ville.trim());
      out.ville = meta.ville.trim();
    }
    const ouverture = toDateInput(meta.dateOuverturePlis);
    if (!this.dateOuverturePlis() && ouverture) {
      this.dateOuverturePlis.set(ouverture);
      out.dateOuverturePlis = ouverture;
    }
    if (this.delaiExecutionJours() == null && meta.delaiExecutionJours != null) {
      this.delaiExecutionJours.set(meta.delaiExecutionJours);
      out.delaiExecutionJours = meta.delaiExecutionJours;
    }
    if (this.estimationMoaHt() == null && meta.estimationMoaHt != null) {
      this.estimationMoaHt.set(meta.estimationMoaHt);
      out.estimationMoaHt = meta.estimationMoaHt;
    }
    if (this.cautionProvisoire() == null && meta.cautionProvisoire != null) {
      this.cautionProvisoire.set(meta.cautionProvisoire);
      out.cautionProvisoire = meta.cautionProvisoire;
    }
    return Object.keys(out).length ? out : null;
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
