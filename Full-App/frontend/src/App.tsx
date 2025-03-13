import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUp';
import ChatPage from './ChatPage';
import VerificationPage from './components/VerificationPage';
import LandingPage from './components/AuthPage';

function App() {
  return (
    <Router basename="/Regulatory_Agent-Frontend">
      <AuthProvider>
        <Routes>
          <Route
            path="/landing"
            element={
              <ProtectedRoute requireAuth={false}>
                <LandingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/login"
            element={
              <ProtectedRoute requireAuth={false}>
                <LoginPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <ProtectedRoute requireAuth={false}>
                <SignUpPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verification"
            element={
              <ProtectedRoute requireAuth={false}>
                <VerificationPage />
              </ProtectedRoute>
            }
          />

          {/* Forgot Password Route
          <Route
            path="/forgot-password"
            element={
              <ProtectedRoute requireAuth={false}>
                <ForgotPassword />
              </ProtectedRoute>
            }
          /> */}

          {/* Protected routes - accessible only when authenticated */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute requireAuth={true}>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute requireAuth={false}>
                <LandingPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;