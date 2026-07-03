import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Output,
  EventEmitter,
  computed,
  inject,
  signal,
} from '@angular/core';

import { SocieteService } from '../../societe.service';
import { ETABLISSEMENT_TYPE_LABELS } from '../../../pages/administration/societe/models';

/**
 * Header dropdown to switch between sociétés / établissements (Task 8.3).
 *
 * - Hidden when a single société is available (matches spec §Multi-tenant).
 * - Persists selection via SocieteService → localStorage.
 * - Emits `(change)` whenever the user changes the active société or établissement.
 */
import { ButtonComponent } from '@lib/anatomy';

@Component({
  selector: 'app-societe-switcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonComponent],
  template: `
    @if (visible()) {
      <div class="switcher" [class.is-open]="open()">
        <nf-button
          type="button"
          class="switcher__trigger"
          variant="secondary"
          size="sm"
          icon="building-2"
          iconLibrary="lucide"
          (clicked)="toggle()"
          [attr.aria-expanded]="open()"
          [attr.aria-haspopup]="'menu'"
          [title]="triggerTooltip()">
          <span class="switcher__label">
            <span class="switcher__societe">{{ currentSocieteLabel() }}</span>
            @if (currentEtab(); as etab) {
              <span class="switcher__sep" aria-hidden="true">·</span>
              <span class="switcher__etab">{{ etab.nom }}</span>
            }
          </span>
          <span class="switcher__caret" aria-hidden="true">▾</span>
        </nf-button>

        @if (open()) {
          <div class="switcher__panel" role="menu">
            <div class="switcher__section">
              <div class="switcher__section-label">Société</div>
              @for (s of societes(); track s.id) {
                <nf-button
                  type="button"
                  class="switcher__item"
                  role="menuitemradio"
                  [attr.aria-checked]="s.id === currentSocieteId()"
                  [class.is-active]="s.id === currentSocieteId()"
                  (clicked)="selectSociete(s.id)" variant="secondary">
                  <span class="switcher__item-main">{{ s.raisonSociale }}</span>
                  <span class="switcher__item-meta">{{ formeLabel(s.formeJuridique) }} · ICE {{ s.ice }}</span>
                </nf-button>
              }
            </div>

            @if (etablissements().length > 0) {
              <div class="switcher__divider" role="separator"></div>
              <div class="switcher__section">
                <div class="switcher__section-label">Établissement</div>
                @for (e of etablissements(); track e.id) {
                  <nf-button
                    type="button"
                    class="switcher__item switcher__item--etab"
                    role="menuitemradio"
                    [attr.aria-checked]="e.id === currentEtabId()"
                    [class.is-active]="e.id === currentEtabId()"
                    (clicked)="selectEtablissement(e.id)" variant="ghost">
                    <span class="switcher__item-main">{{ e.nom }}</span>
                    <span class="switcher__item-meta">{{ etabTypeLabel(e.type) }} · {{ e.ville }}</span>
                  </nf-button>
                }
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; }

    .switcher {
      position: relative;
      display: inline-flex;
      align-items: center;
    }

    .switcher__trigger {
      --nf-button-icon-text-gap: 0.375rem;
      --nf-button-content-gap: 0.25rem;
      max-width: 280px;
    }

    .switcher__trigger ::ng-deep button {
      display: inline-flex;
      align-items: center;
      max-width: 280px;
      height: 34px;
      min-height: 34px;
      padding: 0 0.625rem;
      border-radius: 9999px;
      transition: border-color 100ms ease, background 100ms ease;
    }

    .switcher__trigger ::ng-deep button:hover:not(:disabled) {
      border-color: var(--nf-border-strong, var(--nf-border-default));
      background: var(--nf-surface-hover);
    }

    .switcher.is-open .switcher__trigger ::ng-deep button {
      border-color: var(--nf-color-primary-300);
      background: var(--nf-primary-subtle, var(--nf-color-primary-50));
    }

    .switcher__label {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      min-width: 0;
      line-height: 1.1;
    }

    .switcher__societe {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--nf-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .switcher__sep {
      flex-shrink: 0;
      color: var(--nf-text-muted);
      font-weight: 400;
    }

    .switcher__etab {
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--nf-text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .switcher__caret {
      font-size: 11px;
      color: var(--nf-text-muted);
      flex-shrink: 0;
    }

    .switcher__panel {
      position: absolute;
      top: calc(100% + 0.375rem);
      right: 0;
      min-width: 320px;
      max-width: 380px;
      background: var(--nf-color-surface);
      border: 1px solid var(--nf-border-default);
      border-radius: 0.75rem;
      box-shadow: var(--nf-shadow-lg, 0 10px 30px rgba(2, 6, 23, 0.12));
      padding: 0.5rem;
      z-index: 200;
    }

    .switcher__section {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .switcher__section-label {
      font-size: 0.66rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 700;
      color: var(--nf-text-muted);
      padding: 0.375rem 0.5rem 0.25rem;
    }

    .switcher__divider {
      height: 1px;
      background: var(--nf-border-subtle);
      margin: 0.375rem 0;
    }

    .switcher__item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      width: 100%;
      padding: 0.5rem 0.625rem;
      border: none;
      border-radius: 0.5rem;
      background: transparent;
      color: var(--nf-text-primary);
      cursor: pointer;
      text-align: left;
      transition: background 100ms ease;
    }
    .switcher__item:hover {
      background: var(--nf-surface-hover);
    }
    .switcher__item.is-active {
      background: var(--nf-primary-subtle, var(--nf-color-primary-50));
      color: var(--nf-color-primary-700);
    }
    .switcher__item.is-active .switcher__item-meta { color: var(--nf-color-primary-700); opacity: 0.85; }

    .switcher__item--etab .switcher__item-main { font-weight: 600; }

    .switcher__item-main {
      font-size: 0.83rem;
      font-weight: 700;
    }

    .switcher__item-meta {
      font-size: 0.7rem;
      color: var(--nf-text-muted);
    }

    @media (max-width: 980px) {
      .switcher__trigger { max-width: 200px; }
      .switcher__etab { display: none; }
      .switcher__sep { display: none; }
    }
  `],
})
export class SocieteSwitcherComponent {
  private readonly societeService = inject(SocieteService);
  private readonly hostRef = inject(ElementRef);

