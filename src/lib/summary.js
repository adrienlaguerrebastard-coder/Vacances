export function computeRanking({ availabilities, placeAvailabilities, userMap, placeNameMap }) {
  const availMap = new Map();
  const placeMap = new Map();

  for (const a of availabilities) {
    if (!availMap.has(a.day)) availMap.set(a.day, new Set());
    availMap.get(a.day).add(a.user_id);
  }

  for (const p of placeAvailabilities) {
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
}

export function makeCsv(rows, headers) {
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const lines = [headers.map((h) => escape(h.label)).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(h.get(row))).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function isDayInRange(day, from, to) {
  if (!from && !to) return true;
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}
