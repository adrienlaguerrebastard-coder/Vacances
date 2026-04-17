import { useEffect, useMemo, useState } from "react";
import BestDates from "../components/BestDates";
import { getSeasonYear, seasonRange } from "../lib/date";
import { getSummaryData } from "../lib/api";
import { computeRanking, isDayInRange, makeCsv } from "../lib/summary";

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
const NOTES_KEY = "vacances_notes_by_day";
const PREFERENCES_KEY = "vacances_day_preferences";

function downloadCsv(fileName, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export default function SummaryPage() {
  const [year] = useState(getSeasonYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [personFilter, setPersonFilter] = useState("");
  const [placeFilter, setPlaceFilter] = useState("");
  const [fromDay, setFromDay] = useState("");
  const [toDay, setToDay] = useState("");
  const [noteDay, setNoteDay] = useState("");
  const [noteText, setNoteText] = useState("");
  const [data, setData] = useState({
    users: [],
    availabilities: [],
    plannedTrips: [],
    places: [],
    placeAvailabilities: []
  });
  const [notesByDay, setNotesByDay] = useState({});
  const [preferences, setPreferences] = useState({ must: [], impossible: [] });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const d = await getSummaryData(year);
        setData(d);
      } catch (err) {
        setError(err.message || "Impossible de charger le récapitulatif.");
      } finally {
        setLoading(false);
      }
    })();
  }, [year]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
      setNotesByDay(saved || {});
    } catch {
      setNotesByDay({});
    }
    try {
      const pref = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{"must":[],"impossible":[]}');
      setPreferences({
        must: Array.isArray(pref.must) ? pref.must : [],
        impossible: Array.isArray(pref.impossible) ? pref.impossible : []
      });
    } catch {
      setPreferences({ must: [], impossible: [] });
    }
  }, []);

  const userMap = useMemo(() => new Map(data.users.map((u) => [u.id, u.name])), [data.users]);
  const placeNameMap = useMemo(() => new Map(data.places.map((p) => [p.id, p.name])), [data.places]);

  const fullRanking = useMemo(
    () =>
      computeRanking({
        availabilities: data.availabilities,
        placeAvailabilities: data.placeAvailabilities,
        userMap,
        placeNameMap
      }),
    [data.availabilities, data.placeAvailabilities, userMap, placeNameMap]
  );

  const ranking = useMemo(
    () =>
      fullRanking.filter((row) => {
        if (personFilter && !row.userNames.includes(personFilter)) return false;
        if (placeFilter && !row.placeNames.includes(placeFilter)) return false;
        return isDayInRange(row.day, fromDay, toDay);
      }),
    [fullRanking, personFilter, placeFilter, fromDay, toDay]
  );

  const dailyRows = useMemo(() => ranking.slice(0, 30), [ranking]);

  const userAvailability = useMemo(() => {
    const map = new Map();
    for (const a of data.availabilities) {
      if (!isDayInRange(a.day, fromDay, toDay)) continue;
      if (!map.has(a.user_id)) map.set(a.user_id, []);
      map.get(a.user_id).push(a.day);
    }
    return [...map.entries()]
      .map(([userId, days]) => ({ name: userMap.get(userId) || userId, days: days.slice().sort() }))
      .filter((u) => !personFilter || u.name === personFilter)
      .sort((a, b) => b.days.length - a.days.length);
  }, [data.availabilities, userMap, personFilter, fromDay, toDay]);

  const placeAvailability = useMemo(() => {
    const map = new Map();
    for (const p of data.placeAvailabilities) {
      if (!isDayInRange(p.day, fromDay, toDay)) continue;
      if (!map.has(p.place_id)) map.set(p.place_id, []);
      map.get(p.place_id).push(p.day);
    }
    return data.places
      .map((place) => ({
        name: place.name,
        owner: userMap.get(place.user_id) || place.user_id,
        days: (map.get(place.id) || []).slice().sort()
      }))
      .filter((p) => !placeFilter || p.name === placeFilter)
      .sort((a, b) => b.days.length - a.days.length);
  }, [data.places, data.placeAvailabilities, userMap, placeFilter, fromDay, toDay]);

  const uniqueUsers = useMemo(() => data.users.map((u) => u.name).sort(), [data.users]);
  const uniquePlaces = useMemo(() => data.places.map((p) => p.name).sort(), [data.places]);
  const mustSet = useMemo(() => new Set(preferences.must), [preferences.must]);
  const impossibleSet = useMemo(() => new Set(preferences.impossible), [preferences.impossible]);

  const saveNote = () => {
    if (!noteDay || !noteText.trim()) return;
    const next = { ...notesByDay, [noteDay]: noteText.trim() };
    setNotesByDay(next);
    localStorage.setItem(NOTES_KEY, JSON.stringify(next));
    setStatus("Note enregistrée.");
    setNoteText("");
  };

  const togglePreference = (day, type) => {
    if (!day) return;
    const current = new Set(preferences[type]);
    if (current.has(day)) current.delete(day);
    else current.add(day);
    const next = { ...preferences, [type]: [...current].sort() };
    setPreferences(next);
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
    setStatus(type === "must" ? "Date incontournable mise à jour." : "Date impossible mise à jour.");
  };

  const exportTopDatesCsv = () => {
    const csv = makeCsv(ranking, [
      { label: "Date", get: (r) => r.day },
      { label: "Nb personnes disponibles", get: (r) => r.availableCount },
      { label: "Personnes", get: (r) => r.userNames.join(" | ") },
      { label: "Nb lieux", get: (r) => r.placeCount },
      { label: "Lieux", get: (r) => r.placeNames.join(" | ") }
    ]);
    downloadCsv(`top-dates-${year}.csv`, csv);
  };

  const exportAvailabilitiesCsv = () => {
    const rows = userAvailability.map((u) => ({ ...u, ranges: toRanges(u.days) }));
    const csv = makeCsv(rows, [
      { label: "Personne", get: (r) => r.name },
      { label: "Nb jours", get: (r) => r.days.length },
      { label: "Dates", get: (r) => r.ranges }
    ]);
    downloadCsv(`disponibilites-${year}.csv`, csv);
  };

  const { from: seasonFrom, to: seasonTo } = seasonRange(year);

  return (
    <>
      <div className="card compact-card">
        <h2>Filtres et export</h2>
        <div className="filters-grid">
          <div>
            <label htmlFor="person-filter">Personne</label>
            <select id="person-filter" value={personFilter} onChange={(e) => setPersonFilter(e.target.value)}>
              <option value="">Toutes</option>
              {uniqueUsers.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="place-filter">Lieu</label>
            <select id="place-filter" value={placeFilter} onChange={(e) => setPlaceFilter(e.target.value)}>
              <option value="">Tous</option>
              {uniquePlaces.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="from-day">Du</label>
            <input
              id="from-day"
              type="date"
              min={seasonFrom}
              max={seasonTo}
              value={fromDay}
              onChange={(e) => setFromDay(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="to-day">Au</label>
            <input
              id="to-day"
              type="date"
              min={seasonFrom}
              max={seasonTo}
              value={toDay}
              onChange={(e) => setToDay(e.target.value)}
            />
          </div>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="secondary" type="button" onClick={exportTopDatesCsv}>
            Export CSV Top dates
          </button>
          <button className="secondary" type="button" onClick={exportAvailabilitiesCsv}>
            Export CSV disponibilités
          </button>
        </div>
        {status && (
          <p className="status success" role="status" aria-live="polite">
            {status}
          </p>
        )}
      </div>

      <BestDates ranking={ranking} />

      <div className="card">
        <h2>Préférences de groupe & notes</h2>
        <div className="row">
          <div style={{ minWidth: 180 }}>
            <label htmlFor="note-day">Date</label>
            <input
              id="note-day"
              type="date"
              min={seasonFrom}
              max={seasonTo}
              value={noteDay}
              onChange={(e) => setNoteDay(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label htmlFor="note-text">Note</label>
            <textarea
              id="note-text"
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Contrainte, préférence, info logistique..."
            />
          </div>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <button type="button" onClick={saveNote}>
            Enregistrer la note
          </button>
          <button className="secondary" type="button" onClick={() => togglePreference(noteDay, "must")}>
            Basculer incontournable
          </button>
          <button className="secondary" type="button" onClick={() => togglePreference(noteDay, "impossible")}>
            Basculer impossible
          </button>
        </div>
        <p className="small">Stockage local (navigateur actuel) pour faciliter la coordination.</p>
      </div>

      <div className="card">
        <h2>Disponibilités par personne</h2>
        {loading ? (
          <p>Chargement...</p>
        ) : error ? (
          <p className="status error" role="alert">
            {error}
          </p>
        ) : userAvailability.length === 0 ? (
          <p>Aucune disponibilité enregistrée.</p>
        ) : (
          <div className="table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse" }} aria-label="Disponibilités par personne">
              <thead>
                <tr>
                  <th scope="col" style={{ ...thStyle, minWidth: 110 }}>
                    Personne
                  </th>
                  <th scope="col" style={thStyle}>
                    Dates disponibles
                  </th>
                  <th scope="col" style={{ ...thStyle, whiteSpace: "nowrap" }}>
                    Nb jours
                  </th>
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
        {loading ? (
          <p>Chargement...</p>
        ) : placeAvailability.length === 0 ? (
          <p>Aucun lieu enregistré.</p>
        ) : (
          <div className="table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse" }} aria-label="Disponibilités des lieux">
              <thead>
                <tr>
                  <th scope="col" style={{ ...thStyle, minWidth: 110 }}>
                    Lieu
                  </th>
                  <th scope="col" style={{ ...thStyle, minWidth: 90 }}>
                    Propriétaire
                  </th>
                  <th scope="col" style={thStyle}>
                    Dates disponibles
                  </th>
                  <th scope="col" style={{ ...thStyle, whiteSpace: "nowrap" }}>
                    Nb jours
                  </th>
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
        {loading ? (
          <p>Chargement...</p>
        ) : dailyRows.length === 0 ? (
          <p>Aucune donnée pour le moment.</p>
        ) : (
          <div className="table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse" }} aria-label="Top dates">
              <thead>
                <tr>
                  <th scope="col" style={{ ...thStyle, whiteSpace: "nowrap", minWidth: 90 }}>
                    Date
                  </th>
                  <th scope="col" style={thStyle}>
                    Personnes disponibles
                  </th>
                  <th scope="col" style={thStyle}>
                    Lieux disponibles
                  </th>
                  <th scope="col" style={thStyle}>
                    Préférences
                  </th>
                  <th scope="col" style={thStyle}>
                    Note
                  </th>
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
                    <td style={{ ...tdStyle, fontSize: "0.9em" }}>
                      {mustSet.has(row.day) ? "Incontournable " : ""}
                      {impossibleSet.has(row.day) ? "Impossible" : ""}
                      {!mustSet.has(row.day) && !impossibleSet.has(row.day) ? "—" : ""}
                    </td>
                    <td style={{ ...tdStyle, fontSize: "0.9em" }}>{notesByDay[row.day] || "—"}</td>
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
