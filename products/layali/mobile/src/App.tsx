import { useEffect, useState } from 'react'
import { IonApp, IonButton, IonChip, IonContent, IonPage } from '@ionic/react'
import {
  accessModeLabels,
  allVenues,
  layaliHomeFeed,
  mockBooking,
  mockBookingHistory,
  commitBookingToHistory,
  mockCustomerTicketAccesses,
  commitTicketToAccesses,
  mockAdminTenants,
  mockEvents,
  mockUserProfile,
  occasionLabels,
} from './prototypeData'
import type { AccessMode, BookingDraft, Occasion, VenueDetail } from './prototypeData'
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
} from './ManagerScreens'
import './App.css'

export interface ManagerSession {
  userId: string
  email: string
  name: string
  role: 'OWNER' | 'ADMIN' | 'HOST' | 'BAR_MANAGER'
  tenantId: string
  venueName: string
}

export type Screen =
  | 'entry'
  | 'home'
  | 'venue-search'
  | 'venue-detail'
  | 'booking-create'
  | 'booking-review'
  | 'booking-payment'
  | 'booking-confirm'
  | 'bookings-list'
  | 'booking-detail'
  | 'my-accesses'
  | 'customer-tickets'
  | 'event-list'
  | 'event-detail'
  | 'ticket-buy'
  | 'ticket-payment'
  | 'ticket-confirm'
  | 'login'
  | 'register'
  | 'customer-profile'
  | 'pro-login'
  | 'pro-dashboard'
  | 'pro-access-requests'
  | 'pro-bookings-list'
  | 'pro-booking-detail'
  | 'pro-door-checkin'
  | 'pro-tables'
  | 'pro-events-list'
  | 'pro-event-edit'
  | 'pro-no-access'
  | 'pro-access-request'
  | 'pro-tenant-suspended'
  | 'pro-venue-settings'
  | 'pro-tickets-list'
  | 'pro-reviews'
  | 'admin-overview'
  | 'admin-tenants'
  | 'admin-tenant-detail'

interface TicketDraft {
  eventId: string
  eventTitle: string
  venueName: string
  categoryName: string
  quantity: number
  unitPrice: number
  total: number
  status: 'draft' | 'confirmed'
  reference?: string
}

interface AppState {
  currentScreen: Screen
  selectedVenueId?: string
  selectedEventId?: string
  selectedBookingId?: string
  proLoginAudience?: 'customer' | 'manager'
  booking: BookingDraft
  ticket: TicketDraft
  managerSession?: ManagerSession
  isManagerMode: boolean
  isCustomerLoggedIn: boolean
  selectedProEventId?: string
  selectedAdminTenantId?: string
  pendingCustomerScreen?: Screen
  pendingCustomerId?: string
}

