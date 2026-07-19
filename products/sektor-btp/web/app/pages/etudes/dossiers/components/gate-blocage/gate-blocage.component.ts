import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import type { ProblemeGate, ResultatGate } from '@app/etudes/models';

/**
 * Ce qui empêche de franchir une étape, article par article.
 *
 * Remplace le `canProceed()` du module supprimé, qui grisait « Suivant » sans rien dire alors
 * que le back produisait de bons messages jamais affichés. Ici chaque ligne est cliquable et
 * mène à l'article fautif.
 *
 * Le composant n'évalue aucune règle : il rend ce que `GET /dossiers/{id}/gates` a renvoyé.
 */
@Component({
  selector: 'app-gate-blocage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gate-blocage.component.html',
  styleUrl: './gate-blocage.component.scss',
})
export class GateBlocageComponent {
  readonly resultat = input.required<ResultatGate | undefined>();

  /** Demande d'ouvrir l'article fautif en édition. */
  readonly corriger = output<ProblemeGate>();

  readonly problemes = computed(() => this.resultat()?.problemes ?? []);

  readonly aDesProblemes = computed(() => this.problemes().length > 0);

  /** Bloquant ou simple avertissement — les étapes 2 et 4 n'empêchent pas de continuer. */
  readonly bloquant = computed(() => this.resultat()?.bloquant === true);

  readonly titre = computed(() => {
    const n = this.problemes().length;
    const articles = `${n} article${n > 1 ? 's' : ''}`;
    return this.bloquant()
      ? `${articles} ${n > 1 ? 'empêchent' : 'empêche'} de continuer`
      : `${articles} à vérifier — vous pouvez continuer`;
  });
}
