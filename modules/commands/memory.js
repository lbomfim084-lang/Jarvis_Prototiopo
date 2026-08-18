// modules/commands/memory.js
// Habilidade: guardar e recuperar fatos simples ditos pelo usuário.

export const memorySkill = {
  name: "memory",

  match(text) {
    const t = text.toLowerCase();
    return /^(lembre|lembrar|memorize)\b/i.test(text.trim())
      || /(o que voc[êe] sabe sobre|o que voc[êe] lembra sobre|voc[êe] lembra)/.test(t);
  },

  run(text, ctx) {
    const t = text.toLowerCase();

    if (/^(lembre|lembrar|memorize)\b/i.test(text.trim())) {
      const fact = text.replace(/^(lembre|lembrar|memorize)\s*(que|:)?\s*/i, "").trim();
      if (!fact) {
        return { reply: "O que você quer que eu lembre?" };
      }
      const ok = ctx.memoryStore.remember(fact);
      return { reply: ok ? "Entendido, vou lembrar disso." : "Não consegui salvar isso na memória." };
    }

    // Consulta: "o que você sabe sobre meus estudos?"
    const topicMatch = t.match(/sobre\s+(.+?)\??$/);
    const topic = topicMatch ? topicMatch[1] : "";
    const items = topic ? ctx.memoryStore.search(topic) : ctx.memoryStore.getAll();

    if (items.length === 0) {
      return { reply: topic ? `Não tenho nada salvo sobre ${topic}.` : "Ainda não tenho nada salvo na memória." };
    }
    const facts = items.slice(0, 3).map((i) => i.fact).join("; ");
    return { reply: `Aqui está o que eu sei: ${facts}.` };
  }
};
