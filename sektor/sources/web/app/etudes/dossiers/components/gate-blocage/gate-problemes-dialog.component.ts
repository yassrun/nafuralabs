import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { ButtonComponent } from '@platform/lib/anatomy';

import type { ProblemeGate } from '@app/etudes/models';

export interface GateProblemesDialogData {
  problemes: ProblemeGate[];
}

@Component({
  selector: 'app-gate-problemes-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, TranslateModule, ButtonComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>{{ 'etudes.gate.details_titre' | translate }} ({{ data.problemes.length }})</h2>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>

      <ul class="liste">
        @for (p of data.problemes; track p.noeudId ?? p.message + p.codeArticle) {
          <li>
            @if (p.codeArticle) {
              <span class="code">{{ p.codeArticle }}</span>
            }
            <span class="libelle">{{ p.libelle || (p.message | translate) }}</span>
            @if (p.noeudId) {
              <button type="button" class="link" (click)="voirDansArbre(p)">
                {{ 'etudes.gate.voir_dans_arbre' | translate }}
              </button>
            }
          </li>
        }
      </ul>

      <footer>
        <nf-button variant="ghost" (clicked)="close()">Fermer</nf-button>
      </footer>
    </div>
  `,
  styles: `
    .dialog-shell {
      min-width: min(36rem, 92vw);
      max-width: 92vw;
      padding: 1rem 1.1rem 1.1rem;
      display: flex;
      flex-direction: column;
      max-height: min(80vh, 40rem);
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }
    h2 {
      margin: 0;
      font-size: 1.05rem;
    }
    .liste {
      margin: 0.75rem 0 0;
      padding: 0;
      list-style: none;
      overflow: auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    li {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0.35rem 0.5rem;
      padding: 0.4rem 0.15rem;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.8125rem;
    }
    .code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.75rem;
      font-weight: 650;
      padding: 0.05rem 0.3rem;
      border-radius: 4px;
      background: #f1f5f9;
    }
    .libelle {
      flex: 1 1 12rem;
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .link {
      appearance: none;
      border: 0;
      background: transparent;
      color: #1d4ed8;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 2px;
      padding: 0;
      white-space: nowrap;
    }
    footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 0.85rem;
      flex-shrink: 0;
    }
  `,
})
export class GateProblemesDialogComponent {
  readonly data = inject<GateProblemesDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<GateProblemesDialogComponent, ProblemeGate | undefined>);

  close(): void {
    this.dialogRef.close();
  }

  voirDansArbre(p: ProblemeGate): void {
    this.dialogRef.close(p);
  }
}

export function openGateProblemesDialog(
  dialog: MatDialog,
  problemes: ProblemeGate[],
): Promise<ProblemeGate | undefined> {
  const ref = dialog.open<GateProblemesDialogComponent, GateProblemesDialogData, ProblemeGate | undefined>(
    GateProblemesDialogComponent,
    {
      data: { problemes },
      width: 'min(40rem, 94vw)',
      maxHeight: '80vh',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    },
  );
  return firstValueFrom(ref.afterClosed());
}
