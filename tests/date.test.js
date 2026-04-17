import test from "node:test";
import assert from "node:assert/strict";
import { getDaysOfMonthUTC, monthLabel, seasonRange, toISO } from "../src/lib/date.js";

test("getDaysOfMonthUTC returns all days for July", () => {
  const days = getDaysOfMonthUTC(2026, 7);
  assert.equal(days.length, 31);
  assert.equal(toISO(days[0]), "2026-07-01");
  assert.equal(toISO(days[30]), "2026-07-31");
});

test("monthLabel returns French labels", () => {
  assert.equal(monthLabel(7), "Juillet");
  assert.equal(monthLabel(8), "Août");
});

test("seasonRange returns expected summer range", () => {
  assert.deepEqual(seasonRange(2026), { from: "2026-07-01", to: "2026-08-31" });
});
