# Quick Start: Smart Notes Application

**Feature**: Smart Notes Application (001-smart-notes)
**Date**: 2026-02-12

---

## Prerequisites

| Requirement | Version Check Command |
|-------------|----------------------|
| Python | 3.11+ |
| Operating System | Linux (glibc >= 2.28) or macOS |
| Architecture | x86_64 or aarch64 |

### Check Your Environment

```bash
python3 -c 'import sys;import platform; print(f"Python: {platform.python_implementation()} {platform.python_version()}, System: {platform.system()} {platform.machine()}, {platform.libc_ver()[0]}: {platform.libc_ver()[1]}");'
```

Expected output (example):
```
Python: CPython 3.11.5, System: Linux x86_64, glibc: 2.38
```

---

## Installation

### Step 1: Clone or Navigate to Project

```bash
cd /path/to/smart-notes
```

### Step 2: Create Virtual Environment (Recommended)

```bash
python3 -m venv venv
source venv/bin/activate  # On Linux/macOS
# venv\Scripts\activate   # On Windows
```

### Step 3: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**requirements.txt**:
```
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pyseekdb>=1.0.0
python-multipart>=0.0.6  # For form data parsing
```

---

## Running the Application

### Start the Server

```bash
uvicorn main:app --reload
```

**Options**:
- `--reload`: Auto-reload on code changes (development)
- `--port 8000`: Custom port (default: 8000)
- `--host 0.0.0.0`: Listen on all interfaces

**Full command**:
```bash
uvicorn main:app --reload --port 8000
```

### Access the Application

Open your browser:

```
http://localhost:8000
```

You should see the Smart Notes interface with:
- Left panel: Note list
- Right panel: Note editor/preview
- Top: Search bar
- "New Note" button

---

## First Time Setup

### Database Initialization

The database is automatically created on first run:

```
smart-notes/
├── main.py
├── static/
├── seekdb.db/           # Created automatically
└── requirements.txt
```

### Create Your First Note

1. Click the **"New Note"** button
2. Enter a title (optional)
3. Type your note in Markdown
4. See the preview update in real-time
5. Note auto-saves as you type

### Try Search

1. Create a few notes with different topics
2. Type in the search box at the top
3. See results update as you type
4. Try related concepts (e.g., "containerization" finds notes about Docker)

---

## Development

### Project Structure

```
smart-notes/
├── main.py              # FastAPI application
├── static/
│   ├── index.html       # Main HTML
│   ├── styles.css       # Styles
│   └── app.js          # Frontend logic
├── seekdb.db/          # Database (auto-created)
├── requirements.txt    # Dependencies
└── README.md          # Documentation
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notes` | GET | List all notes |
| `/api/notes/{id}` | GET | Get note by ID |
| `/api/notes` | POST | Create note |
| `/api/notes/{id}` | PUT | Update note |
| `/api/notes/{id}` | DELETE | Delete note |
| `/api/search` | GET | Search notes |
| `/api/tags` | GET | List all tags |
| `/api/export` | GET | Export all notes |
| `/api/health` | GET | Health check |

### Testing the API

```bash
# Health check
curl http://localhost:8000/api/health

# List notes
curl http://localhost:8000/api/notes

# Create note
curl -X POST http://localhost:8000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "content": "# Hello\n\nThis is a test.", "tags": ["test"]}'

# Search
curl http://localhost:8000/api/search?q=test
```

---

## Troubleshooting

### Port Already in Use

```bash
# Use a different port
uvicorn main:app --port 8001
```

### seekdb Installation Fails

```bash
# Ensure pip is up to date
pip install --upgrade pip

# Try with specific PyPI mirror
pip install -U pyseekdb -i https://pypi.org/simple
```

### Database Errors

```bash
# Remove and recreate database
rm -rf seekdb.db/
# Restart application
uvicorn main:app --reload
```

### Permission Errors

```bash
# Ensure write permissions in project directory
chmod +w .
```

---

## Stopping the Application

Press `Ctrl+C` in the terminal where uvicorn is running.

All data is preserved in the `seekdb.db/` directory.

---

## Next Steps

1. Review [API Contract](./contracts/api.md) for integration details
2. See [Data Model](./data-model.md) for database design
3. Read [Research](./research.md) for technical decisions

---

## Support

For issues or questions:
1. Check the [Constitution](../../.specify/memory/constitution.md) for design principles
2. Review seekdb documentation at https://github.com/seekdb
3. Check application logs in terminal output
