"""
backfill_transliteration.py — Fix Kannada names stored in DB

This script finds records in Devotee and Customer tables where the Name
field contains Kannada characters and attempts to transliterate them to
English using Google Input Tools API.

Usage:
    python backfill_transliteration.py [--dry-run]

The --dry-run flag prints what would be changed without making DB updates.
"""
import os
import sys
import sqlite3
import urllib.request
import json
import time
import re

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seva.db")
DRY_RUN = "--dry-run" in sys.argv


def is_kannada(text: str) -> bool:
    """Returns True if text contains Kannada Unicode characters."""
    return bool(re.search(r"[\u0C80-\u0CFF]", text or ""))


def transliterate_word_to_english(word: str) -> str:
    """
    Use Google Input Tools API to get the best English romanization
    of a Kannada word. Falls back to the original word on error.
    """
    try:
        url = (
            "https://inputtools.google.com/request"
            f"?text={urllib.parse.quote(word)}"
            "&itc=kn-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        # Response: ["SUCCESS", [["word", ["transliteration1", ...]]]]
        if data[0] == "SUCCESS" and data[1] and data[1][0][1]:
            return data[1][0][1][0]
    except Exception as e:
        print(f"    [WARN] API error for '{word}': {e}")
    return word  # fallback


def transliterate_name_to_english(name: str) -> str:
    """Transliterate a full name (space-separated words) to English."""
    import urllib.parse  # ensure available inside function

    words = name.strip().split()
    translated = []
    for word in words:
        if is_kannada(word):
            eng = transliterate_word_to_english(word)
            # Capitalize first letter
            translated.append(eng.capitalize())
        else:
            translated.append(word)
        time.sleep(0.1)  # be gentle with the API

    return " ".join(translated)


def backfill_table(conn: sqlite3.Connection, table: str, pk_col: str, name_col: str) -> int:
    """
    Backfill the name_col in the given table, replacing any Kannada names
    with their English transliterations.
    Returns the number of records updated.
    """
    cur = conn.cursor()
    rows = cur.execute(f"SELECT {pk_col}, {name_col} FROM {table}").fetchall()
    updated = 0

    for pk, name in rows:
        if not name or not is_kannada(name):
            continue

        eng_name = transliterate_name_to_english(name)
        print(f"  [{table}] [{pk}] '{name}' → '{eng_name}'")

        if not DRY_RUN:
            cur.execute(
                f"UPDATE {table} SET {name_col} = ? WHERE {pk_col} = ?",
                (eng_name, pk),
            )
        updated += 1

    return updated


def main():
    if not os.path.exists(DB_PATH):
        print(f"ERROR: Database not found at {DB_PATH}")
        sys.exit(1)

    print(f"{'[DRY RUN] ' if DRY_RUN else ''}Backfilling Kannada names...\n")

    conn = sqlite3.connect(DB_PATH)

    tables = [
        ("Devotee", "DevoteeId", "Name"),
        ("Customer", "ID1", "Name"),
    ]

    total = 0
    for table, pk_col, name_col in tables:
        try:
            print(f"=== {table} ===")
            count = backfill_table(conn, table, pk_col, name_col)
            print(f"  ✓ {count} record(s) would be updated" if DRY_RUN else f"  ✓ {count} record(s) updated")
            total += count
        except sqlite3.OperationalError as e:
            print(f"  [SKIP] Table '{table}' not found or error: {e}")

    if not DRY_RUN:
        conn.commit()
        print(f"\n✓ Committed {total} update(s) to database.")
    else:
        print(f"\n[DRY RUN] {total} record(s) would be updated. Re-run without --dry-run to apply.")

    conn.close()


if __name__ == "__main__":
    import urllib.parse  # ensure available for transliterate_word_to_english
    main()
