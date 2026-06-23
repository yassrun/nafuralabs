import { inject, Injectable } from '@angular/core';
import { computed, signal } from '@angular/core';
import type { ListResponse, LoadingState, PartialCrudFacade } from '@lib/anatomy/types';
import type {
  JobExecution,
  PageParams,
  PageResponse,
  ScheduledJobSummary,
} from './scheduled-jobs.models';
import { ScheduledJobsApiService } from './scheduled-jobs-api.service';

@Injectable({ providedIn: 'root' })
export class ScheduledJobsFacade
  implements PartialCrudFacade<unknown, ScheduledJobSummary>
{
  private readonly api = inject(ScheduledJobsApiService);

  private readonly _jobs = signal<ScheduledJobSummary[]>([]);
  private readonly _jobsLoading = signal<LoadingState>('idle');
  private readonly _jobsError = signal<string | null>(null);

  private readonly _executions = signal<JobExecution[]>([]);
  private readonly _executionsTotal = signal<number>(0);
  private readonly _executionsLoading = signal<LoadingState>('idle');
  private readonly _executionsError = signal<string | null>(null);

  readonly jobs = this._jobs.asReadonly();
  readonly jobsLoading = this._jobsLoading.asReadonly();
  readonly jobsError = this._jobsError.asReadonly();

  readonly executions = this._executions.asReadonly();
  readonly executionsTotal = this._executionsTotal.asReadonly();
  readonly executionsLoading = this._executionsLoading.asReadonly();
  readonly executionsError = this._executionsError.asReadonly();

  readonly hasJobs = computed(() => this._jobs().length > 0);

  async loadItems(): Promise<ListResponse<ScheduledJobSummary>> {
    await this.loadJobs();
    return {
      items: this._jobs(),
      total: this._jobs().length,
    };
  }

  async loadJobs(): Promise<void> {
    this._jobsLoading.set('loading');
    this._jobsError.set(null);
    try {
      const jobs = await this.api.listJobs();
      this._jobs.set(jobs);
      this._jobsLoading.set('success');
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to load scheduled jobs';
      this._jobsError.set(message);
      this._jobsLoading.set('error');
      throw e;
    }
  }

  async loadExecutions(
    key: string,
    params: PageParams
  ): Promise<PageResponse<JobExecution>> {
    this._executionsLoading.set('loading');
    this._executionsError.set(null);
    try {
      const response = await this.api.getExecutions(key, params);
      this._executions.set(response.content ?? []);
      this._executionsTotal.set(response.totalElements ?? 0);
      this._executionsLoading.set('success');
      return response;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to load job executions';
      this._executionsError.set(message);
      this._executionsLoading.set('error');
      throw e;
    }
  }

  async runJobNow(key: string): Promise<void> {
    await this.api.triggerJob(key);
  }
}

