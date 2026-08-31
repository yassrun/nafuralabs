import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@platform/lib/anatomy';

import { buildConsultationListingConfig } from '../config';
import { ConsultationFacade, type ConsultationAchat } from '../services';

@Component({
  selector: 'app-consultation-listing',
  standalone: true,
  imports: [TranslateModule, ...ConfigDrivenListingPageImports],
  templateUrl: './consultation-listing.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
  styleUrl: './consultation-listing.page.scss',
})
export class ConsultationListingPage extends ConfigDrivenListingPage<ConsultationAchat> {
  readonly facade = inject(ConsultationFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildConsultationListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('achats.consultation.headerTitle');
}
