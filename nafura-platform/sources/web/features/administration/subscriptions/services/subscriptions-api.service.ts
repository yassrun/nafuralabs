import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';

import type { SubscriptionOverview } from '../models/subscription.model';

@Injectable({ providedIn: 'root' })
export class SubscriptionsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  getOverview(): Observable<SubscriptionOverview> {
    return this.http.get<SubscriptionOverview>(
      `${this.apiConfig.getApiBaseUrl()}/api/v1/administration/subscriptions/overview`
    );
  }

  upgrade(planId: string): Observable<SubscriptionOverview> {
    return this.http.post<SubscriptionOverview>(
      `${this.apiConfig.getApiBaseUrl()}/api/v1/administration/subscriptions/upgrade`,
      { planId }
    );
  }
}
