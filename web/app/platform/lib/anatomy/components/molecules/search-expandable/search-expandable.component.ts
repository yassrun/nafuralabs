import {
  Component,
  input,
  output,
  signal,
  ElementRef,
  afterNextRender,
  inject,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { SearchInputComponent } from '../search-input';

/**
 * Expandable Search Component
 *
 * Shows a loupe button first. On click, expands to show the text input (cursor focused).
 * Click outside to close. No close (X) button. Input is borderless with light fill.
 */
@Component({
  selector: 'nf-search-expandable',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, TranslateModule, SearchInputComponent],
  template: `
    <div
      class="nf-search-expandable"
      [class.nf-search-expandable--expanded]="expanded()"
    >
      @if (!expanded()) {
        <button
          mat-icon-button
          class="nf-search-expandable__trigger"
          type="button"
          [attr.aria-label]="triggerAriaLabel() | translate"
          (click)="open()"
        >
          <mat-icon>search</mat-icon>
        </button>
      } @else {
        <div class="nf-search-expandable__input-wrap">
          <nf-search-input
            [placeholder]="placeholder()"
            [value]="value()"
            [debounceMs]="debounceMs()"
            appearance="fill"
            [showClearButton]="false"
            [autofocus]="true"
            (search)="onSearch($event)"
            (clear)="onClear()"
          ></nf-search-input>
        </div>
      }
    </div>
  `,
  styles: [`
    .nf-search-expandable {
      display: flex;
      align-items: center;
      width: fit-content;
      min-width: 0;
    }

    .nf-search-expandable__trigger {
      flex-shrink: 0;
    }

    .nf-search-expandable__trigger mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .nf-search-expandable__input-wrap {
      display: flex;
      align-items: center;
      min-width: 180px;
      max-width: 320px;
    }

    .nf-search-expandable__input-wrap nf-search-input {
      flex: 1 1 auto;
      min-width: 0;
    }
  `],
})
export class SearchExpandableComponent implements OnDestroy {
  private readonly elRef = inject(ElementRef);

  placeholder = input<string>('Search');
  value = input<string>('');
  debounceMs = input<number>(300);
  triggerAriaLabel = input<string>('Search');

  search = output<string>();
  clear = output<void>();

  readonly expanded = signal(false);

  private boundClickOutside = (e: MouseEvent) => this.handleClickOutside(e);

  constructor() {
    afterNextRender(() => {
      document.addEventListener('click', this.boundClickOutside);
    });
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.boundClickOutside);
  }

  private handleClickOutside(e: MouseEvent): void {
    if (!this.expanded()) return;
    const host = this.elRef.nativeElement as HTMLElement;
    if (host.contains(e.target as Node)) return;
    this.close();
  }

  open(): void {
    this.expanded.set(true);
  }

  close(): void {
    this.expanded.set(false);
  }

  onSearch(value: string): void {
    this.search.emit(value);
  }

  onClear(): void {
    this.clear.emit();
  }
}
