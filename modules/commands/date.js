// modules/commands/date.js
// Habilidade: informar a data atual.

const DIAS_SEMANA = [
  "domingo", "segunda-feira", "terça-feira", "quarta-feira",
  "quinta-feira", "sexta-feira", "sábado"
];

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

export const dateSkill = {
  name: "date",

  match(text) {
    const t = text.toLowerCase();
    return /(que dia [ée]|qual [ée] a data|data de hoje|que data)/.test(t);
  },

  run() {
    const now = new Date();
    const diaSemana = DIAS_SEMANA[now.getDay()];
    const dia = now.getDate();
    const mes = MESES[now.getMonth()];
    const ano = now.getFullYear();
    return { reply: `Hoje é ${diaSemana}, ${dia} de ${mes} de ${ano}.` };
  }
};
