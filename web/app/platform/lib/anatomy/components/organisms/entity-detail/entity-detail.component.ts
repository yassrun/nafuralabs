/**
 * Entity Detail Component
 *
 * A config-driven form component for entity detail pages (create/edit/view).
 * Handles form building, validation, sections, and actions.
 *
 * Features:
 * - Config-driven fields and sections
 * - Automatic form building with validation
 * - Permission-based field/action visibility
 * - Create/Edit/View modes
 * - Custom field templates via content projection
 *
 * @example
 * ```html
 * <nf-entity-detail
 *   [config]="config"
 *   [mode]="'edit'"
 *   [item]="product"
 *   [lookups]="lookups()"
 *   [loading]="isLoading()"
 *   (action)="onAction($event)">
 *
 *   <!-- Custom field template -->
 *   <ng-template nfField="customField" let-control let-field="field">
 *     <my-custom-input [formControl]="control" [config]="field.config">
 *     </my-custom-input>
 *   </ng-template>
 *
 * </nf-entity-detail>
 * ```
 */

import {
  Component,
  ContentChildren,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  QueryList,
  TemplateRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatTabsModule } from '@angular/material/tabs';
import { LOOKUP_LIST_ROUTES } from '../../../tokens/lookup-list-routes.token';
import { LookupReferenceNavigationService } from '../../../services/lookup-reference-navigation.service';

import { MatDialog } from '@angular/material/dialog';
import { ButtonListComponent, ButtonListItem } from '../../molecules/button-list';
import { FormErrorSummaryComponent } from '../../molecules/form-error-summary';
import { StatusMachineComponent } from '../../molecules/status-machine';
import { IceInputComponent } from '../../atoms/ice-input/ice-input.component';
import { RibInputComponent } from '../../atoms/rib-input/rib-input.component';
import { PhoneMaInputComponent } from '../../atoms/phone-ma-input/phone-ma-input.component';
import { MoneyInputComponent } from '../../atoms/money-input/money-input.component';
import { PermissionService } from '../../../../../core/security/services/permission.service';
import { FieldTemplateDirective } from './field-template.directive';
import { AuditTimelineComponent } from '../../../../../features/collaboration/audit';
import { AttachmentListComponent } from '../../../../../features/collaboration/doc-manager/components/attachment-list.component';
import {
  ApprovalBannerComponent,
  ApprovalActionComponent,
  WorkflowApiService,
  WorkflowTemplateDto,
} from '../../../../../features/collaboration/workflow';
import { WorkflowTemplateSelectDialogComponent } from '../../../../../features/collaboration/workflow/components/workflow-template-select-dialog.component';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

import type {
  DetailPageConfig,
  DetailFieldConfig,
  DetailSectionConfig,
  DetailActionConfig,
  DetailActionEvent,
  DetailActionContext,
  DetailPageMode,
  LookupContext,
  DetailFieldWidth,
  StatusTransitionEvent,
} from '../../../types';

/**
 * Width preset to CSS grid columns mapping (12-column grid).
 */
const WIDTH_TO_COLUMNS: Record<DetailFieldWidth, number> = {
  xs: 3,   // 25%
  sm: 4,   // 33%
  md: 6,   // 50%
  lg: 8,   // 66%
  full: 12, // 100%
};

