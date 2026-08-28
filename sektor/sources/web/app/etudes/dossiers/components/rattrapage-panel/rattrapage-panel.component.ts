
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonComponent, ToastService } from '@platform/lib/anatomy';

import {
  CatalogueApiService,
  type RapprochementCandidat,
} from '../../../../catalogue/services/catalogue-api.service';
import {
  DossierEtudeApiService,
  type RattrapageGroupe,
  type RattrapageResume,
} from '../../services/dossier-etude-api.service';

@Component({
  selector: 'app-rattrapage-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonComponent],
  templateUrl: './rattrapage-panel.component.html',
  styleUrl: './rattrapage-panel.component.scss',
})
export class RattrapagePanelComponent {
  private readonly dossierApi = inject(DossierEtudeApiService);
  private readonly catalogueApi = inject(CatalogueApiService);
  private readonly toast = inject(ToastService);

  readonly dossierId = input.required<string>();
  readonly modifiable = input(true);
  readonly change = output<void>();

  readonly resume = signal<RattrapageResume | null>(null);
  readonly chargement = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly saving = signal(false);

  readonly mode = signal<'list' | 'rapprocher' | 'creer'>('list');
  readonly groupeActif = signal<RattrapageGroupe | null>(null);
  readonly itemIdRapproche = signal('');
  readonly createLibelle = signal('');
  readonly createNature = signal('MATIERE');
  readonly createUom = signal('');

  readonly candidats = signal<RapprochementCandidat[]>([]);
  readonly candidatsChargement = signal(false);
  readonly candidatsErreur = signal<string | undefined>(undefined);
  readonly manuelOuvert = signal(false);

  readonly natures = [
    { value: 'MATIERE', label: 'Matière' },
    { value: 'CONSOMMABLE', label: 'Consommable' },
    { value: 'CARBURANT', label: 'Carburant' },
    { value: 'OUTILLAGE', label: 'Outillage' },
    { value: 'MATERIEL', label: 'Matériel en propre' },
    { value: 'LOCATION', label: 'Location matériel' },
    { value: 'MAIN_DOEUVRE', label: "Main d'œuvre" },
    { value: 'SOUS_TRAITANCE', label: 'Sous-traitance' },
    { value: 'SERVICE', label: 'Service externe' },
  ];

  constructor() {
    effect(() => {
      const id = this.dossierId();
      if (id) void this.reload();
    });
  }

  isControlee(): boolean {
    return this.resume()?.creationArticleMode === 'CONTROLEE';
  }

