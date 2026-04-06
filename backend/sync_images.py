#!/usr/bin/env python3
"""
Inventory Image Sync Script

Syncs asset images from a local directory (downloaded Google Photos album)
into the Seva app's local storage, and optionally converts existing remote
image links to local files.

Usage:
    # Sync a downloaded Google Photos album folder
    python3 sync_images.py --local-dir ./path/to/album --category "Ornament"

    # Convert all existing remote links (lh3/drive URLs) to local files
    python3 sync_images.py --convert-remote-only

    # Both: sync new + convert remote
    python3 sync_images.py --local-dir ./album --category "Ornament" --convert-remote
"""

import argparse
import datetime
import json
import os
import re
import shutil
import sqlite3
import sys
import urllib.request
import urllib.error
import subprocess

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "seva.db")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "photos")
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".jheic", ".bmp", ".gif"}
CONVERT_TO_JPG = {".heic", ".heif", ".jheic"}


def slugify(name: str) -> str:
    """Convert a name to a filesystem-safe slug: 'Bangarada Kireeta' -> 'bangarada_kireeta'"""
    s = name.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s-]+', '_', s)
    s = s.strip('_')
    return s


def humanize_filename(filename: str) -> str:
    """Convert a filename stem to a readable name. 
    '20240707_114336' -> 'New Asset 114336'
    'bangarada_kireeta' -> 'Bangarada Kireeta'
    """
    stem = os.path.splitext(filename)[0]
    # If it looks like a timestamp photo name (all digits and underscores)
    if re.match(r'^\d{8}_\d{6}$', stem):
        return f"New Asset {stem[-6:]}"
    # Otherwise, humanize underscores
    return stem.replace('_', ' ').replace('-', ' ').title()


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def log_audit(cursor, action: str, item_id: int, details: dict):
    cursor.execute(
        "INSERT INTO InventoryAuditLog (Timestamp, User, Action, ItemId, Details) VALUES (?, ?, ?, ?, ?)",
        (datetime.datetime.utcnow().isoformat(), "Sync", action, item_id, json.dumps(details))
    )


def download_url(url: str, dest_path: str) -> bool:
    """Download a URL to a local file. Returns True on success."""
    try:
        # Follow redirects
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as response:
            with open(dest_path, 'wb') as f:
                shutil.copyfileobj(response, f)
        # Verify we got an actual image (not an error page)
        size = os.path.getsize(dest_path)
        if size < 1000:  # Likely an error page
            os.remove(dest_path)
            return False
        return True
    except (urllib.error.URLError, urllib.error.HTTPError, OSError) as e:
        print(f"  ⚠️  Download failed: {e}")
        if os.path.exists(dest_path):
            os.remove(dest_path)
        return False


def convert_heic_to_jpg(src_path: str, dest_path: str) -> bool:
    """Convert HEIC/HEIF image to JPEG using 'sips' (available on macOS)."""
    try:
        # sips -s format jpeg src_path --out dest_path
        subprocess.run(
            ["sips", "-s", "format", "jpeg", src_path, "--out", dest_path],
            check=True,
            capture_output=True
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"  ⚠️  HEIC conversion failed: {e}")
        return False


def convert_remote_links(conn):
    """Convert all remote ImageLink URLs to local files."""
    cursor = conn.cursor()
    cursor.execute(
        "SELECT ItemId, Name, ImageLink FROM InventoryItem "
        "WHERE ImageLink IS NOT NULL AND ImageLink LIKE 'http%'"
    )
    items = cursor.fetchall()

    if not items:
        print("ℹ️  No remote image links to convert.")
        return

    print(f"\n🔄 Converting {len(items)} remote image links to local files...\n")
    converted = 0
    failed = 0

    for item in items:
        item_id = item["ItemId"]
        name = item["Name"]
        url = item["ImageLink"]

        # Generate local filename from asset name
        slug = slugify(name)
        ext = ".jpg"  # Default; Google links are typically JPEG
        local_filename = f"{slug}{ext}"
        dest_path = os.path.join(UPLOAD_DIR, local_filename)

        # Handle naming collisions
        counter = 1
        while os.path.exists(dest_path):
            local_filename = f"{slug}_{counter}{ext}"
            dest_path = os.path.join(UPLOAD_DIR, local_filename)
            counter += 1

        print(f"  [{item_id}] {name}")
        print(f"      URL: {url[:80]}...")
        print(f"      → {local_filename}", end=" ")

        if download_url(url, dest_path):
            # Update DB
            cursor.execute(
                "UPDATE InventoryItem SET ImageLink = ? WHERE ItemId = ?",
                (local_filename, item_id)
            )
            log_audit(cursor, "Image Sync", item_id, {
                "action": "remote_to_local",
                "old_link": url,
                "new_link": local_filename,
            })
            converted += 1
            print("✅")
        else:
            failed += 1
            print("❌")

    conn.commit()
    print(f"\n📊 Converted: {converted}, Failed: {failed}")


