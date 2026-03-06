# Implementation Plan: UX and Analysis Improvements (Phase 7)

**Branch**: `002-ux-analysis-improvements` | **Date**: 2026-03-06 | **Spec**: `specs/002-ux-analysis-improvements/spec.md`
**Input**: Feature specification from `specs/002-ux-analysis-improvements/spec.md`

## Summary

Enhance the token analysis engine to reduce false positives by leveraging `pymorphy3`'s internal vocabulary for Cyrillic words missing from normative dictionaries. Upgrade the React frontend to include a scan history page, UI sorting/filtering, and translated violation badges. Add an optional screenshot toggle to speed up scanning.

## Technical Context

**Language/Version**: Python 3.12, TypeScript
**Primary Dependencies**: FastAPI, SQLAlchemy, PyMorphy3, React, Mantine UI
**Storage**: SQLite
**Target Platform**: Windows / Web
**Project Type**: Web Application

## Constitution Check

_GATE: Pass. The solution emphasizes simplicity and re-uses existing dependencies (pymorphy3)._

## Project Structure

### Documentation

```text
specs/002-ux-analysis-improvements/
├── plan.md              # This file
├── spec.md              # Feature specification
```

### Source Code

```text
backend/
├── app/
│   ├── routers/scan.py      # Add GET /api/v1/scans
│   ├── services/token_service.py # Update normal_form & is_known logic
│   └── schemas.py           # Add capture_screenshots to request schema

frontend/
├── src/
│   ├── pages/
│   │   ├── HistoryPage.tsx  # NEW
│   │   ├── ScanPage.tsx     # Add sort, URL column, refactor badges
│   │   └── HomePage.tsx     # Add links to history / dashboard elements
```

**Structure Decision**: Standard Fullstack Web Application (Option 2).
