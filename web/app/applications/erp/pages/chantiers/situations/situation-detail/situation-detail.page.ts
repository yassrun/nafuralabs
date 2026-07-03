import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  Injector,
  LOCALE_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { distinctUntilChanged } from 'rxjs/operators';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import { FieldTemplateDirective } from '@lib/anatomy/components/organisms/entity-detail';
import type { DetailActionEvent, StatusTransitionEvent } from '@lib/anatomy/types';

import type {
  Situation,
  SituationCreate,
  SituationLigne,
  LotChantier,
} from '@applications/erp/chantiers/models';

import { SituationFacade } from '../services';
import { SITUATION_DETAIL_CONFIG } from '../config';
import { LotsSaisieTableComponent } from './components/lots-saisie-table/lots-saisie-table.component';
import {
  DecompteCardComponent,
  type DecompteValues,
} from './components/decompte-card/decompte-card.component';
import { DecomptePrintComponent } from '../components/decompte-print/decompte-print.component';

import { SubmitApprovalButtonComponent } from '@applications/erp/pages/approbations/components/submit-approval-button/submit-approval-button.component';

import { safeRandomUUID } from '@core/util/uuid';

@Component({
  selector: 'app-situation-detail',
  standalone: true,
  imports: [
    CommonModule,
    ...ConfigDrivenDetailPageImports,
    FieldTemplateDirective,
    LotsSaisieTableComponent,
    DecompteCardComponent,
    DecomptePrintComponent,
    SubmitApprovalButtonComponent,
  ],
  templateUrl: './situation-detail.page.html',
  styleUrls: ['./situation-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class SituationDetailPage extends ConfigDrivenDetailPage<Situation> {
  private readonly crud = inject(SituationFacade);
  private readonly injector = inject(Injector);
  private readonly locale = inject(LOCALE_ID);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  private lastPrefilledChantierId: string | null = null;
  private createFormBehaviorReady = false;

  readonly facade = createDetailFacadeFromCrud<Situation, SituationCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = SITUATION_DETAIL_CONFIG;

  /** Mode impression (afficher uniquement le décompte A4). */
  readonly printMode = signal<boolean>(false);

  /** Lignes en cours d'édition (signal alimenté par le tableau de saisie). */
  readonly currentLignes = signal<SituationLigne[]>([]);

  /** Valeurs courantes des paramètres décompte (TVA, retenue, avance). */
  readonly currentParams = signal<{
    retenueGarantiePercent: number;
    retenueAvancePercent?: number;
    tvaTaux: number;
    cumulPrecedentHt: number;
  }>({
    retenueGarantiePercent: 7,
    retenueAvancePercent: undefined,
    tvaTaux: 20,
    cumulPrecedentHt: 0,
  });

  readonly decompteLive = computed<DecompteValues>(() => {
    const lignes = this.currentLignes();
    const p = this.currentParams();
    const cumulCourantHt =
      Math.round(
        lignes.reduce((s, l) => s + (l.montantHt || 0), 0) * 100,
      ) / 100;
    const travauxPeriodeHt =
      Math.round((cumulCourantHt - p.cumulPrecedentHt) * 100) / 100;
    const retenueGarantieMontant =
      Math.round((travauxPeriodeHt * p.retenueGarantiePercent) / 100 * 100) /
      100;
    const retenueAvanceMontant = p.retenueAvancePercent
      ? Math.round(
          (travauxPeriodeHt * p.retenueAvancePercent) / 100 * 100,
        ) / 100
      : 0;
    const netAPayerHt =
      Math.round(
        (travauxPeriodeHt - retenueGarantieMontant - retenueAvanceMontant) * 100,
      ) / 100;
    const netAPayerTtc =
      Math.round(netAPayerHt * (1 + p.tvaTaux / 100) * 100) / 100;
    return {
      cumulCourantHt,
      cumulPrecedentHt: p.cumulPrecedentHt,
      travauxPeriodeHt,
      retenueGarantiePercent: p.retenueGarantiePercent,
      retenueGarantieMontant,
      retenueAvancePercent: p.retenueAvancePercent,
      retenueAvanceMontant,
      netAPayerHt,
      tvaTaux: p.tvaTaux,
      netAPayerTtc,
    };
  });

  constructor() {
    super();
    effect(() => {
      const item = this.item();
      if (item) {
        this.currentLignes.set(item.lignes ?? []);
        this.currentParams.set({
          retenueGarantiePercent: item.retenueGarantiePercent ?? 7,
          retenueAvancePercent: item.retenueAvancePercent,
          tvaTaux: item.tvaTaux ?? 20,
          cumulPrecedentHt: item.cumulPrecedentHt ?? 0,
        });
        this.lastPrefilledChantierId = item.chantierId ?? null;
      }
    });

    afterNextRender(
      () => {
        effect(
          () => {
            if (!this.detailComponent?.formReady()) return;
            this.setupCreateFormBehavior();
          },
          { injector: this.injector },
        );
      },
      { injector: this.injector },
    );
  }

  get headerTitle(): string {
    if (this.mode() === 'create') return 'Nouvelle situation';
    const item = this.item();
    return item
      ? `${item.numero} — ${item.chantierName ?? ''} (Période ${this.formatPeriode(item.datePeriodeFin)})`
      : 'Détail situation';
  }

  asFormControl(control: unknown): FormControl {
    return control as FormControl;
  }

  onLignesChange(control: unknown, value: SituationLigne[]): void {
    (control as FormControl).setValue(value);
    (control as FormControl).markAsDirty();
    this.currentLignes.set(value);
  }

  override async handleTransition(
    event: StatusTransitionEvent,
  ): Promise<void> {
    const item = this.item();
    if (!item?.id) return;

    this.isTransitioning.set(true);
    try {
      let updated: Situation;
      if (event.endpoint === 'invoice') {
        const result = await this.crud.emettreFacture(item.id);
        updated = result.situation;
        this.showSuccess(
          `Facture client ${result.facture.numero} créée (BROUILLON) — ${result.facture.totalTtc.toLocaleString(this.locale)} MAD TTC`,
        );
      } else {
        updated = await this.crud.executeTransition(
          item.id,
          event.endpoint,
          event.note ? { note: event.note } : undefined,
        );
        if (event.toStatus === 'SOUMISE') {
          this.showSuccess(`Situation ${updated.numero} soumise au MOA`);
        } else if (event.toStatus === 'VALIDEE_MOA') {
          this.showSuccess(`Situation ${updated.numero} validée par le MOA`);
        } else if (event.toStatus === 'PAYEE') {
          this.showSuccess(`Situation ${updated.numero} marquée payée`);
        } else if (event.endpoint === 'reject') {
          this.showSuccess(`Situation ${updated.numero} rejetée et renvoyée en brouillon`);
        }
      }
      this.item.set(updated);
    } catch (err) {
      this.showError((err as Error).message ?? 'Transition impossible');
    } finally {
      this.isTransitioning.set(false);
    }
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<Situation>,
  ): Promise<void> {
    const item = event.item;

    if (event.actionId === 'imprimer_decompte' && item) {
      this.printMode.set(true);
      setTimeout(() => {
        window.print();
        this.printMode.set(false);
      }, 80);
      return;
    }

    if (event.actionId === 'reprendre_avancements') {
      const chantierId =
        event.formValue.chantierId ?? item?.chantierId ?? '';
      await runInInjectionContext(this.injector, () =>
        this.prefillLignesFromAvancements(chantierId),
      );
      return;
    }

    if (event.actionId === 'soumettre' && item) {
      const updated = await this.crud.changeStatus(item.id, 'SOUMISE');
      this.showSuccess(`Situation ${updated.numero} soumise au MOA`);
      this.item.set(updated);
      return;
    }

    if (event.actionId === 'valider' && item) {
      const updated = await this.crud.changeStatus(item.id, 'VALIDEE_MOA');
      this.showSuccess(`Situation ${updated.numero} validée par le MOA`);
      this.item.set(updated);
      return;
    }

    if (event.actionId === 'rejeter' && item) {
      const result = await this.confirmDialog.prompt({
        title: this.translate.instant('chantiers.situation.detail.rejectPrompt'),
        fields: [{ key: 'note', label: 'chantiers.situation.detail.rejectPrompt', required: true }],
      confirmLabel: 'OK',
      cancelLabel: this.translate.instant('common.actions.cancel'),
    });
    if (!result) return;
    const note = result['note'];
      if (!note?.trim()) {
        this.showError('Motif de rejet obligatoire');
        return;
      }
      const updated = await this.crud.changeStatus(
        item.id,
        'BROUILLON',
        note.trim(),
      );
      this.showSuccess(
        `Situation ${updated.numero} rejetée et renvoyée en brouillon`,
      );
      this.item.set(updated);
      return;
    }

    if (event.actionId === 'emettre_facture' && item) {
      const result = await this.crud.emettreFacture(item.id);
      this.showSuccess(
        `Facture client ${result.facture.numero} créée (BROUILLON) — ${result.facture.totalTtc.toLocaleString(this.locale)} MAD TTC`,
      );
      this.item.set(result.situation);
      return;
    }

    if (event.actionId === 'marquer_payee' && item) {
      const updated = await this.crud.marquerPayee(item.id);
      this.showSuccess(`Situation ${updated.numero} marquée payée`);
      this.item.set(updated);
      return;
    }

    await super.handleCustomAction(event);
  }

  private setupCreateFormBehavior(): void {
    const form = this.detailComponent?.form;
    if (!form?.get('chantierId') || this.createFormBehaviorReady) return;
    this.createFormBehaviorReady = true;

    if (this.mode() === 'create') {
      this.setDefaultPeriode(form);
    }

    const chantierControl = form.get('chantierId');
    if (!chantierControl) return;

    chantierControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        if (this.mode() !== 'create') return;
        if (typeof id !== 'string' || !id) return;
        runInInjectionContext(this.injector, () => {
          void this.prefillLignesFromAvancements(id, { silent: true });
          void this.syncNextNumeroOrdre(id);
        });
      });

    const initialChantierId = chantierControl.value;
    if (this.mode() === 'create' && typeof initialChantierId === 'string' && initialChantierId) {
      void this.syncNextNumeroOrdre(initialChantierId);
    }
  }

  private async syncNextNumeroOrdre(chantierId: string): Promise<void> {
    const form = this.detailComponent?.form;
    if (!form || this.mode() !== 'create') return;
    try {
      const next = await runInInjectionContext(this.injector, () =>
        this.crud.nextNumeroOrdre(chantierId),
      );
      form.patchValue({ numeroOrdre: next });
    } catch {
      // Non-blocking — createItem still computes next ordre server-side.
    }
  }

  private setDefaultPeriode(form: FormGroup): void {
    const now = new Date();
    const debut = new Date(now.getFullYear(), now.getMonth(), 1);
    const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const toIso = (d: Date) => d.toISOString().slice(0, 10);

    const patch: Partial<Situation> = {};
    if (!form.get('dateEmission')?.value) {
      patch.dateEmission = toIso(now);
    }
    if (!form.get('datePeriodeDebut')?.value) {
      patch.datePeriodeDebut = toIso(debut);
    }
    if (!form.get('datePeriodeFin')?.value) {
      patch.datePeriodeFin = toIso(fin);
    }
    if (Object.keys(patch).length > 0) {
      form.patchValue(patch);
    }
  }

  private async prefillLignesFromAvancements(
    chantierId: string,
    options?: { silent?: boolean },
  ): Promise<void> {
    if (!chantierId) {
      if (!options?.silent) {
        this.showError('Sélectionnez un chantier avant de reprendre les avancements');
      }
      return;
    }

    if (
      chantierId === this.lastPrefilledChantierId &&
      this.currentLignes().length > 0
    ) {
      return;
    }

    try {
      const lots = await this.fetchLots(chantierId);
      const previousLignes = this.currentLignes();
      const lignes: SituationLigne[] = lots.map((lot) => {
        const previous = previousLignes.find((l) => l.lotId === lot.id);
        const quantiteCumulee =
          lot.avancementPercent > 0
            ? Math.round(
                ((lot.quantite ?? 0) * lot.avancementPercent) / 100 * 100,
              ) / 100
            : (previous?.quantiteCumulee ?? 0);
        const prixUnitaire = lot.prixUnitaireHt ?? 0;
        return {
          id: previous?.id ?? safeRandomUUID(),
          lotId: lot.id,
          lotCode: lot.code,
          designation: lot.designation,
          unite: lot.unite,
          quantiteTotale: lot.quantite,
          quantitePrecedente: previous?.quantitePrecedente ?? 0,
          quantiteCumulee,
          prixUnitaire,
          montantHt: Math.round(quantiteCumulee * prixUnitaire * 100) / 100,
        };
      });
      this.applyLignes(lignes);
      this.lastPrefilledChantierId = chantierId;
      if (!options?.silent) {
        this.showSuccess('Lots pré-remplis depuis les avancements');
      }
    } catch (err) {
      // Surface the cause: a swallowed error here previously masked a
      // `crypto.randomUUID()` TypeError (insecure-context origin) and left
      // the table empty with no diagnostic.
      console.error('[situation] prefill avancements échoué', err);
      if (!options?.silent) {
        this.showError('Impossible de charger les lots du chantier');
      }
    }
  }

  private fetchLots(chantierId: string): Promise<LotChantier[]> {
    return runInInjectionContext(this.injector, () =>
      this.crud.loadLots(chantierId),
    );
  }

  private applyLignes(lignes: SituationLigne[]): void {
    this.currentLignes.set(lignes);
    const control = this.detailComponent?.getFieldControl('lignes');
    if (control) {
      control.setValue(lignes);
      control.markAsDirty();
    }
  }

  private formatPeriode(dateIso: string): string {
    if (!dateIso) return '—';
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return dateIso;
    return d.toLocaleDateString(this.locale, { month: '2-digit', year: 'numeric' });
  }
}
