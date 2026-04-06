"""
Inventory CSV Import Script
Imports items from a Google Sheets CSV export into the InventoryItem table.

Usage:
    1. Export your Google Sheet (InventoryMain tab) as CSV:
       File → Download → Comma Separated Values (.csv)
    2. Place the CSV file in the backend/ directory
    3. Run: python3 import_inventory_csv.py <path_to_csv>

Expected CSV columns (header row):
    Item ID, Name, Description /Size in inches, Category, Material,
    Weight (grams), Unit Price, Quantity, Total Value, Added on Date,
    Image, Image Link

Notes:
    - The "Image" column (in-cell thumbnails) is skipped; only "Image Link" is imported.
    - Empty rows and rows without a Name are skipped.
    - Existing items with the same ItemId are updated, not duplicated.
"""

import csv
import sqlite3
import os
import sys
import json
import datetime

# Match the path used by database.py: backend/seva.db
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "seva.db")
if not os.path.exists(DB_PATH):
    # Fallback: try backend/app/seva.db
    DB_PATH = os.path.join(BASE_DIR, "app", "seva.db")
    if not os.path.exists(DB_PATH):
        print("ERROR: Database not found.")
        sys.exit(1)

def clean_float(val):
    """Parse a float value, handling commas and empty strings."""
    if not val or not val.strip():
        return None
    try:
        return float(val.strip().replace(",", ""))
    except ValueError:
        return None

def clean_int(val):
    """Parse an integer value."""
    if not val or not val.strip():
        return None
    try:
        return int(float(val.strip().replace(",", "")))
    except ValueError:
        return None

