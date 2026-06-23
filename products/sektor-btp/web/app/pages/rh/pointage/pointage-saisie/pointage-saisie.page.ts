import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent, TooltipDirective, ButtonComponent } from '@lib/anatomy';
import type { Chantier } from '../../../../chantiers/models';
import { ChantierApiService } from '../../../chantiers/services/chantier-api.service';
import { MODE_KEYS } from '@applications/erp/shell/i18n-labels';
import { MODE_EMOJI, MODE_CSS, type PointageMode, type PointageSignatureMode } from '../models';
import { PointageSaisieService } from '../services/pointage-saisie.service';
import { PointagePhotoIdbService } from '../services/pointage-photo-idb.service';
import { distanceMetres } from '../utils/pointage-geofence.util';

interface SaisieEntry {
  employeId: string;
  employeNom: string;
  mode: PointageMode;
  heureArrivee: string;
  heureDepart: string;
  notes: string;
}

const MODES: PointageMode[] = ['PRESENT', 'ABSENT', 'CONGE', 'MALADIE', 'FORMATION', 'AUTRE'];

function newBatchId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `batch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

@Component({
  selector: 'app-pointage-saisie',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TranslateModule, PageShellComponent, PageHeaderComponent, TooltipDirective, ButtonComponent],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      <div
        class="sync-banner"
        aria-live="polite"
        [class.sync-banner--offline]="!isOnline()"
        [class.sync-banner--pending]="isOnline() && pendingSyncCount() > 0"
        [class.sync-banner--conflict]="pendingConflictCount() > 0"
        [class.sync-banner--ok]="isOnline() && pendingSyncCount() === 0 && pendingConflictCount() === 0 && !validationError()">
        @if (!isOnline()) {
          <span>{{ 'rh.pointage.saisie.sync.offline' | translate: { count: pendingSyncCount() } }}</span>
        } @else if (pendingConflictCount() > 0) {
          <span>{{ 'rh.pointage.saisie.sync.conflict' | translate: { count: pendingConflictCount() } }}</span>
        } @else if (syncing() || pendingSyncCount() > 0) {
          <span>{{ 'rh.pointage.saisie.sync.syncing' | translate: { count: pendingSyncCount() } }}</span>
        } @else {
          @if (lastSyncedAt(); as last) {
            <span>{{ 'rh.pointage.saisie.sync.syncedAt' | translate: { date: last.slice(0, 10), time: last.slice(11, 16) } }}</span>
          } @else {
            <span>{{ 'rh.pointage.saisie.sync.syncedLocal' | translate }}</span>
          }
        }
      </div>

      @if (validationError()) {
        <div class="validation-error" role="alert">{{ validationError() }}</div>
      }

      <div class="controls">
        <div class="control-group">
          <label class="ctrl-label" for="pointage-chantier">{{ 'rh.common.filters.chantier' | translate }}</label>
          <select id="pointage-chantier" class="ctrl-select" [value]="chantierId()" (change)="onChantierChange($any($event.target).value)">
            <option value="">{{ 'rh.pointage.saisie.modes.selectChantier' | translate }}</option>
            @for (c of chantiers(); track c.id) {
              <option [value]="c.id">{{ c.code }} — {{ c.name }}</option>
            }
          </select>
        </div>
        <div class="control-group">
          <label class="ctrl-label" for="pointage-date">{{ 'rh.pointage.validation.controls.date' | translate }}</label>
          <input id="pointage-date" type="date" class="ctrl-input" [value]="date()" (change)="onDateChange($any($event.target).value)" />
        </div>
        @if (geoloc()) {
          <div class="geoloc-badge">📍 {{ geoloc()!.lat.toFixed(4) }}, {{ geoloc()!.lng.toFixed(4) }}</div>
        } @else {
          <nf-button variant="secondary" size="sm" (clicked)="captureGeoloc()" [disabled]="geoLoading()"
            [nfTooltip]="geolocTooltip"
            position="bottom">
            {{ geoLoading() ? ('rh.pointage.saisie.actions.geolocLoading' | translate) : ('rh.pointage.saisie.actions.geoloc' | translate) }}
          </nf-button>
        }
      </div>

      @if (geofenceSite()) {
        <div class="geofence-panel" [class.geofence-panel--bad]="geoloc() && !geofenceOk()">
          <strong>{{ 'rh.pointage.saisie.geofence.label' | translate }}</strong>
          — {{ 'rh.pointage.saisie.geofence.radius' | translate: { m: geofenceRadiusM() } }}
          @if (geoloc(); as pos) {
            <span>{{ 'rh.pointage.saisie.geofence.distance' | translate: { distance: distanceLabel() } }}</span>
            @if (!geofenceOk()) {
              <span class="geofence-ko">{{ 'rh.pointage.saisie.geofence.refused' | translate }}</span>
            }
          } @else {
            <span class="geofence-warn">{{ 'rh.pointage.saisie.geofence.activate' | translate }}</span>
          }
        </div>
      }

      @if (chantierId()) {
        <div class="team-toolbar">
          <span class="team-toolbar__title">{{ 'rh.pointage.saisie.team.title' | translate }}</span>
          <nf-button variant="ghost" size="sm" (clicked)="selectAllOuvriers()">{{ 'rh.pointage.saisie.team.selectAll' | translate }}</nf-button>
          <nf-button variant="ghost" size="sm" (clicked)="selectNone()">{{ 'rh.pointage.saisie.team.selectNone' | translate }}</nf-button>
          <nf-button variant="ghost" size="sm" (clicked)="selectPresentOnly()">{{ 'rh.pointage.saisie.team.selectPresent' | translate }}</nf-button>
          <span class="team-toolbar__sep">{{ 'rh.pointage.saisie.team.applyToSelection' | translate }}</span>
          @for (m of modes; track m) {
            <nf-button variant="ghost" size="sm" class="mode-chip {{ modeCss(m) }}"
              [disabled]="selection().size === 0"
              (clicked)="applyModeToSelection(m)"
              [attr.aria-label]="'rh.pointage.saisie.team.applyMode' | translate: { mode: modeLabel(m) }">
              {{ modeEmoji(m) }}
            </nf-button>
          }
          <span class="team-toolbar__count">{{ 'rh.pointage.saisie.team.selectedCount' | translate: { count: selection().size } }}</span>
        </div>
      }

      @if (chantierId()) {
        <div class="photo-row">
          <label class="photo-label" for="pointage-photo">{{ 'rh.pointage.saisie.photo.label' | translate }}</label>
          <input id="pointage-photo" data-testid="pointage-photo" type="file" accept="image/*" capture="environment"
            (change)="onPhotoSelected($event)" />
          @if (photoPreviewUrl()) {
            <div class="photo-preview">
              <img [src]="photoPreviewUrl()!" [alt]="'rh.pointage.saisie.photo.previewAlt' | translate" />
              <nf-button variant="ghost" size="sm" (clicked)="clearPhoto()">{{ 'rh.pointage.saisie.photo.clear' | translate }}</nf-button>
            </div>
          }
        </div>
      }

      @if (!chantierId()) {
        <div class="empty-msg">{{ 'rh.pointage.saisie.empty' | translate }}</div>
      } @else {
        <div class="quick-bar">
          <span class="quick-label">{{ 'rh.pointage.saisie.quickBar.label' | translate }}</span>
          @for (m of modes; track m) {
            <nf-button variant="ghost" size="sm" class="quick-btn {{ modeCss(m) }}" (clicked)="setAll(m)"
              [attr.aria-label]="'rh.pointage.saisie.quickBar.ariaLabel' | translate: { mode: modeLabel(m) }">
              {{ modeEmoji(m) }} {{ modeLabel(m) }}
            </nf-button>
          }
        </div>

        <div class="sig-mode-row">
          <span class="sig-mode-label">{{ 'rh.pointage.saisie.signature.label' | translate }}</span>
          <label class="radio-inline"><input type="radio" name="sigmode" [checked]="signatureMode() === 'COLLECTIF'" (change)="setSignatureMode('COLLECTIF')" /> {{ 'rh.pointage.saisie.signature.collectif' | translate }}</label>
          <label class="radio-inline"><input type="radio" name="sigmode" [checked]="signatureMode() === 'INDIVIDUEL'" (change)="setSignatureMode('INDIVIDUEL')" /> {{ 'rh.pointage.saisie.signature.individuel' | translate }}</label>
        </div>

        @if (signatureMode() === 'COLLECTIF') {
          <div class="sign-block">
            <p class="hint">{{ 'rh.pointage.saisie.signature.hint' | translate }}</p>
            <canvas #sigCollective data-testid="pointage-signature-canvas" class="sig-canvas" width="440" height="160"
              (pointerdown)="onCollectiveSignStart($event)"
              (pointermove)="onCollectiveSignMove($event)"
              (pointerup)="onCollectiveSignEnd($event)"
              (pointerleave)="onCollectiveSignEnd($event)"></canvas>
            <nf-button variant="ghost" size="sm" (clicked)="clearCollectiveSignature()">{{ 'rh.pointage.saisie.signature.clear' | translate }}</nf-button>
          </div>
        }

        <div class="ouvriers-list">
          @for (entry of entries(); track entry.employeId) {
            <article class="ouvrier-card" [class.ouvrier-card--absent]="entry.mode === 'ABSENT'" [class.ouvrier-card--other]="entry.mode !== 'PRESENT' && entry.mode !== 'ABSENT'">
              <div class="ouvrier-header">
                <label class="sel-wrap">
                  <input type="checkbox" [checked]="selection().has(entry.employeId)" (change)="toggleSelection(entry.employeId, $any($event.target).checked)" />
                </label>
                <span class="ouvrier-nom">{{ entry.employeNom }}</span>
                <div class="mode-buttons">
                  @for (m of modes; track m) {
                    <nf-button variant="ghost" size="sm" class="mode-btn {{ modeCss(m) }}"
                      [class.mode-btn--active]="entry.mode === m"
                      (clicked)="setMode(entry, m)"
                      [attr.aria-label]="'rh.pointage.saisie.modes.modeAria' | translate: { mode: modeLabel(m), nom: entry.employeNom }"
                      [title]="modeLabel(m)">
                      {{ modeEmoji(m) }}
                    </nf-button>
                  }
                </div>
                @if (signatureMode() === 'INDIVIDUEL' && entry.mode === 'PRESENT') {
                  <div class="indiv-sig">
                    @if (signaturesIndiv()[entry.employeId]) {
                      <span class="sig-ok">{{ 'rh.pointage.saisie.signature.indiv.signed' | translate }}</span>
                      <nf-button variant="ghost" size="sm" (clicked)="clearIndivSignature(entry.employeId)">{{ 'rh.pointage.saisie.signature.indiv.clear' | translate }}</nf-button>
                    } @else {
                      <nf-button variant="primary" size="sm" (clicked)="openSignDialog(entry)">{{ 'rh.pointage.saisie.signature.indiv.sign' | translate }}</nf-button>
                    }
                  </div>
                }
              </div>

              @if (entry.mode === 'PRESENT') {
                <div class="horaires">
                  <label>{{ 'rh.pointage.saisie.arrivee' | translate }}
                    <input type="time" [value]="entry.heureArrivee" (change)="entry.heureArrivee = $any($event.target).value" />
                  </label>
                  <label>{{ 'rh.pointage.saisie.depart' | translate }}
                    <input type="time" [value]="entry.heureDepart" (change)="entry.heureDepart = $any($event.target).value" />
                  </label>
                </div>
              }

              @if (entry.mode !== 'PRESENT') {
                <div class="note-row">
                  <input type="text" class="note-input"
                    [placeholder]="'rh.pointage.saisie.modes.notePlaceholder' | translate"
                    [attr.aria-label]="'rh.pointage.saisie.modes.noteAria' | translate: { nom: entry.employeNom }"
                    [value]="entry.notes" (input)="entry.notes = $any($event.target).value" />
                </div>
              }
            </article>
          } @empty {
            <div class="empty-msg">{{ 'rh.pointage.saisie.emptyOuvriers' | translate }}</div>
          }
        </div>

        <div class="validate-bar">
          <div class="summary">
            <span class="summary-item present">{{ 'rh.pointage.saisie.summary.presents' | translate: { count: presentCount() } }}</span>
            <span class="summary-item absent">{{ 'rh.pointage.saisie.summary.absents' | translate: { count: absentCount() } }}</span>
            <span class="summary-item other">{{ 'rh.pointage.saisie.summary.others' | translate: { count: otherCount() } }}</span>
          </div>
          <nf-button variant="primary" (clicked)="valider()" [disabled]="entries().length === 0 || saved()">
            @if (saved()) { {{ 'rh.pointage.saisie.actions.saved' | translate }} } @else { {{ 'rh.pointage.saisie.actions.valider' | translate }} }
          </nf-button>
        </div>
      }
    </nf-page-shell>

    @if (signDialogEmployeId()) {
        <div class="modal-backdrop" (click)="closeSignDialog()">
        <div class="modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <h3 class="modal-title">{{ 'rh.pointage.saisie.signature.dialog.title' | translate: { nom: signDialogNom() } }}</h3>
          <canvas #sigDialog class="sig-canvas" width="440" height="160"
            (pointerdown)="onDialogSignStart($event)"
            (pointermove)="onDialogSignMove($event)"
            (pointerup)="onDialogSignEnd($event)"
            (pointerleave)="onDialogSignEnd($event)"></canvas>
          <div class="modal-actions">
            <nf-button variant="ghost" size="sm" (clicked)="clearDialogSignature()">{{ 'rh.pointage.saisie.signature.dialog.clear' | translate }}</nf-button>
            <nf-button variant="primary" (clicked)="confirmSignDialog()">{{ 'rh.pointage.saisie.signature.dialog.validate' | translate }}</nf-button>
            <nf-button variant="ghost" size="sm" (clicked)="closeSignDialog()">{{ 'rh.pointage.saisie.signature.dialog.cancel' | translate }}</nf-button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .sync-banner { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; padding: 0.75rem 1rem; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 600; }
    .sync-banner--offline { background: var(--nf-color-warning-50); color: var(--nf-color-warning-800); border: 1px solid var(--nf-color-warning-300); }
    .sync-banner--pending { background: var(--nf-color-primary-50); color: var(--nf-color-primary-700); border: 1px solid var(--nf-color-primary-300); }
    .sync-banner--conflict { background: var(--nf-color-danger-50); color: var(--nf-color-danger-700); border: 1px solid var(--nf-color-danger-200); }
    .sync-banner--ok { background: var(--nf-color-success-50); color: var(--nf-color-success-700); border: 1px solid var(--nf-color-success-300); }

    .validation-error { margin-bottom: 0.75rem; padding: 0.65rem 1rem; background: var(--nf-color-danger-50); color: var(--nf-color-danger-700); border-radius: 8px; font-size: 0.875rem; font-weight: 600; border: 1px solid var(--nf-color-danger-200); }

    .controls { display: flex; gap: 0.875rem; align-items: flex-end; flex-wrap: wrap; margin-bottom: 1rem; }
    .control-group { display: flex; flex-direction: column; gap: 4px; }
    .ctrl-label { font-size: 11px; font-weight: 600; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .ctrl-select, .ctrl-input { padding: 8px 12px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 14px; min-width: 220px; background: var(--nf-color-surface); }
    .btn-geoloc { padding: 8px 14px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: var(--nf-color-surface); cursor: pointer; }
    .btn-geoloc:hover { background: var(--nf-color-bg-subtle); }
    .geoloc-badge { background: var(--nf-color-success-100); color: var(--nf-color-success-700); padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; }

    .geofence-panel { margin-bottom: 0.75rem; padding: 0.6rem 0.85rem; border-radius: 8px; font-size: 13px; background: var(--nf-color-success-50); color: var(--nf-color-success-800); border: 1px solid var(--nf-color-success-300); }
    .geofence-panel--bad { background: var(--nf-color-danger-50); color: var(--nf-color-danger-700); border-color: var(--nf-color-danger-200); }
    .geofence-ko { display: block; font-weight: 700; margin-top: 4px; }
    .geofence-warn { font-weight: 600; }

    .team-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 0.75rem; padding: 0.65rem 0.85rem; background: var(--nf-color-bg-muted); border-radius: 8px; border: 1px solid var(--nf-color-border); font-size: 13px; }
    .team-toolbar__title { font-weight: 700; color: var(--nf-color-text-primary); margin-right: 4px; }
    .team-toolbar__sep { color: var(--nf-color-text-secondary); margin-left: 4px; }
    .team-toolbar__count { margin-left: auto; font-weight: 600; color: var(--nf-color-text-secondary); }
    .btn-tool { padding: 4px 10px; border-radius: 6px; border: 1px solid var(--nf-color-border); background: var(--nf-color-surface); font-size: 12px; cursor: pointer; }
    .btn-tool:disabled { opacity: 0.45; cursor: not-allowed; }
    .mode-chip.mode--present { border-color: var(--nf-color-success-600); }
    .mode-chip.mode--absent { border-color: var(--nf-color-danger-600); }

    .photo-row { margin-bottom: 1rem; padding: 0.75rem; background: var(--nf-color-bg-subtle); border-radius: 8px; border: 1px solid var(--nf-color-border); }
    .photo-label { display: block; font-size: 12px; font-weight: 600; color: var(--nf-color-text-secondary); margin-bottom: 6px; }
    .photo-preview { margin-top: 8px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .photo-preview img { max-height: 120px; border-radius: 6px; border: 1px solid var(--nf-color-border); }
    .btn-clear-photo { font-size: 12px; border: none; background: none; color: var(--nf-color-text-secondary); cursor: pointer; text-decoration: underline; }

    .quick-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 1rem; flex-wrap: wrap; padding: 0.75rem; background: var(--nf-color-bg-subtle); border-radius: 8px; }
    .quick-label { font-size: 12px; color: var(--nf-color-text-secondary); font-weight: 600; white-space: nowrap; }
    .quick-btn { padding: 5px 10px; border-radius: 6px; border: 1px solid var(--nf-color-border); font-size: 12px; cursor: pointer; white-space: nowrap; }

    .sig-mode-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 0.5rem; font-size: 13px; }
    .sig-mode-label { font-weight: 700; color: var(--nf-color-text-primary); }
    .radio-inline { display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--nf-color-text-secondary); }

    .sign-block { margin-bottom: 1rem; }
    .hint { font-size: 12px; color: var(--nf-color-text-secondary); margin: 0 0 8px; }
    .sig-canvas { touch-action: none; border: 1px solid var(--nf-color-border); border-radius: 8px; background: var(--nf-color-bg-subtle); max-width: 100%; }

    .ouvriers-list { display: flex; flex-direction: column; gap: 0.625rem; margin-bottom: 5rem; }

    .ouvrier-card { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; padding: 0.875rem 1rem; }
    .ouvrier-card--absent { border-color: var(--nf-color-danger-300); background: var(--nf-color-danger-50); }
    .ouvrier-card--other { border-color: var(--nf-color-warning-200); background: var(--nf-color-warning-50); }
    .ouvrier-header { display: flex; align-items: center; justify-content: flex-start; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
    .sel-wrap { display: flex; align-items: center; margin-right: 4px; }
    .ouvrier-nom { font-weight: 600; font-size: 0.95rem; color: var(--nf-color-text-primary); flex: 1; min-width: 120px; }
    .mode-buttons { display: flex; gap: 4px; flex-wrap: wrap; }
    .mode-btn { width: 34px; height: 34px; border-radius: 8px; border: 2px solid transparent; font-size: 16px; cursor: pointer; background: var(--nf-color-bg-muted); display: flex; align-items: center; justify-content: center; transition: all 80ms; }
    .mode-btn:hover { background: var(--nf-color-border); }
    .mode-btn--active.mode--present  { background: var(--nf-color-success-100); border-color: var(--nf-color-success-600); }
    .mode-btn--active.mode--absent   { background: var(--nf-color-danger-100); border-color: var(--nf-color-danger-600); }
    .mode-btn--active.mode--conge    { background: var(--nf-color-primary-100); border-color: var(--nf-color-primary-500); }
    .mode-btn--active.mode--maladie  { background: var(--nf-color-warning-100); border-color: var(--nf-color-warning-600); }
    .mode-btn--active.mode--formation{ background: var(--nf-color-primary-50); border-color: var(--nf-color-primary-600); }
    .mode-btn--active.mode--autre    { background: var(--nf-color-bg-muted); border-color: var(--nf-color-text-secondary); }

    .indiv-sig { display: flex; align-items: center; gap: 6px; margin-left: auto; }
    .sig-ok { font-size: 12px; font-weight: 700; color: var(--nf-color-success-700); }
    .btn-mini { font-size: 11px; padding: 3px 8px; border-radius: 4px; border: 1px solid var(--nf-color-border); background: var(--nf-color-surface); cursor: pointer; }
    .btn-mini--primary { background: var(--nf-color-primary-600); color: var(--nf-color-primary-contrast); border-color: var(--nf-color-primary-600); }

    .horaires { display: flex; gap: 1rem; flex-wrap: wrap; }
    .horaires label { display: flex; flex-direction: column; gap: 3px; font-size: 11px; color: var(--nf-color-text-secondary); font-weight: 600; }
    .horaires input { padding: 5px 8px; border: 1px solid var(--nf-color-border); border-radius: 5px; font-size: 13px; }
    .note-row { margin-top: 0.4rem; }
    .note-input { width: 100%; padding: 5px 10px; border: 1px solid var(--nf-color-border); border-radius: 5px; font-size: 13px; }

    .validate-bar { position: fixed; bottom: 0; left: 0; right: 0; background: var(--nf-color-surface); border-top: 1px solid var(--nf-color-border); padding: 0.75rem 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; z-index: 50; box-shadow: 0 -2px 8px rgba(0,0,0,0.08); }
    .summary { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .summary-item { font-size: 13px; font-weight: 600; padding: 3px 10px; border-radius: 4px; }
    .summary-item.present { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .summary-item.absent  { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .summary-item.other   { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .btn-validate { padding: 9px 20px; background: var(--nf-color-primary-600); color: var(--nf-color-primary-contrast); border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; white-space: nowrap; }
    .btn-validate:hover { background: var(--nf-color-primary-700); }
    .btn-validate:disabled { background: var(--nf-color-primary-600); opacity: 0.7; }

    .empty-msg { text-align: center; padding: 2.5rem; color: var(--nf-color-text-muted); font-size: 0.9rem; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.45); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal { background: var(--nf-color-surface); border-radius: 12px; padding: 1.25rem; max-width: 96vw; box-shadow: 0 16px 40px rgba(0,0,0,0.18); }
    .modal-title { margin: 0 0 0.75rem; font-size: 1rem; color: var(--nf-color-text-primary); }
    .modal-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  `],
})
export class PointageSaisiePage {
  private readonly pointageService = inject(PointageSaisieService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly photoIdb = inject(PointagePhotoIdbService);
  private readonly translate = inject(TranslateService);

  private readonly chantiersList = signal<Chantier[]>([]);

  private readonly sigCollectiveRef = viewChild<ElementRef<HTMLCanvasElement>>('sigCollective');
  private readonly sigDialogRef = viewChild<ElementRef<HTMLCanvasElement>>('sigDialog');

  readonly modes = MODES;
  readonly geolocTooltip = this.translate.instant('rh.pointage.saisie.geolocTooltip');

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('rh.pointage.saisie.title'),
    subtitle: this.date() + ' — ' + (this.selectedChantier()?.code ?? this.translate.instant('rh.pointage.saisie.subtitleFallback')),
    breadcrumbs: [
      { label: this.translate.instant('rh.common.module'), route: '/rh' },
      { label: this.translate.instant('rh.pointage.title') },
    ],
  }));
  readonly isOnline = this.pointageService.online;
  readonly syncing = this.pointageService.syncing;
  readonly pendingSyncCount = this.pointageService.pendingSyncCount;
  readonly pendingConflictCount = this.pointageService.pendingConflictCount;
  readonly lastSyncedAt = this.pointageService.lastSyncedAt;

  readonly date = signal(new Date().toISOString().slice(0, 10));
  readonly chantierId = signal('');
  readonly geoloc = signal<{ lat: number; lng: number } | null>(null);
  readonly geoLoading = signal(false);
  readonly saved = signal(false);
  readonly photoPreviewUrl = signal<string | null>(null);
  private photoObjectUrl: string | null = null;

  readonly selection = signal<ReadonlySet<string>>(new Set());
  readonly signatureMode = signal<PointageSignatureMode>('COLLECTIF');
  readonly signaturesIndiv = signal<Record<string, string>>({});
  readonly validationError = signal<string | null>(null);

  readonly signDialogEmployeId = signal<string | null>(null);
  readonly signDialogNom = signal('');

  private drawingCollective = false;
  private drawingDialog = false;

  constructor() {
    void this.chantierApi.getAll().then(({ items }) => {
      this.chantiersList.set(items.filter((c) => c.status === 'EN_COURS'));
    });
    effect(() => {
      const d = this.date();
      const cid = this.chantierId();
      if (!cid) {
        this.clearPhotoPreviewOnly();
        return;
      }
      void this.pointageService.loadContext(cid, d);
      void this.loadPhotoFromIdb(d, cid);
    });
  }

  readonly chantiers = computed(() => this.chantiersList());

  readonly selectedChantier = computed(() =>
    this.chantiers().find(c => c.id === this.chantierId()),
  );

  readonly geofenceSite = computed(() => {
    const c = this.selectedChantier();
    if (!c || c.latitude === undefined || c.longitude === undefined) return null;
    return { lat: c.latitude, lng: c.longitude };
  });

  readonly geofenceRadiusM = computed(() => {
    const c = this.selectedChantier();
    return c?.pointageGeofenceM ?? 200;
  });

  readonly distanceM = computed(() => {
    const site = this.geofenceSite();
    const pos = this.geoloc();
    if (!site || !pos) return null;
    return distanceMetres(pos, site);
  });

  readonly distanceLabel = computed(() => {
    const d = this.distanceM();
    return d === null ? '—' : `${Math.round(d)} m`;
  });

  readonly geofenceOk = computed(() => {
    const site = this.geofenceSite();
    if (!site) return true;
    const pos = this.geoloc();
    if (!pos) return false;
    const d = this.distanceM();
    return d !== null && d <= this.geofenceRadiusM();
  });

  readonly entries = computed<SaisieEntry[]>(() => {
    const id = this.chantierId();
    if (!id) return [];
    const affectations = this.pointageService.getAffectationsByChantier(id);
    const existing = this.pointageService.getByDate(this.date(), id);
    return affectations.map(aff => {
      const ex = existing.find(p => p.employeId === aff.employeId);
      return {
        employeId: aff.employeId,
        employeNom: aff.employeNom,
        mode: ex?.mode ?? 'PRESENT',
        heureArrivee: ex?.heureArrivee ?? '07:45',
        heureDepart: ex?.heureDepart ?? '17:00',
        notes: ex?.notes ?? '',
      };
    });
  });

  readonly presentCount = computed(() => this.entries().filter(e => e.mode === 'PRESENT').length);
  readonly absentCount = computed(() => this.entries().filter(e => e.mode === 'ABSENT').length);
  readonly otherCount = computed(() => this.entries().filter(e => e.mode !== 'PRESENT' && e.mode !== 'ABSENT').length);

  onChantierChange(id: string): void {
    this.chantierId.set(id);
    this.selection.set(new Set());
    this.saved.set(false);
    this.validationError.set(null);
  }

  onDateChange(v: string): void {
    this.date.set(v);
    this.selection.set(new Set());
    this.saved.set(false);
  }

  toggleSelection(employeId: string, checked: boolean): void {
    this.selection.update(s => {
      const n = new Set(s);
      if (checked) n.add(employeId);
      else n.delete(employeId);
      return n;
    });
    this.saved.set(false);
  }

  selectAllOuvriers(): void {
    const ids = this.entries().map(e => e.employeId);
    this.selection.set(new Set(ids));
  }

  selectNone(): void {
    this.selection.set(new Set());
  }

  selectPresentOnly(): void {
    const ids = this.entries().filter(e => e.mode === 'PRESENT').map(e => e.employeId);
    this.selection.set(new Set(ids));
  }

  applyModeToSelection(mode: PointageMode): void {
    const sel = this.selection();
    if (sel.size === 0) return;
    for (const e of this.entries()) {
      if (sel.has(e.employeId)) {
        e.mode = mode;
      }
    }
    this.saved.set(false);
  }

  setSignatureMode(m: PointageSignatureMode): void {
    this.signatureMode.set(m);
    if (m === 'COLLECTIF') {
      this.signaturesIndiv.set({});
    } else {
      this.clearCollectiveSignature();
    }
    this.validationError.set(null);
  }

  captureGeoloc(): void {
    this.geoLoading.set(true);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        this.geoloc.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        this.geoLoading.set(false);
        this.validationError.set(null);
      },
      () => {
        this.geoLoading.set(false);
        this.validationError.set(this.translate.instant('rh.pointage.saisie.errors.geolocRefused'));
      },
    );
  }

  setMode(entry: SaisieEntry, mode: PointageMode): void {
    entry.mode = mode;
    this.saved.set(false);
  }

  setAll(mode: PointageMode): void {
    this.entries().forEach(e => e.mode = mode);
    this.saved.set(false);
  }

  private readCollectiveDataUrl(): string | undefined {
    const c = this.sigCollectiveRef()?.nativeElement;
    if (!c) return undefined;
    const url = c.toDataURL('image/png');
    return url.length > 400 ? url : undefined;
  }

  valider(): void {
    this.validationError.set(null);
    const id = this.chantierId();
    const c = this.selectedChantier();
    if (!id || !c) return;

    if (this.geofenceSite() && !this.geofenceOk()) {
      this.validationError.set(this.translate.instant('rh.pointage.saisie.errors.geofenceOff'));
      return;
    }

    const mode = this.signatureMode();
    if (mode === 'COLLECTIF') {
      const sig = this.readCollectiveDataUrl();
      if (!sig) {
        this.validationError.set(this.translate.instant('rh.pointage.saisie.errors.signatureCollectiveRequired'));
        return;
      }
      this.persistBatch(c, sig, 'COLLECTIF', undefined);
      return;
    }

    const indiv = this.signaturesIndiv();
    const missing = this.entries().filter(e => e.mode === 'PRESENT' && !indiv[e.employeId]);
    if (missing.length > 0) {
      this.validationError.set(this.translate.instant('rh.pointage.saisie.errors.signaturesMissing', { count: missing.length }));
      return;
    }
    this.persistBatch(c, undefined, 'INDIVIDUEL', indiv);
  }

  private persistBatch(
    c: { id: string; code: string },
    collective: string | undefined,
    sigMode: PointageSignatureMode,
    byEmp: Record<string, string> | undefined,
  ): void {
    this.pointageService.saveJournee(this.date(), c.id, c.code, this.entries(), {
      geoloc: this.geoloc() ?? undefined,
      journeeBatchId: newBatchId(),
      signatureMode: sigMode,
      signatureCollectiveDataUrl: collective,
      signaturesByEmployeId: byEmp,
    });
    this.saved.set(true);
  }

  async onPhotoSelected(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    const id = this.chantierId();
    const d = this.date();
    if (!file || !id) return;
    try {
      const blob = await this.photoIdb.compressImageFile(file);
      const key = this.photoIdb.photoKey(d, id);
      await this.photoIdb.savePhoto(key, blob);
      if (this.photoObjectUrl) URL.revokeObjectURL(this.photoObjectUrl);
      this.photoObjectUrl = URL.createObjectURL(blob);
      this.photoPreviewUrl.set(this.photoObjectUrl);
      await this.pointageService.refreshPhotoPending();
    } catch {
      /* IndexedDB / canvas indisponible */
    }
  }

  clearPhoto(): void {
    const id = this.chantierId();
    const d = this.date();
    if (id) {
      void this.photoIdb.deletePhoto(this.photoIdb.photoKey(d, id)).then(() => this.pointageService.refreshPhotoPending());
    }
    this.clearPhotoPreviewOnly();
  }

  private clearPhotoPreviewOnly(): void {
    if (this.photoObjectUrl) URL.revokeObjectURL(this.photoObjectUrl);
    this.photoObjectUrl = null;
    this.photoPreviewUrl.set(null);
  }

  private async loadPhotoFromIdb(date: string, chantierId: string): Promise<void> {
    try {
      const row = await this.photoIdb.getPhoto(this.photoIdb.photoKey(date, chantierId));
      if (row?.blob && row.blob.size > 0) {
        if (this.photoObjectUrl) URL.revokeObjectURL(this.photoObjectUrl);
        this.photoObjectUrl = URL.createObjectURL(row.blob);
        this.photoPreviewUrl.set(this.photoObjectUrl);
      } else {
        this.clearPhotoPreviewOnly();
      }
    } catch {
      this.clearPhotoPreviewOnly();
    }
  }

  private inkStrokeColor(): string {
    return getComputedStyle(document.documentElement).getPropertyValue('--nf-color-text-primary').trim();
  }

  onCollectiveSignStart(ev: PointerEvent): void {
    const canvas = this.sigCollectiveRef()?.nativeElement;
    if (!canvas) return;
    canvas.setPointerCapture(ev.pointerId);
    this.drawingCollective = true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const r = canvas.getBoundingClientRect();
    const x = ev.clientX - r.left;
    const y = ev.clientY - r.top;
    ctx.strokeStyle = this.inkStrokeColor();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  onCollectiveSignMove(ev: PointerEvent): void {
    if (!this.drawingCollective) return;
    const canvas = this.sigCollectiveRef()?.nativeElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const r = canvas.getBoundingClientRect();
    ctx.lineTo(ev.clientX - r.left, ev.clientY - r.top);
    ctx.stroke();
  }

  onCollectiveSignEnd(ev: PointerEvent): void {
    if (!this.drawingCollective) return;
    this.drawingCollective = false;
    try {
      this.sigCollectiveRef()?.nativeElement.releasePointerCapture(ev.pointerId);
    } catch { /* noop */ }
  }

  clearCollectiveSignature(): void {
    const canvas = this.sigCollectiveRef()?.nativeElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  openSignDialog(entry: SaisieEntry): void {
    this.signDialogEmployeId.set(entry.employeId);
    this.signDialogNom.set(entry.employeNom);
    queueMicrotask(() => this.clearDialogSignature());
  }

  closeSignDialog(): void {
    this.signDialogEmployeId.set(null);
    this.signDialogNom.set('');
  }

  onDialogSignStart(ev: PointerEvent): void {
    const canvas = this.sigDialogRef()?.nativeElement;
    if (!canvas) return;
    canvas.setPointerCapture(ev.pointerId);
    this.drawingDialog = true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const r = canvas.getBoundingClientRect();
    ctx.strokeStyle = this.inkStrokeColor();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ev.clientX - r.left, ev.clientY - r.top);
  }

  onDialogSignMove(ev: PointerEvent): void {
    if (!this.drawingDialog) return;
    const canvas = this.sigDialogRef()?.nativeElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const r = canvas.getBoundingClientRect();
    ctx.lineTo(ev.clientX - r.left, ev.clientY - r.top);
    ctx.stroke();
  }

  onDialogSignEnd(ev: PointerEvent): void {
    if (!this.drawingDialog) return;
    this.drawingDialog = false;
    try {
      this.sigDialogRef()?.nativeElement.releasePointerCapture(ev.pointerId);
    } catch { /* noop */ }
  }

  clearDialogSignature(): void {
    const canvas = this.sigDialogRef()?.nativeElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  confirmSignDialog(): void {
    const eid = this.signDialogEmployeId();
    const canvas = this.sigDialogRef()?.nativeElement;
    if (!eid || !canvas) return;
    const url = canvas.toDataURL('image/png');
    if (url.length <= 400) {
      this.validationError.set(this.translate.instant('rh.pointage.saisie.errors.signatureTooShort'));
      return;
    }
    this.signaturesIndiv.update(m => ({ ...m, [eid]: url }));
    this.closeSignDialog();
    this.saved.set(false);
    this.validationError.set(null);
  }

  clearIndivSignature(employeId: string): void {
    this.signaturesIndiv.update(m => {
      const next = { ...m };
      delete next[employeId];
      return next;
    });
    this.saved.set(false);
  }

  modeLabel(m: PointageMode): string { return this.translate.instant(MODE_KEYS[m]); }
  modeEmoji(m: PointageMode): string { return MODE_EMOJI[m]; }
  modeCss(m: PointageMode): string { return MODE_CSS[m]; }
}
