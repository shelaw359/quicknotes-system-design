const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.getElementById("load-btn");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const submitButton = document.getElementById("submit-btn");
const statusMessage = document.getElementById("status");
const notesList = document.getElementById("notes-list");

let notes = [];

// Show a status message and apply the appropriate style.
function showStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = type;
}

// Reusable function for API requests.
async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
    }

    // DELETE responses may not contain JSON.
    if (response.status === 204) {
        return { data: null, status: response.status };
    }

    const data = await response.json();

    return {
        data,
        status: response.status
    };
}

// Display notes safely using textContent.
function renderNotes() {
    notesList.replaceChildren();

    if (notes.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.textContent = "No notes yet. Load notes or create your first note.";
        emptyItem.className = "empty-state";
        notesList.appendChild(emptyItem);
        return;
    }

    notes.forEach((note) => {
        const item = document.createElement("li");
        item.className = "note-item";

        const title = document.createElement("h3");
        title.textContent = note.title || "Untitled note";

        const body = document.createElement("p");
        body.textContent = note.body || "No body provided.";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";

        deleteButton.addEventListener("click", () => {
            deleteNote(note.id, deleteButton);
        });

        item.append(title, body, deleteButton);
        notesList.appendChild(item);
    });
}

// GET: Load the first 10 notes.
async function loadNotes() {
    loadButton.disabled = true;
    showStatus("Loading notes...", "loading");

    try {
        const result = await request(`${API_URL}?_limit=10`);
        notes = result.data;
        renderNotes();

        if (notes.length === 0) {
            showStatus("No notes were found.", "success");
        } else {
            showStatus(`Loaded ${notes.length} notes from the server.`, "success");
        }
    } catch (error) {
        showStatus("Unable to load notes. Please check your connection and try again.", "error");
        console.error("Load notes error:", error);
    } finally {
        loadButton.disabled = false;
    }
}

// POST: Create a new note.
async function createNote(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    if (!title) {
        showStatus("Please enter a note title.", "error");
        titleInput.focus();
        return;
    }

    if (title.length > 100) {
        showStatus("The title must be 100 characters or fewer.", "error");
        titleInput.focus();
        return;
    }

    submitButton.disabled = true;
    showStatus("Creating note...", "loading");

    try {
        const result = await request(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                body,
                userId: 1
            })
        });

        const newNote = result.data;

        // JSONPlaceholder simulates POST requests; it does not permanently save the note.
        // Keep the returned note in local memory so it appears during this page session.
        notes.unshift(newNote);
        renderNotes();

        showStatus(
            `Note created (status ${result.status}, id ${newNote.id}).`,
            "success"
        );

        noteForm.reset();
    } catch (error) {
        showStatus("Unable to create the note. Please try again.", "error");
        console.error("Create note error:", error);
    } finally {
        submitButton.disabled = false;
    }
}

// DELETE: Delete a note from the API and remove it from the displayed list.
async function deleteNote(id, button) {
    button.disabled = true;
    showStatus("Deleting note...", "loading");

    try {
        const result = await request(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        // JSONPlaceholder simulates deletion but does not permanently store changes.
        // Remove the note from this page's local list after a successful response.
        notes = notes.filter((note) => note.id !== id);
        renderNotes();

        showStatus(`Note deleted (status ${result.status}).`, "success");
    } catch (error) {
        showStatus("Unable to delete the note. Please try again.", "error");
        console.error("Delete note error:", error);
    } finally {
        // The note may have been removed from the DOM, so check before enabling.
        if (button.isConnected) {
            button.disabled = false;
        }
    }
}

// Connect page controls to their functions.
loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);

// Show the initial empty state.
renderNotes();