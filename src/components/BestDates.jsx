export default function BestDates({ ranking }) {
  return (
    <div className="card">
      <h2>Meilleures dates</h2>
      {ranking.length === 0 && <p>Aucune donnée pour le moment.</p>}
      {ranking.length > 0 && (
        <ol>
          {ranking.slice(0, 20).map((r) => (
            <li key={r.day}>
              <strong>{r.day}</strong> — {r.availableCount} dispo{r.placeCount > 0 ? `, ${r.placeCount} lieu(x)` : ", aucun lieu"}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
