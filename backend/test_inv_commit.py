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
    max_id = db.query(models.InvoiceHdr).order_by(models.InvoiceHdr.Id.desc()).first()
    new_inv.Id = (max_id.Id + 1) if max_id else 1
    
    db.add(new_inv)
    db.commit()
    print("Success Commit. Id is:", new_inv.Id)
except Exception as e:
    import traceback
    traceback.print_exc()
