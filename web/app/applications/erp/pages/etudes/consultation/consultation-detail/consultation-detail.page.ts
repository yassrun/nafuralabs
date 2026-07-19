import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import {
  BadgeComponent,
  ButtonComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  PageShellComponent,
  ToastService,
  TreeTableComponent,
  WizardShellComponent,
  type NfTreeNode,
  type NfTreeTableColumn,
  type WizardStepConfig,
} from '@lib/anatomy';

import { ConsultationApiService } from '../services';
import type {
  Consultation,
  ConsultationComposant,
  ConsultationNoeud,
  NoeudCreate,
  NoeudType,
  NoeudUpdate,
  PosteMode,
} from '../models';
import { CONSULTATION_STATUS_LABELS as STATUS_LABELS } from '../models';
import {
  NoeudFormDialogComponent,
  type NoeudFormDialogData,
} from '../components/noeud-form-dialog/noeud-form-dialog.component';
import {
  ComposantFormDialogComponent,
  type ComposantFormDialogData,
} from '../components/composant-form-dialog/composant-form-dialog.component';

interface ConsultationRow {
  id: string;
  type: string;
  code: string;
  libelle: string;
  unite: string;
  quantite: string;
  mode: string;
  debours: string;
  fg: string;
  marge: string;
  puHt: string;
  montant: string;
  noeud: ConsultationNoeud;
}

