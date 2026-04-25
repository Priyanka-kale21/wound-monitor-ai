from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta
import os
import shutil
from dotenv import load_dotenv

import torch
from PIL import Image
import torchvision.transforms as transforms
from torchvision.models import resnet18
import torch.nn as nn

import models, schemas, auth
from database import engine, get_db

# Load environment variables from .env file
load_dotenv()

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI-Assisted Wound Monitoring API")

# ===== LOAD MODEL =====
model = resnet18(pretrained=False)
model.fc = nn.Linear(model.fc.in_features, 4)

model.load_state_dict(torch.load("model/wound_model_weights.pth"))
model.eval()

# ===== IMAGE TRANSFORM =====
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

DOCTOR_ACCESS_CODE = os.getenv("DOCTOR_ACCESS_CODE", "admin123")

# Inference function - to be connected to ML model
def run_inference(file_path):
    image = Image.open(file_path).convert("RGB")
    image = transform(image).unsqueeze(0)

    with torch.no_grad():
        output = model(image)[0]

    return {
        "healing_score": float(output[0]),
        "redness_detected": bool(output[1] > 0.5),
        "pus_detected": bool(output[2] > 0.5),
        "infection_risk": bool(output[3] > 0.5),
        "notes": "AI-based analysis"
    }

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Support both username and email login
    user = db.query(models.User).filter(
        (models.User.username == form_data.username) | 
        (models.User.email == form_data.username)
    ).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role,
        "patient_id": user.linked_patient_id,
        "is_verified": user.is_verified or False
    }

@app.post("/register")
def register_user(register_data: schemas.RegisterRequest, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(models.User).filter(models.User.email == register_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username already exists
    existing_username = db.query(models.User).filter(models.User.username == register_data.email.split('@')[0]).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Hash the password
    hashed_password = auth.get_password_hash(register_data.password)
    
    if register_data.role == "patient":
        # Create patient record first
        patient = models.Patient(
            name=register_data.name or "Unknown",
            age=register_data.age or 0,
            condition=register_data.condition or "Not specified"
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
        
        # Create user with linked patient
        new_user = models.User(
            username=register_data.email.split('@')[0],
            email=register_data.email,
            hashed_password=hashed_password,
            role=register_data.role,
            linked_patient_id=patient.id,
            is_verified=False
        )
    else:
        if register_data.doctor_access_code != DOCTOR_ACCESS_CODE:
            raise HTTPException(status_code=403, detail="Invalid doctor access code")
        
        # Create doctor user (no patient link)
        new_user = models.User(
            username=register_data.email.split('@')[0],
            email=register_data.email,
            hashed_password=hashed_password,
            role=register_data.role,
            linked_patient_id=None,
            is_verified=True
        )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User registered successfully", "user_id": new_user.id, "email": new_user.email}

@app.post("/analyze", response_model=schemas.WoundAnalysis)
async def analyze_wound(patient_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role == 'patient' and current_user.linked_patient_id != patient_id:
        raise HTTPException(status_code=403, detail="Not authorized to analyze for this patient")
        
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    file_location = f"uploads/{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    analysis_result = run_inference(file_location)
    
    db_analysis = models.WoundAnalysis(
        patient_id=patient_id,
        image_path=file_location,
        **analysis_result
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    
    return db_analysis

@app.post("/patients/", response_model=schemas.Patient)
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db)):
    db_patient = models.Patient(**patient.dict())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@app.get("/patients/", response_model=List[schemas.Patient])
def read_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != 'doctor':
        raise HTTPException(status_code=403, detail="Only doctors can view patient list")
    if not current_user.is_verified:
        raise HTTPException(status_code=403, detail="Doctor not verified")
    patients = db.query(models.Patient).offset(skip).limit(limit).all()
    return patients

@app.get("/patients/{patient_id}", response_model=schemas.Patient)
def read_patient(patient_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role == 'patient' and current_user.linked_patient_id != patient_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this patient")
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@app.delete("/analysis/{analysis_id}")
def delete_analysis(analysis_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    analysis = db.query(models.WoundAnalysis).filter(models.WoundAnalysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found")
    
    # Only allow the patient who owns the record to delete it
    if current_user.role == 'patient' and current_user.linked_patient_id != analysis.patient_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this record")
    
    # If doctor, ensure they are verified (though typically patients manage their own history in this request)
    if current_user.role == 'doctor' and not current_user.is_verified:
        raise HTTPException(status_code=403, detail="Doctor not verified")

    # Delete the physical file if it exists
    if os.path.exists(analysis.image_path):
        try:
            os.remove(analysis.image_path)
        except Exception as e:
            print(f"Failed to delete file: {e}")

    db.delete(analysis)
    db.commit()
    return {"message": "Diagnostic record erased successfully"}

# Doctor Specific Endpoints

@app.get("/doctor/patients", response_model=List[schemas.Patient])
def read_doctor_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != 'doctor':
        raise HTTPException(status_code=403, detail="Only doctors can view patient list")
    if not current_user.is_verified:
        raise HTTPException(status_code=403, detail="Doctor not verified")
    patients = db.query(models.Patient).offset(skip).limit(limit).all()
    return patients

@app.get("/doctor/patient/{patient_id}", response_model=schemas.Patient)
def read_doctor_patient(patient_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != 'doctor':
        raise HTTPException(status_code=403, detail="Only doctors can view patient details")
    if not current_user.is_verified:
        raise HTTPException(status_code=403, detail="Doctor not verified")
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@app.post("/notes", response_model=schemas.DoctorNote)
def create_note(patient_id: int, note_data: schemas.DoctorNoteCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Check permissions
    if current_user.role == 'patient' and current_user.linked_patient_id != patient_id:
        raise HTTPException(status_code=403, detail="Not authorized to add notes for this patient")
    
    if current_user.role == 'doctor' and not current_user.is_verified:
        raise HTTPException(status_code=403, detail="Doctor not verified")
    
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Double check sender role
    role = current_user.role if current_user.role in ['doctor', 'patient'] else 'doctor'

    db_note = models.DoctorNote(
        patient_id=patient_id,
        doctor_id=current_user.id,
        note=note_data.note,
        sender_role=role
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@app.get("/notes/{patient_id}", response_model=List[schemas.DoctorNote])
def read_doctor_notes(patient_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role == 'patient' and current_user.linked_patient_id != patient_id:
        raise HTTPException(status_code=403, detail="Not authorized to view these notes")
    if current_user.role != 'doctor' and current_user.role != 'patient':
        raise HTTPException(status_code=403, detail="Invalid role")
    if current_user.role == 'doctor' and not current_user.is_verified:
        raise HTTPException(status_code=403, detail="Doctor not verified")
    
    notes = db.query(models.DoctorNote).filter(models.DoctorNote.patient_id == patient_id).order_by(models.DoctorNote.timestamp.desc()).all()
    return notes
