import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import ImageCapture from './components/ImageCapture';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDetails from './pages/PatientDetails';
import Login from './pages/Login';
import { AuthContext } from './context/AuthContext';

function Navigation() {
  const location = useLocation();
  const { authData, logout } = useContext(AuthContext);

  if (!authData) return null;

  const isDoctorUnverified = authData.role === 'doctor' && !authData.isVerified;

  return (
    <header className="header" style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)', background: 'rgba(15, 23, 42, 0.8)' }}>
      <div className="app-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 24px' }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: '1.8rem', 
          fontWeight: '800',
          background: 'linear-gradient(135deg, #2DD4BF 0%, #818CF8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          WoundMonitor
        </h2>
        <nav className="nav-links">
          {authData.role === 'patient' && (
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>My Healing</Link>
          )}
          {authData.role === 'doctor' && (
            <>
              <Link to="/doctor" className={location.pathname === '/doctor' ? 'active' : ''}>Clinical Dashboard</Link>
              {isDoctorUnverified && (
                <span className="badge badge-warning" style={{ marginLeft: '8px' }}>
                  Verification Required
                </span>
              )}
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '16px' }}>
            <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F172A', fontWeight: '700', fontSize: '0.85rem' }}>
                {(authData.username || 'U').charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '500' }}>{authData.username || 'User'}</span>
            </div>
            <button onClick={logout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              Logout
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

const ProtectedRoute = ({ children, allowedRole }) => {
  const { authData } = useContext(AuthContext);
  
  if (!authData) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && authData.role !== allowedRole) {
    return <Navigate to={authData.role === 'doctor' ? "/doctor" : "/"} replace />;
  }
  
  // For doctors, allow access but let DoctorDashboard handle the unverified state
  // Don't block access here - it causes infinite redirect loops
  
  return children;
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute allowedRole="patient">
                <ImageCapture />
              </ProtectedRoute>
            } />
            
            <Route path="/doctor" element={
              <ProtectedRoute allowedRole="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            } />

            <Route path="/doctor/patient/:id" element={
              <ProtectedRoute allowedRole="doctor">
                <PatientDetails />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
