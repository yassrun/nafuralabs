import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';

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
export class InvitationApiService extends FeatureApiService<unknown, unknown, unknown> {
  protected override basePath = '/api/public/invitations';

  async preview(token: string): Promise<InvitationPreview> {
    const params = new HttpParams().set('token', token);
    return this.get<InvitationPreview>(`${this.basePath}/preview`, params);
  }

  async accept(payload: AcceptInvitationPayload): Promise<InvitationAcceptResult> {
    return this.post<InvitationAcceptResult>(`${this.basePath}/accept`, payload);
  }
}
