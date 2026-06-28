# Skill: Melhores Práticas para React.js (com TypeScript)

Esta skill define os padrões modernos de engenharia de software frontend para desenvolvimento com **React 18+**, hooks customizados e TypeScript.

---

## 1. Encapsulamento de Lógica em Custom Hooks

* **Separação de Conceitos:** Mantenha os componentes visuais (JSX/UI) focados exclusivamente em renderização e estilo. Toda a lógica de estado complexa, chamadas de API ou streams (como SSE) deve ser extraída para Hooks customizados (ex: `useSSEChat`).
* **Retorno Imutável e Tipado:** Defina interfaces TypeScript claras para o objeto de retorno do Hook (`UseSSEChatReturn`).

---

## 2. Otimização de Performance e Memoização

* **`useCallback`:** Envolva funções passadas como prop para componentes filhos ou usadas em listas de dependência do `useEffect`.
* **`useMemo`:** Utilize para cálculos pesados ou transformações de listas complexas de mensagens.
* **Evite Re-renderizações Desnecessárias:** Utilize a forma de função na atualização do estado (`setMessages(prev => [...prev, newMsg])`) para evitar incluir o próprio estado na lista de dependências do Hook.

---

## 3. Gerenciamento de Estado de Streaming em Tempo Real

* Ao receber tokens de texto via streaming (ex: LLM gerando resposta caractere por caractere), atualize a última mensagem do assistente de forma imutável sem substituir todo o array de mensagens.
* Utilize `useRef` para armazenar referências mutáveis que não precisam disparar re-renderizações na tela (ex: instâncias de `AbortController`, timers ou instâncias de sockets).

---

## 4. Tratamento de Erros e Resiliência na UI

* **Error Boundaries:** Envolva partes críticas da aplicação em Error Boundaries para capturar falhas de renderização imprevisíveis.
* **Estados Limpos de Carregamento:** Forneça sempre feedback visual ao usuário (ex: indicadores `isStreaming`, esqueletos de carregamento e mensagens de erro tratadas).
