import { Component, input, output, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FilterFieldConfig, LookupContext } from '../../../types';
import { SearchInputComponent } from '../../molecules/search-input';
import { ButtonComponent } from '../../atoms/button';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';

/**
 * Filter Bar Component
 *
 * Search + filters container. Uses PrimeNG (Aura theme) for form controls.
 *
 * @example
 * <nf-filter-bar
 *   [filters]="filterConfig"
 *   [values]="currentFilters"
 *   [lookups]="lookups()"
 *   (filterChange)="onFilterChange($event)"
 *   (search)="onSearch($event)"
 *   (reset)="onReset()">
 * </nf-filter-bar>
 */
@Component({
  selector: 'nf-filter-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    MultiSelectModule,
    DatePickerModule,
    InputNumberModule,
    FloatLabelModule,
    InputTextModule,
    TranslateModule,
    SearchInputComponent,
    ButtonComponent,
  ],
  template: `
    <div class="nf-filter-bar" [class.nf-filter-bar--collapsed]="isCollapsed()">
      <div class="nf-filter-bar__row">
        @if (showSearch()) {
          <nf-search-input
            [placeholder]="searchPlaceholder()"
            [value]="searchValue()"
            (search)="onSearchChange($event)"
          ></nf-search-input>
        }

        @if (filters().length > 0 && collapsible()) {
          <nf-button
            variant="ghost"
            [icon]="isCollapsed() ? 'filter_list' : 'filter_list_off'"
            (clicked)="toggleCollapse()"
          >
            {{ 'Filters' | translate }}
          </nf-button>
        }
      </div>

      @if (filters().length > 0 && !isCollapsed()) {
        <div class="nf-filter-bar__filters">
          @for (filter of filters(); track filter.key) {
            <div class="nf-filter-bar__field">
              @switch (filter.type) {
                @case ('select') {
                  <p-select
                    [options]="getSelectOptions(filter)"
                    optionLabel="label"
                    optionValue="value"
                    [ngModel]="getFilterValue(filter.key)"
                    (ngModelChange)="onFilterValueChange(filter.key, $event)"
                    [placeholder]="filter.label | translate"
                    variant="outlined"
                    styleClass="nf-filter-bar__input"
                  />
                }
                @case ('multiselect') {
                  <p-multiSelect
                    [options]="getOptions(filter)"
                    optionLabel="label"
                    optionValue="value"
                    [ngModel]="getFilterValue(filter.key) || []"
                    (ngModelChange)="onFilterValueChange(filter.key, $event)"
                    [placeholder]="filter.label | translate"
                    variant="outlined"
                    styleClass="nf-filter-bar__input"
                  />
                }
                @case ('date') {
                  <p-datePicker
                    [ngModel]="getFilterValue(filter.key)"
                    (ngModelChange)="onFilterValueChange(filter.key, $event)"
                    [placeholder]="filter.label | translate"
                    variant="outlined"
                    styleClass="nf-filter-bar__input"
                  />
                }
                @case ('boolean') {
                  <p-select
                    [options]="getBooleanOptions()"
                    optionLabel="label"
                    optionValue="value"
                    [ngModel]="getFilterValue(filter.key)"
                    (ngModelChange)="onFilterValueChange(filter.key, $event)"
                    [placeholder]="filter.label | translate"
                    variant="outlined"
                    styleClass="nf-filter-bar__input"
                  />
                }
                @case ('number') {
                  <p-inputNumber
                    [ngModel]="getFilterValue(filter.key)"
                    (ngModelChange)="onFilterValueChange(filter.key, $event)"
                    [placeholder]="(filter.placeholder || filter.label) | translate"
                    variant="outlined"
                    styleClass="nf-filter-bar__input"
                  />
                }
                @default {
                  <p-floatLabel variant="over" styleClass="nf-filter-bar__input">
                    <input
                      type="text"
                      pInputText
                      [id]="filter.key"
                      [value]="getFilterValue(filter.key) || ''"
                      (input)="onFilterValueChange(filter.key, $any($event.target).value)"
                      [placeholder]="(filter.placeholder || filter.label) | translate"
                    />
                    <label [for]="filter.key">{{ filter.label | translate }}</label>
                  </p-floatLabel>
                }
              }
            </div>
          }

          @if (showReset()) {
            <nf-button
              variant="ghost"
              size="sm"
              (clicked)="onResetFilters()"
            >
              {{ 'Reset' | translate }}
            </nf-button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .nf-filter-bar {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
      background-color: var(--nf-filter-bar-bg);
      border-radius: 8px;
      margin-bottom: 0;
    }

    .nf-filter-bar__row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .nf-filter-bar__filters {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }

    .nf-filter-bar__field {
      flex: 0 0 auto;
      min-width: 150px;
      max-width: 200px;
    }

    .nf-filter-bar__field .nf-filter-bar__input,
    .nf-filter-bar__field p-select,
    .nf-filter-bar__field p-multiSelect,
    .nf-filter-bar__field p-datePicker,
    .nf-filter-bar__field p-inputNumber,
    .nf-filter-bar__field p-floatlabel {
      width: 100%;
    }

    /* No-spacing: zero padding/margin; use token for horizontal gap between filter items */
    :host-context(.nf-listing-page--no-spacing) {
      margin: 0;
      padding: 0;
    }
    :host-context(.nf-listing-page--no-spacing) .nf-filter-bar,
    :host-context(.nf-listing-page--no-spacing) .nf-filter-bar__row,
    :host-context(.nf-listing-page--no-spacing) .nf-filter-bar__filters {
      padding: 0 !important;
      margin: 0 !important;
      gap: var(--nf-listing-toolbar-gap, 8px) !important;
    }
  `],
})
export class FilterBarComponent implements OnInit {
  private readonly translate = inject(TranslateService);

