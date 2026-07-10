/**
 * PreviewRenderer Component
 * 
 * Shows live preview of the generated schemas from the builder state.
 */

import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { BuilderStateStore } from '../../builder-state.store';
import { buildDataSchema, buildUiSchema } from '../../doc-type-builder-engine';

@Component({
  selector: 'app-preview-renderer',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="preview-renderer">
      <mat-tab-group>
        <!-- JSON Schema Preview -->
        <mat-tab label="JSON Schema (Data)">
          <div class="schema-preview">
            <div class="schema-header">
              <h4>Generated JSON Schema</h4>
              <button mat-icon-button 
                (click)="copyToClipboard(jsonSchemaPreview())"
                matTooltip="Copy to clipboard">
                <mat-icon>content_copy</mat-icon>
              </button>
            </div>
            <pre class="code-block">{{ jsonSchemaPreview() }}</pre>
          </div>
        </mat-tab>

        <!-- UI Schema Preview -->
        <mat-tab label="UI Schema">
          <div class="schema-preview">
            <div class="schema-header">
              <h4>Generated UI Schema</h4>
              <button mat-icon-button 
                (click)="copyToClipboard(uiSchemaPreview())"
                matTooltip="Copy to clipboard">
                <mat-icon>content_copy</mat-icon>
              </button>
            </div>
            <pre class="code-block">{{ uiSchemaPreview() }}</pre>
          </div>
        </mat-tab>

        <!-- Builder State Preview -->
        <mat-tab label="Builder State (Debug)">
          <div class="schema-preview">
            <div class="schema-header">
              <h4>Current Builder State</h4>
              <button mat-icon-button 
                (click)="copyToClipboard(builderStatePreview())"
                matTooltip="Copy to clipboard">
                <mat-icon>content_copy</mat-icon>
              </button>
            </div>
            <pre class="code-block">{{ builderStatePreview() }}</pre>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .preview-renderer {
      height: 100%;
    }

    .schema-preview {
      padding: 16px;
    }

    .schema-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.7);
      }
    }

    .code-block {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 16px;
      border-radius: 8px;
      overflow: auto;
      max-height: 500px;
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 13px;
      line-height: 1.5;
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
    }
  `],
})
export class PreviewRendererComponent {
  private readonly store = inject(BuilderStateStore);
  private readonly snackBar = inject(MatSnackBar);

  readonly jsonSchemaPreview = computed(() => {
    try {
      const schema = buildDataSchema(this.store.state());
      return JSON.stringify(schema, null, 2);
    } catch (e) {
      return `Error generating schema: ${e}`;
    }
  });

  readonly uiSchemaPreview = computed(() => {
    try {
      const schema = buildUiSchema(this.store.state());
      return JSON.stringify(schema, null, 2);
    } catch (e) {
      return `Error generating schema: ${e}`;
    }
  });

  readonly builderStatePreview = computed(() => {
    return JSON.stringify(this.store.state(), null, 2);
  });

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('Copied to clipboard!', 'Dismiss', { duration: 2000 });
    });
  }
}
