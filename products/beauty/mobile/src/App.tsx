import { useMemo, useState } from 'react'
import { IonApp, IonButton, IonChip, IonContent, IonPage, IonSearchbar } from '@ionic/react'
import {
  allSalons,
  commitBookingToHistory,
  mockAdminTenants,
  mockCustomerBookings,
  mockCustomerProfile,
  mockLoyaltyHistory,
  mockManagerBookings,
  MOCK_OTP,
  type Booking,
  type CustomerProfile,
  type Salon,
} from './prototypeData'
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
} from './ManagerScreens'
import './App.css'

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

export type Screen =
  | 'entry'
  | 'home'
  | 'salon-search'
  | 'salon-detail'
  | 'service-list'
  | 'booking-select-time'
  | 'booking-payment'
  | 'booking-confirm'
  | 'bookings-list'
  | 'booking-detail'
  | 'login'
  | 'register'
  | 'customer-profile'
  | 'customer-loyalty'
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
  | 'admin-overview'
  | 'admin-tenants'
  | 'admin-tenant-detail'

interface AppState {
  currentScreen: Screen
  selectedSalonId?: string
  selectedBookingId?: string
  selectedServiceId?: string
  selectedAdminTenantId?: string
  userType?: 'customer' | 'manager'
  managerSession?: ManagerSession
  customerProfile?: CustomerProfile
  bookingDraft?: BookingDraft
  authReturnScreen?: Screen
  confirmedBookingRef?: string
}

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    currentScreen: 'entry',
  })

  // Navigation functions
  const navigate = (screen: Screen, state?: Partial<AppState>) => {
    setAppState((prev) => ({
      ...prev,
      currentScreen: screen,
      ...state,
    }))
  }

  // Customer functions
  const startCustomerFlow = () => {
    navigate('home', { userType: 'customer' })
  }

  const loginCustomer = (profile: CustomerProfile = mockCustomerProfile) => {
    const returnScreen = appState.authReturnScreen ?? 'home'
    const draft = appState.bookingDraft

    if (returnScreen === 'booking-confirm' && draft) {
      const booking = commitBookingToHistory(draft, profile)
      navigate('booking-confirm', {
        customerProfile: profile,
        authReturnScreen: undefined,
        confirmedBookingRef: booking.bookingRef,
        userType: 'customer',
      })
      return
    }

    navigate(returnScreen, {
      customerProfile: profile,
      authReturnScreen: undefined,
      userType: 'customer',
    })
  }

  const registerCustomer = (profile: CustomerProfile) => {
    loginCustomer(profile)
  }

  const proceedBooking = () => {
    const draft = appState.bookingDraft
    if (!draft?.time) return

    if (!appState.customerProfile) {
      navigate('login', {
        authReturnScreen: draft.paymentMethod === 'online' ? 'booking-payment' : 'booking-confirm',
      })
      return
    }

    if (draft.paymentMethod === 'online') {
      navigate('booking-payment')
      return
    }

    finalizeBooking()
  }

  const finalizeBooking = () => {
    const draft = appState.bookingDraft
    const profile = appState.customerProfile ?? mockCustomerProfile
    if (!draft) return

    const booking = commitBookingToHistory(draft, profile)
    navigate('booking-confirm', { confirmedBookingRef: booking.bookingRef })
  }

  const selectSalon = (salonId: string) => {
    navigate('salon-detail', { selectedSalonId: salonId })
  }

  const startBooking = (salonId: string, serviceId: string) => {
    navigate('booking-select-time', {
      selectedSalonId: salonId,
      selectedServiceId: serviceId,
      bookingDraft: {
        salonId,
        serviceId,
        date: new Date().toISOString().split('T')[0],
        time: '',
        paymentMethod: 'cash',
      },
    })
  }

  const confirmBooking = () => {
    proceedBooking()
  }

  const completeOnlinePayment = () => {
    finalizeBooking()
  }

  const viewBookingHistory = () => {
    navigate('bookings-list')
  }

  const viewBookingDetail = (bookingId: string) => {
    navigate('booking-detail', { selectedBookingId: bookingId })
  }

  // Manager functions
  const startManagerLogin = () => {
    navigate('manager-login')
  }

  const managerLogin = (email: string, password: string) => {
    void password
    // Mock login - accept any email/password
    const session: ManagerSession = {
      userId: 'mgr-001',
      email,
      name: 'Fatima Bennani',
      role: 'OWNER',
      salonId: 'salon-01',
      salonName: 'Silhouette Beauty',
    }
    navigate('manager-dashboard', {
      userType: 'manager',
      managerSession: session,
    })
  }

  const viewManagerBookings = () => {
    navigate('manager-bookings-list')
  }

  const viewManagerBookingDetail = (bookingId: string) => {
    navigate('manager-booking-detail', { selectedBookingId: bookingId })
  }

  const viewManagerStaff = () => {
    navigate('manager-staff')
  }

  const viewManagerServices = () => {
    navigate('manager-services')
  }

  const viewManagerReviews = () => {
    navigate('manager-reviews')
  }

  const viewManagerAgenda = () => navigate('manager-agenda')
  const viewManagerCustomers = () => navigate('manager-customers')
  const viewManagerLoyalty = () => navigate('manager-loyalty')
  const viewManagerSettings = () => navigate('manager-settings')

  const logout = () => {
    navigate('entry', {
      userType: undefined,
      managerSession: undefined,
      customerProfile: undefined,
    })
  }

  // Screen rendering
  const renderScreen = () => {
    const currentSalon = appState.selectedSalonId
      ? (allSalons.find((s) => s.id === appState.selectedSalonId) ?? null)
      : null

    const currentBooking = appState.selectedBookingId
      ? mockCustomerBookings.find((b) => b.id === appState.selectedBookingId) ||
        mockManagerBookings.find((b) => b.id === appState.selectedBookingId)
      : null

    switch (appState.currentScreen) {
      case 'entry':
        return (
          <EntryScreen
            onCustomerClick={startCustomerFlow}
            onManagerClick={startManagerLogin}
            onAdminClick={() => navigate('admin-overview')}
          />
        )

      case 'home':
        return (
          <HomeScreen
            salons={allSalons}
            onSalonSelect={selectSalon}
            onQuickBook={startBooking}
            onViewBookings={viewBookingHistory}
            onViewProfile={() => navigate('customer-profile')}
            onViewSearch={() => navigate('salon-search')}
            onLogin={() => navigate('login')}
            profile={appState.customerProfile}
          />
        )

      case 'salon-search':
        return (
          <SalonSearchScreen
            salons={allSalons}
            onSalonSelect={selectSalon}
            onBack={() => navigate('home')}
          />
        )

      case 'salon-detail':
        return currentSalon ? (
          <SalonDetailScreen
            salon={currentSalon}
            onBookService={startBooking}
            onViewAllServices={() => navigate('service-list', { selectedSalonId: currentSalon.id })}
            onBack={() => navigate('home')}
          />
        ) : null

      case 'service-list':
        return currentSalon ? (
          <ServiceListScreen
            salon={currentSalon}
            onBookService={startBooking}
            onBack={() => navigate('salon-detail', { selectedSalonId: currentSalon.id })}
          />
        ) : null

      case 'booking-select-time':
        return (
          <BookingSelectTimeScreen
            salon={currentSalon}
            serviceId={appState.selectedServiceId!}
            onConfirm={confirmBooking}
            onBack={() => navigate('salon-detail')}
            draft={appState.bookingDraft}
            onDraftUpdate={(draft) => navigate(appState.currentScreen, { bookingDraft: draft })}
          />
        )

      case 'booking-payment':
        return (
          <BookingPaymentScreen
            salon={currentSalon}
            draft={appState.bookingDraft}
            onPay={completeOnlinePayment}
            onBack={() => navigate('booking-select-time')}
          />
        )

      case 'booking-confirm':
        return (
          <BookingConfirmScreen
            salon={currentSalon}
            booking={appState.bookingDraft}
            bookingRef={appState.confirmedBookingRef}
            onViewBookings={() => navigate('bookings-list')}
            onFinish={() => navigate('home')}
          />
        )

      case 'login':
        return (
          <LoginScreen
            onBack={() => navigate(appState.authReturnScreen ? 'booking-select-time' : 'entry')}
            onLogin={loginCustomer}
            onRegister={() => navigate('register', { authReturnScreen: appState.authReturnScreen })}
          />
        )

      case 'register':
        return (
          <RegisterScreen
            onBack={() => navigate('login')}
            onRegister={registerCustomer}
          />
        )

      case 'customer-loyalty':
        return (
          <CustomerLoyaltyScreen
            profile={appState.customerProfile}
            onBack={() => navigate('customer-profile')}
          />
        )

      case 'bookings-list':
        return (
          <BookingsListScreen
            bookings={mockCustomerBookings}
            onBookingSelect={viewBookingDetail}
            onBack={() => navigate('home')}
          />
        )

      case 'booking-detail':
        return currentBooking ? (
          <BookingDetailScreen booking={currentBooking} onBack={() => navigate('bookings-list')} />
        ) : null

      case 'customer-profile':
        return (
          <CustomerProfileScreen
            profile={appState.customerProfile}
            onBack={() => navigate('home')}
            onViewBookings={viewBookingHistory}
            onViewLoyalty={() => navigate('customer-loyalty')}
            onLogin={() => navigate('login')}
          />
        )

      case 'manager-login':
        return <ManagerLoginScreen onLogin={managerLogin} onBack={() => navigate('entry')} />

      case 'manager-dashboard':
        return (
          <ManagerDashboardScreen
            session={appState.managerSession}
            onViewBookings={viewManagerBookings}
            onViewAgenda={viewManagerAgenda}
            onViewStaff={viewManagerStaff}
            onViewServices={viewManagerServices}
            onViewCustomers={viewManagerCustomers}
            onViewLoyalty={viewManagerLoyalty}
            onViewReviews={viewManagerReviews}
            onViewSettings={viewManagerSettings}
            onLogout={logout}
          />
        )

      case 'manager-bookings-list':
        return (
          <ManagerBookingsListScreen
            bookings={mockManagerBookings}
            onBookingSelect={viewManagerBookingDetail}
            onBack={() => navigate('manager-dashboard')}
          />
        )

      case 'manager-booking-detail':
        return currentBooking ? (
          <ManagerBookingDetailScreen
            booking={currentBooking}
            onBack={() => navigate('manager-bookings-list')}
          />
        ) : null

      case 'manager-staff':
        return (
          <ManagerStaffScreen
            salon={allSalons.find((s) => s.id === appState.managerSession?.salonId) || allSalons[0]}
            onBack={() => navigate('manager-dashboard')}
          />
        )

      case 'manager-services':
        return (
          <ManagerServicesScreen
            salon={allSalons.find((s) => s.id === appState.managerSession?.salonId) || allSalons[0]}
            onBack={() => navigate('manager-dashboard')}
          />
        )

      case 'manager-reviews':
        return (
          <ManagerReviewsScreen
            salonId={appState.managerSession?.salonId || 'salon-01'}
            onBack={() => navigate('manager-dashboard')}
          />
        )

      case 'manager-agenda':
        return <ManagerAgendaScreen onBack={() => navigate('manager-dashboard')} />

      case 'manager-customers':
        return <ManagerCustomersScreen onBack={() => navigate('manager-dashboard')} />

      case 'manager-loyalty':
        return <ManagerLoyaltyScreen onBack={() => navigate('manager-dashboard')} />

      case 'manager-settings':
        return (
          <ManagerSettingsScreen
            session={appState.managerSession}
            onBack={() => navigate('manager-dashboard')}
          />
        )

      case 'admin-overview':
        return <AdminOverviewScreen onBack={() => navigate('entry')} onViewTenants={() => navigate('admin-tenants')} />

      case 'admin-tenants':
        return (
          <AdminTenantsScreen
            onBack={() => navigate('admin-overview')}
            onSelectTenant={(id) => navigate('admin-tenant-detail', { selectedAdminTenantId: id })}
          />
        )

      case 'admin-tenant-detail':
        return (
          <AdminTenantDetailScreen
            tenantId={appState.selectedAdminTenantId}
            onBack={() => navigate('admin-tenants')}
          />
        )

      default:
        return (
          <EntryScreen
            onCustomerClick={startCustomerFlow}
            onManagerClick={startManagerLogin}
            onAdminClick={() => navigate('admin-overview')}
          />
        )
    }
  }

  return (
    <IonApp>
      <IonPage>{renderScreen()}</IonPage>
    </IonApp>
  )
}

