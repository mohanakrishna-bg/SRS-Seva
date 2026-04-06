
import sqlite3
import datetime

# Database path
DB_PATH = 'backend/seva.db'

def update_valuations():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Update Bullion Rates in InventoryMaterial
    rates = {
        'Gold': 14254.0,
        'Silver': 240.0
    }
    
    print("Updating bullion rates...")
    for mat, rate in rates.items():
        cursor.execute("UPDATE InventoryMaterial SET BullionRate = ? WHERE Name = ?", (rate, mat))
    
    # 2. Update Valuations in InventoryItem for Gold and Silver
    print("Updating item valuations...")
    cursor.execute("""
        SELECT ItemId, Name, Material, WeightGrams, Quantity 
        FROM InventoryItem 
        WHERE IsDeleted = 0 AND (Material = 'Gold' OR Material = 'Silver')
    """)
    items = cursor.fetchall()
    
    updated_count = 0
    for item_id, name, mat, weight, qty in items:
        if weight:
            rate = rates.get(mat)
            if rate:
                new_unit_price = float(weight) * rate
                new_total_value = new_unit_price * (int(qty) if qty else 1)
                
                cursor.execute("""
                    UPDATE InventoryItem 
                    SET UnitPrice = ?, TotalValue = ?, UpdatedAt = ?
                    WHERE ItemId = ?
                """, (new_unit_price, new_total_value, datetime.datetime.utcnow().isoformat(), item_id))
                
                # Log to audit trail
                details = f"Revaluation: {mat} rate updated to {rate}. Weight: {weight}g, Qty: {qty}. New Total: {new_total_value}"
                cursor.execute("""
                    INSERT INTO InventoryAuditLog (Timestamp, User, Action, ItemId, Details)
                    VALUES (?, ?, ?, ?, ?)
                """, (datetime.datetime.now().isoformat(), 'System', 'Revaluation', item_id, details))
                
                updated_count += 1
                print(f"Updated Item {item_id}: {name} -> ₹{new_total_value:,.2f}")

    conn.commit()
    conn.close()
    print(f"\nDone! Updated {updated_count} items with latest bullion rates.")

if __name__ == "__main__":
    update_valuations()
