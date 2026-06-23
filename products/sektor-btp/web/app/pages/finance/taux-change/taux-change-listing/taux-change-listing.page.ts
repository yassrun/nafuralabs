import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, ConfigDrivenListingPage, ConfigDrivenListingPageImports, ConfigDrivenListingPageStyles } from '@lib/anatomy';

import { TauxChangeConverterComponent } from '@applications/erp/finance/components/taux-change-converter/taux-change-converter.component';
import type { TauxChange } from '@applications/erp/finance/models';

import { TauxChangeFacade } from '../services';
import { buildTauxChangeListingConfig } from '../config';
import { TauxEvolutionChartComponent } from '../components/taux-evolution-chart/taux-evolution-chart.component';

@Component({
  selector: 'app-taux-change-listing',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...ConfigDrivenListingPageImports,
    TauxEvolutionChartComponent,
    TauxChangeConverterComponent,
    ButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig"></nf-page-header>

      <div class="tx">
        <div class="tx__toolbar">
          <nf-button variant="ghost" class="tx__btn tx__btn--ghost" (clicked)="onImportFromBam()"  [disabled]="importing()">
            {{ (importing() ? 'finance.tauxChange.toasts.imported' : 'finance.tauxChange.actions.importBam') | translate }}
          </nf-button>
          <nf-button variant="ghost" class="tx__btn tx__btn--ghost" (clicked)="toggleView()">
            {{ (view() === 'table' ? 'finance.tauxChange.chart.title' : 'finance.common.actions.viewDetail') | translate }}
          </nf-button>
        </div>

        @if (view() === 'chart') {
          <app-taux-evolution-chart [taux]="allTaux()" />
          <app-taux-change-converter [devises]="facade.devises()" [taux]="allTaux()" />
        }

        <nf-entity-listing
          #listing
          [config]="config"
          [facade]="facade"
          (action)="onAction($event)">
        </nf-entity-listing>
      </div>
    </nf-page-shell>
  `,
  styles: [
    ConfigDrivenListingPageStyles,
    `
      .tx {
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 14px 20px 32px;
      }
      .tx__toolbar {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
      .tx__btn {
        padding: 7px 14px;
        border-radius: 6px;
        border: 1px solid var(--nf-color-primary-200);
        background: var(--nf-color-surface);
        color: var(--nf-color-primary-700);
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
      }
      .tx__btn:hover:not(:disabled) {
        background: var(--nf-color-primary-50);
      }
      .tx__btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
  ],
})
export class TauxChangeListingPage extends ConfigDrivenListingPage<TauxChange> {
  readonly facade = inject(TauxChangeFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildTauxChangeListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('finance.tauxChange.title');

  readonly view = signal<'table' | 'chart'>('table');
  readonly importing = signal<boolean>(false);

  readonly allTaux = computed(() => this.facade.items() ?? []);

  toggleView(): void {
    this.view.set(this.view() === 'table' ? 'chart' : 'table');
  }

  async onImportFromBam(): Promise<void> {
    if (this.importing()) return;
    this.importing.set(true);
    try {
      const created = await this.facade.importFromBam();
      this.toast.success(
        this.translate
          .instant('finance.tauxChange.toasts.imported')
          .replace('{n}', String(created.length)),
      );
      await this.refresh();
    } catch (e) {
      this.toast.error(
        `${this.translate.instant('finance.common.toasts.error')} : ${(e as Error).message}`,
      );
    } finally {
      this.importing.set(false);
    }
  }
}
