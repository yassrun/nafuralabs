export interface Role {
  id: string;
  roleCode: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  priority: number;
  memberCount?: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export type RoleListItem = Pick<
  Role,
  'id' | 'roleCode' | 'name' | 'description' | 'isSystem' | 'priority' | 'memberCount' | 'createdAt'
>;

export interface RoleCreate {
  roleCode: string;
  name: string;
  description?: string;
  permissions: string[];
  priority?: number;
}

export type RoleUpdate = Partial<RoleCreate>;
