import {
  Component,
  input,
  output,
  signal,
  viewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

/**
 * Search Input Component
 *
 * Search field with debounce and clear.
 *
 * @example
 * <nf-search-input
 *   placeholder="Search items..."
 *   [debounceMs]="400"
 *   (search)="onSearch($event)">
 * </nf-search-input>
 */
@Component({
  selector: 'nf-search-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    TranslateModule,
  ],
  template: `
    <mat-form-field
      [appearance]="appearance()"
      class="nf-search-input nf-search-input--{{ appearance() }}"
    >
      <mat-icon matPrefix>search</mat-icon>
      <input
        matInput
        #inputRef
        type="text"
        [placeholder]="placeholder() | translate"
        [(ngModel)]="searchValue"
        (ngModelChange)="onInputChange($event)"
      />
      @if (searchValue() && showClearButton()) {
        <button
          matSuffix
          mat-icon-button
          [attr.aria-label]="'Clear' | translate"
          (click)="onClear()"
        >
          <mat-icon>close</mat-icon>
        </button>
      }
    </mat-form-field>
  `,
  styles: [`
    :host {
      display: block;
    }

    .nf-search-input {
      width: 100%;
      max-width: 320px;

      ::ng-deep {
        .mat-mdc-form-field-subscript-wrapper {
          display: none;
        }

        .mat-mdc-text-field-wrapper {
          padding: 0 12px;
        }

        .mat-mdc-form-field-infix {
          padding-top: 8px;
          padding-bottom: 8px;
          min-height: 40px;
        }

        input {
          font-size: 0.875rem;
        }

        mat-icon[matPrefix] {
          color: var(--nf-color-text-secondary, #666);
          margin-right: 8px;
        }
      }
    }

    .nf-search-input--fill ::ng-deep {
      .mat-mdc-form-field-focus-overlay {
        background-color: transparent;
      }
      .mat-mdc-text-field-wrapper {
        background-color: var(--nf-color-surface, #f5f5f5);
        border: none;
        border-radius: var(--nf-radius-md, 8px);
        box-shadow: none;
      }
      .mdc-notched-outline .mdc-notched-outline__leading,
      .mdc-notched-outline .mdc-notched-outline__notch,
      .mdc-notched-outline .mdc-notched-outline__trailing {
        border: none !important;
      }
    }
  `],
})
export class SearchInputComponent implements OnInit, OnDestroy, AfterViewInit {
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('inputRef');

  // Inputs
  placeholder = input<string>('Search');
  debounceMs = input<number>(300);
  minLength = input<number>(0);
  value = input<string>('');
  appearance = input<'outline' | 'fill'>('outline');
  showClearButton = input<boolean>(true);
  autofocus = input<boolean>(false);

  // Outputs
  search = output<string>();
  clear = output<void>();

  // State
  searchValue = signal<string>('');

  ngOnInit(): void {
    // Set initial value
    this.searchValue.set(this.value());

    // Setup debounced search
    this.searchSubject
      .pipe(
        debounceTime(this.debounceMs()),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        if (value.length >= this.minLength() || value.length === 0) {
          this.search.emit(value);
        }
      });
  }

  ngAfterViewInit(): void {
    if (this.autofocus()) {
      const el = this.inputRef()?.nativeElement;
      if (el) setTimeout(() => el.focus(), 0);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInputChange(value: string): void {
    this.searchValue.set(value);
    this.searchSubject.next(value);
  }

  onClear(): void {
    this.searchValue.set('');
    this.search.emit('');
    this.clear.emit();
  }
}
