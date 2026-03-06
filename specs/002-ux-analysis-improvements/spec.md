# Feature Specification: UX and Analysis Improvements (Phase 7)

**Feature Branch**: `002-ux-analysis-improvements`  
**Created**: 2026-03-06  
**Status**: Draft  
**Input**: User description: "UX feedback on ScanPage, poor text analysis on valid Russian words (e.g. аквакультура, и, Тверская), missing URL column in report, missing checks history."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Accurate Text Analysis (Priority: P1)

As a user, I want valid Russian words (like names, prepositions, specific terms) to not be flagged as foreign words just because they are missing from normative dictionaries, so that the report is accurate and not cluttered with false positives.

**Why this priority**: Core functionality flaw. False positives erode trust in the analysis tool.

**Independent Test**: Can be tested via POST `/api/v1/check_text` with input "Тверская аквакультура и Мелькомбинат". Expected: 0 foreign_word violations.

**Acceptance Scenarios**:

1. **Given** a text with valid Russian words missing from PDF dicts, **When** analyzed, **Then** no foreign_word violation is triggered.
2. **Given** a text with a completely unknown non-dictionary word (typo), **When** analyzed, **Then** it is flagged as `unrecognized_word`.

---

### User Story 2 - Scan History & UX Dashboard (Priority: P2)

As a user, I want to see my past scans so I don't have to re-scan the same project from scratch, and I want an improved table UX (URL column, Sorting) to quickly parse the violations.

**Why this priority**: Improves retention and perceived performance of the tool.

**Independent Test**: Can be tested by navigating to `/history` on the frontend and seeing past scans, then clicking one to view its details with the new URL column and Sort arrows.

**Acceptance Scenarios**:

1. **Given** previous scans in the DB, **When** I open HistoryPage, **Then** I see a list of past scans.
2. **Given** a Scan details page, **When** reviewing violations, **Then** I see the "URL" column and can sort by violation type.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST use `pymorphy3` vocabulary (`is_known`) as a fallback for Russian words missing from normative dictionaries.
- **FR-002**: System MUST classify completely unknown Cyrillic words as `unrecognized_word` instead of `foreign_word`.
- **FR-003**: System MUST provide a `GET /api/v1/scans` endpoint for scan history.
- **FR-004**: System MUST allow users to toggle screenshots via a `capture_screenshots` boolean during scanning.
- **FR-005**: UI MUST translate violation types into Russian (e.g., "Иностранная лексика").
- **FR-006**: UI MUST group identical violations or provide sorting to manage large tabular data.

### Key Entities

- **Scan**: Now needs to be easily listed with high-level summaries (date, url, status) for the History page.
- **Violation**: Needs a `page_url` attribute exposed clearly in the UI.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 0 false positives for common Russian prepositions and names on `melkom.ru`.
- **SC-002**: Users can access past scans instantly without waiting for a re-scan.
- **SC-003**: Scan table UX score improves (sortability, readability).
