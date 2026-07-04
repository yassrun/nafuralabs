export interface ManagerSession {
  userId: string
  email: string
  name: string
  role: 'OWNER' | 'ADMIN' | 'STAFF'
  salonId: string
  salonName: string
}

export interface BookingDraft {
  salonId: string
  serviceId: string
  staffId?: string
  date: string
  time: string
  paymentMethod: 'cash' | 'online'
}
