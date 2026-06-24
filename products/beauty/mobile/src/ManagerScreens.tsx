import { useMemo, useState } from 'react'
import { IonButton, IonContent } from '@ionic/react'
import type { ManagerSession } from './App'
import type { Booking, Salon, Service, ServiceCategory } from './prototypeData'
import { beautyServiceTemplates, mockSalonReviews, serviceLabels } from './prototypeData'

/* Manager Login Screen */
export function ManagerLoginScreen({
  onLogin,
  onBack,
}: {
  onLogin: (email: string, password: string) => void
  onBack: () => void
}) {
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    onLogin(email, password)
  }

  return (
    <IonContent>
      <div style={{ padding: '16px', paddingTop: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>💼</div>
          <h2 style={{ margin: 0 }}>Espace Propriétaire</h2>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              defaultValue="fatima@silhouettebeauty.ma"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--ion-border-color)',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Mot de passe
            </label>
            <input
              type="password"
              name="password"
              defaultValue="demo123"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--ion-border-color)',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          <IonButton expand="block" type="submit" className="btn-primary">
            Connexion
          </IonButton>
        </form>

        <IonButton expand="block" fill="outline" onClick={onBack} style={{ marginTop: '16px' }}>
          ← Retour
        </IonButton>

        <p style={{ textAlign: 'center', fontSize: '12px', opacity: 0.6, marginTop: '24px' }}>
          Demo: tout mot de passe accepté
        </p>
      </div>
    </IonContent>
  )
}

/* Manager Dashboard Screen */
export function ManagerDashboardScreen({
  session,
  onViewBookings,
  onViewStaff,
  onViewServices,
  onViewReviews,
  onLogout,
}: {
  session?: ManagerSession
  onViewBookings: () => void
  onViewStaff: () => void
  onViewServices: () => void
  onViewReviews: () => void
  onLogout: () => void
}) {
  return (
    <IonContent>
      <div
        style={{
          background: 'linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary))',
          color: 'white',
          padding: '24px 16px',
        }}
      >
        <h2 style={{ margin: 0, marginBottom: '8px' }}>{session?.salonName}</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>Bienvenue, {session?.name}</p>
      </div>

      <div style={{ padding: '16px', paddingBottom: '100px' }}>
        {/* Quick Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div style={{ background: 'var(--ion-color-step-100)', padding: '16px', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.6 }}>Réservations (mois)</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>42</p>
          </div>
          <div style={{ background: 'var(--ion-color-step-100)', padding: '16px', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.6 }}>Revenu (mois)</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>8,420 DH</p>
          </div>
        </div>

        {/* Dashboard Menu */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <DashboardButton label="📅 Réservations" onClick={onViewBookings} />
          <DashboardButton label="👥 Staff" onClick={onViewStaff} />
          <DashboardButton label="💇 Services" onClick={onViewServices} />
          <DashboardButton label="⭐ Avis" onClick={onViewReviews} />
        </div>

        <IonButton expand="block" fill="outline" onClick={onLogout}>
          Déconnexion
        </IonButton>
      </div>
    </IonContent>
  )
}

function DashboardButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--ion-color-step-100)',
        padding: '16px',
        borderRadius: '8px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: '1px solid var(--ion-border-color)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--ion-color-primary)'
        e.currentTarget.style.color = 'white'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--ion-color-step-100)'
        e.currentTarget.style.color = 'inherit'
      }}
    >
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{label.split(' ')[0]}</div>
      <div style={{ fontSize: '14px', fontWeight: '500' }}>{label.split(' ').slice(1).join(' ')}</div>
    </div>
  )
}

/* Manager Bookings List Screen */
export function ManagerBookingsListScreen({
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
          ← Tableau de bord
        </IonButton>

        <h2>Réservations</h2>

        <div style={{ marginBottom: '12px' }}>
          <IonButton size="small" fill="solid" className="btn-primary" style={{ marginRight: '8px' }}>
            Toutes
          </IonButton>
          <IonButton size="small" fill="outline">
            À venir
          </IonButton>
          <IonButton size="small" fill="outline">
            Complétées
          </IonButton>
        </div>

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
              <h4 style={{ margin: 0 }}>{booking.serviceName}</h4>
              <span style={{ fontSize: '12px', opacity: 0.6 }}>{booking.status}</span>
            </div>
            <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>{booking.customerName}</p>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.6 }}>
              {booking.date} à {booking.time}
            </p>
          </div>
        ))}
      </div>
    </IonContent>
  )
}

