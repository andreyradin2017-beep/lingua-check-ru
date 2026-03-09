"""
Pydantic schemas.
Строго по specs/api.md.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, HttpUrl, field_validator


# ---------------------------------------------------------------------------
# Violation
# ---------------------------------------------------------------------------
class ViolationSchema(BaseModel):
    id: str
    type: str  # foreign_word | no_russian_dub | unrecognized_word | trademark | possible_trademark
    page_url: str | None = None
    text_context: str = ""
    word: str | None = None
    normal_form: str | None = None
    details: dict[str, Any] = Field(default_factory=dict)

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Page
# ---------------------------------------------------------------------------
class PageSchema(BaseModel):
    id: str
    url: str
    depth: int
    tokens_count: int = 0
    violations_count: int = 0

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Scan
# ---------------------------------------------------------------------------
class ScanStartRequest(BaseModel):
    url: str
    max_depth: int = Field(default=3, ge=1, le=5)  # specs/security.md
    max_pages: int = Field(default=100, ge=1, le=500)  # specs/security.md
    capture_screenshots: bool = True

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL должен начинаться с http:// или https://")
        if v.startswith(("javascript:", "data:")):
            raise ValueError("Scheme не допустима")
        return v


class ScanStartResponse(BaseModel):
    scan_id: str
    status: str


class ScanSummary(BaseModel):
    total_pages: int = 0
    pages_with_violations: int = 0
    total_violations: int = 0


class ScanStatusResponse(BaseModel):
    status: str
    target_url: str | None = None
    summary: ScanSummary
    pages: list[PageSchema] = Field(default_factory=list)
    violations: list[ViolationSchema] = Field(default_factory=list)


class ScanHistoryItem(BaseModel):
    id: str
    target_url: str
    status: str
    started_at: datetime
    
    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Text check
# ---------------------------------------------------------------------------
class CheckTextRequest(BaseModel):
    text: str = Field(..., min_length=1)
    format: str = Field(default="plain", pattern="^(plain|html)$")


class CheckTextSummary(BaseModel):
    total_tokens: int
    violations_count: int
    compliance_percent: float


class CheckTextResponse(BaseModel):
    violations: list[ViolationSchema] = Field(default_factory=list)
    summary: CheckTextSummary


# ---------------------------------------------------------------------------
# Dictionary
# ---------------------------------------------------------------------------
class DictionaryVersionSchema(BaseModel):
    name: str
    version: str
    word_count: int

    model_config = {"from_attributes": True}


class DictionaryPreviewResponse(BaseModel):
    dictionary_versions: list[DictionaryVersionSchema]
# ---------------------------------------------------------------------------
# Trademark
# ---------------------------------------------------------------------------
class Trademark(BaseModel):
    id: str
    word: str
    normal_form: str

    model_config = {"from_attributes": True}


class TrademarkCreate(BaseModel):
    word: str = Field(..., min_length=1)
