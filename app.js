// app.js
// Orquestrador principal do JARVIS. Liga interface, voz, sistema de
// habilidades (comandos) e a camada de IA. Mantém pouca lógica própria:
// a maior parte do "conhecimento" vive nos módulos importados abaixo.

import { registerSkill, dispatchCommand } from "./modules/commands/registry.js";
import { timeSkill } from "./modules/commands/time.js";
import { dateSkill } from "./modules/commands/date.js";
import { calculatorSkill } from "./modules/commands/calculator.js";
import { browserSkill } from "./modules/commands/browser.js";
import { searchSkill } from "./modules/commands/search.js";
import { notesSkill } from "./modules/commands/notes.js";
import { memorySkill } from "./modules/commands/memory.js";
import { systemSkill } from "./modules/commands/system.js";

import { memoryStore } from "./modules/memory/memoryStore.js";
import { notesStore } from "./modules/notes/notesStore.js";

import {
  createRecognizer,
  isRecognitionSupported,
  isSynthesisSupported,
  speak,
  stopSpeaking
} from "./modules/speech/speech.js";

import { askAI, getAiEndpoint, setAiEndpoint } from "./modules/ai/aiClient.js";

// ---------- Registro de habilidades (sistema de plugins) ----------
// Adicionar uma nova habilidade no futuro = 1 linha aqui.
registerSkill(timeSkill);
registerSkill(dateSkill);
registerSkill(calculatorSkill);
registerSkill(browserSkill);
registerSkill(searchSkill);
registerSkill(notesSkill);
registerSkill(memorySkill);
registerSkill(systemSkill);

// ---------- Estado ----------
const state = {
  voiceEnabled: true,
  isListening: false,
  isSpeaking: false,
  lang: localStorage.getItem("jarvis_lang_v1") || "pt-BR",
  history: [] // { role: 'user'|'jarvis', text, time, error? }
};

// ---------- Referências de DOM ----------
const $ = (id) => document.getElementById(id);

const el = {
  splash: $("splash"),
  statusIndicator: $("statusIndicator"),
  statusDot: $("statusDot"),
  statusText: $("statusText"),
  conversation: $("conversation"),
  emptyState: $("emptyState"),
  liveTranscript: $("liveTranscript"),
  liveTranscriptText: $("liveTranscriptText"),
  textForm: $("textForm"),
  textInput: $("textInput"),
  micButton: $("micButton"),
  micIcon: $("micIcon"),
  micHint: $("micHint"),
  voiceToggleBtn: $("voiceToggleBtn"),
  voiceToggleIcon: $("voiceToggleIcon"),
  notesBtn: $("notesBtn"),
  memoryBtn: $("memoryBtn"),
  clearBtn: $("clearBtn"),
  settingsBtn: $("settingsBtn"),
  notesOverlay: $("notesOverlay"),
  notesList: $("notesList"),
  notesEmpty: $("notesEmpty"),
  memoryOverlay: $("memoryOverlay"),
  memoryList: $("memoryList"),
  memoryEmpty: $("memoryEmpty"),
  settingsOverlay: $("settingsOverlay"),
  aiEndpointInput: $("aiEndpointInput"),
  saveEndpointBtn: $("saveEndpointBtn"),
  langSelect: $("langSelect"),
  confirmOverlay: $("confirmOverlay"),
  confirmText: $("confirmText"),
  confirmOkBtn: $("confirmOkBtn"),
  confirmCancelBtn: $("confirmCancelBtn"),
  toast: $("toast")
};

// ============================================================
// Utilidades de interface
// ============================================================

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("visible");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.toast.classList.remove("visible"), 3200);
}

function setOnlineStatus() {
  const online = navigator.onLine;
  el.statusText.textContent = online ? "Online" : "Offline";
  el.statusIndicator.classList.toggle("offline", !online);
}

function openSheet(overlayEl) {
  overlayEl.classList.add("open");
}
function closeSheet(overlayEl) {
  overlayEl.classList.remove("open");
}

document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => closeSheet($(btn.dataset.close)));
});
[el.notesOverlay, el.memoryOverlay, el.settingsOverlay].forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeSheet(overlay);
  });
});

function confirmAction(message) {
  return new Promise((resolve) => {
    el.confirmText.textContent = message;
    openSheet(el.confirmOverlay);

    const cleanup = (result) => {
      closeSheet(el.confirmOverlay);
      el.confirmOkBtn.removeEventListener("click", onOk);
      el.confirmCancelBtn.removeEventListener("click", onCancel);
      resolve(result);
    };
    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);

    el.confirmOkBtn.addEventListener("click", onOk);
    el.confirmCancelBtn.addEventListener("click", onCancel);
  });
}