  async reload(): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      const data = await this.dossierApi.getRattrapage(this.dossierId());
      this.resume.set(data);
      this.mode.set('list');
      this.groupeActif.set(null);
      this.candidats.set([]);
      this.manuelOuvert.set(false);
    } catch (e) {
      const err = e as { error?: { message?: string; code?: string } };
      this.erreur.set(err?.error?.message ?? err?.error?.code ?? 'Chargement rattrapage impossible.');
    } finally {
      this.chargement.set(false);
    }
  }

  async startRapprocher(g: RattrapageGroupe): Promise<void> {
    this.groupeActif.set(g);
    this.itemIdRapproche.set('');
    this.manuelOuvert.set(false);
    this.candidats.set([]);
    this.candidatsErreur.set(undefined);
    this.mode.set('rapprocher');
    await this.chercherCatalogue(g);
  }

  startCreer(g: RattrapageGroupe): void {
    this.groupeActif.set(g);
    this.createLibelle.set(g.libelle);
    this.createNature.set('MATIERE');
    this.createUom.set('');
    this.mode.set('creer');
  }

  cancelForm(): void {
    this.mode.set('list');
    this.groupeActif.set(null);
    this.candidats.set([]);
    this.manuelOuvert.set(false);
  }

  confPct(c: RapprochementCandidat): string {
    const n = Number(c.confiance);
    if (!Number.isFinite(n)) return '—';
    return `${Math.round(n * 100)} %`;
  }

  async ignorer(g: RattrapageGroupe): Promise<void> {
    if (!this.modifiable() || this.saving()) return;
    const motif = window.prompt(`Motif d'ignorance pour « ${g.libelle} » :`, 'Équivalent local');
    if (!motif?.trim()) {
      this.toast.error('Motif requis pour ignorer un composant LIBRE.');
      return;
    }
    this.saving.set(true);
    try {
      await this.dossierApi.rattrapageIgnorer(this.dossierId(), g.composantIds, motif.trim());
      this.toast.success(`Ignoré — ${motif.trim()} (×${g.count})`);
      await this.reload();
      this.change.emit();
    } catch (e) {
      const err = e as { error?: { code?: string; message?: string } };
      this.toast.error(err?.error?.code ?? err?.error?.message ?? 'Ignore impossible.');
    } finally {
      this.saving.set(false);
    }
  }

  async choisirCandidat(c: RapprochementCandidat): Promise<void> {
    const g = this.groupeActif();
    if (!g || this.saving()) return;
    this.saving.set(true);
    try {
      if (c.matchId) {
        await this.catalogueApi.rapprochementValider(c.matchId);
      }
      const result = await this.dossierApi.rattrapageCreer(this.dossierId(), {
        composantIds: g.composantIds,
        libelle: c.libelle,
        nature: c.nature || 'MATIERE',
        uomCode: c.uniteCode || null,
      });
      if ('statut' in result && result.statut === 'OUVERTE') {
        this.toast.success(`Match catalogue · demande création « ${c.libelle} »`);
      } else {
        this.toast.success(`Catalogue → article lié ×${g.count} (${this.confPct(c)})`);
      }
      await this.reload();
      this.change.emit();
    } catch (e) {
      const err = e as { error?: { code?: string; message?: string } };
      this.toast.error(err?.error?.code ?? err?.error?.message ?? 'Validation impossible.');
    } finally {
      this.saving.set(false);
    }
  }

  async rejeterCandidat(c: RapprochementCandidat): Promise<void> {
    if (!c.matchId || this.saving()) return;
    this.saving.set(true);
    try {
      await this.catalogueApi.rapprochementRejeter(c.matchId);
      this.candidats.update((list) => list.filter((x) => x.catalogCle !== c.catalogCle));
      this.toast.success('Suggestion rejetée — ne sera pas re-proposée');
    } catch (e) {
      const err = e as { error?: { code?: string; message?: string } };
      this.toast.error(err?.error?.code ?? err?.error?.message ?? 'Rejet impossible.');
    } finally {
      this.saving.set(false);
    }
  }

  async confirmerRapprocher(): Promise<void> {
    const g = this.groupeActif();
    const itemId = this.itemIdRapproche().trim();
    if (!g || !itemId || this.saving()) return;
    this.saving.set(true);
    try {
      await this.dossierApi.rattrapageRapprocher(this.dossierId(), g.composantIds, itemId);
      this.toast.success(`Rapproché ×${g.count}`);
      await this.reload();
      this.change.emit();
    } catch (e) {
      const err = e as { error?: { code?: string; message?: string } };
      this.toast.error(err?.error?.code ?? err?.error?.message ?? 'Rapprochement impossible.');
    } finally {
      this.saving.set(false);
    }
  }

  async confirmerCreer(): Promise<void> {
    const g = this.groupeActif();
    if (!g || this.saving()) return;
    const libelle = this.createLibelle().trim();
    if (!libelle) {
      this.toast.error('Libellé requis.');
      return;
    }
    this.saving.set(true);
    try {
      const result = await this.dossierApi.rattrapageCreer(this.dossierId(), {
        composantIds: g.composantIds,
        libelle,
        nature: this.createNature(),
        uomCode: this.createUom().trim() || null,
      });
      if ('statut' in result && result.statut === 'OUVERTE') {
        this.toast.success('Demande de création envoyée — saisie conservée.');
      } else {
        this.toast.success(`Article créé et lié ×${g.count}`);
      }
      await this.reload();
      this.change.emit();
    } catch (e) {
      const err = e as { error?: { code?: string; message?: string } };
      this.toast.error(err?.error?.code ?? err?.error?.message ?? 'Création impossible.');
    } finally {
      this.saving.set(false);
    }
  }

  private async contribuerEnrichissement(g: RattrapageGroupe): Promise<void> {
    try {
      await this.catalogueApi.enrichissementContribuer({
        libelle: g.libelle,
        typeObjet: 'ARTICLE',
        proposePar: 'REGLE',
      });
    } catch {
      // best-effort — ne bloque pas le rattrapage
    }
  }

  private async chercherCatalogue(g: RattrapageGroupe): Promise<void> {
    this.candidatsChargement.set(true);
    this.candidatsErreur.set(undefined);
    try {
      const sourceId = g.composantIds[0];
      const hits = await this.catalogueApi.rapprochementSearch({
        libelle: g.libelle,
        sourceType: 'COMPOSANT_LIBRE',
        sourceId,
        limit: 10,
        persister: true,
      });
      this.candidats.set(hits);
      if (hits.length === 0) {
        void this.contribuerEnrichissement(g);
      }
    } catch (e) {
      const err = e as { error?: { code?: string; message?: string }; status?: number };
      this.candidatsErreur.set(
        err?.error?.code ??
          err?.error?.message ??
          (err?.status === 403
            ? 'Pas d’accès catalogue.read — fallback manuel.'
            : 'Suggestions catalogue indisponibles.'),
      );
      this.manuelOuvert.set(true);
    } finally {
      this.candidatsChargement.set(false);
    }
  }
}
