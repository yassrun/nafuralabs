import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
  PrintDialogService,
} from '@platform/lib/anatomy';
import { FieldTemplateDirective } from '@platform/lib/anatomy/components/organisms/entity-detail';
import type { DetailActionEvent, StatusTransitionEvent } from '@platform/lib/anatomy/types';

import type {
  Devis,
  DevisCreate,
  DevisLigne,
  DevisVersion,
} from '@app/etudes/models';
import { DpgfEditorComponent } from '@app/etudes/components/dpgf-editor/dpgf-editor.component';
import { ButtonComponent } from '@platform/lib/anatomy/components/atoms/button/button.component';
import { ExportService } from '@platform/lib/anatomy/services/export.service';
import { ErpAuditService } from '@app/socle/shell/erp-audit.service';
import { MadCurrencyPipe } from '@platform/lib/anatomy/pipes/mad-currency.pipe';

import { DevisFacade } from '../services';
import { DevisApiService } from '../services/devis-api.service';
import { DEVIS_DETAIL_CONFIG } from '../config';

@Component({
  selector: 'app-devis-detail',
  standalone: true,
  imports: [
    ...ConfigDrivenDetailPageImports,
    FieldTemplateDirective,
    DpgfEditorComponent,
    ButtonComponent,
    MadCurrencyPipe,
  ],
  templateUrl: './devis-detail.page.html',
  styleUrls: ['./devis-detail.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenDetailPageStyles],
})
export class DevisDetailPage extends ConfigDrivenDetailPage<Devis> {
  private readonly crud = inject(DevisFacade);
  private readonly devisApi = inject(DevisApiService);
  private readonly nav = inject(Router);
  private readonly exportService = inject(ExportService);
  private readonly audit = inject(ErpAuditService);
  private readonly printDialogService = inject(PrintDialogService);

  readonly facade = createDetailFacadeFromCrud<Devis, DevisCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = DEVIS_DETAIL_CONFIG;

  /** Versions historisées (P2). */
  versions: DevisVersion[] = [];

  get headerTitle(): string {
    if (this.mode() === 'create') return 'Nouveau devis';
    const item = this.item();
    return item
      ? `${item.numero} V${item.version} — ${item.objet ?? ''}`
      : 'Détail devis';
  }

  asFormControl(control: unknown): FormControl {
    return control as FormControl;
  }

  lignesValue(item: Devis | null): DevisLigne[] {
    return (item?.lignes ?? []) as DevisLigne[];
  }

  onLignesChange(control: unknown, value: DevisLigne[]): void {
    (control as FormControl).setValue(value);
    (control as FormControl).markAsDirty();
    this.recomputeLocalTotals(value);
  }

  /** Totaux live approximatifs (lignes OUVRAGE) avant save. */
  private recomputeLocalTotals(lignes: DevisLigne[]): void {
    const item = this.item();
    if (!item || item.status !== 'BROUILLON') return;
    const remise = Number(item.remiseGlobalePercent ?? 0);
    let ht = 0;
    for (const ln of lignes) {
      if (ln.type === 'OUVRAGE' && ln.totalHt != null) ht += Number(ln.totalHt);
    }
    if (remise > 0) ht = ht * (1 - remise / 100);
    const tvaTaux = Number(item.tvaTaux ?? 20);
    const tva = Math.round(ht * tvaTaux) / 100;
    this.item.set({
      ...item,
      lignes,
      totalHt: Math.round(ht * 100) / 100,
      totalTva: Math.round(tva * 100) / 100,
      totalTtc: Math.round((ht + tva) * 100) / 100,
    });
  }

  protected override async loadItem(id: string): Promise<void> {
    await super.loadItem(id);
    const item = this.item();
    if (!item) return;
    await this.crud.loadPartnerContacts(item.clientId);
    this.crud.ensureClientLookup(item);
    if (item.contactClientId && item.contactClient) {
      this.crud.ensureContactLookup(item.contactClientId, item.contactClient);
    }
    if (item.status !== 'BROUILLON') {
      this.mode.set('view');
    } else {
      this.mode.set('edit');
    }
    try {
      this.versions = await this.devisApi.listVersions(item.id);
    } catch {
      this.versions = item.historiqueVersions ?? [];
    }
  }

  override async handleTransition(event: StatusTransitionEvent): Promise<void> {
    const id = this.itemId();
    if (!id) return;
    this.isTransitioning.set(true);
    try {
      const updated = await this.crud.executeTransition(
        id,
        event.endpoint,
        event.note ? { note: event.note } : undefined,
      );
      this.item.set(updated);
      this.mode.set(updated.status === 'BROUILLON' ? 'edit' : 'view');
      this.showSuccess(`Devis ${updated.numero} → ${updated.status}`);
      await this.crud.loadPartnerContacts(updated.clientId);
    } catch (err) {
      this.showError((err as Error).message ?? 'Transition impossible');
    } finally {
      this.isTransitioning.set(false);
    }
  }

  /** Header « Imprimer » : PDF serveur via templates, fallback print navigateur. */
  async printDevis(): Promise<void> {
    const d = this.item();
    if (!d) return;
    try {
      await this.printDialogService.open('devis', d.id, d.numero);
      this.audit.log('PRINT', 'DEVIS', d.id, d.numero, `V${d.version}`);
    } catch {
      this.exportService.printPage();
      this.audit.log('PRINT', 'DEVIS', d.id, d.numero, `V${d.version} (fallback)`);
    }
  }

  openDossier(): void {
    const id = this.item()?.dossierEtudeId;
    if (id) void this.nav.navigate(['/etudes/dossiers', id]);
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<Devis>,
  ): Promise<void> {
    const item = event.item;

    if (event.actionId === 'new_version' && item) {
      const result = await this.confirmDialog.prompt({
        title: 'Modifications apportées dans cette nouvelle version :',
        fields: [{ key: 'modifications', label: 'Modifications', required: false }],
        confirmLabel: 'OK',
        cancelLabel: 'Annuler',
      });
      if (!result) return;
      const modifications = result['modifications'] ?? '';
      const created = await this.crud.newVersion(item.id, modifications);
      this.nav.navigate(['/etudes/devis', created.id]);
      return;
    }

    if (event.actionId === 'convert_chantier' && item) {
      this.nav.navigate(['/chantiers/new'], {
        queryParams: { devisId: item.id },
      });
      return;
    }

    await super.handleCustomAction(event);
  }
}
