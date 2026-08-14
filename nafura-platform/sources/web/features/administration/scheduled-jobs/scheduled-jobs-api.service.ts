import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiConfigService } from '../../../core/config/api-config.service';
import type {
  JobExecution,
  PageParams,
  PageResponse,
  ScheduledJobSummary,
} from './scheduled-jobs.models';

@Injectable({ providedIn: 'root' })
export class ScheduledJobsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private url(path: string): string {
    const base = this.apiConfig.getApiBaseUrl().replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  }

  async listJobs(): Promise<ScheduledJobSummary[]> {
    const res = await firstValueFrom(
      this.http.get<ScheduledJobSummary[]>(
        this.url('/api/v1/platform/admin/scheduled-jobs')
      )
    );
    return res ?? [];
  }

  async getExecutions(
    key: string,
    params: PageParams
  ): Promise<PageResponse<JobExecution>> {
    let httpParams = new HttpParams();
    if (params.page != null) {
      httpParams = httpParams.set('page', String(params.page));
    }
    if (params.size != null) {
      httpParams = httpParams.set('size', String(params.size));
    }
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }
    return firstValueFrom(
      this.http.get<PageResponse<JobExecution>>(
        this.url(
          `/api/v1/platform/admin/scheduled-jobs/${encodeURIComponent(key)}/executions`
        ),
        { params: httpParams }
      )
    );
  }

  async triggerJob(key: string): Promise<{ executionId: string | null }> {
    return firstValueFrom(
      this.http.post<{ executionId: string | null }>(
        this.url(
          `/api/v1/platform/admin/scheduled-jobs/${encodeURIComponent(
            key
          )}/trigger`
        ),
        {}
      )
    );
  }
}

