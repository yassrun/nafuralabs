import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '@lib/anatomy';
import type { UiHierarchyHint } from '../../doc-extractor/models/ui-schema.model';
import type { SmartImportConfig, SmartImportSchemaView } from '../models/smart-import.model';

interface HelpDialogData {
  schema: SmartImportSchemaView;
  arrayPath: string;
  config: SmartImportConfig;
}

@Component({
  selector: 'nf-smart-import-help-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, TranslateModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="help">
      <header>
        <h2>{{ data.schema.name }}</h2>
        @if (data.schema.description) {
          <p>{{ data.schema.description }}</p>
        }
      </header>

      <section>
        <h3>{{ 'platform.smartImport.help.formats' | translate }}</h3>
        <div class="chips">
          @for (format of data.config.acceptedExtensions; track format) {
            <span>{{ format }}</span>
          }
        </div>
        <small>
          {{ 'platform.smartImport.help.maxSize' | translate:{
            size: data.config.maxFileSizeBytes / 1024 / 1024
          } }}
        </small>
      </section>

      @if (hierarchy().length > 0) {
        <section>
          <h3>{{ 'platform.smartImport.help.hierarchy' | translate }}</h3>
          <p class="hint">{{ 'platform.smartImport.help.hierarchyHint' | translate }}</p>
          <ol class="tree">
            @for (level of hierarchy(); track level.level) {
              <li>
                <strong>{{ level.label }}</strong>
                <div class="chips">
                  @for (field of level.fields; track field) {
                    <span>{{ field }}</span>
                  }
                </div>
              </li>
            }
          </ol>
        </section>
      }

      <section>
        <h3>{{ 'platform.smartImport.help.expectedFields' | translate }}</h3>
        <div class="fields">
          @for (field of fields(); track field.key) {
            <div class="field">
              <span>{{ field.title }}</span>
              <span class="badge" [class.required]="field.required">
                {{ (field.required
                  ? 'platform.smartImport.help.required'
                  : 'platform.smartImport.help.optional') | translate }}
              </span>
            </div>
          }
        </div>
      </section>

      <section class="policy">
        <strong>{{ 'platform.smartImport.help.behaviour' | translate }}</strong>
        <p>
          {{ (data.config.importPolicy === 'STRICT'
            ? 'platform.smartImport.help.strict'
            : 'platform.smartImport.help.partial') | translate }}
        </p>
        <p>{{ 'platform.smartImport.help.duplicates' | translate }}</p>
      </section>

      <footer>
        <nf-button variant="primary" (clicked)="close()">
          {{ 'common.close' | translate }}
        </nf-button>
      </footer>
    </div>
  `,
  styles: [`
    .help { padding: 1.25rem; display: grid; gap: 1rem; min-width: min(560px, 88vw); }
    h2, h3, p { margin: 0; }
    header p, small, .policy p, .hint { color: var(--nf-color-text-secondary); }
    section { display: grid; gap: .5rem; }
    .chips { display: flex; flex-wrap: wrap; gap: .375rem; }
    .chips span, .badge {
      padding: .2rem .5rem;
      border-radius: 999px;
      background: var(--nf-color-bg-subtle);
      font-size: .75rem;
    }
    .badge.required { color: var(--nf-color-danger-700); }
    .fields { border: 1px solid var(--nf-color-border); border-radius: .5rem; }
    .field { display: flex; justify-content: space-between; padding: .55rem .75rem; }
    .field + .field { border-top: 1px solid var(--nf-color-border); }
    .tree { margin: 0; padding-left: 1.2rem; display: grid; gap: .55rem; }
    .tree li { display: grid; gap: .3rem; }
    footer { display: flex; justify-content: flex-end; }
  `],
})
export class SmartImportHelpDialogComponent {
  readonly data = inject<HelpDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<SmartImportHelpDialogComponent>);

  hierarchy(): UiHierarchyHint[] {
    return this.data.schema.uiSchema?.hierarchyHint ?? [];
  }

  fields(): Array<{ key: string; title: string; required: boolean }> {
    const schema = this.data.schema.jsonSchema as unknown as Record<string, unknown>;
    const rootProperties = schema['properties'] as Record<string, unknown> | undefined;
    const arraySchema = rootProperties?.[this.data.arrayPath] as Record<string, unknown> | undefined;
    const itemSchema = arraySchema?.['items'] as Record<string, unknown> | undefined;
    const properties = itemSchema?.['properties'] as Record<string, Record<string, unknown>> | undefined;
    const required = new Set(
      Array.isArray(itemSchema?.['required']) ? (itemSchema?.['required'] as string[]) : [],
    );
    return Object.entries(properties ?? {})
      .filter(([, value]) => {
        const type = value['type'];
        const primary = Array.isArray(type) ? type[0] : type;
        return primary !== 'array' && primary !== 'object';
      })
      .map(([key, value]) => ({
        key,
        title: typeof value['title'] === 'string' ? value['title'] : key,
        required: required.has(key),
      }));
  }

  close(): void {
    this.ref.close();
  }
}
