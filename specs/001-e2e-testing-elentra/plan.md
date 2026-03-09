# Implementation Plan: E2E Full Testing (elentra.ru)

**Branch**: `001-e2e-testing-elentra` | **Date**: 2026-03-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-e2e-testing-elentra/spec.md`

## Summary

The goal is to implement a robust, depth-limited (depth 2) crawler and interactive tester for elentra.ru. The system will use Playwright (Python) to navigate the site, click every button, and report all errors with screenshots. It follows the project's CLI-first and TDD principles.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: playwright, beautifulsoup4 (for link extraction if needed), markdown
**Storage**: Local files (markdown reports, .png screenshots)
**Testing**: pytest (for unit tests of the crawler/tester logic)
**Target Platform**: Linux/Windows/macOS (anywhere with Playwright support)
**Project Type**: CLI tool / Test suite
**Performance Goals**: Complete depth 2 crawl and test in under 10 minutes.
**Constraints**: Depth must not exceed 2 to avoid infinite loops or excessive load.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

1. **Library-First**: The test logic will be encapsulated in a reusable module.
2. **CLI Interface**: The test will be triggered via a Python script with command-line arguments (e.g., `python test_crawl_elentra.py --url https://elentra.ru --depth 2`).
3. **Test-First**: I will first define the expected outputs and structure, then implement the crawler.
4. **Simplicity**: No complex database or backend is needed for this reporting tool.

## Project Structure

### Documentation (this feature)

```text
specs/001-e2e-testing-elentra/
├── plan.md              # This file
├── spec.md              # Feature specification
└── tasks.md             # Task tracking (to be created)
```

### Source Code (repository root)

```text
tests/
├── e2e_elentra/
│   ├── crawler.py       # Core logic for link discovery and BFS
│   ├── interactive.py   # Logic for button/element interaction
│   ├── reporter.py      # Markdown and screenshot generation
│   └── cli.py           # CLI entry point
└── unit/                # Unit tests for the above modules
```

**Structure Decision**: I've chosen a modular approach within a dedicated `tests/e2e_elentra/` directory to separate responsibilities (crawling, interaction, reporting).

## Complexity Tracking

| Violation     | Why Needed | Simpler Alternative Rejected Because |
| ------------- | ---------- | ------------------------------------ |
| None detected | N/A        | N/A                                  |
