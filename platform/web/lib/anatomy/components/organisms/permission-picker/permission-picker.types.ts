export interface PermissionDefinition {
  code: string;
  name: string;
  module: string;
  category: string;
  description?: string;
}

export interface PermissionGroup {
  name: string;
  moduleId: string;
  permissions: PermissionDefinition[];
}
