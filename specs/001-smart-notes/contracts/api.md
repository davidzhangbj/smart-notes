# API Contract: Smart Notes Application

**Feature**: Smart Notes Application (001-smart-notes)
**Version**: 1.0.0
**Protocol**: HTTP/JSON
**Base URL**: `http://localhost:8000`

---

## Overview

The Smart Notes API provides RESTful endpoints for managing notes, tags, and search. All responses use JSON format. All timestamps are Unix seconds (int64).

---

## Conventions

### Response Format

**Success Response**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 400 | Invalid request |
| 404 | Resource not found |
| 500 | Server error |

---

## Endpoints

### 1. List Notes

Get all notes, optionally filtered by tag.

**Request**:
```http
GET /api/notes?tag=work&limit=50
```

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `tag` | string | No | Filter by tag name |
| `limit` | integer | No | Max results (default: 100, max: 500) |

**Response**:
```json
{
  "success": true,
  "data": {
    "notes": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Meeting Notes",
        "content": "# Discussion Points\n\n- Review Q1 goals",
        "tags": ["work", "meetings"],
        "created_at": 1736700000,
        "updated_at": 1736707200
      }
    ],
    "total": 1
  }
}
```

---

### 2. Get Note

Get a single note by ID.

**Request**:
```http
GET /api/notes/{note_id}
```

**Path Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `note_id` | string (UUID) | Yes | Note identifier |

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Meeting Notes",
    "content": "# Discussion Points\n\n- Review Q1 goals",
    "tags": ["work", "meetings"],
    "created_at": 1736700000,
    "updated_at": 1736707200
  }
}
```

**Error Response** (404):
```json
{
  "success": false,
  "error": {
    "code": "NOTE_NOT_FOUND",
    "message": "Note with ID 'xxx' not found"
  }
}
```

---

### 3. Create Note

Create a new note.

**Request**:
```http
POST /api/notes
Content-Type: application/json

{
  "title": "Meeting Notes",
  "content": "# Discussion Points\n\n- Review Q1 goals",
  "tags": ["work", "meetings"]
}
```

**Body**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | No | Note title (max 200 chars) |
| `content` | string | Yes | Markdown content (max 100,000 chars) |
| `tags` | array[string] | No | Tag names (max 20 tags, each max 50 chars) |

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Meeting Notes",
    "content": "# Discussion Points\n\n- Review Q1 goals",
    "tags": ["work", "meetings"],
    "created_at": 1736707200,
    "updated_at": 1736707200
  }
}
```

**Validation Errors** (400):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "content exceeds maximum length of 100000 characters"
  }
}
```

---

### 4. Update Note

Update an existing note.

**Request**:
```http
PUT /api/notes/{note_id}
Content-Type: application/json

{
  "title": "Updated Meeting Notes",
  "content": "# Discussion Points\n\n- Review Q1 goals\n- Q2 planning",
  "tags": ["work", "meetings", "planning"]
}
```

**Path Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `note_id` | string (UUID) | Yes | Note identifier |

**Body**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | No | Note title (max 200 chars) |
| `content` | string | No | Markdown content (max 100,000 chars) |
| `tags` | array[string] | No | Tag names (max 20 tags, each max 50 chars) |

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Updated Meeting Notes",
    "content": "# Discussion Points\n\n- Review Q1 goals\n- Q2 planning",
    "tags": ["work", "meetings", "planning"],
    "created_at": 1736700000,
    "updated_at": 1736710000
  }
}
```

---

### 5. Delete Note

Delete a note by ID.

**Request**:
```http
DELETE /api/notes/{note_id}
```

**Path Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `note_id` | string (UUID) | Yes | Note identifier |

**Response**:
```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

---

### 6. Search Notes

Search notes using hybrid search (keyword + semantic).

**Request**:
```http
GET /api/search?q=containerization&tag=work&limit=20
```

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `q` | string | Yes | Search query |
| `tag` | string | No | Filter by tag name |
| `limit` | integer | No | Max results (default: 20, max: 100) |

**Response**:
```json
{
  "success": true,
  "data": {
    "query": "containerization",
    "results": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Docker Setup Guide",
        "content": "# Docker Basics\n\nHow to containerize applications...",
        "tags": ["devops", "docker"],
        "score": 0.95,
        "created_at": 1736700000,
        "updated_at": 1736707200
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "title": "Kubernetes Deployment",
        "content": "# K8s Deployments\n\nManaging containerized workloads...",
        "tags": ["kubernetes"],
        "score": 0.87,
        "created_at": 1736700000,
        "updated_at": 1736707200
      }
    ],
    "total": 2
  }
}
```

**Notes**:
- `score` is the relevance score from hybrid search (0-1)
- Results are sorted by score (highest first)
- Both keyword and semantic matches are included

---

### 7. List Tags

Get all tags with note counts.

**Request**:
```http
GET /api/tags
```

**Response**:
```json
{
  "success": true,
  "data": {
    "tags": [
      {"name": "work", "count": 15},
      {"name": "personal", "count": 8},
      {"name": "ideas", "count": 5}
    ]
  }
}
```

---

### 8. Export Notes

Export all notes in JSON format.

**Request**:
```http
GET /api/export
```

**Response**:
```json
{
  "success": true,
  "data": {
    "version": "1.0",
    "exported_at": 1736707200,
    "notes": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Meeting Notes",
        "content": "# Discussion Points\n\n- Review Q1 goals",
        "tags": ["work", "meetings"],
        "created_at": 1736700000,
        "updated_at": 1736707200
      }
    ],
    "total": 1
  }
}
```

---

### 9. Health Check

Check API health status.

**Request**:
```http
GET /api/health
```

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "version": "1.0.0"
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `NOTE_NOT_FOUND` | Note does not exist |
| `INVALID_UUID` | Invalid UUID format |
| `DATABASE_ERROR` | Database operation failed |
| `INTERNAL_ERROR` | Unexpected server error |

---

## Rate Limiting

Not implemented (single-user local application).

---

## CORS

CORS enabled for `http://localhost:8000` and `http://127.0.0.1:8000`.

---

## WebSocket Events

Not implemented (polling or server-sent events may be added later for real-time updates).
