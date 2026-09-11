import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonComponent, NfInputComponent, NfSelectComponent, type NfSelectOption } from '@platform/lib/anatomy';

import type { DossierPlanningRessource } from '@app/etudes/models';
import { ErpLookupService } from '@app/socle/shared/services/erp-lookup.service';

import { DossierEtudeApiService } from '../../services/dossier-etude-api.service';

const TYPE_OPTIONS: NfSelectOption[] = [
  { value: 'HUMAIN', label: 'Humaine' },
  { value: 'MATERIEL', label: 'Matériel' },
];

@Component({
  selector: 'app-dossier-ressources-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonComponent, NfInputComponent, NfSelectComponent],
  templateUrl: './dossier-ressources-panel.component.html',
  styleUrl: './dossier-ressources-panel.component.scss',
})
export class DossierRessourcesPanelComponent {
  private readonly api = inject(DossierEtudeApiService);
  private readonly erpLookup = inject(ErpLookupService);

  readonly dossierId = input.required<string>();
  readonly modifiable = input(true);

  readonly ressources = signal<DossierPlanningRessource[]>([]);
  readonly employeOptions = signal<NfSelectOption[]>([{ value: '', label: '— non nommé —' }]);
  readonly materielOptions = signal<NfSelectOption[]>([{ value: '', label: '— non nommé —' }]);
  readonly chargement = signal(true);
  readonly saving = signal(false);
  readonly erreur = signal<string | undefined>(undefined);

  readonly draftType = signal<'HUMAIN' | 'MATERIEL'>('HUMAIN');
  readonly draftLibelle = signal('');
  readonly draftQuantite = signal('1');
  readonly draftUnite = signal('');
  readonly draftEmployeId = signal('');
  readonly draftMaterielId = signal('');

  readonly typeOptions = TYPE_OPTIONS;
  readonly humaines = computed(() => this.ressources().filter((r) => r.type === 'HUMAIN'));
  readonly materiel = computed(() => this.ressources().filter((r) => r.type === 'MATERIEL'));
  readonly draftHumain = computed(() => this.draftType() === 'HUMAIN');

  constructor() {
    effect(() => {
      const id = this.dossierId();
      if (id) void this.charger(id);
    });
  }

  async ajouter(): Promise<void> {
    const libelle = this.draftLibelle().trim();
    const quantite = Number(this.draftQuantite());
    if (!libelle || !Number.isFinite(quantite) || quantite <= 0) {
      this.erreur.set('Indiquez un rôle ou une désignation, et une quantité supérieure à 0.');
      return;
    }
    this.saving.set(true);
    this.erreur.set(undefined);
    try {
      const type = this.draftType();
      await this.api.creerPlanningRessource(this.dossierId(), {
        type,
        libelle,
        quantite,
        unite: this.draftUnite().trim() || null,
        employeId: type === 'HUMAIN' ? this.draftEmployeId().trim() || null : null,
        materielId: type === 'MATERIEL' ? this.draftMaterielId().trim() || null : null,
      });
      this.draftLibelle.set('');
      this.draftQuantite.set('1');
      this.draftUnite.set('');
      this.draftEmployeId.set('');
      this.draftMaterielId.set('');
      this.ressources.set(await this.api.listerPlanningRessources(this.dossierId()));
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
    } finally {
      this.saving.set(false);
    }
  }

  async supprimer(row: DossierPlanningRessource): Promise<void> {
    if (!this.modifiable()) return;
    this.saving.set(true);
    this.erreur.set(undefined);
    try {
      await this.api.supprimerPlanningRessource(this.dossierId(), row.id);
      this.ressources.set(this.ressources().filter((r) => r.id !== row.id));
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
    } finally {
      this.saving.set(false);
    }
  }

  private async charger(dossierId: string): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      const [rows, employes, materiels] = await Promise.all([
        this.api.listerPlanningRessources(dossierId),
        this.erpLookup.employes('ACTIF').catch(() => []),
        this.erpLookup.materiels().catch(() => []),
      ]);
      this.ressources.set(rows ?? []);
      this.employeOptions.set([
        { value: '', label: '— non nommé —' },
        ...employes.map((e) => ({ value: String(e.key), label: e.value })),
      ]);
      this.materielOptions.set([
        { value: '', label: '— non nommé —' },
        ...materiels.map((e) => ({ value: String(e.key), label: e.value })),
      ]);
    } catch (e) {
      this.erreur.set(this.messageErreur(e));
    } finally {
      this.chargement.set(false);
    }
  }

  private messageErreur(e: unknown): string {
    const err = e as { error?: { code?: string; message?: string }; message?: string };
    return err?.error?.code ?? err?.error?.message ?? err?.message ?? 'Enregistrement impossible.';
  }
}
