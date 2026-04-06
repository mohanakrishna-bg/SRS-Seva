import asyncio
from app.database import SessionLocal
from app.models import models
from app.schemas import schemas

db = SessionLocal()
items = db.query(models.Item).all()
valid_items = [i for i in items if i is not None]

for idx, c in enumerate(valid_items):
    try:
        schemas.Item.model_validate(c)
    except Exception as e:
        print(f"Validation failed at index {idx}, ItemCode={getattr(c, 'ItemCode', 'unknown')}: {e}")
        break
else:
    print(f"All {len(valid_items)} items validated successfully!")
