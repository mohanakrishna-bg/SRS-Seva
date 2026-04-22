import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import date
from app.database import SessionLocal
from app.models.inventory import InventoryItem, InventoryCategory

def seed():
    db = SessionLocal()

    # Ensure "Test Data" category exists
    cat = db.query(InventoryCategory).filter(InventoryCategory.Name == "Test Data").first()
    if not cat:
        cat = InventoryCategory(Name="Test Data", ForType="consumable")
        db.add(cat)
        db.commit()

    # Clear existing
    items = db.query(InventoryItem).filter(InventoryItem.Category == "Test Data").all()
    for item in items:
        db.delete(item)
    db.commit()

    # Seed new
    samples = [
        {"Name": "Sona Masoori Rice", "UOM": "Kg", "UnitPrice": 65.0, "Quantity": 250, "GSTRate": 0, "HSNCode": "1006"},
        {"Name": "Desi Cow Ghee", "UOM": "Liters", "UnitPrice": 650.0, "Quantity": 25, "GSTRate": 12, "HSNCode": "0405"},
        {"Name": "Refined Sunflower Oil", "UOM": "Liters", "UnitPrice": 115.0, "Quantity": 50, "GSTRate": 5, "HSNCode": "1512"},
        {"Name": "Toor Dal", "UOM": "Kg", "UnitPrice": 140.0, "Quantity": 80, "GSTRate": 0, "HSNCode": "0713"},
        {"Name": "Jaggery (Unde Bella)", "UOM": "Kg", "UnitPrice": 75.0, "Quantity": 40, "GSTRate": 0, "HSNCode": "1701"},
        {"Name": "Camphor (Karpura)", "UOM": "Kg", "UnitPrice": 850.0, "Quantity": 5, "GSTRate": 18, "HSNCode": "2914"},
        {"Name": "Agarbatti (Incense Sticks)", "UOM": "Packets", "UnitPrice": 120.0, "Quantity": 150, "GSTRate": 5, "HSNCode": "3307"},
        {"Name": "Coconuts", "UOM": "Nos", "UnitPrice": 25.0, "Quantity": 1000, "GSTRate": 0, "HSNCode": "0801"},
        {"Name": "Turmeric Powder (Haldi)", "UOM": "Kg", "UnitPrice": 180.0, "Quantity": 10, "GSTRate": 5, "HSNCode": "0910"},
        {"Name": "Kumkum", "UOM": "Kg", "UnitPrice": 250.0, "Quantity": 15, "GSTRate": 5, "HSNCode": "3304"},
        {"Name": "Flowers (Sevanthige/Marigold)", "UOM": "Kg", "UnitPrice": 120.0, "Quantity": 30, "GSTRate": 0, "HSNCode": "0603"},
        {"Name": "Plantain Leaves (Bale Yele)", "UOM": "Nos", "UnitPrice": 4.0, "Quantity": 2500, "GSTRate": 0, "HSNCode": "0604"},
        {"Name": "Cleaning Phenyle", "UOM": "Liters", "UnitPrice": 80.0, "Quantity": 20, "GSTRate": 18, "HSNCode": "3808"}
    ]

    for s in samples:
        total = s["UnitPrice"] * s["Quantity"]
        item = InventoryItem(
            Name=s["Name"],
            Category="Test Data",
            ItemType="consumable",
            UOM=s["UOM"],
            UnitPrice=s["UnitPrice"],
            Quantity=s["Quantity"],
            TotalValue=total,
            GSTRate=s["GSTRate"],
            HSNCode=s["HSNCode"],
            AddedOnDate=date.today().strftime("%d/%m/%Y"),
            IsDeleted=False
        )
        db.add(item)
    
    db.commit()
    print("Consumables seed complete!")
    db.close()

if __name__ == "__main__":
    seed()
