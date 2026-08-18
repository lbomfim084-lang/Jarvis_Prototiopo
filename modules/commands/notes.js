// modules/commands/notes.js
// Habilidade: criar, consultar e limpar anotações.

export const notesSkill = {
  name: "notes",

  match(text) {
    const t = text.toLowerCase();
    return /^(anote|anotar|anota)\b/i.test(text.trim())
      || /(minhas anota[çc][õo]es|mostre.*anota[çc][õo]es|ver anota[çc][õo]es|liste.*anota[çc][õo]es)/.test(t)
      || /(apague.*anota[çc][õo]es|limpe.*anota[çc][õo]es|apagar.*anota[çc][õo]es)/.test(t);
  },

  run(text, ctx) {
    const t = text.toLowerCase();

    if (/^(anote|anotar|anota)\b/i.test(text.trim())) {
      const content = text.replace(/^(anote|anotar|anota)\s*(que|:)?\s*/i, "").trim();
      if (!content) {
        return { reply: "O que você quer que eu anote?" };
      }
      const note = ctx.notesStore.add(content);
      if (!note) {
        return { reply: "Não consegui salvar a anotação agora." };
      }
      return { reply: "Anotado." };
    }

    if (/(apague.*anota[çc][õo]es|limpe.*anota[çc][õo]es|apagar.*anota[çc][õo]es)/.test(t)) {
      ctx.notesStore.clearAll();
      ctx.refreshNotesView?.();
      return { reply: "Todas as anotações foram apagadas." };
    }

    // Mostrar anotações
    const notes = ctx.notesStore.getAll();
    ctx.refreshNotesView?.();
    if (notes.length === 0) {
      return { reply: "Você ainda não tem anotações." };
    }
    const preview = notes.slice(0, 3).map((n) => n.text).join("; ");
    const suffix = notes.length > 3 ? ` e mais ${notes.length - 3}.` : ".";
    return { reply: `Você tem ${notes.length} anotação(ões): ${preview}${suffix}` };
  }
};
