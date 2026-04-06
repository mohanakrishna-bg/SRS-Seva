import sys
import traceback
sys.path.append('.')

from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

def main():
    try:
        engine = create_engine('sqlite:///seva.db', echo=True)
        Base = declarative_base()

        class TestInvoice(Base):
            __tablename__ = "Invoice_Hdr"
            Id = Column("rowid", Integer, primary_key=True)
            InvoiceNo = Column(String)

        Session = sessionmaker(bind=engine)
        db = Session()

        inv = db.query(TestInvoice).first()
        if inv is not None:
            print("Found rowid:", inv.Id, "InvoiceNo:", inv.InvoiceNo)
        else:
            print("No rows found")
            
        new_inv = TestInvoice(InvoiceNo="TEST-ROWID-2")
        db.add(new_inv)
        db.commit()
        db.refresh(new_inv)
        print("New Invoice Commit rowid:", new_inv.Id)

    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    main()