/* Entry Screen */
function EntryScreen({
  onCustomerClick,
  onManagerClick,
  onAdminClick,
}: {
  onCustomerClick: () => void
  onManagerClick: () => void
  onAdminClick: () => void
}) {
  return (
    <IonContent>
      <div className="entry-screen">
        <div
          style={{
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✨</div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>Beauty</h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.6 }}>Trouvez votre salon de beauté</p>
        </div>

        <IonButton expand="block" onClick={onCustomerClick} className="btn-primary">
          Je suis Client
        </IonButton>

        <IonButton expand="block" onClick={onManagerClick} fill="outline" className="btn-secondary">
          Je suis Propriétaire
        </IonButton>

        <IonButton expand="block" onClick={onAdminClick} fill="clear" style={{ marginTop: '8px' }}>
          Admin Nafura
        </IonButton>
      </div>
    </IonContent>
  )
}

/* Home Screen */
function HomeScreen({
  salons,
  onSalonSelect,
  onQuickBook,
  onViewBookings,
  onViewProfile,
  onViewSearch,
  onLogin,
  profile,
}: {
  salons: Salon[]
  onSalonSelect: (id: string) => void
  onQuickBook: (salonId: string, serviceId: string) => void
  onViewBookings: () => void
  onViewProfile: () => void
  onViewSearch: () => void
  onLogin: () => void
  profile?: CustomerProfile
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'ongles' | 'cire' | 'budget'>('all')

  const filteredSalons = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return salons.filter((salon) => {
      const matchesSearch =
        term.length === 0 ||
        salon.name.toLowerCase().includes(term) ||
        salon.city.toLowerCase().includes(term) ||
        salon.description.toLowerCase().includes(term) ||
        salon.services.some(
          (service) =>
            service.name.toLowerCase().includes(term) ||
            service.description.toLowerCase().includes(term),
        )

      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'today' && Boolean(salon.nextAvailable)) ||
        (activeFilter === 'ongles' && salon.categories.includes('ongles')) ||
        (activeFilter === 'cire' && salon.services.some((service) => /cire|épilation/i.test(service.name))) ||
        (activeFilter === 'budget' && (salon.startingPrice ?? 9999) <= 180)

      return matchesSearch && matchesFilter
    })
  }, [salons, searchTerm, activeFilter])

  const featuredSalons = filteredSalons.slice(0, 6)

  return (
    <IonContent>
      <div style={{ paddingBottom: '40px' }}>
        {/* Header */}
        <div
          className="home-hero"
        >
          <div className="home-hero-top">
            <div>
              <p className="home-hero-kicker">Bienvenue</p>
              <h2 className="home-hero-title">{profile?.name || 'Invité'}</h2>
            </div>
            <button type="button" className="home-profile-pill" onClick={profile ? onViewProfile : onLogin}>
              {profile ? '👤 Profil' : '🔐 Connexion'}
            </button>
          </div>

          <p className="home-hero-copy">
            Trouvez rapidement un salon, comparez les prix d’appel et réservez un créneau disponible.
          </p>

          {profile && <div className="home-loyalty-mini">{profile.loyaltyPoints} pts fidélité</div>}
        </div>

        <div style={{ padding: '14px 16px 0 16px' }}>
          <IonSearchbar
            value={searchTerm}
            onIonInput={(event) => setSearchTerm(event.detail.value ?? '')}
            placeholder="Salon, ville, service..."
            animated
            onIonFocus={onViewSearch}
          />

          <div className="home-filter-row">
            <IonChip className={activeFilter === 'all' ? 'chip-active' : ''} onClick={() => setActiveFilter('all')}>
              Tous
            </IonChip>
            <IonChip
              className={activeFilter === 'today' ? 'chip-active' : ''}
              onClick={() => setActiveFilter('today')}
            >
              Aujourd’hui
            </IonChip>
            <IonChip
              className={activeFilter === 'ongles' ? 'chip-active' : ''}
              onClick={() => setActiveFilter('ongles')}
            >
              Ongles
            </IonChip>
            <IonChip className={activeFilter === 'cire' ? 'chip-active' : ''} onClick={() => setActiveFilter('cire')}>
              Cire
            </IonChip>
            <IonChip
              className={activeFilter === 'budget' ? 'chip-active' : ''}
              onClick={() => setActiveFilter('budget')}
            >
              Petit prix
            </IonChip>
          </div>

          <div className="home-secondary-actions">
            <button type="button" className="home-secondary-action" onClick={onViewBookings}>
              📋 Réservations
            </button>
            <button type="button" className="home-secondary-action" onClick={onViewProfile}>
              👤 Mon profil
            </button>
          </div>
        </div>

        {/* Featured Salons */}
        <div style={{ padding: '0 16px' }}>
          <div className="home-list-header">
            <h3>Salons disponibles</h3>
            <button type="button" className="salon-link" onClick={onViewSearch}>
              Recherche avancée ({featuredSalons.length})
            </button>
          </div>

          {featuredSalons.map((salon) => (
            <div
              key={salon.id}
              className="salon-card"
            >
              <div className="salon-card-media" onClick={() => onSalonSelect(salon.id)}>
                <img src={salon.image} alt={salon.name} className="salon-image" />
                <span className="salon-badge">{salon.nextAvailable || 'Disponible'} </span>
              </div>

              <div className="salon-info">
                <div className="salon-name-row">
                  <div className="salon-name">{salon.name}</div>
                  <div className="salon-price">dès {salon.startingPrice ?? salon.services[0]?.price ?? 0} DH</div>
                </div>

                <div className="salon-rating">⭐ {salon.rating} • {salon.reviewCount} avis</div>

                <div className="salon-meta">
                  <span>📍 {salon.city}</span>
                  <span>•</span>
                  <span>≈ {salon.distanceKm ?? 1.5} km</span>
                </div>

                <div className="salon-tags">
                  {salon.services.slice(0, 2).map((service) => (
                    <span key={service.id} className="salon-tag">
                      {service.name}
                    </span>
                  ))}
                </div>

                <div className="salon-actions">
                  <button type="button" className="salon-link" onClick={() => onSalonSelect(salon.id)}>
                    Voir le salon
                  </button>
                  <button
                    type="button"
                    className="salon-book"
                    onClick={() => onQuickBook(salon.id, salon.services[0].id)}
                  >
                    Réserver
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </IonContent>
  )
}

/* Salon Detail Screen */
function SalonDetailScreen({
  salon,
  onBookService,
  onViewAllServices,
  onBack,
}: {
  salon: Salon
  onBookService: (salonId: string, serviceId: string) => void
  onViewAllServices: () => void
  onBack: () => void
}) {
  return (
    <IonContent>
      <img src={salon.image} alt={salon.name} className="salon-image" />

      <div style={{ padding: '16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <IonButton expand="block" fill="clear" onClick={onBack}>
            ← Retour
          </IonButton>
        </div>

        <h2 style={{ margin: '0 0 8px 0' }}>{salon.name}</h2>

        <div className="salon-rating">
          ⭐ {salon.rating} • {salon.reviewCount} avis • {salon.city}
        </div>

        <div style={{ marginBottom: '24px', fontSize: '14px' }}>
          <p style={{ margin: '8px 0' }}>📍 {salon.address}</p>
          <p style={{ margin: '8px 0' }}>📞 {salon.phone}</p>
        </div>

        <h3>Services disponibles</h3>
        <IonButton expand="block" fill="clear" onClick={onViewAllServices} style={{ marginBottom: '8px' }}>
          Voir tous les services ({salon.services.length})
        </IonButton>
        {salon.services.map((service) => (
          <div key={service.id} className="service-item">
            <div>
              <div className="service-name">{service.name}</div>
              <div style={{ fontSize: '12px', opacity: 0.6 }}>
                {service.duration} min • min réservation {service.minBookingMinutes} min
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="service-price">{service.price} DH</div>
              <IonButton
                size="small"
                onClick={() => onBookService(salon.id, service.id)}
                className="btn-primary"
              >
                Réserver
              </IonButton>
            </div>
          </div>
        ))}
      </div>
    </IonContent>
  )
}

/* Booking Select Time Screen */
function BookingSelectTimeScreen({
  salon,
  serviceId,
  onConfirm,
  onBack,
  draft,
  onDraftUpdate,
}: {
  salon: Salon | null
  serviceId: string
  onConfirm: () => void
  onBack: () => void
  draft?: BookingDraft
  onDraftUpdate: (draft: BookingDraft) => void
}) {
  const service = salon?.services.find((s) => s.id === serviceId)

  const timeSlots = [
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
    '18:00',
  ]

  return (
    <IonContent>
      <div style={{ padding: '16px' }}>
        <IonButton expand="block" fill="clear" onClick={onBack}>
          ← Retour
        </IonButton>

        <h2>Sélectionnez un créneau</h2>
        <p style={{ opacity: 0.6 }}>
          {salon?.name} - {service?.name}
        </p>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Date
          </label>
          <input
            type="date"
            value={draft?.date}
            onChange={(e) => {
              if (draft) {
                onDraftUpdate({ ...draft, date: e.target.value })
              }
            }}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid var(--ion-border-color)',
              borderRadius: '8px',
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Professionnel
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <div
              className={`time-slot ${!draft?.staffId ? 'selected' : 'available'}`}
              onClick={() => {
                if (draft) onDraftUpdate({ ...draft, staffId: undefined })
              }}
            >
              Indifférent
            </div>
            {salon?.staff.map((member) => (
              <div
                key={member.id}
                className={`time-slot ${draft?.staffId === member.id ? 'selected' : 'available'}`}
                onClick={() => {
                  if (draft) onDraftUpdate({ ...draft, staffId: member.id })
                }}
              >
                {member.name}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Mode de paiement
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <IonButton
              fill={draft?.paymentMethod === 'cash' ? 'solid' : 'outline'}
              onClick={() => draft && onDraftUpdate({ ...draft, paymentMethod: 'cash' })}
            >
              Au salon
            </IonButton>
            <IonButton
              fill={draft?.paymentMethod === 'online' ? 'solid' : 'outline'}
              onClick={() => draft && onDraftUpdate({ ...draft, paymentMethod: 'online' })}
            >
              En ligne
            </IonButton>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Horaire disponible
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {timeSlots.map((time) => (
              <div
                key={time}
                className={`time-slot ${draft?.time === time ? 'selected' : 'available'}`}
                onClick={() => {
                  if (draft) {
                    onDraftUpdate({ ...draft, time })
                  }
                }}
              >
                {time}
              </div>
            ))}
          </div>
        </div>

        <IonButton
          expand="block"
          onClick={onConfirm}
          disabled={!draft?.time}
          className="btn-primary"
        >
          Continuer
        </IonButton>
      </div>
    </IonContent>
  )
}

/* Booking Confirm Screen */
function BookingPaymentScreen({
  salon,
  draft,
  onPay,
  onBack,
}: {
  salon: Salon | null
  draft?: BookingDraft
  onPay: () => void
  onBack: () => void
}) {
  const service = salon?.services.find((s) => s.id === draft?.serviceId)
  const [processing, setProcessing] = useState(false)

  const handlePay = () => {
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      onPay()
    }, 800)
  }

  return (
    <IonContent>
      <div style={{ padding: '16px' }}>
        <IonButton expand="block" fill="clear" onClick={onBack}>
          ← Retour
        </IonButton>
        <h2>Paiement sécurisé</h2>
        <p style={{ opacity: 0.6 }}>{salon?.name} — {service?.name}</p>
        <div className="booking-confirm-section">
          <div className="booking-detail-row">
            <span className="booking-detail-label">Montant</span>
            <span className="booking-detail-value">{service?.price} DH</span>
          </div>
          <div className="booking-detail-row">
            <span className="booking-detail-label">Carte</span>
            <span className="booking-detail-value">•••• 4242 (mock 3DS)</span>
          </div>
        </div>
        <IonButton expand="block" onClick={handlePay} disabled={processing} className="btn-primary">
          {processing ? 'Traitement...' : 'Payer maintenant'}
        </IonButton>
      </div>
    </IonContent>
  )
}

function BookingConfirmScreen({
  salon,
  booking,
  bookingRef,
  onViewBookings,
  onFinish,
}: {
  salon: Salon | null
  booking?: BookingDraft
  bookingRef?: string
  onViewBookings: () => void
  onFinish: () => void
}) {
  const service = salon?.services.find((s) => s.id === booking?.serviceId)
  const staff = booking?.staffId ? salon?.staff.find((s) => s.id === booking.staffId) : undefined

  return (
    <IonContent>
      <div style={{ padding: '16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <h2 style={{ margin: 0 }}>Réservation confirmée!</h2>
          <p style={{ opacity: 0.6 }}>Référence: {bookingRef ?? 'BK-0000'}</p>
        </div>

        <div className="booking-confirm-section">
          <div className="booking-detail-row">
            <span className="booking-detail-label">Salon</span>
            <span className="booking-detail-value">{salon?.name}</span>
          </div>
          <div className="booking-detail-row">
            <span className="booking-detail-label">Service</span>
            <span className="booking-detail-value">{service?.name}</span>
          </div>
          {staff && (
            <div className="booking-detail-row">
              <span className="booking-detail-label">Professionnel</span>
              <span className="booking-detail-value">{staff.name}</span>
            </div>
          )}
          <div className="booking-detail-row">
            <span className="booking-detail-label">Date</span>
            <span className="booking-detail-value">{booking?.date}</span>
          </div>
          <div className="booking-detail-row">
            <span className="booking-detail-label">Heure</span>
            <span className="booking-detail-value">{booking?.time}</span>
          </div>
          <div className="booking-detail-row">
            <span className="booking-detail-label">Prix</span>
            <span className="booking-detail-value">{service?.price} DH</span>
          </div>
          <div className="booking-detail-row">
            <span className="booking-detail-label">Paiement</span>
            <span className="booking-detail-value">
              {booking?.paymentMethod === 'online' ? 'En ligne' : 'Au salon'}
            </span>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', opacity: 0.6, marginBottom: '24px' }}>
          Vous recevrez un SMS de confirmation
        </p>

        <IonButton expand="block" onClick={onViewBookings} className="btn-primary">
          Mes réservations
        </IonButton>
        <IonButton expand="block" fill="outline" onClick={onFinish}>
          Retour à l&apos;accueil
        </IonButton>
      </div>
    </IonContent>
  )
}

/* Bookings List Screen */
function BookingsListScreen({
  bookings,
  onBookingSelect,
  onBack,
}: {
  bookings: Booking[]
  onBookingSelect: (id: string) => void
  onBack: () => void
}) {
  return (
    <IonContent>
      <div style={{ padding: '16px' }}>
        <IonButton expand="block" fill="clear" onClick={onBack}>
          ← Retour
        </IonButton>

        <h2>Mes réservations</h2>

        {bookings.map((booking) => (
          <div
            key={booking.id}
            onClick={() => onBookingSelect(booking.id)}
            style={{
              padding: '16px',
              border: '1px solid var(--ion-border-color)',
              borderRadius: '8px',
              marginBottom: '12px',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h4 style={{ margin: 0 }}>{booking.salonName}</h4>
              <span style={{ fontSize: '12px', opacity: 0.6 }}>
                {booking.status === 'confirmed' ? '✅ Confirmée' : booking.status}
              </span>
            </div>
            <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>{booking.serviceName}</p>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.6 }}>
              {booking.date} à {booking.time}
            </p>
          </div>
        ))}
      </div>
    </IonContent>
  )
}

/* Booking Detail Screen */
function BookingDetailScreen({ booking, onBack }: { booking: Booking; onBack: () => void }) {
  return (
    <IonContent>
      <div style={{ padding: '16px' }}>
        <IonButton expand="block" fill="clear" onClick={onBack}>
          ← Retour
        </IonButton>

        <h2>{booking.salonName}</h2>

        <div className="booking-confirm-section">
          <div className="booking-detail-row">
            <span className="booking-detail-label">Numéro</span>
            <span className="booking-detail-value">{booking.bookingRef}</span>
          </div>
          <div className="booking-detail-row">
            <span className="booking-detail-label">Service</span>
            <span className="booking-detail-value">{booking.serviceName}</span>
          </div>
          {booking.staffName && (
            <div className="booking-detail-row">
              <span className="booking-detail-label">Coiffeur</span>
              <span className="booking-detail-value">{booking.staffName}</span>
            </div>
          )}
          <div className="booking-detail-row">
            <span className="booking-detail-label">Date</span>
            <span className="booking-detail-value">{booking.date}</span>
          </div>
          <div className="booking-detail-row">
            <span className="booking-detail-label">Heure</span>
            <span className="booking-detail-value">{booking.time}</span>
          </div>
          <div className="booking-detail-row">
            <span className="booking-detail-label">Durée</span>
            <span className="booking-detail-value">{booking.duration} min</span>
          </div>
          <div className="booking-detail-row">
            <span className="booking-detail-label">Prix total</span>
            <span className="booking-detail-value">{booking.totalPrice} DH</span>
          </div>
        </div>
      </div>
    </IonContent>
  )
}

/* Customer Profile Screen */
function CustomerProfileScreen({
  profile,
  onBack,
  onViewBookings,
  onViewLoyalty,
  onLogin,
}: {
  profile?: CustomerProfile
  onBack: () => void
  onViewBookings: () => void
  onViewLoyalty: () => void
  onLogin: () => void
}) {
  const profileOptions = [
    'Mes réservations',
    'Adresses enregistrées',
    'Moyens de paiement',
    'Notifications',
    'Préférences beauté',
    'Langue',
    'Aide et support',
  ]

  return (
    <IonContent>
      <div style={{ padding: '16px' }}>
        <IonButton expand="block" fill="clear" onClick={onBack}>
          ← Retour
        </IonButton>

        <h2>Mon Profil</h2>

        {!profile ? (
          <>
            <p style={{ opacity: 0.7 }}>Connectez-vous pour accéder à votre profil et vos réservations.</p>
            <IonButton expand="block" onClick={onLogin} className="btn-primary">
              Se connecter
            </IonButton>
          </>
        ) : (
          <>
        <div className="loyalty-badge" onClick={onViewLoyalty} style={{ cursor: 'pointer' }}>
          <div className="loyalty-points">{profile.loyaltyPoints}</div>
          <div className="loyalty-label">Points de fidélité — voir détail</div>
        </div>

        <div style={{ background: 'var(--ion-color-step-100)', padding: '16px', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', opacity: 0.6 }}>Nom</p>
          <p style={{ margin: '0 0 16px 0', fontWeight: '500' }}>{profile.name}</p>

          <p style={{ margin: '0 0 8px 0', fontSize: '12px', opacity: 0.6 }}>Email</p>
          <p style={{ margin: '0 0 16px 0', fontWeight: '500' }}>{profile.email}</p>

          <p style={{ margin: '0 0 8px 0', fontSize: '12px', opacity: 0.6 }}>Téléphone</p>
          <p style={{ margin: 0, fontWeight: '500' }}>{profile.phone}</p>
        </div>

        <div style={{ marginTop: '16px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Options du compte</h3>
          {profileOptions.map((option) => (
            <div
              key={option}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                border: '1px solid var(--ion-border-color)',
                borderRadius: '8px',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '14px' }}>{option}</span>
              <span style={{ opacity: 0.5 }}>›</span>
            </div>
          ))}
        </div>

        <IonButton expand="block" fill="outline" onClick={onViewBookings} style={{ marginTop: '16px' }}>
          Voir mes réservations
        </IonButton>
          </>
        )}
      </div>
    </IonContent>
  )
}

function SalonSearchScreen({
  salons,
  onSalonSelect,
  onBack,
}: {
  salons: Salon[]
  onSalonSelect: (id: string) => void
  onBack: () => void
}) {
  const [searchTerm, setSearchTerm] = useState('')

  const results = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return salons
    return salons.filter(
      (salon) =>
        salon.name.toLowerCase().includes(term) ||
        salon.city.toLowerCase().includes(term) ||
        salon.services.some((s) => s.name.toLowerCase().includes(term)),
    )
  }, [salons, searchTerm])

  return (
    <IonContent>
      <div style={{ padding: '16px' }}>
        <IonButton expand="block" fill="clear" onClick={onBack}>
          ← Retour
        </IonButton>
        <h2>Rechercher un salon</h2>
        <IonSearchbar
          value={searchTerm}
          onIonInput={(e) => setSearchTerm(e.detail.value ?? '')}
          placeholder="Ville, service, nom..."
          animated
        />
        {results.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.6, marginTop: '24px' }}>
            Aucun salon ne correspond à votre recherche.
          </p>
        ) : (
          results.map((salon) => (
            <div
              key={salon.id}
              onClick={() => onSalonSelect(salon.id)}
              style={{
                padding: '14px',
                border: '1px solid var(--ion-border-color)',
                borderRadius: '8px',
                marginBottom: '10px',
                cursor: 'pointer',
              }}
            >
              <strong>{salon.name}</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.7 }}>
                {salon.city} · ⭐ {salon.rating}
              </p>
            </div>
          ))
        )}
      </div>
    </IonContent>
  )
}

function ServiceListScreen({
  salon,
  onBookService,
  onBack,
}: {
  salon: Salon
  onBookService: (salonId: string, serviceId: string) => void
  onBack: () => void
}) {
  return (
    <IonContent>
      <div style={{ padding: '16px' }}>
        <IonButton expand="block" fill="clear" onClick={onBack}>
          ← Retour au salon
        </IonButton>
        <h2>Services — {salon.name}</h2>
        {salon.services.map((service) => (
          <div key={service.id} className="service-item">
            <div>
              <div className="service-name">{service.name}</div>
              <div style={{ fontSize: '12px', opacity: 0.6 }}>{service.duration} min</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="service-price">{service.price} DH</div>
              <IonButton size="small" onClick={() => onBookService(salon.id, service.id)} className="btn-primary">
                Réserver
              </IonButton>
            </div>
          </div>
        ))}
      </div>
    </IonContent>
  )
}

function LoginScreen({
  onBack,
  onLogin,
  onRegister,
}: {
  onBack: () => void
  onLogin: (profile?: CustomerProfile) => void
  onRegister: () => void
}) {
  const [phone, setPhone] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [error, setError] = useState('')

  const verify = () => {
    if (otpCode !== MOCK_OTP) {
      setError(`Code invalide. Utilisez ${MOCK_OTP} en démo.`)
      return
    }
    onLogin({ ...mockCustomerProfile, phone: phone || mockCustomerProfile.phone })
  }

  return (
    <IonContent>
      <div style={{ padding: '16px' }}>
        <IonButton expand="block" fill="clear" onClick={onBack}>
          ← Retour
        </IonButton>
        <h2>Connexion</h2>
        {!otpSent ? (
          <>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+212 6 12 34 56 78"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--ion-border-color)' }}
            />
            <IonButton expand="block" onClick={() => setOtpSent(true)} style={{ marginTop: '12px' }}>
              Recevoir un code
            </IonButton>
          </>
        ) : (
          <>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--ion-border-color)' }}
            />
            {error && <p style={{ color: 'var(--ion-color-danger)', fontSize: '13px' }}>{error}</p>}
            <IonButton expand="block" onClick={verify} disabled={otpCode.length !== 6} style={{ marginTop: '12px' }}>
              Vérifier
            </IonButton>
          </>
        )}
        <IonButton expand="block" fill="outline" onClick={onRegister} style={{ marginTop: '8px' }}>
          Créer un compte
        </IonButton>
      </div>
    </IonContent>
  )
}

function RegisterScreen({
  onBack,
  onRegister,
}: {
  onBack: () => void
  onRegister: (profile: CustomerProfile) => void
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')

  const submit = () => {
    if (otpCode !== MOCK_OTP) return
    onRegister({
      id: `customer-${Date.now()}`,
      name: `${firstName} ${lastName}`.trim() || 'Nouveau client',
      email: email || 'nouveau@email.com',
      phone: phone || '+212 6 00 00 00 00',
      loyaltyPoints: 100,
      favoriteServices: ['coiffure'],
      bookingHistory: [],
      reviews: [],
    })
  }

  return (
    <IonContent>
      <div style={{ padding: '16px' }}>
        <IonButton expand="block" fill="clear" onClick={onBack}>
          ← Retour
        </IonButton>
        <h2>Créer un compte</h2>
        {!otpSent ? (
          <>
            <input placeholder="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '8px', border: '1px solid var(--ion-border-color)' }} />
            <input placeholder="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '8px', border: '1px solid var(--ion-border-color)' }} />
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '8px', border: '1px solid var(--ion-border-color)' }} />
            <input placeholder="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '8px', border: '1px solid var(--ion-border-color)' }} />
            <IonButton expand="block" onClick={() => setOtpSent(true)}>Recevoir OTP</IonButton>
          </>
        ) : (
          <>
            <input placeholder={MOCK_OTP} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--ion-border-color)' }} />
            <IonButton expand="block" onClick={submit} style={{ marginTop: '12px' }}>Valider ({MOCK_OTP})</IonButton>
          </>
        )}
      </div>
    </IonContent>
  )
}

