import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const API_URL = '';

export default function DoctorNotes({ patientId }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { authData } = useContext(AuthContext);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`${API_URL}/notes/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (err) {
      console.error("Failed to fetch notes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) fetchNotes();
  }, [patientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/notes?patient_id=${patientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({ note: newNote })
      });

      if (res.ok) {
        setNewNote('');
        fetchNotes(); // Refresh list
      }
    } catch (err) {
      console.error("Failed to add note", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="card glass-panel" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="loader"></div></div>;

  return (
    <div className="card glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>Clinical Intelligence Log</h3>
      
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '24px', maxHeight: '400px', paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notes.length > 0 ? (
          [...notes].reverse().map((n) => {
            const isMe = n.sender_role === 'doctor';
            return (
              <div key={n.id} style={{ 
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start'
              }}>
                <div style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '700', 
                  color: isMe ? 'var(--primary)' : 'var(--secondary)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {isMe ? 'Physician' : 'Patient Inquiry'}
                </div>
                <div style={{ 
                  padding: '12px 16px', 
                  backgroundColor: isMe ? 'rgba(45, 212, 191, 0.15)' : 'rgba(129, 140, 248, 0.15)', 
                  borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px', 
                  border: `1px solid ${isMe ? 'rgba(45, 212, 191, 0.3)' : 'rgba(129, 140, 248, 0.3)'}`,
                  color: 'var(--text-main)',
                  lineHeight: '1.5',
                  fontSize: '0.95rem'
                }}>
                  {n.note}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
            <p className="text-muted" style={{ fontStyle: 'italic' }}>No clinical communication record.</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Type clinical directive or clinical note..."
          disabled={submitting}
          style={{ 
            width: '100%', 
            minHeight: '80px', 
            background: 'rgba(15, 23, 42, 0.5)', 
            border: '1px solid var(--border)',
            borderRadius: '12px',
            color: 'var(--text-main)',
            padding: '12px',
            fontSize: '0.95rem',
            resize: 'none'
          }}
        />
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={submitting || !newNote.trim()}
          style={{ width: '100%', marginTop: '12px', height: '48px', fontWeight: '700' }}
        >
          {submitting ? 'Transmitting...' : 'Send Directive'}
        </button>
      </form>
    </div>
  );
}
