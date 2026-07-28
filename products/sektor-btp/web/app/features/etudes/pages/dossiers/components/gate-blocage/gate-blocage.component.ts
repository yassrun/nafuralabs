import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import type { ProblemeGate, ResultatGate } from '@app/features/etudes/models';

/**
 * Bannière compacte des gates — une seule ligne (total + message),
 * pour ne pas masquer l’arbre / le workspace.
 *
 * Le composant n'évalue aucune règle : il rend ce que `GET /dossiers/{id}/gates` a renvoyé.
 * Les `message` sont des clés i18n (`etudes.gate.*`) résolues côté front.
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

  /** Conservé pour compatibilité parent — la bannière n’émet plus ligne par ligne. */
  readonly corriger = output<ProblemeGate>();

  readonly problemes = computed(() => this.resultat()?.problemes ?? []);

  readonly aDesProblemes = computed(() => this.problemes().length > 0);

  /** Bloquant ou simple avertissement — seule l'étape consultation (4) est non bloquante. */
  readonly bloquant = computed(() => this.resultat()?.bloquant === true);

  readonly resumeCount = computed(() => {
    const n = this.problemes().length;
    if (this.bloquant()) {
      return `${n} point${n > 1 ? 's' : ''} empêchent de continuer —`;
    }
    return `${n} point${n > 1 ? 's' : ''} à vérifier —`;
  });

  /** Message le plus fréquent (clé i18n), pour une ligne lisible. */
  readonly resumeMessage = computed(() => {
    const list = this.problemes();
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
}
