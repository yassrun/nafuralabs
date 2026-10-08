import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  Type,
  computed,
  forwardRef,
  inject,
  input,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import { ActivatedRoute, Router, type CanDeactivateFn, type Route } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '../../core/config/api-config.service';
import { PermissionService } from '../../core/security/services/permission.service';
import { BadgeComponent } from '../../lib/anatomy/components/atoms/badge';
import { ButtonComponent } from '../../lib/anatomy/components/atoms/button';
import { ActionMenuComponent } from '../../lib/anatomy/components/molecules/action-menu';
import { ErrorStateComponent } from '../../lib/anatomy/components/molecules/error-state';
import { LoadingStateComponent } from '../../lib/anatomy/components/molecules/loading-state';
import { SaveBarComponent } from '../../lib/anatomy/components/molecules/save-bar';
import { TabsComponent, type TabItem } from '../../lib/anatomy/components/molecules/tabs';
import { FormComponent } from '../../lib/anatomy/components/organisms/form';
import { ScreenComponent } from '../../lib/anatomy/components/organisms/page-screen';
import { StatusPipelineComponent, type PipelineStep } from '../../lib/anatomy/components/organisms/status-pipeline';
import { ConfirmDialogService } from '../../lib/anatomy/components/services/confirm-dialog.service';
import { ToastService } from '../../lib/anatomy/components/services/toast.service';
import type { BadgeVariant, FormFieldConfig, LookupContext } from '../../lib/anatomy/types';
import { AuditTimelineComponent } from '../../features/collaboration/audit';
import { ListingPageComponent } from '../listing/listing-page.component';
import { HOST_CAPABILITIES } from '../host/host-capabilities';
import { ruleRefusal } from '../page-action';
import { RecordCollaborationComponent } from './record-collaboration.component';
import type { ListingPageConfig, Row } from '../listing/listing-page.types';
import type { RecordProperties } from '../listing/listing-properties';
import { resolveRecordField } from './form-field-from-property';
import type { RecordAction, RecordField, RecordPageConfig, RecordSection } from './record-page.types';
import { RECORD_SECTION, type RecordSectionContext, type ScreenLoader } from './record-section.context';
import { RecordScreenHostComponent } from './record-screen-host.component';

interface LifecycleState {
  id: string;
  label: string;
  tone?: BadgeVariant;
}
interface LifecycleDeclaration {
  entity?: string;
  initial: string;
  editable?: string[];
  /** Per-status allow-list; the form locks every other field. */
  editableFields?: Record<string, string[]>;
  states: LifecycleState[];
}
interface Transition {
  id: string;
  label: string;
  to: string;
  approval: boolean;
}

/** A section ready to render: form fields with their span, or the related list of the saved record. */
interface SectionView {
  title?: string;
  description?: string;
  fields: FormFieldConfig[];
  columns: number;
  listing: ListingPageConfig | null;
  collaboration: 'attachments' | 'comments' | null;
  audit: boolean;
  accept: string[];
  maxSizeMb?: number;
  screen?: Type<unknown>;
  loadScreen?: ScreenLoader;
  screenPending?: boolean;
}
interface PanelView {
  id: string;
  label: string;
  sections: SectionView[];
  states?: string[];
}

/**
 * A whole record screen from a `RecordPageConfig` (route data `record`, param `id`, `new` to create):
 * toolbar (status, transitions, delete), sections / tabs / steps, related lists, contextual save bar.
 */
