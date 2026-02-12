"""
Smart Notes Application

A single-user, browser-based personal notes application with local data storage.
Features: Note management (CRUD), Markdown support, hybrid search (keyword + semantic),
         tag-based organization.

Tech Stack: Python 3.11+, FastAPI, pyseekdb (embedded), vanilla HTML/CSS/JavaScript
"""

import time
import uuid
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field, validator
from pyseekdb import AdminClient, Client
import uvicorn

# =============================================================================
# Configuration
# =============================================================================
DB_PATH = "./seekdb.db"
DATABASE_NAME = "smart_notes"
COLLECTION_NAME = "notes"
APP_VERSION = "1.0.0"

# =============================================================================
# Pydantic Models
# =============================================================================
class NoteCreate(BaseModel):
    """Model for creating a new note."""
    title: Optional[str] = Field(None, max_length=200, description="Note title")
    content: str = Field(..., max_length=100000, description="Markdown content")
    tags: List[str] = Field(default_factory=list, description="Tag names")

    @validator('tags')
    def validate_tags(cls, v):
        if len(v) > 20:
            raise ValueError("Maximum 20 tags allowed")
        for tag in v:
            if len(tag) > 50:
                raise ValueError(f"Tag '{tag}' exceeds maximum length of 50 characters")
        return v


class NoteUpdate(BaseModel):
    """Model for updating an existing note."""
    title: Optional[str] = Field(None, max_length=200, description="Note title")
    content: Optional[str] = Field(None, max_length=100000, description="Markdown content")
    tags: Optional[List[str]] = Field(None, description="Tag names")

    @validator('tags')
    def validate_tags(cls, v):
        if v is not None and len(v) > 20:
            raise ValueError("Maximum 20 tags allowed")
        if v is not None:
            for tag in v:
                if len(tag) > 50:
                    raise ValueError(f"Tag '{tag}' exceeds maximum length of 50 characters")
        return v


class NoteResponse(BaseModel):
    """Model for note response."""
    id: str
    title: str
    content: str
    tags: List[str]
    created_at: int
    updated_at: int


class HealthResponse(BaseModel):
    """Model for health check response."""
    status: str
    database: str
    version: str


class TagResponse(BaseModel):
    """Model for tag response."""
    name: str
    count: int


# =============================================================================
# Global Variables (initialized on startup)
# =============================================================================
admin_client: Optional[AdminClient] = None
db_client: Optional[Client] = None
notes_collection = None

# =============================================================================
# Database Initialization
# =============================================================================
def init_database():
    """Initialize seekdb database and collection."""
    global admin_client, db_client, notes_collection

    # Create admin client and database
    admin_client = AdminClient(path=DB_PATH)
    databases = admin_client.list_databases()

    if DATABASE_NAME not in databases:
        admin_client.create_database(DATABASE_NAME)
        print(f"Created database: {DATABASE_NAME}")

    # Create application client
    db_client = Client(path=DB_PATH, database=DATABASE_NAME)

    # Get or create notes collection with embedding function
    collections = db_client.list_collections()
    collection_names = [c.name for c in collections]

    if COLLECTION_NAME not in collection_names:
        notes_collection = db_client.create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine", "hnsw:M": 16, "hnsw:construction_ef": 64}
        )
        print(f"Created collection: {COLLECTION_NAME}")
    else:
        notes_collection = db_client.get_collection(COLLECTION_NAME)
        print(f"Connected to collection: {COLLECTION_NAME}")

    return admin_client, db_client, notes_collection


# =============================================================================
# FastAPI Application
# =============================================================================
app = FastAPI(
    title="Smart Notes API",
    description="A personal notes application with hybrid search",
    version=APP_VERSION
)
# Serve frontend at root
@app.get("/")
async def index():
    """Serve the main single-page app."""
    return FileResponse("static/index.html")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")


# =============================================================================
# Error Handling
# =============================================================================
class AppError(Exception):
    """Base application error."""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR"):
        self.message = message
        self.code = code


@app.exception_handler(AppError)
async def app_error_handler(request, exc):
    """Handle application errors."""
    return JSONResponse(
        status_code=400,
        content={"success": False, "error": {"code": exc.code, "message": exc.message}}
    )


@app.exception_handler(Exception)
async def general_error_handler(request, exc):
    """Handle general errors."""
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": {"code": "INTERNAL_ERROR", "message": str(exc)}}
    )


# =============================================================================
# Utility Functions
# =============================================================================
def note_to_dict(note_id: str, document: str, metadata: dict) -> dict:
    """Convert seekdb note to response dictionary.

    seekdb stores title + content together in the document field.
    Format: "title\\n\\ncontent" or just "content" if no title.
    """
    # Parse document to extract title and content
    if "\n\n" in document:
        title, content = document.split("\n\n", 1)
        # Remove leading # if title is markdown heading
        if title.startswith("#"):
            title = title.lstrip("#").strip()
    else:
        title = ""
        content = document

    return {
        "id": note_id,
        "title": title,
        "content": content,
        "tags": metadata.get("tags", []),
        "created_at": metadata.get("created_at", 0),
        "updated_at": metadata.get("updated_at", 0)
    }


