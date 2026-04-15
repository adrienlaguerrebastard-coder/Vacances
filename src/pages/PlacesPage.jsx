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

  useEffect(() => {
    const refresh = async () => {
      const data = await getMyPlacesWithDays(session.id, year);
      setPlaces(data);
    };

    refresh();
  }, [session.id, year]);

  const refresh = async () => {
    const data = await getMyPlacesWithDays(session.id, year);
    setPlaces(data);
  };

  const addPlace = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createPlace(session.id, session.pin, newName.trim());
    setNewName("");
    await refresh();
  };

  const renamePlace = async (id, name) => {
    if (!name.trim()) return;
    await updatePlaceName(session.id, session.pin, id, name.trim());
    await refresh();
  };

  const removePlace = async (id) => {
    await deletePlace(session.id, session.pin, id);
    await refresh();
  };

  const toggleDay = async (placeId, day) => {
    await togglePlaceAvailability(session.id, session.pin, placeId, day);
    setPlaces((prev) =>
      prev.map((p) => {
        if (p.id !== placeId) return p;
        const next = new Set(p.days);
        if (next.has(day)) next.delete(day);
        else next.add(day);
        return { ...p, days: next };
      })
    );
  };

  return (
    <>
      <div className="card">
        <h2>Mes lieux / maisons</h2>
        <form className="row" onSubmit={addPlace}>
          <input placeholder="Nom du lieu" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button>Ajouter</button>
        </form>
      </div>

      {places.map((p) => (
        <div className="card" key={p.id}>
          <div className="row" style={{ alignItems: "center" }}>
            <input defaultValue={p.name} onBlur={(e) => renamePlace(p.id, e.target.value)} style={{ flex: 1 }} />
            <button className="secondary" type="button" onClick={() => removePlace(p.id)}>
              Supprimer
            </button>
          </div>
          <p className="small" style={{ marginTop: 10 }}>Clique sur les dates où ce lieu est disponible.</p>
          <CalendarGrid year={year} selectedDates={p.days} onToggle={(day) => toggleDay(p.id, day)} />
        </div>
      ))}

      {places.length === 0 && (
        <div className="card">
          <p>Aucun lieu pour le moment.</p>
        </div>
      )}
    </>
  );
}