def normalize_date(val):
    """Try to normalize various date formats to DD/MM/YYYY."""
    if not val or not val.strip():
        return None
    val = val.strip()
    
    # Try DD/MM/YYYY
    for fmt in ["%d/%m/%Y", "%m/%d/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d-%m-%y %H:%M"]:
        try:
            d = datetime.datetime.strptime(val, fmt)
            return d.strftime("%d/%m/%Y")
        except ValueError:
            continue
    # Return as-is if no format matched
    return val

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 import_inventory_csv.py <path_to_csv>")
        print("Example: python3 import_inventory_csv.py InventoryMain.csv")
        sys.exit(1)

    csv_path = sys.argv[1]
    if not os.path.exists(csv_path):
        print(f"ERROR: CSV file not found: {csv_path}")
        sys.exit(1)

    print(f"Importing from: {csv_path}")
    print(f"Database: {DB_PATH}\n")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Load image map
    IMAGE_MAP_PATH = os.path.join(BASE_DIR, "image_map.json")
    image_map = {}
    if os.path.exists(IMAGE_MAP_PATH):
        try:
            with open(IMAGE_MAP_PATH, "r") as f:
                image_map = json.load(f)
        except Exception as e:
            print(f"Failed to load image_map.json: {e}")
            
    # Normalize image_map keys for easier matching
    normalized_image_map = {}
    for k, v in image_map.items():
        base = k.split("=")[0].strip()
        parts = base.split(".")
        if len(parts) > 1:
            base = ".".join(parts[:-1]).lower().strip()
        else:
            base = base.lower().strip()
        normalized_image_map[base] = v

    # Ensure table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='InventoryItem'")
    if not cursor.fetchone():
        print("ERROR: InventoryItem table does not exist. Run migrate_inventory.py first.")
        conn.close()
        sys.exit(1)

    imported = 0
    updated = 0
    skipped = 0

    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        # Print detected columns for debugging
        print(f"Detected columns: {reader.fieldnames}\n")
        
        # Map expected column names (flexible matching)
        col_map = {}
        for col in (reader.fieldnames or []):
            cl = col.strip().lower()
            if 'item' in cl and 'id' in cl:
                col_map['item_id'] = col
            elif cl == 'name':
                col_map['name'] = col
            elif 'description' in cl or 'size' in cl:
                col_map['description'] = col
            elif cl == 'category':
                col_map['category'] = col
            elif cl == 'material':
                col_map['material'] = col
            elif 'weight' in cl:
                col_map['weight'] = col
            elif 'unit' in cl and 'price' in cl:
                col_map['unit_price'] = col
            elif cl == 'quantity':
                col_map['quantity'] = col
            elif 'total' in cl and 'value' in cl:
                col_map['total_value'] = col
            elif 'added' in cl or ('date' in cl and 'added' in cl):
                col_map['date'] = col
            elif cl == 'image link' or ('image' in cl and 'link' in cl):
                col_map['image_link'] = col
            elif cl == 'image':
                col_map['image'] = col  # We'll skip this one (in-cell thumbnails)
        
        print(f"Column mapping: {json.dumps(col_map, indent=2)}\n")
        print("-" * 70)
        
        for row in reader:
            name = row.get(col_map.get('name', 'Name'), '').strip()
            if not name:
                skipped += 1
                continue

            item_id = clean_int(row.get(col_map.get('item_id', 'Item ID'), ''))
            description = row.get(col_map.get('description', 'Description /Size in inches'), '').strip() or None
            category = row.get(col_map.get('category', 'Category'), '').strip() or None
            material = row.get(col_map.get('material', 'Material'), '').strip() or None
            weight = clean_float(row.get(col_map.get('weight', 'Weight (grams)'), ''))
            unit_price = clean_float(row.get(col_map.get('unit_price', 'Unit Price'), ''))
            quantity = clean_int(row.get(col_map.get('quantity', 'Quantity'), '')) or 1
            total_value = clean_float(row.get(col_map.get('total_value', 'Total Value'), ''))
            added_date = normalize_date(row.get(col_map.get('date', 'Added on Date'), ''))
            # Enhanced image link extraction: check both columns and prefer URLs
            img_link_val = row.get(col_map.get('image_link', 'Image Link'), '').strip()
            img_val = row.get(col_map.get('image', 'Image'), '').strip()
            
            image_link = None
            # Check if either column contains a proper URL (starting with http)
            if img_link_val.lower().startswith('http'):
                image_link = img_link_val
            elif img_val.lower().startswith('http'):
                image_link = img_val
            elif img_link_val:
                # If no HTTP URL found, but image_link exists, clean it up
                # Filter out broken formula strings
                if "=GETLINK" not in img_link_val:
                    image_link = img_link_val
            elif img_val:
                if "=GETLINK" not in img_val:
                    image_link = img_val

            # Final cleanup: sometimes filenames come with formula cruft
            if image_link and "=" in image_link:
                image_link = image_link.split("=")[0].strip()


            # Calculate total value if not provided
            if total_value is None and unit_price:
                total_value = unit_price * quantity
            
            # If unit_price is missing but total_value and quantity exist, derive it
            if unit_price is None and total_value and quantity:
                unit_price = total_value / quantity

            # Default values
            unit_price = unit_price or 0.0
            total_value = total_value or 0.0

            # Check if item_id already exists
            if item_id:
                cursor.execute("SELECT ItemId FROM InventoryItem WHERE ItemId = ?", (item_id,))
                existing = cursor.fetchone()
                if existing:
                    cursor.execute("""
                        UPDATE InventoryItem SET
                            Name=?, Description=?, Category=?, Material=?,
                            WeightGrams=?, UnitPrice=?, Quantity=?, TotalValue=?,
                            AddedOnDate=?, ImageLink=?, UpdatedAt=CURRENT_TIMESTAMP
                        WHERE ItemId=?
                    """, (name, description, category, material,
                          weight, unit_price, quantity, total_value,
                          added_date, image_link, item_id))
                    updated += 1
                    print(f"  ↻ Updated #{item_id}: {name}")
                    continue

            cursor.execute("""
                INSERT INTO InventoryItem
                    (Name, Description, Category, Material, WeightGrams,
                     UnitPrice, Quantity, TotalValue, AddedOnDate,
                     ImageLink, IsDeleted)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            """, (name, description, category, material, weight,
                  unit_price, quantity, total_value, added_date, image_link))

            new_id = cursor.lastrowid
            
            # Log the addition to audit
            cursor.execute("""
                INSERT INTO InventoryAuditLog (User, Action, ItemId, Details)
                VALUES (?, ?, ?, ?)
            """, ("CSV Import", "Addition", new_id,
                  json.dumps({"name": name, "category": category, "material": material,
                              "unitPrice": unit_price, "quantity": quantity,
                              "totalValue": total_value, "source": "CSV Import"})))

            imported += 1
            print(f"  ✓ Imported #{new_id}: {name} ({category}/{material}) — ₹{total_value:,.2f}")

    conn.commit()
    conn.close()

    print("-" * 70)
    print(f"\n✅ Import complete!")
    print(f"   Imported: {imported}")
    print(f"   Updated:  {updated}")
    print(f"   Skipped:  {skipped} (empty rows)")

if __name__ == "__main__":
    main()
