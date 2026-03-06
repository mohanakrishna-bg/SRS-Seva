from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
import os
import shutil

from fastapi.staticfiles import StaticFiles

from app.models import models
from app.schemas import schemas
from app import database
from app.core import auth

from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Seva Modern Intranet")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "db": database.DB_PATH}

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
        customers = db.query(models.Customer).offset(skip).limit(limit).all()
        return [c for c in customers if c is not None]
    except Exception as e:
        print(f"Error reading customers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/customers", response_model=schemas.Customer)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(database.get_db)):
    db_customer = models.Customer(**customer.model_dump())
    
    # SQLite legacy table ID1 is not AUTOINCREMENT explicitly, so we manually assign it if missing
    if not db_customer.ID1:
        max_id = db.query(models.Customer).order_by(models.Customer.ID1.desc()).first()
        db_customer.ID1 = (max_id.ID1 + 1) if max_id else 1
        
    try:
        db.add(db_customer)
        db.commit()
        db.refresh(db_customer)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    return db_customer

@app.get("/api/customers/search", response_model=List[schemas.Customer])
def search_customers(q: str = "", db: Session = Depends(database.get_db)):
    if not q.strip():
        return []
        
    search_term = f"%{q}%"
    
    # 1. Try Exact/Like matching on Phone Number first
    phone_results = db.query(models.Customer).filter(
        models.Customer.Phone.ilike(search_term) |
        models.Customer.WhatsApp_Phone.ilike(search_term)
    ).limit(10).all()
    
    # If phone numbers matched, return them
    if phone_results:
        return phone_results
        
    # 2. If no phone match, fallback to Name search and return multiple if they exist
    name_results = db.query(models.Customer).filter(
        models.Customer.Name.ilike(search_term) |
        models.Customer.ID.ilike(search_term)
    ).limit(20).all()
    
    return name_results

@app.get("/api/customers/{customer_id}", response_model=schemas.Customer)
def get_customer(customer_id: int, db: Session = Depends(database.get_db)):
    customer = db.query(models.Customer).filter(models.Customer.ID1 == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@app.put("/api/customers/{customer_id}", response_model=schemas.Customer)
def update_customer(customer_id: int, customer: schemas.CustomerCreate, db: Session = Depends(database.get_db)):
    db_customer = db.query(models.Customer).filter(models.Customer.ID1 == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    for key, value in customer.model_dump(exclude_unset=True).items():
        setattr(db_customer, key, value)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.delete("/api/customers/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(database.get_db)):
    db_customer = db.query(models.Customer).filter(models.Customer.ID1 == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(db_customer)
    db.commit()
    return {"detail": "Customer deleted"}

@app.get("/api/items", response_model=List[schemas.Item])
def read_items(db: Session = Depends(database.get_db)):
    items = db.query(models.Item).filter(models.Item.ItemCode != None).all()
    return [i for i in items if i is not None]

@app.post("/api/invoices", response_model=schemas.InvoiceHdr)
def create_invoice(invoice: schemas.InvoiceHdrCreate, db: Session = Depends(database.get_db)):
    db_invoice = models.InvoiceHdr(**invoice.model_dump())
    
    try:
        db.add(db_invoice)
        db.commit()
        db.refresh(db_invoice)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    return db_invoice

@app.get("/api/invoices", response_model=List[schemas.InvoiceHdr])
def list_invoices(db: Session = Depends(database.get_db)):
    return db.query(models.InvoiceHdr).order_by(models.InvoiceHdr.Id.desc()).limit(100).all()

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
