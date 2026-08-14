import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import type { ProblemeGate, ResultatGate } from '@app/etudes/models';

const PREVIEW_LIMIT = 8;

export type GatePresentation = 'soft' | 'hard' | 'ok' | 'hidden';

/**
 * Bannière des gates — soft (incomplet), hard (blocage), ok (prêt).
 * Rendu seul de `GET /dossiers/{id}/gates` (clés i18n `etudes.gate.*`).
 */
@Component({
  selector: 'app-gate-blocage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  templateUrl: './gate-blocage.component.html',
  styleUrl: './gate-blocage.component.scss',
})
export class GateBlocageComponent {
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

  readonly expandAll = signal(false);
  readonly softListeOuverte = signal(false);

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

  readonly resumeCount = computed(() => {
    const list = this.problemes();
    const postes = list.filter((p) => !!p.noeudId).length;
    if (this.mode() === 'soft') {
      if (postes === 0) return '';
      return `${postes} poste${postes > 1 ? 's' : ''} à chiffrer —`;
    }
    const n = list.length;
    if (this.bloquant()) {
      return `${n} point${n > 1 ? 's' : ''} empêchent de continuer —`;
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
      // Alerte qualité seule (ex. trop d’estimés) — pas « postes à chiffrer ».
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

  readonly showListe = computed(() => {
    if (this.mode() === 'hard') return true;
    if (this.mode() === 'soft') return this.softListeOuverte();
    return false;
  });

  readonly problemesVisibles = computed(() => {
    const list = this.problemes();
    if (this.expandAll() || list.length <= PREVIEW_LIMIT) return list;
    return list.slice(0, PREVIEW_LIMIT);
  });

  readonly resteCache = computed(() => Math.max(0, this.problemes().length - PREVIEW_LIMIT));

  readonly showPasserManuel = computed(
    () =>
      this.structureVerrouilleeAuto() && this.mode() === 'hard' && this.aDesProblemes(),
  );

  onCorriger(p: ProblemeGate): void {
    if (!p.noeudId) return;
    this.corriger.emit(p);
  }

  onPasserManuel(): void {
    this.passerManuel.emit();
  }

  onVerifier(): void {
    this.verifier.emit();
  }

  onFocusResume(): void {
    this.focusResume.emit();
    if (this.mode() === 'soft') {
      this.softListeOuverte.set(true);
    }
  }

  toggleSoftListe(): void {
    this.softListeOuverte.update((v) => !v);
  }

  toggleExpand(): void {
    this.expandAll.update((v) => !v);
  }
}
