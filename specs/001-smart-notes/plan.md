# Implementation Plan: Smart Notes Application

**Branch**: `001-smart-notes` | **Date**: 2026-02-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-smart-notes/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a single-user, browser-based personal notes application with local data storage. The application features a two-column layout (note list + editor/preview), Markdown support, tag-based organization, and intelligent hybrid search combining keyword matching and semantic understanding. The technical stack uses Python FastAPI backend, seekdb embedded database for search capabilities, and vanilla HTML/CSS/JavaScript frontend.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: FastAPI (web framework), pyseekdb (seekdb embedded client), uvicorn (ASGI server)
**Storage**: seekdb (embedded mode) - stores notes, tags, and vector embeddings locally
**Testing**: pytest (Python), browser testing
**Target Platform**: Local web application (localhost)
**Project Type**: web (backend + static frontend)
**Performance Goals**: Search <100ms p95, startup <500ms, 60fps UI responsiveness
**Constraints**: Single-user, local-only (no cloud), offline-capable
**Scale/Scope**: Typical usage of up to a few thousand notes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Search-First (NON-NEGOTIABLE)

**Status**: ✅ PASS

| Requirement | Implementation |
|-------------|----------------|
| Search MUST return accurate results | seekdb hybrid search combines keyword + semantic |
| Search MUST be fast (<100ms) | Embedded seekdb, local queries, HNSW vector index |
| Search indexing considered in data model | Collection design includes embedding functions |
| Search relevance validated | hybrid_search() with RRF ranking |
| No feature degrades search | Simple architecture, minimal overhead |

### II. Single User, Lightweight

**Status**: ✅ PASS

| Requirement | Implementation |
|-------------|----------------|
| NO authentication | Single-user local app, no login |
| NO sharing/collaboration | Local database only |
| NO real-time sync | All data stored locally |
| NO microservices | Single FastAPI process |
| YAGNI principles | Minimal features, vanilla JS frontend |

### III. Local Data Storage

**Status**: ✅ PASS

| Requirement | Implementation |
|-------------|----------------|
| Notes stored locally | seekdb embedded mode stores in ./seekdb.db |
| NO cloud persistence | All data in local filesystem |
| User data ownership | SQLite-based files owned by user |
| Export/portability | seekdb data exportable, JSON API available |

### IV. Mature Technology Stack

**Status**: ✅ PASS

| Technology | Maturity | Justification |
|------------|----------|---------------|
| Python 3.11+ | 2+ years production | Released 2022, stable |
| FastAPI | 5+ years production | Released 2018, widely adopted |
| seekdb/pyseekdb | Mature | Comprehensive documentation, production-ready |
| HTML/CSS/JavaScript | 20+ years | Web standards, universal support |
| uvicorn | 5+ years | Standard ASGI server |

### V. Documentation-Driven Development

**Status**: ✅ PASS (SEEKDB RESEARCH COMPLETED)

| Aspect | Documentation Reference |
|--------|-------------------------|
| pyseekdb installation | [pyseekdb SDK Get Started](https://raw.githubusercontent.com/oceanbase/seekdb-doc/V1.1.0/en-US/450.reference/900.sdk/10.pyseekdb-sdk/10.pyseekdb-sdk-get-started.md) |
| Embedded mode deployment | [Python seekdb Embedded Mode](https://raw.githubusercontent.com/oceanbase/seekdb-doc/V1.1.0/en-US/400.guides/400.deploy/600.python-seekdb.md) |
| Client connection | [Client API](https://raw.githubusercontent.com/oceanbase/seekdb-doc/V1.1.0/en-US/450.reference/900.sdk/10.pyseekdb-sdk/50.apis/50.client.md) |
| Hybrid search | [Hybrid Search API](https://raw.githubusercontent.com/oceanbase/seekdb-doc/V1.1.0/en-US/450.reference/900.sdk/10.pyseekdb-sdk/50.apis/400.dql/400.hybrid-search-of-api.md) |
| Vector search | [Vector Search Overview](https://raw.githubusercontent.com/oceanbase/seekdb-doc/V1.1.0/en-US/200.develop/600.search/300.vector-search/100.vector-search-intro.md) |

**Constitution Check Result**: ✅ ALL GATES PASSED - Proceed to Phase 0 Research

## Project Structure

### Documentation (this feature)

```text
specs/001-smart-notes/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
smart-notes/
├── main.py              # FastAPI application entry point
├── static/              # Frontend static files
│   ├── index.html       # Main application HTML
│   ├── styles.css       # Application styles
│   └── app.js          # Frontend JavaScript
├── seekdb.db/           # seekdb embedded database directory (created at runtime)
├── requirements.txt     # Python dependencies
└── README.md           # Application documentation
```

**Structure Decision**: Web application structure with backend serving static frontend files. This architecture satisfies the browser access requirement while maintaining simplicity (single FastAPI process). Frontend uses vanilla JavaScript to align with "lightweight" principle - no build step, no framework complexity.

## Complexity Tracking

> No constitution violations - complexity tracking not required.

All design decisions align with Smart Notes Constitution principles:
- Search-first architecture with seekdb hybrid search
- Single-user, no auth complexity
- Local-only data storage
- Mature, well-documented technologies
- All seekdb design decisions backed by official documentation

---

## Phase 0: Research Summary

### seekdb Embedded Mode - Key Findings

**Installation**: `pip install -U pyseekdb` automatically installs embedded seekdb

**Prerequisites**:
- Operating system: Linux (glibc >= 2.28), macOS, or Windows (embedded mode Linux/macOS only)
- Python version: 3.11+
- System architecture: x86_64, aarch64

**Connection Pattern**:
```python
# Admin client for database operations
admin = pyseekdb.AdminClient(path="./seekdb.db")
admin.create_database("smart_notes")

# Regular client for collection operations
client = pyseekdb.Client(path="./seekdb.db", database="smart_notes")
```

### Hybrid Search Capability

**seekdb provides built-in hybrid search** combining:
- Full-text keyword search (exact matching)
- Vector semantic search (similarity matching)
- RRF (Reciprocal Rank Fusion) ranking

**API Pattern** (from documentation):
```python
collection.hybrid_search(
    query={"where_document": {"$contains": "keyword"}, "n_results": 10},
    knn={"query_texts": ["semantic query"], "n_results": 10},
    rank={"rrf": {}},
    n_results=5
)
```

**Relevance to Smart Notes**: This directly satisfies FR-013 (semantic search) and FR-016 (100ms search performance) with a single API call.

### Embedding Functions

**pyseekdb supports automatic embedding generation**:
- Collections can be created with `embedding_function` parameter
- Documents are automatically vectorized when added
- Search queries are automatically vectorized when using `query_texts`

**Impact**: No need for external embedding service or model management - seekdb handles it internally.

### FastAPI + Static Files

**Pattern for serving static files**:
```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
```

**Single file structure**: All API routes and static file serving in `main.py` as specified.

---

*Proceed to Phase 1: Data Model & Contracts*
