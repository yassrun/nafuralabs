import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, PageHeaderComponent, PageShellComponent, ConfirmDialogService } from '@lib/anatomy';
import { ToastService } from '@lib/anatomy/components/services/toast.service';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';
import { ApprovalEngineService } from '@applications/erp/approbations/services/approval-engine.service';
import { ChantierDrilldownService } from '@applications/erp/shell/chantier-drilldown.service';
import { APPROVAL_ENTITY_TYPE_KEYS } from '@applications/erp/shell/i18n-labels';
import { ApprobationsApiService } from '../services/approbations-api.service';
import { approvalEntityRoute } from '../approval-entity-route.util';
import { type ApprovalRequest, type ApprovalEntityType } from '../models';

type InboxTab = 'a-traiter' | 'historique';

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

const URGENCE_CSS: Record<string, string> = {
  NORMALE: 'urgence--normale',
  HAUTE: 'urgence--haute',
  CRITIQUE: 'urgence--critique',
};

const URGENCE_RANK: Record<string, number> = { CRITIQUE: 3, HAUTE: 2, NORMALE: 1 };

@Component({
  selector: 'app-approbations-inbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe, ButtonComponent],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      <nav class="tabs">
        <nf-button type="button" class="tab" [class.tab--active]="tab() === 'a-traiter'" (clicked)="tab.set('a-traiter')" variant="ghost">
          {{ 'dashboard.approbations.tabs.aTraiter' | translate }}
          @if (countEnAttente() > 0) { <span class="badge-count">{{ countEnAttente() }}</span> }
        </nf-button>
        <nf-button type="button" class="tab" [class.tab--active]="tab() === 'historique'" (clicked)="tab.set('historique')" variant="ghost">
          {{ 'dashboard.approbations.tabs.historique' | translate }}
        </nf-button>
      </nav>

      <div class="filters">
        <select [value]="filterType()" (change)="filterType.set($any($event.target).value)">
          <option value="">{{ 'dashboard.approbations.filters.allTypes' | translate }}</option>
          @for (e of entityTypes; track e) { <option [value]="e">{{ entityTypeKey(e) | translate }}</option> }
        </select>
        <select [value]="filterSociete()" (change)="filterSociete.set($any($event.target).value)">
          <option value="">{{ 'dashboard.approbations.filters.allSocietes' | translate }}</option>
          @for (s of societeOptions; track s[0]) { <option [value]="s[0]">{{ s[1] | translate }}</option> }
        </select>
        <select [value]="filterUrgence()" (change)="filterUrgence.set($any($event.target).value)">
          <option value="">{{ 'dashboard.approbations.filters.allUrgences' | translate }}</option>
          <option value="CRITIQUE">{{ 'dashboard.approbations.urgence.critique' | translate }}</option>
          <option value="HAUTE">{{ 'dashboard.approbations.urgence.haute' | translate }}</option>
          <option value="NORMALE">{{ 'dashboard.approbations.urgence.normale' | translate }}</option>
        </select>
      </div>

      <div class="requests-list">
        @for (req of displayList(); track req.id) {
          <article
            [id]="'approval-card-' + req.id"
            class="req-card"
            [class.req-card--urgent]="req.urgence === 'HAUTE' || req.urgence === 'CRITIQUE'"
            [class.req-card--sla]="slaLag(req) > 0 && req.status === 'EN_ATTENTE'"
            [class.req-card--focused]="highlightId() === req.id"
          >
            <div class="req-header">
              <div class="req-type">
                <span class="type-pill">{{ entityTypeKey(req.entityType) | translate }}</span>
                @if (req.societeId) {
                  <span class="soc-pill">{{ societeLabel(req.societeId) | translate }}</span>
                }
                @if (req.urgence !== 'NORMALE') {
                  <span class="urgence {{ urgenceCss(req.urgence) }}">{{ urgenceKey(req.urgence) | translate }}</span>
                }
              </div>
              <span class="req-date">{{ timeAgo(req.dateCreation) }}</span>
            </div>

            <p class="req-summary">{{ req.entitySummary }}</p>

            <div class="req-meta">
              <span class="initiateur">{{ 'dashboard.approbations.card.par' | translate: { nom: req.initiateurNom } }}</span>
              @if (req.chantierCode) {
                <span class="sep">·</span>
                <nf-button type="button" class="chantier-link" (clicked)="openChantier(req, $event)" variant="ghost">{{ req.chantierCode }}</nf-button>
              }
              @if (req.montantConcerne) {
                <span class="sep">·</span>
                <strong class="montant">{{ req.montantConcerne | mad }}</strong>
              }
              @if (slaLag(req) > 0 && req.status === 'EN_ATTENTE') {
                <span class="sep">·</span>
                <span class="sla-badge">{{ 'dashboard.approbations.card.slaBadge' | translate: { days: slaLag(req) } }}</span>
              }
            </div>

            <div class="workflow">
              @for (etape of req.etapes; track etape.ordre; let i = $index) {
                <div class="etape" [class.etape--done]="!!etape.decision" [class.etape--current]="i === req.etapeCourante && !etape.decision" [class.etape--future]="i > req.etapeCourante">
                  <div class="etape-dot"></div>
                  <div class="etape-info">
                    <span class="etape-role">{{ etape.approbateurNom }}</span>
                    @if (etape.decision) {
                      <span class="etape-decision etape-decision--{{ etape.decision.toLowerCase() }}">{{ etape.decision }}</span>
                    } @else if (etape.dateLimite) {
                      @if (daysUntil(etape.dateLimite) <= 1) {
                        <span class="sla-warn">{{ 'dashboard.approbations.card.slaExp' | translate: { date: (etape.dateLimite | date:'dd/MM') } }}</span>
                      } @else {
                        <span class="sla-ok">{{ 'dashboard.approbations.card.slaRestants' | translate: { days: daysUntil(etape.dateLimite) } }}</span>
                      }
                    }
                  </div>
                </div>
                @if (i < req.etapes.length - 1) { <div class="etape-connector"></div> }
              }
            </div>

            @if (req.historique.length) {
              <details class="audit">
                <summary>{{ 'dashboard.approbations.card.auditTitle' | translate: { count: req.historique.length } }}</summary>
                <ol class="audit-list">
                  @for (h of req.historique; track $index) {
                    <li>
                      <span class="audit-act">{{ h.action }}</span>
                      · {{ h.approbateurNom ?? h.approbateurId }}
                      · {{ h.date | date:'dd/MM HH:mm' }}
                      @if (h.commentaire) { — <em>{{ h.commentaire }}</em> }
                      @if (h.hash) {
                        <code class="audit-hash" [title]="h.hash">{{ h.hash.slice(0, 10) }}…</code>
                      }
                    </li>
                  }
                </ol>
              </details>
            }

            @if (tab() === 'a-traiter' && req.status === 'EN_ATTENTE') {
              <div class="req-actions">
                <nf-button type="button" class="btn btn--approve" (clicked)="approuver(req)" variant="primary">{{ 'dashboard.approbations.actions.approve' | translate }}</nf-button>
                <nf-button type="button" class="btn btn--reject" (clicked)="rejeter(req)" variant="danger">{{ 'dashboard.approbations.actions.reject' | translate }}</nf-button>
                <nf-button type="button" class="btn btn--primary" (clicked)="demanderComplement(req)" variant="primary">{{ 'dashboard.approbations.actions.askComplement' | translate }}</nf-button>
                <nf-button type="button" class="btn btn--ghost" (clicked)="commenter(req)" variant="ghost">{{ 'dashboard.approbations.actions.comment' | translate }}</nf-button>
                <nf-button type="button" class="btn btn--ghost" (clicked)="deleguer(req)" variant="ghost">{{ 'dashboard.approbations.actions.delegate' | translate }}</nf-button>
                <nf-button type="button" class="btn btn--ghost" (clicked)="openEntityDetail(req, $event)" variant="ghost">{{ 'dashboard.approbations.actions.viewDetail' | translate }}</nf-button>
              </div>
            }
          </article>
        } @empty {
          <div class="empty">
            @if (tab() === 'a-traiter') {
              <p>{{ 'dashboard.approbations.empty.aTraiter' | translate }}</p>
            } @else {
              <p>{{ 'dashboard.approbations.empty.historique' | translate }}</p>
            }
          </div>
        }
      </div>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .tabs { display: flex; gap: 0; border-bottom: 2px solid var(--nf-color-border); margin-bottom: 1rem; }
    .tab { padding: 0.6rem 1rem; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; font-size: 0.87rem; font-weight: 500; color: var(--nf-color-text-secondary); cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
    .tab--active { color: var(--nf-color-primary-700); border-bottom-color: var(--nf-color-primary-700); font-weight: 600; }
    .badge-count { background: var(--nf-color-danger-600); color: white; font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 9999px; min-width: 18px; text-align: center; }

    .filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 1rem; }
    .filters select { padding: 6px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: white; }

    .requests-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .req-card { background: white; border: 1px solid var(--nf-color-border); border-radius: 0.875rem; padding: 1.1rem 1.25rem; transition: box-shadow 120ms; }
    .req-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
    .req-card--urgent { border-left: 4px solid var(--nf-color-warning-500); }
    .req-card--sla { border-left: 4px solid var(--nf-color-danger-600); }
    .req-card--focused { box-shadow: 0 0 0 3px rgba(59,130,246,0.35); }

    .req-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .req-type { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .type-pill { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
    .soc-pill { background: var(--nf-color-info-50, var(--nf-color-primary-50)); color: var(--nf-color-info-700, var(--nf-color-primary-700)); font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
    .urgence { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.06em; }
    .urgence--haute { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .urgence--critique { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .req-date { font-size: 12px; color: var(--nf-color-text-muted); }

    .req-summary { margin: 0 0 0.5rem; font-size: 0.9rem; font-weight: 500; color: var(--nf-text-primary); line-height: 1.4; }

    .req-meta { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--nf-color-text-secondary); margin-bottom: 0.875rem; flex-wrap: wrap; }
    .initiateur { color: var(--nf-color-text-secondary); }
    .sep { color: var(--nf-color-border); }
    .montant { color: var(--nf-color-primary-700); }
    .sla-badge { font-size: 10px; font-weight: 700; color: var(--nf-color-danger-700); background: var(--nf-color-danger-100); padding: 2px 6px; border-radius: 4px; }

    .chantier-link {
      background: none; border: none; padding: 0; margin: 0;
      font: inherit; color: var(--nf-color-primary-700); text-decoration: underline; cursor: pointer;
    }
    .chantier-link:hover { color: var(--nf-color-primary-800); }

    .workflow { display: flex; align-items: center; gap: 0; margin-bottom: 0.875rem; flex-wrap: wrap; gap: 4px; }
    .etape { display: flex; align-items: center; gap: 6px; }
    .etape-dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--nf-color-border); background: white; flex-shrink: 0; }
    .etape--done .etape-dot { background: var(--nf-color-success-600); border-color: var(--nf-color-success-600); }
    .etape--current .etape-dot { background: var(--nf-color-primary-500); border-color: var(--nf-color-primary-500); box-shadow: 0 0 0 3px rgba(59,130,246,0.2); }
    .etape-info { display: flex; flex-direction: column; }
    .etape-role { font-size: 11px; color: var(--nf-color-text-secondary); white-space: nowrap; }
    .etape-decision { font-size: 10px; font-weight: 700; }
    .etape-decision--approuve { color: var(--nf-color-success-600); }
    .etape-decision--rejete { color: var(--nf-color-danger-600); }
    .sla-warn { font-size: 10px; color: var(--nf-color-danger-600); font-weight: 600; }
    .sla-ok { font-size: 10px; color: var(--nf-color-text-muted); }
    .etape-connector { height: 2px; width: 24px; background: var(--nf-color-border); flex-shrink: 0; }

    .audit { margin: 0 0 0.75rem; font-size: 12px; color: var(--nf-color-text-secondary); }
    .audit summary { cursor: pointer; font-weight: 600; color: var(--nf-color-text-secondary); }
    .audit-list { margin: 0.35rem 0 0; padding-left: 1.1rem; }
    .audit-act { font-weight: 700; color: var(--nf-text-primary); }
    .audit-hash { display: inline-block; margin-left: 6px; font-size: 10px; color: var(--nf-color-text-secondary); }

    .req-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .btn { padding: 5px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all 80ms; text-decoration: none; }
    .btn--approve { background: var(--nf-color-success-100); color: var(--nf-color-success-700); border-color: var(--nf-color-success-200); }
    .btn--approve:hover { background: var(--nf-color-success-600); color: white; }
    .btn--reject { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); border-color: var(--nf-color-danger-300); }
    .btn--reject:hover { background: var(--nf-color-danger-600); color: white; }
    .btn--primary { background: var(--nf-color-primary-100); color: var(--nf-color-primary-800); border-color: var(--nf-color-primary-200); }
    .btn--primary:hover { background: var(--nf-color-primary-700); color: white; border-color: var(--nf-color-primary-700); }
    .btn--ghost { background: none; border-color: var(--nf-color-border); color: var(--nf-color-text-secondary); }
    .btn--ghost:hover { background: var(--nf-color-bg-subtle); }

    .empty { text-align: center; padding: 3rem; color: var(--nf-color-text-muted); font-size: 0.9rem; }
  `],
})
export class ApprobationsInboxPage {
  private readonly service = inject(ApprobationsApiService);
  private readonly engine = inject(ApprovalEngineService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly chantierDrill = inject(ChantierDrilldownService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly highlightId = toSignal(
    this.route.queryParamMap.pipe(map((q) => q.get('highlight') ?? q.get('id'))),
    { initialValue: null },
  );

  readonly tab = signal<InboxTab>('a-traiter');
  readonly filterType = signal<ApprovalEntityType | ''>('');
  readonly filterSociete = signal<string>('');
  readonly filterUrgence = signal<'' | 'NORMALE' | 'HAUTE' | 'CRITIQUE'>('');

  readonly entityTypes = Object.keys(APPROVAL_ENTITY_TYPE_KEYS) as ApprovalEntityType[];
  readonly societeOptions: [string, string][] = [
    ['soc-nafura', 'dashboard.approbations.societes.nafura'],
    ['soc-subsidiary', 'dashboard.approbations.societes.subsidiary'],
  ];

  readonly countEnAttente = this.service.countEnAttente;

  private readonly loadRequests = effect(() => {
    void this.service.ensureLoaded();
  });

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('dashboard.approbations.title'),
    subtitle: this.translate.instant('dashboard.approbations.subtitleCount', { count: this.countEnAttente() }),
    breadcrumbs: [{ label: this.translate.instant('dashboard.approbations.breadcrumb') }],
  }));

  entityTypeKey(t: ApprovalEntityType): string {
    return APPROVAL_ENTITY_TYPE_KEYS[t] ?? t;
  }

  urgenceKey(u: string): string {
    const lower = u.toLowerCase();
    return `dashboard.approbations.urgence.${lower}`;
  }

  timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    try {
      const rtf = new Intl.RelativeTimeFormat(resolveLocale(this.translate), { numeric: 'auto' });
      if (diff < 60) return rtf.format(-diff, 'minute');
      if (diff < 1440) return rtf.format(-Math.floor(diff / 60), 'hour');
      return rtf.format(-Math.floor(diff / 1440), 'day');
    } catch {
      if (diff < 60) return `${diff} min`;
      if (diff < 1440) return `${Math.floor(diff / 60)} h`;
      return `${Math.floor(diff / 1440)} d`;
    }
  }

  readonly displayList = computed(() => {
    const t = this.filterType();
    const soc = this.filterSociete();
    const urg = this.filterUrgence();
    const source =
      this.tab() === 'a-traiter'
        ? this.service.enAttente()
        : this.service.requests().filter((r) => r.status !== 'EN_ATTENTE');
    let list = source;
    if (t) {
      list = list.filter((r) => r.entityType === t);
    }
    if (soc) {
      list = list.filter((r) => r.societeId === soc);
    }
    if (urg) {
      list = list.filter((r) => r.urgence === urg);
    }
    return [...list].sort((a, b) => {
      const slaB = this.engine.slaLagDays(b);
      const slaA = this.engine.slaLagDays(a);
      if (slaB !== slaA) {
        return slaB - slaA;
      }
      return (URGENCE_RANK[b.urgence] ?? 0) - (URGENCE_RANK[a.urgence] ?? 0);
    });
  });

  private readonly applyNotificationDeepLink = effect(() => {
    const id = this.highlightId();
    void this.service.ensureLoaded();
    if (!id) {
      return;
    }
    const req = this.service.findById(id);
    untracked(() => {
      this.filterType.set('');
      this.filterSociete.set('');
      this.filterUrgence.set('');
      if (req?.status === 'EN_ATTENTE') {
        this.tab.set('a-traiter');
      } else if (req) {
        this.tab.set('historique');
      }
    });
    const tick = () =>
      document.getElementById(`approval-card-${id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    requestAnimationFrame(() => setTimeout(tick, 80));
  });

  slaLag(req: ApprovalRequest): number {
    return this.engine.slaLagDays(req);
  }

  societeLabel(id: string): string {
    return this.societeOptions.find((s) => s[0] === id)?.[1] ?? id;
  }

  async approuver(req: ApprovalRequest): Promise<void> {
    await this.service.decide(req.id, 'APPROUVE', undefined, this.translate.instant('dashboard.approbations.audit.selfApprover'));
  }

  async rejeter(req: ApprovalRequest): Promise<void> {
    const result = await this.confirmDialog.prompt({
      title: this.translate.instant('dashboard.approbations.actions.reject'),
      fields: [{ key: 'raison', label: 'dashboard.approbations.prompts.rejectReason', required: true }],
      confirmLabel: this.translate.instant('dashboard.approbations.actions.reject'),
      cancelLabel: this.translate.instant('common.actions.cancel'),
    });
    if (!result) return;
    const raison = result['raison'];
    if (!raison?.trim()) return;
    await this.service.decide(req.id, 'REJETE', raison.trim(), this.translate.instant('dashboard.approbations.audit.selfApprover'));
  }

  async demanderComplement(req: ApprovalRequest): Promise<void> {
    const result = await this.confirmDialog.prompt({
      title: this.translate.instant('dashboard.approbations.actions.askComplement'),
      fields: [{ key: 'msg', label: 'dashboard.approbations.prompts.complement', required: true }],
      confirmLabel: this.translate.instant('dashboard.approbations.actions.askComplement'),
      cancelLabel: this.translate.instant('common.actions.cancel'),
    });
    if (!result) return;
    const msg = result['msg'];
    if (!msg?.trim()) return;
    await this.service.appendJournalAction(req.id, 'DEMANDE_COMPLEMENT', msg.trim(), this.translate.instant('dashboard.approbations.audit.selfApprover'));
    this.toast.success(this.translate.instant('dashboard.approbations.toasts.complementSent'));
  }

  async commenter(req: ApprovalRequest): Promise<void> {
    const result = await this.confirmDialog.prompt({
      title: this.translate.instant('dashboard.approbations.actions.comment'),
      fields: [{ key: 'msg', label: 'dashboard.approbations.prompts.comment', required: true }],
      confirmLabel: this.translate.instant('dashboard.approbations.actions.comment'),
      cancelLabel: this.translate.instant('common.actions.cancel'),
    });
    if (!result) return;
    const msg = result['msg'];
    if (!msg?.trim()) return;
    await this.service.appendJournalAction(req.id, 'COMMENTE', msg.trim(), this.translate.instant('dashboard.approbations.audit.selfApprover'));
    this.toast.success(this.translate.instant('dashboard.approbations.toasts.commentSaved'));
  }

  async deleguer(req: ApprovalRequest): Promise<void> {
    const result = await this.confirmDialog.prompt({
      title: this.translate.instant('dashboard.approbations.actions.delegate'),
      fields: [{ key: 'nom', label: 'dashboard.approbations.prompts.delegate', required: true }],
      confirmLabel: this.translate.instant('dashboard.approbations.actions.delegate'),
      cancelLabel: this.translate.instant('common.actions.cancel'),
    });
    if (!result) return;
    const nom = result['nom'];
    if (!nom?.trim()) return;
    await this.service.appendJournalAction(
      req.id,
      'DELEGUE',
      `Délégation temporaire vers ${nom.trim()}`,
      this.translate.instant('dashboard.approbations.audit.selfApprover'),
    );
    this.toast.info(this.translate.instant('dashboard.approbations.toasts.delegationSaved', { nom: nom.trim() }));
  }

  openChantier(req: ApprovalRequest, ev: Event): void {
    ev.stopPropagation();
    this.chantierDrill.tryNavigateFromRow({
      chantierId: req.chantierId,
      chantierCode: req.chantierCode,
    });
  }

  openEntityDetail(req: ApprovalRequest, ev: Event): void {
    ev.stopPropagation();
    const link = approvalEntityRoute(req.entityType, req.entityId);
    if (!link) {
      this.toast.info(this.translate.instant('dashboard.approbations.toasts.entityNotLinked'));
      return;
    }
    void this.router.navigate(link);
  }

  urgenceCss(u: string): string {
    return URGENCE_CSS[u] ?? '';
  }
  daysUntil = daysUntil;
}