  @Output() readonly change = new EventEmitter<{ societeId: string; etablissementId: string | null }>();

  readonly open = signal(false);

  readonly societes = this.societeService.societes;
  readonly currentSocieteId = this.societeService.currentSocieteId;
  readonly currentEtabId = this.societeService.currentEtablissementId;
  readonly etablissements = this.societeService.etablissementsForCurrentSociete;
  readonly currentEtab = this.societeService.currentEtablissement;

  /** Show tenant label when at least one société is bound (single-tenant onboarding included). */
  readonly visible = computed(() => this.societes().length >= 1);

  readonly currentSocieteLabel = computed(
    () => this.societeService.currentSociete()?.raisonSociale ?? '—',
  );

  readonly triggerTooltip = computed(() => {
    const soc = this.societeService.currentSociete();
    const etab = this.currentEtab();
    const parts: string[] = [];
    if (soc) parts.push(soc.raisonSociale);
    if (etab) parts.push(etab.nom);
    return parts.length ? `Société active — ${parts.join(' · ')}` : 'Société active';
  });

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }

  selectSociete(id: string): void {
    if (id === this.currentSocieteId()) {
      this.close();
      return;
    }
    this.societeService.setCurrentSociete(id);
    this.emit();
    this.close();
  }

  selectEtablissement(id: string): void {
    if (id === this.currentEtabId()) {
      this.close();
      return;
    }
    this.societeService.setCurrentEtablissement(id);
    this.emit();
    this.close();
  }

  formeLabel(forme: string): string {
    return forme === 'SARLAU' ? 'SARL à Associé Unique' : forme;
  }

  etabTypeLabel(type: keyof typeof ETABLISSEMENT_TYPE_LABELS): string {
    return ETABLISSEMENT_TYPE_LABELS[type] ?? type;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.close();
  }

  private emit(): void {
    this.change.emit({
      societeId: this.currentSocieteId(),
      etablissementId: this.currentEtabId(),
    });
  }
}
