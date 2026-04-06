from app.database import SessionLocal
from app.models import models
from app.schemas import schemas
db = SessionLocal()
try:
    res = db.query(models.Customer).all()
    out = []
    for r in res:
        try:
            out.append(schemas.Customer.model_validate(r).model_dump())
        except Exception as inner_e:
            print(f"Failed on Customer ID1={r.ID1}: {inner_e}")
            break
    print(f"Successfully processed {len(out)} customers")
except Exception as e:
    import traceback
    traceback.print_exc()
