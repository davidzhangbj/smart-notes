# Research: Smart Notes Application

**Feature**: Smart Notes Application (001-smart-notes)
**Date**: 2026-02-12
**Purpose**: Technical research for implementation decisions

---

## 1. seekdb Embedded Mode Research

### Documentation Sources
- [pyseekdb SDK Get Started](https://raw.githubusercontent.com/oceanbase/seekdb-doc/V1.1.0/en-US/450.reference/900.sdk/10.pyseekdb-sdk/10.pyseekdb-sdk-get-started.md)
- [Python seekdb Embedded Mode](https://raw.githubusercontent.com/oceanbase/seekdb-doc/V1.1.0/en-US/400.guides/400.deploy/600.python-seekdb.md)
- [Using seekdb in Python SDK](https://raw.githubusercontent.com/oceanbase/seekdb-doc/V1.1.0/en-US/100.get-started/50.use-seekdb-with-sdk/25.using-seekdb-in-python-sdk.md)

### Key Findings

**Decision**: Use seekdb embedded mode via pyseekdb SDK

**Rationale**:
- Single `pip install -U pyseekdb` command installs both client and embedded seekdb
- No separate database server process needed
- All data stored locally in `./seekdb.db` directory
- Supports collection-based data model with automatic embedding functions
- Built-in hybrid search combining keyword and semantic search

**Alternatives Considered**:
- SQLite + external vector DB: More complex, two storage systems
- seekdb server mode: Unnecessary overhead for single-user local app
- Pure in-memory: No data persistence across restarts

### Environment Requirements

| Requirement | Value |
|-------------|-------|
| Operating System | Linux (glibc >= 2.28), macOS |
| Python Version | 3.11+ |
| Architecture | x86_64, aarch64 |

**Environment Check Command**:
```python
python3 -c 'import sys;import platform; print(f"Python: {platform.python_implementation()} {platform.python_version()}, System: {platform.system()} {platform.machine()}, {platform.libc_ver()[0]}: {platform.libc_ver()[1]}");'
```

### Connection Patterns

**Admin Client** (for database operations):
```python
import pyseekdb

admin = pyseekdb.AdminClient(path="./seekdb.db")
admin.create_database("smart_notes")
admin.list_databases()
admin.delete_database("smart_notes")
```

**Application Client** (for collection operations):
```python
import pyseekdb

client = pyseekdb.Client(path="./seekdb.db", database="smart_notes")
collection = client.create_collection(name="notes")
```

---

## 2. Hybrid Search Research

### Documentation Sources
- [Hybrid Search API](https://raw.githubusercontent.com/oceanbase/seekdb-doc/V1.1.0/en-US/450.reference/900.sdk/10.pyseekdb-sdk/50.apis/400.dql/400.hybrid-search-of-api.md)
- [Hybrid Search (SQL)](https://raw.githubusercontent.com/oceanbase/seekdb-doc/V1.1.0/en-US/200.develop/600.search/500.hybrid-search.md)

### Key Findings

**Decision**: Use seekdb's built-in `hybrid_search()` API

**Rationale**:
- Single API call combines full-text keyword search and vector semantic search
- Automatic ranking using RRF (Reciprocal Rank Fusion)
- Supports filtering on metadata and document content
- Automatic embedding generation for query texts
- Designed for sub-100ms query performance

### API Pattern

```python
results = collection.hybrid_search(
    query={
        "where_document": {"$contains": "keyword"},  # Full-text filter
        "where": {"category": {"$eq": "AI"}},        # Metadata filter
        "n_results": 10
    },
    knn={
        "query_texts": ["semantic query"],           # Auto-embedded
        "where": {"year": {"$gte": 2020}},           # Vector-side filter
        "n_results": 10
    },
    rank={"rrf": {}},                                # Ranking fusion
    n_results=5                                      # Final result count
)
```

### Search Types Supported

| Search Type | Description | Use Case |
|-------------|-------------|----------|
| Full-text | Exact keyword matching | Finding specific terms |
| Vector (KNN) | Semantic similarity | Finding related concepts |
| Hybrid | Combined with RRF ranking | Best of both worlds |

---

## 3. Embedding Functions Research

### Documentation Sources
- [Create Custom Embedding Functions](https://raw.githubusercontent.com/oceanbase/seekdb-doc/V1.1.0/en-US/450.reference/900.sdk/10.pyseekdb-sdk/60.embedding-funcations/200.create-custim-embedding-functions-of-api.md)
- [External Embedding Models](https://raw.githubusercontent.com/oceanbase/seekdb-doc/V1.1.0/en-US/200.develop/500.vector-embedding/300.external-embedding-models.md)

### Key Findings

**Decision**: Use seekdb's built-in embedding function (no external model needed)

**Rationale**:
- pyseekdb includes default embedding function
- Automatic vectorization on document insertion
- Automatic vectorization on search queries
- No need to manage separate embedding model service
- Satisfies "lightweight" and "mature technology" principles

### Collection Creation with Embedding

```python
collection = client.create_collection(
    name="notes",
    # embedding_function defaults to built-in
)
```

---

## 4. FastAPI Static Files Research

### Documentation Sources
- FastAPI official documentation for static file serving

### Key Findings

**Decision**: Use FastAPI's StaticFiles for serving frontend

**Rationale**:
- No separate web server needed
- Single Python process serves both API and static files
- CORS handled automatically for same-origin requests
- Simple deployment: `uvicorn main:app`

### Implementation Pattern

```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# API routes
@app.get("/api/notes")
async def list_notes():
    ...
```

---

## 5. Markdown Rendering Research

### Key Findings

**Decision**: Use marked.js library for client-side Markdown rendering

**Rationale**:
- No server-side rendering needed
- Real-time preview as user types
- Lightweight (~50KB minified)
- Mature library (10+ years production)
- CommonJS or ES module support

### Implementation

```html
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script>
  const rendered = marked.parse('# Hello\\n\\nThis is **markdown**');
</script>
```

---

## 6. Frontend Architecture Research

### Key Findings

**Decision**: Vanilla JavaScript with two-column layout

**Rationale**:
- No build step required
- Framework-free aligns with "lightweight" principle
- Modern browser APIs (fetch, async/await) sufficient
- CSS Grid/Flexbox for responsive layout

### Data Flow

```
┌─────────────┐     fetch()      ┌─────────────┐
│  Browser    │ ───────────────> │  FastAPI    │
│  (app.js)   │ <─────────────── │  (main.py)  │
└─────────────┘     JSON          └──────┬──────┘
                                        │
                                        ▼
                                 ┌─────────────┐
                                 │  seekdb     │
                                 │  (pyseekdb) │
                                 └─────────────┘
```

---

## 7. Performance Considerations

### Search Performance

| Metric | Target | seekdb Capability |
|--------|--------|-------------------|
| Keyword search | <50ms | Full-text index |
| Semantic search | <100ms | HNSW vector index |
| Hybrid search | <100ms | RRF fusion |

### Startup Performance

| Component | Target | Approach |
|-----------|--------|----------|
| Backend startup | <500ms | uvicorn with single worker |
| Frontend load | <200ms | Minimal HTML/CSS/JS |
| Database init | <100ms | Embedded seekdb lazy load |

---

## 8. Summary & Recommendations

### Technology Stack Confirmed

| Component | Technology | Confidence |
|-----------|------------|------------|
| Backend | Python 3.11+, FastAPI | High |
| Database | seekdb embedded (pyseekdb) | High |
| Frontend | HTML, CSS, vanilla JavaScript | High |
| Markdown | marked.js | High |
| Server | uvicorn | High |

### Architecture Decisions

1. **Single-process architecture**: FastAPI + embedded seekdb in one process
2. **Collection-based data model**: One collection for notes with tags as metadata
3. **Hybrid search default**: All searches use hybrid_search() for best results
4. **Auto-save on edit**: No manual save button, save as user types
5. **Real-time search preview**: Debounced search on each keystroke

### Next Steps

1. Design data model (data-model.md)
2. Define API contracts (contracts/)
3. Create quickstart guide (quickstart.md)
