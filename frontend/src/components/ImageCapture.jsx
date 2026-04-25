import React, { useState, useRef, useEffect, useContext } from "react";
import { AlertCircle, CheckCircle, Activity, Droplet, Trash2 } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import HealingTrend from "./HealingTrend";

const API_URL = "";

const ImageCapture = () => {
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  
  // Persistence state
  const [patientData, setPatientData] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const { authData } = useContext(AuthContext);
  const token = authData?.token;
  const patientId = authData?.patientId;

  const handleDeleteAnalysis = async (analysisId) => {
    if (!window.confirm("Are you sure you want to erase this diagnostic record? This action cannot be undone.")) return;

    try {
      const response = await fetch(`${API_URL}/analysis/${analysisId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        fetchHistoryAndNotes();
      } else {
        alert("Failed to delete record.");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const fetchHistoryAndNotes = async () => {
    if (!token || !patientId) {
      setLoading(false);
      return;
    }

    try {
      const patientRes = await fetch(`${API_URL}/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (patientRes.ok) {
        const data = await patientRes.json();
        setPatientData(data);
      }

      const notesRes = await fetch(`${API_URL}/notes/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData);
      }
    } catch (err) {
      console.error("Failed to fetch clinical data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryAndNotes();
  }, [patientId, token]);

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setIsCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setCameraError("Diagnostic imaging hardware unavailable. Using manual upload fallback.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      const video = videoRef.current;
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const capturedFile = new File([blob], "diagnostic_scan.jpg", { type: "image/jpeg" });
          setFile(capturedFile);
          setImage(URL.createObjectURL(blob));
          setResult(null);
          stopCamera();
        }
      }, "image/jpeg");
    }
  };

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setImage(URL.createObjectURL(selectedFile));
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!file || !token) return;
    setAnalyzing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/analyze?patient_id=${patientId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setResult(data);
      fetchHistoryAndNotes();
    } catch (err) {
      alert("Diagnostic processing failed. Please retry.");
    } finally {
      setAnalyzing(false);
      setFile(null);
      setImage(null);
    }
  };

  if (loading) return <div className="app-container"><div className="loader" style={{margin: '80px auto'}}></div></div>;

  const analyses = patientData?.analyses || [];

  return (
    <div className="fade-in patient-view">
      
      <div className="card glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '32px' }}>Wound Intelligence Scan</h2>
        
        <div style={{ position: 'relative', marginBottom: '32px' }}>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} style={{ display: "none" }} />
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {!image && !isCameraOpen && (
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={startCamera}>
                Initialize Camera
              </button>
              <button className="btn btn-secondary" onClick={() => fileInputRef.current.click()}>
                Import Image
              </button>
            </div>
          )}
          
          {cameraError && <div className="badge badge-warning" style={{ margin: '20px 0' }}>{cameraError}</div>}

          {isCameraOpen && (
            <div className="fade-in" style={{ position: 'relative' }}>
              <video 
                ref={videoRef} 
                autoPlay playsInline 
                style={{ width: '100%', maxWidth: '500px', borderRadius: '24px', border: '2px solid var(--primary)', backgroundColor: '#000', boxShadow: '0 0 30px var(--primary-glow)' }}
                onLoadedMetadata={() => videoRef.current?.play()}
              />
              {/* Scanning effect overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: '500px',
                height: '2px',
                background: 'var(--primary)',
                boxShadow: '0 0 15px var(--primary)',
                animation: 'scan 2s linear infinite',
                zIndex: 10
              }} />
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px' }}>
                <button className="btn btn-primary" onClick={captureImage}>Capture Scan</button>
                <button className="btn btn-secondary" onClick={stopCamera}>Abort</button>
              </div>
            </div>
          )}

          {image && !isCameraOpen && (
            <div className="fade-in">
              <img src={image} alt="Diagnostic Preview" style={{ width: '100%', maxWidth: '500px', borderRadius: '24px', border: '1px solid var(--border)' }} />
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px' }}>
                <button className="btn btn-secondary" onClick={() => { setImage(null); startCamera(); }}>Retake</button>
                <button className="btn btn-primary" onClick={handleAnalyze} disabled={analyzing}>
                  {analyzing ? "Processing Intelligence..." : "Submit for Diagnostic"}
                </button>
              </div>
            </div>
          )}
        </div>

        {result && (
          <div className="fade-in" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '20px', border: '1px solid var(--primary)', textAlign: 'left' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: 'var(--primary)' }}>Scan Intelligence Report</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '4px' }}>Healing Score</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: result.healing_score > 75 ? 'var(--success)' : 'var(--warning)' }}>
                  {result.healing_score.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '4px' }}>Infection Risk</div>
                <div className={result.infection_risk ? 'badge badge-danger' : 'badge badge-success'} style={{ fontSize: '1rem', padding: '8px 16px' }}>
                  {result.infection_risk ? "Critical" : "Stable"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clinical Communication */}
      <div className="card glass-panel fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: '1.3rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          Clinical Inquiry <span style={{ fontSize: '0.8rem', padding: '4px 10px', background: 'rgba(129, 140, 248, 0.2)', borderRadius: '20px', color: 'var(--secondary)' }}>Direct Line to Physician</span>
        </h3>
        
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '24px', maxHeight: '400px', paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notes.length > 0 ? (
            [...notes].reverse().map(note => {
              const isMe = note.sender_role === 'patient';
              return (
                <div key={note.id} style={{ 
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '700', 
                    color: isMe ? 'var(--secondary)' : 'var(--primary)',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {isMe ? 'Your Inquiry' : 'Physician Directive'}
                  </div>
                  <div style={{ 
                    padding: '12px 16px', 
                    backgroundColor: isMe ? 'rgba(129, 140, 248, 0.15)' : 'rgba(45, 212, 191, 0.15)', 
                    borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px', 
                    border: `1px solid ${isMe ? 'rgba(129, 140, 248, 0.3)' : 'rgba(45, 212, 191, 0.3)'}`,
                    color: 'var(--text-main)',
                    lineHeight: '1.5',
                    fontSize: '0.95rem'
                  }}>
                    {note.note}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
              <p className="text-muted" style={{ fontStyle: 'italic' }}>No communication history with your clinical team yet.</p>
            </div>
          )}
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const noteText = e.target.note.value;
              if (!noteText.trim()) return;
              
              try {
                const res = await fetch(`${API_URL}/notes?patient_id=${patientId}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ note: noteText })
                });
                if (res.ok) {
                  e.target.reset();
                  fetchHistoryAndNotes();
                }
              } catch (err) {
                console.error("Failed to send inquiry", err);
              }
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <textarea
              name="note"
              placeholder="Ask your doctor a question or provide a status update..."
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
            <button type="submit" className="btn btn-secondary" style={{ width: '100%', height: '48px', fontWeight: '700' }}>
              Send Inquiry
            </button>
          </form>
        </div>
      </div>

      {/* Predictive Trend */}
      <HealingTrend patientId={patientId} triggerUpdate={result} />

      {/* Historic Diagnostic Record */}
      <div className="card glass-panel">
        <h3 style={{ margin: '0 0 24px 0', fontSize: '1.3rem' }}>Diagnostic Record</h3>
        {analyses.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[...analyses].reverse().map(analysis => (
              <div key={analysis.id} style={{ display: 'flex', gap: '20px', padding: '20px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', alignItems: 'center', border: '1px solid var(--border)', position: 'relative' }}>
                <div style={{ width: '100px', height: '100px', flexShrink: 0, background: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  {analysis.image_path ? (
                    <img src={`/${analysis.image_path}`} alt="Record" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>No Image</div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{new Date(analysis.timestamp).toLocaleDateString()}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className={analysis.infection_risk ? 'badge badge-danger' : 'badge badge-success'}>
                        {analysis.infection_risk ? 'Critical' : 'Improved'}
                      </span>
                      <button 
                        onClick={() => handleDeleteAnalysis(analysis.id)}
                        className="btn btn-secondary"
                        style={{ padding: '6px', minWidth: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                        title="Erase Record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                    <span className="text-muted">Healing: <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{analysis.healing_score.toFixed(1)}%</span></span>
                    <span className="text-muted">Redness: <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{analysis.redness_detected ? 'Yes' : 'No'}</span></span>
                    <span className="text-muted">Infection: <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{analysis.infection_risk ? 'Yes' : 'No'}</span></span>
                    <span className="text-muted">Exudate: <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{analysis.pus_detected ? 'Yes' : 'No'}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p className="text-muted">No diagnostic history found. Please initiate your first scan.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Add CSS for scan animation
const style = document.createElement('style');
style.textContent = `
  @keyframes scan {
    0% { top: 0; }
    100% { top: 100%; }
  }
`;
document.head.appendChild(style);

export default ImageCapture;