function CustomerLoyaltyScreen({
  profile,
  onBack,
}: {
  profile?: CustomerProfile
  onBack: () => void
}) {
  return (
    <IonContent>
      <div style={{ padding: '16px' }}>
        <IonButton expand="block" fill="clear" onClick={onBack}>
          ← Retour
        </IonButton>
        <h2>Ma fidélité</h2>
        <div className="loyalty-badge">
          <div className="loyalty-points">{profile?.loyaltyPoints ?? 0}</div>
          <div className="loyalty-label">Points disponibles</div>
        </div>
        <h3 style={{ fontSize: '16px' }}>Historique</h3>
        {mockLoyaltyHistory.map((tx) => (
          <div key={tx.id} style={{ padding: '12px', border: '1px solid var(--ion-border-color)', borderRadius: '8px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{tx.label}</span>
              <strong>{tx.points > 0 ? '+' : ''}{tx.points} pts</strong>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.6 }}>{tx.date}</p>
          </div>
        ))}
      </div>
    </IonContent>
  )
}

function AdminOverviewScreen({
  onBack,
  onViewTenants,
}: {
  onBack: () => void
  onViewTenants: () => void
}) {
  const active = mockAdminTenants.filter((t) => t.status === 'ACTIVE').length

  return (
    <IonContent>
      <div style={{ padding: '16px' }}>
        <IonButton expand="block" fill="clear" onClick={onBack}>← Retour</IonButton>
        <h2>Admin Nafura — Beauty</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: 'var(--ion-color-step-100)', padding: '16px', borderRadius: '8px' }}>
            <p style={{ margin: 0, opacity: 0.6, fontSize: '12px' }}>Tenants</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>{mockAdminTenants.length}</p>
          </div>
          <div style={{ background: 'var(--ion-color-step-100)', padding: '16px', borderRadius: '8px' }}>
            <p style={{ margin: 0, opacity: 0.6, fontSize: '12px' }}>Actifs</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>{active}</p>
          </div>
        </div>
        <IonButton expand="block" onClick={onViewTenants}>Gérer les salons</IonButton>
      </div>
    </IonContent>
  )
}

