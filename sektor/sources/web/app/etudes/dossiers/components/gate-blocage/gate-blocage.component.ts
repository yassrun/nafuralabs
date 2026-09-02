import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import type { ProblemeGate, ResultatGate } from '@app/etudes/models';

import {
  EtudeBannerComponent,
  type EtudeBannerTone,
} from '../etude-banner/etude-banner.component';
import { openGateProblemesDialog } from './gate-problemes-dialog.component';

export type GatePresentation = 'soft' | 'hard' | 'ok' | 'hidden';

/**
 * Bannière des gates — soft (incomplet), hard (blocage), ok (prêt).
 * Une ligne à l’écran ; le détail des erreurs s’ouvre en popup.
 */
@Component({
  selector: 'app-gate-blocage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, EtudeBannerComponent],
  templateUrl: './gate-blocage.component.html',
  styleUrl: './gate-blocage.component.scss',
})
export class GateBlocageComponent {
  private readonly dialog = inject(MatDialog);

  readonly resultat = input.required<ResultatGate | undefined>();
  /** soft = résumé neutre ; hard = liste bloquante ; ok = prêt ; hidden = rien. */
  readonly presentation = input<GatePresentation>('hard');
  /** Mode Auto lecture seule — propose de passer en manuel pour corriger. */
  readonly structureVerrouilleeAuto = input(false);

  readonly corriger = output<ProblemeGate>();
  readonly passerManuel = output<void>();
  /** Soft → demande d’afficher le détail hard (ex. « Vérifier »). */
  readonly verifier = output<void>();
  /** Soft résumé cliqué → focus premier nœud. */
  readonly focusResume = output<void>();

  readonly problemes = computed(() => this.resultat()?.problemes ?? []);

  readonly aDesProblemes = computed(() => this.problemes().length > 0);

  readonly hasPosteIncomplet = computed(() => this.problemes().some((p) => !!p.noeudId));

  readonly mode = computed((): GatePresentation => {
    const forced = this.presentation();
    if (forced === 'ok' || forced === 'hidden' || forced === 'soft' || forced === 'hard') {
      return forced;
    }
    return 'hard';
  });

  readonly visible = computed(() => {
    const m = this.mode();
    if (m === 'hidden') return false;
    if (m === 'ok') return true;
    return this.aDesProblemes();
  });

  readonly bloquant = computed(() => this.mode() === 'hard');

  readonly bannerTone = computed((): EtudeBannerTone => {
    if (this.mode() === 'ok') return 'success';
    if (this.mode() === 'soft') return 'info';
    return 'error';
  });

  readonly resumeCount = computed(() => {
    const list = this.problemes();
    const postes = list.filter((p) => !!p.noeudId).length;
    if (this.mode() === 'soft') {
      if (postes === 0) return '';
      return `${postes} poste${postes > 1 ? 's' : ''} à chiffrer —`;
    }
    const n = list.length;
    if (this.bloquant()) {
      return n > 1
        ? `${n} points empêchent de continuer —`
        : '1 point empêchant de continuer —';
    }
    return `${n} point${n > 1 ? 's' : ''} à vérifier —`;
  });

  /** Message le plus fréquent (clé i18n), pour une ligne lisible. */
  readonly resumeMessage = computed(() => {
    if (this.mode() === 'ok') return 'etudes.gate.pret_synthese';
    const list = this.problemes();
    if (this.mode() === 'soft') {
      const hasPoste = list.some((p) => !!p.noeudId);
      if (hasPoste) return 'etudes.gate.incomplet_cout';
      return list[0]?.message ?? 'etudes.gate.incomplet_cout';
    }
    if (list.length === 0) return '';
    const counts = new Map<string, number>();
    for (const p of list) {
      const key = p.message ?? '';
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    let best = list[0]?.message ?? '';
    let bestN = 0;
    for (const [key, n] of counts) {
      if (n > bestN) {
        best = key;
        bestN = n;
      }
    }
    return best;
  });

  readonly showPasserManuel = computed(
    () =>
      this.structureVerrouilleeAuto() && this.mode() === 'hard' && this.aDesProblemes(),
  );

  openDetails(): void {
    void openGateProblemesDialog(this.dialog, this.problemes()).then((picked) => {
      if (picked?.noeudId || picked?.codeArticle) this.corriger.emit(picked);
    });
  }

  onPasserManuel(): void {
    this.passerManuel.emit();
  }

  onVerifier(): void {
    this.verifier.emit();
  }

  onFocusResume(): void {
    this.focusResume.emit();
  }
}
