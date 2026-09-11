import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@platform/lib/anatomy';

import type { DossierEtude } from '@app/etudes/models';

import { DossierEtudeFacade } from '../services/dossier-etude.facade';
import { buildDossierListingConfig } from '../config/listing.config';
import { readDossierListingFilters } from '../config/listing.filters';

@Component({
  selector: 'app-dossier-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './dossier-listing.page.html',
  styleUrls: ['./dossier-listing.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class DossierListingPage extends ConfigDrivenListingPage<DossierEtude> {
  readonly facade = inject(DossierEtudeFacade);
  readonly config = buildDossierListingConfig();
  readonly headerTitle = "Études / appels d'offres";

  private readonly queryFilters = toSignal(
    this.route.queryParamMap.pipe(
      map((p) => readDossierListingFilters((k: string) => p.get(k))),
    ),
    {
      initialValue: readDossierListingFilters(
        (k: string) => this.route.snapshot.queryParamMap.get(k),
      ),
    },
  );

  readonly initialFilters = computed(() => this.queryFilters() ?? {});

  constructor() {
    super();
    void this.hydrateIngenieurFilter();
  }

  private async hydrateIngenieurFilter(): Promise<void> {
    await this.facade.ensureLookups();
    const field = this.config.filters?.find((f) => f.key === 'chargeEtudeUserId');
    if (!field) return;
    field.options = (this.facade.lookups()['ingenieurs'] ?? []).map((i) => ({
      value: i.key,
      label: i.value,
    }));
  }
}
