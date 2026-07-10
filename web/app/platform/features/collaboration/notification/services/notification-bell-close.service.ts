import { Injectable } from '@angular/core';

/** Lets dropdown list components close the shell notification bell panel. */
@Injectable({ providedIn: 'root' })
export class NotificationBellCloseService {
  private closeHandler: (() => void) | null = null;

  bind(handler: () => void): void {
    this.closeHandler = handler;
  }

  unbind(): void {
    this.closeHandler = null;
  }

  close(): void {
    this.closeHandler?.();
  }
}
