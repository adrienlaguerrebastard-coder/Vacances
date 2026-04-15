import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AuthGate from "./components/AuthGate";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import AvailabilityPage from "./pages/AvailabilityPage";
import PlannedTripsPage from "./pages/PlannedTripsPage";
import PlacesPage from "./pages/PlacesPage";
import SummaryPage from "./pages/SummaryPage";

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("vacances_session");
    if (raw) setSession(JSON.parse(raw));
  }, []);

  const onLogin = (nextSession) => {
    localStorage.setItem("vacances_session", JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const onLogout = () => {
    localStorage.removeItem("vacances_session");
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
