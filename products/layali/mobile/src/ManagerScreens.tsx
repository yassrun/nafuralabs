import { useState } from 'react'
import { IonButton } from '@ionic/react'
import type { ManagerSession, Screen } from './App'
import {
  accessModeLabels,
  mockProTables,
  mockProEvents,
} from './prototypeData'
import type {
  AccessMode,
  ProTable,
  TableZone,
  TableStatus,
  ProManagedEvent,
  ProTicketCategory,
  PaymentTiming,
} from './prototypeData'

interface AccessRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  requestedRole: 'HOST' | 'ADMIN' | 'BAR_MANAGER'
  message: string
  createdAt: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

interface ProBooking {
  id: string
  reference: string
  customerName: string
  customerPhone: string
  occasion: string
  accessMode: string
  accessLabel: string
  date: string
  time: string
  groupSize: number
  status: 'CONFIRMED' | 'PENDING' | 'ARRIVED' | 'NO_SHOW' | 'CANCELLED'
  minSpend: number
  paidAmount: number
  arrivalDeadline?: string
  internalNote?: string
  arrivedAt?: string
}

const bookingStatusLabels: Record<ProBooking['status'], string> = {
  CONFIRMED: 'Confirmée',
  PENDING: 'En attente',
  ARRIVED: 'Arrivée',
  NO_SHOW: 'No-show',
  CANCELLED: 'Annulée',
}

const roleLabels: Record<ManagerSession['role'], string> = {
  OWNER: 'Propriétaire',
  ADMIN: 'Admin',
  HOST: 'Accueil',
  BAR_MANAGER: 'Responsable bar',
}

const accessRequestRoleLabels: Record<AccessRequest['requestedRole'], string> = {
  HOST: 'Accueil',
  ADMIN: 'Admin',
  BAR_MANAGER: 'Responsable bar',
}

// Mock data
const mockAccessRequests: AccessRequest[] = [
  {
    id: 'req-001',
    userId: 'usr-001',
    userName: 'Mohamed Ben',
    userEmail: 'med@example.ma',
    requestedRole: 'HOST',
    message: 'Je serai a la porte le vendredi et samedi',
    createdAt: '2026-06-15T10:30:00Z',
    status: 'PENDING',
  },
  {
    id: 'req-002',
    userId: 'usr-002',
    userName: 'Amira Sola',
    userEmail: 'amira@example.ma',
    requestedRole: 'BAR_MANAGER',
    message: 'Chef de bar experience 5 ans',
    createdAt: '2026-06-14T14:15:00Z',
    status: 'PENDING',
  },
]

const mockProBookings: ProBooking[] = [
  {
    id: 'book-001',
    reference: 'LAY-ABC123',
    customerName: 'Sara El-Fassi',
    customerPhone: '+212666111111',
    occasion: 'BIRTHDAY',
    accessMode: 'TABLE',
    accessLabel: 'Table VIP',
    date: '2026-06-15',
    time: '22:30',
    groupSize: 6,
    status: 'CONFIRMED',
    minSpend: 2000,
    paidAmount: 700,
  },
  {
    id: 'book-002',
    reference: 'LAY-DEF456',
    customerName: 'Youssef Zaki',
    customerPhone: '+212600222222',
    occasion: 'STANDARD',
    accessMode: 'GUEST_LIST',
    accessLabel: 'Guest list standard',
    date: '2026-06-15',
    time: '23:00',
    groupSize: 4,
    status: 'PENDING',
    minSpend: 0,
    paidAmount: 0,
  },
  {
    id: 'book-003',
    reference: 'LAY-GHI789',
    customerName: 'Hana Khalid',
    customerPhone: '+212611333333',
    occasion: 'STANDARD',
    accessMode: 'COUNTER',
    accessLabel: 'Comptoir lounge',
    date: '2026-06-15',
    time: '21:30',
    groupSize: 2,
    status: 'ARRIVED',
    minSpend: 500,
    paidAmount: 500,
  },
]

let proBookingsStore: ProBooking[] = [...mockProBookings]

function getProBookings() {
  return proBookingsStore
}

function markBookingArrived(reference: string) {
  const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  proBookingsStore = proBookingsStore.map((booking) =>
    booking.reference === reference
      ? {
          ...booking,
          status: 'ARRIVED',
          arrivedAt: nowTime,
        }
      : booking,
  )
}

function updateProBooking(reference: string, updates: Partial<ProBooking>) {
  proBookingsStore = proBookingsStore.map((booking) =>
    booking.reference === reference
      ? {
          ...booking,
          ...updates,
        }
      : booking,
  )
}

function inferRoleFromEmail(email: string): ManagerSession['role'] {
  const normalized = email.toLowerCase()
  if (normalized.includes('host')) return 'HOST'
  if (normalized.includes('bar')) return 'BAR_MANAGER'
  if (normalized.includes('admin')) return 'ADMIN'
  return 'OWNER'
}

