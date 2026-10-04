import { Injectable, signal } from '@angular/core';

/** Loading and error of a {@link ScreenPageComponent}, set by the business-context screen. */
@Injectable()
export class ScreenState {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
}
