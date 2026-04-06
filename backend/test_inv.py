import sys
sys.path.append('.')
from app.database import SessionLocal
from app.models import models
from datetime import datetime

db = SessionLocal()
try:
    new_inv = models.InvoiceHdr(
        Date=datetime.now(),
        VoucherNo="VCH-12345",
        CustomerCode="1",
        TotalAmount=50,
        Payment_Mode="UPI",
        Payment_Reference="REF123",
        Family_Members=2,
        Opt_Theertha_Prasada=True
    )
    db.add(new_inv)
    db.commit()
    print("Success")
except Exception as e:
    print(f"ERROR: {e}")
