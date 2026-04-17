import { useEffect, useState } from "react";
import CalendarGrid from "../components/CalendarGrid";
import { getSeasonYear } from "../lib/date";
import { getUserDaySet, toggleAvailability } from "../lib/api";

export default function AvailabilityPage({ session }) {
  const [year] = useState(getSeasonYear());
  const [days, setDays] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getUserDaySet("availabilities", session.id, year);
        setDays(data);
      } catch (err) {
        setError(err.message || "Impossible de charger les disponibilités.");
      } finally {
        setLoading(false);
      }
    })();
  }, [session.id, year]);

  const onToggle = async (iso) => {
    try {
      setSaving(true);
      setStatus("");
      setError("");
      await toggleAvailability(session.id, iso);
      setDays((prev) => {
        const next = new Set(prev);
        if (next.has(iso)) next.delete(iso);
        else next.add(iso);
        return next;
      });
      setStatus("Modification enregistrée.");
    } catch (err) {
      setError(err.message || "Échec de l’enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <h2>Mes disponibilités</h2>
      <p className="small">Clique sur un jour pour ajouter/retirer.</p>
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <CalendarGrid year={year} selectedDates={days} onToggle={onToggle} disabled={saving} />
      )}
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
  );
}
