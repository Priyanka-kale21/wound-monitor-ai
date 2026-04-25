import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [condition, setCondition] = useState('');
  const [role, setRole] = useState('patient');
  const [doctorAccessCode, setDoctorAccessCode] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      console.log('Attempting login to:', '/token');
      const response = await fetch('/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Invalid credentials');
      }

      const data = await response.json();
      console.log('Login successful:', data);
      
      login({
        token: data.access_token,
        role: data.role,
        patientId: data.patient_id,
        username: email,
        isVerified: data.is_verified
      });
      
      if (data.role === 'doctor') {
        navigate('/doctor');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    const registerData = {
      email: email,
      password: password,
      role: role,
      name: role === 'patient' ? name : null,
      age: role === 'patient' ? parseInt(age) || 0 : null,
      condition: role === 'patient' ? condition : null,
      doctor_access_code: role === 'doctor' ? doctorAccessCode : null
    };

    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      setRegisterSuccess(true);
      setIsRegisterMode(false);
      setEmail('');
      setPassword('');
      setName('');
      setAge('');
      setCondition('');
      setDoctorAccessCode('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(45, 212, 191, 0.1) 0%, transparent 70%)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(129, 140, 248, 0.1) 0%, transparent 70%)',
        zIndex: 0
      }} />

      <div className="card glass-panel fade-in" style={{ 
        maxWidth: '480px', 
        width: '100%', 
        padding: '48px',
        zIndex: 1,
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            margin: '0 0 8px 0',
            background: 'linear-gradient(135deg, #2DD4BF 0%, #818CF8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            WoundMonitor
          </h1>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>
            {isRegisterMode ? 'Join our clinical network' : 'Secure Clinical Login'}
          </p>
        </div>
        
        {error && (
          <div className="badge badge-danger" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '24px', 
            padding: '12px 16px',
            borderRadius: '12px',
            width: '100%'
          }}>
            <span style={{ fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}
        
        {registerSuccess && (
          <div className="badge badge-success" style={{ 
            display: 'block', 
            marginBottom: '24px', 
            padding: '12px',
            borderRadius: '12px',
            width: '100%'
          }}>
            Account created! Please login.
          </div>
        )}

        <form onSubmit={isRegisterMode ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Email Address</label>
            <input 
              type="email" 
              placeholder="e.g. doctor@clinic.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%' }}
              required 
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%' }}
              required 
            />
          </div>
          
          {isRegisterMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.4s ease' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Account Role</label>
                <select 
                  value={role} 
                  onChange={(e) => { setRole(e.target.value); setError(''); }}
                  style={{ width: '100%' }}
                >
                  <option value="patient">Patient User</option>
                  <option value="doctor">Medical Professional</option>
                </select>
              </div>
              
              {role === 'patient' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ textAlign: 'left' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Full Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter patient name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      style={{ width: '100%' }}
                      required 
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ textAlign: 'left' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Age</label>
                      <input 
                        type="number" 
                        placeholder="Age" 
                        value={age} 
                        onChange={(e) => setAge(e.target.value)}
                        style={{ width: '100%' }}
                        required 
                      />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Condition</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Diabetic" 
                        value={condition} 
                        onChange={(e) => setCondition(e.target.value)}
                        style={{ width: '100%' }}
                        required 
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {role === 'doctor' && (
                <div style={{ textAlign: 'left', animation: 'fadeIn 0.3s ease' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Clinical Access Code</label>
                  <input 
                    type="password" 
                    placeholder="Enter security code" 
                    value={doctorAccessCode} 
                    onChange={(e) => setDoctorAccessCode(e.target.value)}
                    style={{ width: '100%' }}
                    required 
                  />
                </div>
              )}
            </div>
          )}
          
          <button type="submit" className="btn btn-primary" style={{ marginTop: '12px', width: '100%', height: '52px', fontSize: '1.1rem' }}>
            {isRegisterMode ? 'Create Clinical Account' : 'Authenticate'}
          </button>
        </form>

        <div style={{ marginTop: '32px', fontSize: '1rem' }}>
          {isRegisterMode ? (
            <p className="text-muted">Already registered? <button onClick={() => {setIsRegisterMode(false); setError(''); setRegisterSuccess(false);}} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}>Sign In</button></p>
          ) : (
            <p className="text-muted">New to the network? <button onClick={() => {setIsRegisterMode(true); setError(''); setRegisterSuccess(false);}} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}>Register here</button></p>
          )}
        </div>
      </div>
    </div>
  );
}
