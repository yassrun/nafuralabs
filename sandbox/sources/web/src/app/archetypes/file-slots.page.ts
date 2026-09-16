import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ScreenComponent } from '@platform/lib/anatomy/components/organisms/page-screen';
import type { PageHeaderConfig } from '@platform/lib/anatomy/components/molecules/page-header';
import { FileSlotsComponent } from '@platform/lib/anatomy/components/organisms/file-slots';
import type {
  FileSlotDensity,
  FileSlotModel,
} from '@platform/lib/anatomy/components/molecules/file-slot';

@Component({
  selector: 'sb-file-slots',
  standalone: true,
  imports: [FormsModule, ScreenComponent, FileSlotsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-screen [header]="headerConfig">
      <div class="lab">
        <div class="lab__stage">
          <nf-file-slots
            [slots]="slots()"
            [density]="density()"
            [columns]="columns()"
            [readonly]="optReadonly()"
            [showGroupAdd]="optAdd()"
            [groupOpen]="groupOpen()"
            (groupOpenChange)="groupOpen.set($event)"
            groupTitle="Autres documents"
            (file)="onFile($event.slotId, $event.file)"
            (open)="last.set('open ' + $event.slotId)"
            (remove)="onRemove($event.slotId)"
            (extract)="onExtract($event.slotId)"
            (dismiss)="onDismiss($event.slotId)"
            (add)="last.set('add')"
          />
          <p class="lab__log">Dernière action : {{ last() }}</p>
        </div>
        <aside class="lab__opts">
          <h2>Configuration</h2>
          <p class="lab__hint">
            Un slot = type + upload / remplacer / supprimer. <code>grouped</code> plie
            le slot. <code>extract</code> est optionnel (IA).
          </p>
          <label>
            Densité
            <select [ngModel]="density()" (ngModelChange)="density.set($event)">
              <option value="compact">compact</option>
              <option value="comfortable">comfortable</option>
            </select>
          </label>
          <label><input type="checkbox" [ngModel]="optReadonly()" (ngModelChange)="optReadonly.set($event)" /> Lecture seule</label>
          <label><input type="checkbox" [ngModel]="optAdd()" (ngModelChange)="optAdd.set($event)" /> Ajouter (groupe)</label>
          <label><input type="checkbox" [ngModel]="optExtract()" (ngModelChange)="optExtract.set($event)" /> Extract IA sur BDP</label>
          <label><input type="checkbox" [ngModel]="optFilled()" (ngModelChange)="optFilled.set($event)" /> CPS / BDP déposés</label>
        </aside>
      </div>
    </nf-screen>
  `,
  styles: [
    `
      .lab {
        display: grid;
        grid-template-columns: 1fr 260px;
        gap: 20px;
        align-items: start;
        min-height: 0;
        height: 100%;
      }
      .lab__stage {
        min-width: 0;
      }
      .lab__opts {
        padding: 12px;
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 8px;
        background: var(--nf-surface-section, #fff);
      }
      .lab__opts h2 {
        margin: 0 0 8px;
        font-size: 0.85rem;
      }
      .lab__hint {
        margin: 0 0 12px;
        font-size: 0.75rem;
        color: var(--nf-text-muted, #6b7280);
      }
      .lab__opts label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 8px 0;
        font-size: 0.8125rem;
      }
      .lab__opts select {
        margin-left: auto;
      }
      .lab__log {
        margin-top: 16px;
        font-size: 0.75rem;
        color: var(--nf-text-muted, #6b7280);
      }
      @media (max-width: 900px) {
        .lab {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class FileSlotsPage {
  readonly headerConfig: PageHeaderConfig = {
    title: 'File slots',
    subtitle: 'nf-file-slot · nf-file-slots · type + upload/replace/delete · extract optionnel',
  };

  readonly density = signal<FileSlotDensity>('compact');
  readonly optReadonly = signal(false);
  readonly optAdd = signal(true);
  readonly optExtract = signal(true);
  readonly optFilled = signal(false);
  readonly groupOpen = signal(false);
  readonly last = signal('—');

  readonly columns = computed(() => (this.density() === 'compact' ? 1 : 2));

  readonly slots = computed((): FileSlotModel[] => {
    const filled = this.optFilled();
    const extract = this.optExtract();
    return [
      {
        id: 'cps',
        type: 'CPS',
        required: true,
        dropLabel: 'Déposer le fichier',
        emptyStatus: 'À déposer',
        fileName: filled ? 'CPS-consultation.pdf' : null,
        fileId: filled ? 'f-cps' : null,
      },
      {
        id: 'bdp',
        type: 'BDP',
        required: true,
        dropLabel: 'Déposer un BDP',
        emptyStatus: 'À déposer',
        fileName: filled ? 'BDP-2-17.pdf' : null,
        fileId: filled ? 'f-bdp' : null,
            extract: extract && filled ? { label: 'Extraire', icon: 'sparkles' } : undefined,
      },
      {
        id: 'pla',
        type: 'PLA',
        label: 'Plans',
        grouped: true,
        dropLabel: 'Déposer les plans (PLA)',
        hint: 'IA',
        dismissible: true,
      },
      {
        id: 'rc',
        type: 'RC',
        label: 'Règlement de consultation',
        grouped: true,
        dropLabel: 'Déposer le fichier',
        dismissible: true,
      },
      {
        id: 'cpt',
        type: 'CPT',
        label: 'Cahier des prescriptions',
        grouped: true,
        dropLabel: 'Déposer le fichier',
        dismissible: true,
      },
    ];
  });

  onFile(slotId: string, file: File): void {
    this.last.set(`file ${slotId} ← ${file.name}`);
  }

  onRemove(slotId: string): void {
    this.last.set(`remove ${slotId}`);
  }

  onExtract(slotId: string): void {
    this.last.set(`extract ${slotId}`);
  }

  onDismiss(slotId: string): void {
    this.last.set(`dismiss ${slotId}`);
  }
}
