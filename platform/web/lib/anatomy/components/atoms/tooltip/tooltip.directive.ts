import { Directive, input, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';

/**
 * Tooltip position types.
 */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Tooltip Directive
 *
 * Directive for tooltips.
 *
 * @stable
 *
 * @example
 * <button [nfTooltip]="'Edit item'" position="bottom">Edit</button>
 */
@Directive({
  selector: '[nfTooltip]',
  standalone: true,
  hostDirectives: [
    {
      directive: MatTooltip,
      inputs: ['matTooltipShowDelay: delay'],
    },
  ],
})
export class TooltipDirective implements OnInit, OnDestroy {
  private matTooltip = inject(MatTooltip, { self: true });

  // Inputs
  nfTooltip = input.required<string>();
  position = input<TooltipPosition>('top');
  delay = input<number>(200);

  constructor() {
    // Update tooltip message when input changes
    // Using effect would be ideal here but keeping it simple
  }

  ngOnInit(): void {
    this.matTooltip.message = this.nfTooltip();
    this.matTooltip.position = this.mapPosition(this.position());
    this.matTooltip.showDelay = this.delay();
  }

  ngOnDestroy(): void {
    this.matTooltip.hide();
  }

  private mapPosition(position: TooltipPosition): 'above' | 'below' | 'left' | 'right' {
    const positionMap: Record<TooltipPosition, 'above' | 'below' | 'left' | 'right'> = {
      top: 'above',
      bottom: 'below',
      left: 'left',
      right: 'right',
    };
    return positionMap[position];
  }
}
