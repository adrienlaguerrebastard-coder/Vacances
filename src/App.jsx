import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AuthGate from "./components/AuthGate";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import AvailabilityPage from "./pages/AvailabilityPage";
import PlannedTripsPage from "./pages/PlannedTripsPage";
import PlacesPage from "./pages/PlacesPage";
import SummaryPage from "./pages/SummaryPage";
import HelpPage from "./pages/HelpPage";

const SESSION_KEY = "vacances_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function isValidSession(rawSession) {
  return rawSession?.user?.id && rawSession?.user?.name && rawSession?.expiresAt > Date.now();
}

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (isValidSession(parsed)) {
        setSession(parsed.user);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    const renew = () => {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          user: session,
          expiresAt: Date.now() + SESSION_TTL_MS
        })
      );
    };
    const events = ["click", "keydown", "touchstart"];
    events.forEach((evt) => window.addEventListener(evt, renew, { passive: true }));
    return () => events.forEach((evt) => window.removeEventListener(evt, renew));
  }, [session]);

  const onLogin = (nextSession) => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        user: nextSession,
        expiresAt: Date.now() + SESSION_TTL_MS
      })
    );
    setSession(nextSession);
  };

  const onLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  if (!session) return <AuthGate onLogin={onLogin} />;

  return (
    <Layout session={session} onLogout={onLogout}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/disponibilites" element={<AvailabilityPage session={session} />} />
        <Route path="/vacances-prevues" element={<PlannedTripsPage session={session} />} />
        <Route path="/lieux" element={<PlacesPage session={session} />} />
        <Route path="/recap" element={<SummaryPage />} />
        <Route path="/aide" element={<HelpPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
