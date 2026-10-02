
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@platform/lib/anatomy';
import type { Incident } from '@app/hse/models';

import { IncidentFacade } from '../services';
import { buildIncidentsListingConfig } from '../config';

@Component({
  selector: 'app-incident-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './incident-listing.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class IncidentListingPage extends ConfigDrivenListingPage<Incident> {
  readonly facade = inject(IncidentFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildIncidentsListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('hse.incident.headerTitle');
}
