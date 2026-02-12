# Tasks: Smart Notes Application

**Input**: Design documents from `/specs/001-smart-notes/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - only include if explicitly requested in feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web application**: `main.py` (backend root), `static/` (frontend root)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project directory structure with main.py and static/ folder at repository root
- [X] T002 Create requirements.txt with fastapi>=0.104.0, uvicorn[standard]>=0.24.0, pyseekdb>=1.0.0, python-multipart>=0.0.6
- [X] T003 [P] Create README.md with project description and quickstart instructions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Initialize seekdb database connection in main.py using AdminClient to create 'smart_notes' database
- [X] T005 Initialize seekdb 'notes' collection in main.py using Client with embedding function for auto-vectorization
- [X] T006 Set up FastAPI application with CORS middleware and static file mounting in main.py
- [X] T007 Create health check endpoint GET /api/health in main.py that returns database status
- [X] T008 Define Pydantic models for Note (id, title, content, tags, created_at, updated_at) in main.py

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Note Management (Priority: P1) 🎯 MVP

**Goal**: Enable users to create, edit, view, and delete notes with Markdown support

**Independent Test**: Create a note, edit its content, verify Markdown preview renders correctly, delete the note

### Implementation for User Story 1

- [X] T009 [P] [US1] Create POST /api/notes endpoint in main.py that creates notes with UUID generation and timestamps
- [X] T010 [P] [US1] Create GET /api/notes endpoint in main.py that lists all notes ordered by updated_at desc
- [X] T011 [P] [US1] Create GET /api/notes/{note_id} endpoint in main.py that returns a single note by ID
- [X] T012 [P] [US1] Create PUT /api/notes/{note_id} endpoint in main.py that updates note content and preserves created_at
- [X] T013 [P] [US1] Create DELETE /api/notes/{note_id} endpoint in main.py with confirmation check
- [X] T014 [US1] Create static/index.html with two-column layout (note list left, editor/preview right)
- [X] T015 [P] [US1] Create static/styles.css with responsive two-column grid layout and editor/preview styling
- [X] T016 [US1] Implement fetch API calls in static/app.js for notes CRUD operations (list, get, create, update, delete)
- [X] T017 [US1] Add auto-save functionality in static/app.js with debounced PUT requests on input changes
- [X] T018 [US1] Integrate marked.js library in static/index.html for Markdown rendering preview
- [X] T019 [US1] Implement note selection and display logic in static/app.js to populate editor on click
- [X] T020 [US1] Add "New Note" button functionality in static/app.js that creates empty note and selects it
- [X] T021 [US1] Add delete confirmation dialog in static/app.js before calling DELETE endpoint

**Checkpoint**: At this point, User Story 1 should be fully functional - users can create, edit, preview Markdown, and delete notes

---

## Phase 4: User Story 2 - Search (Priority: P2)

**Goal**: Enable hybrid search combining keyword matching and semantic understanding

**Independent Test**: Create notes about "Docker" and "Kubernetes", search for "containerization", verify both notes appear in results

### Implementation for User Story 2

- [X] T022 [P] [US2] Create GET /api/search endpoint in main.py that uses collection.hybrid_search() with query and knn parameters
- [X] T023 [P] [US2] Add tag filter support to /api/search endpoint in main.py using where clause on metadata tags
- [X] T024 [US2] Implement relevance score extraction and result sorting in main.py search endpoint
- [X] T025 [US2] Add search input box in static/index.html positioned at top of interface per FR-011
- [X] T026 [US2] Implement debounced search fetch in static/app.js with 300ms delay to avoid excessive API calls
- [X] T027 [US2] Add search results display logic in static/app.js that shows matched notes in note list
- [X] T028 [US2] Implement "clear search" functionality in static/app.js that restores full note list when search box is cleared
- [X] T029 [US2] Add "No results found" message display in static/app.js when search returns empty results

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - search finds notes by keyword and semantic similarity

---

## Phase 5: User Story 3 - Tags (Priority: P3)

**Goal**: Enable tag-based organization and filtering of notes

**Independent Test**: Add tags to notes, view tags in note list, click tag to filter notes, remove tag from note

### Implementation for User Story 3

- [X] T030 [P] [US3] Add tag input UI component to note editor in static/index.html for adding/removing tags
- [X] T031 [P] [US3] Implement tag display in note list items in static/index.html showing all associated tags
- [X] T032 [US3] Add tag filtering click handler in static/app.js that calls GET /api/notes?tag=xxx
- [X] T033 [US3] Implement tag removal functionality in static/app.js that updates note without the removed tag
- [X] T034 [US3] Add tag filter active state indication in static/app.js showing which tag is currently filtered
- [X] T035 [US3] Create GET /api/tags endpoint in main.py that aggregates all tags with note counts
- [X] T036 [US3] Add tag filter sidebar or dropdown in static/index.html populated from /api/tags endpoint

**Checkpoint**: All user stories should now be independently functional - notes can be organized and filtered by tags

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T037 [P] Create GET /api/export endpoint in main.py that returns all notes in JSON export format per contracts/api.md
- [X] T038 [P] Add error handling middleware in main.py for consistent error responses per contracts/api.md
- [X] T039 Add edge case handling in main.py for notes without titles (use content as fallback)
- [X] T040 Add edge case handling in main.py for large content validation (max 100,000 characters)
- [X] T041 Add input validation in main.py for tag limits (max 20 tags, 50 chars each)
- [X] T042 [P] Add loading states to API calls in static/app.js for better UX feedback
- [X] T043 [P] Add keyboard shortcuts in static/app.js (Ctrl+N for new note, Ctrl+S to save)
- [X] T044 Improve visual design in static/styles.css with better typography and spacing
- [X] T045 Test quickstart.md validation - run through installation and first-time setup
- [X] T046 Verify all acceptance scenarios from spec.md pass for each user story

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P2): Can start after Foundational - Integrates with US1 data but independent implementation
  - User Story 3 (P3): Can start after Foundational - Extends US1/US2 but independent implementation
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation for all stories - provides CRUD operations
- **User Story 2 (P2)**: Depends on US1 data structure, but can develop and test in parallel
- **User Story 3 (P3)**: Depends on US1 CRUD, can add tag features independently

### Within Each User Story

- Backend endpoints can be developed in parallel (marked [P])
- Frontend components can be developed in parallel (marked [P])
- Integration happens when frontend calls backend

### Parallel Opportunities

**Phase 1 (Setup)**: All tasks can run in parallel
- T001, T002, T003 are independent

**Phase 2 (Foundational)**: T007, T008 can run in parallel after T004-T006 complete
- T007 and T008 are independent once app is set up

**Phase 3 (User Story 1)**: Backend endpoints (T009-T013) can run in parallel
- All 5 CRUD endpoints are independent
- Frontend files (T015, static/styles.css) is independent
- Frontend JS tasks (T016-T021) depend on T014-T015

**Phase 4 (User Story 2)**: T022-T024 (backend), T025 (HTML) can run in parallel
- Backend search logic independent of frontend UI
- Frontend search UI can be built alongside

**Phase 5 (User Story 3)**: T030-T031 (UI) can run in parallel with T035 (backend)
- Tag UI components independent of tag listing endpoint

**Phase 6 (Polish)**: Many tasks marked [P] can run in parallel
- Export endpoint independent of error handling
- Loading states independent of keyboard shortcuts

---

## Parallel Example: User Story 1 Backend

```bash
# Launch all CRUD endpoints together:
Task: "Create POST /api/notes endpoint in main.py"
Task: "Create GET /api/notes endpoint in main.py"
Task: "Create GET /api/notes/{note_id} endpoint in main.py"
Task: "Create PUT /api/notes/{note_id} endpoint in main.py"
Task: "Create DELETE /api/notes/{note_id} endpoint in main.py"
```

---

## Parallel Example: User Story 1 Frontend

```bash
# Launch HTML and CSS in parallel:
Task: "Create static/index.html with two-column layout"
Task: "Create static/styles.css with responsive layout"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test note creation, editing, Markdown preview, deletion
5. Demo if ready - this is a functional notes app

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → MVP deliverable
3. Add User Story 2 → Test independently → Search-enabled app
4. Add User Story 3 → Test independently → Full-featured app
5. Polish → Production-ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (backend endpoints)
   - Developer B: User Story 1 (frontend HTML/CSS)
   - Developer C: User Story 2 (search backend)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- File paths are exact relative to repository root
- Backend: single file `main.py` at root per project structure
- Frontend: files in `static/` directory per project structure
