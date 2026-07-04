export interface ManagerSession {
  userId: string
  email: string
  name: string
  role: 'OWNER' | 'ADMIN' | 'HOST' | 'BAR_MANAGER'
  tenantId: string
  venueName: string
}
