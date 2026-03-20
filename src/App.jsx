import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';

const LoginPage          = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('./pages/ResetPasswordPage'));
const JoinPage           = lazy(() => import('./pages/JoinPage'));
const StatsPage          = lazy(() => import('./pages/StatsPage'));
const TournamentsPage    = lazy(() => import('./pages/TournamentsPage'));
const TournamentPage     = lazy(() => import('./pages/TournamentPage'));
const MatchPage          = lazy(() => import('./pages/MatchPage'));
const PlayerPage         = lazy(() => import('./pages/PlayerPage'));

function AppLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ fontFamily: 'Oswald', fontSize: 22, color: 'var(--accent-gold)', letterSpacing: 2 }}>
        PRONOKING
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <AppLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <div className="app-container">
      <div className="field-pattern" />

      <Suspense fallback={<AppLoader />}>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={loading ? <AppLoader /> : user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/forgot-password"
          element={loading ? <AppLoader /> : user ? <Navigate to="/" replace /> : <ForgotPasswordPage />}
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/join/:id" element={<JoinPage />} />
        <Route
          path="/stats"
          element={
            <ProtectedRoute>
              <Navbar />
              <div className="container">
                <StatsPage />
              </div>
            </ProtectedRoute>
          }
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
      </Suspense>
    </div>
  );
}
