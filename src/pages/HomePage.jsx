export default function HomePage() {
  return (
    <>
      <div className="card hero-card">
        <h1>Organisation vacances (juillet / août)</h1>
        <p>Utilise les onglets pour saisir tes infos et consulter le récapitulatif global.</p>
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