interface RouteTarget {
  screen: Screen
  id?: string
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function resolveVenueIdFromSlug(slug: string) {
  const normalized = slugify(slug)
  const venue = allVenues.find((item) => slugify(item.title) === normalized)
  return venue?.id
}

function resolveEventIdFromSlug(slug: string) {
  const normalized = slugify(slug)
  const event = mockEvents.find((item) => slugify(item.title) === normalized)
  return event?.id
}

function routeFromHash(hash: string): RouteTarget {
  const cleanHash = hash.replace(/^#/, '') || '/'
  const parts = cleanHash.split('/').filter(Boolean)

  if (parts.length === 0) return { screen: 'home' }

  if (parts[0] === 'venues' && parts.length === 1) return { screen: 'venue-search' }
  if (parts[0] === 'venues' && parts[1]) {
    return { screen: 'venue-detail', id: resolveVenueIdFromSlug(parts[1]) }
  }

  if (parts[0] === 'events' && parts.length === 1) return { screen: 'event-list' }
  if (parts[0] === 'events' && parts[1]) {
    return { screen: 'event-detail', id: resolveEventIdFromSlug(parts[1]) }
  }

  if (parts[0] === 'me' && parts[1] === 'accesses') return { screen: 'my-accesses' }
  if (parts[0] === 'me' && parts[1] === 'tickets') return { screen: 'customer-tickets' }

  if (parts[0] === 'pro' && parts.length === 1) return { screen: 'pro-dashboard' }
  if (parts[0] === 'pro' && parts[1] === 'door') return { screen: 'pro-door-checkin' }
  if (parts[0] === 'pro' && parts[1] === 'bookings' && parts[2]) {
    return { screen: 'pro-booking-detail', id: parts[2] }
  }
  if (parts[0] === 'pro' && parts[1] === 'bookings') return { screen: 'pro-bookings-list' }

  if (parts[0] === 'login') return { screen: 'login' }
  if (parts[0] === 'register') return { screen: 'register' }

  return { screen: 'home' }
}

function hashFromState(state: AppState): string {
  if (state.currentScreen === 'venue-search') return '/venues'
  if (state.currentScreen === 'venue-detail') {
    const venue = allVenues.find((item) => item.id === state.selectedVenueId)
    return venue ? `/venues/${slugify(venue.title)}` : '/venues'
  }
  if (state.currentScreen === 'event-list') return '/events'
  if (state.currentScreen === 'event-detail') {
    const event = mockEvents.find((item) => item.id === state.selectedEventId)
    return event ? `/events/${slugify(event.title)}` : '/events'
  }
  if (state.currentScreen === 'my-accesses') return '/me/accesses'
  if (state.currentScreen === 'customer-tickets') return '/me/tickets'
  if (state.currentScreen === 'pro-dashboard') return '/pro'
  if (state.currentScreen === 'pro-door-checkin') return '/pro/door'
  if (state.currentScreen === 'pro-booking-detail') {
    return state.selectedBookingId ? `/pro/bookings/${state.selectedBookingId}` : '/pro/bookings'
  }
  if (state.currentScreen === 'pro-bookings-list') return '/pro/bookings'
  if (state.currentScreen === 'login') return '/login'
  if (state.currentScreen === 'register') return '/register'
  return '/'
}

function setHashForState(state: AppState) {
  const nextHash = hashFromState(state)
  if (globalThis.location.hash !== `#${nextHash}`) {
    globalThis.location.hash = nextHash
  }
}

function buildBookingDraft(venue: VenueDetail, accessMode: AccessMode, eventId?: string): BookingDraft {
  const event = eventId ? mockEvents.find((item) => item.id === eventId) : undefined
  const table = venue.tables.find((item) => item.available) ?? venue.tables[0]
  const counterSpot = venue.counterSpots.find((item) => item.available) ?? venue.counterSpots[0]

  if (accessMode === 'GUEST_LIST') {
    const needsApproval = venue.accessRulesSummary.guestListApproval === 'MANUAL'

    return {
      venueId: venue.id,
      venueName: venue.title,
      eventId,
      eventTitle: event?.title,
      date: event?.date ?? '2026-06-20',
      time: event?.time ?? '22:30',
      groupSize: 4,
      accessMode,
      accessLabel: 'Guest list standard',
      accessResourceType: 'ENTRY_QUOTA',
      accessResourceId: `guest-${venue.id}`,
      accessResourceLabel: 'Guest list standard',
      tableId: '',
      tableName: 'Guest list',
      specialNight: Boolean(event?.specialNight),
      ticketRequired: Boolean(event?.ticketRequired),
      occasion: 'STANDARD',
      celebrantName: '',
      requiresApproval: needsApproval,
      approvalStatus: needsApproval ? 'PENDING' : 'NOT_REQUIRED',
      notes: '',
      minSpend: 0,
      depositAmount: 0,
      status: 'draft',
    }
  }

  if (accessMode === 'COUNTER') {
    return {
      venueId: venue.id,
      venueName: venue.title,
      eventId,
      eventTitle: event?.title,
      date: event?.date ?? '2026-06-20',
      time: event?.time ?? '21:30',
      groupSize: Math.min(counterSpot?.capacity ?? 2, 3),
      accessMode,
      accessLabel: 'Comptoir à choisir',
      accessResourceType: 'COUNTER_ZONE',
      accessResourceId: undefined,
      accessResourceLabel: undefined,
      tableId: '',
      tableName: 'Comptoir à choisir',
      counterSpotId: undefined,
      counterSpotName: undefined,
      specialNight: Boolean(event?.specialNight),
      ticketRequired: Boolean(event?.ticketRequired),
      occasion: 'STANDARD',
      celebrantName: '',
      requiresApproval: false,
      approvalStatus: 'NOT_REQUIRED',
      notes: '',
      minSpend: 0,
      depositAmount: 0,
      status: 'draft',
    }
  }

  return {
    venueId: venue.id,
    venueName: venue.title,
    eventId,
    eventTitle: event?.title,
    date: event?.date ?? '2026-06-20',
    time: event?.time ?? '20:00',
    groupSize: Math.min(table?.capacity ?? 4, 4),
    accessMode,
    accessLabel: 'Table à choisir',
    accessResourceType: 'TABLE',
    accessResourceId: undefined,
    accessResourceLabel: undefined,
    tableId: '',
    tableName: 'Table à choisir',
    specialNight: Boolean(event?.specialNight),
    ticketRequired: Boolean(event?.ticketRequired),
    occasion: 'STANDARD',
    celebrantName: '',
    requiresApproval: false,
    approvalStatus: 'NOT_REQUIRED',
    notes: '',
    minSpend: 0,
    depositAmount: 0,
    status: 'draft',
  }
}

function buildTicketDraft(eventId: string): TicketDraft {
  const event = mockEvents.find((item) => item.id === eventId) ?? mockEvents[0]
  const defaultCategory = event.ticketCategories.find((item) => item.remaining > 0) ?? event.ticketCategories[0]

  return {
    eventId: event.id,
    eventTitle: event.title,
    venueName: event.venueName,
    categoryName: defaultCategory.name,
    quantity: 1,
    unitPrice: defaultCategory.price,
    total: defaultCategory.price,
    status: 'draft',
  }
}

function getStatusClass(status: string) {
  if (status === 'pending') return 'pending'
  if (status === 'cancelled') return 'cancelled'
  return 'confirmed'
}

function getStatusLabel(status: string) {
  if (status === 'pending') return 'En attente'
  if (status === 'cancelled') return 'Annulée'
  return 'Confirmée'
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function usesBookingReview(accessMode: AccessMode) {
  return accessMode === 'GUEST_LIST' || accessMode === 'COUNTER'
}

function getBookingStepCount(booking: BookingDraft) {
  if (booking.accessMode === 'TABLE') return 3
  let steps = 3
  if (booking.depositAmount > 0) steps = 4
  return steps
}

function getBookingStepLabel(booking: BookingDraft, screen: Screen) {
  const total = getBookingStepCount(booking)
  let current = 1
  if (screen === 'booking-review') current = 2
  else if (screen === 'booking-payment') current = booking.accessMode === 'TABLE' ? 2 : booking.depositAmount > 0 ? 3 : 2
  else if (screen === 'booking-confirm') current = total
  return `Etape ${current}/${total}`
}

function finalizeBookingDraft(booking: BookingDraft): BookingDraft {
  const pending = booking.requiresApproval
  const reference = booking.reference ?? `LAY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

  return {
    ...booking,
    status: pending ? 'pending' : 'confirmed',
    approvalStatus: pending ? 'PENDING' : 'NOT_REQUIRED',
    reference,
    qrCode: pending ? undefined : booking.qrCode ?? `QR-${reference}`,
  }
}

function App() {
  const initialRoute = routeFromHash(globalThis.location.hash)

  const [state, setState] = useState<AppState>({
    currentScreen: initialRoute.screen,
    selectedVenueId: initialRoute.screen === 'venue-detail' ? initialRoute.id : undefined,
    selectedEventId: initialRoute.screen === 'event-detail' ? initialRoute.id : undefined,
    selectedBookingId:
      initialRoute.screen === 'pro-booking-detail' ? initialRoute.id : undefined,
    booking: mockBooking,
    ticket: buildTicketDraft('e1'),
    isManagerMode: false,
    isCustomerLoggedIn: false,
  })

  const applyNavigation = (prev: AppState, screen: Screen, id?: string): AppState => {
    const protectedScreens: Screen[] = [
      'booking-create',
      'booking-review',
      'booking-payment',
      'booking-confirm',
      'bookings-list',
      'booking-detail',
      'my-accesses',
      'ticket-buy',
      'ticket-payment',
      'ticket-confirm',
      'customer-profile',
    ]

    if (protectedScreens.includes(screen) && !prev.isCustomerLoggedIn && screen !== 'login') {
      return {
        ...prev,
        currentScreen: 'login' as Screen,
        pendingCustomerScreen: screen,
        pendingCustomerId: id,
      }
    }

    if (screen.startsWith('pro-') && !prev.managerSession && screen !== 'pro-login' && screen !== 'pro-no-access' && screen !== 'pro-access-request' && screen !== 'pro-tenant-suspended') {
      return {
        ...prev,
        currentScreen: 'pro-login' as Screen,
        proLoginAudience: 'manager',
      }
    }

    const next: AppState = {
      ...prev,
      currentScreen: screen,
      pendingCustomerScreen: screen === 'login' ? prev.pendingCustomerScreen : undefined,
      pendingCustomerId: screen === 'login' ? prev.pendingCustomerId : undefined,
    }

    if (screen === 'pro-login') {
      if (id === 'customer' || id === 'manager') {
        next.proLoginAudience = id
      } else {
        next.proLoginAudience = undefined
      }
    }

    if (screen === 'pro-event-edit') {
      next.selectedProEventId = id
    }

    if (screen === 'admin-tenant-detail') {
      next.selectedAdminTenantId = id
    }

    if (id) {
      if (screen === 'venue-detail') next.selectedVenueId = id
      if (screen === 'event-detail' || screen === 'ticket-buy' || screen === 'ticket-payment' || screen === 'ticket-confirm') {
        next.selectedEventId = id
      }
      if (screen === 'booking-detail' || screen === 'pro-booking-detail') next.selectedBookingId = id
    }

    return next
  }

  const navigate = (screen: Screen, id?: string) => {
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
    setState((prev) => ({
      ...prev,
      managerSession: session,
      isManagerMode: true,
      currentScreen: session.role === 'HOST' ? 'pro-door-checkin' : 'pro-dashboard',
    }))
  }

  const logoutManager = () => {
    setState((prev) => ({
      ...prev,
      managerSession: undefined,
      isManagerMode: false,
      currentScreen: 'home',
    }))
    globalThis.location.hash = '/'
  }

  const loginCustomer = () => {
    setState((prev) => ({
      ...applyNavigation(
        {
          ...prev,
          isCustomerLoggedIn: true,
        },
        prev.pendingCustomerScreen ?? 'home',
        prev.pendingCustomerId,
      ),
      isCustomerLoggedIn: true,
      pendingCustomerScreen: undefined,
      pendingCustomerId: undefined,
    }))
  }

  const logoutCustomer = () => {
    setState((prev) => ({
      ...prev,
      isCustomerLoggedIn: false,
      currentScreen: 'home',
    }))
    globalThis.location.hash = '/'
  }

  const openAccessFlow = (venueId: string, accessMode: AccessMode, eventId?: string) => {
    const venue = allVenues.find((item) => item.id === venueId)
    if (!venue) return

    setState((prev) => ({
      ...prev,
      currentScreen: 'booking-create',
      selectedVenueId: venueId,
      selectedEventId: eventId,
      booking: buildBookingDraft(venue, accessMode, eventId),
    }))
  }

  const openTicketFlow = (eventId: string) => {
    setState((prev) => ({
      ...prev,
      currentScreen: 'ticket-buy',
      selectedEventId: eventId,
      ticket: buildTicketDraft(eventId),
    }))
  }

  const updateBooking = (updates: Partial<BookingDraft>) => {
    setState((prev) => ({
      ...prev,
      booking: { ...prev.booking, ...updates },
    }))
  }

  const updateTicket = (updates: Partial<TicketDraft>) => {
    setState((prev) => ({
      ...prev,
      ticket: { ...prev.ticket, ...updates },
    }))
  }

  const hideBottomNavScreens: Screen[] = [
    'entry',
    'booking-create',
    'booking-review',
    'booking-payment',
    'booking-confirm',
    'ticket-buy',
    'ticket-payment',
    'ticket-confirm',
    'login',
    'register',
    'pro-login',
    'pro-no-access',
    'pro-access-request',
    'pro-tenant-suspended',
    'pro-door-checkin',
    'admin-overview',
    'admin-tenants',
    'admin-tenant-detail',
  ]

  const shouldShowBottomNav = !hideBottomNavScreens.includes(state.currentScreen)
  const dashboardTabScreen: Screen = state.isManagerMode ? 'pro-dashboard' : 'home'
  const isDashboardTabActive = state.currentScreen === dashboardTabScreen

  return (
    <IonApp>
      <IonPage>
        <IonContent fullscreen>
          {state.currentScreen === 'entry' && <EntryScreen navigate={navigate} />}
          {state.currentScreen === 'home' && <HomeScreen navigate={navigate} />}
          {state.currentScreen === 'venue-search' && (
            <VenueSearchScreen navigate={navigate} openAccessFlow={openAccessFlow} />
          )}
          {state.currentScreen === 'venue-detail' && (
            <VenueDetailScreen
              venueId={state.selectedVenueId}
              navigate={navigate}
              openAccessFlow={openAccessFlow}
              openTicketFlow={openTicketFlow}
            />
          )}
          {state.currentScreen === 'booking-create' && (
            <BookingCreateScreen
              booking={state.booking}
              venueId={state.selectedVenueId}
              eventId={state.selectedEventId}
              updateBooking={updateBooking}
              navigate={navigate}
            />
          )}
          {state.currentScreen === 'booking-review' && (
            <BookingReviewScreen
              booking={state.booking}
              updateBooking={updateBooking}
              navigate={navigate}
            />
          )}
          {state.currentScreen === 'booking-payment' && (
            <BookingPaymentScreen booking={state.booking} updateBooking={updateBooking} navigate={navigate} />
          )}
          {state.currentScreen === 'booking-confirm' && <BookingConfirmScreen booking={state.booking} navigate={navigate} />}
          {state.currentScreen === 'bookings-list' && <BookingsListScreen navigate={navigate} />}
          {state.currentScreen === 'my-accesses' && <MyAccessesScreen navigate={navigate} />}
          {state.currentScreen === 'customer-tickets' && <CustomerTicketsScreen navigate={navigate} />}
          {state.currentScreen === 'booking-detail' && <BookingDetailScreen bookingId={state.selectedBookingId} navigate={navigate} />}
          {state.currentScreen === 'event-list' && (
            <EventListScreen navigate={navigate} openAccessFlow={openAccessFlow} openTicketFlow={openTicketFlow} />
          )}
          {state.currentScreen === 'event-detail' && (
            <EventDetailScreen
              eventId={state.selectedEventId}
              navigate={navigate}
              openAccessFlow={openAccessFlow}
              openTicketFlow={openTicketFlow}
            />
          )}
          {state.currentScreen === 'ticket-buy' && (
            <TicketBuyScreen ticket={state.ticket} updateTicket={updateTicket} eventId={state.selectedEventId} navigate={navigate} />
          )}
          {state.currentScreen === 'ticket-payment' && (
            <TicketPaymentScreen ticket={state.ticket} updateTicket={updateTicket} navigate={navigate} />
          )}
          {state.currentScreen === 'ticket-confirm' && <TicketConfirmScreen ticket={state.ticket} navigate={navigate} />}
          {state.currentScreen === 'login' && <LoginScreen navigate={navigate} loginCustomer={loginCustomer} />}
          {state.currentScreen === 'register' && <RegisterScreen navigate={navigate} />}
          {state.currentScreen === 'pro-login' && (
            <ProLoginScreen
              navigate={(s: any) => navigate(s as Screen)}
              loginManager={loginManager}
              initialAudience={state.proLoginAudience}
            />
          )}
          {state.currentScreen === 'pro-dashboard' && state.managerSession && <ProDashboardScreen session={state.managerSession} navigate={(s: any) => navigate(s as Screen)} logoutManager={logoutManager} />}
          {state.currentScreen === 'pro-access-requests' && state.managerSession && <ProAccessRequestsScreen session={state.managerSession} navigate={(s: any) => navigate(s as Screen)} />}
          {state.currentScreen === 'pro-bookings-list' && state.managerSession && (
            <ProBookingsListScreen
              session={state.managerSession}
              navigate={(s: any, id?: string) => navigate(s as Screen, id)}
            />
          )}
          {state.currentScreen === 'pro-booking-detail' && state.managerSession && (
            <ProBookingDetailScreen
              session={state.managerSession}
              bookingReference={state.selectedBookingId}
              navigate={(s: any, id?: string) => navigate(s as Screen, id)}
            />
          )}
          {state.currentScreen === 'pro-door-checkin' && state.managerSession && <ProDoorCheckinScreen session={state.managerSession} navigate={(s: any) => navigate(s as Screen)} />}
          {state.currentScreen === 'pro-tables' && state.managerSession && <ProTablesScreen session={state.managerSession} navigate={(s: any) => navigate(s as Screen)} />}
          {state.currentScreen === 'pro-events-list' && state.managerSession && <ProEventsListScreen session={state.managerSession} navigate={(s: any, id?: string) => navigate(s as Screen, id)} />}
          {state.currentScreen === 'pro-event-edit' && state.managerSession && <ProEventEditScreen session={state.managerSession} eventId={state.selectedProEventId} navigate={(s: any, id?: string) => navigate(s as Screen, id)} />}
          {state.currentScreen === 'pro-no-access' && <ProNoAccessScreen navigate={(s: any) => navigate(s as Screen)} />}
          {state.currentScreen === 'pro-access-request' && <ProAccessRequestScreen navigate={(s: any) => navigate(s as Screen)} />}
          {state.currentScreen === 'pro-tenant-suspended' && <ProTenantSuspendedScreen navigate={(s: any) => navigate(s as Screen)} />}
          {state.currentScreen === 'pro-venue-settings' && state.managerSession && (
            <ProVenueSettingsScreen session={state.managerSession} navigate={(s: any) => navigate(s as Screen)} />
          )}
          {state.currentScreen === 'pro-tickets-list' && state.managerSession && (
            <ProTicketsListScreen session={state.managerSession} navigate={(s: any) => navigate(s as Screen)} />
          )}
          {state.currentScreen === 'pro-reviews' && state.managerSession && (
            <ProReviewsScreen session={state.managerSession} navigate={(s: any) => navigate(s as Screen)} />
          )}
          {state.currentScreen === 'admin-overview' && <AdminOverviewScreen navigate={navigate} />}
          {state.currentScreen === 'admin-tenants' && <AdminTenantsScreen navigate={navigate} />}
          {state.currentScreen === 'admin-tenant-detail' && (
            <AdminTenantDetailScreen tenantId={state.selectedAdminTenantId} navigate={navigate} />
          )}
          {state.currentScreen === 'customer-profile' && <CustomerProfileScreen navigate={navigate} logoutCustomer={logoutCustomer} />}
        </IonContent>
        {shouldShowBottomNav && (
          <nav className="bottom-nav" aria-label={state.isManagerMode ? 'Navigation manager' : 'Navigation principale'}>
            <button
              type="button"
              className={isDashboardTabActive ? 'is-active' : ''}
              onClick={() => navigate(dashboardTabScreen)}
            >
              <span aria-hidden="true">⌂</span>
              <span>{state.isManagerMode ? 'Tableau de bord' : 'Accueil'}</span>
            </button>
            {state.isManagerMode ? (
              <>
                <button
                  type="button"
                  className={state.currentScreen === 'pro-events-list' || state.currentScreen === 'pro-event-edit' ? 'is-active' : ''}
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
                  className={state.currentScreen === 'pro-bookings-list' || state.currentScreen === 'pro-booking-detail' ? 'is-active' : ''}
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
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={state.currentScreen === 'venue-search' || state.currentScreen === 'venue-detail' || state.currentScreen.startsWith('booking') ? 'is-active' : ''}
                  onClick={() => navigate('venue-search')}
                >
                  <span aria-hidden="true">⌖</span>
                  <span>Lieux</span>
                </button>
                <button
                  type="button"
                  className={state.currentScreen === 'event-list' || state.currentScreen === 'event-detail' || state.currentScreen.startsWith('ticket') ? 'is-active' : ''}
                  onClick={() => navigate('event-list')}
                >
                  <span aria-hidden="true">◷</span>
                  <span>Soirees</span>
                </button>
                <button
                  type="button"
                  className={state.currentScreen === 'my-accesses' || state.currentScreen === 'booking-detail' || state.currentScreen === 'customer-tickets' ? 'is-active' : ''}
                  onClick={() => navigate('my-accesses')}
                >
                  <span aria-hidden="true">✓</span>
                  <span>Mes accès</span>
                </button>
              </>
            )}
            <button type="button" className={state.currentScreen === 'customer-profile' ? 'is-active' : ''} onClick={() => state.isManagerMode ? logoutManager() : navigate('customer-profile')}>
              <span aria-hidden="true">◉</span>
              <span>{state.isManagerMode ? 'Déconnexion' : 'Profil'}</span>
            </button>
          </nav>
        )}
      </IonPage>
    </IonApp>
  )
}

function AccessModeRow({ modes }: { modes: AccessMode[] }) {
  return (
    <div className="access-chip-row">
      {modes.map((mode) => (
        <span key={mode} className="access-chip">
          {accessModeLabels[mode]}
        </span>
      ))}
    </div>
  )
}

function EntryScreen({
  navigate,
}: {
  navigate: (screen: Screen, venueId?: string) => void
}) {
  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <h1>Bienvenue sur Layali</h1>
      </header>

      <section className="audience-choice">
        <h2>Choisissez votre espace</h2>
        <div className="audience-buttons">
          <button
            type="button"
            className="audience-btn audience-btn--customer"
            onClick={() => navigate('home')}
          >
            <span className="icon" aria-hidden="true">👤</span>
            <span className="label">Client</span>
            <span className="desc">Découvrir les lieux ce soir</span>
          </button>

          <button
            type="button"
            className="audience-btn audience-btn--manager"
            onClick={() => navigate('pro-login', 'manager')}
          >
            <span className="icon" aria-hidden="true">🧑‍💼</span>
            <span className="label">Manager</span>
            <span className="desc">Connexion pro et gestion du venue</span>
          </button>

          <button
            type="button"
            className="audience-btn"
            style={{ borderStyle: 'dashed' }}
            onClick={() => navigate('admin-overview')}
          >
            <span className="icon" aria-hidden="true">🛡️</span>
            <span className="label">Admin Nafura</span>
            <span className="desc">Stub plateforme (walkthrough P1)</span>
          </button>
        </div>
      </section>
    </main>
  )
}

function HomeScreen({
  navigate,
}: {
  navigate: (screen: Screen, venueId?: string) => void
}) {
  const feed = layaliHomeFeed
  const [activeChip, setActiveChip] = useState(feed.chips.find((chip) => chip.isActive)?.label ?? feed.chips[0]?.label)

  return (
    <main className="feed-root">
      <header className="app-topbar reveal-up">
        <span className="app-logo" aria-label="Layali">Layali</span>
        <div className="app-topbar__actions">
          <button
            type="button"
            className="icon-btn"
            aria-label="Rechercher"
            onClick={() => navigate('venue-search')}
          >
            <span aria-hidden="true">⌕</span>
          </button>
          <button
            type="button"
            className="avatar-pill avatar-pill--sm"
            aria-label="Mon compte"
            onClick={() => navigate('customer-profile')}
          >
            OT
          </button>
        </div>
      </header>

      <section className="home-hero reveal-up">
        <h1>Trouver votre accès ce soir</h1>
        <button type="button" className="city-chip" onClick={() => navigate('venue-search')}>
          {feed.city}
        </button>
        <div className="home-hero__search">
          <input
            type="search"
            aria-label="Rechercher un lieu ou un mode d'accès"
            placeholder="Lieu, ambiance, table, guest list, comptoir…"
            onFocus={() => navigate('venue-search')}
          />
        </div>
      </section>

      <section className="chip-strip reveal-up" aria-label="Filtres rapides">
        {feed.chips.map((chip) => (
          <IonChip
            key={chip.label}
            className={activeChip === chip.label ? 'filter-chip is-active' : 'filter-chip'}
            onClick={() => setActiveChip(chip.label)}
          >
            {chip.label}
          </IonChip>
        ))}
      </section>

      <section className="section-block reveal-up">
        <div className="section-head">
          <h2>Ce soir a Casablanca</h2>
          <button type="button" onClick={() => navigate('event-list')}>Tout voir</button>
        </div>
        <div className="hero-rail">
          {feed.heroCards.map((card) => (
            <article key={card.title} className="hero-card">
              <span className="hero-badge">{card.badge}</span>
              <h3>{card.title}</h3>
              <p>{card.subtitle}</p>
              <strong>{card.metric}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block reveal-up">
        <div className="section-head">
          <h2>Lieux a decouvrir</h2>
          <button type="button" onClick={() => navigate('venue-search')}>Carte</button>
        </div>
        <div className="feed-list">
          {allVenues.map((venue) => (
            <article key={venue.id} className="feed-card feed-card--venue">
              <div className="feed-card__top">
                <h3>{venue.title}</h3>
                <span>{venue.rating}</span>
              </div>
              <p>{venue.district}</p>
              <p className="feed-card__vibe">{venue.vibe}</p>
              <AccessModeRow modes={venue.accessModesDefault} />
              <div className="mini-actions mini-actions--single">
                <span className="access-chip">{venue.featuredAction}</span>
                <button type="button" onClick={() => navigate('venue-detail', venue.id)}>
                  Voir le lieu
                </button>
              </div>
              <div className="feed-card__meta">
                <small>{venue.accessSummary}</small>
                <strong>{venue.minSpend}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function VenueSearchScreen({
  navigate,
  openAccessFlow,
}: {
  navigate: (screen: Screen, venueId?: string) => void
  openAccessFlow: (venueId: string, accessMode: AccessMode, eventId?: string) => void
}) {
  const [activeAccessMode, setActiveAccessMode] = useState<AccessMode | null>(null)
  const [activeBudget, setActiveBudget] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')

  // Filter venues based on active filters
  const filteredVenues = allVenues.filter((venue) => {
    if (activeAccessMode && !venue.accessModesDefault.includes(activeAccessMode)) {
      return false
    }
    if (activeBudget === 'budget' && venue.budgetCategory !== 'budget') {
      return false
    }
    if (activeBudget === 'medium' && venue.budgetCategory !== 'medium') {
      return false
    }
    if (activeBudget === 'premium' && venue.budgetCategory !== 'premium') {
      return false
    }
    if (searchText && !venue.title.toLowerCase().includes(searchText.toLowerCase()) && !venue.vibe.toLowerCase().includes(searchText.toLowerCase())) {
      return false
    }
    return true
  })

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('home')} aria-label="Retour">← Retour</button>
        <h1>Trouver un lieu</h1>
      </header>

      <section className="search-band">
        <input type="search" placeholder="Rechercher un lieu ou une ambiance" value={searchText} onChange={(e) => setSearchText(e.target.value)} autoFocus />
      </section>

      <section className="filter-section">
        <h3 style={{ margin: '12px 0 8px' }}>Mode d'accès</h3>
        <div className="filter-chips">
          {(['TABLE', 'GUEST_LIST', 'COUNTER', 'TICKET'] as AccessMode[]).map((mode) => (
            <IonChip
              key={mode}
              className={activeAccessMode === mode ? 'filter-chip is-active' : 'filter-chip'}
              onClick={() => setActiveAccessMode(activeAccessMode === mode ? null : mode)}
            >
              {accessModeLabels[mode]}
            </IonChip>
          ))}
        </div>

        <h3 style={{ margin: '12px 0 8px' }}>Budget</h3>
        <div className="filter-chips">
          {[
            { value: 'budget', label: 'Moins de 1000 MAD' },
            { value: 'medium', label: '1000-2000 MAD' },
            { value: 'premium', label: '2000+ MAD' },
          ].map((opt) => (
            <IonChip
              key={opt.value}
              className={activeBudget === opt.value ? 'filter-chip is-active' : 'filter-chip'}
              onClick={() => setActiveBudget(activeBudget === opt.value ? null : opt.value)}
            >
              {opt.label}
            </IonChip>
          ))}
        </div>
      </section>

      <div className="venue-list">
        {filteredVenues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
            <p>Aucun lieu ne correspond à vos critères. Essayez de modifier les filtres.</p>
          </div>
        ) : (
          filteredVenues.map((venue) => (
            <article key={venue.id} className="venue-card" onClick={() => navigate('venue-detail', venue.id)} style={{ cursor: 'pointer' }}>
              <div className="venue-card__header">
                <h2>{venue.title}</h2>
                <span className="rating">★ {venue.rating}</span>
              </div>
              <p className="location">{venue.district}</p>
              <p className="vibe">{venue.vibe}</p>
              <AccessModeRow modes={venue.accessModesDefault} />
              <p className="minspend">{venue.accessSummary}</p>
              <div className="mini-actions">
                <span className="access-chip">{venue.featuredAction}</span>
                <button type="button" onClick={(event) => { event.stopPropagation(); openAccessFlow(venue.id, venue.accessModesDefault[0], venue.featuredEventId) }}>
                  Réserver
                </button>
              </div>
              <button type="button" className="detail-btn">Voir le détail →</button>
            </article>
          ))
        )}
      </div>
    </main>
  )
}

function VenueDetailScreen({
  venueId,
  navigate,
  openAccessFlow,
  openTicketFlow,
}: {
  venueId?: string
  navigate: (screen: Screen, venueId?: string) => void
  openAccessFlow: (venueId: string, accessMode: AccessMode, eventId?: string) => void
  openTicketFlow: (eventId: string) => void
}) {
  const venue = allVenues.find((item) => item.id === venueId)
  const featuredEvent = venue?.featuredEventId ? mockEvents.find((item) => item.id === venue.featuredEventId) : undefined
  const primaryAccessMode: AccessMode | undefined = venue?.accessModesDefault.includes('GUEST_LIST')
    ? 'GUEST_LIST'
    : venue?.accessModesDefault[0]

  if (!venue) {
    return <div className="screen-container"><p>Lieu introuvable</p></div>
  }

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('venue-search')} aria-label="Retour">← Retour</button>
        <h1>{venue.title}</h1>
      </header>

      <section className="venue-detail">
        <div className="detail-hero">
          <div className="placeholder-image" style={{backgroundColor:'#e8d5c4',display:'flex',alignItems:'center',justifyContent:'center',color:'#666',fontSize:'14px'}}>Aucune photo</div>
          <div className="detail-intro">
            <div className="rating-badge">★ {venue.rating}</div>
            <h2>{venue.title}</h2>
            <p className="location">{venue.address}</p>
            <p className="hours">Ouvert de {venue.openTime} a {venue.closeTime}</p>
            <AccessModeRow modes={venue.accessModesDefault} />
          </div>
        </div>

        <div className="detail-section">
          <h3>Acces ce soir</h3>
          <p>{venue.accessSummary}</p>
          <ul className="policy-list">
            <li>Validation guest list: {venue.accessRulesSummary.guestListApproval === 'MANUAL' ? 'manuelle sous 30 minutes' : 'automatique en quelques minutes'}</li>
            <li>Comptoir: {venue.accessRulesSummary.counterNamedZones ? 'places par zone' : 'quota global selon disponibilite'}</li>
            <li>Entree: {venue.accessRulesSummary.fallbackLookup ? 'possible avec votre numero de telephone' : 'QR prefere'}</li>
          </ul>
        </div>

        {featuredEvent && (
          <div className="detail-section detail-section--highlight">
            <h3>Soiree mise en avant</h3>
            <p><strong>{featuredEvent.title}</strong> · {featuredEvent.date} a {featuredEvent.time}</p>
            <p>{featuredEvent.bookingHint}</p>
            <button type="button" className="detail-btn" onClick={() => navigate('event-detail', featuredEvent.id)}>
              Voir l evenement →
            </button>
          </div>
        )}

        <div className="detail-section">
          <h3>A propos</h3>
          <p>{venue.description}</p>
          <p>Phone: {venue.phone}</p>
        </div>

        {venue.accessModesDefault.includes('TABLE') && (
          <div className="detail-section">
            <h3>Tables disponibles</h3>
            <div className="table-grid">
              {venue.tables.map((table) => (
                <div key={table.id} className={`table-card ${!table.available ? 'disabled' : ''}`}>
                  <h4>{table.name}</h4>
                  <p>{table.zone}</p>
                  <p>Jusqu a {table.capacity} personnes</p>
                  <p className="price">{table.minSpend} MAD min</p>
                  {!table.available && <p className="status">Reservee</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {venue.accessModesDefault.includes('COUNTER') && (
          <div className="detail-section">
            <h3>Places comptoir</h3>
            <div className="table-grid">
              {venue.counterSpots.map((spot) => (
                <div key={spot.id} className={`table-card ${!spot.available ? 'disabled' : ''}`}>
                  <h4>{spot.name}</h4>
                  <p>Jusqu a {spot.capacity} personnes</p>
                  <p className="price">{spot.minSpend} MAD min</p>
                  {!spot.available && <p className="status">Prise</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="detail-section">
          <h3>Avis clients</h3>
          {venue.reviews.map((review, idx) => (
            <article key={idx} className="review-item">
              <div className="review-header">
                <strong>{review.author}</strong>
                <span>★ {review.rating}</span>
              </div>
              <p>{review.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sticky-cta sticky-cta--stacked">
        {venue.accessModesDefault.includes('TABLE') && primaryAccessMode === 'TABLE' && (
          <IonButton expand="block" onClick={() => openAccessFlow(venue.id, 'TABLE', venue.featuredEventId)}>
            Réserver une table
          </IonButton>
        )}
        {venue.accessModesDefault.includes('GUEST_LIST') && primaryAccessMode === 'GUEST_LIST' && (
          <IonButton expand="block" onClick={() => openAccessFlow(venue.id, 'GUEST_LIST', venue.featuredEventId)}>
            Demander une guest list
          </IonButton>
        )}
        {venue.accessModesDefault.includes('COUNTER') && primaryAccessMode === 'COUNTER' && (
          <IonButton expand="block" onClick={() => openAccessFlow(venue.id, 'COUNTER', venue.featuredEventId)}>
            Réserver au comptoir
          </IonButton>
        )}
        {venue.accessModesDefault.includes('TABLE') && primaryAccessMode !== 'TABLE' && (
          <button type="button" className="secondary-btn" onClick={() => openAccessFlow(venue.id, 'TABLE', venue.featuredEventId)}>
            Réserver une table
          </button>
        )}
        {venue.accessModesDefault.includes('GUEST_LIST') && primaryAccessMode !== 'GUEST_LIST' && (
          <button type="button" className="secondary-btn" onClick={() => openAccessFlow(venue.id, 'GUEST_LIST', venue.featuredEventId)}>
            Demander une guest list
          </button>
        )}
        {venue.accessModesDefault.includes('COUNTER') && primaryAccessMode !== 'COUNTER' && (
          <button type="button" className="secondary-btn" onClick={() => openAccessFlow(venue.id, 'COUNTER', venue.featuredEventId)}>
            Réserver au comptoir
          </button>
        )}
        {venue.featuredEventId && (
          <button type="button" className="secondary-btn" onClick={() => openTicketFlow(venue.featuredEventId as string)}>
            Voir la soiree ticketee
          </button>
        )}
      </section>
    </main>
  )
}

function BookingCreateScreen({
  booking,
  venueId,
  eventId,
  updateBooking,
  navigate,
}: {
  booking: BookingDraft
  venueId?: string
  eventId?: string
  updateBooking: (updates: Partial<BookingDraft>) => void
  navigate: (screen: Screen, venueId?: string) => void
}) {
  const venue = allVenues.find((item) => item.id === venueId)
  const event = eventId ? mockEvents.find((item) => item.id === eventId) : undefined

  const title =
    booking.accessMode === 'GUEST_LIST'
      ? 'Demander une guest list'
      : booking.accessMode === 'COUNTER'
        ? 'Réserver au comptoir'
        : 'Réserver une table'

  const hasResourceSelection =
    booking.accessMode === 'TABLE'
      ? Boolean(booking.tableId)
      : booking.accessMode === 'COUNTER'
        ? Boolean(booking.counterSpotId)
        : true

  const hasCelebrantName = booking.occasion !== 'BIRTHDAY' || Boolean(booking.celebrantName?.trim())
  const canContinue = hasResourceSelection && hasCelebrantName
  const validationHint = !hasResourceSelection
    ? booking.accessMode === 'TABLE'
      ? 'Sélectionnez une table pour continuer.'
      : 'Selectionnez un comptoir pour continuer.'
    : !hasCelebrantName
      ? 'Indiquez le prenom de la personne fetee.'
      : ''

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('venue-detail', venueId)} aria-label="Retour">← Retour</button>
        <h1>{title}</h1>
        <span className="stepper">{getBookingStepLabel(booking, 'booking-create')}</span>
      </header>

      <p className="flow-crumb">{booking.venueName} › {accessModeLabels[booking.accessMode]} › Creation</p>

      <section className="booking-form">
        <div className="mode-banner">
          <strong>{accessModeLabels[booking.accessMode]}</strong>
          <span>{event ? event.bookingHint : venue?.accessSummary}</span>
        </div>

        <div className="form-group">
          <label>Lieu</label>
          <input type="text" value={booking.venueName} readOnly />
        </div>

        {booking.eventTitle && (
          <div className="form-group">
            <label>Soiree</label>
            <input type="text" value={booking.eventTitle} readOnly />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={booking.date} onChange={(e) => updateBooking({ date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Heure</label>
            <input type="time" value={booking.time} onChange={(e) => updateBooking({ time: e.target.value })} />
          </div>
        </div>

        <div className="form-group">
          <label>Nombre de personnes</label>
          <div className="stepper-control">
            <button type="button" onClick={() => updateBooking({ groupSize: Math.max(1, booking.groupSize - 1) })}>−</button>
            <span>{booking.groupSize} pers.</span>
            <button type="button" onClick={() => updateBooking({ groupSize: booking.groupSize + 1 })}>+</button>
          </div>
        </div>

        <div className="form-group">
          <label>Occasion</label>
          <select value={booking.occasion} onChange={(e) => updateBooking({ occasion: e.target.value as Occasion })}>
            <option value="STANDARD">Standard</option>
            <option value="BIRTHDAY">Anniversaire</option>
            <option value="OTHER">Autre celebration</option>
          </select>
        </div>

        {booking.occasion === 'BIRTHDAY' && (
          <div className="form-group">
            <label>Prenom de la personne fetee</label>
            <input type="text" value={booking.celebrantName ?? ''} onChange={(e) => updateBooking({ celebrantName: e.target.value })} placeholder="Sara" />
          </div>
        )}

        {booking.accessMode === 'TABLE' && (
          <div className="form-group">
            <label>Choisir une table</label>
            <div className="table-select">
              {venue?.tables.map((table) => (
                <button
                  key={table.id}
                  type="button"
                  className={`table-option ${booking.tableId === table.id ? 'is-selected' : ''} ${!table.available ? 'is-disabled' : ''}`}
                  onClick={() => !table.available || updateBooking({
                    tableId: table.id,
                    tableName: table.name,
                    accessLabel: table.name,
                    accessResourceId: table.id,
                    accessResourceLabel: table.name,
                    minSpend: table.minSpend,
                    depositAmount: Math.round(table.minSpend * 0.33),
                  })}
                  disabled={!table.available}
                >
                  <span>{table.name}</span>
                  <span>{table.capacity} places</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {booking.accessMode === 'COUNTER' && (
          <div className="form-group">
            <label>Choisir un comptoir</label>
            <div className="table-select">
              {venue?.counterSpots.map((spot) => (
                <button
                  key={spot.id}
                  type="button"
                  className={`table-option ${booking.counterSpotId === spot.id ? 'is-selected' : ''} ${!spot.available ? 'is-disabled' : ''}`}
                  onClick={() => !spot.available || updateBooking({
                    counterSpotId: spot.id,
                    counterSpotName: spot.name,
                    accessLabel: spot.name,
                    accessResourceId: spot.id,
                    accessResourceLabel: spot.name,
                    tableName: spot.name,
                    minSpend: spot.minSpend,
                    depositAmount: spot.minSpend > 0 ? Math.round(spot.minSpend * 0.25) : 0,
                  })}
                  disabled={!spot.available}
                >
                  <span>{spot.name}</span>
                  <span>{spot.capacity} pers.</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {booking.accessMode === 'GUEST_LIST' && (
          <div className="detail-section detail-section--compact">
            <h3>Règles guest list</h3>
            <p>Groupe max: {venue?.guestListGroupMax ?? 6} personnes. Validation {venue?.accessRulesSummary.guestListApproval === 'MANUAL' ? 'manuelle' : 'automatique'}.</p>
            <p>En cas de besoin, le personnel peut vous retrouver avec votre numero de telephone.</p>
          </div>
        )}

        <div className="form-group">
          <label>Demandes speciales</label>
          <textarea
            placeholder="Mise en place anniversaire, bouteille, heure d'arrivee..."
            value={booking.notes}
            onChange={(e) => updateBooking({ notes: e.target.value })}
          />
        </div>

        <div className="booking-summary">
          <p><strong>Acces:</strong> {booking.accessLabel}</p>
          <p><strong>Date :</strong> {booking.date} à {booking.time}</p>
          <p><strong>Groupe:</strong> {booking.groupSize} pers.</p>
          <p><strong>Occasion:</strong> {occasionLabels[booking.occasion]}</p>
          {booking.minSpend > 0 && <p><strong>Minimum de consommation:</strong> {booking.minSpend} MAD</p>}
          {booking.ticketRequired && <p><strong>Info:</strong> Cette soirée peut nécessiter un billet à l'entrée.</p>}
        </div>
      </section>

      <section className="sticky-cta sticky-cta--stacked">
        <IonButton
          expand="block"
          onClick={() => navigate(usesBookingReview(booking.accessMode) ? 'booking-review' : 'booking-payment')}
          disabled={!canContinue}
        >
          Continuer
        </IonButton>
        {!canContinue && <p className="validation-hint">{validationHint}</p>}
        <button type="button" className="secondary-btn" onClick={() => navigate('venue-detail', venueId)}>Annuler</button>
      </section>
    </main>
  )
}

function BookingReviewScreen({
  booking,
  updateBooking,
  navigate,
}: {
  booking: BookingDraft
  updateBooking: (updates: Partial<BookingDraft>) => void
  navigate: (screen: Screen, venueId?: string) => void
}) {
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const paymentNext = booking.depositAmount > 0

  const title =
    booking.accessMode === 'GUEST_LIST'
      ? 'Relire votre demande guest list'
      : 'Relire votre reservation comptoir'

  const ctaLabel = paymentNext
    ? 'Continuer vers le paiement'
    : booking.requiresApproval
      ? 'Envoyer ma demande'
      : 'Confirmer la reservation'

  const handleContinue = () => {
    if (!acceptedTerms) return

    if (paymentNext) {
      navigate('booking-payment')
      return
    }

    const finalized = finalizeBookingDraft(booking)
    updateBooking(finalized)
    commitBookingToHistory(finalized)
    navigate('booking-confirm')
  }

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('booking-create')} aria-label="Retour">← Retour</button>
        <h1>{title}</h1>
        <span className="stepper">{getBookingStepLabel(booking, 'booking-review')}</span>
      </header>

      <p className="flow-crumb">
        {booking.venueName} › {accessModeLabels[booking.accessMode]} › Verification
      </p>

      <section className="payment-section">
        <div className="booking-recap">
          <h3>Recapitulatif</h3>
          <div className="recap-item">
            <span>{booking.venueName}</span>
            <span>{booking.date} a {booking.time}</span>
          </div>
          <div className="recap-item">
            <span>{accessModeLabels[booking.accessMode]}</span>
            <span>{booking.accessLabel}</span>
          </div>
          <div className="recap-item">
            <span>Groupe</span>
            <span>{booking.groupSize} pers. · {occasionLabels[booking.occasion]}</span>
          </div>
          {booking.notes && (
            <div className="recap-item">
              <span>Notes</span>
              <span>{booking.notes}</span>
            </div>
          )}
          {booking.minSpend > 0 && (
            <div className="recap-total">
              <span>Minimum de consommation</span>
              <strong>{booking.minSpend} MAD</strong>
            </div>
          )}
          <div className="recap-item deposit">
            <span>Validation</span>
            <strong>
              {booking.requiresApproval
                ? 'Manuelle par le venue (reponse sous 30 min)'
                : paymentNext
                  ? `Acompte ${booking.depositAmount} MAD a l etape suivante`
                  : 'Confirmation immediate'}
            </strong>
          </div>
        </div>

        {booking.accessMode === 'GUEST_LIST' && (
          <div className="detail-section detail-section--compact">
            <h3>Rappel guest list</h3>
            <p>
              {booking.requiresApproval
                ? 'Le personnel validera votre groupe avant la soiree. Vous pouvez etre retrouve a l entree par telephone.'
                : 'Acces confirme automatiquement apres envoi.'}
            </p>
          </div>
        )}

        {booking.accessMode === 'COUNTER' && (
          <div className="detail-section detail-section--compact">
            <h3>Rappel comptoir</h3>
            <p>Arrivee conseillee a l heure indiquee. Le comptoir est reserve pour la duree de la soiree selon la politique du lieu.</p>
          </div>
        )}

        <label className="checkbox-label">
          <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
          J accepte les conditions et la politique d arrivee
        </label>
      </section>

      <section className="sticky-cta sticky-cta--stacked">
        <IonButton expand="block" onClick={handleContinue} disabled={!acceptedTerms}>
          {ctaLabel}
        </IonButton>
        <button type="button" className="secondary-btn" onClick={() => navigate('booking-create')}>
          Modifier la demande
        </button>
      </section>
    </main>
  )
}

function BookingPaymentScreen({
  booking,
  updateBooking,
  navigate,
}: {
  booking: BookingDraft
  updateBooking: (updates: Partial<BookingDraft>) => void
  navigate: (screen: Screen, venueId?: string) => void
}) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'cmi' | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(15 * 60)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemainingSeconds((prev) => Math.max(prev - 1, 0))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [])

  const paymentRequired = booking.depositAmount > 0
  const ctaLabel = paymentRequired
    ? `Payer ${booking.depositAmount} MAD`
    : booking.requiresApproval
      ? 'Envoyer ma demande'
      : 'Confirmer l acces'

  const canContinue = acceptedTerms && (!paymentRequired || selectedPaymentMethod !== null) && remainingSeconds > 0

  const handleContinue = () => {
    if (!canContinue) return

    const finalized = finalizeBookingDraft({
      ...booking,
      status: booking.requiresApproval ? 'pending' : 'confirmed',
    })
    updateBooking(finalized)
    commitBookingToHistory(finalized)
    navigate('booking-confirm')
  }

  const backScreen: Screen = usesBookingReview(booking.accessMode) ? 'booking-review' : 'booking-create'

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate(backScreen)} aria-label="Retour">← Retour</button>
        <h1>{paymentRequired ? 'Paiement' : 'Verification de l acces'}</h1>
        <span className="stepper">{getBookingStepLabel(booking, 'booking-payment')}</span>
      </header>

      <p className="flow-crumb">{booking.venueName} › {accessModeLabels[booking.accessMode]} › Paiement</p>

      <section className="payment-section">
        <div className="draft-timer">
          <p>Cette reservation est conservee pendant <strong>{formatCountdown(remainingSeconds)}</strong></p>
          {remainingSeconds === 0 && <p className="timer-expired">Le temps est ecoule. Revenez a l'etape precedente pour relancer la reservation.</p>}
        </div>

        <div className="booking-recap">
          <h3>Récapitulatif</h3>
          <div className="recap-item">
            <span>{booking.venueName}</span>
            <span>{booking.date} à {booking.time}</span>
          </div>
          <div className="recap-item">
            <span>{accessModeLabels[booking.accessMode]}</span>
            <span>{booking.accessLabel}</span>
          </div>
          <div className="recap-item">
            <span>Groupe de {booking.groupSize}</span>
            <span>{occasionLabels[booking.occasion]}</span>
          </div>
          {booking.minSpend > 0 && (
            <div className="recap-total">
              <span>Minimum de consommation</span>
              <strong>{booking.minSpend} MAD</strong>
            </div>
          )}
          <div className="recap-item deposit">
            <span>{paymentRequired ? 'Acompte a payer maintenant' : booking.requiresApproval ? 'Validation' : 'Regle d\'entree'}</span>
            <strong>{paymentRequired ? `${booking.depositAmount} MAD` : booking.requiresApproval ? 'Validation manuelle' : 'Aucun prepaiement'}</strong>
          </div>
        </div>

        <div className="trust-panel" style={{backgroundColor:'#f9f5f0',border:'1px solid #e8d5c4',borderRadius:'8px',padding:'16px',marginBottom:'20px'}}>
          <h3 style={{marginTop:'0',fontSize:'16px',fontWeight:'600'}}>Confiance & Politiques</h3>
          
          <details style={{marginBottom:'12px'}}>
            <summary style={{cursor:'pointer',fontWeight:'500',paddingBottom:'8px'}}>📋 Politique d'arrivée</summary>
            <p style={{margin:'8px 0 0 0',fontSize:'13px',color:'#666',paddingTop:'8px',paddingLeft:'12px',borderLeft:'3px solid #d4a574'}}>
              Arrivée recommandée entre 20:00 et 22:30. Accès après 23:00 soumis à la disponibilité.
            </p>
          </details>

          <details style={{marginBottom:'12px'}}>
            <summary style={{cursor:'pointer',fontWeight:'500',paddingBottom:'8px'}}>↩️ Annulation</summary>
            <p style={{margin:'8px 0 0 0',fontSize:'13px',color:'#666',paddingTop:'8px',paddingLeft:'12px',borderLeft:'3px solid #d4a574'}}>
              Annulation gratuite jusqu'à 24h avant. Après, forfait de 50% retenu.
            </p>
          </details>

          <details style={{marginBottom:'12px'}}>
            <summary style={{cursor:'pointer',fontWeight:'500',paddingBottom:'8px'}}>💰 Qu'est-ce que l'acompte couvre ?</summary>
            <p style={{margin:'8px 0 0 0',fontSize:'13px',color:'#666',paddingTop:'8px',paddingLeft:'12px',borderLeft:'3px solid #d4a574'}}>
              L'acompte ({booking.depositAmount} MAD) est déduit de votre consommation minimum sur place. Pas de remboursement en cas d'absence.
            </p>
          </details>

          <details style={{marginBottom:'12px'}}>
            <summary style={{cursor:'pointer',fontWeight:'500',paddingBottom:'8px'}}>✓ Validation</summary>
            <p style={{margin:'8px 0 0 0',fontSize:'13px',color:'#666',paddingTop:'8px',paddingLeft:'12px',borderLeft:'3px solid #d4a574'}}>
              {booking.requiresApproval ? 'Réponse du venue attendue sous 30 minutes.' : 'Confirmé immédiatement.'}
            </p>
          </details>

          <button type="button" style={{width:'100%',padding:'10px 12px',marginTop:'12px',backgroundColor:'#fff',border:'1px solid #d4a574',borderRadius:'6px',cursor:'pointer',fontSize:'14px',fontWeight:'500'}}>
            💬 Assistance WhatsApp
          </button>
        </div>

        <div className="payment-providers">
          <h3>{paymentRequired ? 'Choisir un mode de paiement' : 'Prochaine etape'}</h3>
          {paymentRequired ? (
            <>
              <button
                type="button"
                className={`provider-btn ${selectedPaymentMethod === 'stripe' ? 'is-selected' : ''}`}
                onClick={() => setSelectedPaymentMethod('stripe')}
              >
                Carte bancaire (Stripe)
              </button>
              <button
                type="button"
                className={`provider-btn ${selectedPaymentMethod === 'cmi' ? 'is-selected' : ''}`}
                onClick={() => setSelectedPaymentMethod('cmi')}
              >
                Carte bancaire marocaine (CMI)
              </button>
            </>
          ) : (
            <div className="mode-banner">
              <strong>{booking.requiresApproval ? 'Votre demande sera verifiee' : 'Confirmation immediate'}</strong>
              <span>{booking.ticketRequired ? 'Cette soiree peut exiger un billet ou une regle d\'entree hybride.' : 'Le personnel peut aussi vous retrouver avec votre numero de telephone.'}</span>
            </div>
          )}
        </div>

        <label className="checkbox-label">
          <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
          J\'accepte les conditions et la politique d\'arrivee
        </label>
      </section>

      <section className="sticky-cta sticky-cta--stacked">
        <IonButton expand="block" onClick={handleContinue} disabled={!canContinue}>{ctaLabel}</IonButton>
        {remainingSeconds === 0 && <p className="validation-hint">Reservation expiree.</p>}
        <button type="button" className="secondary-btn" onClick={() => navigate(backScreen)}>Retour</button>
      </section>
    </main>
  )
}

function BookingConfirmScreen({ booking, navigate }: { booking: BookingDraft; navigate: (screen: Screen, venueId?: string) => void }) {
  const isPending = booking.status === 'pending' || booking.approvalStatus === 'PENDING'

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <h1>{isPending ? 'Demande en attente' : 'Acces confirme'}</h1>
      </header>

      <section className="confirmation-section">
        <div className="success-badge">{isPending ? '…' : '✓'}</div>

        <div className="confirmation-details">
          <h2>{booking.venueName}</h2>
          <p className="reference">Reference: {booking.reference}</p>

          {!isPending && (
            <div className="qr-placeholder">
              � ACCÈS CONFIRMÉ
              <br />
              <small>À présenter à l'entrée</small>
            </div>
          )}

          {isPending && (
            <div className="pending-panel">
              <strong>Validation manuelle en cours</strong>
              <p>Le lieu peut vous retrouver par numéro de téléphone ou référence à l'entrée si la validation arrive plus tard.</p>
            </div>
          )}

          <div className="confirmation-recap">
            <div className="recap-row"><span>Acces</span><strong>{booking.accessLabel}</strong></div>
            <div className="recap-row"><span>Date & Heure</span><strong>{booking.date} a {booking.time}</strong></div>
            <div className="recap-row"><span>Taille du groupe</span><strong>{booking.groupSize} pers.</strong></div>
            <div className="recap-row"><span>Occasion</span><strong>{occasionLabels[booking.occasion]}</strong></div>
            {booking.minSpend > 0 && <div className="recap-row"><span>Minimum de consommation</span><strong>{booking.minSpend} MAD</strong></div>}
          </div>

          <p className="confirmation-hint">
            {isPending
              ? 'Vous recevrez un email ou un SMS lorsque le lieu validera votre acces.'
              : 'Un email et un SMS de confirmation ont ete envoyes. Le personnel peut aussi vous retrouver par nom et telephone.'}
          </p>
        </div>
      </section>

      <section className="sticky-cta sticky-cta--stacked">
        <IonButton expand="block" onClick={() => navigate('my-accesses')}>Voir mes accès</IonButton>
        <IonButton expand="block" fill="outline" onClick={() => navigate('bookings-list')}>Mes réservations</IonButton>
        <button type="button" className="secondary-btn" onClick={() => navigate('home')}>Retour a l accueil</button>
      </section>
    </main>
  )
}

function TicketBuyScreen({
  ticket,
  updateTicket,
  eventId,
  navigate,
}: {
  ticket: TicketDraft
  updateTicket: (updates: Partial<TicketDraft>) => void
  eventId?: string
  navigate: (screen: Screen, id?: string) => void
}) {
  const event = mockEvents.find((item) => item.id === eventId)

  if (!event) {
    return <div className="screen-container"><p>Evenement introuvable</p></div>
  }

  const selectedCategory = event.ticketCategories.find((category) => category.name === ticket.categoryName)
  const maxQuantity = selectedCategory?.remaining ?? 0
  const canContinue = maxQuantity > 0 && ticket.quantity <= maxQuantity

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('event-detail', event.id)} aria-label="Retour">← Retour</button>
        <h1>Acheter des billets</h1>
        <span className="stepper">Etape 1/3</span>
      </header>

      <section className="booking-form">
        <div className="mode-banner">
          <strong>{event.title}</strong>
          <span>{event.entryPolicy}</span>
        </div>

        <div className="detail-section detail-section--compact">
          <h3>Choisir une categorie</h3>
          <div className="table-select">
            {event.ticketCategories.map((category) => (
              <button
                key={category.name}
                type="button"
                className={`table-option ${ticket.categoryName === category.name ? 'is-selected' : ''} ${category.remaining === 0 ? 'is-disabled' : ''}`}
                onClick={() => {
                  if (category.remaining === 0) return
                  updateTicket({
                    categoryName: category.name,
                    unitPrice: category.price,
                    quantity: Math.min(ticket.quantity, category.remaining),
                    total: category.price * Math.min(ticket.quantity, category.remaining),
                  })
                }}
                disabled={category.remaining === 0}
              >
                <span>{category.name}</span>
                <span>{category.price === 0 ? 'Gratuit' : `${category.price} MAD`}</span>
                <span className="category-meta">
                  {category.drinkIncluded ? '🍸 Boisson incluse · ' : ''}
                  {category.paymentTiming === 'ON_SITE' ? 'Sur place possible' : 'Paiement en ligne'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Quantite</label>
          <div className="stepper-control">
            <button type="button" onClick={() => updateTicket({ quantity: Math.max(1, ticket.quantity - 1), total: ticket.unitPrice * Math.max(1, ticket.quantity - 1) })}>−</button>
            <span>{ticket.quantity} billets</span>
            <button
              type="button"
              onClick={() => updateTicket({ quantity: Math.min(maxQuantity, ticket.quantity + 1), total: ticket.unitPrice * Math.min(maxQuantity, ticket.quantity + 1) })}
              disabled={ticket.quantity >= maxQuantity}
            >
              +
            </button>
          </div>
          {selectedCategory && <p className="input-hint">Places restantes pour cette categorie: {selectedCategory.remaining}</p>}
        </div>

        <div className="booking-summary">
          <p><strong>Categorie:</strong> {ticket.categoryName}</p>
          <p><strong>Lieu:</strong> {ticket.venueName}</p>
          <p><strong>Total:</strong> {ticket.total} MAD</p>
        </div>
      </section>

      <section className="sticky-cta sticky-cta--stacked">
        <IonButton expand="block" onClick={() => navigate('ticket-payment')} disabled={!canContinue}>Continuer vers le paiement</IonButton>
        {!canContinue && <p className="validation-hint">Categorie indisponible ou quantite non valide.</p>}
        <button type="button" className="secondary-btn" onClick={() => navigate('event-detail', event.id)}>Annuler</button>
      </section>
    </main>
  )
}

function TicketPaymentScreen({
  ticket,
  updateTicket,
  navigate,
}: {
  ticket: TicketDraft
  updateTicket: (updates: Partial<TicketDraft>) => void
  navigate: (screen: Screen, id?: string) => void
}) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'cmi' | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(10 * 60)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemainingSeconds((prev) => Math.max(prev - 1, 0))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [])

  const handlePay = () => {
    if (!selectedPaymentMethod || !acceptedTerms || remainingSeconds <= 0) return
    const reference = ticket.reference ?? `TKT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const event = mockEvents.find((item) => item.id === ticket.eventId)
    updateTicket({ status: 'confirmed', reference })
    commitTicketToAccesses({
      eventId: ticket.eventId,
      eventTitle: ticket.eventTitle,
      venueName: ticket.venueName,
      categoryName: ticket.categoryName,
      quantity: ticket.quantity,
      total: ticket.total,
      reference,
      date: event?.date ?? '2026-06-20',
      time: event?.time ?? '23:00',
    })
    navigate('ticket-confirm')
  }

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('ticket-buy')} aria-label="Retour">← Retour</button>
        <h1>Paiement billet</h1>
        <span className="stepper">Etape 2/3</span>
      </header>

      <section className="payment-section">
        <div className="draft-timer">
          <p>Ces billets sont conservés pendant <strong>{formatCountdown(remainingSeconds)}</strong></p>
          {remainingSeconds === 0 && <p className="timer-expired">Le temps est ecoule. Revenez pour relancer l'achat.</p>}
        </div>

        <div className="booking-recap">
          <h3>Recapitulatif billet</h3>
          <div className="recap-item"><span>{ticket.eventTitle}</span><span>{ticket.venueName}</span></div>
          <div className="recap-item"><span>{ticket.categoryName}</span><span>{ticket.quantity} billets</span></div>
          <div className="recap-total"><span>Total</span><strong>{ticket.total} MAD</strong></div>
        </div>

        <div className="payment-providers">
          <h3>Choisir un mode de paiement</h3>
          <button
            type="button"
            className={`provider-btn ${selectedPaymentMethod === 'stripe' ? 'is-selected' : ''}`}
            onClick={() => setSelectedPaymentMethod('stripe')}
          >
            Carte bancaire (Stripe)
          </button>
          <button
            type="button"
            className={`provider-btn ${selectedPaymentMethod === 'cmi' ? 'is-selected' : ''}`}
            onClick={() => setSelectedPaymentMethod('cmi')}
          >
            Carte bancaire marocaine (CMI)
          </button>
        </div>

        <label className="checkbox-label">
          <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
          J'accepte les conditions de l'evenement et de billetterie
        </label>
      </section>

      <section className="sticky-cta sticky-cta--stacked">
        <IonButton expand="block" onClick={handlePay} disabled={!selectedPaymentMethod || !acceptedTerms || remainingSeconds <= 0}>Payer {ticket.total} MAD</IonButton>
        {remainingSeconds <= 0 && <p className="validation-hint">Paiement indisponible: session expiree.</p>}
        <button type="button" className="secondary-btn" onClick={() => navigate('ticket-buy')}>Retour</button>
      </section>
    </main>
  )
}

function TicketConfirmScreen({ ticket, navigate }: { ticket: TicketDraft; navigate: (screen: Screen, id?: string) => void }) {
  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <h1>Billets confirmes</h1>
      </header>

      <section className="confirmation-section">
        <div className="success-badge">✓</div>
        <div className="confirmation-details">
          <h2>{ticket.eventTitle}</h2>
          <p className="reference">Référence: {ticket.reference}</p>
          <div className="qr-placeholder">
            � BILLET D'ENTRÉE
            <br />
            <small>À présenter à l'entrée</small>
          </div>
          <div className="confirmation-recap">
            <div className="recap-row"><span>Catégorie</span><strong>{ticket.categoryName}</strong></div>
            <div className="recap-row"><span>Quantité</span><strong>{ticket.quantity}</strong></div>
            <div className="recap-row"><span>Total</span><strong>{ticket.total} MAD</strong></div>
          </div>
          <p className="confirmation-hint">Votre QR peut aussi etre retrouve par l'accueil via votre numero de telephone si besoin.</p>
        </div>
      </section>

      <section className="sticky-cta sticky-cta--stacked">
        <IonButton expand="block" onClick={() => navigate('my-accesses')}>Voir mes accès</IonButton>
        <button type="button" className="secondary-btn" onClick={() => navigate('home')}>Retour a l accueil</button>
      </section>
    </main>
  )
}

