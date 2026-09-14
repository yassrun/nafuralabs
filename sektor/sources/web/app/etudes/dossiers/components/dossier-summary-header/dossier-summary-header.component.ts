import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { ButtonComponent, StatusActionBarComponent } from '@platform/lib/anatomy';
import type { StatusChangeRecord } from '@platform/lib/anatomy';
import { MadCurrencyPipe } from '@platform/lib/anatomy/pipes/mad-currency.pipe';

import { chiffragePretATerminer } from '../../utils/dossier-etape.util';
import { exigeAvisExecution } from '../../utils/dossier-responsables.util';
import {
  DOSSIER_STATUS_BAR,
  DOSSIER_SUITE_ACTIONS,
  type DossierStatusContext,
} from '../../config/dossier-etude.workflow';

import { AuthFacade } from '@platform/core/security/services/auth.facade';
import type { DossierEtude } from '@app/etudes/models';
import {
  DossierEtudeApiService,
  type DossierEtudeSynthese,
} from '../../services/dossier-etude-api.service';
import { normalizeStatutDossier } from '../../utils/dossier-status.util';

@Component({
  selector: 'app-dossier-summary-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, MadCurrencyPipe, ButtonComponent, StatusActionBarComponent],
  templateUrl: './dossier-summary-header.component.html',
  styleUrl: './dossier-summary-header.component.scss',
  host: {
    '[class.dsh-host--compact]': 'etapeUi() === 2 || etapeUi() === 3',
  },
})
export class DossierSummaryHeaderComponent {
  private readonly api = inject(DossierEtudeApiService);
  private readonly auth = inject(AuthFacade);

  readonly synthese = input.required<DossierEtudeSynthese>();
  readonly dossier = input<DossierEtude | undefined>(undefined);
  readonly hasDpgf = input(false);
  readonly anomaliesEtape = input<number | undefined>(undefined);
  readonly etapeUi = input(1);
  readonly canShare = input(false);
  readonly peutDeciderGo = input(false);
  readonly peutAccepterAffectation = input(false);
  readonly peutSaisirApresGo = input(false);
  readonly peutRenvoyerAffectation = input(false);
  readonly chargeDejaDesigne = input(false);
  readonly peutAvisExecution = input(false);
  readonly peutValiderFinancier = input(false);
  readonly peutValiderDefinitif = input(false);
  readonly canSave = input(false);
  readonly saving = input(false);

  readonly action = output<string>();
  readonly focusAnomalies = output<void>();

  readonly workflow = DOSSIER_STATUS_BAR;

  readonly statut = computed(() => normalizeStatutDossier(this.synthese().status));

  readonly moaNom = computed(() => {
    const d = this.dossier();
    return (d?.clientNom ?? this.synthese().clientNom ?? '').trim();
  });

  readonly chargeNom = computed(() => {
    const d = this.dossier();
    return (
      d?.chargeEtudeNom
      ?? this.synthese().chargeEtudeNom
      ?? d?.chargeEtudeUserId
      ?? this.synthese().chargeEtudeUserId
      ?? ''
    ).trim();
  });

  readonly execNom = computed(() => {
    const d = this.dossier();
    return (
      d?.responsableExecutionNom
      ?? this.synthese().responsableExecutionNom
      ?? d?.responsableExecutionUserId
      ?? this.synthese().responsableExecutionUserId
      ?? ''
    ).trim();
  });

  readonly execDistinct = computed(() => {
    const a = (this.dossier()?.chargeEtudeUserId ?? this.synthese().chargeEtudeUserId ?? '')
      .trim()
      .toLowerCase();
    const b = (
      this.dossier()?.responsableExecutionUserId
      ?? this.synthese().responsableExecutionUserId
      ?? ''
    )
      .trim()
      .toLowerCase();
    return !!b && a !== b;
  });

  readonly delaiJours = computed(() => this.dossier()?.aoDelaiExecutionJours ?? null);

  readonly delaiLabel = computed(() => {
    const n = this.delaiJours();
    return n == null ? '—' : `${n} j`;
  });

  readonly anomaliesAffichees = computed(() => {
    const etape = this.anomaliesEtape();
    return etape !== undefined ? etape : this.synthese().anomaliesBloquantes;
  });

  readonly statusContext = computed((): DossierStatusContext => {
    const s = this.synthese();
    return {
      status: this.statut() || s.status,
      availableActions: s.availableActions ?? [],
      actionPrincipale: s.actionPrincipale,
      peutDeciderGo: this.peutDeciderGo(),
      peutAccepterAffectation: this.peutAccepterAffectation(),
      peutSaisirApresGo: this.peutSaisirApresGo(),
      peutRenvoyerAffectation: this.peutRenvoyerAffectation(),
      chargeDejaDesigne: this.chargeDejaDesigne(),
      peutAvisExecution: this.peutAvisExecution(),
      chiffragePret: chiffragePretATerminer(s),
      structureVerrouillee: s.structureVerrouillee,
      modifiable: s.modifiable,
      phase: s.phase,
      avisExecutionDossier: s.avisExecutionDossier,
      exigeAvis: exigeAvisExecution(this.dossier()),
      peutValiderFinancier: this.peutValiderFinancier(),
      peutValiderDefinitif: this.peutValiderDefinitif(),
    };
  });

  readonly suiteActions = computed(() =>
    DOSSIER_SUITE_ACTIONS.filter((action) => action.isVisible(this.statusContext())),
  );

  readonly statusHistory = signal<StatusChangeRecord[]>([]);
  readonly historyLoading = signal(false);

  emitAction(code: string): void {
    if (code) this.action.emit(code);
  }

  async loadHistory(): Promise<void> {
    const id = this.synthese().id;
    if (!id || this.historyLoading()) return;
    this.historyLoading.set(true);
    try {
      const [rows, ingenieurs] = await Promise.all([
        this.api.getStatusHistory(id),
        this.api.listIngenieurs().catch(() => []),
      ]);
      const names = this.actorNames(ingenieurs);
      this.statusHistory.set(rows.map((row) => ({ ...row, actor: this.labelActor(row.actor, names) })));
    } catch {
      this.statusHistory.set([]);
    } finally {
      this.historyLoading.set(false);
    }
  }

  private actorNames(ingenieurs: { userId: string; email: string; displayName: string }[]): Map<string, string> {
    const names = new Map<string, string>();
    const put = (key: string | null | undefined, label: string | null | undefined) => {
      const k = (key ?? '').trim().toLowerCase();
      const v = (label ?? '').trim();
      if (!k || !v || looksLikeUuid(v)) return;
      names.set(k, v);
    };
    for (const ing of ingenieurs) {
      put(ing.userId, ing.displayName || ing.email);
      put(ing.email, ing.displayName || ing.email);
    }
    const d = this.dossier();
    const s = this.synthese();
    put(d?.chargeEtudeUserId ?? s.chargeEtudeUserId, d?.chargeEtudeNom ?? s.chargeEtudeNom);
    put(d?.responsableExecutionUserId ?? s.responsableExecutionUserId, d?.responsableExecutionNom ?? s.responsableExecutionNom);
    const user = this.auth.user();
    if (user) {
      const me = this.auth.displayName().trim() || user.email;
      put(user.id, me);
      put(user.email, me);
    }
    return names;
  }

  private labelActor(actor: string, names: Map<string, string>): string {
    const raw = (actor ?? '').trim();
    if (!raw || raw.toLowerCase() === 'system') return 'Système';
    return names.get(raw.toLowerCase()) ?? raw;
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function looksLikeUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}
