import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
  SmartImportTriggerComponent,
  type SmartImportError,
  type SmartImportResult,
} from '@platform/features/documents/smart-import';

@Component({
  selector: 'erp-smart-import-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SmartImportTriggerComponent],
  template: `
    <nf-smart-import-trigger
      [entityKey]="entityKey"
      [accept]="accept"
      [disabled]="disabled"
      (completed)="onCompleted($event)"
      (cancelled)="cancelled.emit()"
      (failed)="failed.emit($event)" />
  `,
})
/** @deprecated Use SmartImportTriggerComponent from the platform feature. */
export class SmartImportButtonComponent {
  @Input({ required: true }) entityKey = '';
  @Input() accept = '.xlsx,.xls,.csv,.pdf';
  @Input() disabled = false;

  @Output() readonly importComplete = new EventEmitter<void>();
  @Output() readonly completed = new EventEmitter<SmartImportResult>();
  @Output() readonly cancelled = new EventEmitter<void>();
  @Output() readonly failed = new EventEmitter<SmartImportError>();

  onCompleted(result: SmartImportResult): void {
    this.completed.emit(result);
    this.importComplete.emit();
  }
}
