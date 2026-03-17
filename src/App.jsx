import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import LoginPage from './pages/LoginPage';
import TournamentsPage from './pages/TournamentsPage';
import TournamentPage from './pages/TournamentPage';
import MatchPage from './pages/MatchPage';
import PlayerPage from './pages/PlayerPage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <div className="app-container">
      <div className="field-pattern" />

      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />

        {/* Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navbar />
              <div className="container">
                <TournamentsPage />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournament/:id"
          element={
            <ProtectedRoute>
              <Navbar />
              <div className="container">
                <TournamentPage />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournament/:tournamentId/match/:matchId"
          element={
            <ProtectedRoute>
              <Navbar />
              <div className="container">
                <MatchPage />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournament/:tournamentId/player/:playerId"
          element={
            <ProtectedRoute>
              <Navbar />
              <div className="container">
                <PlayerPage />
              </div>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