function AdminTenantsScreen({
  onBack,
  onSelectTenant,
}: {
  onBack: () => void
  onSelectTenant: (id: string) => void
}) {
  return (
    <IonContent>
      <div style={{ padding: '16px' }}>
        <IonButton expand="block" fill="clear" onClick={onBack}>← Retour</IonButton>
        <h2>Salons tenants</h2>
        {mockAdminTenants.map((tenant) => (
          <div key={tenant.id} style={{ padding: '14px', border: '1px solid var(--ion-border-color)', borderRadius: '8px', marginBottom: '10px' }}>
            <strong>{tenant.name}</strong>
            <p style={{ margin: '4px 0' }}>{tenant.city} · {tenant.status}</p>
            <button type="button" className="salon-link" onClick={() => onSelectTenant(tenant.id)}>Voir détail</button>
          </div>
        ))}
      </div>
    </IonContent>
  )
}

function AdminTenantDetailScreen({
  tenantId,
  onBack,
}: {
  tenantId?: string
  onBack: () => void
}) {
  const tenant = mockAdminTenants.find((t) => t.id === tenantId) ?? mockAdminTenants[0]

  return (
    <IonContent>
      <div style={{ padding: '16px' }}>
        <IonButton expand="block" fill="clear" onClick={onBack}>← Retour</IonButton>
        <h2>{tenant.name}</h2>
        <p><strong>Statut:</strong> {tenant.status}</p>
        <p><strong>Ville:</strong> {tenant.city}</p>
        <p><strong>Slug:</strong> {tenant.slug}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
          <button type="button" style={{ padding: '10px' }}>Approuver (mock)</button>
          <button type="button" style={{ padding: '10px' }}>Suspendre (mock)</button>
        </div>
      </div>
    </IonContent>
  )
}
