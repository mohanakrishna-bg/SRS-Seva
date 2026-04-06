"""
Image Sync API — Automates the Google Photos → Seva inventory workflow.

Endpoints:
  GET  /api/inventory/sync/config   — Read sync configuration
  PUT  /api/inventory/sync/config   — Update sync configuration
  GET  /api/inventory/sync/inbox    — List files in the watch folder
  POST /api/inventory/sync/run      — Execute sync (unzip, convert, import)
  POST /api/inventory/sync/upload   — Upload files via browser for sync
"""

import datetime
import json
import os
import re
import shutil
import subprocess
import zipfile
import tempfile
import traceback
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app import database
from app.models.inventory import InventoryItem, InventoryAuditLog
from app.models.sync_config import SyncConfig

router = APIRouter(prefix="/api/inventory/sync", tags=["Image Sync"])

# ─── Constants ───
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".jheic", ".bmp", ".gif"}
CONVERT_TO_JPG = {".heic", ".heif", ".jheic"}
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # backend/
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "photos")


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Helpers ───

def slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s-]+', '_', s)
    return s.strip('_')


def humanize_filename(filename: str) -> str:
    stem = os.path.splitext(filename)[0]
    if re.match(r'^\d{8}_\d{6}$', stem):
        return f"New Asset {stem[-6:]}"
    return stem.replace('_', ' ').replace('-', ' ').title()


