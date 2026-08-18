// modules/memory/memoryStore.js
// Memória simples baseada em localStorage.
// Guarda "fatos" curtos que o usuário pede para o JARVIS lembrar.

const STORAGE_KEY = "jarvis_memory_v1";

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("[memoryStore] Falha ao ler memória:", err);
    return [];
  }
}

function writeAll(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch (err) {
    console.error("[memoryStore] Falha ao salvar memória:", err);
    return false;
  }
}

export const memoryStore = {
  /** Salva um novo fato na memória. Retorna true/false conforme sucesso. */
  remember(fact) {
    const items = readAll();
    items.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      fact: fact.trim(),
      createdAt: new Date().toISOString()
    });
    return writeAll(items);
  },

  /** Retorna todos os fatos salvos. */
  getAll() {
    return readAll();
  },

  /** Remove um fato pelo id. */
  forget(id) {
    const items = readAll().filter((item) => item.id !== id);
    return writeAll(items);
  },

  /** Limpa toda a memória. */
  clearAll() {
    return writeAll([]);
  },

  /** Busca simples por palavra-chave dentro dos fatos salvos. */
  search(keyword) {
    const kw = keyword.toLowerCase();
    return readAll().filter((item) => item.fact.toLowerCase().includes(kw));
  }
};