function BookingsListScreen({ navigate }: { navigate: (screen: Screen, id?: string) => void }) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const filteredBookings = mockBookingHistory.filter((booking) => {
    const bookingDate = new Date(`${booking.date}T${booking.time}`)
    const now = new Date()
    return activeTab === 'upcoming' ? bookingDate >= now : bookingDate < now
  })

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('home')} aria-label="Retour">← Retour</button>
        <h1>Mes réservations</h1>
      </header>

      <section className="tabs">
        <button type="button" className={activeTab === 'upcoming' ? 'tab is-active' : 'tab'} onClick={() => setActiveTab('upcoming')}>À venir</button>
        <button type="button" className={activeTab === 'past' ? 'tab is-active' : 'tab'} onClick={() => setActiveTab('past')}>Passées</button>
      </section>

      <div className="bookings-list">
        {filteredBookings.map((booking) => (
          <article key={booking.id} className="booking-card">
            <div className="booking-card__header">
              <h3>{booking.venueName}</h3>
              <span className={`status-badge ${getStatusClass(booking.status)}`}>{getStatusLabel(booking.status)}</span>
            </div>
            <div className="booking-card__details">
              <p><strong>{booking.date}</strong> à <strong>{booking.time}</strong></p>
              <p>{booking.partySize} pers. • {accessModeLabels[booking.accessMode]} • {booking.accessLabel}</p>
              <p>{occasionLabels[booking.occasion]} • Réf : {booking.reference}</p>
            </div>
            <div className="booking-card__actions">
              <button type="button" className="action-link" onClick={() => navigate('booking-detail', booking.id)}>Voir détail</button>
              <button type="button" className="action-link">Assistance</button>
            </div>
          </article>
        ))}
        {filteredBookings.length === 0 && <p className="empty-state">Aucune reservation dans cet onglet.</p>}
      </div>
    </main>
  )
}

