import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import TournamentsPage from './pages/TournamentsPage';
import TournamentPage from './pages/TournamentPage';
import MatchPage from './pages/MatchPage';
import PlayerPage from './pages/PlayerPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <div className="app-container">
      <div className="field-pattern" />

      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={loading ? null : user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/forgot-password"
          element={loading ? null : user ? <Navigate to="/" replace /> : <ForgotPasswordPage />}
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

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
