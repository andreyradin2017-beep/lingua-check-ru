# Tasks: E2E Full Testing (elentra.ru)

**Input**: Design documents from `/specs/001-e2e-testing-elentra/`
**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initial structure for the testing suite

- [x] T001 Create directory `tests/e2e_elentra/`
- [x] T002 Initialize `tests/e2e_elentra/__init__.py`
- [x] T003 Setup logging configuration in `tests/e2e_elentra/cli.py`

---

## Phase 2: User Story 1 - Full Site Crawling (Priority: P1) 🎯 MVP

**Goal**: Breadth-first search crawler with depth limit 2

**Independent Test**: Run `python tests/e2e_elentra/cli.py --url https://elentra.ru --depth 1` and verify it finds top-level internal links.

- [x] T004 [P] [US1] Implement BFS crawler logic in `tests/e2e_elentra/crawler.py`
- [x] T005 [US1] Add link filtering (internal only, avoid duplicates)
- [x] T006 [US1] Implement depth-based termination logic

---

## Phase 3: User Story 2 - Interactive Element Testing (Priority: P1)

**Goal**: Interact with every button and capture errors

**Independent Test**: Run test on a specific page and check logs for "Clicked button [X]" entries.

- [x] T007 [P] [US2] Implement element discovery in `tests/e2e_elentra/interactive.py`
- [x] T008 [US2] Implement click/interaction logic with error handling
- [x] T009 [US2] Implement console log capturing for each interacton

---

## Phase 4: User Story 3 - Comprehensive Reporting (Priority: P2)

**Goal**: Markdown report and screenshot generation

**Independent Test**: Verify `E2E_TEST_REPORT.md` is generated and contains screenshot links.

- [x] T010 [P] [US3] Implement screenshot capture in `tests/e2e_elentra/reporter.py`
- [x] T011 [US3] Implement Markdown report generator (table format)
- [x] T012 [US3] Integrate all modules in `tests/e2e_elentra/cli.py`

---

## Phase 5: Execution & Verification

**Purpose**: Running the actual test against elentra.ru

- [x] T013 Run full test cycle for https://elentra.ru --depth 2
- [x] T014 Review generated report and screenshots
- [x] T015 Run project linters and fix any issues
- [x] T016 Final documentation update