export function ProLoginScreen({
  navigate,
  loginManager,
  initialAudience,
}: {
  navigate: (screen: Screen) => void
  loginManager: (session: ManagerSession) => void
  initialAudience?: 'customer' | 'manager'
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [audience, setAudience] = useState<'customer' | 'manager' | null>(initialAudience ?? null)

  const handleManagerLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!audience) return

    if (audience === 'customer') {
      navigate('login')
      return
    }

    const role = inferRoleFromEmail(email || 'owner@sky31.ma')

    // Mock login for manager
    const session: ManagerSession = {
      userId: 'owner-001',
      email: email || 'owner@sky31.ma',
      name: 'Youssef SKY',
      role,
      tenantId: 'sky31-casablanca',
      venueName: 'Sky 31',
    }
    loginManager(session)
  }

  if (!audience) {
    return (
      <main className="screen-container reveal-up">
        <header className="screen-header">
          <h1>Se connecter</h1>
        </header>
        <section className="audience-choice">
          <h2>Choisir votre profil</h2>
          <div className="audience-buttons">
            <button
              type="button"
              className="audience-btn audience-btn--customer"
              onClick={() => setAudience('customer')}
            >
              <span className="icon">👤</span>
              <span className="label">Je suis client</span>
              <span className="desc">Découvrir et réserver</span>
            </button>
            <button
              type="button"
              className="audience-btn audience-btn--manager"
              onClick={() => setAudience('manager')}
            >
              <span className="icon">👨‍💼</span>
              <span className="label">Je suis manager</span>
              <span className="desc">Gérer le venue</span>
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => setAudience(null)} aria-label="Retour">← Retour</button>
        <h1>{audience === 'customer' ? 'Connexion client' : 'Connexion manager'}</h1>
      </header>

      <form onSubmit={handleManagerLogin} className="login-form">
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={audience === 'customer' ? 'sara@example.ma' : 'owner@sky31.ma'}
          />
        </div>

        <div className="form-group">
          <label>Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <IonButton expand="block" type="submit">
          Se connecter
        </IonButton>
      </form>
    </main>
  )
}

export function ProDashboardScreen({
  session,
  navigate,
  logoutManager,
}: {
  session: ManagerSession
  navigate: (screen: Screen) => void
  logoutManager: () => void
}) {
  const todayBookings = getProBookings().filter(b => b.date === '2026-06-15')
  const arrivedCount = todayBookings.filter(b => b.status === 'ARRIVED').length
  const confirmedCount = todayBookings.filter(b => b.status === 'CONFIRMED').length
  const pendingRequests = mockAccessRequests.filter(r => r.status === 'PENDING')

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <div className="header-top">
          <h1>{session.venueName}</h1>
          <button type="button" onClick={logoutManager} className="logout-btn">Déconnexion</button>
        </div>
        <p className="role-badge">{roleLabels[session.role]}</p>
      </header>

      <section className="dashboard-kpis">
        <h2>Aujourd'hui</h2>
        <div className="kpi-grid">
          <article className="kpi-card">
            <span className="kpi-value">{arrivedCount}</span>
            <span className="kpi-label">Arrivés</span>
          </article>
          <article className="kpi-card">
            <span className="kpi-value">{confirmedCount}</span>
            <span className="kpi-label">Confirmés</span>
          </article>
          <article className="kpi-card">
            <span className="kpi-value">{todayBookings.length}</span>
            <span className="kpi-label">Total</span>
          </article>
          <article className="kpi-card">
            <span className="kpi-value">{pendingRequests.length}</span>
            <span className="kpi-label">Demandes équipe</span>
          </article>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-header">
          <h3>Réservations de ce soir</h3>
          <button type="button" onClick={() => navigate('pro-bookings-list')}>Voir tout</button>
        </div>
        <div className="bookings-list">
          {todayBookings.slice(0, 3).map(booking => (
            <article key={booking.id} className="booking-card">
              <div className="booking-header">
                <strong>{booking.customerName}</strong>
                <span className={`status status--${booking.status.toLowerCase()}`}>{bookingStatusLabels[booking.status]}</span>
              </div>
              <p className="booking-ref">{booking.reference}</p>
              <p className="booking-detail">{booking.time} · {booking.accessLabel} · {booking.groupSize} pers.</p>
            </article>
          ))}
        </div>
      </section>

      {pendingRequests.length > 0 && (
        <section className="dashboard-section">
          <div className="section-header">
            <h3>Demandes d'accès équipe</h3>
            <span className="badge">{pendingRequests.length}</span>
          </div>
          <button
            type="button"
            className="action-btn"
            onClick={() => navigate('pro-access-requests')}
          >
            Voir et approuver →
          </button>
        </section>
      )}

      <section className="dashboard-section">
        <h3>Actions rapides</h3>
        <div className="action-buttons">
          <button type="button" onClick={() => navigate('pro-door-checkin')}>
            <span>🚪</span>
            <span>Check-in à l'entrée</span>
          </button>
          <button type="button" onClick={() => navigate('pro-bookings-list')}>
            <span>📋</span>
            <span>Gérer les réservations</span>
          </button>
          <button type="button" onClick={() => navigate('pro-events-list')}>
            <span>🗓</span>
            <span>Mes soirées</span>
          </button>
          <button type="button" onClick={() => navigate('pro-tables')}>
            <span>🪑</span>
            <span>Plan de salle</span>
          </button>
          <button type="button" onClick={() => navigate('pro-access-requests')}>
            <span>👥</span>
            <span>Valider l'équipe</span>
          </button>
        </div>
      </section>
    </main>
  )
}

