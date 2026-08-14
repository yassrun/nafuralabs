export interface ScheduledJobSummary {
  key: string;
  description: string;
  cron: string;
  tenantScoped: boolean;
  enabled: boolean;
  lastExecution?: ScheduledJobLastExecution;
}

export interface ScheduledJobLastExecution {
  id: string;
  startedAt: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  durationMs?: number | null;
}

export interface JobExecution {
  id: string;
  tenantId?: string | null;
  jobKey: string;
  startedAt: string;
  endedAt?: string | null;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  errorMessage?: string | null;
  durationMs?: number | null;
}

export interface PageParams {
  page?: number;
  size?: number;
  status?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
}

