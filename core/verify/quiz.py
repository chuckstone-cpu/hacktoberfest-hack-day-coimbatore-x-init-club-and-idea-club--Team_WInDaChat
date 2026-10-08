"""Model-assisted fact preservation check for a generated story."""

from ..models import QuizAnswer, QuizFacts
from ..ollama import generate_structured


def extract_facts(source: str) -> list[dict]:
    prompt = """Extract the important factual claims from the source notes. For every fact,
include the exact source span supporting it and a question that can be answered from the fact.
Do not create facts that are absent. Return JSON only.\n\nSOURCE NOTES:\n""" + source
    return [item.model_dump() for item in generate_structured(prompt, QuizFacts).facts]


def answer_facts(facts: list[dict], generated: str) -> list[dict]:
    results = []
    for item in facts:
        prompt = """Answer the question using only the generated story. If the story does not
state an answer, set stated to false and answer to 'not stated'. Return JSON only.
\nGENERATED STORY:\n""" + generated + "\nQUESTION:\n" + item["question"]
        answer = generate_structured(prompt, QuizAnswer).model_dump()
        status = "appears_preserved" if answer["stated"] else "needs_review"
        results.append({**item, **answer, "status": status})
    return results


def check(source: str, generated: str) -> list[dict]:
    return answer_facts(extract_facts(source), generated)
