# J.A.R.V.I.S. — Protótipo (PWA)

Assistente pessoal por voz, pensado para ser desenvolvido, testado e usado
inteiramente a partir de um celular Android, sem depender de um computador.

## O que já funciona neste protótipo

- Interface mobile-first com botão de microfone, indicador de status,
  histórico de conversa e transcrição ao vivo.
- Conversa por voz (Web Speech API) com fallback automático para texto
  quando o navegador não suporta ou nega o microfone.
- Comandos diretos (sem precisar de IA): hora, data, calculadora, abrir
  sites, pesquisar na internet, anotações e memória simples.
- Sistema de habilidades modular (`modules/commands/`) — cada comando é um
  arquivo independente, fácil de adicionar sem tocar nos outros.
- Camada de IA isolada e substituível (`modules/ai/aiClient.js`), sem
  nenhuma chave de API no frontend.
- Memória e anotações salvas localmente (localStorage).
- Confirmação obrigatória antes de ações destrutivas (ex: limpar histórico).
- PWA instalável, com ícone, splash e funcionamento básico offline (o
  "app shell" fica em cache; comandos que precisam de internet, como IA e
  pesquisa, continuam exigindo conexão).

## Como testar isso usando só o celular (sem PC)

Um Service Worker (necessário para instalar como app) só funciona em
`https://` ou em `localhost`. Abrir o `index.html` direto do armazenamento
(`file://`) funciona para testar a interface, mas **não** ativa o modo PWA
completo. Três caminhos 100% possíveis pelo celular:

**Opção A — GitHub Pages (recomendado, grátis, só com o navegador)**
1. Crie uma conta em github.com pelo navegador do celular.
2. Crie um repositório novo (pode ser público).
3. Use "Add file → Upload files" e envie todos os arquivos desta pasta
   mantendo a mesma estrutura de pastas.
4. Em Settings → Pages, ative o GitHub Pages na branch principal.
5. Acesse a URL gerada (ex: `https://seuusuario.github.io/jarvis/`) pelo
   Chrome do Android e use "Adicionar à tela inicial".

**Opção B — Netlify Drop**
1. Acesse `app.netlify.com/drop` pelo navegador do celular.
2. Envie a pasta compactada em `.zip` do projeto.
3. Netlify gera uma URL `https://` pronta para instalar como PWA.

**Opção C — Servidor local no próprio Android**
1. Instale um app de servidor HTTP local (ex.: "Servez" ou similar, via
   Play Store).
2. Aponte o servidor para a pasta do projeto no armazenamento do celular.
3. Abra `http://localhost:PORTA/` no Chrome do mesmo aparelho.

## Sobre a camada de IA

O arquivo `modules/ai/aiClient.js` só sabe falar com um endpoint HTTP que
você configurar em **Ajustes → Endpoint de IA** dentro do próprio app.
Sem endpoint configurado, o JARVIS responde perguntas abertas com uma
mensagem explicando isso, mas continua executando todos os comandos diretos
normalmente.

Quando você quiser ligar uma IA de verdade:
1. Crie um backend pequeno (Cloudflare Worker, Vercel Function, etc. — todos
   configuráveis pelo navegador do celular) que guarda a chave da API em
   variável de ambiente.
2. Esse backend recebe `{ "question": "..." }` e responde
   `{ "answer": "..." }`.
3. Cole a URL desse backend em Ajustes dentro do app.

Isso mantém a chave de API fora do frontend, mesmo rodando tudo do celular.

## Adicionando uma nova habilidade

1. Crie `modules/commands/minhaSkill.js` exportando um objeto com
   `name`, `match(texto)` e `run(texto, ctx)`.
2. Em `app.js`, importe o arquivo e chame `registerSkill(minhaSkill)`.

Nenhum outro arquivo precisa ser alterado.

## Estrutura

```
JARVIS/
├── index.html
├── style.css
├── app.js
├── manifest.json
├── service-worker.js
├── modules/
│   ├── ai/aiClient.js
│   ├── commands/ (registry.js + uma habilidade por arquivo)
│   ├── memory/memoryStore.js
│   ├── notes/notesStore.js
│   └── speech/speech.js
└── assets/icons/
```

## Próximos passos sugeridos

Wake word ("Jarvis"), clima, calendário, lembretes, visão por câmera,
histórico de conversas persistente, personalidade configurável — a base
modular já está preparada para isso, sem precisar reescrever o núcleo.
