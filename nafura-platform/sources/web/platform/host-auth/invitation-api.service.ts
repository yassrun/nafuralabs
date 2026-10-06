import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface InvitationPreview {
  tenantId: string;
  tenantKey: string;
  tenantName: string;
  email: string;
  requiresAccountSetup: boolean;
  alreadyAccepted: boolean;
  expiresAt: string;
}

export interface InvitationAcceptResult {
  alreadyAccepted: boolean;
  loginRequired: boolean;
  tenantId: string;
  tenantKey: string;
  tenantName: string;
  email: string;
  message: string;
}

export interface AcceptInvitationPayload {
  token: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

@Injectable({ providedIn: 'root' })
export class InvitationApiService {
  private readonly http = inject(HttpClient);
  private readonly basePath = '/api/public/invitations';

  async preview(token: string): Promise<InvitationPreview> {
    const params = new HttpParams().set('token', token);
    return firstValueFrom(
      this.http.get<InvitationPreview>(`${this.basePath}/preview`, { params })
    );
  }

  async accept(payload: AcceptInvitationPayload): Promise<InvitationAcceptResult> {
    return firstValueFrom(
      this.http.post<InvitationAcceptResult>(`${this.basePath}/accept`, payload)
    );
  }
}