// ============================================================
// Conversa (histórico)
// ============================================================

function formatTime(date) {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function appendMessage(role, text, { error = false } = {}) {
  const entry = { role, text, time: new Date(), error };
  state.history.push(entry);
  renderMessage(entry);
  el.emptyState.style.display = "none";
  el.conversation.scrollTop = el.conversation.scrollHeight;
  return entry;
}

function renderMessage(entry) {
  const div = document.createElement("div");
  div.className = `msg ${entry.role === "user" ? "msg-user" : "msg-jarvis"}${entry.error ? " msg-error" : ""}`;
  const p = document.createElement("span");
  p.textContent = entry.text;
  const meta = document.createElement("span");
  meta.className = "msg-meta";
  meta.textContent = formatTime(entry.time);
  div.appendChild(p);
  div.appendChild(meta);
  el.conversation.appendChild(div);
}

function clearHistory() {
  state.history = [];
  el.conversation.querySelectorAll(".msg").forEach((m) => m.remove());
  el.emptyState.style.display = "";
}

// ============================================================
// Ações do "mundo externo" que as habilidades podem chamar
// ============================================================

function openUrl(url) {
  window.open(url, "_blank", "noopener");
}

function refreshNotesView() {
  const notes = notesStore.getAll();
  el.notesList.innerHTML = "";
  el.notesEmpty.classList.toggle("visible", notes.length === 0);
  notes.forEach((note) => {
    const li = document.createElement("li");
    li.className = "sheet-item";
    li.innerHTML = `
      <span class="sheet-item-text">${escapeHtml(note.text)}
        <span class="sheet-item-date">${new Date(note.createdAt).toLocaleString("pt-BR")}</span>
      </span>
      <button class="sheet-item-remove" aria-label="Apagar anotação">✕</button>
    `;
    li.querySelector(".sheet-item-remove").addEventListener("click", () => {
      notesStore.remove(note.id);
      refreshNotesView();
    });
    el.notesList.appendChild(li);
  });
}

function refreshMemoryView() {
  const items = memoryStore.getAll();
  el.memoryList.innerHTML = "";
  el.memoryEmpty.classList.toggle("visible", items.length === 0);
  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "sheet-item";
    li.innerHTML = `
      <span class="sheet-item-text">${escapeHtml(item.fact)}
        <span class="sheet-item-date">${new Date(item.createdAt).toLocaleString("pt-BR")}</span>
      </span>
      <button class="sheet-item-remove" aria-label="Esquecer">✕</button>
    `;
    li.querySelector(".sheet-item-remove").addEventListener("click", () => {
      memoryStore.forget(item.id);
      refreshMemoryView();
    });
    el.memoryList.appendChild(li);
  });
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function setVoiceEnabled(enabled) {
  state.voiceEnabled = enabled;
  el.voiceToggleBtn.setAttribute("aria-pressed", String(enabled));
  el.voiceToggleIcon.textContent = enabled ? "🔊" : "🔇";
  if (!enabled) stopSpeaking();
}

// Contexto passado para todas as habilidades — a "API interna" do JARVIS.
const skillContext = {
  notesStore,
  memoryStore,
  openUrl,
  refreshNotesView,
  refreshMemoryView,
  clearHistory,
  setVoiceEnabled,
  confirmAction
};

// ============================================================
// Processamento principal: texto -> comando ou IA -> resposta
// ============================================================

async function handleUserInput(rawText) {
  const text = rawText.trim();
  if (!text) return;

  appendMessage("user", text);

  try {
    const commandResult = await dispatchCommand(text, skillContext);

    if (commandResult) {
      if (!commandResult.skipHistory) {
        appendMessage("jarvis", commandResult.reply);
      }
      if (state.voiceEnabled && commandResult.reply) {
        speakReply(commandResult.reply);
      }
      return;
    }

    // Nenhuma habilidade reconheceu o comando -> consulta a IA.
    const thinking = appendMessage("jarvis", "Pensando…");
    try {
      const answer = await askAI(text);
      updateMessage(thinking, answer);
      if (state.voiceEnabled) speakReply(answer);
    } catch (err) {
      updateMessage(thinking, "Não consegui obter uma resposta agora.", true);
    }
  } catch (err) {
    console.error("[app] Erro ao processar entrada:", err);
    appendMessage("jarvis", "Algo deu errado ao processar seu pedido.", { error: true });
  }
}

