"""
SQLAlchemy ORM models.
Строго по specs/data_model.md.
"""
import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def gen_uuid() -> str:
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# 1. dictionary_words
# ---------------------------------------------------------------------------
class DictionaryWord(Base):
    __tablename__ = "dictionary_words"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    word: Mapped[str] = mapped_column(Text, nullable=False)
    normal_form: Mapped[str] = mapped_column(Text, nullable=False)
    part_of_speech: Mapped[str] = mapped_column(
        String(10), nullable=False, default="OTHER"
    )  # NOUN/VERB/ADJ/ADV/OTHER
    source_dictionary: Mapped[str] = mapped_column(
        String(64), nullable=False
    )  # Orthographic/ForeignWords/Explanatory/Orthoepic
    is_foreign: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    version: Mapped[str] = mapped_column(String(10), nullable=False)  # YYYY-MM-DD

    __table_args__ = (
        Index("idx_dictionary_words_normal_form", "normal_form"),
    )


# ---------------------------------------------------------------------------
# 2. dictionary_versions
# ---------------------------------------------------------------------------
class DictionaryVersion(Base):
    __tablename__ = "dictionary_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[str] = mapped_column(String(10), nullable=False)
    pdf_path: Mapped[str] = mapped_column(Text, nullable=False)
    word_count: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    processed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


# ---------------------------------------------------------------------------
# 3. trademarks
# ---------------------------------------------------------------------------
class Trademark(Base):
    __tablename__ = "trademarks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    word: Mapped[str] = mapped_column(Text, nullable=False)
    normal_form: Mapped[str] = mapped_column(Text, nullable=False)

    __table_args__ = (Index("idx_trademarks_normal_form", "normal_form"),)


# ---------------------------------------------------------------------------
# 4. projects
# ---------------------------------------------------------------------------
class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    name: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    scans: Mapped[list["Scan"]] = relationship("Scan", back_populates="project")


# ---------------------------------------------------------------------------
# 5. scans
# ---------------------------------------------------------------------------
class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id"), nullable=False
    )
    target_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="started"
    )  # started/in_progress/completed/failed
    max_depth: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    max_pages: Mapped[int] = mapped_column(Integer, nullable=False, default=100)

    project: Mapped["Project"] = relationship("Project", back_populates="scans")
    pages: Mapped[list["Page"]] = relationship("Page", back_populates="scan")


# ---------------------------------------------------------------------------
# 6. pages
# ---------------------------------------------------------------------------
class Page(Base):
    __tablename__ = "pages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    scan_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("scans.id"), nullable=False
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    depth: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="ok"
    )  # ok/timeout/blocked
    content_hash: Mapped[str | None] = mapped_column(Text, nullable=True)

    scan: Mapped["Scan"] = relationship("Scan", back_populates="pages")
    tokens: Mapped[list["Token"]] = relationship("Token", back_populates="page")
    violations: Mapped[list["Violation"]] = relationship(
        "Violation", back_populates="page"
    )

    __table_args__ = (Index("idx_pages_scan_id", "scan_id"),)


# ---------------------------------------------------------------------------
# 7. tokens
# ---------------------------------------------------------------------------
class Token(Base):
    __tablename__ = "tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    page_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("pages.id"), nullable=True
    )
    text_id: Mapped[str | None] = mapped_column(
        String(36), nullable=True
    )  # будущий TextCheck
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    normal_form: Mapped[str] = mapped_column(Text, nullable=False)
    part_of_speech: Mapped[str] = mapped_column(String(10), nullable=False, default="OTHER")
    is_foreign: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_trademark: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    language_hint: Mapped[str] = mapped_column(
        String(10), nullable=False, default="ru"
    )  # ru/en/other

    page: Mapped["Page | None"] = relationship("Page", back_populates="tokens")
    violations: Mapped[list["Violation"]] = relationship(
        "Violation", back_populates="token"
    )

    __table_args__ = (
        Index("idx_tokens_page_id", "page_id"),
        Index("idx_tokens_normal_form", "normal_form"),
    )


# ---------------------------------------------------------------------------
# 8. violations
# ---------------------------------------------------------------------------
class Violation(Base):
    __tablename__ = "violations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    token_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("tokens.id"), nullable=True
    )
    page_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("pages.id"), nullable=True
    )
    text_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # foreign_word/no_russian_dub/unrecognized_word/trademark
    details: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    token: Mapped["Token | None"] = relationship("Token", back_populates="violations")
    page: Mapped["Page | None"] = relationship("Page", back_populates="violations")

    __table_args__ = (
        Index("idx_violations_page_id", "page_id"),
        Index("idx_violations_text_id", "text_id"),
        Index("idx_violations_token_id", "token_id"),  # FIX #12: индекс для token_id
        Index("idx_violations_page_type", "page_id", "type"),  # C3: для быстрой фильтрации по типу
    )


# ---------------------------------------------------------------------------
# 9. global_exceptions
# ---------------------------------------------------------------------------
class GlobalException(Base):
    __tablename__ = "global_exceptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    word: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
