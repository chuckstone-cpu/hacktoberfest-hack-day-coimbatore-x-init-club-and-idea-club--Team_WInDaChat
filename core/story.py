"""Thread narration and source-grounded story checks."""

from .ollama import tell_story
from .verify.cues import compare
from .verify.quiz import check


def narrate(notes) -> str:
    payload = [{"id": row["id"], "content": row["content"]} for row in notes]
    return tell_story(payload)


def verify(notes, story: str) -> dict:
    source = "\n\n".join(row["content"] for row in notes)
    return {"cues": compare(source, story), "facts": check(source, story)}