@Component({
  selector: 'nf-entity-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatTabsModule,
    TranslateModule,
    ButtonListComponent,
    StatusMachineComponent,
    AuditTimelineComponent,
    AttachmentListComponent,
    ApprovalBannerComponent,
    ApprovalActionComponent,
    IceInputComponent,
    RibInputComponent,
    PhoneMaInputComponent,
    MoneyInputComponent,
    FormErrorSummaryComponent,
  ],
  templateUrl: './entity-detail.component.html',
  styleUrl: './entity-detail.component.scss',
})
export class EntityDetailComponent<TItem = Record<string, unknown>>
  implements OnInit, OnDestroy
{
  // ═══════════════════════════════════════════════════════════════════════════
  // Inputs
  // ═══════════════════════════════════════════════════════════════════════════

  /** Detail page configuration */
  config = input.required<DetailPageConfig<TItem>>();

  /** Current mode */
  mode = input.required<DetailPageMode>();

  /** Item data (for edit/view modes) */
  item = input<TItem | null>(null);

  /** Lookup data for select fields */
  lookups = input<LookupContext>({});

  /** Loading state */
  loading = input<boolean>(false);

  /** Saving state */
  saving = input<boolean>(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // Outputs
  // ═══════════════════════════════════════════════════════════════════════════

  /** Action event */
  action = output<DetailActionEvent<TItem>>();

  /** Status transition request event (forwarded from internal status machine). */
  transitionRequest = output<StatusTransitionEvent>();

  /** Form value change */
  formChange = output<Partial<TItem>>();

  // ═══════════════════════════════════════════════════════════════════════════
  // Services
  // ═══════════════════════════════════════════════════════════════════════════

  private readonly fb = inject(FormBuilder);
  private readonly permissionService = inject(PermissionService);
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LOCALE_ID);
  private readonly router = inject(Router);
  private readonly lookupListRoutes = inject(LOOKUP_LIST_ROUTES);
  private readonly lookupRefNav = inject(LookupReferenceNavigationService);
  private readonly workflowApi = inject(WorkflowApiService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroy$ = new Subject<void>();
  private readonly formDestroy$ = new Subject<void>();

  // ═══════════════════════════════════════════════════════════════════════════
  // Content Projection
  // ═══════════════════════════════════════════════════════════════════════════

  @ContentChildren(FieldTemplateDirective)
  fieldTemplates!: QueryList<FieldTemplateDirective>;

  // ═══════════════════════════════════════════════════════════════════════════
  // Internal State
  // ═══════════════════════════════════════════════════════════════════════════

  /** The reactive form group */
  form = new FormGroup({});

  /** Whether form has been built (controls added) */
  readonly formReady = signal(false);
  /** Per-field search term used for searchable select lookups. */
  readonly lookupSearchTerms = signal<Record<string, string>>({});

  /** Form dirty state */
  private readonly _isDirty = signal(false);

  /** Form valid state */
  private readonly _isValid = signal(true);

  /** User clicked Save while the form was invalid (drives error summary visibility). */
  private readonly _formSubmitAttempted = signal(false);

  /** Clear submit-attempt flag once the form becomes valid again. */
  private readonly _resetSubmitAttemptWhenValid = effect(() => {
    if (!this.formReady()) return;
    if (this.form.valid) {
      this._formSubmitAttempted.set(false);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Computed
  // ═══════════════════════════════════════════════════════════════════════════

  /** Is view mode (readonly) */
  readonly isViewMode = computed(() => this.mode() === 'view');

  /** Is create mode */
  readonly isCreateMode = computed(() => this.mode() === 'create');

  /** Is edit mode */
  readonly isEditMode = computed(() => this.mode() === 'edit');

  /** Visible fields (filtered by permission and visibility) */
  readonly visibleFields = computed(() => {
    const cfg = this.config();
    const formValue = this.form.value as Partial<TItem>;

    return cfg.fields.filter((field) => {
      // Permission check
      if (field.permission && !this.permissionService.hasPermission(field.permission)) {
        return false;
      }

      // Visibility check
      if (typeof field.visible === 'function') {
        return field.visible(formValue);
      }
      if (field.visible === false) {
        return false;
      }

      return true;
    });
  });

  /** Visible sections (filtered by permission and visibility) */
  readonly visibleSections = computed(() => {
    const cfg = this.config();
    if (!cfg.sections) return [];

    const formValue = this.form.value as Partial<TItem>;

    return cfg.sections.filter((section) => {
      // Permission check
      if (section.permission && !this.permissionService.hasPermission(section.permission)) {
        return false;
      }

      // Visibility check
      if (typeof section.visible === 'function') {
        return section.visible(formValue);
      }
      if (section.visible === false) {
        return false;
      }

      return true;
    });
  });

  /** Whether to use sections layout */
  readonly useSections = computed(() => {
    const cfg = this.config();
    return (cfg.sections?.length ?? 0) > 0;
  });

  /** True when built-in fields should render as plain read-only values in view mode. */
  readonly useReadonlyView = computed(() => {
    return this.isViewMode() && this.config().viewModeAppearance === 'readonly';
  });

  /** Action context for visibility/disabled functions */
  readonly actionContext = computed<DetailActionContext<TItem>>(() => ({
    mode: this.mode(),
    isDirty: this._isDirty(),
    isValid: this._isValid(),
    formValue: this.form.value as Partial<TItem>,
    item: this.item() ?? undefined,
  }));

  /** Left-side actions */
  readonly leftActions = computed<ButtonListItem[]>(() => {
    return this.getActionsForPosition('left');
  });

  /** Right-side actions */
  readonly rightActions = computed<ButtonListItem[]>(() => {
    return this.getActionsForPosition('right');
  });

  /** Auto-render status machine in actions bar when enabled by config. */
  readonly useStatusMachineInActionsBar = computed(() => {
    const cfg = this.config();
    return !!cfg.statusMachine && cfg.statusMachineInActionsBar === true;
  });

  /** Whether status machine renders in center zone (vs right zone). */
  readonly statusMachineInCenter = computed(() => {
    const cfg = this.config();
    return cfg.statusMachinePosition === 'center';
  });

  /** Grid columns CSS */
  readonly gridColumns = computed(() => {
    const cfg = this.config();
    const cols = cfg.defaultColumns ?? 2;
    // Using 12-column grid
    return `repeat(12, 1fr)`;
  });

  /** Labels for nf-form-error-summary (keys = form control paths). */
  readonly formErrorSummaryLabels = computed(() => {
    const map: Record<string, string> = {};
    for (const field of this.visibleFields()) {
      map[field.key] = this.translateLabel(field.label);
    }
    return map;
  });

  readonly formSubmitAttempted = this._formSubmitAttempted.asReadonly();

  /** Whether to show the Activity (audit) tab. Shown when features.audit is true and we have an entity id. */
  readonly showAuditTab = computed(() => {
    const cfg = this.config();
    if (!cfg.features?.audit || !cfg.entityTypeForAudit) return false;
    const item = this.item();
    const id = item != null && typeof item === 'object' && 'id' in item ? (item as { id: string }).id : null;
    return !!id;
  });

  /** Whether to show the Attachments tab. Shown when features.attachments is true and we have an entity id. */
  readonly showAttachmentsTab = computed(() => {
    const cfg = this.config();
    if (!cfg.features?.attachments || !cfg.entityTypeForAttachments) return false;
    const item = this.item();
    const id = item != null && typeof item === 'object' && 'id' in item ? (item as { id: string }).id : null;
    return !!id;
  });

  /** Show tab group when either audit or attachments tab is enabled. */
  readonly showTabGroup = computed(() => this.showAuditTab() || this.showAttachmentsTab());

  /** Tab definitions for detail page: Details, optional Activity, optional Attachments. */
  readonly detailTabs = computed(() => {
    const tabs: { id: string; labelKey: string; count?: number }[] = [
      { id: 'details', labelKey: 'audit.timeline.detailsTab' },
    ];
    if (this.showAuditTab()) {
      tabs.push({ id: 'activity', labelKey: 'audit.timeline.title' });
    }
    if (this.showAttachmentsTab()) {
      tabs.push({
        id: 'attachments',
        labelKey: 'attachments.title',
        count: this.attachmentCount(),
      });
    }
    return tabs;
  });

  /** Entity type for audit API (e.g. "role"). */
  readonly auditEntityType = computed(() => this.config().entityTypeForAudit ?? '');

  /** Entity id for audit API (from current item). */
  readonly auditEntityId = computed(() => {
    const item = this.item();
    if (item == null || typeof item !== 'object' || !('id' in item)) return '';
    return String((item as { id: unknown }).id);
  });

  /** Entity type for attachments API (e.g. "invoice"). */
  readonly attachmentEntityType = computed(() => this.config().entityTypeForAttachments ?? '');

  /** Entity id for attachments API (from current item). */
  readonly attachmentEntityId = computed(() => this.auditEntityId());

  /** Attachment count for tab label "Attachments (n)". */
  readonly attachmentCount = signal(0);

  /** Selected tab index. */
  readonly selectedTabIndex = signal(0);

  /** True when the Activity tab is selected (so timeline can load). */
  readonly activityTabActive = computed(() => {
    const tabs = this.detailTabs();
    const idx = this.selectedTabIndex();
    return tabs[idx]?.id === 'activity';
  });

  /** True when the Attachments tab is selected. */
  readonly attachmentsTabActive = computed(() => {
    const tabs = this.detailTabs();
    const idx = this.selectedTabIndex();
    return tabs[idx]?.id === 'attachments';
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Workflow (approval) integration
  // ═══════════════════════════════════════════════════════════════════════════

  /** Whether to show the workflow (approval) slot: config has workflow + entityTypeForWorkflow + entity has id. */
  readonly showWorkflowSlot = computed(() => {
    const cfg = this.config();
    if (!cfg.features?.workflow || !cfg.entityTypeForWorkflow) return false;
    const id = this.workflowEntityId();
    return !!id;
  });

  readonly workflowEntityType = computed(() => this.config().entityTypeForWorkflow ?? '');

  readonly workflowEntityId = computed(() => {
    const item = this.item();
    if (item == null || typeof item !== 'object' || !('id' in item)) return '';
    return String((item as { id: unknown }).id);
  });

  readonly workflowTemplates = signal<WorkflowTemplateDto[]>([]);
  readonly workflowRefreshTrigger = signal(0);
  readonly workflowApprovalState = signal<'loading' | 'none' | 'pending' | 'approved' | 'rejected'>('loading');
  readonly workflowTriggering = signal(false);

  readonly workflowSubmitLabel = computed(() => {
    const cfg = this.config();
    return cfg.features?.workflowConfig?.triggerAction ?? 'workflow.submitForApproval';
  });

  /** Show "Submit for Approval" when no active workflow and templates exist. */
  readonly showWorkflowSubmitButton = computed(
    () =>
      this.showWorkflowSlot() &&
      this.workflowApprovalState() === 'none' &&
      this.workflowTemplates().length > 0 &&
      !this.workflowTriggering()
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Lifecycle
  // ═══════════════════════════════════════════════════════════════════════════

  constructor() {
    // Rebuild form when config or item changes
    effect(() => {
      const cfg = this.config();
      const item = this.item();
      const mode = this.mode();

      this.buildForm(cfg.fields, item, mode);
    });

    // Load workflow templates when workflow slot is shown
    effect(() => {
      if (!this.showWorkflowSlot()) return;
      const entityType = this.workflowEntityType();
      if (!entityType) return;
      this.workflowApi.listTemplatesByEntityType(entityType).subscribe({
        next: (list) => this.workflowTemplates.set(list),
        error: () => this.workflowTemplates.set([]),
      });
    });
  }

  ngOnInit(): void {
    // Form subscription is now handled in buildForm
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.formDestroy$.next();
    this.formDestroy$.complete();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Form Building
  // ═══════════════════════════════════════════════════════════════════════════

  private buildForm(
    fields: DetailFieldConfig<TItem>[],
    item: TItem | null,
    mode: DetailPageMode
  ): void {
    const controls: Record<string, FormControl> = {};

    for (const field of fields) {
      const validators = this.buildValidators(field);
      const value = item ? (item as Record<string, unknown>)[field.key] : field.defaultValue ?? null;

      const readonlyLocked =
        field.readonly === true ||
        (field.readonlyOnEdit === true && mode === 'edit' && item != null);

      const isDisabled =
        mode === 'view' ||
        readonlyLocked ||
        (typeof field.disabled === 'function'
          ? field.disabled(item ?? ({} as Partial<TItem>))
          : field.disabled);

      controls[field.key] = new FormControl(
        { value, disabled: isDisabled },
        validators
      );
    }

    // Unsubscribe from previous form
    this.formDestroy$.next();

    this.form = new FormGroup(controls);
    this._isDirty.set(false);
    this._isValid.set(this.form.valid);
    this.formReady.set(true);

    // Subscribe to new form changes
    this.form.valueChanges.pipe(takeUntil(this.formDestroy$)).subscribe((value) => {
      this._isDirty.set(this.form.dirty);
      this._isValid.set(this.form.valid);
      this.formChange.emit(value as Partial<TItem>);
    });
  }

  private buildValidators(field: DetailFieldConfig<TItem>): any[] {
    const validators: any[] = [];

    if (field.required) {
      validators.push(Validators.required);
    }

    if (field.validators) {
      for (const v of field.validators) {
        switch (v.type) {
          case 'min':
            if (v.value !== undefined) validators.push(Validators.min(v.value));
            break;
          case 'max':
            if (v.value !== undefined) validators.push(Validators.max(v.value));
            break;
          case 'minLength':
            if (v.value !== undefined) validators.push(Validators.minLength(v.value));
            break;
          case 'maxLength':
            if (v.value !== undefined) validators.push(Validators.maxLength(v.value));
            break;
          case 'pattern':
            if (v.pattern) validators.push(Validators.pattern(v.pattern));
            break;
          case 'email':
            validators.push(Validators.email);
            break;
        }
      }
    }

    // Auto-add email validator for email type
    if (field.type === 'email' && !field.validators?.some((v) => v.type === 'email')) {
      validators.push(Validators.email);
    }

    return validators;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Actions
  // ═══════════════════════════════════════════════════════════════════════════

  private getActionsForPosition(position: 'left' | 'right'): ButtonListItem[] {
    const cfg = this.config();
    const mode = this.mode();
    const ctx = this.actionContext();
    const result: ButtonListItem[] = [];

    cfg.actions
      .filter((a) => (a.position ?? 'right') === position)
      .filter((a) => this.isActionVisibleForMode(a, mode))
      .filter((a) => this.hasActionPermission(a))
      .filter((a) => this.isActionVisible(a, ctx))
      .forEach((a) => {
        const isDisabled = this.isActionDisabled(a, ctx);
        const disabledTooltip =
          isDisabled && a.disabledTooltip
            ? (typeof a.disabledTooltip === 'function' ? a.disabledTooltip(ctx) : a.disabledTooltip)
            : '';
        const fallbackTooltip = a.tooltip ?? a.ariaLabel ?? a.label ?? '';

        result.push({
          id: a.id,
          label: a.label ?? '',
          icon: a.icon,
          variant: this.mapActionVariant(a),
          ariaLabel: a.ariaLabel ?? a.label,
          tooltip: disabledTooltip || fallbackTooltip,
          disabled: isDisabled,
          order: a.order,
        });
      });

    return result;
  }

  private isActionVisibleForMode(action: DetailActionConfig<TItem>, mode: DetailPageMode): boolean {
    if (action.showInModes?.length) {
      return action.showInModes.includes(mode);
    }

    switch (action.scope) {
      case 'create':
        return mode === 'create';
      case 'edit':
        return mode === 'edit';
      case 'view':
        return mode === 'view';
      case 'create+edit':
        return mode === 'create' || mode === 'edit';
      case 'edit+view':
        return mode === 'edit' || mode === 'view';
      case 'all':
        return true;
      default:
        return true;
    }
  }

  private hasActionPermission(action: DetailActionConfig<TItem>): boolean {
    if (!action.permission) return true;

    // Special handling for save: different permission for create vs edit
    if (action.id === 'save' && action.permission) {
      const mode = this.mode();
      const cfg = this.config();
      if (cfg.permissionPrefix) {
        const perm = mode === 'create'
          ? `${cfg.permissionPrefix}.create`
          : `${cfg.permissionPrefix}.update`;
        return this.permissionService.hasPermission(perm);
      }
    }

    return this.permissionService.hasPermission(action.permission);
  }

  private isActionVisible(
    action: DetailActionConfig<TItem>,
    ctx: DetailActionContext<TItem>
  ): boolean {
    if (!action.visible) return true;
    return action.visible(ctx);
  }

  private isActionDisabled(
    action: DetailActionConfig<TItem>,
    ctx: DetailActionContext<TItem>
  ): boolean {
    if (typeof action.disabled === 'boolean') {
      return action.disabled;
    }
    if (action.disabled) {
      return action.disabled(ctx);
    }
    return false;
  }

  private mapActionVariant(action: DetailActionConfig<TItem>): ButtonListItem['variant'] {
    const variant = action.variant;
    const color = action.color;

    if (variant === 'flat') {
      return color === 'danger' || color === 'warn' ? 'danger' : 'primary';
    }
    if (variant === 'stroked') {
      return color === 'danger' || color === 'warn' ? 'danger' : 'secondary';
    }
    if (variant === 'text') {
      return 'ghost';
    }
    if (variant === 'icon') {
      return 'tertiary';
    }

    return (variant as ButtonListItem['variant']) ?? 'secondary';
  }

  async onActionClick(actionId: string): Promise<void> {
    const actionCfg = this.config().actions.find((a) => a.id === actionId);
    if (actionCfg?.confirm) {
      const item = (this.item() ?? null) as TItem | null;
      const msg =
        typeof actionCfg.confirm.message === 'function'
          ? actionCfg.confirm.message(item)
          : actionCfg.confirm.message;
      const confirmed = await this.confirmDialog.confirm({
        title: actionCfg.confirm.title,
        message: msg,
        confirmLabel: actionCfg.confirm.confirmLabel,
      });
      if (!confirmed) return;
    }

    if (actionId === 'save' && !this.isViewMode() && this.form.invalid) {
      this.form.markAllAsTouched();
      this._formSubmitAttempted.set(true);
      return;
    }

    this.action.emit({
      actionId,
      mode: this.mode(),
      formValue: this.form.getRawValue() as Partial<TItem>,
      item: this.item() ?? undefined,
    });
  }

  onStatusTransitionRequest(event: StatusTransitionEvent): void {
    this.transitionRequest.emit(event);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Field Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  getFieldControl(key: string): FormControl {
    return this.form.get(key) as FormControl;
  }

  /** DOM anchor for nf-form-error-summary focus (`nf-field-{path}`). */
  fieldAnchorId(key: string): string {
    return `nf-field-${key.replace(/\./g, '-')}`;
  }

  isReadonlyRenderableField(field: DetailFieldConfig<TItem>): boolean {
    if (!this.useReadonlyView()) return false;

    return (
      field.type === 'text' ||
      field.type === 'email' ||
      field.type === 'password' ||
      field.type === 'url' ||
      field.type === 'tel' ||
      field.type === 'number' ||
      field.type === 'currency' ||
      field.type === 'textarea' ||
      field.type === 'date' ||
      field.type === 'select' ||
      field.type === 'multi-select' ||
      field.type === 'ice' ||
      field.type === 'rib' ||
      field.type === 'phone-ma' ||
      field.type === 'money-ma'
    );
  }

  getReadonlyDisplayValue(field: DetailFieldConfig<TItem>): string {
    const value = this.getFieldControl(field.key)?.value;

    if (
      value === null ||
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return '—';
    }

    if (field.type === 'select') {
      const option = this.getOptions(field).find((opt) => opt.value === value);
      return option ? this.translateLabel(String(option.label)) : String(value);
    }

    if (field.type === 'multi-select') {
      const asArray = Array.isArray(value) ? value : [value];
      const labels = asArray
        .map((v) => {
          const option = this.getOptions(field).find((opt) => opt.value === v);
          return option ? this.translateLabel(String(option.label)) : String(v);
        })
        .filter((label) => !!label);
      return labels.length ? labels.join(', ') : '—';
    }

    if (field.type === 'date') {
      const dateValue = value instanceof Date ? value : new Date(String(value));
      if (Number.isNaN(dateValue.getTime())) return String(value);
      return new Intl.DateTimeFormat(this.locale).format(dateValue);
    }

    if (field.type === 'currency' || field.type === 'money-ma') {
      const numeric = typeof value === 'number' ? value : Number(value);
      if (!Number.isNaN(numeric)) {
        return numeric.toLocaleString(this.locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
    }

    if (field.type === 'ice') {
      const digits = String(value).replace(/\D/g, '');
      if (digits.length === 15) {
        return `${digits.slice(0, 5)} ${digits.slice(5, 10)} ${digits.slice(10, 15)}`;
      }
      return digits || '—';
    }

    if (field.type === 'rib') {
      const digits = String(value).replace(/\D/g, '');
      if (digits.length === 24) {
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 22)} ${digits.slice(22, 24)}`;
      }
      return digits || '—';
    }

    if (field.type === 'phone-ma') {
      const raw = String(value);
      const m = /^\+212(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(raw);
      if (m) return `+212 ${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]}`;
      return raw;
    }

    return String(value);
  }

  getFieldSpan(field: DetailFieldConfig<TItem>): string {
    const width = field.width ?? 'md';
    const cols = WIDTH_TO_COLUMNS[width];
    return `span ${cols}`;
  }

  getSectionGridColumns(section: DetailSectionConfig<TItem>): string {
    return `repeat(12, 1fr)`;
  }

  getFieldsForSection(section: DetailSectionConfig<TItem>): DetailFieldConfig<TItem>[] {
    const visible = this.visibleFields();
    return section.fields
      .map((key) => visible.find((f) => f.key === key))
      .filter((f): f is DetailFieldConfig<TItem> => f !== undefined);
  }

  getOptions(field: DetailFieldConfig<TItem>): Array<{ label: string; value: unknown }> {
    if (!field.lookupKey) {
      return field.options || [];
    }

    const lookupItems = this.lookups()[field.lookupKey];
    if (!Array.isArray(lookupItems) || lookupItems.length === 0) {
      return field.options || [];
    }

    return lookupItems.map((item) => ({
      label: item.value,
      value: item.key,
    }));
  }

  getFilteredOptions(field: DetailFieldConfig<TItem>): Array<{ label: string; value: unknown }> {
    const options = this.getOptions(field);
    if (!field.searchable) return options;

    const term = this.getLookupSearchTerm(field).trim().toLowerCase();
    if (!term) return options;

    return options.filter((opt) => String(opt.label ?? '').toLowerCase().includes(term));
  }

  getLookupSearchTerm(field: DetailFieldConfig<TItem>): string {
    return this.lookupSearchTerms()[field.key] ?? '';
  }

  onLookupSearch(field: DetailFieldConfig<TItem>, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input?.value ?? '';
    this.lookupSearchTerms.update((current) => ({
      ...current,
      [field.key]: value,
    }));
  }

  clearLookupSearch(field: DetailFieldConfig<TItem>): void {
    this.lookupSearchTerms.update((current) => {
      if (!(field.key in current)) return current;
      const clone = { ...current };
      delete clone[field.key];
      return clone;
    });
  }

  isFieldClearable(field: DetailFieldConfig<TItem>): boolean {
    if (field.required) return false;
    return field.clearable === true || !!field.lookupKey;
  }

  clearFieldValue(field: DetailFieldConfig<TItem>, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const control = this.getFieldControl(field.key);
    if (!control) return;
    control.setValue(null);
    control.markAsDirty();
    control.markAsTouched();
    control.updateValueAndValidity();
  }

  hasFieldValue(field: DetailFieldConfig<TItem>): boolean {
    const value = this.getFieldControl(field.key)?.value;
    return value !== null && value !== undefined && value !== '';
  }

  openReferenceShortcut(field: DetailFieldConfig<TItem>, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    const route = this.resolveReferenceRoute(field);
    if (!route) {
      return;
    }
    this.lookupRefNav.openListingInNewTab(route);
  }

  resolveReferenceRoute(field: DetailFieldConfig<TItem>): string | undefined {
    if (field.referenceRoute?.trim()) {
      return field.referenceRoute.trim();
    }
    if (field.listRoute?.trim()) {
      return field.listRoute.trim();
    }
    const key = field.lookupKey?.trim();
    if (!key) {
      return undefined;
    }
    return this.lookupListRoutes[key];
  }

  hasReferenceListShortcut(field: DetailFieldConfig<TItem>): boolean {
    return this.lookupRefNav.canOpen(this.resolveReferenceRoute(field));
  }

  getNoneOptionLabel(): string {
    return this.t('common.none', 'None');
  }

  getLookupSearchPlaceholder(): string {
    return this.t('common.search', 'Search');
  }

  getOpenReferenceLabel(field: DetailFieldConfig<TItem>): string {
    const label = this.translateLabel(field.label);
    return this.t('common.openReference', `Voir ${label}`);
  }

  getErrorMessage(field: DetailFieldConfig<TItem>): string {
    const control = this.getFieldControl(field.key);
    if (!control || !control.errors) return '';
    const label = this.translateLabel(field.label);

    // Custom error messages from validators
    if (field.validators) {
      for (const v of field.validators) {
        if (v.type === 'custom' && control.errors[v.customFn ?? '']) {
          return v.message ? this.translateMessage(v.message) : this.t('Invalid value', 'Invalid value');
        }
        if (control.errors[v.type] && v.message) {
          return this.translateMessage(v.message);
        }
      }
    }

    // Default error messages
    if (control.errors['required']) {
      return this.t(
        '{{label}} is required',
        `${label} is required`,
        { label }
      );
    }
    if (control.errors['minlength']) {
      return this.t(
        '{{label}} must be at least {{count}} characters',
        `${label} must be at least ${control.errors['minlength'].requiredLength} characters`,
        { label, count: control.errors['minlength'].requiredLength }
      );
    }
    if (control.errors['maxlength']) {
      return this.t(
        '{{label}} must be at most {{count}} characters',
        `${label} must be at most ${control.errors['maxlength'].requiredLength} characters`,
        { label, count: control.errors['maxlength'].requiredLength }
      );
    }
    if (control.errors['min']) {
      return this.t(
        '{{label}} must be at least {{value}}',
        `${label} must be at least ${control.errors['min'].min}`,
        { label, value: control.errors['min'].min }
      );
    }
    if (control.errors['max']) {
      return this.t(
        '{{label}} must be at most {{value}}',
        `${label} must be at most ${control.errors['max'].max}`,
        { label, value: control.errors['max'].max }
      );
    }
    if (control.errors['email']) {
      return this.t(
        '{{label}} must be a valid email',
        `${label} must be a valid email`,
        { label }
      );
    }
    if (control.errors['pattern']) {
      return this.t(
        '{{label}} has an invalid format',
        `${label} has an invalid format`,
        { label }
      );
    }

    return this.t('Invalid value', 'Invalid value');
  }

  getFieldTemplate(key: string): TemplateRef<any> | null {
    if (!this.fieldTemplates) return null;
    const directive = this.fieldTemplates.find((t) => t.nfField === key);
    return directive?.templateRef ?? null;
  }

  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
  }

  onAttachmentCountChange(count: number): void {
    this.attachmentCount.set(count);
  }

  onWorkflowApprovalState(state: 'loading' | 'none' | 'pending' | 'approved' | 'rejected'): void {
    this.workflowApprovalState.set(state);
  }

  onWorkflowActionDone(event: { action: 'approve' | 'reject' }): void {
    this.workflowRefreshTrigger.update((v) => v + 1);
    const key = event.action === 'approve' ? 'workflow.toast.approved' : 'workflow.toast.rejected';
    const message = this.translate.instant(key);
    // Toast would be shown by parent or a global snackbar service; for now we only refresh
  }

  onWorkflowResubmit(): void {
    this.onWorkflowSubmit();
  }

  onWorkflowSubmit(): void {
    const entityType = this.workflowEntityType();
    const entityId = this.workflowEntityId();
    const templates = this.workflowTemplates();
    const cfg = this.config();
    const templateCode = cfg.features?.workflowConfig?.templateCode;

    let code: string | undefined = templateCode ?? (templates.length === 1 ? templates[0].code : undefined);
    if (templates.length > 1 && !code) {
      const dialogRef = this.dialog.open(WorkflowTemplateSelectDialogComponent, {
        width: '400px',
        data: { templates },
      });
      dialogRef.afterClosed().subscribe((result: string | undefined) => {
        if (result != null) this.triggerWorkflow(entityType, entityId, result);
      });
      return;
    }
    if (code) this.triggerWorkflow(entityType, entityId, code);
  }

  private triggerWorkflow(entityType: string, entityId: string, templateCode: string): void {
    this.workflowTriggering.set(true);
    this.workflowApi.trigger(templateCode, entityType, entityId).subscribe({
      next: () => {
        this.workflowTriggering.set(false);
        this.workflowRefreshTrigger.update((v) => v + 1);
        this.workflowApprovalState.set('loading');
      },
      error: () => {
        this.workflowTriggering.set(false);
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Public Methods
  // ═══════════════════════════════════════════════════════════════════════════

  /** Get current form value */
  getValue(): Partial<TItem> {
    return this.form.getRawValue() as Partial<TItem>;
  }

  /** Check if form is valid */
  isValid(): boolean {
    return this.form.valid;
  }

  /** Check if form is dirty */
  isDirty(): boolean {
    return this.form.dirty;
  }

  /** Mark form as pristine */
  markAsPristine(): void {
    this.form.markAsPristine();
    this._isDirty.set(false);
  }

  /** Reset form to initial values */
  reset(): void {
    const item = this.item();
    const cfg = this.config();

    for (const field of cfg.fields) {
      const control = this.getFieldControl(field.key);
      if (control) {
        const value = item ? (item as Record<string, unknown>)[field.key] : field.defaultValue ?? null;
        control.setValue(value);
      }
    }

    this.form.markAsPristine();
    this._isDirty.set(false);
  }

  private translateLabel(value: string): string {
    const translated = this.translate.instant(value);
    return translated === value ? value : translated;
  }

  private translateMessage(value: string): string {
    const translated = this.translate.instant(value);
    return translated === value ? value : translated;
  }

  private t(key: string, fallback: string, params?: Record<string, unknown>): string {
    const translated = this.translate.instant(key, params);
    return translated === key ? fallback : translated;
  }
}
