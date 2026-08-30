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
import SuperAdminLogin from './pages/SuperAdminLogin'
import SuperAdminLayout from './layouts/SuperAdminLayout'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import SuperAdminUsers from './pages/SuperAdminUsers'

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

      <Route path="/superadmin/login" element={<SuperAdminLogin />} />
      <Route path="/superadmin" element={
        <ProtectedRoute>
          <SuperAdminLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="users" element={<SuperAdminUsers />} />
      </Route>
    </Routes>
  )
}

export default App
