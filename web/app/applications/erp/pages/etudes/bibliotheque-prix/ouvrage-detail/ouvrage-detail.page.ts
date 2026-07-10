import { Component, inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import { FieldTemplateDirective } from '@lib/anatomy/components/organisms/entity-detail';

import type {
  ComposantDPU,
  ComposantOuvrage,
  DpuHistoriqueEntry,
  Ouvrage,
  OuvrageCreate,
  UniteMain,
} from '@applications/erp/etudes/models';
import { ComposantsEditorComponent } from '@applications/erp/etudes/components/composants-editor/composants-editor.component';
import { DpuEditorComponent } from '@applications/erp/etudes/components/dpu-editor/dpu-editor.component';

import { DpuApiService, OuvrageFacade } from '../services';
import { OUVRAGE_DETAIL_CONFIG } from '../config';

@Component({
  selector: 'app-ouvrage-detail',
  standalone: true,
  imports: [
    ...ConfigDrivenDetailPageImports,
    FieldTemplateDirective,
    ComposantsEditorComponent,
    DpuEditorComponent,
  ],
  templateUrl: './ouvrage-detail.page.html',
  styleUrls: ['./ouvrage-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class OuvrageDetailPage extends ConfigDrivenDetailPage<Ouvrage> {
  private readonly crud = inject(OuvrageFacade);
  private readonly dpuApi = inject(DpuApiService);

  readonly facade = createDetailFacadeFromCrud<Ouvrage, OuvrageCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = OUVRAGE_DETAIL_CONFIG;

  get headerTitle(): string {
    if (this.mode() === 'create') return 'Nouvel ouvrage';
    const item = this.item();
    return item ? `${item.code} — ${item.designation}` : 'Détail ouvrage';
  }

  asFormControl(control: unknown): FormControl {
    return control as FormControl;
  }

  composantsValue(item: Ouvrage | null): ComposantOuvrage[] {
    return (item?.composants ?? []) as ComposantOuvrage[];
  }

  uniteMainValue(item: Ouvrage | null): UniteMain {
    return (
      item?.uniteMain ?? { heures: 0, tauxHoraire: 50, total: 0 }
    );
  }

  onComposantsChange(control: unknown, value: ComposantOuvrage[]): void {
    (control as FormControl).setValue(value);
    (control as FormControl).markAsDirty();
  }

  onPrixChange(value: number): void {
    const form = this.detailComponent?.form as FormGroup | undefined;
    if (!form) return;
    form.get('prixUnitaireHt')?.setValue(value, { emitEvent: false });
    form.markAsDirty();
  }

  onUniteMainPatch(patch: UniteMain): void {
    const form = this.detailComponent?.form as FormGroup | undefined;
    if (!form) return;
    const value = form.value as Record<string, unknown>;
    const current = (value['uniteMain'] as UniteMain | undefined) ?? {
      heures: 0,
      tauxHoraire: 50,
      total: 0,
    };
    form.patchValue({ uniteMain: { ...current, ...patch } });
    form.markAsDirty();
  }

  dpuComposantsValue(item: Ouvrage | null): ComposantDPU[] {
    return (item?.dpuComposants ?? []) as ComposantDPU[];
  }

  dpuHistoriqueValue(item: Ouvrage | null): DpuHistoriqueEntry[] {
    return (item?.dpuHistorique ?? []) as DpuHistoriqueEntry[];
  }

  onDpuComposantsChange(control: unknown, value: ComposantDPU[]): void {
    (control as FormControl).setValue(value);
    (control as FormControl).markAsDirty();
  }

  onDpuHistoriqueChange(c: AbstractControl | null | undefined, value: DpuHistoriqueEntry[]): void {
    if (!c) return;
    (c as FormControl).setValue(value);
    c.markAsDirty();
    void this.persistDpuSnapshot(value);
  }

  private async persistDpuSnapshot(entries: DpuHistoriqueEntry[]): Promise<void> {
    const dpuId = this.item()?.dpuId;
    if (!dpuId || entries.length === 0) return;
    try {
      await this.dpuApi.createVersion(dpuId);
    } catch {
      // Snapshot reste local si le DPU n'existe pas encore côté serveur
    }
  }

  onDpuFgChange(c: AbstractControl | null | undefined, v: number): void {
    if (!c) return;
    (c as FormControl).setValue(v);
    c.markAsDirty();
  }

  onDpuMargeChange(c: AbstractControl | null | undefined, v: number): void {
    if (!c) return;
    (c as FormControl).setValue(v);
    c.markAsDirty();
  }
}
