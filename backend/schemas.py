from pydantic import BaseModel, EmailStr
from typing import List, Optional
import datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    patient_id: Optional[int] = None
    is_verified: bool = False

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str
    linked_patient_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        orm_mode = True

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: str
    name: Optional[str] = None
    age: Optional[int] = None
    condition: Optional[str] = None
    doctor_access_code: Optional[str] = None

class WoundAnalysisBase(BaseModel):
    image_path: str
    healing_score: float
    redness_detected: bool
    pus_detected: bool
    infection_risk: bool
    notes: Optional[str] = None

class WoundAnalysisCreate(WoundAnalysisBase):
    pass

class WoundAnalysis(WoundAnalysisBase):
    id: int
    patient_id: int
    timestamp: datetime.datetime

    class Config:
        orm_mode = True

class PatientBase(BaseModel):
    name: str
    age: int
    condition: str

class DoctorNoteBase(BaseModel):
    note: str

class DoctorNoteCreate(DoctorNoteBase):
    pass

class DoctorNote(DoctorNoteBase):
    id: int
    patient_id: int
    doctor_id: int
    sender_role: str
    timestamp: datetime.datetime

    class Config:
        orm_mode = True

class PatientCreate(PatientBase):
    pass

class Patient(PatientBase):
    id: int
    analyses: List[WoundAnalysis] = []
    notes: List[DoctorNote] = []

    class Config:
        orm_mode = True
