// modules/commands/search.js
// Habilidade: fazer uma pesquisa na internet a partir do que o usuário pediu.

export const searchSkill = {
  name: "search",

  match(text) {
    return /^(pesquise|pesquisar|procure|procurar|busque|buscar)\b/i.test(text.trim());
  },

  run(text, ctx) {
    const query = text.replace(/^(pesquise|pesquisar|procure|procurar|busque|buscar)\s*(por|sobre)?\s*/i, "").trim();
    if (!query) {
      return { reply: "O que você quer que eu pesquise?" };
    }
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    ctx.openUrl(url);
    return { reply: `Pesquisando: ${query}.` };
  }
};
