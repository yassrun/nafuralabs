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
import { chiffragePretATerminer } from '../../utils/dossier-etape.util';

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
  /** DG / owner — go et no-go. */
  readonly peutDeciderGo = input(false);
  /** Chargé nommé uniquement — prendre en charge / rejeter l’affectation. */
  readonly peutAccepterAffectation = input(false);
  /** Chargé ou DG — saisir, suspendre, terminer après le go. */
  readonly peutSaisirApresGo = input(false);
  /** Assistant / owner — renvoyer au chargé déjà nommé (rejet ou draft). */
  readonly peutRenvoyerAffectation = input(false);
  /** Un chargé a déjà été nommé au go — pas besoin de repasser par le DG. */
  readonly chargeDejaDesigne = input(false);
  /** Responsable exécution ou DG — avis après chiffrage. */
  readonly peutAvisExecution = input(false);
  /** Cadrage éditable — Enregistrer dans la barre. */
  readonly canSave = input(false);
  readonly saving = input(false);

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

  readonly chiffragePret = computed(() => chiffragePretATerminer(this.synthese()));

  /** Action de statut (jamais une navigation d’étape). */
  readonly actionEffective = computed(() => {
    const status = this.synthese().status;
    if (status === 'BROUILLON') {
      return this.peutRenvoyerAffectation() && this.chargeDejaDesigne()
        ? 'RENVOYER_AFFECTATION'
        : 'SOUMETTRE_GO';
    }
    if (status === 'A_DECIDER') {
      return this.peutDeciderGo() ? 'DECIDER_GO' : '';
    }
    if (status === 'AFFECTE') {
      return this.peutAccepterAffectation() ? 'ACCEPTER_AFFECTATION' : '';
    }
    if (status === 'REJETE_CHIFFRAGE') {
      return this.peutRenvoyerAffectation() ? 'RENVOYER_AFFECTATION' : '';
    }
    if (status === 'EN_ETUDE') {
      return this.peutSaisirApresGo() && this.chiffragePret() ? 'SOUMETTRE_CHIFFRAGE' : '';
    }
    if (status === 'SUSPENDU') {
      return this.peutSaisirApresGo() ? 'REPRENDRE_CHIFFRAGE' : '';
    }
    if (status === 'A_AVIS_EXECUTION') {
      return this.peutAvisExecution() ? 'AVIS_EXECUTION_FAVORABLE' : '';
    }
    if (status === 'ANNULE') {
      return '';
    }
    return this.synthese().actionPrincipale;
  });

  readonly ctaLabel = computed(() => {
    switch (this.actionEffective()) {
      case 'DECIDER_GO':
        return 'Affecter';
      case 'RENVOYER_AFFECTATION':
        return 'Affecter';
      case 'SOUMETTRE_GO':
        return 'À affecter';
      case 'ACCEPTER_AFFECTATION':
        return 'Prendre en charge';
      case 'SOUMETTRE_CHIFFRAGE':
        return 'Chiffrage terminé';
      case 'AVIS_EXECUTION_FAVORABLE':
        return 'Avis favorable';
      case 'REPRENDRE_CHIFFRAGE':
        return 'Reprendre';
      case 'SOUMETTRE_STRUCTURE':
        return 'Continuer vers le chiffrage';
      case 'VOIR_SYNTHESE':
        return 'Voir la synthèse';
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

  readonly showEnregistrer = computed(() => this.canSave());

  readonly showActionBar = computed(
    () =>
      this.showPartager() ||
      this.showReouvrir() ||
      this.showRefuser() ||
      this.showNoGo() ||
      this.showSuspendre() ||
      this.showChiffrageTermine() ||
      this.showArchiver() ||
      this.showRefuserAffectation() ||
      this.showReinitialiser() ||
      this.showMarquerPerdu() ||
      this.showEnregistrer() ||
      this.showAvisRetour() ||
      this.showCta(),
  );

  readonly showNoGo = computed(
    () => this.synthese().status === 'A_DECIDER' && this.peutDeciderGo(),
  );

  readonly showSuspendre = computed(
    () => this.synthese().status === 'EN_ETUDE' && this.peutSaisirApresGo(),
  );

  /** Depuis Suspendu : terminer directement vers Chiffré. */
  readonly showChiffrageTermine = computed(
    () =>
      this.synthese().status === 'SUSPENDU' &&
      this.peutSaisirApresGo() &&
      this.chiffragePret(),
  );

  readonly showArchiver = computed(() => {
    const s = this.synthese().status;
    if (s === 'BROUILLON' || s === 'NE_PAS_ETUDIER' || s === 'REJETE_CHIFFRAGE') {
      return true;
    }
    return s === 'A_DECIDER' && this.peutDeciderGo();
  });

  readonly showRefuserAffectation = computed(
    () => this.synthese().status === 'AFFECTE' && this.peutAccepterAffectation(),
  );

  readonly showReinitialiser = computed(
    () => this.synthese().status === 'REJETE_CHIFFRAGE' && this.peutRenvoyerAffectation(),
  );

  readonly showAvisRetour = computed(
    () => this.synthese().status === 'A_AVIS_EXECUTION' && this.peutAvisExecution(),
  );

  readonly showReouvrir = computed(() => {
    const s = this.synthese();
    if (s.status === 'EN_ETUDE' || s.status === 'SUSPENDU') return false;
    return s.modifiable && s.structureVerrouillee && s.phase === 'CHIFFRAGE';
  });

  readonly showRefuser = computed(() => {
    const a = this.synthese().actionPrincipale;
    return a === 'VALIDER_N1' || a === 'VALIDER_N2';
  });

  /** L13 — issue commerciale : perdu en secondaire quand devis généré. */
  readonly showMarquerPerdu = computed(() => this.synthese().status === 'DEVIS_GENERE');

  readonly showPartager = computed(() => false);

  emitAction(code?: string): void {
    const action = code ?? this.actionEffective() ?? this.synthese().actionPrincipale;
    if (action) this.action.emit(action);
  }
}
