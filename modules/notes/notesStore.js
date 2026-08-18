// modules/notes/notesStore.js
// Sistema simples de anotações persistidas em localStorage.

const STORAGE_KEY = "jarvis_notes_v1";

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("[notesStore] Falha ao ler anotações:", err);
    return [];
  }
}

function writeAll(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch (err) {
    console.error("[notesStore] Falha ao salvar anotações:", err);
    return false;
  }
}

export const notesStore = {
  add(text) {
    const items = readAll();
    const note = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text: text.trim(),
      createdAt: new Date().toISOString()
    };
    items.push(note);
    const ok = writeAll(items);
    return ok ? note : null;
  },

  getAll() {
    return readAll().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  remove(id) {
    const items = readAll().filter((n) => n.id !== id);
    return writeAll(items);
  },

  clearAll() {
    return writeAll([]);
  }
};
