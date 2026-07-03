import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { DetailActionEvent } from '@lib/anatomy/types';
import type { Incident, IncidentCreate } from '@applications/erp/hse/models';

import { IncidentFacade } from '../services';
import { IncidentApiService } from '../services/incident-api.service';
import { IncidentService } from '@applications/erp/hse/services/incident.service';
import { buildIncidentDetailConfig } from '../config';

@Component({
  selector: 'app-incident-detail',
  standalone: true,
  imports: [CommonModule, ...ConfigDrivenDetailPageImports],
  templateUrl: './incident-detail.page.html',
  styles: [ConfigDrivenDetailPageStyles],
})
export class IncidentDetailPage extends ConfigDrivenDetailPage<Incident> {
  private readonly crud = inject(IncidentFacade);
  private readonly incidentApi = inject(IncidentApiService);
  private readonly incidentSvc = inject(IncidentService);
  private readonly translate = inject(TranslateService);

  readonly facade = createDetailFacadeFromCrud<Incident, IncidentCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildIncidentDetailConfig(this.translate);

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('hse.incident.createTitle');
    const item = this.item();
    return item ? `${item.numero} — ${item.lieu}` : this.translate.instant('hse.incident.detailTitle');
  }

  protected override async handleCustomAction(event: DetailActionEvent<Incident>): Promise<void> {
    const item = event.item;

    if (event.actionId === 'investiguer' && item) {
      const updated = await this.crud.investiguer(item.id);
      this.item.set(updated);
      this.showSuccess(
        this.translate.instant('hse.incident.toasts.investigated').replace('{numero}', updated.numero),
      );
      return;
    }

    if (event.actionId === 'cloturer' && item) {
      const updated = await this.crud.cloturer(item.id);
      this.item.set(updated);
      this.showSuccess(
        this.translate.instant('hse.incident.toasts.closed').replace('{numero}', updated.numero),
      );
      return;
    }

    if (event.actionId === 'declarerCnssDat' && item) {
      const hRem = this.incidentSvc.hoursUntilCnssDeadline(item);
      if (this.incidentSvc.isCnssDeadlinePassed(item)) {
        this.showError(
          this.translate
            .instant('hse.incident.toasts.cnssDeadlinePassed')
            .replace('{hours}', Math.abs(hRem).toFixed(1)),
        );
      } else {
        this.showSuccess(
          this.translate
            .instant('hse.incident.toasts.cnssReminder')
            .replace('{hours}', hRem.toFixed(1)),
        );
      }
      await this.incidentApi.declarerCnssDat(item.id);
      const updated = await this.incidentApi.getById(item.id);
      this.item.set(updated);
      const ref = updated.cnssReferenceDeclaration ?? this.incidentSvc.nextMockCnssReference(item.typeIncident);
      const html = this.incidentSvc.buildCnssDatPrintHtml(updated);
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
      }
      this.showSuccess(
        this.translate.instant('hse.incident.toasts.cnssRecorded').replace('{ref}', ref),
      );
      return;
    }

    await super.handleCustomAction(event);
  }
}
