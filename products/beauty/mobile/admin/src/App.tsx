import { useState, type ReactNode } from 'react'
import { IonApp, IonButton, IonContent, IonPage } from '@ionic/react'
import { mockAdminTenants } from '@shared/prototypeData'
import './index.css'

type AdminScreen = 'admin-overview' | 'admin-tenants' | 'admin-tenant-detail'

export default function App() {
  const [screen, setScreen] = useState<AdminScreen>('admin-overview')
  const [selectedTenantId, setSelectedTenantId] = useState<string>()

  const active = mockAdminTenants.filter((t) => t.status === 'ACTIVE').length

  let content: ReactNode = null

  if (screen === 'admin-overview') {
    content = (
      <div style={{ padding: '16px' }}>
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
        <IonButton expand="block" onClick={() => setScreen('admin-tenants')}>
          Gérer les salons
        </IonButton>
      </div>
    )
  } else if (screen === 'admin-tenants') {
    content = (
      <div style={{ padding: '16px' }}>
        <IonButton expand="block" fill="clear" onClick={() => setScreen('admin-overview')}>
          ← Retour
        </IonButton>
        <h2>Salons tenants</h2>
        {mockAdminTenants.map((tenant) => (
          <div
            key={tenant.id}
            style={{
              padding: '14px',
              border: '1px solid var(--ion-border-color)',
              borderRadius: '8px',
              marginBottom: '10px',
            }}
          >
            <strong>{tenant.name}</strong>
            <p style={{ margin: '4px 0' }}>
              {tenant.city} · {tenant.status}
            </p>
            <button
              type="button"
              className="salon-link"
              onClick={() => {
                setSelectedTenantId(tenant.id)
                setScreen('admin-tenant-detail')
              }}
            >
              Voir détail
            </button>
          </div>
        ))}
      </div>
    )
  } else {
    const tenant = mockAdminTenants.find((t) => t.id === selectedTenantId) ?? mockAdminTenants[0]
    content = (
      <div style={{ padding: '16px' }}>
        <IonButton expand="block" fill="clear" onClick={() => setScreen('admin-tenants')}>
          ← Retour
        </IonButton>
        <h2>{tenant.name}</h2>
        <p>
          <strong>Statut:</strong> {tenant.status}
        </p>
        <p>
          <strong>Ville:</strong> {tenant.city}
        </p>
        <p>
          <strong>Slug:</strong> {tenant.slug}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
          <button type="button" style={{ padding: '10px' }}>
            Approuver (mock)
          </button>
          <button type="button" style={{ padding: '10px' }}>
            Suspendre (mock)
          </button>
        </div>
      </div>
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
