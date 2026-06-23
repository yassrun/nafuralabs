import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';

export interface SignupPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  preferredLocale: 'fr' | 'en' | 'ar';
}

export interface SignupResult {
  userId: string | null;
  email: string;
  message: string;
  emailVerificationRequired: boolean;
  accessToken?: string;
  expiresIn?: number;
  resumed?: boolean;
}

export interface CreateTenantPayload {
  companyName: string;
  ice: string;
  legalForm?: string;
}

export interface CreateTenantResult {
  tenantId: string;
  tenantKey: string;
  tenantName: string;
  accessToken?: string;
  expiresIn?: number;
}

export interface SocietePreset {
  nom: string;
  ice: string;
  forme?: string;
}

export interface ApplyPresetPayload {
  societe: SocietePreset;
  secteur: string;
  taille: string;
  marches: string;
  compta: string;
  forceReset?: boolean;
}

export interface ApplyPresetResult {
  tenantId: string;
  applied: boolean;
  completedSteps: string[];
  durationMs: number;
}

export interface OnboardingState {
  currentStep: number;
  answers: Record<string, unknown>;
  tenantId: string | null;
  completed: boolean;
}

export interface CompletenessSection {
  id: string;
  label: string;
  complete: boolean;
  weight: number;
}

export interface CompletenessResult {
  score: number;
  sections: CompletenessSection[];
}

export interface BulkInvitePayload {
  emails: string[];
  defaultRole: string;
}

export interface BulkInviteResult {
  sent: number;
  skipped: number;
  errors: string[];
}

@Injectable({ providedIn: 'root' })
export class OnboardingApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private apiBase(): string {
    return this.apiConfig.getApiBaseUrl().replace(/\/$/, '');
  }

  signup(payload: SignupPayload): Promise<SignupResult> {
    return firstValueFrom(
      this.http.post<SignupResult>(`${this.apiBase()}/api/public/onboarding/signup`, payload)
    );
  }

  verifyEmail(token: string): Promise<SignupResult> {
    return firstValueFrom(
      this.http.post<SignupResult>(`${this.apiBase()}/api/public/onboarding/verify-email`, { token })
    );
  }

  resendVerificationEmail(email: string): Promise<{ email: string; message: string }> {
    return firstValueFrom(
      this.http.post<{ email: string; message: string }>(
        `${this.apiBase()}/api/public/onboarding/resend-verification-email`,
        { email }
      )
    );
  }

  getState(): Promise<OnboardingState> {
    return firstValueFrom(this.http.get<OnboardingState>(`${this.apiBase()}/api/onboarding/state`));
  }

  saveState(payload: {
    currentStep: number;
    answers: Record<string, unknown>;
    tenantId?: string | null;
  }): Promise<OnboardingState> {
    return firstValueFrom(
      this.http.put<OnboardingState>(`${this.apiBase()}/api/onboarding/state`, payload)
    );
  }

  createTenant(payload: CreateTenantPayload): Promise<CreateTenantResult> {
    return firstValueFrom(
      this.http.post<CreateTenantResult>(`${this.apiBase()}/api/tenants`, payload)
    );
  }

  applyPreset(tenantId: string, payload: ApplyPresetPayload): Promise<ApplyPresetResult> {
    return firstValueFrom(
      this.http.post<ApplyPresetResult>(
        `${this.apiBase()}/api/tenants/${encodeURIComponent(tenantId)}/apply-preset`,
        payload
      )
    );
  }

  getCompleteness(tenantId: string): Promise<CompletenessResult> {
    return firstValueFrom(
      this.http.get<CompletenessResult>(
        `${this.apiBase()}/api/tenants/${encodeURIComponent(tenantId)}/completeness`
      )
    );
  }

  bulkInvite(tenantId: string, payload: BulkInvitePayload): Promise<BulkInviteResult> {
    return firstValueFrom(
      this.http.post<BulkInviteResult>(
        `${this.apiBase()}/api/tenants/${encodeURIComponent(tenantId)}/members/bulk-invite`,
        payload
      )
    );
  }

  parseAgent(questionId: string, userMessage: string, context: Record<string, unknown>): Promise<{
    extracted: Record<string, unknown>;
    normalizedPreset: ApplyPresetPayload | null;
  }> {
    return firstValueFrom(
      this.http.post<{ extracted: Record<string, unknown>; normalizedPreset: ApplyPresetPayload | null }>(
        `${this.apiBase()}/api/onboarding/agent`,
        { questionId, userMessage, context }
      )
    );
  }

  normalizePreset(answers: Record<string, unknown>): Promise<ApplyPresetPayload> {
    return firstValueFrom(
      this.http.post<ApplyPresetPayload>(`${this.apiBase()}/api/onboarding/agent/normalize-preset`, answers)
    );
  }
}
