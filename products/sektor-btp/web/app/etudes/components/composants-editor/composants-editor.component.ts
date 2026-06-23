import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { ComposantOuvrage, ComposantType, UniteMain } from '../../models';

import { ButtonComponent } from '@lib/anatomy';
@Component({
  selector: 'app-composants-editor',
  standalone: true,
  imports: [
    ButtonComponent,CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './composants-editor.component.html',
  styleUrl: './composants-editor.component.scss',
})
export class ComposantsEditorComponent {
  private _composants = signal<ComposantOuvrage[]>([]);
  private _uniteMain = signal<UniteMain>({ heures: 0, tauxHoraire: 50, total: 0 });
  private _fg = signal<number>(8);
  private _benef = signal<number>(7);
  private _readonly = false;
  private _ouvrageId = '';

  readonly types: { value: ComposantType; label: string }[] = [
    { value: 'MATERIAU', label: 'Matériau' },
    { value: 'SOUS_TRAITANCE', label: 'Sous-traitance' },
    { value: 'LOCATION', label: 'Location' },
    { value: 'OUTILLAGE', label: 'Outillage' },
    { value: 'MO', label: 'Main d\'œuvre' },
  ];

  readonly composants = computed(() => this._composants());
  readonly uniteMain = computed(() => this._uniteMain());
  readonly fg = computed(() => this._fg());
  readonly benef = computed(() => this._benef());

  readonly composantsTotal = computed(() => {
    return Math.round(this._composants().reduce((s, c) => s + (c.total || 0), 0) * 100) / 100;
  });

  readonly sousTotalDebourse = computed(() => {
    return Math.round((this.composantsTotal() + this._uniteMain().total) * 100) / 100;
  });

  readonly fraisGenerauxValue = computed(
    () => Math.round(this.sousTotalDebourse() * (this._fg() / 100) * 100) / 100,
  );

  readonly beneficeBase = computed(
    () => Math.round((this.sousTotalDebourse() + this.fraisGenerauxValue()) * 100) / 100,
  );

  readonly beneficeValue = computed(
    () => Math.round(this.beneficeBase() * (this._benef() / 100) * 100) / 100,
  );

  readonly prixUnitaireHt = computed(
    () => Math.round((this.beneficeBase() + this.beneficeValue()) * 100) / 100,
  );

  @Input() set composantsValue(value: ComposantOuvrage[] | null | undefined) {
    this._composants.set(Array.isArray(value) ? [...value] : []);
  }

  @Input() set uniteMainValue(value: UniteMain | null | undefined) {
    if (value) {
      this._uniteMain.set({ ...value });
    }
  }

  @Input() set fraisGenerauxPercent(value: number | null | undefined) {
    if (typeof value === 'number') this._fg.set(value);
  }

  @Input() set beneficePercent(value: number | null | undefined) {
    if (typeof value === 'number') this._benef.set(value);
  }

  @Input() set readonly(value: boolean) {
    this._readonly = value;
  }
  get readonly(): boolean {
    return this._readonly;
  }

  @Input() set ouvrageId(value: string) {
    this._ouvrageId = value;
  }

  @Output() readonly composantsChange = new EventEmitter<ComposantOuvrage[]>();
  @Output() readonly uniteMainChange = new EventEmitter<UniteMain>();
  @Output() readonly fraisGenerauxChange = new EventEmitter<number>();
  @Output() readonly beneficeChange = new EventEmitter<number>();
  @Output() readonly prixCalculated = new EventEmitter<number>();

  addComposant(): void {
    const next: ComposantOuvrage = {
      id: crypto.randomUUID(),
      ouvrageId: this._ouvrageId,
      type: 'MATERIAU',
      designation: 'Nouveau composant',
      unite: 'U',
      rendement: 1,
      prixUnitaire: 0,
      total: 0,
    };
    const list = [...this._composants(), next];
    this._composants.set(list);
    this.composantsChange.emit(list);
    this.prixCalculated.emit(this.prixUnitaireHt());
  }

  removeComposant(id: string): void {
    const list = this._composants().filter((c) => c.id !== id);
    this._composants.set(list);
    this.composantsChange.emit(list);
    this.prixCalculated.emit(this.prixUnitaireHt());
  }

  patchComposant(id: string, patch: Partial<ComposantOuvrage>): void {
    const list = [...this._composants()];
    const idx = list.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const merged: ComposantOuvrage = { ...list[idx], ...patch };
    merged.total = Math.round((merged.rendement || 0) * (merged.prixUnitaire || 0) * 100) / 100;
    list[idx] = merged;
    this._composants.set(list);
    this.composantsChange.emit(list);
    this.prixCalculated.emit(this.prixUnitaireHt());
  }

  patchUniteMain(patch: Partial<UniteMain>): void {
    const merged: UniteMain = { ...this._uniteMain(), ...patch };
    merged.total = Math.round((merged.heures || 0) * (merged.tauxHoraire || 0) * 100) / 100;
    this._uniteMain.set(merged);
    this.uniteMainChange.emit(merged);
    this.prixCalculated.emit(this.prixUnitaireHt());
  }

  setFg(value: number): void {
    this._fg.set(value);
    this.fraisGenerauxChange.emit(value);
    this.prixCalculated.emit(this.prixUnitaireHt());
  }

  setBenef(value: number): void {
    this._benef.set(value);
    this.beneficeChange.emit(value);
    this.prixCalculated.emit(this.prixUnitaireHt());
  }

  trackById(_: number, c: ComposantOuvrage): string {
    return c.id;
  }
}
