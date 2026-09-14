import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonComponent, NfInputComponent, NfSelectComponent, type NfSelectOption } from '@platform/lib/anatomy';

import type { DossierPlanningActivite, NoeudDPGF } from '@app/etudes/models';
import { DpgfApiService } from '@app/etudes/services/dpgf-api.service';

import { DossierEtudeApiService } from '../../services/dossier-etude-api.service';
import { messagePlanningErreur } from '../../utils/planning-erreur.util';

@Component({
  selector: 'app-dossier-planning-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonComponent, NfInputComponent, NfSelectComponent],
  templateUrl: './dossier-planning-panel.component.html',
  styleUrl: './dossier-planning-panel.component.scss',
})
export class DossierPlanningPanelComponent {
  private readonly api = inject(DossierEtudeApiService);
  private readonly dpgfApi = inject(DpgfApiService);

  readonly dossierId = input.required<string>();
  readonly dpgfId = input<string | null>(null);
  readonly modifiable = input(true);

  readonly activites = signal<DossierPlanningActivite[]>([]);
  readonly lotOptions = signal<NfSelectOption[]>([{ value: '', label: '— hors lot —' }]);
  readonly chargement = signal(true);
  readonly saving = signal(false);
  readonly erreur = signal<string | undefined>(undefined);

  readonly draftLibelle = signal('');
  readonly draftLotId = signal('');
  readonly draftDebut = signal('');
  readonly draftFin = signal('');

  constructor() {
    effect(() => {
      const id = this.dossierId();
      const dpgfId = this.dpgfId();
      if (id) void this.charger(id, dpgfId);
    });
  }

  async ajouter(): Promise<void> {
    const libelle = this.draftLibelle().trim();
    const debut = this.draftDebut();
    const fin = this.draftFin();
    if (!libelle || !debut || !fin) {
      this.erreur.set('Événement, date de début et date de fin sont requis.');
      return;
    }
    if (fin < debut) {
      this.erreur.set('La date de fin doit être après la date de début.');
      return;
    }
    this.saving.set(true);
    this.erreur.set(undefined);
    try {
      const lotId = this.draftLotId().trim() || null;
      const lotLabel = this.lotOptions().find((o) => o.value === (lotId ?? ''))?.label ?? null;
      await this.api.creerPlanningActivite(this.dossierId(), {
        libelle,
        dpgfNoeudId: lotId,
        lotLibelle: lotId ? lotLabel : null,
        dateDebut: debut,
        dateFin: fin,
      });
      this.draftLibelle.set('');
      this.draftLotId.set('');
      this.draftDebut.set('');
      this.draftFin.set('');
      this.activites.set(await this.api.listerPlanningActivites(this.dossierId()));
    } catch (e) {
      this.erreur.set(messagePlanningErreur(e));
    } finally {
      this.saving.set(false);
    }
  }

  async supprimer(row: DossierPlanningActivite): Promise<void> {
    if (!this.modifiable()) return;
    this.saving.set(true);
    this.erreur.set(undefined);
    try {
      await this.api.supprimerPlanningActivite(this.dossierId(), row.id);
      this.activites.set(this.activites().filter((a) => a.id !== row.id));
    } catch (e) {
      this.erreur.set(messagePlanningErreur(e));
    } finally {
      this.saving.set(false);
    }
  }

  lotAffiche(row: DossierPlanningActivite): string {
    return row.lotLibelle?.trim() || 'Hors lot';
  }

  private async charger(dossierId: string, dpgfId: string | null): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      const [rows, arbre] = await Promise.all([
        this.api.listerPlanningActivites(dossierId),
        dpgfId ? this.dpgfApi.getArbre(dpgfId).catch(() => null) : Promise.resolve(null),
      ]);
      this.activites.set(rows ?? []);
      this.lotOptions.set([
        { value: '', label: '— hors lot —' },
        ...this.collectLots(arbre?.hierarchie ?? []),
      ]);
    } catch (e) {
      this.erreur.set(messagePlanningErreur(e));
    } finally {
      this.chargement.set(false);
    }
  }

  private collectLots(nodes: NoeudDPGF[], acc: NfSelectOption[] = []): NfSelectOption[] {
    for (const n of nodes) {
      if (n.type === 'LOT' || n.type === 'SOUS_LOT') {
        acc.push({
          value: n.id,
          label: `${n.code ? n.code + ' — ' : ''}${n.libelle}`,
        });
      }
      if (n.enfants?.length) this.collectLots(n.enfants, acc);
    }
    return acc;
  }
}