def document_from_note(title: Optional[str], content: str) -> str:
    """Create seekdb document from note title and content."""
    if title:
        return f"{title}\n\n{content}"
    return content


# =============================================================================
# Health Check Endpoint
# =============================================================================
@app.get("/api/health", response_model=dict)
async def health_check():
    """Health check endpoint."""
    try:
        # Test database connection
        if db_client is None:
            return {
                "success": True,
                "data": {
                    "status": "starting",
                    "database": "initializing",
                    "version": APP_VERSION
                }
            }

        collections = db_client.list_collections()
        return {
            "success": True,
            "data": {
                "status": "healthy",
                "database": "connected",
                "version": APP_VERSION,
                "collections": len(collections)
            }
        }
    except Exception as e:
        return {
            "success": True,
            "data": {
                "status": "degraded",
                "database": f"error: {str(e)}",
                "version": APP_VERSION
            }
        }


# =============================================================================
# Note Endpoints
# =============================================================================
@app.get("/api/notes")
async def list_notes(tag: Optional[str] = Query(None), limit: int = Query(100, le=500)):
    """List all notes, optionally filtered by tag."""
    try:
        where_clause = {}
        if tag:
            where_clause = {"tags": {"$in": [tag]}}

        results = notes_collection.get(
            where=where_clause,
            limit=limit,
            include=["documents", "metadatas"]
        )

        notes = []
        for i, note_id in enumerate(results['ids']):
            note_dict = note_to_dict(
                note_id,
                results['documents'][i],
                results['metadatas'][i]
            )
            notes.append(note_dict)

        # Sort by updated_at descending
        notes.sort(key=lambda x: x['updated_at'], reverse=True)

        return {
            "success": True,
            "data": {
                "notes": notes,
                "total": len(notes)
            }
        }
    except Exception as e:
        raise AppError(f"Failed to list notes: {str(e)}", "DATABASE_ERROR")


@app.get("/api/notes/{note_id}")
async def get_note(note_id: str):
    """Get a single note by ID."""
    try:
        results = notes_collection.get(
            ids=[note_id],
            include=["documents", "metadatas"]
        )

        if not results['ids']:
            raise AppError(f"Note with ID '{note_id}' not found", "NOTE_NOT_FOUND")

        note_dict = note_to_dict(
            results['ids'][0],
            results['documents'][0],
            results['metadatas'][0]
        )

        return {
            "success": True,
            "data": note_dict
        }
    except AppError:
        raise
    except Exception as e:
        raise AppError(f"Failed to get note: {str(e)}", "DATABASE_ERROR")


@app.post("/api/notes")
async def create_note(note: NoteCreate):
    """Create a new note."""
    try:
        note_id = str(uuid.uuid4())
        now = int(time.time())

        document = document_from_note(note.title, note.content)

        notes_collection.add(
            ids=[note_id],
            documents=[document],
            metadatas=[{
                "tags": note.tags,
                "created_at": now,
                "updated_at": now
            }]
        )

        note_dict = {
            "id": note_id,
            "title": note.title or "",
            "content": note.content,
            "tags": note.tags,
            "created_at": now,
            "updated_at": now
        }

        return {
            "success": True,
            "data": note_dict
        }
    except Exception as e:
        raise AppError(f"Failed to create note: {str(e)}", "DATABASE_ERROR")


@app.put("/api/notes/{note_id}")
async def update_note(note_id: str, note: NoteUpdate):
    """Update an existing note."""
    try:
        # Get existing note to preserve created_at
        results = notes_collection.get(
            ids=[note_id],
            include=["documents", "metadatas"]
        )

        if not results['ids']:
            raise AppError(f"Note with ID '{note_id}' not found", "NOTE_NOT_FOUND")

        existing_metadata = results['metadatas'][0]
        created_at = existing_metadata.get("created_at", int(time.time()))
        now = int(time.time())

        # Build update data
        new_title = note.title if note.title is not None else None
        new_content = note.content if note.content is not None else None
        new_tags = note.tags if note.tags is not None else None

        # If only updating some fields, get existing values
        if new_title is None or new_content is None:
            existing_doc = results['documents'][0]
            if "\n\n" in existing_doc:
                existing_title, existing_content = existing_doc.split("\n\n", 1)
                if existing_title.startswith("#"):
                    existing_title = existing_title.lstrip("#").strip()
            else:
                existing_title = ""
                existing_content = existing_doc

            if new_title is None:
                new_title = existing_title
            if new_content is None:
                new_content = existing_content

        if new_tags is None:
            new_tags = existing_metadata.get("tags", [])

        document = document_from_note(new_title, new_content)

        notes_collection.update(
            ids=[note_id],
            documents=[document],
            metadatas=[{
                "tags": new_tags,
                "created_at": created_at,
                "updated_at": now
            }]
        )

        note_dict = {
            "id": note_id,
            "title": new_title or "",
            "content": new_content or "",
            "tags": new_tags,
            "created_at": created_at,
            "updated_at": now
        }

        return {
            "success": True,
            "data": note_dict
        }
    except AppError:
        raise
    except Exception as e:
        raise AppError(f"Failed to update note: {str(e)}", "DATABASE_ERROR")


