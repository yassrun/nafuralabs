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

import { OuvrageApiService } from '@applications/erp/pages/etudes/bibliotheque-prix/services/ouvrage-api.service';
import type { DevisLigne } from '../../models';

interface OuvrageOption {
  id: string;
  code: string;
  designation: string;
  unite: string;
  prixUnitaireHt: number;
}

import { ButtonComponent } from '@lib/anatomy';
@Component({
  selector: 'app-dpgf-editor',
  standalone: true,
  imports: [
    ButtonComponent,CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dpgf-editor.component.html',
  styleUrl: './dpgf-editor.component.scss',
})
export class DpgfEditorComponent {
  private readonly ouvrageApi = inject(OuvrageApiService);

  private _lines = signal<DevisLigne[]>([]);
  private _readonly = false;
  private _devisId = '';

  readonly ouvrages = signal<OuvrageOption[]>([]);

  readonly displayLines = computed(() => this._lines());

  readonly totalHt = computed(() => {
    const total = this._lines()
      .filter((l) => l.type === 'OUVRAGE' && l.totalHt != null)
      .reduce((s, l) => s + (l.totalHt ?? 0), 0);
    return Math.round(total * 100) / 100;
  });

  readonly chapitreTotals = computed<Map<string, number>>(() => {
    const map = new Map<string, number>();
    const lines = this._lines();
    for (const l of lines) {
      if (l.type !== 'OUVRAGE' || l.totalHt == null || !l.parentLigneId) continue;
      let parentId: string | undefined = l.parentLigneId;
      const guard = new Set<string>();
      while (parentId && !guard.has(parentId)) {
        guard.add(parentId);
        const current = map.get(parentId) ?? 0;
        map.set(parentId, current + (l.totalHt ?? 0));
        const parent = lines.find((x) => x.id === parentId);
        parentId = parent?.parentLigneId;
      }
    }
    return map;
  });

  @Input() set lines(value: DevisLigne[] | null | undefined) {
    this._lines.set(Array.isArray(value) ? [...value] : []);
  }

  @Input() set readonly(value: boolean) {
    this._readonly = value;
  }
  get readonly(): boolean {
    return this._readonly;
  }

  @Input() set devisId(value: string) {
    this._devisId = value;
  }

  @Output() readonly linesChange = new EventEmitter<DevisLigne[]>();

  constructor() {
    void this.loadOuvrages();
  }

  private async loadOuvrages(): Promise<void> {
    try {
      const { items } = await this.ouvrageApi.getAll({ page: 0, pageSize: 500 });
      this.ouvrages.set(
        items
          .filter((o) => o.isActive !== false)
          .map((o) => ({
            id: o.id,
            code: o.code,
            designation: o.designation,
            unite: o.unite,
            prixUnitaireHt: o.prixUnitaireHt,
          })),
      );
    } catch {
      this.ouvrages.set([]);
    }
  }

  addChapitre(): void {
    const ordre = this._lines().length + 1;
    const next: DevisLigne = {
      id: crypto.randomUUID(),
      devisId: this._devisId,
      ordre,
      type: 'CHAPITRE',
      code: `LOT-${String(ordre).padStart(2, '0')}`,
      designation: 'Nouveau chapitre',
    };
    const updated = [...this._lines(), next];
    this._lines.set(updated);
    this.linesChange.emit(updated);
  }

  addOuvrage(parentId?: string): void {
    const ordre = this._lines().length + 1;
    const next: DevisLigne = {
      id: crypto.randomUUID(),
      devisId: this._devisId,
      parentLigneId: parentId,
      ordre,
      type: 'OUVRAGE',
      designation: 'Nouvel ouvrage',
      unite: 'U',
      quantite: 1,
      prixUnitaireHt: 0,
      totalHt: 0,
    };
    const updated = [...this._lines(), next];
    this._lines.set(updated);
    this.linesChange.emit(updated);
  }

  addTexte(parentId?: string): void {
    const ordre = this._lines().length + 1;
    const next: DevisLigne = {
      id: crypto.randomUUID(),
      devisId: this._devisId,
      parentLigneId: parentId,
      ordre,
      type: 'TEXTE',
      designation: 'Note technique',
    };
    const updated = [...this._lines(), next];
    this._lines.set(updated);
    this.linesChange.emit(updated);
  }

  removeLine(id: string): void {
    const collectChildren = (rootId: string, all: DevisLigne[]): Set<string> => {
      const ids = new Set<string>([rootId]);
      let added = true;
      while (added) {
        added = false;
        for (const l of all) {
          if (l.parentLigneId && ids.has(l.parentLigneId) && !ids.has(l.id)) {
            ids.add(l.id);
            added = true;
          }
        }
      }
      return ids;
    };
    const lines = this._lines();
    const toRemove = collectChildren(id, lines);
    const next = lines.filter((l) => !toRemove.has(l.id));
    this._lines.set(next);
    this.linesChange.emit(next);
  }

  patchLine(id: string, patch: Partial<DevisLigne>): void {
    const lines = [...this._lines()];
    const idx = lines.findIndex((l) => l.id === id);
    if (idx < 0) return;
    const merged: DevisLigne = { ...lines[idx], ...patch };
    if (merged.type === 'OUVRAGE') {
      const qty = merged.quantite ?? 0;
      const pu = merged.prixUnitaireHt ?? 0;
      const remise = (merged.remisePercent ?? 0) / 100;
      const ttl = qty * pu * (1 - remise);
      merged.totalHt = Math.round(ttl * 100) / 100;
    }
    lines[idx] = merged;
    this._lines.set(lines);
    this.linesChange.emit(lines);
  }

  onOuvrageSelect(id: string, ouvrageId: string): void {
    if (!ouvrageId) {
      this.patchLine(id, { ouvrageId: undefined });
      return;
    }
    const ouvrage = this.ouvrages().find((o) => o.id === ouvrageId);
    if (!ouvrage) return;
    this.patchLine(id, {
      ouvrageId: ouvrage.id,
      designation: ouvrage.designation,
      unite: ouvrage.unite,
      prixUnitaireHt: ouvrage.prixUnitaireHt,
    });
  }

  isInsideChapitre(line: DevisLigne): boolean {
    return !!line.parentLigneId;
  }

  chapitreTotal(id: string): number {
    return this.chapitreTotals().get(id) ?? 0;
  }

  trackById(_: number, line: DevisLigne): string {
    return line.id;
  }
}
