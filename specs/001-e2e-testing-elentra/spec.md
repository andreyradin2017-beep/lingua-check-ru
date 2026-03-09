# Feature Specification: E2E Full Testing (elentra.ru)

**Feature Branch**: `001-e2e-testing-elentra`  
**Created**: 2026-03-08  
**Status**: Draft  
**Input**: User description: "Проиндексируй проект целиком. Запусти полный цикл тестирования через Playwright все страницы, и на каждой странице все возможности и кнопки. Тестируй https://elentra.ru с глубиной 2."

## User Scenarios & Testing (mandatory)

### User Story 1 - Full Site Crawling (Priority: P1)

As a developer, I want to automatically discover all pages on elentra.ru up to depth 2, so that I don't miss any part of the application during testing.

**Why this priority**: Correct discovery is the foundation for full testing coverage.

**Independent Test**: Can be tested by running the crawler and verifying that it finds the main sections (Home, About, Services, etc.) within 2 clicks from the homepage.

**Acceptance Scenarios**:

1. **Given** the URL https://elentra.ru, **When** I run the crawler with depth 2, **Then** all reachable internal links are identified and queued for testing.
2. **Given** a list of discovered URLs, **When** the crawler completes, **Then** no external links or deep links (>depth 2) are included in the results.

---

### User Story 2 - Interactive Element Testing (Priority: P1)

As a QA engineer, I want the system to interact with every button and form on every discovered page, so that I can ensure all UI functionalities work as expected.

**Why this priority**: Buttons and interactive elements are where most user-facing bugs occur.

**Independent Test**: Can be tested on a single page (e.g., Homepage) to verify that all buttons are identified and can be clicked/interacted with.

**Acceptance Scenarios**:

1. **Given** a page with various buttons, **When** the test runs, **Then** every button is clicked and any navigation or state change is recorded.
2. **Given** an interactive element, **When** it is clicked and causes an error, **Then** the error is captured in the test logs.

---

### User Story 3 - Comprehensive Reporting (Priority: P2)

As a manager, I want a detailed Markdown report with screenshots of every tested page and a summary of all errors, so that I can quickly assess the health of the site.

**Why this priority**: Results must be actionable and easy to review.

**Independent Test**: Can be verified by checking the existence and content of the `E2E_TEST_REPORT.md` and screenshot directory after a test run.

**Acceptance Scenarios**:

1. **Given** a completed test run, **When** I open the report, **Then** I see a table with Status (Pass/Fail) for every page and link to screenshots.
2. **Given** a failed interaction, **When** I check the report, **Then** the specific error message and console logs are visible for that interaction.

## Requirements (mandatory)

### Functional Requirements

- **FR-001**: System MUST perform a breadth-first search (BFS) crawl up to depth 2.
- **FR-002**: System MUST identify all `button`, `a`, and `input` elements on each page.
- **FR-003**: System MUST provide a CLI interface to trigger the test (as per project constitution).
- **FR-004**: System MUST capture full-page screenshots for every visited URL.
- **FR-005**: System MUST log browser console errors (javascript errors, failed network requests).

### Key Entities (include if feature involves data)

- **TestSession**: Represents a single run of the full test cycle.
- **PageResult**: Stores the outcome, screenshots, and console logs for a specific URL.

## Success Criteria (mandatory)

### Measurable Outcomes

- **SC-001**: 100% of internal links at depth 1 and 2 are visited and checked.
- **SC-002**: All JavaScript console errors are captured and reported.
- **SC-003**: A complete Markdown report is generated within 5 minutes of test completion.
