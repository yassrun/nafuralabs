import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { BadgeComponent, ButtonComponent, DrawerComponent } from '@lib/anatomy/components';

import type { PlanningPhaseDetail } from '../../services/planning.facade';

@Component({
  selector: 'app-phase-drawer',
  standalone: true,
  imports: [CommonModule, DrawerComponent, BadgeComponent, ButtonComponent, TranslateModule],
  template: `
    <nf-drawer [open]="open()" [title]="'chantiers.planning.drawer.title' | translate" size="md" (closed)="closed.emit()">
      @if (detail(); as phaseDetail) {
        <div class="phase-drawer">
          <div class="phase-drawer__header">
            <div>
              <p class="phase-drawer__eyebrow">{{ phaseDetail.chantier.code }} - {{ phaseDetail.chantier.name }}</p>
              <h3>{{ phaseDetail.phase.code }} {{ phaseDetail.phase.designation }}</h3>
            </div>
            <nf-badge [variant]="badgeVariant()">{{ detail()!.phase.status }}</nf-badge>
          </div>

          <dl class="phase-drawer__grid">
            <div><dt>Lot</dt><dd>{{ phaseDetail.lot?.code ?? 'Hors lot' }} {{ phaseDetail.lot?.designation ?? '' }}</dd></div>
            <div><dt>{{ 'chantiers.planning.drawer.equipe' | translate }}</dt><dd>{{ phaseDetail.phase.equipeName || 'Non affectée' }}</dd></div>
            <div><dt>Responsable</dt><dd>{{ phaseDetail.phase.responsableName || 'Non renseigné' }}</dd></div>
            <div><dt>Avancement</dt><dd>{{ phaseDetail.phase.avancementPercent }}%</dd></div>
            <div><dt>{{ 'chantiers.planning.drawer.debut' | translate }}</dt><dd>{{ phaseDetail.phase.dateDebut }}</dd></div>
            <div><dt>Fin</dt><dd>{{ phaseDetail.phase.dateFin }}</dd></div>
            <div>
              <dt>{{ 'chantiers.planning.drawer.quantite' | translate }}</dt>
              <dd>
                @if (phaseDetail.phase.quantite) {
                  {{ phaseDetail.phase.quantite }} {{ phaseDetail.phase.unite || '' }}
                } @else {
                  Non renseignée
                }
              </dd>
            </div>
            <div><dt>{{ 'chantiers.planning.drawer.dependances' | translate }}</dt><dd>{{ phaseDetail.phase.dependances?.length ?? 0 }}</dd></div>
          </dl>

          <div class="phase-drawer__footer">
            <nf-button variant="secondary" icon="x" (clicked)="closed.emit()">Fermer</nf-button>
            <nf-button variant="primary" icon="external-link" (clicked)="openChantier.emit(phaseDetail.chantier.id)">Ouvrir fiche chantier</nf-button>
          </div>
        </div>
      }
    </nf-drawer>
  `,
  styles: [
    `
      .phase-drawer { display: grid; gap: 1.2rem; }
      .phase-drawer__header { display: flex; justify-content: space-between; gap: 1rem; }
      .phase-drawer__eyebrow { margin: 0 0 0.35rem; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--nf-text-secondary, var(--nf-color-text-secondary)); }
      .phase-drawer__header h3 { margin: 0; font-size: 1.15rem; }
      .phase-drawer__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin: 0; }
      .phase-drawer__grid div { padding: 0.9rem; border-radius: 0.95rem; background: var(--nf-color-bg-subtle); }
      .phase-drawer__grid dt { margin: 0 0 0.3rem; font-size: 0.78rem; font-weight: 600; text-transform: uppercase; color: var(--nf-color-text-secondary); }
      .phase-drawer__grid dd { margin: 0; font-size: 0.96rem; color: var(--nf-text-primary); }
      .phase-drawer__footer { display: flex; justify-content: flex-end; gap: 0.75rem; }
      @media (max-width: 640px) {
        .phase-drawer__grid { grid-template-columns: 1fr; }
        .phase-drawer__footer { flex-direction: column-reverse; }
      }
    `,
  ],
})
export class PhaseDrawerComponent {
  readonly open = input.required<boolean>();
  readonly detail = input<PlanningPhaseDetail | null>(null);

  readonly closed = output<void>();
  readonly openChantier = output<string>();

  readonly badgeVariant = computed(() => {
    const status = this.detail()?.phase.status;
    switch (status) {
      case 'TERMINE':
        return 'success';
      case 'EN_RETARD':
        return 'warning';
      case 'EN_COURS':
        return 'info';
      default:
        return 'default';
    }
  });
}