@Component({
  selector: 'nf-record-page',
  standalone: true,
  imports: [
    TranslateModule,
    ScreenComponent,
    FormComponent,
    BadgeComponent,
    ButtonComponent,
    ActionMenuComponent,
    TabsComponent,
    StatusPipelineComponent,
    SaveBarComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    ListingPageComponent,
    RecordCollaborationComponent,
    AuditTimelineComponent,
    RecordScreenHostComponent,
  ],
  providers: [
    {
      provide: RECORD_SECTION,
      useFactory: (page: RecordPageComponent): RecordSectionContext => page.sectionContext(),
      deps: [forwardRef(() => RecordPageComponent)],
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-screen [header]="header()">
      @if (loading()) {
        <nf-loading-state />
      } @else if (failed()) {
        <nf-error-state [title]="'Unable to load data' | translate" (retry)="load()" />
      } @else {
        <div class="nf-record">
          <div class="nf-record__toolbar">
            <div class="nf-record__status">
              @if (state(); as current) {
                <nf-badge [variant]="current.tone ?? 'default'" size="md" rounded>{{ current.label | translate }}</nf-badge>
              }
              @if (!creating() && !editable() && canUpdate()) {
                <span class="nf-record__readonly">{{ 'record.locked' | translate }}</span>
              }
            </div>
            <div class="nf-record__actions">
              @if (showImport()) {
                <nf-button variant="secondary" size="sm" icon="file-up" (clicked)="pickImport()">{{ config().import!.label | translate }}</nf-button>
                <input #importFile type="file" hidden [attr.accept]="importAccept()" (change)="onImport($event)" />
              }
              @for (transition of transitions(); track transition.id; let first = $first) {
                <nf-button
                  [variant]="first ? 'primary' : 'secondary'"
                  size="sm"
                  [disabled]="dirty() || busy()"
                  [tooltip]="dirty() ? ('record.saveFirst' | translate) : ''"
                  (clicked)="fire(transition)">
                  {{ transition.label | translate }}
                </nf-button>
              }
              @for (action of toolbarActions(); track action.id) {
                <nf-button
                  [variant]="action.variant ?? 'secondary'"
                  size="sm"
                  [icon]="action.icon"
                  [loading]="busyId() === action.id"
                  [disabled]="actionBlocked(action)"
                  [tooltip]="actionBlocked(action) ? ('record.saveFirst' | translate) : ''"
                  (clicked)="runAction(action)">
                  {{ action.label | translate }}
                </nf-button>
              }
              @if (menu().length) {
                <nf-action-menu size="sm" [nodes]="menu()" [disabled]="busy()" (actionClick)="onMenu($event)" />
              }
            </div>
          </div>

          @switch (layoutKind()) {
            @case ('tabs') {
              <nf-tabs [tabs]="tabItems()" [activeTab]="activePanel()" (tabChange)="activePanel.set($event)" />
            }
            @case ('steps') {
              <nf-status-pipeline class="nf-record__steps" [steps]="stepItems()" (stepClick)="openStep($event)" />
            }
          }

          @for (panel of panels(); track panel.id) {
            <div class="nf-record__panel" [hidden]="panels().length > 1 && panel.id !== activePanel()">
              @for (section of panel.sections; track $index) {
                <section class="nf-record__section">
                  @if (section.title) {
                    <header class="nf-record__section-header">
                      <h3>{{ section.title | translate }}</h3>
                      @if (section.description) {
                        <p>{{ section.description | translate }}</p>
                      }
                    </header>
                  }
                  @if (section.fields.length) {
                    <nf-form
                      [fields]="section.fields"
                      [values]="formValues()"
                      [record]="mergedRecord()"
                      [columns]="section.columns"
                      layout="grid"
                      [lookups]="lookups()"
                      [disabled]="!editable()"
                      [actions]="false"
                      (valueChange)="patch($event)" />
                    @for (hint of hintsOf(section); track hint.field) {
                      <p class="nf-record__hint">{{ hint.label | translate }}</p>
                    }
                  }
                  @if (section.collaboration && recordId(); as saved) {
                    <nf-record-collaboration
                      [kind]="section.collaboration"
                      [entityType]="entityType()"
                      [entityId]="saved"
                      [canUpdate]="canUpdate()"
                      [title]="section.title ?? ''"
                      [accept]="section.accept"
                      [maxSizeMb]="section.maxSizeMb" />
                  }
                  @if (section.audit && recordId(); as audited) {
                    <nf-audit-timeline
                      [entityType]="entityType()"
                      [entityId]="audited"
                      [refreshToken]="auditRefresh()" />
                  }
                  @if (section.screen || section.loadScreen) {
                    <nf-record-screen-host [screen]="section.screen" [loadScreen]="section.loadScreen" />
                  } @else if (section.listing; as listing) {
                    <nf-listing-page class="nf-record__listing" [listing]="listing" [embedded]="true" />
                  } @else if (section.screenPending) {
                    <p class="nf-record__after-save">{{ 'record.availableAfterSave' | translate }}</p>
                  } @else if (!section.fields.length && !(section.collaboration && recordId()) && !(section.audit && recordId())) {
                    <p class="nf-record__after-save">{{ 'record.availableAfterSave' | translate }}</p>
                  }
                </section>
              }
            </div>
          }

          @if (wizard()) {
            <div class="nf-record__wizard">
              <nf-button variant="secondary" size="sm" (clicked)="leave()">{{ 'Cancel' | translate }}</nf-button>
              <div class="nf-record__wizard-steps">
                @if (stepIndex() > 0) {
                  <nf-button variant="secondary" size="sm" icon="chevron-left" (clicked)="previousStep()">{{ 'Previous' | translate }}</nf-button>
                }
                @if (stepIndex() < panels().length - 1) {
                  <nf-button variant="primary" size="sm" icon="chevron-right" (clicked)="nextStep()">{{ 'Next' | translate }}</nf-button>
                } @else {
                  <nf-button variant="primary" size="sm" [loading]="busy()" (clicked)="save()">{{ 'record.create' | translate }}</nf-button>
                }
              </div>
            </div>
          } @else {
            <nf-save-bar
              [visible]="creating() || dirty()"
              [saving]="busy()"
              [message]="creating() ? 'record.new' : 'record.unsaved'"
              [saveLabel]="creating() ? 'record.create' : 'Save'"
              [discardLabel]="creating() ? 'Cancel' : 'record.discard'"
              (save)="save()"
              (discard)="creating() ? leave() : discard()" />
          }
        </div>
      }
    </nf-screen>
  `,
  styles: `
    :host { display: block; height: 100%; }
    .nf-record { display: flex; flex-direction: column; gap: 16px; max-width: 1120px; padding-bottom: 8px; }
    .nf-record__toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; min-height: 32px; }
    .nf-record__status { display: flex; align-items: center; gap: 10px; }
    .nf-record__readonly { font-size: 0.8125rem; color: var(--nf-text-muted, #6b7280); }
    .nf-record__actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
    .nf-record__panel { display: flex; flex-direction: column; gap: 16px; }
    .nf-record__panel[hidden] { display: none; }
    .nf-record__section {
      padding: 20px;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: var(--nf-radius-lg, 12px);
      background: var(--nf-surface-section, #fff);
    }
    .nf-record__section-header { margin-bottom: 16px; }
    .nf-record__section-header h3 { margin: 0; font-size: 1rem; font-weight: 600; color: var(--nf-text-primary, #111827); }
    .nf-record__section-header p { margin: 4px 0 0; font-size: 0.8125rem; color: var(--nf-text-muted, #6b7280); }
    .nf-record__listing { display: block; min-height: 220px; }
    .nf-record__after-save { margin: 0; font-size: 0.875rem; color: var(--nf-text-muted, #6b7280); }
    .nf-record__hint { margin: 6px 0 0; font-size: 0.75rem; color: var(--nf-color-warning-700, #b45309); }
    .nf-record__wizard { display: flex; justify-content: space-between; gap: 8px; padding-top: 4px; }
    .nf-record__wizard-steps { display: flex; gap: 8px; }
  `,
})
export class RecordPageComponent {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiConfigService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly permissions = inject(PermissionService);
  private readonly dialogs = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly recordInput = input<RecordPageConfig | undefined>(undefined, { alias: 'record' });
  readonly config = computed(() => {
    const config = this.recordInput() ?? (this.route.snapshot.data['record'] as RecordPageConfig | undefined);
    if (!config) throw new Error('nf-record-page needs a RecordPageConfig (input or route data "record").');
    return config;
  });

  private readonly forms = viewChildren(FormComponent);

  readonly id = signal<string | null>(null);
  readonly record = signal<Row | null>(null);
  /** Values given to the forms: changes only on load, save and discard (typing does not rebuild the forms). */
  readonly formValues = signal<Row>({});
  /** Edits not saved yet. */
  readonly draft = signal<Row>({});
  readonly lookups = signal<LookupContext>({});
  /** `GET {endpoint}/properties` — used to deduce form field types when omitted. */
  readonly properties = signal<RecordProperties>({});
  readonly lifecycle = signal<LifecycleDeclaration | null>(null);
  readonly transitions = signal<Transition[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly busy = signal(false);
  readonly busyId = signal<string | null>(null);
  /** Bumped after save/transition so the Activité section reloads. */
  readonly auditRefresh = signal(0);
  readonly activePanel = signal('');
  /** Field key → marker after an extraction (`extracted` or `check`). */
  readonly extracted = signal<Record<string, 'extracted' | 'check'>>({});
  private pendingFile: File | null = null;
  private readonly capabilities = inject(HOST_CAPABILITIES, { optional: true });

  readonly creating = computed(() => this.id() === null);
  readonly canUpdate = computed(() => this.allowed(this.config().permissions.update));

  readonly dirty = computed(() => {
    const draft = this.draft();
    const record = this.record() ?? {};
    return Object.keys(draft).some((key) => !same(draft[key], record[key]));
  });

  readonly state = computed(() => {
    const status = this.record()?.['status'];
    return this.lifecycle()?.states.find((s) => s.id === status) ?? null;
  });

  readonly editable = computed(() => {
    if (this.creating()) return this.allowed(this.config().permissions.create);
    const saved = this.record();
    if (saved && this.config().readonlyWhen?.(saved as never)) return false;
    return this.canUpdate() && this.editableState();
  });

  /** Merged record (saved + draft) for screen sections and field conditions. */
  readonly mergedRecord = computed((): Row => ({ ...(this.record() ?? {}), ...this.draft() }));

  /**
   * Stable key of visibility / lock / required outcomes. Panels rebuild only when a
   * condition flips (status, country, …), not on every keystroke (avoids NG0100 / focus loss).
   */
  private readonly conditionKey = computed(() => {
    const record = this.mergedRecord();
    const lifecycle = this.lifecycle();
    const status = String(record['status'] ?? '');
    const parts: string[] = [`status:${status}`];
    const allowed = lifecycle?.editableFields?.[status];
    if (allowed) parts.push(`ef:${allowed.join(',')}`);
    for (const section of this.allSections()) {
      if (section.visible) parts.push(`s:${section.title ?? ''}:${section.visible(record) !== false}`);
      for (const field of section.fields ?? []) {
        if (field.visible) parts.push(`v:${field.key}:${field.visible(record) !== false}`);
        if (field.locked) parts.push(`l:${field.key}:${!!field.locked(record)}`);
        if (field.requiredWhen) parts.push(`r:${field.key}:${!!field.requiredWhen(record)}`);
      }
    }
    return parts.join('|');
  });

  /** Injection surface for `kind: 'screen'` section components. */
  sectionContext(): RecordSectionContext {
    return {
      record: this.mergedRecord,
      saved: this.record.asReadonly(),
      editable: this.editable,
      patch: (values) => this.patch(values as Row),
      reload: () => this.load(),
    };
  }

  readonly header = computed(() => {
    const config = this.config();
    const record = this.record();
    const title = record ? config.title(record as never) : this.creating() ? this.translate.instant(config.createTitle) : '';
    return {
      title,
      subtitle: record ? config.subtitle?.(record as never) : undefined,
      icon: config.icon,
      breadcrumbs: [{ label: config.back.label, route: config.back.route }, { label: title }],
    };
  });

  /** The layout in use: `createLayout` while creating when declared. */
  private readonly layout = computed(() => (this.creating() && this.config().createLayout) || this.config().layout);

  readonly layoutKind = computed(() => this.layout()?.kind ?? 'sections');

  /** Panels: one for sections, one per tab or step. Related lists exist once the record is saved.
   *  Structure rebuilds when the record id or a field/section condition flips — not on every keystroke. */
  private readonly recordId = computed(() => (this.record()?.['id'] as string | undefined) ?? null);
  readonly panels = computed((): PanelView[] => {
    this.conditionKey();
    const layout = this.layout();
    const saved = this.recordId() ? untracked(() => this.record()) : null;
    const draft = untracked(() => this.mergedRecord());
    const view = (sections: RecordSection[]) =>
      sections
        .map((section) => this.sectionView(section, saved, draft))
        .filter((section): section is SectionView => section != null);
    if (!layout || layout.kind === 'sections') return [{ id: 'main', label: '', sections: view(layout?.sections ?? []) }];
    if (layout.kind === 'tabs') return layout.tabs.map((tab) => ({ id: tab.id, label: tab.label, sections: view(tab.sections) }));
    return layout.steps.map((step) => ({ id: step.id, label: step.label, sections: view(step.sections), states: step.states }));
  });

  readonly tabItems = computed((): TabItem[] =>
    this.panels().map((panel) => ({ id: panel.id, label: this.translate.instant(panel.label) })),
  );

  /** Steps without lifecycle while creating: a wizard. */
  readonly wizard = computed(() => this.layoutKind() === 'steps' && this.creating() && !this.config().lifecycle);

  readonly stepIndex = computed(() => Math.max(0, this.panels().findIndex((panel) => panel.id === this.activePanel())));

  /** Index of the step the record is in: its status (lifecycle), or the furthest step reached (wizard). */
  private readonly reachedStep = signal(0);
  readonly currentStep = computed(() => {
    if (!this.config().lifecycle) return this.reachedStep();
    if (this.creating()) return 0;
    const status = String(this.record()?.['status'] ?? '');
    return Math.max(0, this.panels().findIndex((panel) => panel.states?.includes(status)));
  });

  readonly stepItems = computed((): PipelineStep[] =>
    this.panels().map((panel, index) => ({
      id: panel.id,
      label: this.translate.instant(panel.label),
      status: index < this.currentStep() ? 'done' : index === this.currentStep() ? 'current' : 'pending',
    })),
  );

  readonly menu = computed(() => {
    const config = this.config();
    const record = this.record();
    const nodes = this.visibleActions()
      .filter((action) => action.placement === 'menu')
      .map((action) => ({ id: `action:${action.id}`, label: this.translate.instant(action.label), icon: action.icon, danger: false, disabled: this.actionBlocked(action) }));
    const canDelete = !this.creating() && this.allowed(config.permissions.delete) && this.editableState();
    if (canDelete) nodes.push({ id: 'delete', label: this.translate.instant('Delete'), icon: 'trash-2', danger: true, disabled: false });
    return record || canDelete ? nodes : nodes;
  });

  readonly toolbarActions = computed(() => this.visibleActions().filter((action) => action.placement !== 'menu'));

  readonly entityType = computed(() => this.lifecycle()?.entity ?? this.config().endpoint.split('/').filter(Boolean).pop() ?? 'record');

  readonly showImport = computed(() => {
    const imported = this.config().import;
    if (!imported || !this.creating() || !this.allowed(this.config().permissions.create)) return false;
    const caps = this.capabilities;
    if (!caps) return true;
    const endpoint = 'endpoint' in imported.docType;
    if (endpoint) return true;
    return caps.includes('cap.document-extraction') && caps.includes('cap.ai');
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.id.set(!id || id === 'new' ? null : id);
      void this.load();
    });
  }

  async load(): Promise<void> {
    const config = this.config();
    this.loading.set(true);
    this.failed.set(false);
    try {
      const [record, lookups, lifecycle, properties] = await Promise.all([
        this.id() ? firstValueFrom(this.http.get<Row>(this.url(`${config.endpoint}/${this.id()}`))) : Promise.resolve(null),
        this.loadLookups(),
        config.lifecycle ? firstValueFrom(this.http.get<LifecycleDeclaration>(this.url(`${config.endpoint}/lifecycle`))) : Promise.resolve(null),
        firstValueFrom(this.http.get<RecordProperties>(this.url(`${config.endpoint}/properties`))).catch(() => ({})),
      ]);
      if (!this.id() && !this.allowed(config.permissions.create)) {
        this.toast.warning(this.translate.instant('Access denied'));
        void this.router.navigateByUrl(config.back.route);
        return;
      }
      this.properties.set(properties);
      this.lookups.set({ ...lookups, ...(await this.relationLookups(properties, lookups)) });
      this.lifecycle.set(lifecycle);
      this.show(record);
      await this.loadTransitions();
      const panels = this.panels();
      const opened = this.layoutKind() === 'steps' ? this.currentStep() : 0;
      this.activePanel.set(panels[opened]?.id ?? '');
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  /** A form changed: keep the edit (dates as yyyy-MM-dd for the API). */
  patch(values: Row): void {
    const normalized: Row = {};
    for (const [key, value] of Object.entries(values)) normalized[key] = value instanceof Date ? isoDate(value) : value;
    this.draft.update((draft) => ({ ...draft, ...normalized }));
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (this.creating() || this.dirty()) void this.save();
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirty()) event.preventDefault();
  }

  async save(): Promise<void> {
    if (this.busy() || !this.editable()) return;
    if (!this.validate(this.forms())) {
      this.toast.warning(this.translate.instant('record.invalid'));
      return;
    }
    const config = this.config();
    const body = this.saveBody();
    this.busy.set(true);
    try {
      if (this.creating()) {
        const created = await firstValueFrom(this.http.post<Row>(this.url(config.endpoint), body));
        if (this.pendingFile) await this.attachImported(String(created['id']), this.pendingFile);
        this.pendingFile = null;
        this.draft.set({});
        this.toast.success(this.translate.instant(config.messages?.created ?? 'record.created'));
        void this.router.navigateByUrl(config.route(String(created['id'])), { replaceUrl: true });
      } else {
        const saved = await firstValueFrom(this.http.put<Row>(this.url(`${config.endpoint}/${this.id()}`), body));
        this.show(saved);
        this.toast.success(this.translate.instant(config.messages?.saved ?? 'record.saved'));
        await this.loadTransitions();
        this.auditRefresh.update((n) => n + 1);
      }
    } catch (error) {
      this.toast.error(this.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  discard(): void {
    this.show(this.record());
  }

  leave(): void {
    void this.router.navigateByUrl(this.config().back.route);
  }

  async fire(transition: Transition): Promise<void> {
    if (this.dirty()) return;
    this.busy.set(true);
    try {
      const record = await firstValueFrom(
        this.http.post<Row>(this.url(`${this.config().endpoint}/${this.id()}/transitions/${transition.id}`), {}),
      );
      this.show(record);
      await this.loadTransitions();
      this.auditRefresh.update((n) => n + 1);
      const reached = this.state();
      this.toast.success(
        this.translate.instant(transition.approval && record['status'] === transition.to ? 'record.awaitingApproval' : 'record.transitioned', {
          state: reached ? this.translate.instant(reached.label) : '',
        }),
      );
      const panels = this.panels();
      if (this.layoutKind() === 'steps') this.activePanel.set(panels[this.currentStep()]?.id ?? this.activePanel());
    } catch (error) {
      this.revealMissing(error);
      this.toast.error(this.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  async onMenu(id: string): Promise<void> {
    if (id.startsWith('action:')) {
      const action = this.visibleActions().find((candidate) => candidate.id === id.slice('action:'.length));
      if (action) await this.runAction(action);
      return;
    }
    if (id !== 'delete') return;
    const config = this.config();
    const confirmed = await this.dialogs.confirm({
      title: this.translate.instant('Delete'),
      message: this.translate.instant(config.messages?.deleteConfirm ?? 'record.deleteConfirm'),
      confirmLabel: this.translate.instant('Delete'),
      variant: 'danger',
    });
    if (!confirmed) return;
    this.busy.set(true);
    try {
      await firstValueFrom(this.http.delete(this.url(`${config.endpoint}/${this.id()}`)));
      this.draft.set({});
      this.toast.success(this.translate.instant(config.messages?.deleted ?? 'record.deleted'));
      void this.router.navigateByUrl(config.back.route);
    } catch (error) {
      this.toast.error(this.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  /** Done and current steps open; so does the next one, which usually holds what the next transition needs. */
  openStep(step: PipelineStep): void {
    const index = this.panels().findIndex((panel) => panel.id === step.id);
    if (step.status !== 'pending' || (!this.wizard() && index === this.currentStep() + 1)) this.activePanel.set(step.id);
  }

  nextStep(): void {
    const index = this.stepIndex();
    const forms = this.forms().filter((form) => this.panelOf(form) === index);
    if (!this.validate(forms)) return;
    const next = this.panels()[index + 1];
    if (!next) return;
    this.reachedStep.update((reached) => Math.max(reached, index + 1));
    this.activePanel.set(next.id);
  }

  previousStep(): void {
    const previous = this.panels()[this.stepIndex() - 1];
    if (previous) this.activePanel.set(previous.id);
  }

  /** Route guard: leaving with unsaved changes asks first. */
  async canLeave(): Promise<boolean> {
    if (!this.dirty()) return true;
    return this.dialogs.confirm({
      title: this.translate.instant('record.leaveTitle'),
      message: this.translate.instant('record.leaveMessage'),
      confirmLabel: this.translate.instant('record.leave'),
      variant: 'danger',
    });
  }

  private show(record: Row | null): void {
    this.record.set(record);
    this.draft.set({});
    this.formValues.set({ ...(this.config().defaults ?? {}), ...(record ?? {}) });
  }

  private async attachImported(id: string, file: File): Promise<void> {
    const body = new FormData();
    body.append('file', file);
    body.append('entityType', this.entityType());
    body.append('entityId', id);
    try {
      await firstValueFrom(this.http.post(this.url('/api/v1/platform/collaboration/attachments/upload'), body));
    } catch {
      this.toast.warning(this.translate.instant('record.attachFailed'));
    }
  }

  private async loadTransitions(): Promise<void> {
    if (!this.config().lifecycle || !this.id()) {
      this.transitions.set([]);
      return;
    }
    this.transitions.set(await firstValueFrom(this.http.get<Transition[]>(this.url(`${this.config().endpoint}/${this.id()}/transitions`))));
  }

  private async loadLookups(): Promise<LookupContext> {
    const entries = Object.entries(this.config().lookups ?? {});
    const loaded = await Promise.all(
      entries.map(async ([key, url]) => {
        const options = await firstValueFrom(this.http.get<{ value: unknown; label: unknown }[]>(this.url(url)));
        return [key, options.map((option) => ({ key: option.value as string, value: String(option.label ?? '') }))] as const;
      }),
    );
    return Object.fromEntries(loaded);
  }

  /**
   * For fields without an explicit type whose property is a `relation`,
   * `resolveRecordField` sets `lookupKey` to the field key — load `/options` if not already in lookups.
   */
  private async relationLookups(properties: RecordProperties, existing: LookupContext): Promise<LookupContext> {
    const needed = new Map<string, string>();
    for (const field of this.configFields()) {
      if (field.type || field.lookupKey || field.options?.length) continue;
      const property = properties[field.field] ?? properties[field.key];
      if (property?.type !== 'relation' || !property.options || existing[field.key]) continue;
      needed.set(field.key, property.options);
    }
    const loaded = await Promise.all(
      [...needed.entries()].map(async ([key, path]) => {
        const options = await firstValueFrom(this.http.get<{ value: unknown; label: unknown }[]>(this.url(path))).catch(() => []);
        return [key, options.map((option) => ({ key: option.value as string, value: String(option.label ?? '') }))] as const;
      }),
    );
    return Object.fromEntries(loaded);
  }

  private allSections(): RecordSection[] {
    const layout = (this.creating() && this.config().createLayout) || this.config().layout;
    if (!layout || layout.kind === 'sections') return layout?.sections ?? [];
    if (layout.kind === 'tabs') return layout.tabs.flatMap((tab) => tab.sections);
    return layout.steps.flatMap((step) => step.sections);
  }

  private configFields(): RecordField[] {
    return this.allSections().flatMap((section) => section.fields ?? []);
  }

  /** Body for create/update: drop `computed` keys (display only, never stored). */
  private saveBody(): Row {
    const config = this.config();
    const body: Row = { ...(config.defaults ?? {}), ...(this.record() ?? {}), ...this.draft() };
    for (const field of this.configFields()) {
      if (field.type === 'computed') {
        delete body[field.field];
        delete body[field.key];
      }
    }
    return body;
  }

  private sectionView(section: RecordSection, saved: Row | null, draft: Row): SectionView | null {
    if (section.visible && section.visible(draft) === false) return null;
    const columns = section.columns ?? 2;
    const properties = this.properties();
    const status = String(draft['status'] ?? '');
    const allowed = this.lifecycle()?.editableFields?.[status];
    const fields = (section.fields ?? [])
      .filter((field) => !field.visible || field.visible(draft) !== false)
      .map((field: RecordField) => {
        const resolved = resolveRecordField(field, properties);
        const locked =
          !!field.locked?.(draft) ||
          (allowed != null && !allowed.includes(field.field) && !allowed.includes(field.key));
        const required = !!field.required || !!field.requiredWhen?.(draft);
        return {
          ...resolved,
          required,
          disabled: !!resolved.disabled || locked,
          readonly: !!resolved.readonly || resolved.type === 'computed',
          colSpan: field.wide || resolved.type === 'textarea' || resolved.type === 'richtext' ? columns : field.colSpan,
        };
      });
    const kind = section.kind ?? (section.listing ? undefined : section.loadScreen || section.screen ? 'screen' : 'fields');
    if (kind === 'attachments' || kind === 'comments' || kind === 'audit') {
      if (!this.capabilityOn(kind)) return null;
      return {
        title: section.title,
        description: section.description,
        fields: [],
        columns,
        listing: null,
        collaboration: kind === 'audit' ? null : kind,
        audit: kind === 'audit',
        accept: section.accept ?? ['*'],
        maxSizeMb: section.maxSizeMb,
      };
    }
    if (kind === 'screen') {
      const requiresSaved = section.requiresSaved !== false;
      if (requiresSaved && !saved) {
        return {
          title: section.title,
          description: section.description,
          fields: [],
          columns,
          listing: null,
          collaboration: null,
          audit: false,
          accept: section.accept ?? ['*'],
          maxSizeMb: section.maxSizeMb,
          screenPending: true,
        };
      }
      return {
        title: section.title,
        description: section.description,
        fields: [],
        columns,
        listing: null,
        collaboration: null,
        audit: false,
        accept: section.accept ?? ['*'],
        maxSizeMb: section.maxSizeMb,
        screen: section.screen,
        loadScreen: section.loadScreen,
      };
    }
    const requiresSaved = section.requiresSaved !== false;
    return {
      title: section.title,
      description: section.description,
      fields,
      columns,
      listing: section.listing && (!requiresSaved || saved) && saved ? section.listing(saved) : null,
      collaboration: null,
      audit: false,
      accept: section.accept ?? ['*'],
      maxSizeMb: section.maxSizeMb,
      screenPending: !!(section.listing && requiresSaved && !saved),
    };
  }

  private capabilityOn(kind: 'attachments' | 'comments' | 'audit'): boolean {
    const caps = this.capabilities;
    if (!caps) return true;
    if (kind === 'attachments') return caps.includes('cap.documents');
    if (kind === 'comments') return caps.includes('cap.comments');
    return caps.includes('cap.audit');
  }

  private visibleActions(): RecordAction[] {
    const record = (this.record() ?? {}) as never;
    return (this.config().actions ?? []).filter((action) => {
      if (action.permission && !this.permissions.hasPermission(action.permission)) return false;
      if (action.when && !action.when(record)) return false;
      if (this.creating() && action.request) return false;
      return true;
    });
  }

  actionBlocked(action: RecordAction): boolean {
    return (action.requiresSaved ?? true) && this.dirty();
  }

  importAccept(): string {
    return (this.config().import?.accept ?? []).join(',');
  }

  hintsOf(section: SectionView): { field: string; label: string }[] {
    const marks = this.extracted();
    return section.fields
      .filter((field) => marks[field.key])
      .map((field) => ({ field: field.key, label: marks[field.key] === 'check' ? 'record.checkExtracted' : 'record.extracted' }));
  }

  pickImport(): void {
    const input = document.querySelector<HTMLInputElement>('nf-record-page input[type=file]');
    input?.click();
  }

  async onImport(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    const imported = this.config().import;
    if (!file || !imported) return;
    const endpoint = 'endpoint' in imported.docType ? imported.docType.endpoint : '/api/stateless-extractions';
    const body = new FormData();
    body.append('file', file);
    this.busy.set(true);
    try {
      const response = await firstValueFrom(this.http.post<{ fields?: Record<string, { value?: unknown; confidence?: number }> }>(this.url(endpoint), body));
      const values: Row = { ...(this.config().defaults ?? {}) };
      const marks: Record<string, 'extracted' | 'check'> = {};
      for (const [source, target] of Object.entries(imported.map)) {
        const field = response.fields?.[source];
        if (!field || field.value == null || field.value === '') continue;
        values[target] = field.value;
        marks[target] = field.confidence != null && field.confidence < 0.6 ? 'check' : 'extracted';
      }
      this.extracted.set(marks);
      this.formValues.set(values);
      this.draft.set(values);
      this.pendingFile = imported.attach === false ? null : file;
      this.toast.success(this.translate.instant('record.extractedDone'));
    } catch (error) {
      this.toast.error(this.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  async runAction(action: RecordAction): Promise<void> {
    if (this.actionBlocked(action) || this.busy()) return;
    const record = this.record();
    if (action.route && !action.request) {
      const target = typeof action.route === 'string' ? action.route : action.route((record ?? {}) as never);
      void this.router.navigateByUrl(target);
      return;
    }
    if (action.confirm) {
      const confirmed = await this.dialogs.confirm({
        title: this.translate.instant(action.confirm.title),
        message: this.translate.instant(action.confirm.message),
        confirmLabel: action.confirm.confirmLabel ? this.translate.instant(action.confirm.confirmLabel) : undefined,
        variant: action.confirm.danger ? 'danger' : 'default',
      });
      if (!confirmed) return;
    }
    let body: unknown = {};
    if (action.form) {
      const values = await this.dialogs.form({ title: action.form.title, fields: action.form.fields, values: action.form.values?.(record as never) });
      if (!values) return;
      body = action.form.body ? action.form.body(values, record as never) : values;
    }
    if (!action.request) return;
    const url = (action.request.url ?? `${this.config().endpoint}/{id}`).replace('{id}', encodeURIComponent(String(record?.['id'] ?? '')));
    this.busyId.set(action.id);
    this.busy.set(true);
    try {
      if ((action.result ?? 'record') === 'download') {
        const response = await firstValueFrom(this.http.request('POST', this.url(url), { body, responseType: 'blob', observe: 'response' }));
        const named = /filename="?([^";]+)"?/i.exec(response.headers.get('Content-Disposition') ?? '');
        saveBlob(response.body ?? new Blob(), named?.[1] ?? 'document');
      } else {
        const response = await firstValueFrom(this.http.request<Row>(action.request.method, this.url(url), { body }));
        if (action.reveal) await this.dialogs.reveal({ title: action.reveal.title, message: action.reveal.message, value: String(response?.[action.reveal.field] ?? '') });
        if (response && action.failed?.(response)) this.toast.error(this.translate.instant(action.failure ?? 'Action failed'));
        else if (action.success) this.toast.success(this.translate.instant(action.success));
        if ((action.result ?? 'record') === 'record' && response?.['id']) {
          const next = String(response['id']);
          if (next !== this.id()) void this.router.navigateByUrl(this.config().route(next));
          else this.show(response);
        }
      }
      if (action.route && action.result === 'none') {
        const target = typeof action.route === 'string' ? action.route : action.route((record ?? {}) as never);
        void this.router.navigateByUrl(target);
      }
    } catch (error) {
      this.toast.error(this.errorMessage(error));
    } finally {
      this.busy.set(false);
      this.busyId.set(null);
    }
  }

  /** Index of the panel holding a form (forms render in panel order). */
  private panelOf(form: FormComponent): number {
    let index = 0;
    for (const [panelIndex, panel] of this.panels().entries()) {
      for (const section of panel.sections) {
        if (!section.fields.length) continue;
        if (this.forms()[index] === form) return panelIndex;
        index++;
      }
    }
    return -1;
  }

  private validate(forms: readonly FormComponent[]): boolean {
    forms.forEach((form) => form.formGroup.markAllAsTouched());
    return forms.every((form) => form.formGroup.valid || form.formGroup.disabled);
  }

  private editableState(): boolean {
    const lifecycle = this.lifecycle();
    const status = String(this.record()?.['status'] ?? '');
    if (lifecycle?.editableFields && status in lifecycle.editableFields) return true;
    const editableStates = lifecycle?.editable;
    return !editableStates?.length || editableStates.includes(status);
  }

  private allowed(permission?: string): boolean {
    return !!permission && this.permissions.hasPermission(permission);
  }

  /** A transition refused for missing fields opens the panel holding the first one. */
  private revealMissing(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) return;
    const first = (error.error as { message?: string } | null)?.message?.match(/^Required fields: ([^,]+)/)?.[1];
    const panel = first && this.panels().find((candidate) => candidate.sections.some((section) => section.fields.some((field) => field.key === first)));
    if (panel) this.activePanel.set(panel.id);
  }

  /** Server error in words: field errors with their labels, or the message (required fields of a transition). */
  private errorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) return this.translate.instant('Action failed');
    const body = error.error as { message?: string } | null;
    const label = (key: string) => {
      const field = this.allFields().find((candidate) => candidate.key === key || candidate.field === key);
      return field ? this.translate.instant(field.label) : key;
    };
    const refusal = ruleRefusal(error, label);
    if (refusal) return refusal;
    const required = body?.message?.match(/^Required fields: (.+)$/);
    if (required) {
      return this.translate.instant('record.requiredFields', { fields: required[1].split(', ').map(label).join(', ') });
    }
    if (error.status === 403) return this.translate.instant('Access denied');
    if (error.status === 409) return this.translate.instant('record.conflict');
    return this.translate.instant('Action failed');
  }

  private allFields(): FormFieldConfig[] {
    return this.panels().flatMap((panel) => panel.sections.flatMap((section) => section.fields));
  }

  private url(path: string): string {
    return this.api.getApiBaseUrl().replace(/\/+$/, '') + path;
  }
}

/** Leaving a record with unsaved changes asks first. */
export const unsavedChangesGuard: CanDeactivateFn<RecordPageComponent> = (page) => page.canLeave();

/** `{ path, component, data: { record }, canDeactivate }` of a record screen. */
export function recordRoute(path: string, record: RecordPageConfig): Route {
  return { path, component: RecordPageComponent, data: { record }, canDeactivate: [unsavedChangesGuard] };
}

function same(a: unknown, b: unknown): boolean {
  const empty = (value: unknown) => value === null || value === undefined || value === '';
  if (empty(a) && empty(b)) return true;
  return JSON.stringify(a) === JSON.stringify(b);
}

function isoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
