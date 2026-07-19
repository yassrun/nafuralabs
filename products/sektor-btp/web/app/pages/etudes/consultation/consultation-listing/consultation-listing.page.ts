import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';

import type { Consultation } from '../models';

import { ConsultationFacade } from '../services';
import { buildConsultationListingConfig } from '../config';

@Component({
  selector: 'app-consultation-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './consultation-listing.page.html',
  styleUrls: ['./consultation-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class ConsultationListingPage extends ConfigDrivenListingPage<Consultation> {
  readonly facade = inject(ConsultationFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildConsultationListingConfig(this.translate);
  readonly headerTitle = 'Consultations';
}
