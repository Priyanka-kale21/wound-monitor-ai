import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authData, setAuthData] = useState(null);

  // Load auth from localStorage on app start
  useEffect(() => {
    const saved = localStorage.getItem("wound_auth");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        // Normalize legacy data if necessary
        const authInfo = {
          token: data.token || data.access_token,
          role: data.role,
          patientId: data.patientId || data.patient_id,
          username: data.username || data.email,
          isVerified: data.isVerified !== undefined ? data.isVerified : data.is_verified
        };
        setAuthData(authInfo);
        // Save normalized back to storage
        localStorage.setItem("wound_auth", JSON.stringify(authInfo));
      } catch (e) {
        console.error("Failed to parse auth data:", e);
        localStorage.removeItem("wound_auth");
      }
    }
  }, []);

  // Login function - now accepts pre-formatted data or raw response
  const login = (data) => {
    const authInfo = {
      token: data.token || data.access_token,
      role: data.role,
      patientId: data.patientId || data.patient_id,
      username: data.username || data.email,
      isVerified: data.isVerified !== undefined ? data.isVerified : data.is_verified
    };
    setAuthData(authInfo);
    localStorage.setItem("wound_auth", JSON.stringify(authInfo));
  };

  const logout = () => {
    setAuthData(null);
    localStorage.removeItem("wound_auth");
  };

  const getToken = () => {
    return authData?.token || null;
  };

  return (
    <AuthContext.Provider value={{ authData, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};