@Component({
  selector: 'app-consultation-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    PageShellComponent,
    PageHeaderComponent,
    ButtonComponent,
    BadgeComponent,
    EmptyStateComponent,
    TreeTableComponent,
    WizardShellComponent,
  ],
  templateUrl: './consultation-detail.page.html',
  styleUrls: ['./consultation-detail.page.scss'],
})
export class ConsultationDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ConsultationApiService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  readonly consultation = signal<Consultation | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly expandedKeys = signal<Set<string>>(new Set());
  /** 0-based wizard index */
  readonly stepIndex = signal(0);

  readonly locked = computed(() => {
    const s = this.consultation()?.status;
    return s === 'EN_VALIDATION' || s === 'TERMINE' || s === 'VALIDEE' || s === 'ANNULEE' || s === 'CONVERTIE';
  });

  readonly headerConfig = computed(() => {
    const c = this.consultation();
    return {
      title: c ? `${c.numero} — ${c.objet}` : 'Consultation',
      subtitle: c ? STATUS_LABELS[c.status] ?? c.status : '',
      secondaryAction: { id: 'back', label: 'Retour', icon: 'arrow_back' },
    };
  });

  onHeaderAction(event: { type: 'primary' | 'secondary'; action: { id?: string } }): void {
    if (event.action?.id === 'back') this.back();
  }

  readonly wizardSteps: WizardStepConfig[] = [
    { id: 'bordereau', label: 'Bordereau', icon: 'list' },
    { id: 'decomposition', label: 'Décomposition', icon: 'account_tree' },
    { id: 'chiffrage', label: 'Chiffrage', icon: 'calculate' },
  ];

  readonly treeColumns: NfTreeTableColumn<ConsultationRow>[] = [
    { key: 'type', label: 'Type', width: '5.5rem' },
    { key: 'libelle', label: 'Désignation', width: '18rem' },
    { key: 'code', label: 'Code', width: '6rem' },
    { key: 'unite', label: 'Unité', width: '4.5rem' },
    { key: 'quantite', label: 'Qté', align: 'end', width: '5rem' },
    { key: 'mode', label: 'Mode', width: '8rem' },
  ];

  readonly pricingColumns: NfTreeTableColumn<ConsultationRow>[] = [
    { key: 'libelle', label: 'Poste', width: '16rem' },
    { key: 'code', label: 'Code', width: '5rem' },
    { key: 'quantite', label: 'Qté', align: 'end', width: '4.5rem' },
    { key: 'debours', label: 'Déboursé', align: 'end', width: '7rem' },
    { key: 'fg', label: 'FG %', align: 'end', width: '5.5rem' },
    { key: 'marge', label: 'Marge %', align: 'end', width: '6rem' },
    { key: 'puHt', label: 'PU HT', align: 'end', width: '7rem' },
    { key: 'montant', label: 'Montant HT', align: 'end', width: '8rem' },
  ];

  readonly treeNodes = computed(() => {
    const arbre = this.consultation()?.arbre ?? [];
    return this.toNodes(arbre);
  });

  readonly posteNodes = computed(() => {
    const rows: NfTreeNode<ConsultationRow>[] = [];
    const walk = (nodes: ConsultationNoeud[]) => {
      for (const n of nodes) {
        if (n.type === 'POSTE') {
          rows.push({ key: n.id, data: this.toRow(n), leaf: true });
        }
        if (n.enfants?.length) walk(n.enfants);
      }
    };
    walk(this.consultation()?.arbre ?? []);
    return rows;
  });

  readonly totals = computed(() => {
    let debours = 0;
    let montant = 0;
    for (const n of this.posteNodes()) {
      debours += n.data.noeud.deboursSec ?? 0;
      const q = n.data.noeud.quantite ?? 0;
      const pu = n.data.noeud.prixVenteHt ?? 0;
      montant += q * pu;
    }
    return { debours, montant };
  });

  readonly canProceed = computed(() => {
    if (this.locked() || this.busy()) return false;
    const step = this.stepIndex();
    const postes = this.posteNodes().map((n) => n.data.noeud);
    if (step === 0) return postes.length > 0;
    if (step === 1) {
      return postes.every(
        (p) =>
          p.mode === 'FOURNI' ||
          (p.mode === 'DECOMPOSE' && (p.composants?.length ?? 0) > 0),
      );
    }
    return postes.every((p) => p.fraisGenerauxPercent != null && p.margePercent != null);
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) void this.reload(id);
  }

  get consultationId(): string | null {
    return this.consultation()?.id ?? this.route.snapshot.paramMap.get('id');
  }

  async reload(id?: string): Promise<void> {
    const cid = id ?? this.consultationId;
    if (!cid) return;
    this.loading.set(true);
    try {
      const c = await this.api.getById(cid);
      this.consultation.set(c);
      const step = Math.max(1, Math.min(3, c.currentStep ?? 1));
      this.stepIndex.set(step - 1);
      this.expandAll(c.arbre ?? []);
    } catch {
      this.toast.error('Impossible de charger la consultation');
    } finally {
      this.loading.set(false);
    }
  }

  onExpandedKeysChange(keys: Set<string>): void {
    this.expandedKeys.set(keys);
  }

  async onBack(): Promise<void> {
    if (this.stepIndex() <= 0 || this.locked()) return;
    const next = this.stepIndex();
    await this.goStep(next); // 1-based of previous = current index
  }

  async onNext(): Promise<void> {
    if (!this.canProceed() || this.locked()) return;
    const target = this.stepIndex() + 2; // 1-based next step
    await this.goStep(target);
  }

  async onSubmit(): Promise<void> {
    const cid = this.consultationId;
    if (!cid || this.locked() || !this.canProceed()) return;
    this.busy.set(true);
    try {
      const c = await this.api.submitForValidation(cid);
      this.consultation.set(c);
      this.toast.success('Consultation soumise au N+1');
    } catch (e) {
      const msg = (e as { error?: { message?: string } })?.error?.message;
      this.toast.error(msg || 'Soumission impossible');
    } finally {
      this.busy.set(false);
    }
  }

  private async goStep(step1Based: number): Promise<void> {
    const cid = this.consultationId;
    if (!cid) return;
    this.busy.set(true);
    try {
      const c = await this.api.setStep(cid, step1Based);
      this.consultation.set(c);
      this.stepIndex.set((c.currentStep ?? step1Based) - 1);
    } catch (e) {
      const msg = (e as { error?: { message?: string } })?.error?.message;
      this.toast.error(msg || 'Impossible de changer d’étape');
    } finally {
      this.busy.set(false);
    }
  }

  async addRootLot(): Promise<void> {
    await this.openNoeudForm('add', 'LOT', null);
  }

  async addChild(parent: ConsultationNoeud, type: NoeudType): Promise<void> {
    await this.openNoeudForm('add', type, parent.id);
  }

  async editNoeud(noeud: ConsultationNoeud): Promise<void> {
    await this.openNoeudForm('edit', noeud.type, noeud.parentId ?? null, noeud);
  }

  async deleteNoeud(noeud: ConsultationNoeud): Promise<void> {
    if (this.locked()) return;
    try {
      await this.api.deleteNoeud(noeud.id);
      this.toast.success('Élément supprimé');
      await this.reload();
    } catch {
      this.toast.error('Suppression impossible');
    }
  }

  async setMode(noeud: ConsultationNoeud, mode: PosteMode): Promise<void> {
    if (this.locked()) return;
    try {
      await this.api.setMode(noeud.id, mode);
      await this.reload();
    } catch {
      this.toast.error('Échec du changement de mode');
    }
  }

  async addComposant(noeud: ConsultationNoeud): Promise<void> {
    if (this.locked()) return;
    const ref = this.dialog.open(ComposantFormDialogComponent, {
      data: { mode: 'add' } as ComposantFormDialogData,
      autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (!result) return;
    try {
      await this.api.addComposant(noeud.id, result);
      await this.reload();
    } catch {
      this.toast.error("Échec de l'ajout du composant");
    }
  }

  async editComposant(c: ConsultationComposant): Promise<void> {
    if (this.locked()) return;
    const ref = this.dialog.open(ComposantFormDialogComponent, {
      data: { mode: 'edit', composant: c } as ComposantFormDialogData,
      autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (!result) return;
    try {
      await this.api.updateComposant(c.id, result);
      await this.reload();
    } catch {
      this.toast.error('Échec de la modification');
    }
  }

  async deleteComposant(c: ConsultationComposant): Promise<void> {
    if (this.locked()) return;
    try {
      await this.api.deleteComposant(c.id);
      await this.reload();
    } catch {
      this.toast.error('Échec de la suppression');
    }
  }

  async savePricing(noeud: ConsultationNoeud, fg: string, marge: string): Promise<void> {
    if (this.locked()) return;
    try {
      await this.api.updatePricing(noeud.id, {
        fraisGenerauxPercent: fg !== '' ? Number(fg) : undefined,
        margePercent: marge !== '' ? Number(marge) : undefined,
      });
      await this.reload();
    } catch {
      this.toast.error('Échec du chiffrage');
    }
  }

  back(): void {
    void this.router.navigate(['/etudes/consultation']);
  }

  showDetailFor = (row: ConsultationRow): boolean =>
    row.noeud.type === 'POSTE' && this.stepIndex() === 1;

  private async openNoeudForm(
    mode: 'add' | 'edit',
    type: NoeudType,
    parentId: string | null,
    noeud?: ConsultationNoeud,
  ): Promise<void> {
    if (this.locked()) return;
    const cid = this.consultationId;
    if (!cid) return;
    const ref = this.dialog.open(NoeudFormDialogComponent, {
      data: { mode, type, parentId, noeud } as NoeudFormDialogData,
      autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (!result) return;
    try {
      if (mode === 'add') {
        await this.api.createNoeud(cid, result as NoeudCreate);
      } else if (noeud) {
        await this.api.updateNoeud(noeud.id, result as NoeudUpdate);
      }
      await this.reload();
    } catch {
      this.toast.error('Enregistrement impossible');
    }
  }

  private expandAll(nodes: ConsultationNoeud[]): void {
    const keys = new Set<string>();
    const walk = (list: ConsultationNoeud[]) => {
      for (const n of list) {
        if (n.enfants?.length) {
          keys.add(n.id);
          walk(n.enfants);
        }
      }
    };
    walk(nodes);
    this.expandedKeys.set(keys);
  }

  private toNodes(nodes: ConsultationNoeud[]): NfTreeNode<ConsultationRow>[] {
    return nodes.map((n) => ({
      key: n.id,
      data: this.toRow(n),
      children: n.enfants?.length ? this.toNodes(n.enfants) : undefined,
      leaf: !n.enfants?.length,
    }));
  }

  private toRow(n: ConsultationNoeud): ConsultationRow {
    const q = n.quantite ?? 0;
    const pu = n.prixVenteHt ?? 0;
    return {
      id: n.id,
      type: n.type,
      code: n.code ?? '',
      libelle: n.libelle,
      unite: n.unite ?? '',
      quantite: n.quantite != null ? String(n.quantite) : '',
      mode: n.mode ?? '',
      debours: n.deboursSec != null ? n.deboursSec.toFixed(2) : '—',
      fg: n.fraisGenerauxPercent != null ? String(n.fraisGenerauxPercent) : '',
      marge: n.margePercent != null ? String(n.margePercent) : '',
      puHt: n.prixVenteHt != null ? n.prixVenteHt.toFixed(2) : '—',
      montant: n.type === 'POSTE' ? (q * pu).toFixed(2) : '',
      noeud: n,
    };
  }
}
