import React, { useState, useEffect, useContext } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AuthContext } from '../context/AuthContext';

const API_URL = '';

export default function HealingTrend({ patientId, triggerUpdate }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { authData } = useContext(AuthContext);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!authData?.token || !patientId) return;
      try {
        const res = await fetch(`${API_URL}/patients/${patientId}`, {
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });
        if (res.ok) {
          const patient = await res.json();
          if (patient && patient.analyses) {
            const chartData = patient.analyses.map(a => ({
              date: new Date(a.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
              score: a.healing_score,
              infectionRisk: a.infection_risk
            }));
            
            // Recharts needs chronological order (oldest to newest)
            setData([...chartData].reverse());
          }
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [patientId, triggerUpdate, authData?.token]);

  if (loading) return <div className="card glass-panel" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="loader"></div></div>;

  return (
    <div className="card glass-panel">
      <h3 style={{ marginBottom: '28px', fontSize: '1.4rem' }}>Predictive Healing Analytics</h3>
      {data.length > 0 ? (
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="var(--text-muted)" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="var(--text-muted)" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                domain={[0, 100]}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ 
                  background: '#1E293B', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  color: '#F1F5F9'
                }}
                itemStyle={{ color: 'var(--primary)', fontWeight: '700' }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="var(--primary)" 
                strokeWidth={4} 
                dot={{ r: 4, fill: '#0F172A', stroke: 'var(--primary)', strokeWidth: 2 }}
                activeDot={{ r: 8, strokeWidth: 0, fill: 'var(--primary)' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="text-muted">Insufficient diagnostic history for trend projection.</p>
        </div>
      )}
    </div>
  );
}
