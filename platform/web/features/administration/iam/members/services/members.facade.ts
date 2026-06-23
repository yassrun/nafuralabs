import { Injectable, inject } from '@angular/core';

import { GridFacade } from '@lib/anatomy';

import type { Member, MemberInvite, MemberUpdate } from '../models';
import { MembersApiService } from './members-api.service';
import { RolesApiService } from '../../roles/services/roles-api.service';

type MemberMutation = MemberInvite & Partial<MemberUpdate>;

@Injectable({ providedIn: 'root' })
export class MembersFacade extends GridFacade<
  Member,
  MemberMutation,
  MemberUpdate
> {
  protected override api = inject(MembersApiService);
  private readonly rolesApi = inject(RolesApiService);

  override async loadLookups(): Promise<void> {
    const res = await this.rolesApi.getAll();
    this._lookups.update((prev) => ({
      ...prev,
      roles: (res.items ?? []).map((r) => ({ key: r.id, value: r.name })),
    }));
    this._lookupsLoaded.set(true);
  }

  async inviteMember(invite: MemberInvite): Promise<Member> {
    return this.createItem(invite);
  }

  async deactivateMember(id: string): Promise<Member> {
    return this.updateItem(id, { status: 'suspended' });
  }

  async reactivateMember(id: string): Promise<Member> {
    return this.updateItem(id, { status: 'active' });
  }

  async deactivateMembers(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => this.deactivateMember(id)));
  }

  async resendInvitation(id: string): Promise<void> {
    await this.api.resendInvitation(id);
  }

  async removeMember(id: string): Promise<void> {
    await this.deleteItem(id);
  }
}