function MyAccessesScreen({ navigate }: { navigate: (screen: Screen, id?: string) => void }) {
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'pending' | 'used' | 'cancelled' | 'all'>('upcoming')

  const ticketAccesses = mockCustomerTicketAccesses

  const allAccesses = [
    ...mockBookingHistory.map((booking) => ({
      id: booking.id,
      type: 'booking' as const,
      title: booking.venueName,
      venueName: booking.venueName,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      accessLabel: booking.accessLabel,
      accessMode: booking.accessMode,
      reference: booking.reference,
      details: `${booking.partySize} pers. • ${accessModeLabels[booking.accessMode]}`,
    })),
    ...ticketAccesses,
  ]

  const isPast = (date: string, time: string) => new Date(`${date}T${time}`) < new Date()

  const filteredAccesses = allAccesses.filter((access) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'pending') return access.status === 'pending'
    if (activeFilter === 'cancelled') return access.status === 'cancelled'
    if (activeFilter === 'used') return isPast(access.date, access.time) && access.status === 'confirmed'
    if (activeFilter === 'upcoming') return !isPast(access.date, access.time) && access.status !== 'cancelled'
    return true
  })

  const nextAccess = allAccesses
    .filter((access) => !isPast(access.date, access.time) && access.status !== 'cancelled')
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())[0]

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('home')} aria-label="Retour">← Retour</button>
        <h1>Mes accès</h1>
      </header>

      <section className="dashboard-section">
        <IonButton expand="block" fill="outline" onClick={() => navigate('customer-tickets')}>
          Voir mes tickets uniquement
        </IonButton>
      </section>

      {nextAccess && (
        <section className="detail-section detail-section--highlight">
          <h3>Prochain accès</h3>
          <p><strong>{nextAccess.title}</strong> · {nextAccess.date} à {nextAccess.time}</p>
          <p>{nextAccess.details}</p>
          <IonButton expand="block" onClick={() => nextAccess.type === 'booking' ? navigate('booking-detail', nextAccess.id) : navigate('event-detail', nextAccess.eventId)}>
            Ouvrir mon QR plein écran
          </IonButton>
        </section>
      )}

      <section className="tabs">
        <button type="button" className={activeFilter === 'upcoming' ? 'tab is-active' : 'tab'} onClick={() => setActiveFilter('upcoming')}>À venir</button>
        <button type="button" className={activeFilter === 'pending' ? 'tab is-active' : 'tab'} onClick={() => setActiveFilter('pending')}>En attente</button>
        <button type="button" className={activeFilter === 'used' ? 'tab is-active' : 'tab'} onClick={() => setActiveFilter('used')}>Utilisés</button>
        <button type="button" className={activeFilter === 'cancelled' ? 'tab is-active' : 'tab'} onClick={() => setActiveFilter('cancelled')}>Annulés</button>
        <button type="button" className={activeFilter === 'all' ? 'tab is-active' : 'tab'} onClick={() => setActiveFilter('all')}>Tous</button>
      </section>

      <div className="bookings-list">
        {filteredAccesses.map((access) => (
          <article key={access.id} className="booking-card">
            <div className="booking-card__header">
              <h3>{access.title}</h3>
              <span className={`status-badge ${getStatusClass(access.status)}`}>{getStatusLabel(access.status)}</span>
            </div>
            <div className="booking-card__details">
              <p><strong>{access.date}</strong> à <strong>{access.time}</strong></p>
              <p>{access.venueName} · {access.details}</p>
              <p>Réf : {access.reference}</p>
              <p>Mode: {accessModeLabels[access.accessMode]}</p>
            </div>
            <div className="booking-card__actions">
              {access.type === 'booking' ? (
                <button type="button" className="action-link" onClick={() => navigate('booking-detail', access.id)}>QR & Détails</button>
              ) : (
                <button type="button" className="action-link" onClick={() => navigate('event-detail', access.eventId)}>Voir le ticket</button>
              )}
              <button type="button" className="action-link" onClick={() => globalThis.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(access.venueName)}`, '_blank')}>Itinéraire</button>
              <button type="button" className="action-link" onClick={() => globalThis.open('https://wa.me/212600000000', '_blank')}>WhatsApp</button>
            </div>
          </article>
        ))}
        {filteredAccesses.length === 0 && <p className="empty-state">Aucun accès dans cet onglet.</p>}
      </div>
    </main>
  )
}

function CustomerTicketsScreen({ navigate }: { navigate: (screen: Screen, id?: string) => void }) {
  const tickets = mockCustomerTicketAccesses

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('my-accesses')} aria-label="Retour">← Retour</button>
        <h1>Mes tickets</h1>
      </header>

      <div className="bookings-list">
        {tickets.length === 0 ? (
          <p className="empty-state">Aucun ticket pour le moment.</p>
        ) : (
          tickets.map((ticket) => (
            <article key={ticket.id} className="booking-card">
              <div className="booking-card__header">
                <h3>{ticket.title}</h3>
                <span className={`status-badge ${getStatusClass(ticket.status)}`}>{getStatusLabel(ticket.status)}</span>
              </div>
              <div className="booking-card__details">
                <p><strong>{ticket.date}</strong> à <strong>{ticket.time}</strong></p>
                <p>{ticket.venueName} · {ticket.details}</p>
                <p>Réf : {ticket.reference}</p>
              </div>
              <div className="booking-card__actions">
                <button type="button" className="action-link" onClick={() => navigate('event-detail', ticket.eventId)}>QR & Détails</button>
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  )
}

function LoginScreen({ navigate, loginCustomer }: { navigate: (screen: Screen, id?: string) => void; loginCustomer: () => void }) {
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  const handleSendOtp = () => {
    if (!phone.trim()) return
    // Mock: just show OTP input
    setOtpSent(true)
  }

  const handleVerifyOtp = () => {
    if (!otpCode.trim()) return
    // Mock: accept any OTP code
    loginCustomer()
  }

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('entry')} aria-label="Retour">← Retour</button>
        <h1>Connexion Layali</h1>
      </header>

      <section className="auth-form">
        {!otpSent ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Connexion sécurisée par téléphone</p>
            </div>

            <div className="form-group">
              <label>Numéro de téléphone</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="+212 6 12 34 56 78" 
                autoFocus
              />
            </div>

            <p style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
              Un code de confirmation vous sera envoyé par SMS.
            </p>
            <p style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
              Vous pouvez continuer en mode découverte sans compte et vous connecter au moment du paiement.
            </p>

            <section className="sticky-cta sticky-cta--stacked">
              <IonButton expand="block" onClick={handleSendOtp} disabled={!phone.trim()}>Recevoir un code</IonButton>
              <button type="button" className="secondary-btn" onClick={() => navigate('register')}>Créer un compte</button>
              <button type="button" className="link-btn" onClick={() => navigate('entry')}>Retour</button>
            </section>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Code de confirmation envoyé à</p>
              <p style={{ fontWeight: '600' }}>{phone}</p>
            </div>

            <div className="form-group">
              <label>Code de confirmation (6 chiffres)</label>
              <input 
                type="text" 
                value={otpCode} 
                onChange={(e) => setOtpCode(e.target.value.replace(/\\D/g, '').slice(0, 6))} 
                placeholder="000000" 
                maxLength={6}
                autoFocus
              />
            </div>

            <p style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
              N'avez pas reçu le code ? <button type="button" className="link-btn" onClick={() => setOtpSent(false)}>Changer de numéro</button>
            </p>

            <section className="sticky-cta sticky-cta--stacked">
              <IonButton expand="block" onClick={handleVerifyOtp} disabled={otpCode.length !== 6}>Vérifier & Connecter</IonButton>
              <button type="button" className="link-btn" onClick={() => setOtpSent(false)}>← Modifier le numéro</button>
            </section>
          </>
        )}
      </section>
    </main>
  )
}

function RegisterScreen({ navigate }: { navigate: (screen: Screen, id?: string) => void }) {
  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('login')} aria-label="Retour">← Retour</button>
        <h1>Créer un compte</h1>
      </header>

      <section className="auth-form">
        <div className="form-row">
          <div className="form-group">
            <label>Prénom</label>
            <input type="text" placeholder="Omar" />
          </div>
          <div className="form-group">
            <label>Nom</label>
            <input type="text" placeholder="Tazi" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="votre@email.com" />
          </div>
          <div className="form-group">
            <label>Téléphone</label>
            <input type="tel" placeholder="+212 6…" />
          </div>
        </div>
        <div className="form-group">
          <label>Mot de passe</label>
          <input type="password" placeholder="••••••••" />
        </div>
        <div className="form-group">
          <label>Confirmer le mot de passe</label>
          <input type="password" placeholder="••••••••" />
        </div>
        <label className="checkbox-label">
          <input type="checkbox" />J'accepte les conditions d'utilisation
        </label>
      </section>

      <section className="sticky-cta sticky-cta--stacked">
        <IonButton expand="block" onClick={() => navigate('home')}>Créer mon compte</IonButton>
        <button type="button" className="link-btn" onClick={() => navigate('login')}>J'ai déjà un compte</button>
      </section>
    </main>
  )
}

function EventListScreen({
  navigate,
  openAccessFlow,
  openTicketFlow,
}: {
  navigate: (screen: Screen, id?: string) => void
  openAccessFlow: (venueId: string, accessMode: AccessMode, eventId?: string) => void
  openTicketFlow: (eventId: string) => void
}) {
  const filterOptions = ['Ce soir', 'Ticket', 'Table', 'Guest list', 'Comptoir']
  const [activeFilter, setActiveFilter] = useState(filterOptions[0])

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <h1>Événements</h1>
        <button type="button" aria-label="Rechercher">🔍</button>
      </header>

      <section className="filter-chips">
        {filterOptions.map((filter) => (
          <IonChip
            key={filter}
            className={activeFilter === filter ? 'filter-chip is-active' : 'filter-chip'}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </IonChip>
        ))}
      </section>

      <div className="event-list">
        {mockEvents.map((event) => (
          <article key={event.id} className="event-card-large" onClick={() => navigate('event-detail', event.id)} style={{ cursor: 'pointer' }}>
            <div className="event-poster">{event.posterEmoji}</div>
            <div className="event-info">
              <span className="event-genre-badge">{event.genre}</span>
              {event.ageRestriction && <span className="age-badge">{event.ageRestriction}</span>}
              {event.specialNight && <span className="age-badge">Soiree speciale</span>}
              <h2>{event.title}</h2>
              <p className="event-venue">{event.venueName} · {event.district}</p>
              <p className="event-date">📅 {event.date} à {event.time}</p>
              <AccessModeRow modes={event.accessModes} />
              <p className="event-policy-line">{event.ticketRequired ? 'Billet requis a l entree' : event.entryPolicy}</p>
              <div className="mini-actions">
                {event.accessModes.includes('TICKET') && <button type="button" onClick={(e) => { e.stopPropagation(); openTicketFlow(event.id) }}>Ticket</button>}
                {event.accessModes.includes('TABLE') && <button type="button" onClick={(e) => { e.stopPropagation(); openAccessFlow(event.venueId, 'TABLE', event.id) }}>Table</button>}
                {event.guestListEnabled && <button type="button" onClick={(e) => { e.stopPropagation(); openAccessFlow(event.venueId, 'GUEST_LIST', event.id) }}>Guest list</button>}
                {event.counterEnabled && <button type="button" onClick={(e) => { e.stopPropagation(); openAccessFlow(event.venueId, 'COUNTER', event.id) }}>Comptoir</button>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}

function EventDetailScreen({
  eventId,
  navigate,
  openAccessFlow,
  openTicketFlow,
}: {
  eventId?: string
  navigate: (screen: Screen, id?: string) => void
  openAccessFlow: (venueId: string, accessMode: AccessMode, eventId?: string) => void
  openTicketFlow: (eventId: string) => void
}) {
  const event = mockEvents.find((item) => item.id === eventId)

  if (!event) {
    return <div className="screen-container"><p>Événement non trouvé</p></div>
  }

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('event-list')} aria-label="Retour">← Retour</button>
        <h1>{event.title}</h1>
      </header>

      <div className="event-detail-poster">{event.posterEmoji}</div>

      <div className="detail-section">
        <div className="event-meta-row">
          <span className="event-genre-badge">{event.genre}</span>
          {event.ageRestriction && <span className="age-badge">{event.ageRestriction}</span>}
          {event.specialNight && <span className="age-badge">Soiree speciale</span>}
        </div>
        <h2>{event.title}</h2>
        <p className="location">{event.venueName} · {event.district}</p>
        <p className="hours">📅 {event.date} à {event.time}</p>
        <AccessModeRow modes={event.accessModes} />
      </div>

      <div className="detail-section">
        <h3>Conditions d entree</h3>
        <p>{event.entryPolicy}</p>
        <p>{event.bookingHint}</p>
      </div>

      <div className="detail-section">
        <h3>Lineup / Programme</h3>
        {event.lineup.map((artist, index) => (
          <p key={index} className="lineup-row">🎵 {artist}</p>
        ))}
      </div>

      <div className="detail-section">
        <h3>Tarifs billets</h3>
        {event.ticketCategories.map((category, index) => (
          <div key={index} className="ticket-row">
            <div>
              <strong>{category.name}</strong>
              <p className="ticket-remaining">{category.remaining} places restantes</p>
            </div>
            <strong className="ticket-price">{category.price === 0 ? 'Gratuit' : `${category.price} MAD`}</strong>
          </div>
        ))}
      </div>

      <section className="sticky-cta sticky-cta--stacked">
        {event.accessModes.includes('TICKET') && <IonButton expand="block" onClick={() => openTicketFlow(event.id)}>Acheter un billet</IonButton>}
        {event.accessModes.includes('TABLE') && <button type="button" className="secondary-btn" onClick={() => openAccessFlow(event.venueId, 'TABLE', event.id)}>Réserver une table</button>}
        {event.guestListEnabled && <button type="button" className="secondary-btn" onClick={() => openAccessFlow(event.venueId, 'GUEST_LIST', event.id)}>Demander une guest list</button>}
        {event.counterEnabled && <button type="button" className="secondary-btn" onClick={() => openAccessFlow(event.venueId, 'COUNTER', event.id)}>Réserver au comptoir</button>}
      </section>
    </main>
  )
}

function CustomerProfileScreen({ navigate, logoutCustomer }: { navigate: (screen: Screen, id?: string) => void; logoutCustomer: () => void }) {
  const [profile, setProfile] = useState({ ...mockUserProfile })

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('home')} aria-label="Retour">← Retour</button>
        <h1>Mon profil</h1>
      </header>

      <div className="profile-avatar-block">
        <div className="profile-avatar">{profile.firstName[0]}{profile.lastName[0]}</div>
        <button type="button" className="link-btn">Changer la photo</button>
      </div>

      <section className="auth-form">
        <div className="form-row">
          <div className="form-group">
            <label>Prénom</label>
            <input type="text" value={profile.firstName} onChange={(e) => setProfile((prev) => ({ ...prev, firstName: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Nom</label>
            <input type="text" value={profile.lastName} onChange={(e) => setProfile((prev) => ({ ...prev, lastName: e.target.value }))} />
          </div>
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={profile.email} readOnly className="readonly-field" />
          <button type="button" className="field-change-link">Modifier l'email</button>
        </div>
        <div className="form-group">
          <label>Téléphone</label>
          <input type="tel" value={profile.phone} onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Ville préférée</label>
          <input type="text" value={profile.city} onChange={(e) => setProfile((prev) => ({ ...prev, city: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Langue</label>
          <select value={profile.language} onChange={(e) => setProfile((prev) => ({ ...prev, language: e.target.value }))}>
            <option>Français</option>
            <option>العربية</option>
            <option>English</option>
          </select>
        </div>
        <label className="checkbox-label">
          <input type="checkbox" checked={profile.marketingOptIn} onChange={(e) => setProfile((prev) => ({ ...prev, marketingOptIn: e.target.checked }))} />
          Recevoir les offres et événements
        </label>
      </section>

      <section className="sticky-cta sticky-cta--stacked">
        <IonButton expand="block" onClick={() => navigate('my-accesses')}>Mes accès</IonButton>
        <IonButton expand="block" fill="outline" onClick={() => navigate('customer-tickets')}>Mes tickets</IonButton>
        <IonButton expand="block" fill="outline">Enregistrer</IonButton>
        <button type="button" className="secondary-btn" onClick={logoutCustomer}>Se déconnecter</button>
        <button type="button" className="danger-btn">Supprimer mon compte</button>
      </section>
    </main>
  )
}

function BookingDetailScreen({ bookingId, navigate }: { bookingId?: string; navigate: (screen: Screen, id?: string) => void }) {
  const booking = mockBookingHistory.find((item) => item.id === bookingId)

  if (!booking) {
    return <div className="screen-container"><p>Réservation non trouvée</p></div>
  }

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('bookings-list')} aria-label="Retour">← Retour</button>
        <h1>Détail réservation</h1>
      </header>

      <section className="confirmation-section">
        <div className="success-badge">{booking.status === 'pending' ? '…' : '✓'}</div>
        <div className="confirmation-details">
          <h2>{booking.venueName}</h2>
          <p className="reference">Réf : {booking.reference}</p>

          {booking.status !== 'pending' && (
            <div className="qr-placeholder">
              📱 QR CODE
              <br />
              <small>Montrer à l'entrée</small>
            </div>
          )}

          <div className="confirmation-recap">
            <div className="recap-row"><span>Date & Heure</span><strong>{booking.date} à {booking.time}</strong></div>
            <div className="recap-row"><span>Personnes</span><strong>{booking.partySize} pers.</strong></div>
            <div className="recap-row"><span>Mode d'accès</span><strong>{accessModeLabels[booking.accessMode]}</strong></div>
            <div className="recap-row"><span>Ressource</span><strong>{booking.accessLabel}</strong></div>
            <div className="recap-row"><span>Occasion</span><strong>{occasionLabels[booking.occasion]}</strong></div>
            <div className="recap-row"><span>Minimum de consommation</span><strong>{booking.minSpend} MAD</strong></div>
            <div className="recap-row"><span>Acompte payé</span><strong>{booking.depositPaid} MAD</strong></div>
            <div className="recap-row"><span>Statut</span><strong className={`status-label status-label--${getStatusClass(booking.status)}`}>{getStatusLabel(booking.status)}</strong></div>
          </div>

          <p className="confirmation-hint">
            {booking.status === 'pending'
              ? 'Votre demande est en attente. Le lieu pourra aussi vous retrouver par telephone si la validation arrive tard.'
              : 'Une confirmation email et SMS a été envoyée. Le QR ou la recherche par téléphone fonctionnent à l’entrée.'}
          </p>
        </div>
      </section>

      <section className="sticky-cta sticky-cta--stacked">
        <button type="button" className="danger-btn">Annuler la réservation</button>
        <button type="button" className="secondary-btn" onClick={() => navigate('bookings-list')}>Retour aux réservations</button>
      </section>
    </main>
  )
}

function AdminOverviewScreen({ navigate }: { navigate: (screen: Screen, id?: string) => void }) {
  const activeCount = mockAdminTenants.filter((t) => t.status === 'ACTIVE').length
  const suspendedCount = mockAdminTenants.filter((t) => t.status === 'SUSPENDED').length

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('entry')} aria-label="Retour">← Retour</button>
        <h1>Admin Nafura</h1>
      </header>
      <section className="dashboard-kpis">
        <div className="kpi-grid">
          <article className="kpi-card"><span className="kpi-value">{mockAdminTenants.length}</span><span className="kpi-label">Tenants</span></article>
          <article className="kpi-card"><span className="kpi-value">{activeCount}</span><span className="kpi-label">Actifs</span></article>
          <article className="kpi-card"><span className="kpi-value">{suspendedCount}</span><span className="kpi-label">Suspendus</span></article>
        </div>
      </section>
      <section className="dashboard-section">
        <IonButton expand="block" onClick={() => navigate('admin-tenants')}>Gerer les venues / tenants</IonButton>
      </section>
    </main>
  )
}

function AdminTenantsScreen({ navigate }: { navigate: (screen: Screen, id?: string) => void }) {
  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('admin-overview')} aria-label="Retour">← Retour</button>
        <h1>Tenants Layali</h1>
      </header>
      <div className="bookings-list">
        {mockAdminTenants.map((tenant) => (
          <article key={tenant.id} className="booking-card">
            <div className="booking-header">
              <strong>{tenant.name}</strong>
              <span className={`status status--${tenant.status.toLowerCase()}`}>{tenant.status}</span>
            </div>
            <p>{tenant.city} · {tenant.slug}</p>
            <button type="button" className="action-link" onClick={() => navigate('admin-tenant-detail', tenant.id)}>Voir detail</button>
          </article>
        ))}
      </div>
    </main>
  )
}

function AdminTenantDetailScreen({
  tenantId,
  navigate,
}: {
  tenantId?: string
  navigate: (screen: Screen, id?: string) => void
}) {
  const tenant = mockAdminTenants.find((t) => t.id === tenantId) ?? mockAdminTenants[0]

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('admin-tenants')} aria-label="Retour">← Retour</button>
        <h1>{tenant.name}</h1>
      </header>
      <section className="detail-section">
        <p><strong>Statut:</strong> {tenant.status}</p>
        <p><strong>Ville:</strong> {tenant.city}</p>
        <p><strong>Slug:</strong> {tenant.slug}</p>
        <div className="action-buttons">
          <button type="button">Approuver (mock)</button>
          <button type="button">Suspendre (mock)</button>
          <button type="button">Reactiver (mock)</button>
        </div>
      </section>
    </main>
  )
}

export default App
