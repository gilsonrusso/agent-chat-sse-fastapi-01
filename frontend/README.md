# Agent Chat SSE - Frontend (React 19 + TypeScript + Vite + Material-UI)

Interface web moderna, responsiva e de alta performance desenvolvida em **React 19** e **Material-UI (MUI v9)** para interação em tempo real com agentes de IA através de **Server-Sent Events (SSE)**. Esta aplicação implementa demonstrações de **Generative UI** para renderizar componentes dinâmicos hidratados com dados mockados.

---

## 🚀 Recursos (Features)

* **Chat em Tempo Real:** Leitura fluida e imediata de respostas via streaming (`ReadableStream` + `TextDecoder`).
* **Generative UI Components:** Interceptação do evento customizado `component` vindo do backend. O frontend decodifica os dados JSON e renderiza os seguintes widgets interativos diretamente na linha do tempo do chat:
  * **ProductCatalog:** Grade de produtos moderna com chips de estoque e botão interativo para simulação de compra local.
  * **SalesDashboard:** Cartões de métricas financeiras (faturamento e total de vendas) e tabelas detalhadas de transações.
* **Renderização Rica em Markdown:** Suporte a formatação de texto convencional, listas e blocos de código utilizando `react-markdown` e `remark-gfm`.
* **Painel Human-in-the-Loop (HITL):** Interface dedicada para aprovação, rejeição (com motivo) e edição de argumentos em formato JSON para chamadas de ferramentas sensíveis.
* **Histórico de Conversas (Sidebar):** Barra lateral responsiva com lista de sessões anteriores armazenadas no banco de dados. Os componentes dinâmicos de Generative UI são restaurados perfeitamente ao carregar conversas antigas.

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
│   │   ├── Chat.tsx           # Componente do chat, painel HITL e switch de Generative UI
│   │   ├── ThreadSidebar.tsx  # Barra lateral de conversas e modal de deleção
│   │   ├── ProductCatalog.tsx # Componente rico para exibição do catálogo de produtos
│   │   └── SalesDashboard.tsx # Painel rico para KPIs de faturamento e transações
│   ├── config/
│   │   └── appConfig.ts       # Centralização de URLs e variáveis de ambiente
│   ├── hooks/
│   │   └── useSSEChat.ts      # Hook customizado que lê streams SSE e ouve eventos 'component'
│   ├── App.tsx                # Provedor de Tema Material-UI (ThemeProvider)
│   ├── main.tsx               # Ponto de entrada da aplicação React
│   └── index.css              # Estilos globais e animações de typing
├── .env.example               # Modelo de variáveis de ambiente para Vite
├── package.json               # Dependências e scripts
└── README.md                  # Documentação do frontend
```

---

## 🔧 Configuração e Instalação Local

Para rodar fora do Docker durante o desenvolvimento:

### 1. Variáveis de Ambiente
Crie um arquivo `.env` na raiz da pasta `frontend/` com base no arquivo `.env.example`:

```env
VITE_API_URL=http://localhost:8000
VITE_DEFAULT_USER_ID=default_user
```

### 2. Instalação e Execução
```bash
npm install
npm run dev
```
A aplicação estará disponível em `http://localhost:5173`.
