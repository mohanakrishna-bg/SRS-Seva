import asyncio
from app.database import SessionLocal
from app.models import models
from app.schemas import schemas
from fastapi.encoders import jsonable_encoder

db = SessionLocal()
customers = db.query(models.Customer).limit(2000).all()
valid_customers = [c for c in customers if c is not None]

for idx, c in enumerate(valid_customers):
    try:
        schemas.Customer.model_validate(c)
    except Exception as e:
        print(f"Validation failed at index {idx}, ID1={getattr(c, 'ID1', 'unknown')}: {e}")
        break
else:
    print("All validated successfully!")
