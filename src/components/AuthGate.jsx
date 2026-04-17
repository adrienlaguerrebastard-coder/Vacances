import { useState } from "react";
import { verifyUser } from "../lib/api";
import { SUPABASE_CONFIG_ERROR } from "../lib/supabase";

const FIXED_USERS = [
  "Camille",
  "Amalia",
  "Barth",
  "Brune",
  "Edgar",
  "Guillaume",
  "Maximilien",
  "Penelope",
  "Solene",
  "Louison",
  "Adrien"
];
const ERROR_COLOR = "#d64550";

export default function AuthGate({ onLogin }) {
  const [name, setName] = useState(FIXED_USERS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await verifyUser(name);
      if (!result?.ok) throw new Error(result?.message || "Connexion impossible");
      onLogin(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container auth-container">
      <div className="card auth-card">
        <h1>Vacances entre amis — outil d’organisation</h1>
        <p>Choisis ton prénom pour accéder à l’espace du groupe.</p>
        {SUPABASE_CONFIG_ERROR && (
          <p style={{ color: ERROR_COLOR }} role="alert">
            {SUPABASE_CONFIG_ERROR}
          </p>
        )}
        <form onSubmit={submit}>
          <div className="row">
            <label htmlFor="user-name" className="sr-only">
              Prénom
            </label>
            <select id="user-name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Choix du prénom">
              {FIXED_USERS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
            <button disabled={loading || !!SUPABASE_CONFIG_ERROR} aria-busy={loading}>
              {loading ? "Connexion..." : "Entrer"}
            </button>
          </div>
        </form>
        {error && (
          <p style={{ color: ERROR_COLOR }} role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