def convert_heic_to_jpg(src_path: str, dest_path: str) -> bool:
    """Convert HEIC/HEIF to JPEG using macOS sips."""
    try:
        subprocess.run(
            ["sips", "-s", "format", "jpeg", src_path, "--out", dest_path],
            check=True, capture_output=True
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def get_config(db: Session) -> dict:
    """Load all sync config as a dict."""
    rows = db.query(SyncConfig).all()
    return {r.Key: r.Value for r in rows}


def get_watch_folder(db: Session) -> str:
    """Resolve the absolute watch folder path."""
    config = get_config(db)
    folder = config.get("watch_folder", "sync_inbox")
    if not os.path.isabs(folder):
        folder = os.path.join(BASE_DIR, folder)
    os.makedirs(folder, exist_ok=True)
    return folder


def get_archive_folder(watch_folder: str) -> str:
    archive = os.path.join(watch_folder, "archive")
    os.makedirs(archive, exist_ok=True)
    return archive


def log_audit(db: Session, action: str, item_id: int, details: dict):
    entry = InventoryAuditLog(
        User="Sync", Action=action, ItemId=item_id, Details=details
    )
    db.add(entry)


# ─── Schemas ───

class SyncConfigUpdate(BaseModel):
    watch_folder: Optional[str] = None
    default_category: Optional[str] = None
    auto_archive_zips: Optional[str] = None


class SyncRunRequest(BaseModel):
    category: Optional[str] = None  # Override default category


class SyncCheckpoint(BaseModel):
    """Tracks progress of a single sync operation for retry."""
    timestamp: str
    status: str  # "running", "completed", "failed"
    total_files: int = 0
    processed: int = 0
    synced: int = 0
    created: int = 0
    errors: list = []
    log: list = []


class InboxFile(BaseModel):
    name: str
    size: int
    size_human: str
    modified: str
    type: str  # "zip", "image"


class SyncResult(BaseModel):
    status: str
    checkpoint_id: str
    synced: int
    created: int
    errors: list
    log: list


# ─── Config Endpoints ───

@router.get("/config")
def read_config(db: Session = Depends(get_db)):
    config = get_config(db)
    watch = config.get("watch_folder", "sync_inbox")
    if not os.path.isabs(watch):
        watch_abs = os.path.join(BASE_DIR, watch)
    else:
        watch_abs = watch
    return {
        "watch_folder": watch,
        "watch_folder_abs": watch_abs,
        "default_category": config.get("default_category", "Uncategorized"),
        "auto_archive_zips": config.get("auto_archive_zips", "true"),
    }


@router.put("/config")
def update_config(payload: SyncConfigUpdate, db: Session = Depends(get_db)):
    updates = payload.dict(exclude_none=True)
    for key, value in updates.items():
        existing = db.query(SyncConfig).filter(SyncConfig.Key == key).first()
        if existing:
            existing.Value = str(value)
        else:
            db.add(SyncConfig(Key=key, Value=str(value)))
    db.commit()
    return {"status": "ok", "updated": list(updates.keys())}


# ─── Inbox Endpoints ───

def _human_size(size_bytes: int) -> str:
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"


@router.get("/inbox")
def list_inbox(db: Session = Depends(get_db)):
    watch = get_watch_folder(db)
    files: List[dict] = []

    if not os.path.isdir(watch):
        return {"watch_folder": watch, "files": [], "message": "Watch folder not found"}

    for entry in sorted(os.listdir(watch)):
        full = os.path.join(watch, entry)
        if not os.path.isfile(full):
            continue
        ext = os.path.splitext(entry)[1].lower()
        if ext == ".zip" or ext in IMAGE_EXTENSIONS:
            stat = os.stat(full)
            files.append({
                "name": entry,
                "size": stat.st_size,
                "size_human": _human_size(stat.st_size),
                "modified": datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "type": "zip" if ext == ".zip" else "image",
            })

    return {"watch_folder": watch, "files": files}


# ─── Upload Endpoint (browser drag-and-drop) ───

@router.post("/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """Accept file uploads from the browser and place them in the watch folder."""
    watch = get_watch_folder(db)
    saved = []
    errors = []

    for f in files:
        ext = os.path.splitext(f.filename or "")[1].lower()
        if ext != ".zip" and ext not in IMAGE_EXTENSIONS:
            errors.append(f"Skipped {f.filename}: unsupported file type '{ext}'")
            continue

        dest = os.path.join(watch, f.filename)
        # Avoid overwriting
        counter = 1
        base, ext_part = os.path.splitext(f.filename)
        while os.path.exists(dest):
            dest = os.path.join(watch, f"{base}_{counter}{ext_part}")
            counter += 1

        try:
            with open(dest, "wb") as out:
                content = await f.read()
                out.write(content)
            saved.append(os.path.basename(dest))
        except Exception as e:
            errors.append(f"Failed to save {f.filename}: {str(e)}")

    return {"saved": saved, "errors": errors, "count": len(saved)}


# ─── Main Sync Engine ───

def _extract_zip(zip_path: str, extract_to: str) -> tuple:
    """Extract a ZIP safely. Returns (success: bool, error_msg: str|None)."""
    try:
        with zipfile.ZipFile(zip_path, 'r') as zf:
            # Security: reject paths that escape the extract directory
            for member in zf.namelist():
                member_path = os.path.realpath(os.path.join(extract_to, member))
                if not member_path.startswith(os.path.realpath(extract_to)):
                    return False, f"Unsafe path in ZIP: {member}"
            zf.extractall(extract_to)
        return True, None
    except zipfile.BadZipFile:
        return False, f"Corrupt or invalid ZIP: {os.path.basename(zip_path)}"
    except Exception as e:
        return False, f"ZIP extraction error: {str(e)}"


def _collect_images(directory: str) -> list:
    """Recursively find all image files, returning (abs_path, relative_folder, filename)."""
    results = []
    for root, _, files in os.walk(directory):
        for f in sorted(files):
            ext = os.path.splitext(f)[1].lower()
            if ext in IMAGE_EXTENSIONS:
                rel_folder = os.path.relpath(root, directory)
                if rel_folder == ".":
                    rel_folder = ""
                results.append((os.path.join(root, f), rel_folder, f))
    return results


def _infer_category(rel_folder: str, default: str) -> str:
    """Infer category from subfolder name within a ZIP.
    e.g. 'Ornaments/' → 'Ornaments', 'Pooja Items/Silver/' → 'Pooja Items'
    """
    if not rel_folder:
        return default
    # Use the top-level folder name as category
    parts = rel_folder.replace("\\", "/").split("/")
    top_folder = parts[0].strip()
    if top_folder and not top_folder.startswith("__") and not top_folder.startswith("."):
        return top_folder.title()
    return default


@router.post("/run")
def run_sync(
    payload: SyncRunRequest = SyncRunRequest(),
    db: Session = Depends(get_db)
):
    """
    Main sync endpoint. Processes all files in the watch folder:
    1. Extract ZIPs → temp folders
    2. Collect all images (from ZIPs + loose files)
    3. Convert HEIC → JPEG
    4. Match to existing items or create stubs
    5. Archive processed ZIPs
    """
    config = get_config(db)
    watch = get_watch_folder(db)
    default_category = payload.category or config.get("default_category", "Uncategorized")
    auto_archive = config.get("auto_archive_zips", "true") == "true"

    # ─── Checkpoint ───
    checkpoint_id = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    checkpoint = {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "status": "running",
        "total_files": 0,
        "processed": 0,
        "synced": 0,
        "created": 0,
        "errors": [],
        "log": [],
    }

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Collect work: (source_path, rel_folder, filename, source_zip_or_none)
    work_items = []
    zips_to_archive = []
    temp_dirs = []

    try:
        # ─── Phase 1: Discover files ───
        for entry in sorted(os.listdir(watch)):
            full = os.path.join(watch, entry)
            if not os.path.isfile(full):
                continue

            ext = os.path.splitext(entry)[1].lower()

            if ext == ".zip":
                # Extract ZIP to temp directory
                temp_dir = tempfile.mkdtemp(prefix="seva_sync_")
                temp_dirs.append(temp_dir)
                success, err = _extract_zip(full, temp_dir)
                if not success:
                    checkpoint["errors"].append({"file": entry, "error": err})
                    checkpoint["log"].append(f"⚠️ {err}")
                    continue

                images = _collect_images(temp_dir)
                for img_path, rel_folder, img_name in images:
                    work_items.append((img_path, rel_folder, img_name, entry))

                zips_to_archive.append(full)
                checkpoint["log"].append(f"📦 Extracted {entry}: {len(images)} images")

            elif ext in IMAGE_EXTENSIONS:
                work_items.append((full, "", entry, None))

        checkpoint["total_files"] = len(work_items)

        if not work_items:
            checkpoint["status"] = "completed"
            checkpoint["log"].append("ℹ️ No images found in watch folder")
            _save_checkpoint(watch, checkpoint_id, checkpoint)
            return checkpoint

        # ─── Phase 2: Load existing items for matching ───
        existing = db.query(InventoryItem).filter(InventoryItem.IsDeleted == False).all()
        link_map = {}
        for item in existing:
            if item.ImageLink:
                link_map[item.ImageLink] = item
                stem = os.path.splitext(item.ImageLink)[0]
                link_map[stem] = item

        # ─── Phase 3: Process each image ───
        for src_path, rel_folder, filename, source_zip in work_items:
            try:
                stem = os.path.splitext(filename)[0]
                ext = os.path.splitext(filename)[1].lower()
                target_ext = ".jpg" if ext in CONVERT_TO_JPG else ext

                # Infer category from subfolder
                category = _infer_category(rel_folder, default_category)

                # Try to match to existing item
                matched = link_map.get(filename) or link_map.get(stem)

                if matched:
                    # ─ Update existing item ─
                    asset_slug = slugify(matched.Name)
                    local_filename = f"{asset_slug}{target_ext}"
                    dest_path = os.path.join(UPLOAD_DIR, local_filename)

                    counter = 1
                    while os.path.exists(dest_path) and local_filename != matched.ImageLink:
                        local_filename = f"{asset_slug}_{counter}{target_ext}"
                        dest_path = os.path.join(UPLOAD_DIR, local_filename)
                        counter += 1

                    if ext in CONVERT_TO_JPG:
                        if not convert_heic_to_jpg(src_path, dest_path):
                            checkpoint["errors"].append({
                                "file": filename, "error": "HEIC conversion failed"
                            })
                            checkpoint["log"].append(f"⚠️ HEIC conversion failed: {filename}")
                            continue
                        checkpoint["log"].append(f"📸 Converted: {filename} → {local_filename}")
                    else:
                        shutil.copy2(src_path, dest_path)

                    matched.ImageLink = local_filename
                    log_audit(db, "Image Sync", matched.ItemId, {
                        "action": "updated_image",
                        "source_file": filename,
                        "source_zip": source_zip,
                        "new_link": local_filename,
                    })
                    checkpoint["log"].append(
                        f"✅ Matched: {filename} → [{matched.ItemId}] {matched.Name}"
                    )
                    checkpoint["synced"] += 1

                else:
                    # ─ Create new stub item ─
                    human_name = humanize_filename(filename)
                    local_filename = f"{slugify(human_name)}{target_ext}"
                    dest_path = os.path.join(UPLOAD_DIR, local_filename)

                    counter = 1
                    while os.path.exists(dest_path):
                        local_filename = f"{slugify(human_name)}_{counter}{target_ext}"
                        dest_path = os.path.join(UPLOAD_DIR, local_filename)
                        counter += 1

                    if ext in CONVERT_TO_JPG:
                        if not convert_heic_to_jpg(src_path, dest_path):
                            checkpoint["errors"].append({
                                "file": filename, "error": "HEIC conversion failed"
                            })
                            checkpoint["log"].append(f"⚠️ HEIC conversion failed: {filename}")
                            continue
                        checkpoint["log"].append(f"📸 Converted: {filename} → {local_filename}")
                    else:
                        shutil.copy2(src_path, dest_path)

                    today = datetime.date.today().strftime("%d/%m/%Y")
                    new_item = InventoryItem(
                        Name=human_name,
                        Category=category,
                        ImageLink=local_filename,
                        NeedsReview=True,
                        UnitPrice=0,
                        Quantity=1,
                        TotalValue=0,
                        AddedOnDate=today,
                        IsDeleted=False,
                    )
                    db.add(new_item)
                    db.flush()  # Get the ID

                    log_audit(db, "Addition (Sync)", new_item.ItemId, {
                        "action": "new_stub_from_photo",
                        "source_file": filename,
                        "source_zip": source_zip,
                        "name": human_name,
                        "category": category,
                    })
                    checkpoint["log"].append(
                        f"🆕 New stub: {filename} → [{new_item.ItemId}] \"{human_name}\" ({category})"
                    )
                    checkpoint["created"] += 1

                checkpoint["processed"] += 1

            except Exception as e:
                checkpoint["errors"].append({
                    "file": filename,
                    "error": str(e),
                    "traceback": traceback.format_exc(),
                })
                checkpoint["log"].append(f"❌ Error processing {filename}: {str(e)}")
                continue  # Don't stop the entire batch

        # ─── Phase 4: Commit & archive ───
        db.commit()

        # Archive processed ZIPs
        if auto_archive and zips_to_archive:
            archive = get_archive_folder(watch)
            for zp in zips_to_archive:
                try:
                    archive_name = os.path.basename(zp)
                    archive_dest = os.path.join(archive, archive_name)
                    # Add timestamp if collision
                    if os.path.exists(archive_dest):
                        base, ext_p = os.path.splitext(archive_name)
                        archive_dest = os.path.join(archive, f"{base}_{checkpoint_id}{ext_p}")
                    shutil.move(zp, archive_dest)
                    checkpoint["log"].append(f"📁 Archived: {archive_name}")
                except Exception as e:
                    checkpoint["errors"].append({
                        "file": os.path.basename(zp),
                        "error": f"Archive failed: {str(e)}"
                    })

        # Remove loose image files from inbox (they've been copied to uploads/)
        for src_path, rel_folder, filename, source_zip in work_items:
            if source_zip is None and os.path.isfile(src_path):
                try:
                    os.remove(src_path)
                except Exception:
                    pass

        checkpoint["status"] = "completed"

    except Exception as e:
        checkpoint["status"] = "failed"
        checkpoint["errors"].append({
            "error": f"Sync failed: {str(e)}",
            "traceback": traceback.format_exc(),
        })
        checkpoint["log"].append(f"❌ Sync failed: {str(e)}")
        # Still try to commit what we have
        try:
            db.commit()
        except Exception:
            db.rollback()

    finally:
        # Cleanup temp directories
        for td in temp_dirs:
            try:
                shutil.rmtree(td, ignore_errors=True)
            except Exception:
                pass

        # Save checkpoint
        _save_checkpoint(watch, checkpoint_id, checkpoint)

    return checkpoint


def _save_checkpoint(watch_folder: str, checkpoint_id: str, checkpoint: dict):
    """Save checkpoint to a JSON file for retry/audit purposes."""
    checkpoint_dir = os.path.join(watch_folder, ".checkpoints")
    os.makedirs(checkpoint_dir, exist_ok=True)
    path = os.path.join(checkpoint_dir, f"{checkpoint_id}.json")
    with open(path, "w") as f:
        json.dump(checkpoint, f, indent=2, default=str)


# ─── Checkpoint history ───

@router.get("/checkpoints")
def list_checkpoints(db: Session = Depends(get_db)):
    """List recent sync checkpoints for audit/retry."""
    watch = get_watch_folder(db)
    checkpoint_dir = os.path.join(watch, ".checkpoints")
    if not os.path.isdir(checkpoint_dir):
        return {"checkpoints": []}

    checkpoints = []
    for entry in sorted(os.listdir(checkpoint_dir), reverse=True)[:20]:
        if entry.endswith(".json"):
            try:
                with open(os.path.join(checkpoint_dir, entry)) as f:
                    data = json.load(f)
                    data["id"] = entry.replace(".json", "")
                    checkpoints.append(data)
            except Exception:
                pass

    return {"checkpoints": checkpoints}
