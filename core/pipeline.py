"""Application-level note processing."""

from . import db
from .ollama import judge_links, tag_note


def save_note(content: str) -> int:
    tagged = tag_note(content)
    concepts = [("entity", value.strip()) for value in tagged.entities if value.strip()]
    concepts += [("pattern", value.strip()) for value in tagged.patterns if value.strip()]
    note_id = db.add_note(content, tagged.summary, concepts)
    candidates = db.shortlist(note_id, concepts)
    if candidates:
        candidate_data = [{"id": row["id"], "summary": row["summary"], "content": row["content"]} for row in candidates]
        judged = judge_links(content, candidate_data)
        allowed = {row["id"] for row in candidates}
        valid = [
            {"note_id": item["note_id"], "type": item["type"], "strength": int(item["strength"]), "reason": item["reason"]}
            for item in judged
            if item.get("note_id") in allowed and int(item.get("strength", 0)) >= 4
        ]
        db.add_links(note_id, valid)
    return note_id
