import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, EmptyStateComponent } from '@lib/anatomy/components';
import { ConfirmDialogService, ToastService } from '@lib/anatomy';
import { AvancementFacade } from '../services';
import { LotSaisieCardComponent } from './components/lot-saisie-card/lot-saisie-card.component';

@Component({
  selector: 'app-avancement-saisie',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, ButtonComponent, EmptyStateComponent, LotSaisieCardComponent],
  templateUrl: './avancement-saisie.page.html',
  styleUrls: ['./avancement-saisie.page.scss'],
})
export class AvancementSaisiePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly facade = inject(AvancementFacade);
  readonly chantiers = this.facade.chantiers;
  readonly currentUser = this.facade.currentUser;
  readonly chantier = this.facade.chantier;
  readonly lots = this.facade.selectedLots;
  readonly additionalLots = this.facade.availableAdditionalLots;
  readonly summary = this.facade.summary;
  readonly isEditing = computed(() => this.facade.editingAvancementId() !== null);
  readonly loadError = signal<string | null>(null);

  readonly formTitle = computed(() => this.isEditing()
    ? this.translate.instant('chantiers.avancement.editTitle')
    : this.translate.instant('chantiers.avancement.title'));

  constructor() {
    const chantierId = this.route.snapshot.paramMap.get('chantierId');
    const editId = this.route.snapshot.queryParamMap.get('edit');
    void this.facade.loadSaisieContext(chantierId, editId).then((result) => {
      if (result === 'edit-not-found') {
        this.loadError.set(this.translate.instant('chantiers.avancement.errors.saisieNotFound'));
      } else if (result === 'chantier-not-found') {
        this.loadError.set(this.translate.instant('chantiers.avancement.errors.chantierNotFound'));
      }
    });
  }

  async saveDraft(): Promise<void> {
    try {
      const count = await this.facade.saveDraft();
      this.toast.success(this.translate.instant('chantiers.avancement.alerts.savedDraft', { count }));
      await this.router.navigate(['/chantiers/avancements']);
    } catch (error) {
      const fallback = this.translate.instant('chantiers.avancement.errors.saveFailed');
      this.toast.error(error instanceof Error ? error.message : fallback);
    }
  }

  goBack(): void {
    void this.router.navigate(['/chantiers/avancements']);
  }

  async validate(): Promise<void> {
    const summary = this.summary();
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('chantiers.avancement.confirm.validate', {
        count: summary.lotsCount,
        before: summary.chantierBeforePercent,
        after: summary.chantierAfterPercent,
      }),
      message: ' ',
      confirmLabel: 'OK',
      cancelLabel: this.translate.instant('common.actions.cancel'),
    });
    if (!confirmed) {
      return;
    }

    try {
      const count = await this.facade.validate();
      this.toast.success(this.translate.instant('chantiers.avancement.alerts.validated', { count }));
      await this.router.navigate(['/chantiers/avancements']);
    } catch (error) {
      const fallback = this.translate.instant('chantiers.avancement.errors.validateFailed');
      this.toast.error(error instanceof Error ? error.message : fallback);
    }
  }
}