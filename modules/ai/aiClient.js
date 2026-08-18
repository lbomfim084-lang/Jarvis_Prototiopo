// modules/ai/aiClient.js
//
// Camada de IA do JARVIS. Isolada de propósito: o resto do sistema só conhece
// a função askAI(pergunta) -> Promise<string>. Trocar de provedor de IA no
// futuro (Claude, GPT, modelo local, etc.) significa editar SÓ este arquivo.
//
// IMPORTANTE (segurança): nunca coloque uma chave de API aqui. Chaves de API
// não devem viver no frontend, pois qualquer pessoa pode abrir o DevTools do
// navegador e roubá-las. A forma correta é:
//   1. Criar um pequeno backend/proxy (ex: Cloudflare Worker, Vercel Function,
//      servidor Node) que guarda a chave em uma variável de ambiente.
//   2. O frontend chama SEU backend (endpoint abaixo), nunca a API de IA
//      diretamente.
//
// Configuração: o usuário define a URL do backend em Configurações (ícone de
// engrenagem) ou diretamente em AI_ENDPOINT_STORAGE_KEY no localStorage.
// Enquanto nenhum endpoint estiver configurado, o JARVIS usa uma resposta de
// fallback local, para que o protótipo continue utilizável sem backend.

const AI_ENDPOINT_STORAGE_KEY = "jarvis_ai_endpoint_v1";

export function getAiEndpoint() {
  return localStorage.getItem(AI_ENDPOINT_STORAGE_KEY) || "";
}

export function setAiEndpoint(url) {
  if (!url) {
    localStorage.removeItem(AI_ENDPOINT_STORAGE_KEY);
    return;
  }
  localStorage.setItem(AI_ENDPOINT_STORAGE_KEY, url.trim());
}

function localFallback(question) {
  return (
    "Ainda não tenho um backend de IA configurado, então não posso responder " +
    "perguntas abertas como essa agora. Você pode me pedir para dizer as horas, " +
    "a data, fazer contas, abrir sites, pesquisar, ou anotar algo — isso eu já " +
    "faço diretamente. Para perguntas gerais, configure um endpoint de IA em " +
    "Configurações."
  );
}

/**
 * Envia uma pergunta para a camada de IA e retorna a resposta em texto.
 * @param {string} question
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<string>}
 */
export async function askAI(question, options = {}) {
  const endpoint = getAiEndpoint();

  if (!endpoint) {
    return localFallback(question);
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
      signal: options.signal
    });

    if (!response.ok) {
      throw new Error(`Backend de IA respondeu com status ${response.status}`);
    }

    const data = await response.json();
    // Espera um formato simples: { "answer": "texto da resposta" }
    if (typeof data?.answer === "string" && data.answer.trim()) {
      return data.answer.trim();
    }
    throw new Error("Resposta do backend em formato inesperado.");
  } catch (err) {
    console.error("[aiClient] Falha ao consultar IA:", err);
    if (err.name === "AbortError") {
      throw err;
    }
    return "Não consegui falar com o serviço de IA agora. Verifique sua conexão ou o endpoint configurado.";
  }
}
