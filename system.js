// modules/commands/system.js
// Habilidade: comandos que controlam o próprio JARVIS (não o "mundo externo").
// Ações potencialmente destrutivas (limpar histórico/memória) pedem confirmação
// via ctx.confirmAction antes de executar.

export const systemSkill = {
  name: "system",

  match(text) {
    const t = text.toLowerCase();
    return /(limpe|limpar|apague|apagar).*(hist[óo]rico|conversa)/.test(t)
      || /(ative|ativar|ligue|ligar).*(voz|[áa]udio)/.test(t)
      || /(desative|desativar|desligue|desligar).*(voz|[áa]udio)/.test(t);
  },

  async run(text, ctx) {
    const t = text.toLowerCase();

    if (/(limpe|limpar|apague|apagar).*(hist[óo]rico|conversa)/.test(t)) {
      const confirmed = await ctx.confirmAction("Isso vai apagar todo o histórico da conversa. Confirmar?");
      if (!confirmed) {
        return { reply: "Ação cancelada." };
      }
      ctx.clearHistory();
      return { reply: "Histórico apagado.", skipHistory: true };
    }

    if (/(desative|desativar|desligue|desligar).*(voz|[áa]udio)/.test(t)) {
      ctx.setVoiceEnabled(false);
      return { reply: "Voz desativada." };
    }

    if (/(ative|ativar|ligue|ligar).*(voz|[áa]udio)/.test(t)) {
      ctx.setVoiceEnabled(true);
      return { reply: "Voz ativada." };
    }

    return { reply: "Não consegui identificar esse comando de sistema." };
  }
};
