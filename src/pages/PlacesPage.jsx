import { useEffect, useState } from "react";
import CalendarGrid from "../components/CalendarGrid";
import { getSeasonYear } from "../lib/date";
import {
  createPlace,
  deletePlace,
  getMyPlacesWithDays,
  togglePlaceAvailability,
  updatePlaceName
} from "../lib/api";

export default function PlacesPage({ session }) {
  const [year] = useState(getSeasonYear());
  const [places, setPlaces] = useState([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const refresh = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getMyPlacesWithDays(session.id, year);
        setPlaces(data);
      } catch (err) {
        setError(err.message || "Impossible de charger les lieux.");
      } finally {
        setLoading(false);
      }
    };

    refresh();
  }, [session.id, year]);

  const refresh = async () => {
    setError("");
    const data = await getMyPlacesWithDays(session.id, year);
    setPlaces(data);
  };

  const addPlace = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setSaving(true);
      setStatus("");
      setError("");
      await createPlace(session.id, newName.trim());
      setNewName("");
      await refresh();
      setStatus("Lieu ajouté.");
    } catch (err) {
      setError(err.message || "Impossible d’ajouter le lieu.");
    } finally {
      setSaving(false);
    }
  };

  const renamePlace = async (id, name) => {
    if (!name.trim()) return;
    try {
      setSaving(true);
      setStatus("");
      setError("");
      await updatePlaceName(session.id, id, name.trim());
      await refresh();
      setStatus("Lieu renommé.");
    } catch (err) {
      setError(err.message || "Impossible de renommer le lieu.");
    } finally {
      setSaving(false);
    }
  };

  const removePlace = async (id) => {
    try {
      setSaving(true);
      setStatus("");
      setError("");
      await deletePlace(session.id, id);
      await refresh();
      setStatus("Lieu supprimé.");
    } catch (err) {
      setError(err.message || "Impossible de supprimer le lieu.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = async (placeId, day) => {
    try {
      setSaving(true);
      setStatus("");
      setError("");
      await togglePlaceAvailability(session.id, placeId, day);
      setPlaces((prev) =>
        prev.map((p) => {
          if (p.id !== placeId) return p;
          const next = new Set(p.days);
          if (next.has(day)) next.delete(day);
          else next.add(day);
          return { ...p, days: next };
        })
      );
      setStatus("Modification enregistrée.");
    } catch (err) {
      setError(err.message || "Échec de l’enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="card">
        <h2>Mes lieux / maisons</h2>
        <form className="row" onSubmit={addPlace}>
          <label htmlFor="new-place" className="sr-only">
            Nom du lieu
          </label>
          <input
            id="new-place"
            placeholder="Nom du lieu"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={saving}
          />
          <button disabled={saving}>Ajouter</button>
        </form>
        {status && (
          <p className="status success" role="status" aria-live="polite">
            {status}
          </p>
        )}
        {error && (
          <p className="status error" role="alert">
            {error}
          </p>
        )}
      </div>

      {loading && <div className="card">Chargement...</div>}

      {places.map((p) => (
        <div className="card" key={p.id}>
          <div className="row" style={{ alignItems: "center" }}>
            <label htmlFor={`place-${p.id}`} className="sr-only">
              Nom du lieu {p.name}
            </label>
            <input
              id={`place-${p.id}`}
              defaultValue={p.name}
              onBlur={(e) => renamePlace(p.id, e.target.value)}
              style={{ flex: 1 }}
              disabled={saving}
            />
            <button className="secondary" type="button" onClick={() => removePlace(p.id)} disabled={saving}>
              Supprimer
            </button>
          </div>
          <p className="small" style={{ marginTop: 10 }}>Clique sur les dates où ce lieu est disponible.</p>
          <CalendarGrid year={year} selectedDates={p.days} onToggle={(day) => toggleDay(p.id, day)} disabled={saving} />
        </div>
      ))}

      {!loading && places.length === 0 && (
        <div className="card">
          <p>Aucun lieu pour le moment.</p>
        </div>
      )}
    </>
  );
}
