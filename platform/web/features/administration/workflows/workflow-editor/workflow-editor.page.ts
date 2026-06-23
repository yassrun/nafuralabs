import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { ToastService } from '@lib/anatomy';

import type { WorkflowStepDto } from '../models';
import { WorkflowsFacade, WorkflowTemplatesApiService } from '../services';
import { WorkflowStepDialogComponent } from '../components/workflow-step-dialog.component';
import { RolesApiService } from '../../iam/roles/services/roles-api.service';
import type { Role } from '../../iam/roles/models/role.model';

function toKebab(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

@Component({
  selector: 'app-workflow-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    PageShellComponent,
    PageHeaderComponent,
  ],
  template: `
    <nf-page-shell>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      <div class="workflow-editor">
        <form [formGroup]="form" class="workflow-editor__form">
          <div class="workflow-editor__row">
            <mat-form-field appearance="outline">
              <mat-label>{{ 'administration.workflows.fields.name' | translate }}</mat-label>
              <input matInput formControlName="name" (blur)="syncCodeFromName()" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ 'administration.workflows.fields.code' | translate }}</mat-label>
              <input matInput formControlName="code" />
            </mat-form-field>
          </div>
          <div class="workflow-editor__row">
            <mat-form-field appearance="outline">
              <mat-label>{{ 'administration.workflows.fields.entityType' | translate }}</mat-label>
              <mat-select formControlName="entityType">
                @for (et of entityTypes(); track et) {
                  <mat-option [value]="et">{{ et }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="workflow-editor__toggle-wrap">
              <mat-label>{{ 'administration.workflows.fields.active' | translate }}</mat-label>
              <mat-slide-toggle formControlName="isActive"></mat-slide-toggle>
            </mat-form-field>
          </div>
          <mat-form-field appearance="outline" class="workflow-editor__desc">
            <mat-label>{{ 'administration.workflows.fields.description' | translate }}</mat-label>
            <textarea matInput formControlName="description" rows="2"></textarea>
          </mat-form-field>
        </form>

        <section class="workflow-editor__steps">
          <h3 class="workflow-editor__steps-title">{{ 'administration.workflows.stepsTitle' | translate }}</h3>
          <ul class="workflow-editor__steps-list">
            @for (step of steps(); track $index; let i = $index) {
              <li class="workflow-editor__step">
                <span class="workflow-editor__step-num">{{ i + 1 }}.</span>
                <span class="workflow-editor__step-info">
                  {{ step.name }} — {{ step.approverRole }}
                  @if (step.timeoutHours) {
                    <span class="workflow-editor__step-meta">
                      {{ step.timeoutHours }}h
                      @if (step.escalationRole) {
                        → {{ step.escalationRole }}
                      }
                    </span>
                  }
                </span>
                <div class="workflow-editor__step-actions">
                  <button mat-icon-button type="button" (click)="editStep(i)" [attr.aria-label]="'common.actions.edit' | translate">
                    <span class="nf-icon nf-icon-edit"></span>
                  </button>
                  <button mat-icon-button type="button" (click)="removeStep(i)" [attr.aria-label]="'common.actions.delete' | translate">
                    <span class="nf-icon nf-icon-trash-2"></span>
                  </button>
                  <button mat-icon-button type="button" (click)="moveStep(i, -1)" [disabled]="i === 0" [attr.aria-label]="'common.actions.moveUp' | translate">
                    <span class="nf-icon nf-icon-chevron-up"></span>
                  </button>
                  <button mat-icon-button type="button" (click)="moveStep(i, 1)" [disabled]="i === steps().length - 1" [attr.aria-label]="'common.actions.moveDown' | translate">
                    <span class="nf-icon nf-icon-chevron-down"></span>
                  </button>
                </div>
              </li>
            }
          </ul>
          <button mat-stroked-button type="button" (click)="addStep()" class="workflow-editor__add-step">
            <span class="nf-icon nf-icon-plus"></span>
            {{ 'administration.workflows.addStep' | translate }}
          </button>
        </section>

        <div class="workflow-editor__actions">
          <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid || saving()">
            {{ 'common.actions.save' | translate }}
          </button>
          <button mat-button type="button" (click)="cancel()">
            {{ 'common.actions.cancel' | translate }}
          </button>
        </div>
      </div>
    </nf-page-shell>
  `,
  styles: [
    `
      .workflow-editor { padding: 0 1rem 1rem; max-width: 800px; }
      .workflow-editor__form { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
      .workflow-editor__row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
      .workflow-editor__desc { width: 100%; }
      .workflow-editor__toggle-wrap { display: flex; align-items: center; }
      .workflow-editor__steps { border-top: 1px solid var(--nf-border-default); padding-top: 1rem; }
      .workflow-editor__steps-title { margin: 0 0 0.75rem 0; font-size: 1rem; }
      .workflow-editor__steps-list { list-style: none; padding: 0; margin: 0 0 1rem 0; }
      .workflow-editor__step {
        display: flex; align-items: center; gap: 0.5rem;
        padding: 0.5rem 0; border-bottom: 1px solid var(--nf-border-subtle);
      }
      .workflow-editor__step-num { font-weight: 600; min-width: 1.5rem; }
      .workflow-editor__step-info { flex: 1; }
      .workflow-editor__step-meta { color: var(--nf-text-muted); font-size: 0.875rem; margin-left: 0.5rem; }
      .workflow-editor__step-actions { display: flex; gap: 0; }
      .workflow-editor__add-step { margin-bottom: 1rem; }
      .workflow-editor__actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
    `,
  ],
})
export class WorkflowEditorPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(WorkflowsFacade);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly rolesApi = inject(RolesApiService);
  private readonly workflowTemplatesApi = inject(WorkflowTemplatesApiService);

  readonly steps = signal<WorkflowStepDto[]>([]);
  readonly entityTypes = signal<string[]>([]);
  readonly roleOptions = signal<{ value: string; label: string }[]>([]);
  readonly saving = signal(false);
  readonly isNew = computed(() => this.route.snapshot.paramMap.get('id') === 'new');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    code: ['', [Validators.required, Validators.maxLength(60)]],
    entityType: ['', Validators.required],
    description: [''],
    isActive: [true],
  });

  readonly headerConfig = computed(() => {
    const title = this.facade.current()?.name ?? this.i18n.instant('administration.workflows.editorTitle');
    return {
      title,
      breadcrumbs: [
        { label: 'administration.workflows.title', route: '/administration/workflows' },
        { label: title },
      ],
    };
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    this.entityTypes.set(await this.workflowTemplatesApi.getEntityTypes());
    const rolesRes = await this.rolesApi.getAll({ page: 0, pageSize: 500 }).catch(() => ({ items: [] as Role[], total: 0 }));
    this.roleOptions.set(
      (rolesRes.items ?? []).map((r) => ({ value: r.roleCode ?? r.id, label: r.name ?? r.roleCode ?? r.id }))
    );

    if (!id || id === 'new') {
      this.form.patchValue({ isActive: true });
      return;
    }

    const template = await this.facade.loadOne(id);
    if (!template) {
      this.toast.error(this.i18n.instant('administration.workflows.loadError'));
      await this.router.navigate(['/administration/workflows']);
      return;
    }
    this.form.patchValue({
      name: template.name,
      code: template.code,
      entityType: template.entityType,
      description: template.description ?? '',
      isActive: template.isActive ?? true,
    });
    this.steps.set(
      (template.steps ?? []).map((s, i) => ({
        ...s,
        stepNumber: s.stepNumber ?? i + 1,
      }))
    );
  }

  syncCodeFromName(): void {
    const name = this.form.controls.name.value;
    if (name && !this.form.controls.code.dirty) {
      this.form.controls.code.setValue(toKebab(name));
    }
  }

  async addStep(): Promise<void> {
    const result = await this.dialog
      .open(WorkflowStepDialogComponent, {
        width: '420px',
        data: {
          stepNumber: this.steps().length + 1,
          roleOptions: this.roleOptions(),
        },
      })
      .afterClosed()
      .toPromise();
    if (result) {
      this.steps.update((list) => [...list, { ...result, stepNumber: list.length + 1 }]);
    }
  }

  async editStep(index: number): Promise<void> {
    const list = this.steps();
    const step = list[index];
    const result = await this.dialog
      .open(WorkflowStepDialogComponent, {
        width: '420px',
        data: {
          step: { ...step, stepNumber: index + 1 },
          stepNumber: index + 1,
          roleOptions: this.roleOptions(),
        },
      })
      .afterClosed()
      .toPromise();
    if (result) {
      this.steps.update((l) => {
        const next = [...l];
        next[index] = { ...result, stepNumber: index + 1 };
        return next;
      });
    }
  }

  removeStep(index: number): void {
    this.steps.update((list) => {
      const next = list.filter((_, i) => i !== index);
      return next.map((s, i) => ({ ...s, stepNumber: i + 1 }));
    });
  }

  moveStep(index: number, delta: number): void {
    const list = [...this.steps()];
    const to = index + delta;
    if (to < 0 || to >= list.length) return;
    [list[index], list[to]] = [list[to], list[index]];
    this.steps.set(list.map((s, i) => ({ ...s, stepNumber: i + 1 })));
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    const id = this.route.snapshot.paramMap.get('id');
    const raw = this.form.getRawValue();
    const stepsPayload = this.steps().map((s, i) => ({
      stepNumber: i + 1,
      name: s.name,
      approverRole: s.approverRole,
      timeoutHours: s.timeoutHours ?? undefined,
      escalationRole: s.escalationRole ?? undefined,
      condition: s.condition ?? undefined,
    }));

    this.saving.set(true);
    try {
      if (id && id !== 'new') {
        await this.facade.update(id, {
          code: raw.code,
          name: raw.name,
          entityType: raw.entityType,
          description: raw.description || undefined,
          isActive: raw.isActive,
          steps: stepsPayload,
        });
        this.toast.success(this.i18n.instant('administration.workflows.saveSuccess'));
      } else {
        const created = await this.facade.create({
          code: raw.code,
          name: raw.name,
          entityType: raw.entityType,
          description: raw.description || undefined,
          isActive: raw.isActive,
          steps: stepsPayload,
        });
        this.toast.success(this.i18n.instant('administration.workflows.createSuccess'));
        await this.router.navigate(['/administration/workflows', created.id]);
      }
    } catch {
      this.toast.error(this.i18n.instant('administration.workflows.saveError'));
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    this.router.navigate(['/administration/workflows']);
  }
}