function updateMessage(entry, newText, error = false) {
  entry.text = newText;
  entry.error = error;
  // Re-renderiza só a última mensagem (é a que acabamos de inserir como "Pensando…")
  const nodes = el.conversation.querySelectorAll(".msg");
  const last = nodes[nodes.length - 1];
  if (last) {
    last.classList.toggle("msg-error", error);
    last.querySelector("span").textContent = newText;
  }
}

function speakReply(text) {
  if (!isSynthesisSupported()) return;
  state.isSpeaking = true;
  el.micButton.classList.add("speaking");
  speak(text, {
    lang: state.lang,
    onEnd: () => {
      state.isSpeaking = false;
      el.micButton.classList.remove("speaking");
    },
    onError: () => {
      state.isSpeaking = false;
      el.micButton.classList.remove("speaking");
    }
  });
}

// ============================================================
// Entrada por texto
// ============================================================

el.textForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = el.textInput.value;
  el.textInput.value = "";
  handleUserInput(text);
});

// ============================================================
// Entrada por voz
// ============================================================

let recognizer = null;

function startListening() {
  if (state.isListening) return;

  recognizer = createRecognizer({
    lang: state.lang,
    onStart: () => {
      state.isListening = true;
      el.micButton.classList.add("listening");
      el.micHint.textContent = "ouvindo…";
      el.liveTranscript.classList.add("active");
      el.liveTranscriptText.textContent = "";
    },
    onResult: ({ finalText, interimText }) => {
      el.liveTranscriptText.textContent = finalText || interimText;
      if (finalText) {
        stopListening();
        handleUserInput(finalText);
      }
    },
    onEnd: () => {
      stopListening();
    },
    onError: (err) => {
      stopListening();
      if (err.code !== "no-speech") {
        showToast(err.message);
      }
    }
  });

  if (recognizer) {
    try {
      recognizer.start();
    } catch (err) {
      showToast("Não foi possível iniciar o microfone.");
    }
  }
}

function stopListening() {
  state.isListening = false;
  el.micButton.classList.remove("listening");
  el.micHint.textContent = "toque para falar";
  el.liveTranscript.classList.remove("active");
  if (recognizer) {
    try { recognizer.stop(); } catch (err) { /* já parado */ }
  }
}

el.micButton.addEventListener("click", () => {
  if (!isRecognitionSupported()) {
    showToast("Microfone não suportado neste navegador. Use o campo de texto.");
    el.textInput.focus();
    return;
  }
  if (state.isListening) {
    stopListening();
  } else {
    stopSpeaking();
    startListening();
  }
});

// ============================================================
// Barra de utilidades
// ============================================================

el.voiceToggleBtn.addEventListener("click", () => setVoiceEnabled(!state.voiceEnabled));

el.notesBtn.addEventListener("click", () => {
  refreshNotesView();
  openSheet(el.notesOverlay);
});

el.memoryBtn.addEventListener("click", () => {
  refreshMemoryView();
  openSheet(el.memoryOverlay);
});

el.clearBtn.addEventListener("click", async () => {
  if (state.history.length === 0) return;
  const confirmed = await confirmAction("Isso vai apagar todo o histórico da conversa. Confirmar?");
  if (confirmed) clearHistory();
});

el.settingsBtn.addEventListener("click", () => {
  el.aiEndpointInput.value = getAiEndpoint();
  el.langSelect.value = state.lang;
  openSheet(el.settingsOverlay);
});

el.saveEndpointBtn.addEventListener("click", () => {
  setAiEndpoint(el.aiEndpointInput.value.trim());
  showToast("Endpoint de IA salvo.");
});

el.langSelect.addEventListener("change", () => {
  state.lang = el.langSelect.value;
  localStorage.setItem("jarvis_lang_v1", state.lang);
});

// ============================================================
// Status online/offline
// ============================================================

window.addEventListener("online", setOnlineStatus);
window.addEventListener("offline", setOnlineStatus);
setOnlineStatus();

// ============================================================
// Service worker (PWA)
// ============================================================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((err) => {
      console.warn("[app] Service worker não registrado:", err);
    });
  });
}

// ============================================================
// Splash
// ============================================================

setTimeout(() => {
  el.splash.style.display = "none";
}, 2200);

// Boas-vindas
appendMessage(
  "jarvis",
  "Sistemas prontos. Toque no microfone ou digite para começar."
);
if (el.emptyState) el.emptyState.style.display = "none";
