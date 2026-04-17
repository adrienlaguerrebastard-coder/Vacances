import test from "node:test";
import assert from "node:assert/strict";
import { computeRanking, isDayInRange, makeCsv } from "../src/lib/summary.js";

test("computeRanking sorts by available users then places", () => {
  const ranking = computeRanking({
    availabilities: [
      { user_id: "u1", day: "2026-07-10" },
      { user_id: "u2", day: "2026-07-10" },
      { user_id: "u1", day: "2026-07-11" }
    ],
    placeAvailabilities: [
      { place_id: "p1", day: "2026-07-10" },
      { place_id: "p2", day: "2026-07-11" }
    ],
    userMap: new Map([
      ["u1", "Adrien"],
      ["u2", "Camille"]
    ]),
    placeNameMap: new Map([
      ["p1", "Maison A"],
      ["p2", "Maison B"]
    ])
  });

  assert.equal(ranking[0].day, "2026-07-10");
  assert.equal(ranking[0].availableCount, 2);
  assert.equal(ranking[0].placeCount, 1);
  assert.deepEqual(ranking[0].userNames, ["Adrien", "Camille"]);
});

test("isDayInRange handles empty and bounded ranges", () => {
  assert.equal(isDayInRange("2026-07-10", "", ""), true);
  assert.equal(isDayInRange("2026-07-10", "2026-07-01", "2026-07-31"), true);
  assert.equal(isDayInRange("2026-08-01", "2026-07-01", "2026-07-31"), false);
});

test("makeCsv escapes values and includes headers", () => {
  const csv = makeCsv(
    [{ name: 'Lieu "A"', days: "2026-07-10" }],
    [
      { label: "Nom", get: (row) => row.name },
      { label: "Date", get: (row) => row.days }
    ]
  );
  assert.match(csv, /"Nom","Date"/);
  assert.match(csv, /"Lieu ""A""","2026-07-10"/);
});
