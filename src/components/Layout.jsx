import { NavLink } from "react-router-dom";

export default function Layout({ session, onLogout, children }) {
  return (
    <div className="container">
      <div className="card top-nav compact-card">
        <div className="row layout-header">
          <strong aria-live="polite">Connecté : {session.name}</strong>
          <button className="secondary" onClick={onLogout}>
            Se déconnecter
          </button>
        </div>
        <nav className="nav nav-main" aria-label="Navigation principale">
          <NavLink to="/">Accueil</NavLink>
          <NavLink to="/disponibilites">Mes disponibilités</NavLink>
          <NavLink to="/vacances-prevues">Mes vacances prévues</NavLink>
          <NavLink to="/lieux">Mes lieux</NavLink>
          <NavLink to="/recap">Récap global</NavLink>
          <NavLink to="/aide">Aide</NavLink>
        </nav>
      </div>
      {children}
    </div>
  );
}
