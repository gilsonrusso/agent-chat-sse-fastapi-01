# Agent Chat SSE - Frontend (React 19 + TypeScript + Vite + Material-UI)

Interface web moderna, responsiva e de alta performance desenvolvida em **React 19** e **Material-UI (MUI v9)** para interação em tempo real com agentes de IA através de **Server-Sent Events (SSE)**.

---

## 🚀 Recursos (Features)

* **Chat em Tempo Real:** Leitura fluida e imediata de respostas via streaming (`ReadableStream` + `TextDecoder`).
* **Renderização Rica em Markdown:** Suporte a formatação de texto, blocos de código, listas e tabelas utilizando `react-markdown` e `remark-gfm`.
* **Painel Human-in-the-Loop (HITL):** Interface dedicada para aprovação, rejeição (com motivo) e edição de argumentos em formato JSON para chamadas de ferramentas sensíveis.
* **Histórico de Conversas (Sidebar):** Barra lateral responsiva com lista de sessões anteriores armazenadas no banco de dados, ordenadas por atualização recente.
* **Gerenciamento de Sessões:** Botão "+ Nova Conversa" e modal de confirmação de exclusão individual de conversas.
* **Configuração Centralizada:** Módulo `appConfig.ts` para gestão unificada das URLs dos endpoints e variáveis de ambiente Vite.
* **Design Premium & Responsividade:** Tema escuro customizado (*Dark Mode*) com suporte a telas desktop e dispositivos móveis (Drawer retrátil).

---

## 🛠️ Tecnologias Utilizadas

* **Core:** React 19, TypeScript, Vite
* **UI & Estilização:** Material-UI (`@mui/material`), Emotion, Ícones MUI (`@mui/icons-material`)
* **Markdown:** `react-markdown`, `remark-gfm`
* **Qualidade & Tipagem:** ESLint 10, TypeScript 6

---

## 📁 Estrutura de Arquivos

```text
frontend/
├── src/
│   ├── components/
│   │   ├── Chat.tsx           # Componente principal do chat e painel HITL
│   │   └── ThreadSidebar.tsx  # Barra lateral de conversas e modal de deleção
│   ├── config/
│   │   └── appConfig.ts       # Centralização de URLs e variáveis de ambiente
│   ├── hooks/
│   │   └── useSSEChat.ts      # Custom Hook para conexão e parsing do stream SSE
│   ├── App.tsx                # Provedor de Tema Material-UI (ThemeProvider)
│   ├── main.tsx               # Ponto de entrada da aplicação React
│   └── index.css              # Estilos globais e animações de typing
├── .env.example               # Modelo de variáveis de ambiente para Vite
├── package.json               # Dependências e scripts
└── README.md                  # Documentação do frontend
```

---

## 🔧 Configuração e Instalação

### 1. Pré-requisitos
* Node.js v20 ou superior
* Gerenciador de pacotes `npm` ou `yarn`

### 2. Variáveis de Ambiente
Crie um arquivo `.env` na raiz da pasta `frontend/` com base no arquivo `.env.example`:

```env
# URL base do servidor backend FastAPI
VITE_API_URL=http://localhost:8000

# ID do usuário padrão para simulação de sessão
VITE_DEFAULT_USER_ID=default_user
```

### 3. Instalação das Dependências
```bash
npm install
```

### 4. Executando a Aplicação
```bash
npm run dev
```
A aplicação estará disponível em `http://localhost:5173`.

---

## 📜 Scripts Disponíveis

* `npm run dev`: Inicia o servidor de desenvolvimento Vite com HMR (*Hot Module Replacement*).
* `npm run build`: Executa a verificação de tipos do TypeScript e gera o bundle de produção na pasta `dist/`.
* `npm run lint`: Executa a análise estática de código com o ESLint.
* `npx tsc --noEmit`: Executa apenas a verificação de tipos do TypeScript sem gerar arquivos.
