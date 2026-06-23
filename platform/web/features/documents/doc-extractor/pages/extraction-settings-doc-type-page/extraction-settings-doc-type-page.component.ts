/**
 * Extraction Settings - DocType Page
 * 
 * Full versioning workflow with builder integration:
 * - Select Domain + DocType + Version
 * - View status (DRAFT/PUBLISHED/DEPRECATED)
 * - Actions: Cancel / Publish / Save Draft / Create New Version
 * - Edit BuilderState via builder components
 */

import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap, catchError, of, firstValueFrom } from 'rxjs';

import { DocTypeVersioningService } from '../../services/doc-type-versioning.service';
import { 
  DocTypeDefinition, 
  DocTypeVersionSummary, 
  DocTypeStatus,
  SaveDraftRequest 
} from '../../models/doc-type-definition.model';
import { BuilderState, createEmptyBuilderState } from '../../models/builder-state.model';
import { BuilderStateStore } from '../../builder/builder-state.store';
import { importFromSchemas } from '../../builder/doc-type-builder-engine';
import { FieldEditorComponent } from '../../builder/components/field-editor/field-editor.component';
import { LayoutEditorComponent } from '../../builder/components/layout-editor/layout-editor.component';
import { PreviewRendererComponent } from '../../builder/components/preview-renderer/preview-renderer.component';
import { ConfirmDialogService } from '../../../../../core/components/confirm-dialog';
import { FlipIconRtlDirective } from '../../../../../lib/anatomy/directives';

