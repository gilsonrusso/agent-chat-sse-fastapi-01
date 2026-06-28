# Skill: Melhores Práticas para Server-Sent Events (SSE)

Esta skill reúne os padrões de arquitetura, boas práticas e estratégias de resiliência para implementação de streaming bidirecional e unidirecional utilizando **Server-Sent Events (SSE)** em aplicações web modernas (FastAPI + React).

---

## 1. Princípios Fundamentais do SSE

* **Conexão HTTP Persistente:** O SSE utiliza uma conexão HTTP unidirecional de longa duração (o servidor envia dados continuamente para o cliente).
* **Delimitador de Mensagens (`\n\n`):** Toda mensagem SSE no protocolo de rede deve terminar com duas quebras de linha (`\n\n`).
* **Formato Padrão:** Cada bloco de evento deve ter os prefixos `event: <nome>` e `data: <conteúdo>`.

---

## 2. Melhores Práticas no Backend (FastAPI / Python)

### 2.1 Cabeçalhos HTTP Obrigatórios
Sempre garanta que a resposta HTTP do stream inclua os seguintes cabeçalhos para evitar buffering por proxies (como Nginx, Cloudflare) ou navegadores:

```python
headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no" # Desativa buffering no Nginx
}
```

### 2.2 Gerenciamento de Exceções e Encerramento Limpo
* Sempre envie um evento explícito de encerramento do ciclo de vida (ex: `event: lifecycle_end`, `data: [DONE]`) para que o cliente saiba quando fechar o reader sem erros.
* Utilize blocos `try ... finally` no gerador assíncrono para liberar recursos caso o cliente cancele a conexão prematuramente.

---

## 3. Melhores Práticas no Frontend (React / TypeScript)

### 3.1 Fetch API vs EventSource
Para requisições que exigem autenticação via cabeçalho `Authorization` ou envio de corpo JSON no formato `POST` (como chatbots com contexto amplo), **prefira o `fetch` com `ReadableStream`** em vez da API nativa `EventSource` (que suporta apenas requisições GET simples).

### 3.2 Parsing e Buffer Resiliente
Devido à fragmentação de pacotes TCP/IP, pedaços de dados podem chegar truncados. Nunca assuma que um `chunk` lido da rede contém uma mensagem completa. Sempre mantenha uma variável de `buffer` e procure ativamente pelo delimitador `\n\n`:

```typescript
const lastDoubleNewline = buffer.lastIndexOf("\n\n");
if (lastDoubleNewline === -1) continue;

const complete = buffer.slice(0, lastDoubleNewline + 2);
buffer = buffer.slice(lastDoubleNewline + 2);
```

### 3.3 Cancelamento de Requisições com `AbortController`
Permita sempre que o usuário interrompa a transmissão em andamento (botão "Parar geração"). Associe um `AbortController` ao `fetch` do stream.

---

## 4. Checklist de Auditoria SSE
- [ ] O backend envia `Content-Type: text/event-stream`?
- [ ] O servidor envia o evento final `[DONE]` ou `lifecycle_end`?
- [ ] O cliente trata reconexão automática e erros de rede?
- [ ] O buffer no cliente previne quebra de tokens no formato UTF-8? (`TextDecoder({ stream: true })`)
