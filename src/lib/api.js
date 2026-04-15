import { supabase } from "./supabase";
import { seasonRange } from "./date";

export async function verifyUser(name, pin) {
  const { data, error } = await supabase.rpc("rpc_verify_user", { p_name: name, p_pin: pin });
  if (error) throw error;
  return data;
}

export async function toggleAvailability(userId, pin, day) {
  const { error } = await supabase.rpc("rpc_toggle_availability", {
    p_user_id: userId,
    p_pin: pin,
    p_day: day
  });
  if (error) throw error;
}

export async function togglePlannedTrip(userId, pin, day) {
  const { error } = await supabase.rpc("rpc_toggle_planned_trip", {
    p_user_id: userId,
    p_pin: pin,
    p_day: day
  });
  if (error) throw error;
}

export async function createPlace(userId, pin, name) {
  const { data, error } = await supabase.rpc("rpc_create_place", {
    p_user_id: userId,
    p_pin: pin,
    p_name: name
  });
  if (error) throw error;
  return data;
}

export async function updatePlaceName(userId, pin, placeId, name) {
  const { error } = await supabase.rpc("rpc_update_place_name", {
    p_user_id: userId,
    p_pin: pin,
    p_place_id: placeId,
    p_name: name
  });
  if (error) throw error;
}

export async function deletePlace(userId, pin, placeId) {
  const { error } = await supabase.rpc("rpc_delete_place", {
    p_user_id: userId,
    p_pin: pin,
    p_place_id: placeId
  });
  if (error) throw error;
}

export async function togglePlaceAvailability(userId, pin, placeId, day) {
  const { error } = await supabase.rpc("rpc_toggle_place_availability", {
    p_user_id: userId,
    p_pin: pin,
    p_place_id: placeId,
    p_day: day
  });
  if (error) throw error;
}

export async function getUserDaySet(tableName, userId, year) {
  const { from, to } = seasonRange(year);
  const { data, error } = await supabase
    .from(tableName)
    .select("day")
    .eq("user_id", userId)
    .gte("day", from)
    .lte("day", to);

  if (error) throw error;
  return new Set((data ?? []).map((r) => r.day));
}

export async function getSummaryData(year) {
  const { from, to } = seasonRange(year);
  const [usersRes, availRes, tripsRes, placesRes, placeAvailRes] = await Promise.all([
    supabase.from("public_users").select("id,name"),
    supabase.from("availabilities").select("user_id,day").gte("day", from).lte("day", to),
    supabase.from("planned_trips").select("user_id,day").gte("day", from).lte("day", to),
    supabase.from("places").select("id,name,user_id"),
    supabase.from("place_availabilities").select("place_id,day").gte("day", from).lte("day", to)
  ]);

  for (const r of [usersRes, availRes, tripsRes, placesRes, placeAvailRes]) {
    if (r.error) throw r.error;
  }

  return {
    users: usersRes.data ?? [],
    availabilities: availRes.data ?? [],
    plannedTrips: tripsRes.data ?? [],
    places: placesRes.data ?? [],
    placeAvailabilities: placeAvailRes.data ?? []
  };
}

export async function getMyPlacesWithDays(userId, year) {
  const { from, to } = seasonRange(year);
  const { data: places, error: pErr } = await supabase
    .from("places")
    .select("id,name,user_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (pErr) throw pErr;
  const ids = (places ?? []).map((p) => p.id);
  if (ids.length === 0) return [];

  const { data: avail, error: aErr } = await supabase
    .from("place_availabilities")
    .select("place_id,day")
    .in("place_id", ids)
    .gte("day", from)
    .lte("day", to);

  if (aErr) throw aErr;

  return (places ?? []).map((p) => ({
    ...p,
    days: new Set((avail ?? []).filter((a) => a.place_id === p.id).map((a) => a.day))
  }));
}
