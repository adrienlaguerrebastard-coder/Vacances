export default function HomePage() {
  return (
    <>
      <div className="card hero-card">
        <h1 className="hero-title">Organisation vacances (juillet / août)</h1>
        <p className="hero-subtitle">
          Un espace unique pour aligner disponibilités, lieux et préférences du groupe en quelques clics.
        </p>
        <div className="hero-metrics">
          <div className="metric">
            <strong className="metric-value">3</strong>
            <span className="metric-label">étapes clés</span>
          </div>
          <div className="metric">
            <strong className="metric-value">2</strong>
            <span className="metric-label">mois pilotés</span>
          </div>
          <div className="metric">
            <strong className="metric-value">1</strong>
            <span className="metric-label">récap global</span>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="legend">
          <span className="badge available">Disponible</span>
          <span className="badge trip">Vacances prévues</span>
          <span className="badge place">Lieu dispo</span>
        </div>
      </div>
    </>
  );
}
