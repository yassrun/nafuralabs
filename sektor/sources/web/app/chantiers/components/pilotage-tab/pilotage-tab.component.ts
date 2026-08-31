import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonComponent, EmptyStateComponent } from '@platform/lib/anatomy/components';

import { CockpitApiService } from '../../services/cockpit-api.service';
import { ChantierApiService } from '../../services/chantier-api.service';
import type {
  CockpitAlerte,
  CockpitChantier,
  CockpitMontant,
  CockpitNextAction,
  CockpitPreparation,
} from '../../services/cockpit.model';
import { cockpitNavShortcuts, isCockpitAppRoute, resolveAlertRoute, resolveCockpitRoute, resolvePreparationRoute } from './cockpit-routes';

/**
 * Cockpit chantier (SEKTOR-197) — surface de décision qui consomme strictement le read model
 * serveur (AC-10) : ni marge, ni retard, ni permission recalculés ici. L'ordre des alertes et
 * des prochaines actions vient du backend ; le composant ne fait que l'afficher.
 */
@Component({
  selector: 'app-pilotage-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ButtonComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (identityError()) {
      <nf-empty-state
        icon="error"
        [title]="'chantiers.cockpit.erreurIdentite' | translate"
        [message]="identityError()!"
        [actionLabel]="'chantiers.common.actions.retry' | translate"
        (action)="recharger()" />
    } @else if (loading()) {
      <div class="cockpit__skeleton" aria-label="Chargement">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
      </div>
    } @else if (cockpit(); as c) {
      <!-- KPI — AC-3 : au plus cinq décisions, chacune avec source -->
      <section class="kpis" aria-label="Indicateurs clés">
        <article class="kpi">
          <span class="kpi__label">{{ 'chantiers.cockpit.kpi.venteActive' | translate }}</span>
          <strong class="kpi__value">{{ afficheMontant(c.finance?.montantVenteActifHt) }}</strong>
          @if (c.finance?.montantVenteActifHt?.source) {
            <span class="kpi__src">{{ c.finance!.montantVenteActifHt!.source }}</span>
          }
        </article>
        <article class="kpi">
          <span class="kpi__label">{{ 'chantiers.cockpit.kpi.budgetRevise' | translate }}</span>
          <strong class="kpi__value">{{ afficheMontant(c.finance?.budgetReviseHt) }}</strong>
        </article>
        <article class="kpi">
          <span class="kpi__label">{{ 'chantiers.cockpit.kpi.margeProjetee' | translate }}</span>
          <strong class="kpi__value">{{ afficheMarge(c.finance?.margeProjeteeHt, c.finance?.margeProjeteePct) }}</strong>
        </article>
        <article class="kpi">
          <span class="kpi__label">{{ 'chantiers.cockpit.kpi.avancement' | translate }}</span>
          <strong class="kpi__value">{{ afficheMontant(c.progress?.avancementPercent) }}</strong>
        </article>
        <article class="kpi">
          <span class="kpi__label">{{ 'chantiers.cockpit.kpi.echeance' | translate }}</span>
          <strong class="kpi__value">{{ afficheEcheance(c) }}</strong>
        </article>
      </section>

      @if (c.identity?.status === 'SUSPENDU') {
        <div class="bandeau bandeau--suspendu" role="alert">
          {{ 'chantiers.cockpit.suspendu' | translate }}
        </div>
      }

      <div class="cockpit__grid">
        <!-- À FAIRE MAINTENANT + alertes — AC-10/AC-11 -->
        <section class="panel panel--actions">
          <h3>{{ 'chantiers.cockpit.aFaire' | translate }}</h3>
          @if (chantierPretDemarrage()) {
            <!-- AC-6 — le démarrage passe uniquement par l'OS (référence + date d'effet). -->
            <form class="os-form" (ngSubmit)="demarrerOs()">
              <label for="os-ref">{{ 'chantiers.cockpit.os.reference' | translate }}</label>
              <input id="os-ref" name="osRef" [(ngModel)]="osReference" required
                [placeholder]="'chantiers.cockpit.os.referencePh' | translate" />
              <label for="os-date">{{ 'chantiers.cockpit.os.dateEffet' | translate }}</label>
              <input id="os-date" name="osDate" type="date" [(ngModel)]="osDateEffet" required />
              <nf-button type="submit" variant="primary" [disabled]="osSubmitting()">
                {{ 'chantiers.cockpit.os.enregistrerEtDemarrer' | translate }}
              </nf-button>
              @if (osErreur()) {
                <p class="os-erreur">{{ osErreur()! }}</p>
              }
            </form>
          } @else if (actionPrimaire(); as a) {
            <button type="button" class="action-primaire" (click)="executerAction(a)">
              {{ a.libelle | translate }}
            </button>
            @if (actionsSecondaires().length) {
              <div class="actions-secondaires">
                @for (s of actionsSecondaires(); track s.libelle) {
                  <button type="button" class="action-secondaire" (click)="executerAction(s)">
                    {{ s.libelle | translate }}
                  </button>
                }
              </div>
            }
          } @else {
            <p class="muted">{{ 'chantiers.cockpit.aucuneAction' | translate }}</p>
          }
          @if (alerts().length) {
            <ul class="alertes" aria-label="Alertes">
              @for (a of alerts(); track a.code) {
                <li class="alerte alerte--{{ severiteCss(a.severite) }}">
                  <span class="alerte__dot" aria-hidden="true"></span>
                  <span class="alerte__msg">{{ a.message | translate }}</span>
                  @if (alerteActionnable(a)) {
                    <button type="button" class="alerte__action" (click)="ouvrirAlerte(a)">
                      {{ alerteActionLabel(a) | translate }}
                    </button>
                  }
                </li>
              }
            </ul>
          }
        </section>

        <!-- Préparation — AC-5/AC-7 -->
        @if (preparation().length) {
          <section class="panel panel--preparation">
            <h3>{{ 'chantiers.cockpit.preparation.titre' | translate }}
              @if (preparationResume(); as resume) {
                <span class="prep-count">
                  {{ resume.prerequisOk }}/{{ resume.prerequisTotal }}
                  {{ 'chantiers.cockpit.preparation.prerequis' | translate }}
                </span>
                @for (code of resume.recommandationsEnAttente; track code) {
                  <span class="prep-reco">{{ recoLabel(code) | translate }}</span>
                }
              }
            </h3>
            <ul class="checklist">
              @for (p of preparation(); track p.code) {
                <li class="check-item check-item--{{ prepCss(p.etat) }}"
                    [class.check-item--recommande]="p.categorie === 'RECOMMANDE'">
                  <span class="check-icon" aria-hidden="true">{{ prepIcon(p.etat) }}</span>
                  <span class="check-label">{{ p.libelle | translate }}</span>
                  @if (p.categorie === 'RECOMMANDE') {
                    <span class="check-badge">{{ 'chantiers.cockpit.preparation.badgeRecommande' | translate }}</span>
                  }
                  @if (preparationActionnable(p)) {
                    <button type="button" class="check-action" (click)="ouvrirPreparation(p)">
                      {{ p.action | translate }}
                    </button>
                  }
                </li>
              }
            </ul>
          </section>
        }

        <!-- Flux du mois — AC-15 -->
        <section class="panel panel--flux">
          <h3>{{ 'chantiers.cockpit.flux.titre' | translate }} <span class="muted">{{ c.progress?.fluxMois?.periode }}</span></h3>
          <p class="flux-step">{{ 'chantiers.cockpit.flux.etape' | translate }} : {{ fluxEtape(c) | translate }}</p>
          @if (c.progress?.fluxMois?.actionnable && isCockpitAppRoute(c.progress?.fluxMois?.premiereAction)) {
            <nf-button variant="primary" size="sm" (clicked)="ouvrirRoute(c.progress!.fluxMois!.premiereAction!)">
              {{ 'chantiers.cockpit.flux.action' | translate }}
            </nf-button>
          }
        </section>
      </div>

      <!-- Navigation stable — AC raccourcis : toujours visible, pas filtrée par nextActions -->
      <nav class="cockpit__nav" [attr.aria-label]="'chantiers.cockpit.nav.titre' | translate">
        <h3>{{ 'chantiers.cockpit.nav.titre' | translate }}</h3>
        <div class="nav-chips">
          @for (m of shortcuts(); track m.route) {
            <button type="button" class="nav-chip" (click)="ouvrirRoute(m.route)">
              <span class="nav-chip__title">{{ m.titre | translate }}</span>
              <span class="nav-chip__hint">{{ m.resume | translate }}</span>
            </button>
          }
        </div>
      </nav>

      <!-- Activité récente — AC-9 -->
      @if (c.activityFeed?.length) {
        <section class="panel panel--activite">
          <h3>{{ 'chantiers.cockpit.activite.titre' | translate }}</h3>
          <ul class="feed">
            @for (f of c.activityFeed; track $index) {
              <li class="feed-item">
                <span class="feed-date">{{ f.date | date:'dd/MM HH:mm' }}</span>
                <span class="feed-auteur">{{ f.auteur }}</span>
                <span class="feed-contenu">{{ f.contenu }}</span>
              </li>
            }
          </ul>
        </section>
      }
    }
  `,
  styles: [`
    :host { display: block; }
    .cockpit__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
    @media (max-width: 860px) { .cockpit__grid { grid-template-columns: 1fr; } }

    .kpis { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0.75rem; }
    @media (max-width: 960px) { .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    /* AC-21 — 390 px : KPI en pile, aucune troncature, cibles tactiles ≥ 44 px. */
    @media (max-width: 480px) {
      .kpis { grid-template-columns: 1fr; }
      .kpi { padding: 0.6rem 0.85rem; }
      .action-primaire, .action-secondaire, .check-action, .alerte__action, .os-form nf-button { min-height: 44px; }
    }
    .kpi { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-left: 3px solid var(--nf-color-primary-500); border-radius: 0.75rem; padding: 0.75rem 1rem; }
    .kpi__label { display: block; font-size: 0.72rem; color: var(--nf-color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .kpi__value { display: block; margin-top: 0.3rem; font-size: 1.05rem; font-weight: 700; }
    .kpi__src { font-size: 0.7rem; color: var(--nf-color-text-muted); }

    .bandeau { border-radius: 0.6rem; padding: 0.7rem 1rem; margin-top: 1rem; font-weight: 600; }
    .bandeau--suspendu { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }

    .panel { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; padding: 1rem 1.25rem; margin-top: 1rem; }
    .panel h3 { margin: 0 0 0.75rem; font-size: 0.85rem; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .muted { color: var(--nf-color-text-secondary); font-size: 0.9rem; }

    .action-primaire { width: 100%; padding: 0.85rem 1rem; border: none; border-radius: 0.6rem; background: var(--nf-color-primary-600); color: #fff; font-weight: 600; font-size: 0.95rem; cursor: pointer; }
    .action-primaire:hover { background: var(--nf-color-primary-700); }
    .actions-secondaires { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.6rem; }
    .action-secondaire {
      padding: 0.45rem 0.7rem; border: 1px solid var(--nf-color-border); border-radius: 0.5rem;
      background: var(--nf-color-surface); font-size: 0.82rem; cursor: pointer;
    }
    .action-secondaire:hover { background: var(--nf-color-bg-subtle); }
    @media (max-width: 480px) {
      .action-secondaire { min-height: 44px; }
    }

    .os-form { display: flex; flex-direction: column; gap: 0.5rem; }
    .os-form label { font-size: 0.8rem; color: var(--nf-color-text-secondary); }
    .os-form input { padding: 0.5rem 0.7rem; border: 1px solid var(--nf-color-border); border-radius: 0.5rem; font-size: 0.9rem; }
    .os-erreur { margin: 0; color: var(--nf-color-danger-600); font-size: 0.82rem; }

    .alertes { list-style: none; margin: 0.75rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .alerte { display: flex; align-items: center; gap: 0.5rem; border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.85rem; }
    .alerte--CRITICAL { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .alerte--WARNING { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .alerte--INFO { background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); }
    .alerte__dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
    .alerte__action { margin-left: auto; background: none; border: none; color: inherit; font-weight: 600; cursor: pointer; text-decoration: underline; }

    .prep-count { font-size: 0.75rem; color: var(--nf-color-text-muted); margin-left: 0.5rem; }
    .prep-reco {
      font-size: 0.72rem; font-weight: 600; color: var(--nf-color-warning-700);
      background: var(--nf-color-warning-100); border-radius: 999px; padding: 0.15rem 0.55rem;
      margin-left: 0.35rem;
    }
    .checklist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }
    .check-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; flex-wrap: wrap; }
    .check-item--recommande { color: var(--nf-color-text-secondary); }
    .check-badge {
      font-size: 0.68rem; font-weight: 600; color: var(--nf-color-warning-700);
      background: var(--nf-color-warning-100); border-radius: 999px; padding: 0.1rem 0.45rem;
    }
    .check-icon { width: 1.15rem; text-align: center; font-weight: 700; }
    .check-item--OK .check-icon { color: var(--nf-color-success-600); }
    .check-item--BLOQUANT .check-icon { color: var(--nf-color-danger-600); }
    .check-item--A_FAIRE .check-icon { color: var(--nf-color-warning-600); }
    .check-item--NON_APPLICABLE { color: var(--nf-color-text-muted); }
    .check-action { margin-left: auto; background: none; border: 1px solid var(--nf-color-border); border-radius: 0.4rem; padding: 0.25rem 0.6rem; font-size: 0.75rem; cursor: pointer; }

    .flux-step { font-size: 0.9rem; }

    .cockpit__nav { margin-top: 1.25rem; }
    .cockpit__nav h3 { margin: 0 0 0.6rem; font-size: 0.85rem; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .nav-chips { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 0.5rem; }
    .nav-chip {
      display: flex; flex-direction: column; gap: 0.15rem; align-items: flex-start; text-align: left;
      padding: 0.7rem 0.85rem; border: 1px solid var(--nf-color-border); border-radius: 0.6rem;
      background: var(--nf-color-surface); cursor: pointer; min-height: 44px;
    }
    .nav-chip:hover { border-color: var(--nf-color-primary-400); background: var(--nf-color-bg-subtle); }
    .nav-chip__title { font-size: 0.86rem; font-weight: 600; color: var(--nf-color-text-primary); }
    .nav-chip__hint { font-size: 0.72rem; color: var(--nf-color-text-muted); line-height: 1.3; }
    @media (max-width: 480px) { .nav-chip { min-height: 44px; } }

    .feed { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.85rem; }
    .feed-item { display: flex; gap: 0.6rem; }
    .feed-date { color: var(--nf-color-text-muted); white-space: nowrap; }
    .feed-auteur { font-weight: 600; }
    .feed-contenu { color: var(--nf-color-text-secondary); }

    .cockpit__skeleton .skeleton-line { height: 1rem; border-radius: 0.4rem; background: var(--nf-color-bg-muted); margin-bottom: 0.75rem; animation: pulse 1.2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
  `],
})
export class PilotageTabComponent {
  readonly chantierId = input.required<string>();

  private readonly cockpitApi = inject(CockpitApiService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // ── AC-6 — démarrage par ordre de service ──
  readonly osReference = signal('');
  readonly osDateEffet = signal('');
  readonly osSubmitting = signal(false);
  readonly osErreur = signal<string | null>(null);

  readonly cockpit = signal<CockpitChantier | null>(null);
  readonly loading = signal(true);
  readonly identityError = signal<string | null>(null);

  constructor() {
    // P1-15 — le chargement démarre quand l'input `chantierId` est disponible, jamais au
    // constructeur (l'input requis n'est pas encore lié → crash sinon).
    effect(() => {
      const id = this.chantierId();
      if (id) untracked(() => this.recharger());
    });
  }

  recharger(): void {
    this.loading.set(true);
    this.identityError.set(null);
    this.cockpitApi
      .getCockpit(this.chantierId())
      .then((c) => {
        this.cockpit.set(c);
        this.loading.set(false);
      })
      .catch(() => {
        this.identityError.set('chantiers.cockpit.erreurIdentiteDetail');
        this.loading.set(false);
      });
  }

  readonly alerts = computed(() => this.cockpit()?.alerts ?? []);
  readonly preparation = computed(() => this.cockpit()?.preparation ?? []);
  readonly preparationResume = computed(() => this.cockpit()?.preparationResume ?? null);
  readonly actionPrimaire = computed<CockpitNextAction | null>(
    () => {
      const actions = this.cockpit()?.nextActions ?? [];
      return actions.find((a) => a.priorite === 1) ?? actions[0] ?? null;
    },
  );
  readonly actionsSecondaires = computed<CockpitNextAction[]>(() => {
    const primaire = this.actionPrimaire();
    return (this.cockpit()?.nextActions ?? []).filter((a) => a !== primaire);
  });

  /** Libellé i18n pour une recommandation en attente (ex. planning). */
  recoLabel(code: string): string {
    return code === 'planning'
      ? 'chantiers.cockpit.preparation.recommandePlanning'
      : 'chantiers.cockpit.preparation.recommandeGenerique';
  }

  /**
   * AC-6 — le formulaire OS s'affiche quand le chantier est EN_PREPARATION et que tous les
   * bloqueurs hors OS sont levés (seul l'OS reste à saisir pour démarrer).
   */
  readonly chantierPretDemarrage = computed(() => {
    const c = this.cockpit();
    if (!c || c.identity?.status !== 'EN_PREPARATION') return false;
    const reste = this.preparation().filter(
      (p) => p.etat === 'BLOQUANT' && p.code !== 'ordre_service',
    );
    return reste.length === 0;
  });

  /** AC-6 — commande atomique de démarrage par OS ; recharge le cockpit après. */
  async demarrerOs(): Promise<void> {
    const ref = this.osReference().trim();
    const date = this.osDateEffet();
    if (!ref || !date) {
      this.osErreur.set(this.translate.instant('chantiers.cockpit.os.champsRequis'));
      return;
    }
    this.osSubmitting.set(true);
    this.osErreur.set(null);
    try {
      await this.chantierApi.demarrerAvecOs(this.chantierId(), {
        osReference: ref,
        osDateEffet: date,
      });
      this.recharger();
    } catch (e) {
      const err = e as { error?: { bloqueurs?: string[]; code?: string } };
      if (err?.error?.bloqueurs?.length) {
        this.osErreur.set(
          this.translate.instant('chantiers.cockpit.os.bloqueurs') + ' : ' + err.error.bloqueurs.join(', '),
        );
      } else {
        this.osErreur.set(this.translate.instant('chantiers.cockpit.os.echec'));
      }
    } finally {
      this.osSubmitting.set(false);
    }
  }

  readonly shortcuts = computed(() => cockpitNavShortcuts(this.chantierId()));

  /** Exposé au template — AC-7 (flux) / garde ouvrirRoute. */
  readonly isCockpitAppRoute = isCockpitAppRoute;

  /** AC-1 / AC-8 — CTA prep seulement si `code` mappe vers une route `/…`. */
  preparationActionnable(p: CockpitPreparation): boolean {
    if (p.etat !== 'BLOQUANT' && p.etat !== 'A_FAIRE') return false;
    if (p.code === 'ordre_service') return false;
    return resolvePreparationRoute(p.code, this.chantierId()) != null;
  }

  /** AC-2 — CTA alerte si mapping route, ou reload pour `source_indisponible`. */
  alerteActionnable(a: CockpitAlerte): boolean {
    if (a.code === 'source_indisponible') return true;
    return resolveAlertRoute(a.code, this.chantierId()) != null;
  }

  alerteActionLabel(a: CockpitAlerte): string {
    if (a.code === 'source_indisponible') {
      return a.action?.startsWith('chantiers.') ? a.action : 'chantiers.cockpit.alerte.action.reessayer';
    }
    if (a.action?.startsWith('chantiers.')) return a.action;
    return 'chantiers.cockpit.ouvrir';
  }

  afficheMontant(m: CockpitMontant | null | undefined): string {
    if (!m) return '—';
    if (m.etat === 'FORBIDDEN') return '•••';
    if (m.etat === 'NOT_AVAILABLE' || m.montant == null) return 'Non disponible';
    const base = m.base ? ` ${m.base}` : '';
    const devise = m.devise ? ` ${m.devise}` : '';
    return `${m.montant.toLocaleString('fr-FR')}${base}${devise}`.trim();
  }

  afficheMarge(ht: CockpitMontant | null | undefined, pct: CockpitMontant | null | undefined): string {
    const v = this.afficheMontant(ht);
    if (v === '—' || v === 'Non disponible' || v === '•••') return v;
    const p = pct?.montant != null ? ` · ${pct.montant.toLocaleString('fr-FR')} %` : '';
    return `${v}${p}`;
  }

  afficheEcheance(c: CockpitChantier): string {
    const s = c.schedule;
    if (!s) return 'Non disponible';
    if (s.enRetard) {
      return `${s.joursRestantsOuRetard} j ${this.translate.instant('chantiers.cockpit.kpi.retard')}`;
    }
    if (s.joursRestantsOuRetard != null) {
      return `${s.joursRestantsOuRetard} j ${this.translate.instant('chantiers.cockpit.kpi.restants')}`;
    }
    return 'Non disponible';
  }

  fluxEtape(c: CockpitChantier): string {
    return c.progress?.fluxMois?.etape ?? 'chantiers.cockpit.flux.etapeInconnue';
  }

  severiteCss(s: string): string {
    return s;
  }

  prepCss(e: CockpitPreparation['etat']): string {
    return e;
  }

  prepIcon(e: CockpitPreparation['etat']): string {
    switch (e) {
      case 'OK': return '✓';
      case 'BLOQUANT': return '!';
      case 'A_FAIRE': return '○';
      default: return '–';
    }
  }

  executerAction(a: CockpitNextAction): void {
    if (a.libelle === 'chantiers.cockpit.action.preparer') {
      const bloquant = this.preparation().find((p) => p.etat === 'BLOQUANT');
      const mapped = bloquant ? resolvePreparationRoute(bloquant.code, this.chantierId()) : null;
      if (mapped) {
        this.ouvrirRoute(mapped);
        return;
      }
    }
    this.ouvrirRoute(a.route);
  }

  ouvrirPreparation(p: CockpitPreparation): void {
    if (p.code === 'ordre_service') {
      return;
    }
    this.ouvrirRoute(resolvePreparationRoute(p.code, this.chantierId()));
  }

  ouvrirAlerte(a: CockpitAlerte): void {
    if (a.code === 'source_indisponible') {
      this.recharger();
      return;
    }
    this.ouvrirRoute(resolveAlertRoute(a.code, this.chantierId()));
  }

  ouvrirRoute(route: string | null | undefined): void {
    if (!isCockpitAppRoute(route)) {
      return;
    }
    void this.router.navigateByUrl(resolveCockpitRoute(route!, this.chantierId()));
  }
}
