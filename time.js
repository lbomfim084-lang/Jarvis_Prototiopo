// modules/commands/time.js
// Habilidade: informar a hora atual.

export const timeSkill = {
  name: "time",

  match(text) {
    const t = text.toLowerCase();
    return /(que horas s[ãa]o|horas s[ãa]o|me diga.*hora|informe.*hora)/.test(t);
  },

  run() {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, "0");
    const mm = now.getMinutes().toString().padStart(2, "0");
    return { reply: `Agora são ${hh}:${mm}.` };
  }
};
