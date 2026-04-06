from app.database import engine, SessionLocal
from app.models import models
from app.main import fuzzy_search_records

# need to run inside the same dir context
models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

# testing LegacyCustomer fuzzy
all_customers = db.query(models.LegacyCustomer).filter(
    models.LegacyCustomer.Name != None, models.LegacyCustomer.Name != ""
).all()

res = fuzzy_search_records("mohan", all_customers, name_attr="Name", limit=5)
for r in res:
    print(r.Name)

res = fuzzy_search_records("samjay", all_customers, name_attr="Name", limit=5)
for r in res:
    print(r.Name)