def sync_local_dir(conn, local_dir: str, category: str):
    """Sync images from a local directory into the app."""
    if not os.path.isdir(local_dir):
        print(f"❌ Directory not found: {local_dir}")
        sys.exit(1)

    cursor = conn.cursor()

    # Get all image files in the directory
    image_files = []
    for entry in sorted(os.listdir(local_dir)):
        ext = os.path.splitext(entry)[1].lower()
        if ext in IMAGE_EXTENSIONS:
            image_files.append(entry)

    if not image_files:
        print(f"ℹ️  No image files found in {local_dir}")
        return

    print(f"\n📂 Found {len(image_files)} images in {local_dir}")
    print(f"   Category: {category}\n")

    # Load existing items for matching
    cursor.execute(
        "SELECT ItemId, Name, ImageLink FROM InventoryItem WHERE IsDeleted = 0"
    )
    existing_items = cursor.fetchall()

    # Build match lookup: filename → item
    link_map = {}
    for item in existing_items:
        if item["ImageLink"]:
            link_map[item["ImageLink"]] = item
            # Also match without extension
            stem = os.path.splitext(item["ImageLink"])[0]
            link_map[stem] = item

    synced = 0
    created = 0

    for filename in image_files:
        src_path = os.path.join(local_dir, filename)
        stem = os.path.splitext(filename)[0]
        ext = os.path.splitext(filename)[1].lower()
        
        # Determine target extension (always .jpg for HEIC/HEIF)
        target_ext = ".jpg" if ext in CONVERT_TO_JPG else ext

        # Try to match to existing item
        matched_item = link_map.get(filename) or link_map.get(stem)

        if matched_item:
            # Rename to asset name
            asset_slug = slugify(matched_item["Name"])
            local_filename = f"{asset_slug}{target_ext}"
            dest_path = os.path.join(UPLOAD_DIR, local_filename)

            # Handle collision
            counter = 1
            while os.path.exists(dest_path) and local_filename != matched_item["ImageLink"]:
                local_filename = f"{asset_slug}_{counter}{target_ext}"
                dest_path = os.path.join(UPLOAD_DIR, local_filename)
                counter += 1

            if ext in CONVERT_TO_JPG:
                if convert_heic_to_jpg(src_path, dest_path):
                    print(f"  📸 Converted HEIC: {filename} → {local_filename}")
                else:
                    continue # Skip if conversion failed
            else:
                shutil.copy2(src_path, dest_path)

            cursor.execute(
                "UPDATE InventoryItem SET ImageLink = ? WHERE ItemId = ?",
                (local_filename, matched_item["ItemId"])
            )
            log_audit(cursor, "Image Sync", matched_item["ItemId"], {
                "action": "updated_image",
                "source_file": filename,
                "new_link": local_filename,
            })
            print(f"  ✅ Matched: {filename} → [{matched_item['ItemId']}] {matched_item['Name']}")
            synced += 1
        else:
            # New item — create stub
            human_name = humanize_filename(filename)
            local_filename = f"{slugify(human_name)}{target_ext}"
            dest_path = os.path.join(UPLOAD_DIR, local_filename)

            # Handle collision
            counter = 1
            while os.path.exists(dest_path):
                local_filename = f"{slugify(human_name)}_{counter}{target_ext}"
                dest_path = os.path.join(UPLOAD_DIR, local_filename)
                counter += 1

            if ext in CONVERT_TO_JPG:
                if convert_heic_to_jpg(src_path, dest_path):
                    print(f"  📸 Converted HEIC: {filename} → {local_filename}")
                else:
                    continue # Skip if conversion failed
            else:
                shutil.copy2(src_path, dest_path)

            today = datetime.date.today().strftime("%d/%m/%Y")
            cursor.execute(
                """INSERT INTO InventoryItem 
                   (Name, Category, ImageLink, NeedsReview, UnitPrice, Quantity, TotalValue, AddedOnDate, IsDeleted)
                   VALUES (?, ?, ?, 1, 0, 1, 0, ?, 0)""",
                (human_name, category, local_filename, today)
            )
            new_id = cursor.lastrowid
            log_audit(cursor, "Addition (Sync)", new_id, {
                "action": "new_stub_from_photo",
                "source_file": filename,
                "name": human_name,
                "category": category,
            })
            print(f"  🆕 New stub: {filename} → [{new_id}] \"{human_name}\" (NeedsReview)")
            created += 1

    conn.commit()
    print(f"\n📊 Synced: {synced} existing, Created: {created} new stubs")


def main():
    parser = argparse.ArgumentParser(
        description="Sync inventory asset images from a local directory or convert remote links.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Sync a downloaded Google Photos album
  python3 sync_images.py --local-dir ./Ornaments --category "Ornament"

  # Convert all remote links to local files
  python3 sync_images.py --convert-remote-only

  # Both at once
  python3 sync_images.py --local-dir ./Ornaments --category "Ornament" --convert-remote
        """,
    )
    parser.add_argument("--local-dir", help="Path to local directory with images to sync")
    parser.add_argument("--category", default="Uncategorized",
                        help="Category for new items (e.g., 'Ornament', 'Pooja Items')")
    parser.add_argument("--convert-remote-only", action="store_true",
                        help="Only convert existing remote links to local files")
    parser.add_argument("--convert-remote", action="store_true",
                        help="Also convert remote links (in addition to --local-dir sync)")

    args = parser.parse_args()

    if not args.local_dir and not args.convert_remote_only:
        parser.error("Must specify --local-dir or --convert-remote-only")

    # Ensure upload directory exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at {DB_PATH}")
        sys.exit(1)

    conn = get_db()

    try:
        if args.convert_remote_only or args.convert_remote:
            convert_remote_links(conn)

        if args.local_dir:
            sync_local_dir(conn, args.local_dir, args.category)
    finally:
        conn.close()

    print("\n✨ Done!")


if __name__ == "__main__":
    main()
