"""Deterministic comparison of fidelity-sensitive language cues."""

import re


PATTERNS = {
    "number": r"\b\d+(?:\.\d+)?%?\b",
    "date": r"\b(?:\d{1,4}[-/]\d{1,2}[-/]\d{1,4}|(?:19|20)\d{2})\b",
    "negation": r"\b(?:not|never|no|without|cannot|can't|isn't|doesn't)\b",
    "condition": r"\b(?:if|unless|only if|provided that|when)\b",
    "bound": r"\b(?:at least|at most|up to|more than|less than|greater than|below)\b",
    "obligation": r"\b(?:must|required|should|need to|shall)\b",
}


def extract(text: str) -> dict[str, list[str]]:
    return {name: re.findall(pattern, text, flags=re.IGNORECASE) for name, pattern in PATTERNS.items()}


def compare(source: str, generated: str) -> list[dict]:
    source_cues, output_cues = extract(source), extract(generated)
    return [
        {"kind": kind, "source": values, "output": output_cues[kind], "status": "preserved" if all(v.lower() in [x.lower() for x in output_cues[kind]] for v in values) else "needs_review"}
        for kind, values in source_cues.items() if values
    ]
