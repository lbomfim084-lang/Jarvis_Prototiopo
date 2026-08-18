// modules/speech/speech.js
// Encapsula Web Speech API: reconhecimento de fala (STT) e síntese de voz (TTS).
// Se o navegador não suportar, os métodos avisam via callback de erro
// para que a interface caia no modo texto.

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

export function isRecognitionSupported() {
  return !!SpeechRecognitionAPI;
}

export function isSynthesisSupported() {
  return "speechSynthesis" in window;
}

export function createRecognizer({ lang = "pt-BR", onResult, onStart, onEnd, onError }) {
  if (!isRecognitionSupported()) {
    onError?.({ code: "unsupported", message: "Reconhecimento de voz não suportado neste navegador." });
    return null;
  }

  const recognizer = new SpeechRecognitionAPI();
  recognizer.lang = lang;
  recognizer.continuous = false;
  recognizer.interimResults = true;
  recognizer.maxAlternatives = 1;

  recognizer.onstart = () => onStart?.();

  recognizer.onresult = (event) => {
    let finalText = "";
    let interimText = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalText += transcript;
      } else {
        interimText += transcript;
      }
    }
    onResult?.({ finalText: finalText.trim(), interimText: interimText.trim() });
  };

  recognizer.onerror = (event) => {
    const map = {
      "not-allowed": "Permissão de microfone negada.",
      "service-not-allowed": "Permissão de microfone negada.",
      "no-speech": "Nenhuma fala detectada.",
      "audio-capture": "Nenhum microfone encontrado.",
      network: "Falha de conexão durante o reconhecimento de voz."
    };
    onError?.({
      code: event.error || "unknown",
      message: map[event.error] || "Não foi possível usar o microfone agora."
    });
  };

  recognizer.onend = () => onEnd?.();

  return recognizer;
}

let voicesCache = [];
if (isSynthesisSupported()) {
  const loadVoices = () => {
    voicesCache = window.speechSynthesis.getVoices();
  };
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function pickVoice(lang) {
  const exact = voicesCache.find((v) => v.lang === lang);
  if (exact) return exact;
  const partial = voicesCache.find((v) => v.lang?.startsWith(lang.split("-")[0]));
  return partial || null;
}

export function speak(text, { lang = "pt-BR", onEnd, onError } = {}) {
  if (!isSynthesisSupported()) {
    onError?.({ code: "unsupported", message: "Síntese de voz não suportada neste navegador." });
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    const voice = pickVoice(lang);
    if (voice) utterance.voice = voice;
    utterance.rate = 1.02;
    utterance.pitch = 1;
    utterance.onend = () => onEnd?.();
    utterance.onerror = (e) => onError?.({ code: "speak-error", message: "Falha ao reproduzir voz." });
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    onError?.({ code: "speak-error", message: "Falha ao reproduzir voz." });
  }
}

export function stopSpeaking() {
  if (isSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
