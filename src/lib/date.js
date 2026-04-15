export function getSeasonYear() {
  const now = new Date();
  return now.getMonth() > 7 ? now.getFullYear() + 1 : now.getFullYear();
}

export function toISO(date) {
  return date.toISOString().slice(0, 10);
}

export function makeDate(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day));
}

export function getDaysOfMonthUTC(year, month) {
  const days = [];
  const total = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let d = 1; d <= total; d += 1) {
    days.push(makeDate(year, month, d));
  }
  return days;
}

export function monthLabel(month) {
  return month === 7 ? "Juillet" : "Août";
}

export function seasonRange(year) {
  return { from: `${year}-07-01`, to: `${year}-08-31` };
}
