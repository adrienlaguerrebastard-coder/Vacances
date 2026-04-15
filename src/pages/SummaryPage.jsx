import { useEffect, useMemo, useState } from "react";
import BestDates from "../components/BestDates";
import { getSeasonYear } from "../lib/date";
import { getSummaryData } from "../lib/api";

export default function SummaryPage() {
  const [year] = useState(getSeasonYear());
  const [data, setData] = useState({
    users: [],
    availabilities: [],
    plannedTrips: [],
    places: [],
    placeAvailabilities: []
  });

  useEffect(() => {
    (async () => {
      const d = await getSummaryData(year);
      setData(d);
    })();
  }, [year]);

  const ranking = useMemo(() => {
    const availMap = new Map();
    const placeMap = new Map();

    for (const a of data.availabilities) {
      if (!availMap.has(a.day)) availMap.set(a.day, new Set());
      availMap.get(a.day).add(a.user_id);
    }

    for (const p of data.placeAvailabilities) {
      if (!placeMap.has(p.day)) placeMap.set(p.day, 0);
      placeMap.set(p.day, placeMap.get(p.day) + 1);
    }

    const days = new Set([...availMap.keys(), ...placeMap.keys()]);

    return [...days]
      .map((day) => ({
        day,
        availableCount: availMap.get(day)?.size || 0,
        placeCount: placeMap.get(day) || 0
      }))
      .sort((a, b) => {
        if (b.availableCount !== a.availableCount) return b.availableCount - a.availableCount;
        return b.placeCount - a.placeCount;
      });
  }, [data]);

  const dailyRows = useMemo(() => ranking.slice(0, 30), [ranking]);

  return (
    <>
      <BestDates ranking={ranking} />
      <div className="card">
        <h2>Récapitulatif global</h2>
        <p>Disponibilités: {data.availabilities.length} entrées</p>
        <p>Vacances prévues: {data.plannedTrips.length} entrées</p>
        <p>Lieux: {data.places.length}</p>
        <p>Disponibilités de lieux: {data.placeAvailabilities.length} entrées</p>
      </div>
      <div className="card">
        <h2>Top dates (vue rapide)</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left">Date</th>
                <th align="left">Personnes disponibles</th>
                <th align="left">Lieux disponibles</th>
              </tr>
            </thead>
            <tbody>
              {dailyRows.map((row) => (
                <tr key={row.day}>
                  <td>{row.day}</td>
                  <td>{row.availableCount}</td>
                  <td>{row.placeCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
