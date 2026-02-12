/**
 * Smart Notes Application
 * Frontend JavaScript for note management with hybrid search
 */

// =============================================================================
// Global State
// =============================================================================
let currentNoteId = null;
let notes = [];
let tags = [];
let autoSaveTimer = null;
let searchDebounceTimer = null;
let currentFilterTag = null;
let searchInputComposing = false; // IME composing (e.g. Chinese pinyin), don't search until committed

// =============================================================================
// API Helper Functions
// =============================================================================
const API = {
    baseUrl: '/api',

    async request(endpoint, options = {}) {
        const url = this.baseUrl + endpoint;
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();
        return data;
    },

    async listNotes(tag = null) {
        const params = new URLSearchParams();
        if (tag) params.append('tag', tag);
        const query = params.toString() ? `?${params}` : '';
        return this.request(`/notes${query}`);
    },

    async getNote(id) {
        return this.request(`/notes/${id}`);
    },

    async createNote(note) {
        return this.request('/notes', {
            method: 'POST',
            body: JSON.stringify(note)
        });
    },

    async updateNote(id, note) {
        return this.request(`/notes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(note)
        });
    },

    async deleteNote(id) {
        return this.request(`/notes/${id}`, {
            method: 'DELETE'
        });
    },

    async search(query, tag = null) {
        const params = new URLSearchParams({ q: query });
        if (tag) params.append('tag', tag);
        return this.request(`/search?${params}`);
    },

    async listTags() {
        return this.request('/tags');
    }
};

// =============================================================================
// Utility Functions
// =============================================================================
function showLoading(show) {
    document.getElementById('loadingState').style.display = show ? 'flex' : 'none';
}

function showStatus(message) {
    document.getElementById('saveStatus').textContent = message;
}

function updatePreview() {
    const content = document.getElementById('noteContent').value;
    const previewEl = document.getElementById('notePreview');
    previewEl.innerHTML = marked.parse(content);
}

// =============================================================================
// Note List Rendering
// =============================================================================
function renderNoteList(notesToRender = notes) {
    const noteListEl = document.getElementById('noteList');
    noteListEl.innerHTML = '';

    if (notesToRender.length === 0) {
        noteListEl.innerHTML = '<div class="no-results">No notes found</div>';
        return;
    }

    notesToRender.forEach(note => {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        noteItem.dataset.id = note.id;

        if (note.id === currentNoteId) {
            noteItem.classList.add('active');
        }

        // Create title element
        const titleEl = document.createElement('div');
        titleEl.className = 'note-item-title';
        titleEl.textContent = note.title || '';
        noteItem.appendChild(titleEl);

        // Create preview element (strip markdown)
        const previewEl = document.createElement('div');
        previewEl.className = 'note-item-preview';
        const plainText = note.content.replace(/[#*`_\[\]]/g, '').substring(0, 80);
        previewEl.textContent = plainText + (note.content.length > 80 ? '...' : '');
        noteItem.appendChild(previewEl);

        // Create tags element
        if (note.tags && note.tags.length > 0) {
            const tagsEl = document.createElement('div');
            tagsEl.className = 'note-item-tags';
            note.tags.slice(0, 3).forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'note-tag';
                tagSpan.textContent = tag;
                tagsEl.appendChild(tagSpan);
            });
            if (note.tags.length > 3) {
                const moreSpan = document.createElement('span');
                moreSpan.className = 'note-tag';
                moreSpan.textContent = `+${note.tags.length - 3}`;
                tagsEl.appendChild(moreSpan);
            }
            noteItem.appendChild(tagsEl);
        }

        // Click handler
        noteItem.addEventListener('click', () => loadNote(note.id));

        noteListEl.appendChild(noteItem);
    });
}

// =============================================================================
// Note Loading and Saving
// =============================================================================
async function loadNote(noteId) {
    try {
        showLoading(true);
        const response = await API.getNote(noteId);

        if (response.success) {
            const note = response.data;
            currentNoteId = note.id;

            // Update UI
            document.getElementById('noteTitle').value = note.title || '';
            document.getElementById('noteContent').value = note.content || '';
            renderNoteTags(note.tags || []);
            updatePreview();

            // Show editor, hide empty state
            document.getElementById('emptyState').style.display = 'none';
            document.getElementById('editorContainer').style.display = 'flex';

            // Update active state in list
            document.querySelectorAll('.note-item').forEach(item => {
                item.classList.toggle('active', item.dataset.id === noteId);
            });
        }
    } catch (error) {
        console.error('Failed to load note:', error);
        showStatus('Error loading note');
    } finally {
        showLoading(false);
    }
}

async function createNewNote() {
    try {
        showLoading(true);
        const response = await API.createNote({
            title: '',
            content: '',
            tags: []
        });

        if (response.success) {
            const newNote = response.data;
            notes.unshift(newNote);
            renderNoteList();
            loadNote(newNote.id);
        }
    } catch (error) {
        console.error('Failed to create note:', error);
        showStatus('Error creating note');
    } finally {
        showLoading(false);
    }
}

