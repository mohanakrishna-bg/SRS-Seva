import sys
import traceback
sys.path.append('.')
from app.database import SessionLocal
from app.models import models

def main():
    try:
        db = SessionLocal()
        max_id_row = db.query(models.InvoiceHdr).order_by(models.InvoiceHdr.Id.desc()).first()
        if max_id_row:
            print("Max ID fetched:", type(max_id_row.Id), repr(max_id_row.Id))
        else:
            print("No max ID found.")
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    main()
