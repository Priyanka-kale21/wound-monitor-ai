import React, { useState, useEffect, useContext } from 'react';
import { AlertCircle, CheckCircle, Clock, Search, Filter, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const API_URL = '';

export default function DoctorDashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const navigate = useNavigate();
  const { authData } = useContext(AuthContext);

  const isVerified = authData?.isVerified ?? false;

  useEffect(() => {
    if (isVerified) {
      fetchPatients();
    }
  }, [isVerified]);

  const fetchPatients = async () => {
    if (!isVerified) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/doctor/patients`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (err) {
      console.error("Failed to fetch patients", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="app-container"><div className="loader" style={{margin: '40px auto'}}></div></div>;

  if (!authData?.isVerified) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="card glass-panel fade-in" style={{ maxWidth: '600px', textAlign: 'center', padding: '60px' }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            background: 'rgba(251, 191, 36, 0.1)', 
            borderRadius: '30px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 32px auto',
            border: '1px solid rgba(251, 191, 36, 0.2)'
          }}>
            <ShieldAlert size={48} color="var(--warning)" />
          </div>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '16px' }}>Clinical Verification</h2>
          <p className="text-muted" style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '32px' }}>
            Your account is currently under clinical review. Access to patient data and diagnostic tools 
            will be activated once your medical credentials have been verified by our security board.
          </p>
          
          <div style={{ 
            background: 'rgba(30, 41, 59, 0.5)', 
            padding: '24px', 
            borderRadius: '16px', 
            border: '1px solid var(--border)',
            textAlign: 'left',
            marginBottom: '40px'
          }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary)' }}>
              SECURITY NOTICE:
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>Verification typically completes within 12 business hours.</li>
              <li>Patient privacy regulations restrict data access to verified personnel.</li>
              <li>Contact administration if you require urgent activation.</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ minWidth: '160px' }}>
              Verify Status
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem("wound_auth");
                window.location.href = "/login";
              }} 
              className="btn btn-secondary"
              style={{ minWidth: '160px' }}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Process patients to determine risk
  const processedPatients = patients.map(patient => {
    const latestAnalysis = patient.analyses.length > 0 
      ? patient.analyses[patient.analyses.length - 1] 
      : null;
    
    let riskLevel = 'low';
    if (latestAnalysis) {
      if (latestAnalysis.infection_risk || latestAnalysis.healing_score < 50) {
        riskLevel = 'high';
      } else if (latestAnalysis.healing_score < 75 || latestAnalysis.pus_detected || latestAnalysis.redness_detected) {
        riskLevel = 'medium';
      }
    }

    return { ...patient, latestAnalysis, riskLevel };
  });

  // Alerts
  const highRiskPatients = processedPatients.filter(p => p.riskLevel === 'high');

  // Filtering and Searching
  const filteredPatients = processedPatients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'all' || p.riskLevel === filterRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="fade-in">
      <div className="header" style={{ borderBottom: 'none' }}>
        <div>
          <h2 style={{ fontSize: '2.4rem', marginBottom: '8px' }}>Clinical Workspace</h2>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>AI-Assisted Patient Triage & Diagnostic Intelligence</p>
        </div>
        <button className="btn btn-primary" onClick={fetchPatients} style={{ height: '52px' }}>
          Sync Real-time Data
        </button>
      </div>

      {/* Triage Alert Banner */}
      {highRiskPatients.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <div style={{ 
            background: 'linear-gradient(90deg, rgba(251, 113, 133, 0.15) 0%, rgba(15, 23, 42, 0.1) 100%)', 
            borderLeft: '6px solid var(--danger)', 
            padding: '28px', 
            borderRadius: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '24px' 
          }}>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              background: 'rgba(251, 113, 133, 0.2)', 
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertCircle color="var(--danger)" size={32} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.4rem', color: '#FDA4AF', fontWeight: '700' }}>Critical Patient Intervention</h4>
              <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '1.05rem' }}>
                <strong style={{ color: '#FB7185' }}>{highRiskPatients.length} medical records</strong> require immediate clinical review due to infection markers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Intelligence Controls */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '40px', flexWrap: 'wrap' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: 'rgba(30, 41, 59, 0.5)', 
          padding: '16px 24px', 
          borderRadius: '18px', 
          border: '1px solid var(--border)', 
          flex: 1, 
          minWidth: '350px' 
        }}>
          <Search size={22} color="var(--text-muted)" style={{ marginRight: '16px' }} />
          <input 
            type="text" 
            placeholder="Query clinical records by name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', padding: 0, fontSize: '1.1rem' }}
          />
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: 'rgba(30, 41, 59, 0.5)', 
          padding: '16px 24px', 
          borderRadius: '18px', 
          border: '1px solid var(--border)' 
        }}>
          <Filter size={22} color="var(--text-muted)" style={{ marginRight: '16px' }} />
          <select 
            value={filterRisk} 
            onChange={(e) => setFilterRisk(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', cursor: 'pointer', padding: 0, fontSize: '1.1rem', fontWeight: '500' }}
          >
            <option value="all">Filter by Triage Tier</option>
            <option value="high">Tier 1: Critical</option>
            <option value="medium">Tier 2: Moderate</option>
            <option value="low">Tier 3: Stable</option>
          </select>
        </div>
      </div>
      
      {/* Clinical Record Grid */}
      <div className="dashboard-grid">
        {filteredPatients.map(patient => {
          const { latestAnalysis, riskLevel } = patient;
          
          let statusColor = 'var(--text-muted)';
          let statusBg = 'rgba(148, 163, 184, 0.1)';
          if (riskLevel === 'high') { statusColor = 'var(--danger)'; statusBg = 'rgba(251, 113, 133, 0.15)'; }
          if (riskLevel === 'medium') { statusColor = 'var(--warning)'; statusBg = 'rgba(251, 191, 36, 0.15)'; }
          if (riskLevel === 'low') { statusColor = 'var(--success)'; statusBg = 'rgba(52, 211, 153, 0.15)'; }

          return (
            <div 
              key={patient.id} 
              className="card" 
              onClick={() => navigate(`/doctor/patient/${patient.id}`)}
              style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden', border: '1px solid var(--border)' }}
            >
              {/* Vertical status indicator */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: statusColor }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '6px' }}>{patient.name}</h3>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className="text-muted" style={{ fontSize: '0.9rem', fontWeight: '600' }}>#{patient.id.toString().padStart(4, '0')}</span>
                    <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
                    <span className="text-muted" style={{ fontSize: '0.9rem' }}>{patient.age}Y • {patient.condition}</span>
                  </div>
                </div>
                <div style={{ 
                  background: statusBg, 
                  color: statusColor, 
                  padding: '8px 14px', 
                  borderRadius: '10px', 
                  fontSize: '0.8rem', 
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {riskLevel}
                </div>
              </div>
              
              <div style={{ margin: '28px 0', padding: '20px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {latestAnalysis ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-muted)' }}>Healing Progress</span>
                      <span style={{ fontWeight: '800', color: latestAnalysis.healing_score > 75 ? 'var(--success)' : 'var(--warning)', fontSize: '1.2rem' }}>
                        {latestAnalysis.healing_score.toFixed(1)}%
                      </span>
                    </div>
                    {/* Performance Visualizer */}
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${latestAnalysis.healing_score}%`, 
                        height: '100%', 
                        background: `linear-gradient(90deg, ${statusColor} 0%, ${statusColor}88 100%)`,
                        borderRadius: '4px',
                        boxShadow: `0 0 15px ${statusColor}44`
                      }} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      {latestAnalysis.infection_risk && <span className="badge badge-danger">Infection Risk</span>}
                      {latestAnalysis.pus_detected && <span className="badge badge-warning">Exudate Detected</span>}
                      {!latestAnalysis.infection_risk && !latestAnalysis.pus_detected && <span className="badge badge-success">On Recovery</span>}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--text-muted)', fontSize: '1rem', fontStyle: 'italic' }}>
                    Awaiting primary diagnostic data.
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <Clock size={16} />
                  <span>{latestAnalysis ? new Date(latestAnalysis.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}</span>
                </div>
                <div style={{ color: 'var(--primary)', fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Analyze Record <span style={{ fontSize: '1.2rem' }}>→</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
