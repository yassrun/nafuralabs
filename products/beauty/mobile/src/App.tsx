import { useMemo, useState } from 'react'
import { IonApp, IonButton, IonChip, IonContent, IonPage, IonSearchbar } from '@ionic/react'
import {
  allSalons,
  mockCustomerBookings,
  mockManagerBookings,
  mockCustomerProfile,
  type Booking,
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
}

export type Screen =
  | 'entry'
  | 'home'
  | 'salon-search'
  | 'salon-detail'
  | 'booking-create'
  | 'booking-select-time'
  | 'booking-payment'
  | 'booking-confirm'
  | 'bookings-list'
  | 'booking-detail'
  | 'customer-profile'
  | 'salon-reviews'
  | 'login'
  | 'register'
  | 'manager-login'
  | 'manager-dashboard'
  | 'manager-bookings-list'
  | 'manager-booking-detail'
  | 'manager-staff'
  | 'manager-services'
  | 'manager-reviews'

interface AppState {
  currentScreen: Screen
  selectedSalonId?: string
  selectedBookingId?: string
  selectedServiceId?: string
  userType?: 'customer' | 'manager'
  managerSession?: ManagerSession
  customerProfile?: typeof mockCustomerProfile
  bookingDraft?: BookingDraft
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
    navigate('home', {
      userType: 'customer',
      customerProfile: mockCustomerProfile,
    })
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
      },
    })
  }

  const confirmBooking = () => {
    navigate('booking-confirm')
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
        return <EntryScreen onCustomerClick={startCustomerFlow} onManagerClick={startManagerLogin} />

      case 'home':
        return (
          <HomeScreen
            salons={allSalons}
            onSalonSelect={selectSalon}
            onQuickBook={startBooking}
            onViewBookings={viewBookingHistory}
            onViewProfile={() => navigate('customer-profile')}
            profile={appState.customerProfile}
          />
        )

      case 'salon-detail':
        return currentSalon ? (
          <SalonDetailScreen
            salon={currentSalon}
            onBookService={startBooking}
            onBack={() => navigate('home')}
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

      case 'booking-confirm':
        return (
          <BookingConfirmScreen
            salon={currentSalon}
            booking={appState.bookingDraft}
            onConfirm={() => navigate('home')}
            onCancel={() => navigate('home')}
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
          />
        )

      case 'manager-login':
        return <ManagerLoginScreen onLogin={managerLogin} onBack={() => navigate('entry')} />

      case 'manager-dashboard':
        return (
          <ManagerDashboardScreen
            session={appState.managerSession}
            onViewBookings={viewManagerBookings}
            onViewStaff={viewManagerStaff}
            onViewServices={viewManagerServices}
            onViewReviews={viewManagerReviews}
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

      default:
        return <EntryScreen onCustomerClick={startCustomerFlow} onManagerClick={startManagerLogin} />
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
}: {
  onCustomerClick: () => void
  onManagerClick: () => void
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
  profile,
}: {
  salons: Salon[]
  onSalonSelect: (id: string) => void
  onQuickBook: (salonId: string, serviceId: string) => void
  onViewBookings: () => void
  onViewProfile: () => void
  profile?: typeof mockCustomerProfile
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
              <h2 className="home-hero-title">{profile?.name || 'Client'}</h2>
            </div>
            <button type="button" className="home-profile-pill" onClick={onViewProfile}>
              👤 Profil
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
            <span>{featuredSalons.length} résultat(s)</span>
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
  onBack,
}: {
  salon: Salon
  onBookService: (salonId: string, serviceId: string) => void
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
          Confirmer la réservation
        </IonButton>
      </div>
    </IonContent>
  )
}

/* Booking Confirm Screen */
function BookingConfirmScreen({
  salon,
  booking,
  onConfirm,
  onCancel,
}: {
  salon: Salon | null
  booking?: BookingDraft
  onConfirm: () => void
  onCancel: () => void
}) {
  const service = salon?.services.find((s) => s.id === booking?.serviceId)

  return (
    <IonContent>
      <div style={{ padding: '16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <h2 style={{ margin: 0 }}>Réservation confirmée!</h2>
          <p style={{ opacity: 0.6 }}>Numéro: BEAUTY-001</p>
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
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', opacity: 0.6, marginBottom: '24px' }}>
          Vous recevrez un SMS de confirmation
        </p>

        <IonButton expand="block" onClick={onConfirm} className="btn-primary">
          Terminer
        </IonButton>
        <IonButton expand="block" fill="outline" onClick={onCancel}>
          Annuler
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
}: {
  profile?: typeof mockCustomerProfile
  onBack: () => void
  onViewBookings: () => void
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

        <div className="loyalty-badge">
          <div className="loyalty-points">{profile?.loyaltyPoints || 0}</div>
          <div className="loyalty-label">Points de fidélité</div>
        </div>

        <div style={{ background: 'var(--ion-color-step-100)', padding: '16px', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', opacity: 0.6 }}>Nom</p>
          <p style={{ margin: '0 0 16px 0', fontWeight: '500' }}>{profile?.name}</p>

          <p style={{ margin: '0 0 8px 0', fontSize: '12px', opacity: 0.6 }}>Email</p>
          <p style={{ margin: '0 0 16px 0', fontWeight: '500' }}>{profile?.email}</p>

          <p style={{ margin: '0 0 8px 0', fontSize: '12px', opacity: 0.6 }}>Téléphone</p>
          <p style={{ margin: 0, fontWeight: '500' }}>{profile?.phone}</p>
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
      </div>
    </IonContent>
  )
}