@Component({
  selector: 'app-extraction-settings-doc-type-page',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    RouterModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTabsModule,
    FieldEditorComponent,
    LayoutEditorComponent,
    PreviewRendererComponent,
    FlipIconRtlDirective,
  ],
  templateUrl: './extraction-settings-doc-type-page.component.html',
  styleUrl: './extraction-settings-doc-type-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [BuilderStateStore],
})
export class ExtractionSettingsDocTypePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly snackBar = inject(MatSnackBar);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly versioningService = inject(DocTypeVersioningService);
  readonly builderStore = inject(BuilderStateStore);

  // Route params
  private readonly params = toSignal(
    this.route.paramMap.pipe(
      map(paramMap => ({
        domainKey: paramMap.get('domainKey') ?? '',
        docTypeKey: paramMap.get('docTypeKey') ?? '',
      }))
    ),
    { initialValue: { domainKey: '', docTypeKey: '' } }
  );

  // State
  readonly loading = signal(false);
  readonly versions = signal<DocTypeVersionSummary[]>([]);
  readonly selectedVersionId = signal<string | null>(null);
  readonly currentVersion = signal<DocTypeDefinition | null>(null);
  readonly saving = signal(false);
  readonly publishing = signal(false);
  readonly activeTab = signal(0);

  // Computed
  readonly domainKey = computed(() => this.params().domainKey);
  readonly docTypeKey = computed(() => this.params().docTypeKey);
  
  readonly status = computed(() => this.currentVersion()?.status ?? null);
  readonly isDraft = computed(() => this.status() === 'DRAFT');
  readonly isPublished = computed(() => this.status() === 'PUBLISHED');
  readonly isDeprecated = computed(() => this.status() === 'DEPRECATED');
  
  readonly canEdit = computed(() => this.isDraft());
  readonly canPublish = computed(() => this.isDraft() && this.builderStore.isValid());
  readonly canCreateNewVersion = computed(() => this.isPublished() || this.isDeprecated());

  readonly statusColor = computed(() => {
    switch (this.status()) {
      case 'DRAFT': return 'accent';
      case 'PUBLISHED': return 'primary';
      case 'DEPRECATED': return 'warn';
      default: return '';
    }
  });

  readonly hasChanges = computed(() => this.builderStore.isDirty());
  readonly validationErrors = computed(() => this.builderStore.errors());

  constructor() {
    // Load versions when params change
    effect(() => {
      const { domainKey, docTypeKey } = this.params();
      if (domainKey && docTypeKey) {
        this.loadVersions();
      }
    });
  }

  // ===== Data Loading =====

  async loadVersions(): Promise<void> {
    const { domainKey, docTypeKey } = this.params();
    if (!domainKey || !docTypeKey) return;

    this.loading.set(true);
    try {
      const versions = await firstValueFrom(
        this.versioningService.listVersions(domainKey, docTypeKey)
      );
      this.versions.set(versions);

      // Auto-select first version (latest)
      if (versions.length > 0 && !this.selectedVersionId()) {
        this.selectVersion(versions[0].id);
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
      this.snackBar.open('Failed to load versions', 'Dismiss', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  async selectVersion(versionId: string): Promise<void> {
    if (this.selectedVersionId() === versionId) return;

    // Warn if there are unsaved changes
    if (this.hasChanges()) {
      const confirmed = await this.confirmDialog.warning(
        'Unsaved Changes',
        'You have unsaved changes. Discard them?',
        'Discard',
        'Cancel'
      );
      if (!confirmed) return;
    }

    this.selectedVersionId.set(versionId);
    await this.loadVersionDetails(versionId);
  }

  private async loadVersionDetails(versionId: string): Promise<void> {
    this.loading.set(true);
    try {
      const version = await firstValueFrom(this.versioningService.getVersion(versionId));
      this.currentVersion.set(version);

      // Initialize builder store with version's builder state
      let builderState = version.builderState;
      
      // If no builderState but we have schemas, try to import from them (legacy versions)
      if (!builderState || this.isEmptyBuilderState(builderState)) {
        if (version.jsonSchema || version.uiSchema) {
          console.log('Importing builder state from existing schemas (legacy version)');
          builderState = importFromSchemas(version.jsonSchema, version.uiSchema);
        } else {
          builderState = createEmptyBuilderState();
        }
      }
      
      this.builderStore.initialize(builderState);
    } catch (error) {
      console.error('Failed to load version details:', error);
      this.snackBar.open('Failed to load version details', 'Dismiss', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Check if a builder state is effectively empty (no fields defined)
   */
  private isEmptyBuilderState(state: BuilderState | null | undefined): boolean {
    if (!state) return true;
    return !state.fields || state.fields.length === 0;
  }

  // ===== Actions =====

  async saveDraft(): Promise<void> {
    const versionId = this.selectedVersionId();
    if (!versionId || !this.isDraft()) return;

    this.saving.set(true);
    try {
      const request: SaveDraftRequest = {
        name: this.currentVersion()?.name,
        description: this.currentVersion()?.description,
        promptTemplate: this.currentVersion()?.promptTemplate,
        builderState: this.builderStore.state(),
      };

      const saved = await firstValueFrom(this.versioningService.saveDraft(versionId, request));
      this.currentVersion.set(saved);
      this.builderStore.markClean();
      this.snackBar.open('Draft saved successfully', 'Dismiss', { duration: 3000 });
    } catch (error) {
      console.error('Failed to save draft:', error);
      this.snackBar.open('Failed to save draft', 'Dismiss', { duration: 3000 });
    } finally {
      this.saving.set(false);
    }
  }

  async publish(): Promise<void> {
    const versionId = this.selectedVersionId();
    if (!versionId || !this.canPublish()) return;

    // First save any pending changes
    if (this.hasChanges()) {
      await this.saveDraft();
    }

    const confirmed = await this.confirmDialog.confirm({
      title: 'Publish Version',
      message: 'Publishing will make this version immutable and active for extraction.\n\nAre you sure you want to continue?',
      confirmText: 'Publish',
      cancelText: 'Cancel',
      variant: 'info',
      icon: 'publish',
    });
    if (!confirmed) return;

    this.publishing.set(true);
    try {
      const published = await firstValueFrom(this.versioningService.publish(versionId));
      this.currentVersion.set(published);
      
      // Reload versions list to reflect status change
      await this.loadVersions();
      
      this.snackBar.open('Version published successfully!', 'Dismiss', { duration: 3000 });
    } catch (error: any) {
      console.error('Failed to publish:', error);
      const message = error?.error?.message || 'Failed to publish version';
      this.snackBar.open(message, 'Dismiss', { duration: 5000 });
    } finally {
      this.publishing.set(false);
    }
  }

  async createNewVersion(): Promise<void> {
    const versionId = this.selectedVersionId();
    const { domainKey, docTypeKey } = this.params();
    if (!versionId || !domainKey || !docTypeKey) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Create New Version',
      message: 'Create a new draft version based on this one?',
      confirmText: 'Create',
      cancelText: 'Cancel',
      variant: 'info',
      icon: 'content_copy',
    });
    if (!confirmed) return;

    this.loading.set(true);
    try {
      const newDraft = await firstValueFrom(
        this.versioningService.cloneToNewDraft(domainKey, docTypeKey, versionId)
      );
      
      // Reload versions and select the new draft
      await this.loadVersions();
      this.selectVersion(newDraft.id);
      
      this.snackBar.open('New draft version created!', 'Dismiss', { duration: 3000 });
    } catch (error: any) {
      console.error('Failed to create new version:', error);
      const message = error?.error?.message || 'Failed to create new version';
      this.snackBar.open(message, 'Dismiss', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  async cancel(): Promise<boolean> {
    if (this.hasChanges()) {
      const confirmed = await this.confirmDialog.warning(
        'Unsaved Changes',
        'You have unsaved changes. Discard them?',
        'Discard',
        'Cancel'
      );
      if (!confirmed) return false;
    }
    return this.router.navigate(['/doc-extractor/doc-types']);
  }

  goBack(): void {
    this.location.back();
  }

  // ===== Tab Handling =====

  onTabChange(index: number): void {
    this.activeTab.set(index);
  }
}

