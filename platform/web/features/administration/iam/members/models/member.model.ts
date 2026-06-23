export type MemberStatus = 'active' | 'invited' | 'suspended';

export interface MemberRole {
  id: string;
  name: string;
  isSystem?: boolean;
}

export interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  status: MemberStatus;
  roles: MemberRole[];
  /** UI helper mapped from roles for detail multi-select forms. */
  roleIds?: string[];
  invitedAt: string | null;
  joinedAt: string | null;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MemberListItem = Pick<
  Member,
  | 'id'
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'displayName'
  | 'roles'
  | 'status'
  | 'lastActivityAt'
  | 'joinedAt'
>;

export interface MemberInvite {
  email: string;
  firstName?: string;
  lastName?: string;
  roleIds: string[];
  message?: string;
}

export type MemberUpdate = Partial<
  Pick<Member, 'firstName' | 'lastName' | 'displayName' | 'status'>
> & {
  roles?: string[];
};