function scheduleAutoSave() {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    showStatus('Saving...');
    autoSaveTimer = setTimeout(() => saveCurrentNote(), 500);
}

async function saveCurrentNote() {
    if (!currentNoteId) return;

    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;

    // Get current tags (from badges + any text left in tag input)
    const currentTags = Array.from(document.querySelectorAll('.tag-badge'))
        .map(b => b.textContent.replace('×', '').trim());
    const tagInputVal = document.getElementById('tagInput').value.trim();
    if (tagInputVal && !currentTags.includes(tagInputVal)) {
        currentTags.push(tagInputVal);
    }

    try {
        const response = await API.updateNote(currentNoteId, {
            title: title || null,
            content: content || null,
            tags: currentTags
        });

        if (response.success) {
            renderNoteTags(response.data.tags || []);
            document.getElementById('tagInput').value = '';
            showStatus('All changes saved');
            await Promise.all([refreshNotesList(), loadTagsList()]);
        }
    } catch (error) {
        console.error('Failed to save note:', error);
        showStatus('Error saving note');
    }
}

async function refreshNotesList() {
    const tagFilter = currentFilterTag;
    const response = await API.listNotes(tagFilter);
    if (response.success) {
        notes = response.data.notes;
        renderNoteList();
    }
}

// =============================================================================
// Note Tags
// =============================================================================
function renderNoteTags(tags) {
    const container = document.getElementById('noteTags');
    container.innerHTML = '';

    tags.forEach(tag => {
        const badge = document.createElement('span');
        badge.className = 'tag-badge';
        badge.textContent = tag;

        const removeBtn = document.createElement('span');
        removeBtn.className = 'tag-remove';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            removeTag(tag);
        });

        badge.appendChild(removeBtn);
        container.appendChild(badge);
    });
}

async function addTag(tagName) {
    if (!currentNoteId || !tagName.trim()) return;

    const tag = tagName.trim();
    const currentTags = Array.from(document.querySelectorAll('.tag-badge'))
        .map(b => b.textContent.replace('×', '').trim());

    if (currentTags.includes(tag)) return;

    currentTags.push(tag);

    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;

    try {
        showStatus('Saving...');
        const response = await API.updateNote(currentNoteId, {
            title: title || null,
            content: content || null,
            tags: currentTags
        });

        if (response.success) {
            renderNoteTags(response.data.tags);
            showStatus('All changes saved');
            await Promise.all([refreshNotesList(), loadTagsList()]);
        }
    } catch (error) {
        console.error('Failed to add tag:', error);
        showStatus('Error saving tag');
    }
}

async function removeTag(tagName) {
    if (!currentNoteId) return;

    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;

    const currentTags = Array.from(document.querySelectorAll('.tag-badge'))
        .map(b => b.textContent.replace('×', '').trim())
        .filter(t => t !== tagName);

    try {
        showStatus('Saving...');
        const response = await API.updateNote(currentNoteId, {
            title: title || null,
            content: content || null,
            tags: currentTags
        });

        if (response.success) {
            renderNoteTags(response.data.tags || []);
            showStatus('All changes saved');
            await Promise.all([refreshNotesList(), loadTagsList()]);
        }
    } catch (error) {
        console.error('Failed to remove tag:', error);
        showStatus('Error removing tag');
    }
}

// =============================================================================
// Search
// =============================================================================
function performSearch(query) {
    if (searchInputComposing) return; // wait for IME to finish (e.g. 你 from ni)
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);

    if (!query.trim()) {
        clearSearch();
        return;
    }

    searchDebounceTimer = setTimeout(async () => {
        try {
            showLoading(true);
            const response = await API.search(query, currentFilterTag);

            if (response.success) {
                notes = response.data.results;
                renderNoteList();
                document.getElementById('clearSearchBtn').style.display = 'block';
                // If current note is not in search results, open the first result (or show empty state)
                const currentInList = notes.some(n => n.id === currentNoteId);
                if (!currentInList) {
                    if (notes.length > 0) {
                        await loadNote(notes[0].id);
                    } else {
                        currentNoteId = null;
                        document.getElementById('editorContainer').style.display = 'none';
                        document.getElementById('emptyState').style.display = 'flex';
                    }
                }
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            showLoading(false);
        }
    }, 300);
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearchBtn').style.display = 'none';
    refreshNotesList();
}

// =============================================================================
// Tags List
// =============================================================================
async function loadTagsList() {
    try {
        const response = await API.listTags();
        if (response.success) {
            tags = response.data.tags;
            renderTagsList();
        }
    } catch (error) {
        console.error('Failed to load tags:', error);
    }
}

function renderTagsList() {
    const container = document.getElementById('tagsList');
    container.innerHTML = '';

    if (tags.length === 0) {
        container.innerHTML = '<span style="color: var(--text-secondary); font-size: 0.75rem;">No tags yet</span>';
        return;
    }

    tags.forEach(tagObj => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag-filter-item' + (tagObj.name === currentFilterTag ? ' active' : '');
        tagEl.textContent = `${tagObj.name} (${tagObj.count})`;
        tagEl.addEventListener('click', () => filterByTag(tagObj.name));
        container.appendChild(tagEl);
    });
}

