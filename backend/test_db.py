from app.database import SessionLocal
from app.models import models
from app.schemas import schemas
db = SessionLocal()
try:
    res = db.query(models.Customer).limit(5).all()
    out = [schemas.Customer.model_validate(r).model_dump() for r in res]
    print(out)
except Exception as e:
    import traceback
    traceback.print_exc()