@app.delete("/api/notes/{note_id}")
async def delete_note(note_id: str):
    """Delete a note by ID."""
    try:
        # Check if note exists
        results = notes_collection.get(ids=[note_id])

        if not results['ids']:
            raise AppError(f"Note with ID '{note_id}' not found", "NOTE_NOT_FOUND")

        notes_collection.delete(ids=[note_id])

        return {
            "success": True,
            "data": {"deleted": True}
        }
    except AppError:
        raise
    except Exception as e:
        raise AppError(f"Failed to delete note: {str(e)}", "DATABASE_ERROR")


# =============================================================================
# Search Endpoints
# =============================================================================
@app.get("/api/search")
async def search_notes(
    q: str = Query(..., min_length=1, description="Search query"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    limit: int = Query(1, le=100, description="Max results")
):
    """Search notes using hybrid search (keyword + semantic)."""
    try:
        # Build where clause for tag filter
        query_where = {}
        knn_where = {}

        if tag:
            query_where = {"tags": {"$in": [tag]}}
            knn_where = {"tags": {"$in": [tag]}}

        # Perform hybrid search
        results = notes_collection.hybrid_search(
            query={
                "where_document": {"$contains": q},
                "where": query_where,
                "n_results": 50
            },
            knn={
                "query_texts": [q],
                "where": knn_where,
                "n_results": 50
            },
            rank={"rrf": {}},
            n_results=limit
        )

        notes = []
        for i, note_id in enumerate(results['ids'][0]):
            # Get full metadata for this note
            full_results = notes_collection.get(
                ids=[note_id],
                include=["documents", "metadatas"]
            )
            if full_results['ids']:
                note_dict = note_to_dict(
                    full_results['ids'][0],
                    full_results['documents'][0],
                    full_results['metadatas'][0]
                )
                # Add relevance score if available
                if 'distances' in results and len(results['distances']) > 0:
                    distance = results['distances'][0][i]
                    d = float(distance)  # avoid float + Decimal TypeError
                    note_dict['score'] = round(1.0 / (1.0 + d), 4)
                notes.append(note_dict)

        return {
            "success": True,
            "data": {
                "query": q,
                "results": notes,
                "total": len(notes)
            }
        }
    except Exception as e:
        raise AppError(f"Search failed: {str(e)}", "DATABASE_ERROR")


# =============================================================================
# Tag Endpoints
# =============================================================================
@app.get("/api/tags")
async def list_tags():
    """Get all tags with note counts."""
    try:
        # Get all notes
        results = notes_collection.get(
            limit=1000,
            include=["metadatas"]
        )

        tag_counts = {}
        for metadata in results['metadatas']:
            tags = metadata.get("tags", [])
            for tag in tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1

        # Convert to list and sort by count
        tags_list = [{"name": tag, "count": count} for tag, count in tag_counts.items()]
        tags_list.sort(key=lambda x: x["count"], reverse=True)

        return {
            "success": True,
            "data": {
                "tags": tags_list
            }
        }
    except Exception as e:
        raise AppError(f"Failed to list tags: {str(e)}", "DATABASE_ERROR")


# =============================================================================
# Export Endpoint
# =============================================================================
@app.get("/api/export")
async def export_notes():
    """Export all notes in JSON format."""
    try:
        results = notes_collection.get(
            limit=10000,
            include=["documents", "metadatas"]
        )

        notes = []
        for i, note_id in enumerate(results['ids']):
            note_dict = note_to_dict(
                note_id,
                results['documents'][i],
                results['metadatas'][i]
            )
            notes.append(note_dict)

        return {
            "success": True,
            "data": {
                "version": "1.0",
                "exported_at": int(time.time()),
                "notes": notes,
                "total": len(notes)
            }
        }
    except Exception as e:
        raise AppError(f"Export failed: {str(e)}", "DATABASE_ERROR")


# =============================================================================
# Startup Event
# =============================================================================
@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup."""
    global admin_client, db_client, notes_collection
    try:
        init_database()
        print("Smart Notes application started successfully")
        print(f"Database: {DB_PATH}")
        print(f"Access at: http://localhost:8000")
    except Exception as e:
        print(f"Error during startup: {e}")
        raise


# =============================================================================
# Main Entry Point
# =============================================================================
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
