import React, { useState } from 'react';

const PREP = ['Cadrage et documents', 'BDP chiffré', 'Équipe', 'Démarrage'];
const LIFE = ['Exécution', 'Réception provisoire', 'Réception définitive', 'Garanties & clôture'];

type Demo = 'normal' | 'loading' | 'empty' | 'error';
type MapState = 'idle' | 'loading' | 'geocode-error' | 'map-error' | 'manual';

export default function ChantierOnboardingCanvas() {
  const [phase, setPhase] = useState<'prep' | 'life'>('prep');
  const [step, setStep] = useState(0);
  const [study, setStudy] = useState(true);
  const [demo, setDemo] = useState<Demo>('normal');
  const [cps, setCps] = useState(false);
  const [bdp, setBdp] = useState(false);
  const [autres, setAutres] = useState(false);
  const [conducteur, setConducteur] = useState(false);
  const [chef, setChef] = useState(false);
  const [mapState, setMapState] = useState<MapState>('idle');
  const [pin, setPin] = useState(false);
  const steps = phase === 'prep' ? PREP : LIFE;
  const mapReady = mapState !== 'map-error' && mapState !== 'manual';
  const cityFromMap = pin ? 'Rabat' : study ? 'Rabat' : '';
  const addressFromMap = pin ? 'Avenue Mohammed V, Rabat' : '';

  return (
    <main style={{ fontFamily: 'sans-serif', background: '#f5f7fa', padding: 28, color: '#172c3c', maxWidth: 960 }}>
      <header>
        <small>Chantiers / Nouveau chantier</small>
        <h1>{study && cps ? 'Résidence Atlas' : 'Préparer un chantier'}</h1>
        <p>Même geste que l’étude pour les pièces. L’étude préremplit identité et BDP — les fichiers restent ceux du chantier.</p>
      </header>

      <div style={{ display: 'flex', gap: 8, margin: '12px 0 20px', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => { setPhase('prep'); setStep(0); }}>Préparation</button>
        <button type="button" onClick={() => { setPhase('life'); setStep(0); }}>Cycle de vie</button>
      </div>

      <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {steps.map((s, i) => (
          <button key={s} type="button" onClick={() => setStep(i)} aria-current={step === i ? 'step' : undefined}>
            {i + 1}. {s}
          </button>
        ))}
      </nav>

      <section style={{ background: 'white', marginTop: 20, padding: 24, minHeight: 320, border: '1px solid #d5dee6', borderRadius: 12 }}>
        <h2>{steps[step]}</h2>
        {demo === 'loading' && <p>Chargement du dossier…</p>}
        {demo === 'error' && (
          <p role="alert">Enregistrement impossible. Votre saisie est conservée. <button type="button" onClick={() => setDemo('normal')}>Réessayer</button></p>
        )}
        {demo !== 'loading' && demo !== 'error' && phase === 'prep' && step === 0 && (
          <>
            <p>CPS et BDP d’abord. Les autres pièces se plient dessous — elles ne bloquent pas le cadrage.</p>
            <label>Étude (facultatif)
              <select value={study ? 'atlas' : ''} onChange={(e) => setStudy(!!e.target.value)}>
                <option value="">Sans étude</option>
                <option value="atlas">DE-0042 · Résidence Atlas (validation finale)</option>
              </select>
            </label>
            {demo === 'empty' && !study && <p>Aucune étude en validation finale. Continuez sans étude.</p>}
            {study && (
              <p>DE-0042 · Client Atlas. Étude choisie : le bordereau chiffré se verra à l’étape BDP.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
              <article style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, border: '1px dashed #aab8c4', padding: '6px 8px', borderRadius: 8 }}>
                <span>CPS · Requis</span>
                {cps
                  ? <><span style={{ textDecoration: 'underline' }}>CPS-Atlas.pdf</span><span>Enregistré</span></>
                  : <><span>Déposer le fichier</span><span>À déposer</span></>}
                {study && !cps && <button type="button" onClick={() => setCps(true)}>Reprendre le fichier de l’étude</button>}
                <button type="button" onClick={() => setCps(!cps)}>{cps ? 'Remplacer' : 'Parcourir'}</button>
              </article>
              <article style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, border: '1px dashed #aab8c4', padding: '6px 8px', borderRadius: 8 }}>
                <span>BDP · Requis</span>
                {bdp
                  ? <><span style={{ textDecoration: 'underline' }}>BDP-Atlas.xlsx</span><span>Enregistré</span></>
                  : <><span>Déposer un BDP</span><span>À déposer</span></>}
                {study && !bdp && <button type="button" onClick={() => setBdp(true)}>Reprendre le fichier de l’étude</button>}
                <button type="button" onClick={() => setBdp(!bdp)}>{bdp ? 'Remplacer' : 'Parcourir'}</button>
              </article>
            </div>
            <div style={{ marginTop: 12, borderTop: '1px solid #d5dee6', paddingTop: 10 }}>
              <button type="button" onClick={() => setAutres(!autres)}>▸ Autres documents {autres ? '1/3' : '0/3'}</button>
              <button type="button">Ajouter</button>
              {autres && <p>PLA / Plans · Déposer</p>}
            </div>
            <h3>Identité du chantier</h3>
            <p>Type, description et lieu. Les dates prévisionnelles restent à Démarrage. Une étude en validation finale préremplit nom, client et ville — pas un pin déjà posé.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label>Nom <input defaultValue={study ? 'Résidence Atlas' : ''} /></label>
              <label>Client <input defaultValue={study ? 'Client Atlas' : ''} /></label>
              <label>Type de chantier
                <select defaultValue="BATIMENT">
                  <option value="BATIMENT">Bâtiment</option>
                  <option value="TP">Travaux publics</option>
                  <option value="VRD">VRD</option>
                  <option value="GO">Gros œuvre</option>
                  <option value="TCE">Tous corps d’état</option>
                  <option value="REHABILITATION">Réhabilitation</option>
                </select>
              </label>
              <label>Ville <input value={cityFromMap} readOnly={pin} placeholder={pin ? '' : 'Dérivée de l’adresse'} /></label>
            </div>
            <label style={{ display: 'block', marginTop: 8 }}>Description <textarea rows={2} defaultValue={study ? 'Immeuble R+5, lotissement Hay Riad.' : ''} /></label>
            <h4 style={{ margin: '12px 0 6px' }}>Localisation</h4>
            <div style={{ display: 'flex', gap: 8, alignItems: 'end', marginBottom: 6 }}>
              <label style={{ flex: 1 }}>Adresse
                <input
                  value={addressFromMap}
                  placeholder="Adresse, puis Localiser — ou cliquer la carte"
                  readOnly={mapState === 'loading'}
                />
              </label>
              <button type="button" onClick={() => { setMapState('loading'); setTimeout(() => { setPin(true); setMapState('idle'); }, 400); }}>Localiser</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap', fontSize: 12 }}>
              <button type="button" onClick={() => { setMapState('manual'); setPin(false); }}>Sans carte</button>
              <button type="button" onClick={() => setMapState('geocode-error')}>Géocodage KO</button>
              <button type="button" onClick={() => setMapState('map-error')}>Carte KO</button>
              <button type="button" onClick={() => { setMapState('idle'); setPin(false); }}>Carte OK</button>
            </div>
            {mapState === 'geocode-error' && (
              <p role="alert" style={{ margin: '0 0 6px', fontSize: 12 }}>Adresse introuvable. <button type="button" onClick={() => setMapState('idle')}>Réessayer</button></p>
            )}
            {mapState === 'map-error' && (
              <p role="alert" style={{ margin: '0 0 6px', fontSize: 12 }}>Tuiles indisponibles — saisissez l’adresse. <button type="button" onClick={() => setMapState('idle')}>Réessayer</button></p>
            )}
            {mapState === 'manual' && (
              <p style={{ margin: '0 0 6px', fontSize: 12 }}>Fallback : adresse et ville en saisie libre.</p>
            )}
            {mapReady && (
              <div
                role="application"
                aria-label="Carte du chantier"
                onClick={() => { setPin(true); setMapState('idle'); }}
                style={{
                  height: 180, maxHeight: 220, borderRadius: 8, border: '1px solid #d5dee6',
                  background: '#dfe5e2', position: 'relative', cursor: 'crosshair',
                }}
              >
                <span style={{ position: 'absolute', left: 8, top: 8, fontSize: 11, background: 'white', padding: '2px 6px' }}>OSM</span>
                {pin && <span style={{ position: 'absolute', left: '48%', top: '42%', fontWeight: 700 }}>● 34.0209, −6.8416</span>}
                {!pin && mapState === 'idle' && (
                  <span style={{ position: 'absolute', left: 8, bottom: 8, fontSize: 12, background: 'rgb(255 255 255 / 0.88)', padding: '2px 6px' }}>Cliquez la carte ou localisez une adresse</span>
                )}
                {mapState === 'loading' && <p role="status" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, fontSize: 12 }}>Recherche…</p>}
              </div>
            )}
            <p style={{ margin: '6px 0 0', fontSize: 12 }}>Lat {pin ? '34.0209' : '—'} · Lng {pin ? '−6.8416' : '—'}</p>
            <label style={{ display: 'block', marginTop: 12 }}>Délai d’exécution (mois) <input type="number" defaultValue={study ? 18 : undefined} /></label>
            <button type="button">Enregistrer le cadrage</button>
          </>
        )}
        {demo !== 'loading' && demo !== 'error' && phase === 'prep' && step === 1 && (
          <>
            {study
              ? <p>Repris de l’étude — à vérifier. Arbre chiffré en lecture seule. L’empreinte n’est pas auto-validée.</p>
              : <p>Sans étude : construisez l’arbre ici — import magique ou saisie (Ajouter un lot).</p>}
            {demo === 'empty' && <p>Aucune ligne au bordereau.</p>}
            <p>42 lignes vendues · 1 240 000 DH HT · À vérifier</p>
            <table style={{ width: '100%', fontSize: 13 }}>
              <caption style={{ textAlign: 'left', fontWeight: 600 }}>
                {study ? 'Arbre chiffré (lecture seule)' : 'Arbre à construire'}
              </caption>
              <thead><tr><th>Ligne</th><th>Qté</th><th>PU HT</th><th>Total</th></tr></thead>
              <tbody>
                <tr><td><strong>GO · Gros œuvre</strong></td><td>—</td><td>—</td><td>820 000</td></tr>
                <tr><td>GO-12 · Béton C25</td><td>120 m³</td><td>1 850</td><td>222 000</td></tr>
                <tr><td>SO-04 · Peinture</td><td>800 m²</td><td>95</td><td>76 000</td></tr>
              </tbody>
            </table>
            {study
              ? <p>Pas d’ajout de lot ni d’import — lecture seule.</p>
              : <p><button type="button">Ajouter un lot</button> <button type="button">Import magique</button></p>}
            <button type="button">Valider le BDP chiffré</button>
          </>
        )}
        {demo !== 'loading' && demo !== 'error' && phase === 'prep' && step === 2 && (
          <>
            <p>Conducteur de travaux et chef de chantier sont exigés — même ajout que le cockpit.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <article style={{ border: '1px solid #d5dee6', padding: 12, borderRadius: 8 }}>
                <strong>Conducteur de travaux</strong>
                <p>{conducteur ? 'Pourvu · Karim Bennani' : 'Manquant'}</p>
                <button type="button" onClick={() => setConducteur(!conducteur)}>{conducteur ? 'Retirer' : 'Ajouter'}</button>
              </article>
              <article style={{ border: '1px solid #d5dee6', padding: 12, borderRadius: 8 }}>
                <strong>Chef de chantier</strong>
                <p>{chef ? 'Pourvu · Nadia El Fassi' : 'Manquant'}</p>
                <button type="button" onClick={() => setChef(!chef)}>{chef ? 'Retirer' : 'Ajouter'}</button>
              </article>
            </div>
            {demo === 'empty' && <p>Personne n’est encore affecté. Ajouter un employé, un rôle, une date de début.</p>}
          </>
        )}
        {demo !== 'loading' && demo !== 'error' && phase === 'prep' && step === 3 && (
          <>
            <h3>Marché</h3>
            <p>Référence du marché · Marché signé (dropzone) · Créer le marché depuis le chantier</p>
            <h3>Dates prévisionnelles</h3>
            <p>Début · Fin · Délai retenu</p>
            <h3>Ordre de service</h3>
            <p>Document OS · Référence · Date d’effet — n’enclenche pas le démarrage.</p>
            <h3>Vérification</h3>
            <ul>
              {!conducteur || !chef ? <li>Conducteur et chef de chantier à affecter</li> : <li>La préparation est complète.</li>}
            </ul>
            <button type="button">Valider la préparation</button>
          </>
        )}
        {demo !== 'loading' && demo !== 'error' && phase === 'life' && (
          <p>Inchangé : exécution, réceptions, garanties. Le cockpit reste le quotidien.</p>
        )}
      </section>

      <footer style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)}>Précédent</button>
        <button type="button" disabled={step === steps.length - 1} onClick={() => setStep(step + 1)}>Suivant</button>
        <label>État <select value={demo} onChange={(e) => setDemo(e.target.value as Demo)}>{['normal', 'loading', 'empty', 'error'].map((s) => <option key={s}>{s}</option>)}</select></label>
      </footer>
    </main>
  );
}
