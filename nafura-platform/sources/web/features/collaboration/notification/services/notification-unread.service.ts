import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { NotificationApiService } from './notification-api.service';

@Injectable({ providedIn: 'root' })
export class NotificationUnreadService {
  private readonly api = inject(NotificationApiService);

  readonly count = signal(0);

  async refresh(): Promise<void> {
    try {
      const value = await firstValueFrom(this.api.getUnreadCount());
      this.count.set(value);
    } catch {
      this.count.set(0);
    }
  }
}
