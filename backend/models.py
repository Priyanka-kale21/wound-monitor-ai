from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String) # 'doctor' or 'patient'
    linked_patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    is_verified = Column(Boolean, default=False)
    
    patient = relationship("Patient")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer)
    condition = Column(String)
    
    analyses = relationship("WoundAnalysis", back_populates="patient", order_by="desc(WoundAnalysis.timestamp)")
    notes = relationship("DoctorNote", back_populates="patient", order_by="desc(DoctorNote.timestamp)")

class DoctorNote(Base):
    __tablename__ = "doctor_notes"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("users.id"))
    note = Column(String)
    sender_role = Column(String, default="doctor") # 'doctor' or 'patient'
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="notes")
    doctor = relationship("User")

class WoundAnalysis(Base):
    __tablename__ = "wound_analyses"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    image_path = Column(String)
    healing_score = Column(Float)
    redness_detected = Column(Boolean, default=False)
    pus_detected = Column(Boolean, default=False)
    infection_risk = Column(Boolean, default=False)
    notes = Column(String, nullable=True)

    patient = relationship("Patient", back_populates="analyses")
