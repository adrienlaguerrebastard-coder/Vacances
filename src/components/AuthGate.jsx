import { useState } from "react";
import { verifyUser } from "../lib/api";

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

export default function AuthGate({ onLogin }) {
  const [name, setName] = useState(FIXED_USERS[0]);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await verifyUser(name, pin);
      if (!result?.ok) throw new Error(result?.message || "Connexion impossible");
      onLogin({ ...result.user, pin });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="card">
        <h1>Vacances entre amis</h1>
        <p>Choisis ton prénom et ton PIN.</p>
        <form onSubmit={submit}>
          <div className="row">
            <select value={name} onChange={(e) => setName(e.target.value)}>
              {FIXED_USERS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
            <input
              type="password"
              inputMode="numeric"
              placeholder="PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
            <button disabled={loading}>{loading ? "Connexion..." : "Entrer"}</button>
          </div>
        </form>
        {error && <p style={{ color: "#d64550" }}>{error}</p>}
      </div>
    </div>
  );
}