  // Inputs
  filters = input<FilterFieldConfig[]>([]);
  values = input<Record<string, unknown>>({});
  searchPlaceholder = input<string>('Search');
  showSearch = input<boolean>(true);
  showReset = input<boolean>(true);
  collapsible = input<boolean>(false);
  lookups = input<LookupContext>({});

  // Outputs
  filterChange = output<Record<string, unknown>>();
  search = output<string>();
  reset = output<void>();

  // State
  isCollapsed = signal<boolean>(false);
  searchValue = signal<string>('');
  filterValues = signal<Record<string, unknown>>({});

  ngOnInit(): void {
    this.filterValues.set({ ...this.values() });
  }

  getFilterValue(key: string): unknown {
    return this.filterValues()[key];
  }

  getOptions(filter: FilterFieldConfig): Array<{ label: string; value: unknown }> {
    if (filter.lookupKey) {
      const lookupItems = this.lookups()[filter.lookupKey];
      if (lookupItems) {
        return lookupItems.map((item) => ({
          label: item.value,
          value: item.key,
        }));
      }
    }
    return filter.options || [];
  }

  /** Select options with "All" first (for select and boolean) */
  getSelectOptions(filter: FilterFieldConfig): Array<{ label: string; value: unknown }> {
    return [{ label: this.t('All'), value: null }, ...this.getOptions(filter)];
  }

  getBooleanOptions(): Array<{ label: string; value: unknown }> {
    return [
      { label: this.t('All'), value: null },
      { label: this.t('Yes'), value: true },
      { label: this.t('No'), value: false },
    ];
  }

  private t(value: string): string {
    return this.translate.instant(value);
  }

  toggleCollapse(): void {
    this.isCollapsed.update((v) => !v);
  }

  onSearchChange(value: string): void {
    this.searchValue.set(value);
    this.search.emit(value);
  }

  onFilterValueChange(key: string, value: unknown): void {
    this.filterValues.update((current) => ({
      ...current,
      [key]: value,
    }));
    this.filterChange.emit(this.filterValues());
  }

  onResetFilters(): void {
    this.filterValues.set({});
    this.searchValue.set('');
    this.reset.emit();
  }
}
