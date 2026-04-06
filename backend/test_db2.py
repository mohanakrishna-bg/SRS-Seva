import sys
from app import database
from app.models import models

# create session
db = next(database.get_db())

try:
    new_cust = models.Customer(Name="API Test", Phone="1234567890", City="Test")
    db.add(new_cust)
    db.commit()
    print("Success")
except Exception as e:
    print(f"ERROR: {e}")
