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
import { TranslateModule } from '@ngx-translate/core';

import type { ComposantDPU, ComposantOuvrage, DpuHistoriqueEntry, UniteMain } from '../../models';
import { DpuService } from '../../services/dpu.service';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';

import { ButtonComponent } from '@lib/anatomy';
@Component({
  selector: 'app-dpu-editor',
  standalone: true,
  imports: [
    ButtonComponent,CommonModule, FormsModule, TranslateModule, MadCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dpu-editor.component.html',
  styleUrl: './dpu-editor.component.scss',
})
export class DpuEditorComponent {
  private readonly dpuService = inject(DpuService);

  private _composants = signal<ComposantDPU[]>([]);
  readonly fgPct = signal(8);
  readonly margePct = signal(7);
  private _readonly = false;
  private _unite = signal('U');
  private _articleId = signal('');
  private _historique = signal<DpuHistoriqueEntry[]>([]);

  readonly types: { value: ComposantDPU['type']; labelKey: string }[] = [
    { value: 'MATIERE', labelKey: 'etudesDpu.typeMatiere' },
    { value: 'MAIN_DOEUVRE', labelKey: 'etudesDpu.typeMo' },
    { value: 'MATERIEL', labelKey: 'etudesDpu.typeMateriel' },
    { value: 'SOUS_TRAITANCE', labelKey: 'etudesDpu.typeSt' },
  ];

  readonly composants = computed(() => this._composants());
  readonly historiqueRows = computed(() => this._historique());

  readonly deboursSec = computed(() => this.dpuService.computeDeboursSec(this._composants()));
  readonly prixVenteHt = computed(() =>
    this.dpuService.computePrixVenteHt(this.deboursSec(), this.fgPct(), this.margePct()),
  );

  @Input() set composantsValue(v: ComposantDPU[] | null | undefined) {
    this._composants.set(Array.isArray(v) ? this.dpuService.recomputeTotals([...v]) : []);
  }

  @Input() set fraisGenerauxPercent(v: number | null | undefined) {
    if (typeof v === 'number') this.fgPct.set(v);
  }

  @Input() set margePercent(v: number | null | undefined) {
    if (typeof v === 'number') this.margePct.set(v);
  }

  @Input() set uniteArticle(v: string | null | undefined) {
    if (v) this._unite.set(v);
  }

  @Input() set articleId(v: string | null | undefined) {
    this._articleId.set(v ?? '');
  }

  @Input() set historiqueValue(v: DpuHistoriqueEntry[] | null | undefined) {
    this._historique.set(Array.isArray(v) ? [...v] : []);
  }

  @Input() set readonly(v: boolean) {
    this._readonly = v;
  }
  get readonly(): boolean {
    return this._readonly;
  }

  @Input() composantsOuvrage: ComposantOuvrage[] = [];
  @Input() uniteMainOuvrage: UniteMain = { heures: 0, tauxHoraire: 50, total: 0 };

  @Output() readonly composantsChange = new EventEmitter<ComposantDPU[]>();
  @Output() readonly fraisGenerauxChange = new EventEmitter<number>();
  @Output() readonly margeChange = new EventEmitter<number>();
  @Output() readonly applyPrixBiblio = new EventEmitter<number>();
  @Output() readonly historiqueChange = new EventEmitter<DpuHistoriqueEntry[]>();
  @Output() readonly importFromSousDetail = new EventEmitter<ComposantDPU[]>();

  importer(): void {
    const list = this.dpuService.importFromOuvrageDetail(
      this._articleId(),
      this.composantsOuvrage ?? [],
      this.uniteMainOuvrage ?? { heures: 0, tauxHoraire: 0, total: 0 },
    );
    this._composants.set(list);
    this.composantsChange.emit(list);
    this.applyPrixBiblio.emit(this.prixVenteHt());
    this.importFromSousDetail.emit(list);
  }

  addLigne(): void {
    const next: ComposantDPU = {
      id: crypto.randomUUID(),
      type: 'MATIERE',
      articleOuPosteId: '',
      quantite: 1,
      unite: this._unite(),
      prixUnitaire: 0,
      total: 0,
    };
    const list = this.dpuService.recomputeTotals([...this._composants(), next]);
    this._composants.set(list);
    this.composantsChange.emit(list);
  }

  duplicate(id: string): void {
    const row = this._composants().find((c) => c.id === id);
    if (!row) return;
    const clone: ComposantDPU = {
      ...row,
      id: crypto.randomUUID(),
    };
    const list = this.dpuService.recomputeTotals([...this._composants(), clone]);
    this._composants.set(list);
    this.composantsChange.emit(list);
  }

  remove(id: string): void {
    const list = this._composants().filter((c) => c.id !== id);
    this._composants.set(this.dpuService.recomputeTotals(list));
    this.composantsChange.emit(this._composants());
  }

  patch(id: string, patch: Partial<ComposantDPU>): void {
    const list = [...this._composants()];
    const i = list.findIndex((c) => c.id === id);
    if (i < 0) return;
    list[i] = { ...list[i], ...patch };
    const next = this.dpuService.recomputeTotals(list);
    this._composants.set(next);
    this.composantsChange.emit(next);
  }

  setFg(v: number): void {
    this.fgPct.set(v);
    this.fraisGenerauxChange.emit(v);
  }

  setMarge(v: number): void {
    this.margePct.set(v);
    this.margeChange.emit(v);
  }

  appliquerPrix(): void {
    this.applyPrixBiblio.emit(this.prixVenteHt());
  }

  snapshot(): void {
    const entry: DpuHistoriqueEntry = {
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
      composants: structuredClone(this._composants()),
      fraisGenerauxPercent: this.fgPct(),
      margePercent: this.margePct(),
      prixVenteHt: this.prixVenteHt(),
    };
    const next = [entry, ...this._historique()].slice(0, 25);
    this._historique.set(next);
    this.historiqueChange.emit(next);
  }

  trackById(_: number, c: ComposantDPU): string {
    return c.id;
  }
}
