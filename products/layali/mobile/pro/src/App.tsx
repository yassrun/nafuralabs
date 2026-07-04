import { useEffect, useState } from 'react'
import { IonApp, IonContent, IonPage } from '@ionic/react'
import type { ManagerSession } from '@shared/types'
import {
  ProLoginScreen,
  ProDashboardScreen,
  ProAccessRequestsScreen,
  ProBookingsListScreen,
  ProBookingDetailScreen,
  ProDoorCheckinScreen,
  ProTablesScreen,
  ProEventsListScreen,
  ProEventEditScreen,
  ProNoAccessScreen,
  ProAccessRequestScreen,
  ProTenantSuspendedScreen,
  ProVenueSettingsScreen,
  ProTicketsListScreen,
  ProReviewsScreen,
} from './ProScreens'
import type { ProScreen } from './types'
import './App.css'

interface ProAppState {
  currentScreen: ProScreen
  managerSession?: ManagerSession
  selectedBookingId?: string
  selectedProEventId?: string
}

interface RouteTarget {
  screen: ProScreen
  id?: string
}

function routeFromHash(hash: string): RouteTarget {
  const cleanHash = hash.replace(/^#/, '') || '/'
  const parts = cleanHash.split('/').filter(Boolean)

  if (parts.length === 0) return { screen: 'pro-login' }

  if (parts[0] === 'pro' && parts[1] === 'login') return { screen: 'pro-login' }
  if (parts[0] === 'pro' && parts.length === 1) return { screen: 'pro-dashboard' }
  if (parts[0] === 'pro' && parts[1] === 'door') return { screen: 'pro-door-checkin' }
  if (parts[0] === 'pro' && parts[1] === 'bookings' && parts[2]) {
    return { screen: 'pro-booking-detail', id: parts[2] }
  }
  if (parts[0] === 'pro' && parts[1] === 'bookings') return { screen: 'pro-bookings-list' }

  return { screen: 'pro-login' }
}

function hashFromState(state: ProAppState): string {
  if (state.currentScreen === 'pro-login') return '/pro/login'
  if (state.currentScreen === 'pro-dashboard') return '/pro'
  if (state.currentScreen === 'pro-door-checkin') return '/pro/door'
  if (state.currentScreen === 'pro-booking-detail') {
    return state.selectedBookingId ? `/pro/bookings/${state.selectedBookingId}` : '/pro/bookings'
  }
  if (state.currentScreen === 'pro-bookings-list') return '/pro/bookings'
  return '/pro/login'
}

function setHashForState(state: ProAppState) {
  const nextHash = hashFromState(state)
  if (globalThis.location.hash !== `#${nextHash}`) {
    globalThis.location.hash = nextHash
  }
}

const hideBottomNavScreens: ProScreen[] = [
  'pro-login',
  'pro-no-access',
  'pro-access-request',
  'pro-tenant-suspended',
]

export default function App() {
  const initialRoute = routeFromHash(globalThis.location.hash)

  const [state, setState] = useState<ProAppState>({
    currentScreen: initialRoute.screen,
    selectedBookingId: initialRoute.screen === 'pro-booking-detail' ? initialRoute.id : undefined,
  })

  const applyNavigation = (prev: ProAppState, screen: ProScreen, id?: string): ProAppState => {
    if (
      screen.startsWith('pro-') &&
      !prev.managerSession &&
      screen !== 'pro-login' &&
      screen !== 'pro-no-access' &&
      screen !== 'pro-access-request' &&
      screen !== 'pro-tenant-suspended'
    ) {
      return { ...prev, currentScreen: 'pro-login' }
    }

    const next: ProAppState = { ...prev, currentScreen: screen }

    if (screen === 'pro-event-edit') {
      next.selectedProEventId = id
    }

    if (id && (screen === 'pro-booking-detail')) {
      next.selectedBookingId = id
    }

    return next
  }

  const navigate = (screen: ProScreen, id?: string) => {
    setState((prev) => {
      const next = applyNavigation(prev, screen, id)
      setHashForState(next)
      return next
    })
  }

  useEffect(() => {
    const onHashChange = () => {
      const route = routeFromHash(globalThis.location.hash)
      setState((prev) => applyNavigation(prev, route.screen, route.id))
    }

    globalThis.addEventListener('hashchange', onHashChange)
    return () => globalThis.removeEventListener('hashchange', onHashChange)
  }, [])

  const loginManager = (session: ManagerSession) => {
    setState((prev) => {
      const next: ProAppState = {
        ...prev,
        managerSession: session,
        currentScreen: session.role === 'HOST' ? 'pro-door-checkin' : 'pro-dashboard',
      }
      setHashForState(next)
      return next
    })
  }

  const logoutManager = () => {
    setState({ currentScreen: 'pro-login' })
    globalThis.location.hash = '/pro/login'
  }

  const shouldShowBottomNav = Boolean(state.managerSession) && !hideBottomNavScreens.includes(state.currentScreen)
  const isDashboardTabActive = state.currentScreen === 'pro-dashboard'

  return (
    <IonApp>
      <IonPage>
        <IonContent fullscreen>
          {state.currentScreen === 'pro-login' && (
            <ProLoginScreen navigate={navigate} loginManager={loginManager} />
          )}
          {state.currentScreen === 'pro-dashboard' && state.managerSession && (
            <ProDashboardScreen
              session={state.managerSession}
              navigate={navigate}
              logoutManager={logoutManager}
            />
          )}
          {state.currentScreen === 'pro-access-requests' && state.managerSession && (
            <ProAccessRequestsScreen session={state.managerSession} navigate={navigate} />
          )}
          {state.currentScreen === 'pro-bookings-list' && state.managerSession && (
            <ProBookingsListScreen session={state.managerSession} navigate={navigate} />
          )}
          {state.currentScreen === 'pro-booking-detail' && state.managerSession && (
            <ProBookingDetailScreen
              session={state.managerSession}
              bookingReference={state.selectedBookingId}
              navigate={navigate}
            />
          )}
          {state.currentScreen === 'pro-door-checkin' && state.managerSession && (
            <ProDoorCheckinScreen session={state.managerSession} navigate={navigate} />
          )}
          {state.currentScreen === 'pro-tables' && state.managerSession && (
            <ProTablesScreen session={state.managerSession} navigate={navigate} />
          )}
          {state.currentScreen === 'pro-events-list' && state.managerSession && (
            <ProEventsListScreen session={state.managerSession} navigate={navigate} />
          )}
          {state.currentScreen === 'pro-event-edit' && state.managerSession && (
            <ProEventEditScreen
              session={state.managerSession}
              eventId={state.selectedProEventId}
              navigate={navigate}
            />
          )}
          {state.currentScreen === 'pro-no-access' && <ProNoAccessScreen navigate={navigate} />}
          {state.currentScreen === 'pro-access-request' && <ProAccessRequestScreen navigate={navigate} />}
          {state.currentScreen === 'pro-tenant-suspended' && (
            <ProTenantSuspendedScreen navigate={navigate} />
          )}
          {state.currentScreen === 'pro-venue-settings' && state.managerSession && (
            <ProVenueSettingsScreen session={state.managerSession} navigate={navigate} />
          )}
          {state.currentScreen === 'pro-tickets-list' && state.managerSession && (
            <ProTicketsListScreen session={state.managerSession} navigate={navigate} />
          )}
          {state.currentScreen === 'pro-reviews' && state.managerSession && (
            <ProReviewsScreen session={state.managerSession} navigate={navigate} />
          )}
        </IonContent>
        {shouldShowBottomNav && (
          <nav className="bottom-nav" aria-label="Navigation manager">
            <button
              type="button"
              className={isDashboardTabActive ? 'is-active' : ''}
              onClick={() => navigate('pro-dashboard')}
            >
              <span aria-hidden="true">⌂</span>
              <span>Tableau de bord</span>
            </button>
            <button
              type="button"
              className={
                state.currentScreen === 'pro-events-list' || state.currentScreen === 'pro-event-edit'
                  ? 'is-active'
                  : ''
              }
              onClick={() => navigate('pro-events-list')}
            >
              <span aria-hidden="true">🗓</span>
              <span>Soirées</span>
            </button>
            <button
              type="button"
              className={state.currentScreen === 'pro-tables' ? 'is-active' : ''}
              onClick={() => navigate('pro-tables')}
            >
              <span aria-hidden="true">🪑</span>
              <span>Tables</span>
            </button>
            <button
              type="button"
              className={
                state.currentScreen === 'pro-bookings-list' || state.currentScreen === 'pro-booking-detail'
                  ? 'is-active'
                  : ''
              }
              onClick={() => navigate('pro-bookings-list')}
            >
              <span aria-hidden="true">📋</span>
              <span>Réservations</span>
            </button>
            <button
              type="button"
              className={state.currentScreen === 'pro-door-checkin' ? 'is-active' : ''}
              onClick={() => navigate('pro-door-checkin')}
            >
              <span aria-hidden="true">🚪</span>
              <span>Entrée</span>
            </button>
            <button type="button" onClick={logoutManager}>
              <span aria-hidden="true">◉</span>
              <span>Déconnexion</span>
            </button>
          </nav>
        )}
      </IonPage>
    </IonApp>
  )
}
