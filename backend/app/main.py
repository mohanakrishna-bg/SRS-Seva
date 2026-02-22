from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
import os
import shutil

from app.models import models
from app.schemas import schemas
from app import database
from app.core import auth

from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Seva Modern Intranet")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@app.post("/api/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/customers", response_model=List[schemas.Customer])
def read_customers(skip: int = 0, limit: int = 2000, db: Session = Depends(database.get_db)):
    try:
        return db.query(models.Customer).offset(skip).limit(limit).all()
    except Exception as e:
        print(f"Error reading customers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/customers", response_model=schemas.Customer)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(database.get_db)):
    db_customer = models.Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.get("/api/items", response_model=List[schemas.Item])
def read_items(db: Session = Depends(database.get_db)):
    return db.query(models.Item).all()

@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "status": "success"}

# Initialize default admin if not exists
@app.on_event("startup")
def startup_event():
    db = next(database.get_db())
    if not db.query(models.User).filter(models.User.username == "admin").first():
        admin_user = models.User(
            username="admin",
            hashed_password=auth.get_password_hash("admin123"),
            role="admin"
        )
        db.add(admin_user)
        db.commit()
