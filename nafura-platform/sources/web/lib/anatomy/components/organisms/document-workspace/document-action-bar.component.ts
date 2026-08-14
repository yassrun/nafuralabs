import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PermissionService } from '../../../../../core/security/services/permission.service';
import type { DocumentActionEvent, DocumentActionUiConfig } from '../../../types';

@Component({
  selector: 'nf-document-action-bar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    @if (visibleActions().length > 0) {
      <div class="nf-doc-actions" role="toolbar">
        @for (a of visibleActions(); track a.id) {
          <button
            mat-stroked-button
            type="button"
            [disabled]="disabled()"
            (click)="emit(a)"
            [matTooltip]="a.label">
            @if (a.icon) {
              <mat-icon>{{ a.icon }}</mat-icon>
            }
            <span class="nf-doc-actions__label">{{ a.label }}</span>
          </button>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .nf-doc-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px 0 0;
      border-top: 1px solid var(--nf-border-default, #e5e7eb);
      margin-top: 16px;
    }
    mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 6px;
    }
    .nf-doc-actions__label {
      font-size: 0.875rem;
    }
  `,
})
export class DocumentActionBarComponent {
  private readonly permissions = inject(PermissionService);

  readonly actions = input<DocumentActionUiConfig[]>([]);
  readonly document = input<unknown | null>(null);
  readonly disabled = input(false);

  readonly action = output<DocumentActionEvent>();

  readonly visibleActions = () =>
    this.actions().filter((a) => !a.permission || this.permissions.hasPermission(a.permission));

  emit(a: DocumentActionUiConfig): void {
    this.action.emit({
      actionId: a.id,
      kind: a.kind,
      document: this.document() as any,
      commandId: a.commandId,
    });
  }
}
