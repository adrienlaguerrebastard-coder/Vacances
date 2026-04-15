import { useEffect, useState } from "react";
import CalendarGrid from "../components/CalendarGrid";
import { getSeasonYear } from "../lib/date";
import { getUserDaySet, togglePlannedTrip } from "../lib/api";

export default function PlannedTripsPage({ session }) {
  const [year] = useState(getSeasonYear());
  const [days, setDays] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getUserDaySet("planned_trips", session.id, year);
      setDays(data);
      setLoading(false);
    })();
  }, [session.id, year]);

  const onToggle = async (iso) => {
    await togglePlannedTrip(session.id, session.pin, iso);
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });
  };

  return (
    <div className="card">
      <h2>Mes vacances déjà prévues</h2>
      <p className="small">Clique sur un jour pour ajouter/retirer.</p>
      {loading ? <p>Chargement...</p> : <CalendarGrid year={year} selectedDates={days} onToggle={onToggle} />}
    </div>
  );
}
