import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud, ButtonComponent} from '@platform/lib/anatomy';
import type { DetailActionEvent } from '@platform/lib/anatomy/types';

import { ReservationStockService } from '@app/catalogue/services/reservation-stock.service';
import { StockLabelPrintService } from '@app/catalogue/services/stock-label-print.service';

import { ArticlesFacade } from '../services';
import type { Article, ArticleCreate } from '../models';
import { buildArticleDetailConfig } from '../config';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [
    ButtonComponent,TranslateModule, ...ConfigDrivenDetailPageImports],
  templateUrl: './article-detail.page.html',
  styleUrls: ['./article-detail.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenDetailPageStyles],
})
export class ArticleDetailPage extends ConfigDrivenDetailPage<Article> {
  private readonly crud = inject(ArticlesFacade);
  private readonly reservations = inject(ReservationStockService);
  private readonly labels = inject(StockLabelPrintService);
  private readonly translate = inject(TranslateService);

  readonly reservationRows = computed(() => {
    const id = (this.item() as Article | null)?.id;
    return id ? this.reservations.listForArticle(id) : [];
  });

  readonly facade = createDetailFacadeFromCrud<Article, ArticleCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildArticleDetailConfig(this.translate);

  get headerTitle(): string {
    const mode = this.mode();
    if (mode === 'create') return this.translate.instant('inventory.catalogue.article.headerTitleNew');
    const item = this.item();
    return item
      ? `${(item as any).name || (item as any).code || ''}`
      : this.translate.instant('inventory.catalogue.article.headerTitleDetail');
  }

  printLabels(): void {
    const item = this.item() as Article | null;
    if (!item) return;
    this.labels.openArticleLabels({ id: item.id, code: item.code, name: item.name });
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<Article>
  ): Promise<void> {
    const item = event.item;

    if (item && (item.nature === 'MATERIEL' || item.nature === 'OUTILLAGE')) {
      this.router.navigate(['/inventory/catalogue/materiel']);
      return;
    }

    switch (event.actionId) {
      default:
        console.log('Unhandled detail action:', event.actionId, event);
    }
  }
}
