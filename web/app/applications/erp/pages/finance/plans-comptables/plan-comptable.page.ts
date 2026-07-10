import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ConfigDrivenListingPageImports, ConfirmDialogService } from '@lib/anatomy';
import { ButtonComponent } from '@lib/anatomy/components';

import { CompteTreePickerComponent } from '@applications/erp/finance/components/compte-tree-picker/compte-tree-picker.component';
import type {
  Compte,
  CompteCreate,
  Journal,
  JournalCreate,
} from '@applications/erp/finance/models';

import { CompteEditDrawerComponent } from './components/compte-edit-drawer/compte-edit-drawer.component';
import { JournalConfigComponent } from './components/journal-config/journal-config.component';
import { PlanComptableFacade } from './services';

@Component({
  selector: 'app-plan-comptable',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...ConfigDrivenListingPageImports,
    CompteTreePickerComponent,
    CompteEditDrawerComponent,
    JournalConfigComponent,
    ButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plan-comptable.page.html',
  styleUrls: ['./plan-comptable.page.scss'],
})
export class PlanComptablePage {
  readonly facade = inject(PlanComptableFacade);
  private readonly translate = inject(TranslateService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly tab = signal<'arbre' | 'journaux'>('arbre');

  readonly drawerCompte = signal<Compte | null>(null);
  readonly drawerCreate = signal<boolean>(false);

  readonly headerConfig = {
    title: this.translate.instant('finance.planComptable.page.title'),
    subtitle: this.translate.instant('finance.planComptable.page.subtitle'),
  };

  readonly comptes = computed(() => this.facade.comptes());
  readonly journaux = computed(() => this.facade.journaux());

  constructor() {
    void this.facade.loadAll();
  }

  setTab(t: 'arbre' | 'journaux'): void {
    this.tab.set(t);
  }

  onCompteSelected(c: Compte): void {
    this.drawerCreate.set(false);
    this.drawerCompte.set(c);
  }

  openCreate(): void {
    this.drawerCompte.set(null);
    this.drawerCreate.set(true);
  }

  closeDrawer(): void {
    this.drawerCompte.set(null);
    this.drawerCreate.set(false);
  }

  async onCompteSaved(payload: CompteCreate & { id?: string }): Promise<void> {
    try {
      const { id, ...rest } = payload;
      if (id) {
        await this.facade.updateCompte(id, rest);
      } else {
        await this.facade.createCompte(rest);
      }
      this.closeDrawer();
    } catch (e) {
      console.error('[plan-comptable] save failed', e);
    }
  }

  async onCompteDeleted(c: Compte): Promise<void> {
    try {
      await this.facade.deleteCompte(c.id);
      this.closeDrawer();
    } catch (e) {
      console.error('[plan-comptable] delete failed', e);
    }
  }

  async onJournalCreated(j: JournalCreate): Promise<void> {
    await this.facade.createJournal(j);
  }

  async onJournalUpdated(payload: { id: string; patch: Partial<Journal> }): Promise<void> {
    await this.facade.updateJournal(payload.id, payload.patch);
  }

  async onJournalDeleted(j: Journal): Promise<void> {
    await this.facade.deleteJournal(j.id);
  }

  async resetSeed(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('finance.planComptable.resetConfirm'),
      message: ' ',
      confirmLabel: this.translate.instant('common.actions.delete'),
      cancelLabel: this.translate.instant('common.actions.cancel'),
      variant: 'danger',
    });
    if (!confirmed) {
      return;
    }
    await this.facade.resetPlanComptable();
  }
}
