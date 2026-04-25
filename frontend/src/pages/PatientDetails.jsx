import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle, Activity, Droplet } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import HealingTrend from '../components/HealingTrend';
import DoctorNotes from '../components/DoctorNotes';

const API_URL = '';

export default function PatientDetails() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const { authData } = useContext(AuthContext);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await fetch(`${API_URL}/doctor/patient/${id}`, {
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setPatient(data);
        }
      } catch (err) {
        console.error("Failed to fetch patient", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id, authData.token]);

  if (loading) return <div className="app-container"><div className="loader" style={{margin: '40px auto'}}></div></div>;
  if (!patient) return (
    <div className="app-container" style={{ textAlign: 'center', marginTop: '100px' }}>
      <div className="card glass-panel" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h3 className="text-muted">Clinical Record Not Found</h3>
        <Link to="/doctor" className="btn btn-secondary" style={{ marginTop: '20px' }}>Back to Dashboard</Link>
      </div>
    </div>
  );

  const analyses = patient.analyses || [];
  const latestAnalysis = analyses.length > 0 ? analyses[analyses.length - 1] : null;

  return (
    <div className="fade-in" style={{ paddingBottom: '60px' }}>
      <div className="header" style={{ marginBottom: '40px', borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/doctor" className="btn btn-secondary" style={{ padding: '10px', borderRadius: '12px' }}>
            <ArrowLeft size={22} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '2.4rem', margin: 0 }}>{patient.name}</h2>
              {latestAnalysis?.infection_risk && <span className="badge badge-danger" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>Critical Alert</span>}
            </div>
            <p className="text-muted" style={{ fontSize: '1.1rem', margin: '4px 0 0' }}>
              Record ID: #{patient.id.toString().padStart(4, '0')} • {patient.age}Y • {patient.condition}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
        
        {/* Diagnostic Insights */}
        <div className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Diagnostic Intelligence</h3>
            {latestAnalysis && <span className="text-muted" style={{ fontSize: '0.85rem' }}>Updated: {new Date(latestAnalysis.timestamp).toLocaleDateString()}</span>}
          </div>
          
          {latestAnalysis ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '12px', fontWeight: '600' }}>Healing Index</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '800', color: latestAnalysis.healing_score > 75 ? 'var(--success)' : (latestAnalysis.healing_score > 50 ? 'var(--warning)' : 'var(--danger)') }}>
                    {latestAnalysis.healing_score.toFixed(1)}%
                  </div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '12px', fontWeight: '600' }}>Infection Markers</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '800', color: latestAnalysis.infection_risk ? 'var(--danger)' : 'var(--success)', display: 'flex', justifyContent: 'center' }}>
                    {latestAnalysis.infection_risk ? <AlertCircle size={40}/> : <CheckCircle size={40}/>}
                  </div>
                </div>
              </div>
              
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500' }}>
                    <Activity size={20} color="var(--danger)"/> Erythema (Redness)
                  </span>
                  <span className={`badge ${latestAnalysis.redness_detected ? 'badge-danger' : 'badge-success'}`}>
                    {latestAnalysis.redness_detected ? 'Detected' : 'Normal'}
                  </span>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500' }}>
                    <Droplet size={20} color="var(--warning)"/> Purulent Exudate
                  </span>
                  <span className={`badge ${latestAnalysis.pus_detected ? 'badge-warning' : 'badge-success'}`}>
                    {latestAnalysis.pus_detected ? 'Present' : 'Absent'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
              <p className="text-muted" style={{ fontStyle: 'italic' }}>No diagnostic records available for this patient.</p>
            </div>
          )}
        </div>

        {/* Clinical Notes */}
        <div style={{ marginBottom: 0 }}>
          <DoctorNotes patientId={patient.id} />
        </div>
      </div>

      {/* Healing Analytics */}
      <div style={{ marginBottom: '32px' }}>
        <HealingTrend patientId={patient.id} />
      </div>

      {/* Clinical Imaging Archive */}
      <div className="card">
        <h3 style={{ marginBottom: '28px', fontSize: '1.4rem' }}>Clinical Imaging Archive</h3>
        {analyses.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {[...analyses].reverse().map(analysis => (
              <div key={analysis.id} style={{ 
                background: 'rgba(15, 23, 42, 0.4)', 
                borderRadius: '16px', 
                border: '1px solid var(--border)', 
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ height: '180px', backgroundColor: '#0F172A', position: 'relative' }}>
                  {analysis.image_path ? (
                    <img 
                      src={`/${analysis.image_path}`} 
                      alt="Wound Diagnostic" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="text-muted">No Image Data</span>
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    {analysis.infection_risk ? <span className="badge badge-danger">Risk</span> : <span className="badge badge-success">Clear</span>}
                  </div>
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>
                    {new Date(analysis.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>Score: {analysis.healing_score.toFixed(1)}%</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>View Details</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No historical clinical images recorded.
          </div>
        )}
      </div>
    </div>
  );
}
