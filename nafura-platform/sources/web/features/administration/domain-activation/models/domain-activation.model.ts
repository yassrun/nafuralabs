export interface DomainActivationStatus {
  domainId: string;
  name: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  isLocked: boolean;
  activatedAt: string | null;
  entityCount: number;
  entities: string[];
}
