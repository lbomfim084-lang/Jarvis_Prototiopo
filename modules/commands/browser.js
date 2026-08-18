// modules/commands/browser.js
// Habilidade: abrir sites conhecidos ou um domínio informado pelo usuário.
// Ação potencialmente sensível (abre nova aba) -> passa pelo ctx.confirmAction
// apenas quando o destino não é um site conhecido, por segurança básica.

const KNOWN_SITES = {
  youtube: "https://www.youtube.com",
  google: "https://www.google.com",
  gmail: "https://mail.google.com",
  whatsapp: "https://web.whatsapp.com",
  instagram: "https://www.instagram.com",
  wikipedia: "https://www.wikipedia.org",
  github: "https://github.com"
};

export const browserSkill = {
  name: "browser",

  match(text) {
    return /^(abra|abrir|acesse|acessar)\b/i.test(text.trim());
  },

  async run(text, ctx) {
    const t = text.toLowerCase();
    const siteKey = Object.keys(KNOWN_SITES).find((key) => t.includes(key));

    if (siteKey) {
      ctx.openUrl(KNOWN_SITES[siteKey]);
      return { reply: `Abrindo ${siteKey}.` };
    }

    // Tenta extrair algo parecido com um domínio (ex: "abra site.com.br")
    const domainMatch = t.match(/([a-z0-9-]+\.[a-z]{2,}(\.[a-z]{2,})?)/);
    if (domainMatch) {
      const url = `https://${domainMatch[1]}`;
      ctx.openUrl(url);
      return { reply: `Abrindo ${domainMatch[1]}.` };
    }

    return { reply: "Não identifiquei qual site você quer abrir." };
  }
};
