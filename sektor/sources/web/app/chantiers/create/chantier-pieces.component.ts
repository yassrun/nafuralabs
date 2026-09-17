import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ButtonComponent,
  IconComponent,
  NfSelectComponent,
  type NfSelectOption,
} from '@platform/lib/anatomy';

import type { DossierDocument } from '@app/etudes/models';
import type { DocumentChantier } from '../documents/models';

import {
  AUTRE_TYPE_OPTIONS,
  type ChantierPieceSlot,
} from './chantier-piece-slots';

export interface StudyDocRef {
  tag: string;
  doc: DossierDocument;
}

@Component({
  selector: 'app-chantier-pieces',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonComponent, IconComponent, NfSelectComponent],
  templateUrl: './chantier-pieces.component.html',
  styleUrl: './chantier-pieces.component.scss',
})
export class ChantierPiecesComponent {
  readonly titre = input('Pièces du chantier');
  readonly aide = input(
    'CPS et BDP d’abord. Les autres pièces se plient dessous — elles ne bloquent pas le cadrage.',
  );
  readonly primarySlots = input.required<ChantierPieceSlot[]>();
  readonly extraSlots = input<ChantierPieceSlot[]>([]);
  readonly documents = input<DocumentChantier[]>([]);
  readonly pendingFiles = input<Record<string, File>>({});
  readonly studyDocuments = input<DossierDocument[]>([]);
  readonly showAutres = input(true);
  readonly disabled = input(false);
  readonly saving = input(false);
  readonly dragOver = input('');

  readonly fileChosen = output<{ tag: string; file: File }>();
  readonly fileRemoved = output<string>();
  readonly extraAdded = output<ChantierPieceSlot>();
  readonly extraRemoved = output<string>();
  readonly reprise = output<StudyDocRef>();
  readonly openDoc = output<DocumentChantier>();
  readonly dragOverChange = output<string>();

  readonly acceptFiles =
    '.pdf,.xlsx,.xls,.csv,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  readonly ajoutOuvert = signal(false);
  readonly autresOuverts = signal(false);
  readonly ajoutType = signal('PLAN');
  readonly ajoutLibelle = signal('');
  readonly ajoutTypeOptions: NfSelectOption[] = AUTRE_TYPE_OPTIONS;

  readonly autresDeposes = computed(
    () => this.extraSlots().filter((s) => !!this.documentFor(s.tag) || !!this.pendingFiles()[s.tag]).length,
  );

  badge(slot: ChantierPieceSlot): string {
    if (slot.tag === 'CPS' || slot.type === 'CPS') return 'CPS';
    if (slot.tag === 'BDP' || slot.type === 'BORDEREAU') return 'BDP';
    if (slot.tag === 'MARCHE_SIGNE') return 'Marché';
    if (slot.tag === 'ORDRE_SERVICE' || slot.type === 'OS') return 'OS';
    return AUTRE_TYPE_OPTIONS.find((t) => t.value === slot.type)?.label ?? slot.type;
  }

  documentFor(tag: string): DocumentChantier | undefined {
    return this.documents().find((d) => d.tags?.includes(tag) && !!d.storageKey);
  }

  pendingFor(tag: string): File | undefined {
    return this.pendingFiles()[tag];
  }

  studyDocFor(tag: string): DossierDocument | undefined {
    const docs = this.studyDocuments();
    if (!docs.length) return undefined;
    if (tag === 'CPS') {
      return docs.find((d) => d.type === 'CPS' || d.type === 'CPS_ET_BORDEREAU');
    }
    if (tag === 'BDP') {
      return docs.find((d) => d.type === 'BORDEREAU' || d.type === 'CPS_ET_BORDEREAU');
    }
    const slot = this.extraSlots().find((s) => s.tag === tag);
    if (!slot) return undefined;
    return docs.find((d) => d.type === slot.type || (d.nomFichier && d.nomFichier === slot.label));
  }

  onDragOver(tag: string, event: DragEvent): void {
    event.preventDefault();
    this.dragOverChange.emit(tag);
  }

  onDrop(tag: string, event: DragEvent): void {
    event.preventDefault();
    this.dragOverChange.emit('');
    const file = event.dataTransfer?.files[0];
    if (file && !this.disabled()) this.fileChosen.emit({ tag, file });
  }

  onFile(tag: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && !this.disabled()) this.fileChosen.emit({ tag, file });
    input.value = '';
  }

  toggleAutres(): void {
    this.autresOuverts.update((v) => !v);
  }

  ajouter(): void {
    const type = this.ajoutType();
    const label = this.ajoutLibelle().trim() || AUTRE_TYPE_OPTIONS.find((t) => t.value === type)?.label || 'Autre pièce';
    const tag = `AUTRE_${type}_${Date.now()}`;
    this.extraAdded.emit({ tag, type, label, hint: '', required: false });
    this.ajoutLibelle.set('');
    this.ajoutOuvert.set(false);
    this.autresOuverts.set(true);
  }

  emitReprise(tag: string): void {
    const doc = this.studyDocFor(tag);
    if (!doc || this.disabled()) return;
    this.reprise.emit({ tag, doc });
  }

  dropLabel(slot: ChantierPieceSlot): string {
    if (slot.tag === 'BDP') return 'Déposer un BDP';
    if (slot.type === 'PLAN') return 'Déposer les plans (PLA)';
    return 'Déposer le fichier';
  }
}
