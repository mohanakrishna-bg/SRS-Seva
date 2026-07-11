"""Shared text search utilities."""

import difflib
from typing import List, Any


def fuzzy_search_records(
    query: str,
    records: list,
    name_attr: str = "Name",
    limit: int = 50,
) -> list:
    """
    Fuzzy-match a query string against a list of ORM records by a name attribute.

    Uses SequenceMatcher for approximate string matching with word-level
    boosting. Returns up to `limit` results sorted by relevance.

    Args:
        query: The search string (case-insensitive)
        records: List of SQLAlchemy model instances
        name_attr: The attribute name to search against
        limit: Maximum results to return

    Returns:
        Sorted list of matching records (best match first)
    """
    q_str = query.strip().lower()
    if not q_str:
        return []

    scored = []
    for r in records:
        name = getattr(r, name_attr, "")
        if not name:
            continue
        name_lower = name.lower()

        # Exact substring match — highest score
        if q_str in name_lower:
            scored.append((1.0, r))
            continue

        # Fuzzy match on full name
        score = difflib.SequenceMatcher(None, q_str, name_lower).ratio()

        # Boost if any individual word matches well
        words = name_lower.split()
        if words:
            best_w = max(difflib.SequenceMatcher(None, q_str, w).ratio() for w in words)
            score = max(score, best_w * 0.9)

        if score > 0.55:
            scored.append((score, r))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored[:limit]]