/* Manager Booking Detail Screen */
export function ManagerBookingDetailScreen({
  booking,
  onBack,
}: {
  booking: Booking
  onBack: () => void
}) {
  return (
    <IonContent>
      <div style={{ padding: '16px' }}>
        <IonButton expand="block" fill="clear" onClick={onBack}>
          ← Réservations
        </IonButton>

        <h2>{booking.serviceName}</h2>
        <p style={{ opacity: 0.6 }}>{booking.bookingRef}</p>

        <div className="booking-confirm-section">
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
            Détails du client
          </h3>
          <div className="booking-detail-row">
            <span className="booking-detail-label">Nom</span>
            <span className="booking-detail-value">{booking.customerName}</span>
          </div>
          <div className="booking-detail-row">
            <span className="booking-detail-label">Téléphone</span>
            <span className="booking-detail-value">{booking.customerPhone}</span>
          </div>
          <div className="booking-detail-row">
            <span className="booking-detail-label">Email</span>
            <span className="booking-detail-value">{booking.customerEmail}</span>
          </div>
        </div>

        <div className="booking-confirm-section">
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
            Détails du service
          </h3>
          <div className="booking-detail-row">
            <span className="booking-detail-label">Service</span>
            <span className="booking-detail-value">{booking.serviceName}</span>
          </div>
          {booking.staffName && (
            <div className="booking-detail-row">
              <span className="booking-detail-label">Staff</span>
              <span className="booking-detail-value">{booking.staffName}</span>
            </div>
          )}
          <div className="booking-detail-row">
            <span className="booking-detail-label">Date & Heure</span>
            <span className="booking-detail-value">
              {booking.date} à {booking.time}
            </span>
          </div>
          <div className="booking-detail-row">
            <span className="booking-detail-label">Durée</span>
            <span className="booking-detail-value">{booking.duration} min</span>
          </div>
          <div className="booking-detail-row">
            <span className="booking-detail-label">Prix</span>
            <span className="booking-detail-value">{booking.totalPrice} DH</span>
          </div>
        </div>

        {booking.notes && (
          <div className="booking-confirm-section">
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Notes</h3>
            <p style={{ margin: 0 }}>{booking.notes}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <IonButton expand="block" fill="outline">
            Annuler la réservation
          </IonButton>
          <IonButton expand="block" className="btn-primary">
            Marquer comme complétée
          </IonButton>
        </div>
      </div>
    </IonContent>
  )
}

/* Manager Staff Screen */
export function ManagerStaffScreen({
  salon,
  onBack,
}: {
  salon: Salon
  onBack: () => void
}) {
  return (
    <IonContent>
      <div style={{ padding: '16px' }}>
        <IonButton expand="block" fill="clear" onClick={onBack}>
          ← Tableau de bord
        </IonButton>

        <h2>Mon équipe</h2>

        <IonButton expand="block" className="btn-primary" style={{ marginBottom: '16px' }}>
          + Ajouter un membre
        </IonButton>

        {salon.staff.map((staff) => (
          <div
            key={staff.id}
            style={{
              padding: '16px',
              border: '1px solid var(--ion-border-color)',
              borderRadius: '8px',
              marginBottom: '12px',
            }}
          >
            <h4 style={{ margin: 0, marginBottom: '8px' }}>{staff.name}</h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', opacity: 0.6 }}>
              Spécialités: {staff.specialties.join(', ')}
            </p>
            {staff.bio && (
              <p style={{ margin: '0 0 8px 0', fontSize: '12px' }}>{staff.bio}</p>
            )}
            <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
              <span>⭐ {staff.rating}</span>
              <span style={{ cursor: 'pointer', color: 'var(--ion-color-primary)' }}>Éditer</span>
              <span style={{ cursor: 'pointer', color: 'var(--ion-color-danger)' }}>Retirer</span>
            </div>
          </div>
        ))}
      </div>
    </IonContent>
  )
}

/* Manager Services Screen */
export function ManagerServicesScreen({
  salon,
  onBack,
}: {
  salon: Salon
  onBack: () => void
}) {
  const [services, setServices] = useState<Service[]>(salon.services)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newService, setNewService] = useState({
    name: '',
    category: salon.categories[0] ?? ('esthetique' as ServiceCategory),
    description: '',
    duration: 45,
    minBookingMinutes: 30,
    price: 150,
  })

  const possibleServicesByCategory = useMemo(() => {
    return salon.categories.map((category) => ({
      category,
      templates: beautyServiceTemplates.filter((tpl) => tpl.category === category),
    }))
  }, [salon.categories])

  const applyTemplate = (templateId: string) => {
    const template = beautyServiceTemplates.find((item) => item.id === templateId)
    if (!template) {
      return
    }
    setShowAddForm(true)
    setNewService({
      name: template.name,
      category: template.category,
      description: template.description,
      duration: template.defaultDuration,
      minBookingMinutes: template.minBookingMinutes,
      price: template.defaultPrice,
    })
  }

  const addService = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const duration = Math.max(15, newService.duration)
    const minBookingMinutes = Math.min(Math.max(15, newService.minBookingMinutes), duration)

    const createdService: Service = {
      id: `svc-custom-${Date.now()}`,
      name: newService.name.trim(),
      category: newService.category,
      description: newService.description.trim(),
      duration,
      minBookingMinutes,
      price: Math.max(1, newService.price),
    }

    setServices((prev) => [createdService, ...prev])
    setNewService({
      name: '',
      category: newService.category,
      description: '',
      duration: 45,
      minBookingMinutes: 30,
      price: 150,
    })
    setShowAddForm(false)
  }

  return (
    <IonContent>
      <div style={{ padding: '16px' }}>
        <IonButton expand="block" fill="clear" onClick={onBack}>
          ← Tableau de bord
        </IonButton>

        <h2>Mes services</h2>

        <IonButton
          expand="block"
          className="btn-primary"
          style={{ marginBottom: '16px' }}
          onClick={() => setShowAddForm((prev) => !prev)}
        >
          + Ajouter un service
        </IonButton>

        <div
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--ion-border-color)',
            marginBottom: '16px',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Services possibles à booker</h3>
          {possibleServicesByCategory.map((group) => (
            <div key={group.category} style={{ marginBottom: '8px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '12px', opacity: 0.7 }}>
                {serviceLabels[group.category]}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {group.templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl.id)}
                    style={{
                      border: '1px solid var(--ion-border-color)',
                      borderRadius: '999px',
                      background: 'transparent',
                      padding: '6px 10px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {showAddForm && (
          <form
            onSubmit={addService}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '12px',
              border: '1px solid var(--ion-border-color)',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '14px' }}>Nouveau service</h3>
            <input
              required
              placeholder="Nom du service (ex: Manucure spa)"
              value={newService.name}
              onChange={(e) => setNewService((prev) => ({ ...prev, name: e.target.value }))}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--ion-border-color)' }}
            />

            <select
              value={newService.category}
              onChange={(e) =>
                setNewService((prev) => ({ ...prev, category: e.target.value as ServiceCategory }))
              }
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--ion-border-color)' }}
            >
              {salon.categories.map((cat) => (
                <option key={cat} value={cat}>
                  {serviceLabels[cat]}
                </option>
              ))}
            </select>

            <textarea
              required
              placeholder="Description du service"
              value={newService.description}
              onChange={(e) =>
                setNewService((prev) => ({ ...prev, description: e.target.value }))
              }
              style={{ width: '100%', minHeight: '70px', padding: '10px', borderRadius: '8px', border: '1px solid var(--ion-border-color)' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="number"
                min={15}
                step={5}
                required
                value={newService.duration}
                onChange={(e) =>
                  setNewService((prev) => ({ ...prev, duration: Number(e.target.value) }))
                }
                placeholder="Durée (min)"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--ion-border-color)' }}
              />
              <input
                type="number"
                min={15}
                step={5}
                required
                value={newService.minBookingMinutes}
                onChange={(e) =>
                  setNewService((prev) => ({ ...prev, minBookingMinutes: Number(e.target.value) }))
                }
                placeholder="Min réservation (min)"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--ion-border-color)' }}
              />
            </div>

            <input
              type="number"
              min={1}
              step={10}
              required
              value={newService.price}
              onChange={(e) => setNewService((prev) => ({ ...prev, price: Number(e.target.value) }))}
              placeholder="Prix (DH)"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--ion-border-color)' }}
            />

            <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>
              Le minimum de réservation est automatiquement borné entre 15 min et la durée du service.
            </p>

            <IonButton expand="block" type="submit" className="btn-primary">
              Enregistrer le service
            </IonButton>
          </form>
        )}

        {services.map((service) => (
          <div
            key={service.id}
            style={{
              padding: '16px',
              border: '1px solid var(--ion-border-color)',
              borderRadius: '8px',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h4 style={{ margin: 0 }}>{service.name}</h4>
              <span style={{ fontWeight: '600', color: 'var(--ion-color-primary)' }}>
                {service.price} DH
              </span>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', opacity: 0.6 }}>
              {service.description}
            </p>
            <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
              <span>⏱️ {service.duration} min</span>
              <span>📌 Min réservation: {service.minBookingMinutes} min</span>
              <span style={{ cursor: 'pointer', color: 'var(--ion-color-primary)' }}>Éditer</span>
              <span style={{ cursor: 'pointer', color: 'var(--ion-color-danger)' }}>Supprimer</span>
            </div>
          </div>
        ))}
      </div>
    </IonContent>
  )
}

/* Manager Reviews Screen */
export function ManagerReviewsScreen({
  salonId,
  onBack,
}: {
  salonId: string
  onBack: () => void
}) {
  const reviews = mockSalonReviews.filter((r) => r.salonId === salonId)
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  return (
    <IonContent>
      <div style={{ padding: '16px' }}>
        <IonButton expand="block" fill="clear" onClick={onBack}>
          ← Tableau de bord
        </IonButton>

        <h2>Avis clients</h2>

        <div
          style={{
            background: 'var(--ion-color-step-100)',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px' }}>
            {avgRating}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.6 }}>
            basé sur {reviews.length} avis
          </div>
        </div>

        {reviews.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.6 }}>Aucun avis pour le moment</p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              style={{
                padding: '16px',
                border: '1px solid var(--ion-border-color)',
                borderRadius: '8px',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h4 style={{ margin: 0 }}>{review.title}</h4>
                <span style={{ fontSize: '14px' }}>{'⭐'.repeat(review.rating)}</span>
              </div>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{review.comment}</p>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.6 }}>
                {review.authorName} • {review.createdAt}
              </p>
            </div>
          ))
        )}
      </div>
    </IonContent>
  )
}
