# Smart Notes Application

A single-user, browser-based personal notes application with intelligent hybrid search.

## Features

- **Note Management**: Create, edit, and delete notes with Markdown support
- **Hybrid Search**: Combines keyword matching and semantic understanding for accurate results
- **Tag Organization**: Add tags to notes and filter by tag
- **Local Storage**: All data stored locally on your device - no cloud required
- **Real-time Preview**: See rendered Markdown as you type

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, uvicorn
- **Database**: seekdb embedded (pyseekdb) with hybrid search
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Markdown**: marked.js for rendering

## Quick Start

### Prerequisites

- Python 3.11 or later
- Linux (glibc >= 2.28) or macOS
- x86_64 or aarch64 architecture

### Installation

```bash
# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Linux/macOS

# Install dependencies
pip install -r requirements.txt
```

### Running the Application

```bash
uvicorn main:app --reload
```

Then open your browser to: `http://localhost:8000`

## Usage

1. **Create Notes**: Click the "New Note" button to create a new note
2. **Edit Notes**: Click on any note in the list to edit it
3. **Search**: Type in the search box to find notes by keyword or semantic meaning
4. **Tags**: Add tags to organize your notes, click tags to filter

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notes` | GET | List all notes (optional tag filter) |
| `/api/notes/{id}` | GET | Get a single note |
| `/api/notes` | POST | Create a new note |
| `/api/notes/{id}` | PUT | Update a note |
| `/api/notes/{id}` | DELETE | Delete a note |
| `/api/search` | GET | Search notes (hybrid keyword + semantic) |
| `/api/tags` | GET | List all tags with counts |
| `/api/export` | GET | Export all notes as JSON |
| `/api/health` | GET | Health check |

## Data Storage

All notes are stored locally in the `seekdb.db/` directory. To backup your notes, simply copy this directory.

## Deployment

To deploy with persistent storage (Railway, Render, Fly.io, or VPS), see **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## Development

```bash
# Run with auto-reload
uvicorn main:app --reload

# Run on different port
uvicorn main:app --port 8080
```

## License

MIT
