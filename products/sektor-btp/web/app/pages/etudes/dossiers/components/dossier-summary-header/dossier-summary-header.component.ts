import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';

import {
  ClientPartnerSelectComponent,
  type ClientPartnerSelection,
} from '@app/shared/components/client-partner-select/client-partner-select.component';

import type { DossierEtudeSynthese } from '../../services/dossier-etude-api.service';
import {
  DOSSIER_STATUT_VARIANTS,
  labelPhase,
  labelStatutDossier,
} from '../../utils/dossier-status.util';

@Component({
  selector: 'app-dossier-summary-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, MadCurrencyPipe, ClientPartnerSelectComponent],
  templateUrl: './dossier-summary-header.component.html',
  styleUrl: './dossier-summary-header.component.scss',
})
export class DossierSummaryHeaderComponent {
  readonly synthese = input.required<DossierEtudeSynthese>();
  readonly modifiable = input(false);
  readonly clientSaving = input(false);

  readonly action = output<string>();
  readonly clientChange = output<ClientPartnerSelection>();

  readonly statutLabel = computed(() => labelStatutDossier(this.synthese().status));
  readonly phaseLabel = computed(() => labelPhase(this.synthese().phase));
  readonly statutVariant = computed(
    () => DOSSIER_STATUT_VARIANTS[this.synthese().status] ?? 'default',
  );

  readonly clientMissing = computed(
    () => this.modifiable() && !this.synthese().clientId,
  );

  readonly ctaLabel = computed(() => {
    switch (this.synthese().actionPrincipale) {
      case 'SOUMETTRE_STRUCTURE':
        return 'Continuer vers le chiffrage';
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
      default:
        return '';
    }
  });

  readonly showCta = computed(() => !!this.ctaLabel());

  readonly showReouvrir = computed(() => {
    const s = this.synthese();
    return s.modifiable && s.structureVerrouillee && s.phase === 'CHIFFRAGE';
  });

  readonly showRefuser = computed(() => {
    const a = this.synthese().actionPrincipale;
    return a === 'VALIDER_N1' || a === 'VALIDER_N2';
  });

  readonly showCreerChantier = computed(() => {
    const s = this.synthese();
    return s.status === 'DEVIS_GENERE' && !!s.devisGenereId;
  });

  onClientSelection(sel: ClientPartnerSelection): void {
    this.clientChange.emit(sel);
  }

  emitAction(code?: string): void {
    const action = code ?? this.synthese().actionPrincipale;
    if (action) this.action.emit(action);
  }
}
