import fs from 'fs';
import path from 'path';

const store = path.join('store', 'notes.json');

if (!fs.existsSync(store)) {
  fs.writeFileSync(store, JSON.stringify([], null, 2));
}

const readNotes = () => JSON.parse(fs.readFileSync(store, 'utf8'));
const writeNotes = (notes) => fs.writeFileSync(store, JSON.stringify(notes, null, 2));

/**
 * Adds a new note to the JSON file storage.
 * @param {string} title - The title of the note. Must not be empty.
 * @param {string} content - The content of the note. Can be an empty string.
 * @returns {Promise<Object>} A newly created note object with auto-generated ID and timestamp.
 * @throws {Error} If title is not provided or is an empty string.
 */
export async function addNote(title, content) {
  const notes = readNotes();
  const newNote = {
    id: notes.length + 1, // Auto-increment id based on the current notes length
    title,
    content,
    createdAt: new Date(),
  };

  notes.push(newNote);
  writeNotes(notes);
  return newNote;
}

/**
 * Updates an existing note by its unique identifier.
 * @param {number} id - The unique identifier of the note to be updated.
 * @param {Object} updates - An object containing the properties to modify in the note.
 * @throws {Error} Throws an error if no note is found with the specified ID.
 * @returns {Promise<Object>} The updated note with original creation timestamp preserved.
 * @example
 * // Update a note's content
 * const updatedNote = await updateNote(1, { content: 'New note content' });
 */
export async function updateNote(id, updates) {
  const notes = readNotes();
  const noteIndex = notes.findIndex((note) => note.id === id);

  if (noteIndex === -1) {
    throw new Error('Note not found');
  }

  const updatedNote = { ...notes[noteIndex], ...updates, createdAt: notes[noteIndex].createdAt };
  notes[noteIndex] = updatedNote;
  writeNotes(notes);
  return updatedNote;
}

/**
 * Removes a note from the notes storage by its unique identifier.
 * @param {number} id - The unique identifier of the note to be deleted.
 * @returns {Promise<boolean>} Indicates whether the note was successfully removed.
 * @throws {Error} If there are issues with file system operations during note removal.
 */
export async function removeNote(id) {
  const notes = readNotes();
  const noteIndex = notes.findIndex((note) => note.id === id);

  if (noteIndex === -1) {
    return false;
  }

  notes.splice(noteIndex, 1);
  writeNotes(notes);
  return true;
}

/**
 * Retrieves all notes from the JSON storage.
 * @returns {Promise<Array>} A promise that resolves to an array of all stored notes.
 * @throws {Error} If there is an issue reading the notes file.
 */
export async function getNotes() {
  return readNotes();
}

/**
 * Retrieves a single note by its ID.
 * @param {number} id - The ID of the note to retrieve.
 * @returns {Promise<Object|null>} - The note object if found, or null.
 */
export async function getNote(id) {
  const notes = readNotes();
  return notes.find((note) => note.id === id) || null;
}
