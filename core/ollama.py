"""Small Ollama HTTP client with schema validation and safe fallbacks."""

import json
from typing import Any, TypeVar

import requests

from .config import OLLAMA_HOST, OLLAMA_MODEL, NUM_CTX
from .models import LinkDecisions, NoteTags


ModelT = TypeVar("ModelT")


def generate(prompt: str, schema: dict | None = None, stream: bool = False) -> Any:
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": stream,
        "options": {"num_ctx": NUM_CTX, "temperature": 0},
    }
    if schema:
        payload["format"] = schema
    response = requests.post(f"{OLLAMA_HOST.rstrip('/')}/api/generate", json=payload, timeout=300)
    response.raise_for_status()
    if stream:
        return response.iter_lines()
    text = response.json().get("response", "")
    return json.loads(text) if schema else text


def generate_structured(prompt: str, model_type: type[ModelT]) -> ModelT:
    """Ask Ollama for JSON and reject malformed responses before they reach storage."""
    schema = model_type.model_json_schema()
    return model_type.model_validate(generate(prompt, schema))


def tag_note(content: str) -> NoteTags:
    prompt = """Extract a concise summary, named entities, and abstract patterns from this note.
Patterns should be reusable mechanisms such as 'feedback loop', 'trade-off', or 'bottleneck'.
Do not invent information. Return JSON only.\n\nNOTE:\n""" + content
    return generate_structured(prompt, NoteTags)


def judge_links(note: str, candidates: list[dict]) -> list[dict]:
    prompt = """Judge meaningful relationships between the new note and the candidates.
Use only these relation types: causes, consequence_of, continuation, contradicts, same_idea.
Use strength 1-5. Give a short reason grounded in a shared or conflicting fact.
Return no link when the relationship is weak. Return JSON only.
\nNEW NOTE:\n""" + note + "\nCANDIDATES:\n" + json.dumps(candidates)
    return [item.model_dump() for item in generate_structured(prompt, LinkDecisions).links]


def tell_story(notes: list[dict]) -> str:
    prompt = """Write a short, clear narrative that connects these notes. Preserve qualifications,
numbers, and disagreements. Do not add facts not present in the notes. Use two to four paragraphs.
\nNOTES:\n""" + json.dumps(notes)
    return generate(prompt)


def summarize_notes(notes: list[dict]) -> str:
    """Create a concise, source-grounded summary for a selected note set."""
    prompt = """Summarize these notes into a concise study overview. Organize the main ideas,
explain the most important connections, and preserve any caveats or numbers. Only use facts
from the supplied notes. Use headings and bullet points where helpful.
\nNOTES:\n""" + json.dumps(notes)
    return generate(prompt)
