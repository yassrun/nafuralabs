import { useState, type ReactNode } from 'react'
import { IonApp, IonButton, IonContent, IonPage } from '@ionic/react'
import { mockAdminTenants } from '@shared/prototypeData'
import './index.css'

type AdminScreen = 'admin-overview' | 'admin-tenants' | 'admin-tenant-detail'

export default function App() {
  const [screen, setScreen] = useState<AdminScreen>('admin-overview')
  const [selectedTenantId, setSelectedTenantId] = useState<string>()

  const activeCount = mockAdminTenants.filter((t) => t.status === 'ACTIVE').length
  const suspendedCount = mockAdminTenants.filter((t) => t.status === 'SUSPENDED').length

  let content: ReactNode = null

  if (screen === 'admin-overview') {
    content = (
      <main className="screen-container reveal-up">
        <header className="screen-header">
          <h1>Admin Nafura</h1>
        </header>
        <section className="dashboard-kpis">
          <div className="kpi-grid">
            <article className="kpi-card">
              <span className="kpi-value">{mockAdminTenants.length}</span>
              <span className="kpi-label">Tenants</span>
            </article>
            <article className="kpi-card">
              <span className="kpi-value">{activeCount}</span>
              <span className="kpi-label">Actifs</span>
            </article>
            <article className="kpi-card">
              <span className="kpi-value">{suspendedCount}</span>
              <span className="kpi-label">Suspendus</span>
            </article>
          </div>
        </section>
        <section className="dashboard-section">
          <IonButton expand="block" onClick={() => setScreen('admin-tenants')}>
            Gerer les venues / tenants
          </IonButton>
        </section>
      </main>
    )
  } else if (screen === 'admin-tenants') {
    content = (
      <main className="screen-container reveal-up">
        <header className="screen-header">
          <button type="button" onClick={() => setScreen('admin-overview')} aria-label="Retour">
            ← Retour
          </button>
          <h1>Tenants Layali</h1>
        </header>
        <div className="bookings-list">
          {mockAdminTenants.map((tenant) => (
            <article key={tenant.id} className="booking-card">
              <div className="booking-header">
                <strong>{tenant.name}</strong>
                <span className={`status status--${tenant.status.toLowerCase()}`}>{tenant.status}</span>
              </div>
              <p>
                {tenant.city} · {tenant.slug}
              </p>
              <button
                type="button"
                className="action-link"
                onClick={() => {
                  setSelectedTenantId(tenant.id)
                  setScreen('admin-tenant-detail')
                }}
              >
                Voir detail
              </button>
            </article>
          ))}
        </div>
      </main>
    )
  } else {
    const tenant = mockAdminTenants.find((t) => t.id === selectedTenantId) ?? mockAdminTenants[0]
    content = (
      <main className="screen-container reveal-up">
        <header className="screen-header">
          <button type="button" onClick={() => setScreen('admin-tenants')} aria-label="Retour">
            ← Retour
          </button>
          <h1>{tenant.name}</h1>
        </header>
        <section className="detail-section">
          <p>
            <strong>Statut:</strong> {tenant.status}
          </p>
          <p>
            <strong>Ville:</strong> {tenant.city}
          </p>
          <p>
            <strong>Slug:</strong> {tenant.slug}
          </p>
          <div className="action-buttons">
            <button type="button">Approuver (mock)</button>
            <button type="button">Suspendre (mock)</button>
            <button type="button">Reactiver (mock)</button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <IonApp>
      <IonPage>
        <IonContent>{content}</IonContent>
      </IonPage>
    </IonApp>
  )
}
