import { useState, type ReactNode } from 'react'
import { IonApp, IonContent, IonPage } from '@ionic/react'
import { allSalons, mockManagerBookings, type Booking } from '@shared/prototypeData'
import type { ManagerSession } from '@shared/types'
import {
  ManagerLoginScreen,
  ManagerDashboardScreen,
  ManagerBookingsListScreen,
  ManagerBookingDetailScreen,
  ManagerStaffScreen,
  ManagerServicesScreen,
  ManagerReviewsScreen,
  ManagerAgendaScreen,
  ManagerCustomersScreen,
  ManagerLoyaltyScreen,
  ManagerSettingsScreen,
} from './ProScreens'
import './index.css'

type ProScreen =
  | 'manager-login'
  | 'manager-dashboard'
  | 'manager-bookings-list'
  | 'manager-booking-detail'
  | 'manager-staff'
  | 'manager-services'
  | 'manager-reviews'
  | 'manager-agenda'
  | 'manager-customers'
  | 'manager-loyalty'
  | 'manager-settings'

interface ProState {
  currentScreen: ProScreen
  managerSession?: ManagerSession
  selectedBookingId?: string
}

export default function App() {
  const [state, setState] = useState<ProState>({ currentScreen: 'manager-login' })

  const navigate = (screen: ProScreen, patch?: Partial<ProState>) => {
    setState((prev) => ({ ...prev, currentScreen: screen, ...patch }))
  }

  const managerLogin = (email: string, password: string) => {
    void password
    const session: ManagerSession = {
      userId: 'mgr-001',
      email,
      name: 'Fatima Bennani',
      role: 'OWNER',
      salonId: 'salon-01',
      salonName: 'Silhouette Beauty',
    }
    navigate('manager-dashboard', { managerSession: session })
  }

  const logout = () => {
    setState({ currentScreen: 'manager-login' })
  }

  const salon =
    allSalons.find((s) => s.id === state.managerSession?.salonId) ?? allSalons[0]

  const currentBooking: Booking | undefined = state.selectedBookingId
    ? mockManagerBookings.find((b) => b.id === state.selectedBookingId)
    : undefined

  let content: ReactNode = null

  switch (state.currentScreen) {
    case 'manager-login':
      content = <ManagerLoginScreen onLogin={managerLogin} onBack={() => globalThis.close()} />
      break
    case 'manager-dashboard':
      content = (
        <ManagerDashboardScreen
          session={state.managerSession}
          onViewBookings={() => navigate('manager-bookings-list')}
          onViewAgenda={() => navigate('manager-agenda')}
          onViewStaff={() => navigate('manager-staff')}
          onViewServices={() => navigate('manager-services')}
          onViewCustomers={() => navigate('manager-customers')}
          onViewLoyalty={() => navigate('manager-loyalty')}
          onViewReviews={() => navigate('manager-reviews')}
          onViewSettings={() => navigate('manager-settings')}
          onLogout={logout}
        />
      )
      break
    case 'manager-bookings-list':
      content = (
        <ManagerBookingsListScreen
          bookings={mockManagerBookings}
          onBookingSelect={(id) => navigate('manager-booking-detail', { selectedBookingId: id })}
          onBack={() => navigate('manager-dashboard')}
        />
      )
      break
    case 'manager-booking-detail':
      content = currentBooking ? (
        <ManagerBookingDetailScreen
          booking={currentBooking}
          onBack={() => navigate('manager-bookings-list')}
        />
      ) : null
      break
    case 'manager-staff':
      content = <ManagerStaffScreen salon={salon} onBack={() => navigate('manager-dashboard')} />
      break
    case 'manager-services':
      content = <ManagerServicesScreen salon={salon} onBack={() => navigate('manager-dashboard')} />
      break
    case 'manager-reviews':
      content = (
        <ManagerReviewsScreen
          salonId={state.managerSession?.salonId ?? 'salon-01'}
          onBack={() => navigate('manager-dashboard')}
        />
      )
      break
    case 'manager-agenda':
      content = <ManagerAgendaScreen onBack={() => navigate('manager-dashboard')} />
      break
    case 'manager-customers':
      content = <ManagerCustomersScreen onBack={() => navigate('manager-dashboard')} />
      break
    case 'manager-loyalty':
      content = <ManagerLoyaltyScreen onBack={() => navigate('manager-dashboard')} />
      break
    case 'manager-settings':
      content = (
        <ManagerSettingsScreen
          session={state.managerSession}
          onBack={() => navigate('manager-dashboard')}
        />
      )
      break
  }

  return (
    <IonApp>
      <IonPage>
        <IonContent>{content}</IonContent>
      </IonPage>
    </IonApp>
  )
}
