import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

import type { Member } from '../../members/models';

export interface AddMembersDialogData {
  candidates: Member[];
}

export type AddMembersDialogResult = string[];

@Component({
  selector: 'app-add-members-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'administration.roles.detail.members.addDialog.title' | translate }}</h2>

    <mat-dialog-content>
      <p class="add-members-dialog__subtitle">
        {{ 'administration.roles.detail.members.addDialog.subtitle' | translate }}
      </p>

      @if (data.candidates.length > 0) {
        <mat-form-field appearance="outline" class="add-members-dialog__search">
          <mat-label>{{ 'administration.roles.detail.members.addDialog.search' | translate }}</mat-label>
          <input matInput [formControl]="searchCtrl" autocomplete="off" />
        </mat-form-field>
      }

      @if (data.candidates.length === 0) {
        <p class="add-members-dialog__empty">
          {{ 'administration.roles.detail.members.addDialog.noCandidates' | translate }}
        </p>
      } @else if (filteredCandidates().length === 0) {
        <p class="add-members-dialog__empty">
          {{ 'administration.roles.detail.members.addDialog.noResults' | translate }}
        </p>
      } @else {
        <div class="add-members-dialog__list">
          @for (candidate of filteredCandidates(); track candidate.id) {
            <div class="add-members-dialog__row">
              <mat-checkbox
                [checked]="selected().has(candidate.id)"
                (change)="toggle(candidate.id)">
                <span class="add-members-dialog__name">{{ candidate.displayName ?? candidate.email }}</span>
                @if (candidate.displayName) {
                  <span class="add-members-dialog__email">{{ candidate.email }}</span>
                }
              </mat-checkbox>
            </div>
          }
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="close()">
        {{ 'common.actions.cancel' | translate }}
      </button>
      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="selected().size === 0"
        (click)="confirm()">
        @if (selected().size > 0) {
          {{ 'administration.roles.detail.members.addDialog.confirmCount' | translate : { count: selected().size } }}
        } @else {
          {{ 'administration.roles.detail.members.addDialog.confirm' | translate }}
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .add-members-dialog__subtitle {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      color: var(--nf-text-muted, #6b7280);
    }
    .add-members-dialog__search {
      width: 100%;
      margin-bottom: 0.5rem;
    }
    .add-members-dialog__empty {
      font-size: 0.875rem;
      color: var(--nf-text-muted, #6b7280);
      margin: 0.5rem 0;
    }
    .add-members-dialog__list {
      min-width: min(480px, 80vw);
      max-height: 320px;
      overflow-y: auto;
      border: 1px solid var(--nf-border-subtle, #f3f4f6);
      border-radius: 0.375rem;
    }
    .add-members-dialog__row {
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--nf-border-subtle, #f3f4f6);
    }
    .add-members-dialog__row:last-child {
      border-bottom: none;
    }
    .add-members-dialog__name {
      font-size: 0.875rem;
      font-weight: 500;
    }
    .add-members-dialog__email {
      display: block;
      font-size: 0.75rem;
      color: var(--nf-text-muted, #6b7280);
      margin-left: 1.5rem;
    }
  `],
})
export class AddMembersDialogComponent {
  readonly data = inject<AddMembersDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AddMembersDialogComponent, AddMembersDialogResult | undefined>);

  readonly searchCtrl = new FormControl('', { nonNullable: true });
  private readonly searchQuery = signal('');
  readonly selected = signal(new Set<string>());

  readonly filteredCandidates = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.data.candidates;
    return this.data.candidates.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        (c.displayName ?? '').toLowerCase().includes(q)
    );
  });

  constructor() {
    this.searchCtrl.valueChanges.subscribe((v) => this.searchQuery.set(v));
  }

  toggle(id: string): void {
    this.selected.update((s) => {
      const next = new Set(s);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  close(): void {
    this.dialogRef.close(undefined);
  }

  confirm(): void {
    this.dialogRef.close([...this.selected()]);
  }
}
