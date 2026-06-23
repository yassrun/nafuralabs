import { Component, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ButtonComponent,
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { buildAvancementsListingConfig } from '../config/listing/config';
import type { AvancementListItem, AvancementPhoto } from '../models';
import { AvancementApiService } from '../services/avancement-api.service';
import { AvancementFacade } from '../services';

type QuickFilterId = 'week' | 'month' | 'mine' | 'late' | null;

@Component({
  selector: 'app-avancements-listing',
  standalone: true,
  imports: [ButtonComponent, ...ConfigDrivenListingPageImports, TranslateModule],
  templateUrl: './avancements-listing.page.html',
  styleUrls: ['./avancements-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class AvancementsListingPage extends ConfigDrivenListingPage<AvancementListItem> {
  private readonly translate = inject(TranslateService);
  private readonly avancementApi = inject(AvancementApiService);
  readonly facade = inject(AvancementFacade);
  readonly router = inject(Router);
  readonly config = buildAvancementsListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('chantiers.avancement.listing.headerTitle');

  readonly activeQuickFilter = signal<QuickFilterId>(null);
  readonly galleryPhotos = signal<AvancementPhoto[]>([]);
  readonly galleryTitle = signal<string>('');

  constructor() {
    super();
    void this.facade.ensureLookups();
  }

  private toIso(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  applyQuickFilter(filter: Exclude<QuickFilterId, null>): void {
    const listing = this.listingComponent;
    if (!listing) {
      return;
    }

    const now = new Date();
    const current = { ...listing.filterValues() };
    const next: Record<string, unknown> = {
      ...current,
      enRetard: false,
      mesSaisies: false,
    };

    switch (filter) {
      case 'week': {
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        next['dateFrom'] = this.toIso(monday);
        next['dateTo'] = this.toIso(sunday);
        break;
      }
      case 'month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        next['dateFrom'] = this.toIso(start);
        next['dateTo'] = this.toIso(end);
        break;
      }
      case 'mine':
        next['saisieParId'] = this.facade.currentUser().id;
        next['mesSaisies'] = true;
        break;
      case 'late':
        next['enRetard'] = true;
        break;
    }

    this.activeQuickFilter.set(filter);
    listing.onFilterChange(next);
  }

  resetQuickFilters(): void {
    const listing = this.listingComponent;
    if (!listing) {
      return;
    }

    this.activeQuickFilter.set(null);
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    listing.onFilterChange({
      ...listing.filterValues(),
      dateFrom: this.toIso(thirtyDaysAgo),
      dateTo: this.toIso(now),
      saisieParId: undefined,
      enRetard: false,
      mesSaisies: false,
    });
  }

  closeGallery(): void {
    this.galleryPhotos.set([]);
    this.galleryTitle.set('');
  }

  protected override async handleCustomAction(
    event: ListingActionEvent<AvancementListItem>,
  ): Promise<void> {
    switch (event.actionId) {
      case 'refresh':
        await this.refresh();
        return;
      case 'saisir':
        await this.router.navigate(['/chantiers/avancements/saisie']);
        return;
      case 'ouvrir-chantier':
        if (event.item?.chantierId) {
          await this.router.navigate(['/chantiers', event.item.chantierId]);
        }
        return;
      case 'voir-photos':
        if (event.item && (event.item.photosCount > 0 || event.item.photos.length > 0)) {
          const photos = event.item.photos.length > 0
            ? event.item.photos
            : await this.avancementApi.loadPhotos(event.item.id);
          this.galleryPhotos.set(photos);
          this.galleryTitle.set(
            this.translate.instant('chantiers.avancement.gallery.title', {
              chantierCode: event.item.chantierCode,
              lotCode: event.item.lotCode,
            }),
          );
        }
        return;
      case 'modifier':
        if (event.item && this.facade.canEditItem(event.item)) {
          await this.router.navigate(['/chantiers/avancements/saisie', event.item.chantierId], {
            queryParams: { edit: event.item.id },
          });
        }
        return;
      default:
        return;
    }
  }
}