async function filterByTag(tagName) {
    currentFilterTag = tagName;
    document.getElementById('activeTag').textContent = tagName;
    document.getElementById('tagFilter').style.display = 'flex';
    renderTagsList();

    try {
        showLoading(true);
        const response = await API.listNotes(tagName);

        if (response.success) {
            notes = response.data.notes;
            renderNoteList();
            // If current note is not in the filtered list, open the first filtered note (or show empty state)
            const currentInList = notes.some(n => n.id === currentNoteId);
            if (!currentInList) {
                if (notes.length > 0) {
                    await loadNote(notes[0].id);
                } else {
                    currentNoteId = null;
                    document.getElementById('editorContainer').style.display = 'none';
                    document.getElementById('emptyState').style.display = 'flex';
                }
            }
        }
    } catch (error) {
        console.error('Failed to filter by tag:', error);
    } finally {
        showLoading(false);
    }
}

function clearTagFilter() {
    currentFilterTag = null;
    document.getElementById('tagFilter').style.display = 'none';
    renderTagsList();
    refreshNotesList();
}

// =============================================================================
// Delete Note
// =============================================================================
let noteToDelete = null;

function showDeleteModal() {
    noteToDelete = currentNoteId;
    document.getElementById('deleteModal').style.display = 'flex';
}

function hideDeleteModal() {
    noteToDelete = null;
    document.getElementById('deleteModal').style.display = 'none';
}

async function confirmDelete() {
    if (!noteToDelete) return;

    try {
        showLoading(true);
        const response = await API.deleteNote(noteToDelete);

        if (response.success) {
            hideDeleteModal();
            currentNoteId = null;

            // Show empty state
            document.getElementById('editorContainer').style.display = 'none';
            document.getElementById('emptyState').style.display = 'flex';

            await refreshNotesList();
            await loadTagsList();
        }
    } catch (error) {
        console.error('Failed to delete note:', error);
        showStatus('Error deleting note');
    } finally {
        showLoading(false);
    }
}

// =============================================================================
// Keyboard Shortcuts
// =============================================================================
document.addEventListener('keydown', (e) => {
    // Ctrl+N: New note
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        createNewNote();
    }

    // Ctrl+S: Save
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveCurrentNote();
    }

    // Escape: Clear search or close modal
    if (e.key === 'Escape') {
        if (document.getElementById('deleteModal').style.display === 'flex') {
            hideDeleteModal();
        } else if (document.getElementById('searchInput').value) {
            clearSearch();
        }
    }
});

// =============================================================================
// Event Listeners
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Load notes and tags on startup
    Promise.all([refreshNotesList(), loadTagsList()]);

    // New note button (sidebar)
    document.getElementById('newNoteBtn').addEventListener('click', createNewNote);

    // Search input (skip search during IME composition so "ni" isn't sent before "你")
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('compositionstart', () => { searchInputComposing = true; });
    searchInput.addEventListener('compositionend', (e) => {
        searchInputComposing = false;
        performSearch(e.target.value);
    });
    searchInput.addEventListener('input', (e) => {
        performSearch(e.target.value);
    });

    document.getElementById('clearSearchBtn').addEventListener('click', clearSearch);

    // Tag filter
    document.getElementById('clearTagFilter').addEventListener('click', clearTagFilter);

  // Tag input: save on Enter or on blur (so text in input is not lost)
  const tagInputEl = document.getElementById('tagInput');
  tagInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.value.trim()) {
          e.preventDefault();
          addTag(e.target.value);
          e.target.value = '';
      }
  });
  tagInputEl.addEventListener('blur', () => {
      const v = tagInputEl.value.trim();
      if (v) addTag(v);
      tagInputEl.value = '';
  });

  // Editor inputs - auto-save on change
  document.getElementById('noteTitle').addEventListener('input', scheduleAutoSave);
  document.getElementById('noteContent').addEventListener('input', () => {
      updatePreview();
      scheduleAutoSave();
  });

  // Preview toggle
  document.getElementById('togglePreviewBtn').addEventListener('click', () => {
      const btn = document.getElementById('togglePreviewBtn');
      const editorPreview = document.querySelector('.editor-preview');
      btn.classList.toggle('active');
      editorPreview.classList.toggle('preview-hidden');
  });

  // Sidebar collapse / expand
  document.getElementById('sidebarCollapse').addEventListener('click', () => {
      document.querySelector('.app-container').classList.add('sidebar-collapsed');
  });
  document.getElementById('sidebarToggle').addEventListener('click', () => {
      document.querySelector('.app-container').classList.remove('sidebar-collapsed');
  });

  // Delete note
  document.getElementById('deleteNoteBtn').addEventListener('click', showDeleteModal);
  document.getElementById('cancelDeleteBtn').addEventListener('click', hideDeleteModal);
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);

  // Click outside modal to close
  document.getElementById('deleteModal').addEventListener('click', (e) => {
      if (e.target.id === 'deleteModal') {
          hideDeleteModal();
      }
  });
});
