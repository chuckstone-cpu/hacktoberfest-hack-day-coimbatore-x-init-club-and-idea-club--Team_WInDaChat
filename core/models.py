"""Validated shapes returned by the local model."""

from typing import Literal

from pydantic import BaseModel, Field


class NoteTags(BaseModel):
    summary: str = Field(min_length=1, max_length=500)
    entities: list[str] = Field(default_factory=list, max_length=12)
    patterns: list[str] = Field(default_factory=list, max_length=12)


class LinkDecision(BaseModel):
    note_id: int
    type: Literal["causes", "consequence_of", "continuation", "contradicts", "same_idea"]
    strength: int = Field(ge=1, le=5)
    reason: str = Field(min_length=1, max_length=500)


class LinkDecisions(BaseModel):
    links: list[LinkDecision] = Field(default_factory=list)


class QuizFact(BaseModel):
    fact: str = Field(min_length=1)
    source_span: str = Field(min_length=1)
    question: str = Field(min_length=1)


class QuizFacts(BaseModel):
    facts: list[QuizFact] = Field(default_factory=list, max_length=12)


class QuizAnswer(BaseModel):
    answer: str
    stated: bool
