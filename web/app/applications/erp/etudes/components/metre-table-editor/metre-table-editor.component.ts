import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { MetreLigne, Ouvrage } from '../../models';
import { OuvrageApiService } from '@applications/erp/pages/etudes/bibliotheque-prix/services/ouvrage-api.service';

interface OuvrageOption {
  id: string;
  code: string;
  designation: string;
  unite: string;
}

/**
 * Évalue une formule métré simple : autorise uniquement chiffres,
 * + - * / ( ) . , et espaces. Renvoie 0 si la formule est invalide.
 */
function safeEval(formula: string): number {
  if (!formula) return 0;
  const cleaned = formula.replace(/,/g, '.').trim();
  if (!/^[\d+\-*/().\s]+$/.test(cleaned)) return 0;
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${cleaned});`)();
    return Number.isFinite(result) ? Math.round(result * 1000) / 1000 : 0;
  } catch {
    return 0;
  }
}

import { ButtonComponent } from '@lib/anatomy';
@Component({
  selector: 'app-metre-table-editor',
  standalone: true,
  imports: [
    ButtonComponent,CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './metre-table-editor.component.html',
  styleUrl: './metre-table-editor.component.scss',
})
export class MetreTableEditorComponent {
  private readonly ouvrageApi = inject(OuvrageApiService);

  private _lines = signal<MetreLigne[]>([]);
  private _readonly = false;
  private _metreId = '';
  readonly ouvrages = signal<OuvrageOption[]>([]);

  readonly totalQty = computed(() => {
    const total = this._lines().reduce((s, l) => s + (l.quantiteCalculee || 0), 0);
    return Math.round(total * 1000) / 1000;
  });

  readonly displayLines = computed(() => this._lines());

  @Input() set lines(value: MetreLigne[] | null | undefined) {
    this._lines.set(Array.isArray(value) ? [...value] : []);
  }

  @Input() set readonly(value: boolean) {
    this._readonly = value;
  }
  get readonly(): boolean {
    return this._readonly;
  }

  @Input() set metreId(value: string) {
    this._metreId = value;
  }

  @Output() readonly linesChange = new EventEmitter<MetreLigne[]>();

  constructor() {
    void this.loadOuvrages();
  }

  private async loadOuvrages(): Promise<void> {
    const res = await this.ouvrageApi.getAll({ isActive: true, pageSize: 500 });
    this.ouvrages.set(
      res.items
        .filter((o: Ouvrage) => o.isActive)
        .map((o: Ouvrage) => ({
          id: o.id,
          code: o.code,
          designation: o.designation,
          unite: o.unite,
        })),
    );
  }

  addLine(): void {
    const id = crypto.randomUUID();
    const next: MetreLigne = {
      id,
      metreId: this._metreId,
      designationLibre: '',
      unite: 'm³',
      nombre: 1,
      quantiteCalculee: 1,
    };
    const updated = [...this._lines(), next];
    this._lines.set(updated);
    this.linesChange.emit(updated);
  }

  removeLine(index: number): void {
    const next = this._lines().filter((_, i) => i !== index);
    this._lines.set(next);
    this.linesChange.emit(next);
  }

  importDemo(): void {
    const demo: MetreLigne[] = [
      {
        id: crypto.randomUUID(),
        metreId: this._metreId,
        designationLibre: 'Semelle isolée importée',
        unite: 'm³',
        longueur: 2.5,
        largeur: 2.5,
        hauteur: 0.5,
        nombre: 8,
        formule: 'L*l*h*N',
        quantiteCalculee: 25,
      },
      {
        id: crypto.randomUUID(),
        metreId: this._metreId,
        designationLibre: 'Dalle RDC importée',
        unite: 'm²',
        longueur: 12,
        largeur: 8,
        formule: 'L*l',
        quantiteCalculee: 96,
      },
    ];
    const updated = [...this._lines(), ...demo];
    this._lines.set(updated);
    this.linesChange.emit(updated);
  }

  patchLine(index: number, patch: Partial<MetreLigne>): void {
    const list = [...this._lines()];
    const current = list[index];
    if (!current) return;
    const merged: MetreLigne = { ...current, ...patch };
    merged.quantiteCalculee = this.computeQty(merged);
    list[index] = merged;
    this._lines.set(list);
    this.linesChange.emit(list);
  }

  onOuvrageChange(index: number, ouvrageId: string): void {
    const ouvrage = this.ouvrages().find((o) => o.id === ouvrageId);
    if (!ouvrage) {
      this.patchLine(index, { ouvrageId: undefined, ouvrageCode: undefined });
      return;
    }
    this.patchLine(index, {
      ouvrageId: ouvrage.id,
      ouvrageCode: ouvrage.code,
      unite: ouvrage.unite,
      designationLibre: this._lines()[index]?.designationLibre || ouvrage.designation,
    });
  }

  private computeQty(line: MetreLigne): number {
    if (line.formule && line.formule.trim().length > 0) {
      const subst = line.formule
        .replace(/L/gi, String(line.longueur ?? 1))
        .replace(/l/g, String(line.largeur ?? 1))
        .replace(/h/gi, String(line.hauteur ?? 1))
        .replace(/N/gi, String(line.nombre ?? 1));
      const value = safeEval(subst);
      if (value > 0) return value;
    }
    const L = line.longueur ?? 1;
    const l = line.largeur ?? 1;
    const h = line.hauteur ?? 1;
    const N = line.nombre ?? 1;
    return Math.round(L * l * h * N * 1000) / 1000;
  }

  trackById(_: number, line: MetreLigne): string {
    return line.id;
  }
}
