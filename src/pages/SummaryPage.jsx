import { useEffect, useMemo, useState } from "react";
import BestDates from "../components/BestDates";
import { getSeasonYear } from "../lib/date";
import { getSummaryData } from "../lib/api";

function formatDay(iso) {
  const [, m, d] = iso.split("-");
  const month = m === "07" ? "juil." : "août";
  return `${parseInt(d, 10)} ${month}`;
}

function toRanges(sortedDays) {
  if (sortedDays.length === 0) return "—";
  const ranges = [];
  let start = sortedDays[0];
  let prev = sortedDays[0];
  for (let i = 1; i < sortedDays.length; i++) {
    const diff = (new Date(sortedDays[i]) - new Date(prev)) / 86400000;
    if (diff === 1) {
      prev = sortedDays[i];
    } else {
      ranges.push(start === prev ? formatDay(start) : `${formatDay(start)} – ${formatDay(prev)}`);
      start = sortedDays[i];
      prev = sortedDays[i];
    }
  }
  ranges.push(start === prev ? formatDay(start) : `${formatDay(start)} – ${formatDay(prev)}`);
  return ranges.join(", ");
}

const thStyle = { paddingBottom: 8, paddingRight: 16, textAlign: "left", borderBottom: "1px solid #ddd" };
const tdStyle = { paddingTop: 8, paddingRight: 16, verticalAlign: "top" };

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

  const userMap = useMemo(() => new Map(data.users.map((u) => [u.id, u.name])), [data.users]);
  const placeNameMap = useMemo(() => new Map(data.places.map((p) => [p.id, p.name])), [data.places]);

  const ranking = useMemo(() => {
    const availMap = new Map();
    const placeMap = new Map();

    for (const a of data.availabilities) {
      if (!availMap.has(a.day)) availMap.set(a.day, new Set());
      availMap.get(a.day).add(a.user_id);
    }

    for (const p of data.placeAvailabilities) {
      if (!placeMap.has(p.day)) placeMap.set(p.day, new Set());
      placeMap.get(p.day).add(p.place_id);
    }

    const days = new Set([...availMap.keys(), ...placeMap.keys()]);

    return [...days]
      .map((day) => {
        const userIds = [...(availMap.get(day) ?? [])];
        const placeIds = [...(placeMap.get(day) ?? [])];
        return {
          day,
          availableCount: userIds.length,
          placeCount: placeIds.length,
          userNames: userIds.map((id) => userMap.get(id) || id),
          placeNames: placeIds.map((id) => placeNameMap.get(id) || id)
        };
      })
      .sort((a, b) => {
        if (b.availableCount !== a.availableCount) return b.availableCount - a.availableCount;
        return b.placeCount - a.placeCount;
      });
  }, [data, userMap, placeNameMap]);

  const dailyRows = useMemo(() => ranking.slice(0, 30), [ranking]);

  const userAvailability = useMemo(() => {
    const map = new Map();
    for (const a of data.availabilities) {
      if (!map.has(a.user_id)) map.set(a.user_id, []);
      map.get(a.user_id).push(a.day);
    }
    return [...map.entries()]
      .map(([userId, days]) => ({ name: userMap.get(userId) || userId, days: days.slice().sort() }))
      .sort((a, b) => b.days.length - a.days.length);
  }, [data.availabilities, userMap]);

  const placeAvailability = useMemo(() => {
    const map = new Map();
    for (const p of data.placeAvailabilities) {
      if (!map.has(p.place_id)) map.set(p.place_id, []);
      map.get(p.place_id).push(p.day);
    }
    return data.places
      .map((place) => ({
        name: place.name,
        owner: userMap.get(place.user_id) || place.user_id,
        days: (map.get(place.id) || []).slice().sort()
      }))
      .sort((a, b) => b.days.length - a.days.length);
  }, [data.places, data.placeAvailabilities, userMap]);

  return (
    <>
      <BestDates ranking={ranking} />

      <div className="card">
        <h2>Disponibilités par personne</h2>
        {userAvailability.length === 0 ? (
          <p>Aucune disponibilité enregistrée.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, minWidth: 110 }}>Personne</th>
                  <th style={thStyle}>Dates disponibles</th>
                  <th style={{ ...thStyle, whiteSpace: "nowrap" }}>Nb jours</th>
                </tr>
              </thead>
              <tbody>
                {userAvailability.map((u) => (
                  <tr key={u.name}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{u.name}</td>
                    <td style={{ ...tdStyle, lineHeight: 1.7, fontSize: "0.9em" }}>{toRanges(u.days)}</td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{u.days.length} j</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Disponibilités des lieux</h2>
        {placeAvailability.length === 0 ? (
          <p>Aucun lieu enregistré.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, minWidth: 110 }}>Lieu</th>
                  <th style={{ ...thStyle, minWidth: 90 }}>Propriétaire</th>
                  <th style={thStyle}>Dates disponibles</th>
                  <th style={{ ...thStyle, whiteSpace: "nowrap" }}>Nb jours</th>
                </tr>
              </thead>
              <tbody>
                {placeAvailability.map((p) => (
                  <tr key={p.name + p.owner}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{p.name}</td>
                    <td style={tdStyle}>{p.owner}</td>
                    <td style={{ ...tdStyle, lineHeight: 1.7, fontSize: "0.9em" }}>
                      {p.days.length > 0 ? toRanges(p.days) : "—"}
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{p.days.length} j</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Top dates</h2>
        {dailyRows.length === 0 ? (
          <p>Aucune donnée pour le moment.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, whiteSpace: "nowrap", minWidth: 90 }}>Date</th>
                  <th style={thStyle}>Personnes disponibles</th>
                  <th style={thStyle}>Lieux disponibles</th>
                </tr>
              </thead>
              <tbody>
                {dailyRows.map((row) => (
                  <tr key={row.day}>
                    <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: "nowrap" }}>{formatDay(row.day)}</td>
                    <td style={{ ...tdStyle, fontSize: "0.9em" }}>
                      {row.userNames.length > 0 ? row.userNames.join(", ") : "—"}
                    </td>
                    <td style={{ ...tdStyle, fontSize: "0.9em" }}>
                      {row.placeNames.length > 0 ? row.placeNames.join(", ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