export function ProAccessRequestsScreen({
  navigate,
}: {
  session: ManagerSession
  navigate: (screen: Screen) => void
}) {
  const [requests, setRequests] = useState(mockAccessRequests)
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)

  const handleApprove = (requestId: string) => {
    setRequests(requests.map(r => 
      r.id === requestId ? { ...r, status: 'APPROVED' as const } : r
    ))
    setSelectedRequest(null)
  }

  const handleReject = (requestId: string) => {
    setRequests(requests.map(r => 
      r.id === requestId ? { ...r, status: 'REJECTED' as const } : r
    ))
    setSelectedRequest(null)
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING')
  const selectedData = requests.find(r => r.id === selectedRequest)

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('pro-dashboard')} aria-label="Retour">← Retour</button>
        <h1>Demandes d'accès équipe</h1>
        <span className="badge">{pendingRequests.length}</span>
      </header>

      {selectedData ? (
        <section className="request-detail">
          <button type="button" onClick={() => setSelectedRequest(null)} className="back-btn">← Retour à la liste</button>
          <div className="request-card-full">
            <h2>{selectedData.userName}</h2>
            <p className="email">{selectedData.userEmail}</p>
            <div className="request-info">
              <p><strong>Rôle demandé:</strong> {accessRequestRoleLabels[selectedData.requestedRole]}</p>
              <p><strong>Message:</strong> {selectedData.message}</p>
              <p><strong>Date de demande:</strong> {new Date(selectedData.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="action-buttons">
              <IonButton expand="block" onClick={() => handleApprove(selectedData.id)}>
                Approuver
              </IonButton>
              <button type="button" className="secondary-btn" onClick={() => handleReject(selectedData.id)}>
                Rejeter
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="requests-list">
          {requests.length === 0 ? (
            <p className="empty-state">Aucune demande pour le moment</p>
          ) : (
            <>
              {pendingRequests.length > 0 && (
                <div className="requests-group">
                  <h3>En attente ({pendingRequests.length})</h3>
                  {pendingRequests.map(request => (
                    <article key={request.id} className="request-card" onClick={() => setSelectedRequest(request.id)}>
                      <div className="request-header">
                        <strong>{request.userName}</strong>
                        <span className={`badge badge--${request.requestedRole.toLowerCase()}`}>{accessRequestRoleLabels[request.requestedRole]}</span>
                      </div>
                      <p className="email">{request.userEmail}</p>
                      <p className="message">{request.message}</p>
                    </article>
                  ))}
                </div>
              )}

              {requests.filter(r => r.status !== 'PENDING').length > 0 && (
                <div className="requests-group">
                  <h3>Traitées</h3>
                  {requests.filter(r => r.status !== 'PENDING').map(request => (
                    <article key={request.id} className={`request-card request-card--${request.status.toLowerCase()}`}>
                      <div className="request-header">
                        <strong>{request.userName}</strong>
                        <span className={`status status--${request.status.toLowerCase()}`}>{request.status === 'APPROVED' ? 'Approuvée' : 'Rejetée'}</span>
                      </div>
                      <p className="email">{request.userEmail}</p>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}
    </main>
  )
}

export function ProBookingsListScreen({
  initialBookingReference,
  navigate,
}: {
  session: ManagerSession
  initialBookingReference?: string
  navigate: (screen: Screen) => void
}) {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedReference, setSelectedReference] = useState<string | null>(initialBookingReference ?? null)
  const [editedTime, setEditedTime] = useState('')
  const [editedGroupSize, setEditedGroupSize] = useState(2)
  const [internalNote, setInternalNote] = useState('')
  const [, setVersion] = useState(0)
  const statuses = ['CONFIRMED', 'PENDING', 'ARRIVED', 'NO_SHOW', 'CANCELLED']
  const bookings = getProBookings()
  const selectedBooking = selectedReference
    ? bookings.find((booking) => booking.reference === selectedReference)
    : undefined

  const filteredBookings = bookings.filter((booking) => {
    const statusMatches = filterStatus === 'all' || booking.status === filterStatus
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return statusMatches

    const textMatches =
      booking.customerName.toLowerCase().includes(normalizedSearch) ||
      booking.customerPhone.toLowerCase().includes(normalizedSearch) ||
      booking.reference.toLowerCase().includes(normalizedSearch)

    return statusMatches && textMatches
  })

  const openDetail = (booking: ProBooking) => {
    setSelectedReference(booking.reference)
    setEditedTime(booking.time)
    setEditedGroupSize(booking.groupSize)
    setInternalNote(booking.internalNote ?? '')
  }

  const refreshBookings = () => {
    setVersion((value) => value + 1)
  }

  const saveDetailUpdates = () => {
    if (!selectedBooking) return
    updateProBooking(selectedBooking.reference, {
      time: editedTime,
      groupSize: Math.max(1, editedGroupSize),
      internalNote: internalNote.trim(),
    })
    refreshBookings()
  }

  const setBookingStatus = (status: ProBooking['status']) => {
    if (!selectedBooking) return
    if (status === 'ARRIVED') {
      markBookingArrived(selectedBooking.reference)
    } else {
      updateProBooking(selectedBooking.reference, { status })
    }
    refreshBookings()
  }

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => selectedBooking ? setSelectedReference(null) : navigate('pro-dashboard')} aria-label="Retour">← Retour</button>
        <h1>{selectedBooking ? 'Détail réservation' : 'Réservations'}</h1>
      </header>

      {selectedBooking ? (
        <section className="request-detail">
          <div className="request-card-full">
            <h2>{selectedBooking.customerName}</h2>
            <p className="email">{selectedBooking.customerPhone} · {selectedBooking.reference}</p>
            <div className="request-info">
              <p><strong>Mode:</strong> {accessModeLabels[selectedBooking.accessMode as AccessMode]} ({selectedBooking.accessLabel})</p>
              <p><strong>Date:</strong> {selectedBooking.date} à {selectedBooking.time}</p>
              <p><strong>Groupe:</strong> {selectedBooking.groupSize} pers.</p>
              <p><strong>Statut:</strong> {bookingStatusLabels[selectedBooking.status]}</p>
              <p><strong>Paiement:</strong> {selectedBooking.paidAmount} MAD payé {selectedBooking.minSpend > 0 ? `/ min ${selectedBooking.minSpend} MAD` : ''}</p>
              {selectedBooking.occasion === 'BIRTHDAY' && <p><strong>Occasion:</strong> Anniversaire</p>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Heure</label>
                <input type="time" value={editedTime} onChange={(event) => setEditedTime(event.target.value)} />
              </div>
              <div className="form-group">
                <label>Taille du groupe</label>
                <input type="number" min={1} max={20} value={editedGroupSize} onChange={(event) => setEditedGroupSize(Number(event.target.value) || 1)} />
              </div>
            </div>

            <div className="form-group">
              <label>Note interne</label>
              <textarea value={internalNote} onChange={(event) => setInternalNote(event.target.value)} placeholder="Ex: VIP arrival, table side stage" />
            </div>

            <div className="action-buttons">
              <button type="button" onClick={saveDetailUpdates}>
                <span>💾</span>
                <span>Enregistrer</span>
              </button>

              {selectedBooking.status === 'PENDING' && selectedBooking.accessMode === 'GUEST_LIST' && (
                <button type="button" onClick={() => setBookingStatus('CONFIRMED')}>
                  <span>✅</span>
                  <span>Approuver</span>
                </button>
              )}

              {selectedBooking.status === 'PENDING' && selectedBooking.accessMode === 'GUEST_LIST' && (
                <button type="button" onClick={() => setBookingStatus('CANCELLED')}>
                  <span>❌</span>
                  <span>Refuser</span>
                </button>
              )}

              {selectedBooking.status !== 'ARRIVED' && selectedBooking.status !== 'CANCELLED' && (
                <button type="button" onClick={() => setBookingStatus('ARRIVED')}>
                  <span>🚪</span>
                  <span>Marquer arrivé</span>
                </button>
              )}

              {selectedBooking.status !== 'NO_SHOW' && selectedBooking.status !== 'CANCELLED' && (
                <button type="button" onClick={() => setBookingStatus('NO_SHOW')}>
                  <span>⏱</span>
                  <span>Marquer no-show</span>
                </button>
              )}

              {selectedBooking.status !== 'CANCELLED' && (
                <button type="button" onClick={() => setBookingStatus('CANCELLED')}>
                  <span>🛑</span>
                  <span>Annuler</span>
                </button>
              )}
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="search-band" style={{ paddingBottom: '0' }}>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher par nom, téléphone ou référence"
            />
          </section>

          <section className="filter-chips">
            <button
              type="button"
              className={`filter-btn ${filterStatus === 'all' ? 'is-active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              Tout ({bookings.length})
            </button>
            {statuses.map((status) => {
              const count = bookings.filter((booking) => booking.status === status).length
              return (
                <button
                  key={status}
                  type="button"
                  className={`filter-btn ${filterStatus === status ? 'is-active' : ''}`}
                  onClick={() => setFilterStatus(status)}
                >
                  {bookingStatusLabels[status as ProBooking['status']]} ({count})
                </button>
              )
            })}
          </section>

          <section className="bookings-list">
            {filteredBookings.length === 0 ? (
              <p className="empty-state">Aucune réservation pour ce filtre</p>
            ) : (
              filteredBookings.map((booking) => (
                <article
                  key={booking.id}
                  className={`booking-card booking-card--${booking.status.toLowerCase()}`}
                  onClick={() => openDetail(booking)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="booking-header">
                    <div>
                      <strong>{booking.customerName}</strong>
                      <p className="phone">{booking.customerPhone}</p>
                    </div>
                    <span className={`status status--${booking.status.toLowerCase()}`}>{bookingStatusLabels[booking.status]}</span>
                  </div>
                  <p className="booking-ref">{booking.reference}</p>
                  <div className="booking-details">
                    <span>{booking.date} à {booking.time}</span>
                    <span>·</span>
                    <span>{booking.accessLabel}</span>
                    <span>·</span>
                    <span>{booking.groupSize} pers.</span>
                  </div>
                  <div className="booking-footer">
                    <span className="occasion">{booking.occasion === 'BIRTHDAY' ? 'Anniversaire' : booking.occasion}</span>
                    {booking.minSpend > 0 && (
                      <span className="min-spend">Min {booking.minSpend} MAD (payé {booking.paidAmount} MAD)</span>
                    )}
                  </div>
                </article>
              ))
            )}
          </section>
        </>
      )}
    </main>
  )
}

export function ProDoorCheckinScreen({
  navigate,
}: {
  session: ManagerSession
  navigate: (screen: Screen) => void
}) {
  const [lookup, setLookup] = useState('')
  const [qrInput, setQrInput] = useState('')
  const [scanState, setScanState] = useState<'idle' | 'accepted' | 'refused' | 'already-used' | 'not-found'>('idle')
  const [activeReference, setActiveReference] = useState<string | null>(null)
  const [networkMode, setNetworkMode] = useState<'online' | 'offline'>('online')
  const [offlineQueue, setOfflineQueue] = useState<string[]>([])
  const [, setVersion] = useState(0)

  const bookings = getProBookings()
  const arrivedCount = bookings.filter((booking) => booking.status === 'ARRIVED').length
  const expectedCount = bookings.filter((booking) => booking.status !== 'CANCELLED' && booking.status !== 'NO_SHOW').length
  const venueCapacity = 120
  const remainingCapacity = Math.max(0, venueCapacity - arrivedCount)

  const findBooking = (value: string) => {
    const normalized = value.trim().toLowerCase()
    if (!normalized) return undefined
    return bookings.find((booking) => {
      return (
        booking.reference.toLowerCase() === normalized ||
        booking.customerPhone.toLowerCase().includes(normalized) ||
        booking.customerName.toLowerCase().includes(normalized)
      )
    })
  }

  const evaluateScanState = (booking: ProBooking | undefined) => {
    if (!booking) return 'not-found' as const
    if (booking.status === 'ARRIVED') return 'already-used' as const
    if (booking.status === 'CANCELLED' || booking.status === 'NO_SHOW') return 'refused' as const
    return 'accepted' as const
  }

  const executeLookup = (value: string) => {
    const booking = findBooking(value)
    setActiveReference(booking?.reference ?? null)
    setScanState(evaluateScanState(booking))
  }

  const result = activeReference ? bookings.find((booking) => booking.reference === activeReference) ?? null : null

  const resetCheckin = () => {
    setScanState('idle')
    setActiveReference(null)
    setLookup('')
    setQrInput('')
  }

  const markArrived = () => {
    if (!result) return

    if (networkMode === 'offline') {
      setOfflineQueue((prev) => [...prev, result.reference])
    }

    markBookingArrived(result.reference)
    setVersion((value) => value + 1)
    setScanState('already-used')
  }

  return (
    <main className="screen-container reveal-up door-checkin-fullscreen">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('pro-dashboard')} aria-label="Retour">← Retour</button>
        <h1>Contrôle d'entrée</h1>
      </header>

      <section className="dashboard-kpis" style={{ paddingTop: '8px' }}>
        <div className="kpi-grid">
          <article className="kpi-card">
            <span className="kpi-value">{arrivedCount}</span>
            <span className="kpi-label">Entrés</span>
          </article>
          <article className="kpi-card">
            <span className="kpi-value">{expectedCount}</span>
            <span className="kpi-label">Attendus</span>
          </article>
          <article className="kpi-card">
            <span className="kpi-value">{remainingCapacity}</span>
            <span className="kpi-label">Capacité restante</span>
          </article>
          <article className="kpi-card">
            <span className="kpi-value">{offlineQueue.length}</span>
            <span className="kpi-label">Scans offline</span>
          </article>
        </div>
      </section>

      <section className="filter-chips" style={{ paddingTop: 0 }}>
        <button
          type="button"
          className={`filter-btn ${networkMode === 'online' ? 'is-active' : ''}`}
          onClick={() => setNetworkMode('online')}
        >
          Réseau en ligne
        </button>
        <button
          type="button"
          className={`filter-btn ${networkMode === 'offline' ? 'is-active' : ''}`}
          onClick={() => setNetworkMode('offline')}
        >
          Mode dégradé
        </button>
      </section>

      <section className="checkin-section">
        {scanState === 'idle' ? (
          <>
            <div className="qr-scanner">
              <p>Scanner caméra / QR</p>
              <input
                type="text"
                placeholder="Scannez ou collez la référence"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                onPaste={(e) => {
                  const text = e.clipboardData.getData('text/plain')
                  setQrInput(text)
                  executeLookup(text)
                }}
              />
              <button type="button" onClick={() => executeLookup(qrInput.trim())}>
                Vérifier le code
              </button>
            </div>

            <div className="divider">OU</div>

            <div className="phone-search">
              <p>Recherche fallback (nom, téléphone, référence)</p>
              <input
                type="text"
                placeholder="Ex: +2126..., Sara, LAY-ABC123"
                value={lookup}
                onChange={(e) => setLookup(e.target.value)}
              />
              <button type="button" onClick={() => executeLookup(lookup)}>Rechercher</button>
            </div>
          </>
        ) : (
          <>
            {result ? (
              <div className="checkin-result">
                <div className="success-badge">
                  {scanState === 'accepted' && '🟢'}
                  {scanState === 'refused' && '🔴'}
                  {scanState === 'already-used' && '🟠'}
                </div>
                <h2>{result.customerName}</h2>
                <p className="reference">{result.reference}</p>
                <div className="booking-info">
                  <p><strong>Accès:</strong> {result.accessLabel}</p>
                  <p><strong>Groupe:</strong> {result.groupSize} pers.</p>
                  <p><strong>Heure:</strong> {result.time}</p>
                  <p><strong>Statut:</strong> {bookingStatusLabels[result.status]}</p>
                  {result.arrivedAt && <p><strong>Déjà entré à:</strong> {result.arrivedAt}</p>}
                </div>
                <p aria-live="polite">
                  {scanState === 'accepted' && 'Accès valide. Vous pouvez enregistrer l\'arrivée.'}
                  {scanState === 'refused' && 'Accès refusé: réservation annulée ou no-show.'}
                  {scanState === 'already-used' && `Accès déjà utilisé ${result.arrivedAt ? `à ${result.arrivedAt}` : ''}.`}
                </p>
                <div className="action-buttons">
                  {scanState === 'accepted' && (
                    <IonButton expand="block" onClick={markArrived}>
                      Enregistrer l'arrivée
                    </IonButton>
                  )}
                  {scanState !== 'accepted' && (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => {
                        updateProBooking(result.reference, { status: 'CONFIRMED' })
                        setVersion((value) => value + 1)
                        setScanState('accepted')
                      }}
                    >
                      Exception manager
                    </button>
                  )}
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={resetCheckin}
                  >
                    Nouveau scan
                  </button>
                </div>
              </div>
            ) : (
              <div className="checkin-error">
                <p>Aucune réservation trouvée</p>
                <button type="button" onClick={resetCheckin}>Réessayer</button>
              </div>
            )}
          </>
        )}
      </section>

      {networkMode === 'offline' && offlineQueue.length > 0 && (
        <section className="dashboard-section">
          <h3>File locale à synchroniser</h3>
          <p>{offlineQueue.length} scans seront synchronisés quand le réseau reviendra.</p>
          <button type="button" className="action-btn" onClick={() => setOfflineQueue([])}>Marquer synchronisé</button>
        </section>
      )}
    </main>
  )
}

// ─── Pro Tables Screen ────────────────────────────────────────────────────────

const zoneLabels: Record<TableZone, string> = {
  MAIN: 'Salle principale',
  VIP: 'VIP',
  TERRACE: 'Terrasse',
  STAGE_FRONT: 'Devant scène',
}

const tableStatusLabels: Record<TableStatus, string> = {
  AVAILABLE: 'Libre',
  RESERVED: 'Réservée',
  OCCUPIED: 'Occupée',
  BLOCKED: 'Bloquée',
  ARCHIVED: 'Archivée',
}

export function ProTablesScreen({
  navigate,
}: {
  session: ManagerSession
  navigate: (screen: Screen) => void
}) {
  const [tables, setTables] = useState<ProTable[]>([...mockProTables])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTable, setNewTable] = useState<Omit<ProTable, 'id' | 'status'>>({
    label: '',
    zone: 'MAIN',
    seats: 4,
    minSpendMinor: 150000,
    depositMinor: 50000,
  })

  const handleAdd = () => {
    if (!newTable.label.trim()) return
    const added: ProTable = {
      id: `pt-${Date.now()}`,
      ...newTable,
      status: 'AVAILABLE',
    }
    setTables([...tables, added])
    setShowAddForm(false)
    setNewTable({ label: '', zone: 'MAIN', seats: 4, minSpendMinor: 150000, depositMinor: 50000 })
  }

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('pro-dashboard')} aria-label="Retour">← Retour</button>
        <h1>Plan de salle</h1>
        <button type="button" onClick={() => setShowAddForm(true)} className="header-cta">+ Table</button>
      </header>

      {showAddForm && (
        <section className="add-form-panel">
          <h2>Nouvelle table</h2>
          <div className="form-group">
            <label>Label</label>
            <input
              type="text"
              value={newTable.label}
              onChange={(e) => setNewTable({ ...newTable, label: e.target.value })}
              placeholder="ex: VIP-C, T3, Terrasse-2"
            />
          </div>
          <div className="form-group">
            <label>Zone</label>
            <select
              value={newTable.zone}
              onChange={(e) => setNewTable({ ...newTable, zone: e.target.value as TableZone })}
            >
              {(Object.keys(zoneLabels) as TableZone[]).map((z) => (
                <option key={z} value={z}>{zoneLabels[z]}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Couverts</label>
              <input
                type="number"
                min={2}
                max={30}
                value={newTable.seats}
                onChange={(e) => setNewTable({ ...newTable, seats: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Min conso (MAD)</label>
              <input
                type="number"
                min={0}
                step={100}
                value={Math.round(newTable.minSpendMinor / 100)}
                onChange={(e) => setNewTable({ ...newTable, minSpendMinor: Number(e.target.value) * 100 })}
              />
            </div>
            <div className="form-group">
              <label>Acompte (MAD)</label>
              <input
                type="number"
                min={0}
                step={50}
                value={Math.round(newTable.depositMinor / 100)}
                onChange={(e) => setNewTable({ ...newTable, depositMinor: Number(e.target.value) * 100 })}
              />
            </div>
          </div>
          <div className="action-buttons">
            <IonButton expand="block" onClick={handleAdd} disabled={!newTable.label.trim()}>
              Ajouter la table
            </IonButton>
            <button type="button" className="secondary-btn" onClick={() => setShowAddForm(false)}>Annuler</button>
          </div>
        </section>
      )}

      <section className="tables-list">
        {tables.map((table) => (
          <article key={table.id} className="table-card">
            <div className="table-header">
              <div className="table-label-row">
                <strong>{table.label}</strong>
                {table.zone === 'VIP' && <span className="vip-badge">VIP</span>}
              </div>
              <span className={`status status--${table.status.toLowerCase()}`}>
                {tableStatusLabels[table.status]}
              </span>
            </div>
            <div className="table-details">
              <span>📍 {zoneLabels[table.zone]}</span>
              <span>👥 {table.seats} couverts</span>
              <span>💰 Min {Math.round(table.minSpendMinor / 100)} MAD</span>
              {table.depositMinor > 0 && (
                <span>🔒 Acompte {Math.round(table.depositMinor / 100)} MAD</span>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

// ─── Pro Events List Screen ───────────────────────────────────────────────────

const proEventStatusLabels: Record<ProManagedEvent['status'], string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publiée',
  CLOSED: 'Fermée',
  CANCELLED: 'Annulée',
}

export function ProEventsListScreen({
  navigate,
}: {
  session: ManagerSession
  navigate: (screen: Screen, id?: string) => void
}) {
  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('pro-dashboard')} aria-label="Retour">← Retour</button>
        <h1>Soirées</h1>
        <button type="button" onClick={() => navigate('pro-event-edit', 'new')} className="header-cta">+ Créer</button>
      </header>

      <section className="events-list">
        {mockProEvents.map((event) => (
          <article
            key={event.id}
            className={`event-card event-card--${event.status.toLowerCase()}`}
            onClick={() => navigate('pro-event-edit', event.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="event-header">
              <span className="event-poster-large">{event.posterEmoji}</span>
              <div className="event-info">
                <strong>{event.title}</strong>
                {event.specialNight && <span className="special-badge">Soirée spéciale</span>}
                <p className="event-date">
                  📅 {new Date(event.startAt).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
                  {' '}à {new Date(event.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span className={`status status--${event.status.toLowerCase()}`}>
                {proEventStatusLabels[event.status]}
              </span>
            </div>
            <div className="event-modes">
              {event.accessModes.map((mode) => (
                <span key={mode} className="access-chip">{accessModeLabels[mode]}</span>
              ))}
              {event.ticketRequired && <span className="access-chip access-chip--alert">Billet requis</span>}
            </div>
            <div className="event-ticket-summary">
              {event.ticketCategories.map((cat) => (
                <span key={cat.code} className="ticket-cat-pill">
                  {cat.name} · {Math.round(cat.priceMinor / 100)} MAD
                  {cat.drinkIncluded ? ' · 🍸' : ''}
                  {cat.paymentTiming === 'ON_SITE' ? ' · Sur place' : ''}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

// ─── Pro Event Edit Screen ────────────────────────────────────────────────────

export function ProEventEditScreen({
  eventId,
  navigate,
}: {
  session: ManagerSession
  eventId?: string
  navigate: (screen: Screen, id?: string) => void
}) {
  const isNew = !eventId || eventId === 'new'
  const existing = isNew ? undefined : mockProEvents.find((e) => e.id === eventId)

  const [title, setTitle] = useState(existing?.title ?? '')
  const [startDate, setStartDate] = useState(existing ? existing.startAt.slice(0, 10) : '')
  const [startTime, setStartTime] = useState(existing ? existing.startAt.slice(11, 16) : '22:00')
  const [specialNight, setSpecialNight] = useState(existing?.specialNight ?? true)
  const [posterEmoji, setPosterEmoji] = useState(existing?.posterEmoji ?? '🎶')
  const [accessModes, setAccessModes] = useState<AccessMode[]>(existing?.accessModes ?? ['TICKET', 'TABLE'])
  const [ticketRequired, setTicketRequired] = useState(existing?.ticketRequired ?? false)
  const [categories, setCategories] = useState<ProTicketCategory[]>(
    existing?.ticketCategories ?? [
      { code: 'STD', name: 'Standard', priceMinor: 20000, quota: 200, remaining: 200, drinkIncluded: false, paymentTiming: 'ADVANCE' },
    ],
  )
  const [tablesDepositMinor, setTablesDepositMinor] = useState(existing?.tablesDepositMinor ?? 100000)
  const [tablesMinSpendMinor, setTablesMinSpendMinor] = useState(existing?.tablesMinSpendMinor ?? 200000)
  const [guestListEnabled, setGuestListEnabled] = useState(existing?.guestListEnabled ?? false)
  const [saved, setSaved] = useState(false)

  const toggleMode = (mode: AccessMode) => {
    setAccessModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode],
    )
  }

  const addCategory = () => {
    setCategories([
      ...categories,
      { code: 'STD', name: 'Nouvelle catégorie', priceMinor: 20000, quota: 100, remaining: 100, drinkIncluded: false, paymentTiming: 'ADVANCE' },
    ])
  }

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index))
  }

  const updateCategory = (index: number, updates: Partial<ProTicketCategory>) => {
    setCategories(categories.map((c, i) => (i === index ? { ...c, ...updates } : c)))
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const allEditableModes: AccessMode[] = ['TICKET', 'TABLE', 'GUEST_LIST', 'COUNTER']

  return (
    <main className="screen-container reveal-up">
      <header className="screen-header">
        <button type="button" onClick={() => navigate('pro-events-list')} aria-label="Retour">← Retour</button>
        <h1>{isNew ? 'Créer une soirée' : 'Éditer la soirée'}</h1>
      </header>

      {saved && <div className="toast-success">✓ Enregistré en brouillon</div>}

      <section className="edit-form">
        <h2>Identité</h2>
        <div className="form-group form-group--poster">
          <label>Affiche (emoji)</label>
          <div className="poster-row">
            <input
              type="text"
              value={posterEmoji}
              onChange={(e) => setPosterEmoji(e.target.value)}
              className="emoji-input"
              placeholder="🎶"
              maxLength={4}
            />
            <span className="poster-preview">{posterEmoji}</span>
          </div>
          <p className="input-hint">En V1 : emoji. En V1.1 : upload photo poster.</p>
        </div>
        <div className="form-group">
          <label>Titre de la soirée *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Soirée Saint-Valentin Rooftop"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Ouverture</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
        </div>
        <div className="form-group form-group--toggle">
          <label>Soirée spéciale (règles d'accès différentes)</label>
          <button
            type="button"
            className={`toggle-btn ${specialNight ? 'is-on' : ''}`}
            onClick={() => setSpecialNight(!specialNight)}
            aria-pressed={specialNight}
          >
            {specialNight ? 'Oui' : 'Non'}
          </button>
        </div>
      </section>

      <section className="edit-form">
        <h2>Modes d'accès</h2>
        <div className="access-modes-editor">
          {allEditableModes.map((mode) => (
            <button
              key={mode}
              type="button"
              className={`mode-toggle ${accessModes.includes(mode) ? 'is-active' : ''}`}
              onClick={() => toggleMode(mode)}
            >
              {accessModeLabels[mode]}
            </button>
          ))}
        </div>
        {accessModes.includes('TICKET') && (
          <div className="form-group form-group--toggle" style={{ marginTop: '12px' }}>
            <label>Billet obligatoire pour entrer</label>
            <button
              type="button"
              className={`toggle-btn ${ticketRequired ? 'is-on' : ''}`}
              onClick={() => setTicketRequired(!ticketRequired)}
              aria-pressed={ticketRequired}
            >
              {ticketRequired ? 'Oui' : 'Non'}
            </button>
          </div>
        )}
      </section>

      {accessModes.includes('TICKET') && (
        <section className="edit-form">
          <div className="section-header">
            <h2>Catégories de billets</h2>
            <button type="button" onClick={addCategory} className="header-cta">+ Ajouter</button>
          </div>
          {categories.map((cat, idx) => (
            <div key={idx} className="category-editor-row">
              <div className="category-row-top">
                <select
                  value={cat.code}
                  onChange={(e) => updateCategory(idx, { code: e.target.value })}
                  className="code-select"
                >
                  <option value="STD">STD</option>
                  <option value="VIP">VIP</option>
                </select>
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => updateCategory(idx, { name: e.target.value })}
                  placeholder="Nom catégorie"
                  className="cat-name-input"
                />
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeCategory(idx)}
                  aria-label="Supprimer catégorie"
                  disabled={categories.length === 1}
                >
                  ✕
                </button>
              </div>
              <div className="category-row-fields">
                <div className="form-group--inline">
                  <label>Prix (MAD)</label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={Math.round(cat.priceMinor / 100)}
                    onChange={(e) => updateCategory(idx, { priceMinor: Number(e.target.value) * 100 })}
                  />
                </div>
                <div className="form-group--inline">
                  <label>Quota</label>
                  <input
                    type="number"
                    min={1}
                    value={cat.quota}
                    onChange={(e) => updateCategory(idx, { quota: Number(e.target.value), remaining: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="category-row-options">
                <label className="option-toggle">
                  <input
                    type="checkbox"
                    checked={cat.drinkIncluded}
                    onChange={(e) => updateCategory(idx, { drinkIncluded: e.target.checked })}
                  />
                  <span>🍸 Boisson incluse dans le prix</span>
                </label>
                <div className="payment-timing-group">
                  <span className="timing-label">Paiement :</span>
                  <button
                    type="button"
                    className={`timing-btn ${cat.paymentTiming === 'ADVANCE' ? 'is-active' : ''}`}
                    onClick={() => updateCategory(idx, { paymentTiming: 'ADVANCE' as PaymentTiming })}
                  >
                    En ligne à l'avance
                  </button>
                  <button
                    type="button"
                    className={`timing-btn ${cat.paymentTiming === 'ON_SITE' ? 'is-active' : ''}`}
                    onClick={() => updateCategory(idx, { paymentTiming: 'ON_SITE' as PaymentTiming })}
                  >
                    Sur place possible
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {accessModes.includes('TABLE') && (
        <section className="edit-form">
          <h2>Tables</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Acompte par table (MAD)</label>
              <input
                type="number"
                min={0}
                step={50}
                value={Math.round(tablesDepositMinor / 100)}
                onChange={(e) => setTablesDepositMinor(Number(e.target.value) * 100)}
              />
            </div>
            <div className="form-group">
              <label>Minimum conso (MAD)</label>
              <input
                type="number"
                min={0}
                step={100}
                value={Math.round(tablesMinSpendMinor / 100)}
                onChange={(e) => setTablesMinSpendMinor(Number(e.target.value) * 100)}
              />
            </div>
          </div>
          <p className="input-hint">Ces valeurs s'appliquent à toutes les tables de cette soirée. Le min conso par table reste configurable dans Plan de salle.</p>
        </section>
      )}

      {accessModes.includes('GUEST_LIST') && (
        <section className="edit-form">
          <h2>Guest list</h2>
          <div className="form-group form-group--toggle">
            <label>Guest list activée pour cette soirée</label>
            <button
              type="button"
              className={`toggle-btn ${guestListEnabled ? 'is-on' : ''}`}
              onClick={() => setGuestListEnabled(!guestListEnabled)}
              aria-pressed={guestListEnabled}
            >
              {guestListEnabled ? 'Oui' : 'Non'}
            </button>
          </div>
        </section>
      )}

      <section className="sticky-cta sticky-cta--stacked">
        <IonButton expand="block" onClick={handleSave} disabled={!title.trim()}>
          {isNew ? 'Enregistrer (brouillon)' : 'Sauvegarder'}
        </IonButton>
        {!isNew && existing?.status === 'DRAFT' && (
          <IonButton expand="block" fill="outline">
            Publier la soirée →
          </IonButton>
        )}
        {!title.trim() && <p className="validation-hint">Le titre est obligatoire.</p>}
      </section>
    </main>
  )
}
