// modules/commands/registry.js
//
// Sistema de "habilidades" (skills) do JARVIS. Cada habilidade é um módulo
// independente que se registra aqui com:
//   - name: identificador único
//   - match(text): retorna true se a habilidade sabe lidar com esse texto
//   - run(text, ctx): executa a ação e retorna { reply, sideEffect? }
//
// Para adicionar uma nova habilidade no futuro (clima, calendário, etc.):
//   1. Criar modules/commands/minhaSkill.js exportando um objeto no mesmo formato.
//   2. Importar e chamar registerSkill(minhaSkill) em app.js.
// Nenhuma habilidade existente precisa ser tocada.

const skills = [];

export function registerSkill(skill) {
  if (!skill?.name || typeof skill.match !== "function" || typeof skill.run !== "function") {
    console.error("[registry] Habilidade inválida, ignorada:", skill);
    return;
  }
  skills.push(skill);
}

export function getSkills() {
  return [...skills];
}

/**
 * Percorre as habilidades registradas na ordem em que foram cadastradas
 * e executa a primeira que reconhecer o comando.
 * Retorna null se nenhuma habilidade reconhecer o texto (cai para a IA).
 */
export async function dispatchCommand(text, ctx) {
  const normalized = text.trim();
  if (!normalized) return null;

  for (const skill of skills) {
    try {
      if (skill.match(normalized, ctx)) {
        return await skill.run(normalized, ctx);
      }
    } catch (err) {
      console.error(`[registry] Erro na habilidade "${skill.name}":`, err);
      return {
        reply: "Encontrei um erro ao tentar executar esse comando.",
        sideEffect: null
      };
    }
  }
  return null;
}
