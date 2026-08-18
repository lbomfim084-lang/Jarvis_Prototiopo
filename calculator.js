// modules/commands/calculator.js
// Habilidade: fazer cálculos simples ditos em linguagem natural.
// Não usa eval() diretamente: converte palavras em operadores e valida
// que só sobrem caracteres numéricos/operadores antes de calcular.

const WORD_OPERATORS = [
  [/\bmais\b/g, "+"],
  [/\bmenos\b/g, "-"],
  [/\bvezes\b/g, "*"],
  [/\bmultiplicado por\b/g, "*"],
  [/\bdividido por\b/g, "/"],
  [/\bdividido\b/g, "/"],
  [/\bx\b/g, "*"],
  [/\bpor cento de\b/g, "/100*"],
  [/,/g, "."]
];

function extractExpression(text) {
  let t = text.toLowerCase();
  t = t.replace(/^.*?(quanto [ée]|calcule|calcula|qual [ée] o resultado de)\s*/i, "");
  for (const [pattern, replacement] of WORD_OPERATORS) {
    t = t.replace(pattern, replacement);
  }
  return t;
}

function safeEvaluate(expression) {
  const cleaned = expression.replace(/\s+/g, "");
  // Só permite dígitos, ponto, operadores básicos e parênteses.
  if (!/^[0-9+\-*/.()]+$/.test(cleaned)) {
    throw new Error("Expressão contém caracteres não suportados.");
  }
  // eslint-disable-next-line no-new-func
  const result = Function(`"use strict"; return (${cleaned});`)();
  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error("Resultado inválido.");
  }
  return result;
}

export const calculatorSkill = {
  name: "calculator",

  match(text) {
    const t = text.toLowerCase();
    if (/(quanto [ée]|calcule|calcula|qual [ée] o resultado de)/.test(t)) return true;
    // Também reconhece expressões numéricas diretas, ex: "25 * 48"
    return /^[\s0-9+\-*/.,()]+$/.test(t) && /[0-9]/.test(t) && /[+\-*/x]/.test(t);
  },

  run(text) {
    const expression = extractExpression(text);
    try {
      const result = safeEvaluate(expression);
      const formatted = Number.isInteger(result) ? result : Number(result.toFixed(4));
      return { reply: `O resultado é ${formatted}.` };
    } catch (err) {
      return { reply: "Não consegui calcular essa expressão. Pode repetir de outra forma?" };
    }
  }
};
