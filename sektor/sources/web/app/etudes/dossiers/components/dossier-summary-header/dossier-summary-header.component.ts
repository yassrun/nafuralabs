import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { ActionBarComponent, ButtonComponent } from '@platform/lib/anatomy';
import { MadCurrencyPipe } from '@platform/lib/anatomy/pipes/mad-currency.pipe';

import { headerCtaSlot } from '../../utils/dossier-header-cta.util';

import type { DossierEtude } from '@app/etudes/models';
import type { DossierEtudeSynthese } from '../../services/dossier-etude-api.service';
import {
  DOSSIER_STATUT_VARIANTS,
  labelStatutDossier,
} from '../../utils/dossier-status.util';

@Component({
  selector: 'app-dossier-summary-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, MadCurrencyPipe, ButtonComponent, ActionBarComponent],
  templateUrl: './dossier-summary-header.component.html',
  styleUrl: './dossier-summary-header.component.scss',
  host: {
    '[class.dsh-host--compact]': 'etapeUi() === 2 || etapeUi() === 3',
  },
})
export class DossierSummaryHeaderComponent {
  readonly synthese = input.required<DossierEtudeSynthese>();
  /** Identité dossier (délai AO, MOA à jour après enregistrement). */
  readonly dossier = input<DossierEtude | undefined>(undefined);
  /** DPGF lié — conservé pour le retour des actions Imprimer. */
  readonly hasDpgf = input(false);
  /**
   * Anomalies de l’étape UI courante (prioritaire sur le total multi-gates backend).
   * `undefined` = fallback `synthese.anomaliesBloquantes`.
   */
  readonly anomaliesEtape = input<number | undefined>(undefined);
  /** Étape UI wizard (1–4) — évite « Soumettre » trop tôt dans le header. */
  readonly etapeUi = input(1);
  /** Lien invité : dès que le dossier existe (portail déjà branché). */
  readonly canShare = input(false);

  readonly action = output<string>();
  readonly focusAnomalies = output<void>();

  readonly statutLabel = computed(() => labelStatutDossier(this.synthese().status));
  readonly statutVariant = computed(
    () => DOSSIER_STATUT_VARIANTS[this.synthese().status] ?? 'default',
  );

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

  readonly delaiJours = computed(() => this.dossier()?.aoDelaiExecutionJours ?? null);

  readonly delaiLabel = computed(() => {
    const n = this.delaiJours();
    return n == null ? '—' : `${n} j`;
  });

  readonly anomaliesAffichees = computed(() => {
    const etape = this.anomaliesEtape();
    return etape !== undefined ? etape : this.synthese().anomaliesBloquantes;
  });

  /**
   * Action header effective : sur Docs/Bordereau/Coût, « Soumettre le chiffrage »
   * devient « Voir la synthèse » (parcours). Soumission réelle = étape 4.
   */
  readonly actionEffective = computed(() => {
    const a = this.synthese().actionPrincipale;
    if (a === 'SOUMETTRE_CHIFFRAGE' && this.etapeUi() < 4) {
      return 'VOIR_SYNTHESE';
    }
    return a;
  });

  readonly ctaLabel = computed(() => {
    switch (this.actionEffective()) {
      case 'SOUMETTRE_STRUCTURE':
        return 'Continuer vers le chiffrage';
      case 'VOIR_SYNTHESE':
        return 'Voir la synthèse';
      case 'SOUMETTRE_CHIFFRAGE':
        return 'Soumettre le chiffrage';
      case 'VALIDER_N1':
        return 'Valider N+1';
      case 'VALIDER_N2':
        return 'Valider N+2 et générer le devis';
      case 'GENERER_DEVIS':
        return 'Générer le devis';
      case 'VOIR_DEVIS':
        return 'Voir le devis';
      case 'CORRIGER_BORDEREAU':
        return 'Corriger le bordereau';
      case 'CORRIGER_CHIFFRAGE':
        return 'Corriger le chiffrage';
      case 'REOUVRIR_BORDEREAU':
        return 'Réouvrir le bordereau';
      case 'MARQUER_GAGNE':
        return 'Marquer gagné';
      case 'CONVERTIR':
        return 'Créer le chantier';
      case 'VOIR_CHANTIER':
        return 'Ouvrir le chantier';
      default:
        return '';
    }
  });

  readonly ctaSlot = computed(() => {
    if (!this.ctaLabel()) return 'hidden' as const;
    return headerCtaSlot(this.actionEffective());
  });

  readonly showCta = computed(() => this.ctaSlot() !== 'hidden');

  readonly showActionBar = computed(
    () =>
      this.showPartager() ||
      this.showReouvrir() ||
      this.showRefuser() ||
      this.showMarquerPerdu() ||
      this.showCta(),
  );

  readonly showReouvrir = computed(() => {
    const s = this.synthese();
    return s.modifiable && s.structureVerrouillee && s.phase === 'CHIFFRAGE';
  });

  readonly showRefuser = computed(() => {
    const a = this.synthese().actionPrincipale;
    return a === 'VALIDER_N1' || a === 'VALIDER_N2';
  });

  /** L13 — issue commerciale : perdu en secondaire quand devis généré. */
  readonly showMarquerPerdu = computed(() => this.synthese().status === 'DEVIS_GENERE');

  readonly showPartager = computed(() => true);

  emitAction(code?: string): void {
    const action = code ?? this.actionEffective() ?? this.synthese().actionPrincipale;
    if (action) this.action.emit(action);
  }
}
