import { NavLink } from "react-router-dom";

export default function Layout({ session, onLogout, children }) {
  return (
    <div className="container">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <strong>Connecté : {session.name}</strong>
          <button className="secondary" onClick={onLogout}>
            Se déconnecter
          </button>
        </div>
        <div className="nav" style={{ marginTop: 12 }}>
          <NavLink to="/">Accueil</NavLink>
          <NavLink to="/disponibilites">Mes disponibilités</NavLink>
          <NavLink to="/vacances-prevues">Mes vacances prévues</NavLink>
          <NavLink to="/lieux">Mes lieux</NavLink>
          <NavLink to="/recap">Récap global</NavLink>
        </div>
      </div>
      {children}
    </div>
  );
}
