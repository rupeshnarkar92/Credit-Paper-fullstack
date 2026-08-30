import { Routes, Route, Navigate } from 'react-router-dom'
import Signup from './pages/Signup'
import Login from './pages/Login'
import CheckEmail from './pages/CheckEmail'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import ProtectedTest from './pages/ProtectedTest'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/check-email" element={<CheckEmail />} />
      <Route path="/verify" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route
        path="/protected-test"
        element={
          <ProtectedRoute>
            <ProtectedTest />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
