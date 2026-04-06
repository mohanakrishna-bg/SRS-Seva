import sys
sys.path.append('.')
from app.database import SessionLocal
from app.models import models

db = SessionLocal()
try:
    new_cust = models.Customer(Name='API Test No Refresh', Phone='1234567890', City='Test')
    db.add(new_cust)
    db.commit()
    print('Success Commit. ID1 is:', new_cust.ID1)
except Exception as e:
    import traceback
    traceback.print_exc()
