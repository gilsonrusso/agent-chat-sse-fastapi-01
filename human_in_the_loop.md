# Human-in-the-Loop (HITL) no Deep Agents

Este documento explica detalhadamente o funcionamento e a configuração de fluxos com **Human-in-the-Loop (HITL)** usando a biblioteca **Deep Agents**, baseando-se na documentação oficial de integração com o LangGraph.

O recurso de HITL permite suspender a execução de ferramentas sensíveis ou críticas para obter a aprovação, edição ou rejeição de um operador humano antes de prosseguir.

---

## 🚀 Como Funciona?

O fluxo básico do HITL no Deep Agents ocorre da seguinte forma:
1. **Configuração**: O agente é inicializado com a lista de ferramentas que necessitam de intervenção e um **Checkpointer** (necessário para salvar o estado da conversa/execução).
2. **Execução e Pausa**: Ao invocar o agente, se ele tentar chamar uma ferramenta monitorada, o middleware `HumanInTheLoopMiddleware` intercepta a chamada, salva o estado atual e interrompe a execução retornando o controle ao backend.
3. **Revisão Humana**: O backend analisa o objeto de interrupção (`result.interrupts`) para saber quais ações foram solicitadas e quais decisões estão autorizadas.
4. **Resumo da Execução**: O backend envia uma decisão para cada solicitação usando o comando `Command(resume={"decisions": ...})` com o mesmo `thread_id`, e o agente retoma exatamente do ponto em que parou.

---

## 🛠️ Configuração Básica

Para ativar o HITL, usamos o parâmetro `interrupt_on` e passamos um `checkpointer` durante a criação do agente com `create_deep_agent`.

> [!IMPORTANT]
> O uso de um **Checkpointer** (como `MemorySaver`) é **obrigatório** para persistir o estado do grafo durante as interrupções de HITL.

Aqui está um exemplo de configuração básica:

```python
from langchain.tools import tool
from deepagents import create_deep_agent
from langgraph.checkpoint.memory import MemorySaver

@tool
def remove_file(path: str) -> str:
    """Deleta um arquivo do sistema."""
    return f"Arquivo {path} removido."

@tool
def fetch_file(path: str) -> str:
    """Lê um arquivo do sistema."""
    return f"Conteúdo de {path}."

@tool
def notify_email(to: str, subject: str, body: str) -> str:
    """Envia um e-mail."""
    return f"E-mail enviado para {to}."

# O checkpointer é obrigatório para manter o estado
checkpointer = MemorySaver()

agent = create_deep_agent(
    model="google_genai:gemini-3.5-flash",
    tools=[remove_file, fetch_file, notify_email],
    interrupt_on={
        "remove_file": True,  # Habilita interrupção com opções padrão (approve, edit, reject, respond)
        "fetch_file": False,  # Não gera interrupção para esta ferramenta
        "notify_email": {"allowed_decisions": ["approve", "reject"]},  # Apenas permite aprovar ou rejeitar (sem edição)
    },
    checkpointer=checkpointer,
)
```

O parâmetro `interrupt_on` mapeia o nome de cada ferramenta para uma das seguintes opções:
* **`True`**: Ativa interrupções com comportamento padrão (todas as decisões são permitidas).
* **`False`**: Desativa interrupções para a ferramenta.
* **Dicionário (`InterruptOnConfig`)**: Permite customizar a interrupção através de `allowed_decisions` e predicados condicionais (`when`).

---

## ⚖️ Tipos de Decisões (`allowed_decisions`)

Você pode controlar as opções que o revisor humano tem ao analisar a chamada de uma ferramenta:

* **`"approve"`**: Executa a ferramenta com os argumentos originais propostos pelo agente.
* **`"edit"`**: Permite alterar os argumentos da ferramenta antes de executá-la.
* **`"reject"`**: Cancela a execução da ferramenta e envia um feedback de rejeição para o agente.
* **`"respond"`**: Retorna a mensagem digitada pelo humano diretamente como o resultado da ferramenta (útil para ferramentas do tipo "perguntar ao usuário").

> [!WARNING]
> Use `reject` quando o humano negar uma ação proposta por uma ferramenta. Use `respond` apenas se a pessoa estiver fornecendo a resposta esperada pela ferramenta (ex: ferramenta `perguntar_usuario`). Não use `respond` para negar ferramentas de efeito colateral, pois o modelo pode interpretar a resposta do humano como um retorno bem-sucedido.

Exemplo de configuração detalhada de decisões:
```python
interrupt_on = {
    # Risco alto: permite todas as ações (aprovar, editar e rejeitar)
    "delete_file": {"allowed_decisions": ["approve", "edit", "reject"]},
    
    # Risco moderado: apenas permite aprovar ou rejeitar
    "write_file": {"allowed_decisions": ["approve", "reject"]},
    
    # Operação crítica obrigatória: só permite aprovar (não pode ser rejeitada no meio)
    "critical_operation": {"allowed_decisions": ["approve"]},
}
```

---

## 🔍 Interrupções Condicionais (`when` predicate)

É possível criar interrupções que só disparam sob certas condições baseadas nos argumentos da própria ferramenta. Para isso, adicionamos uma função predicada ao parâmetro `when` na configuração do `interrupt_on`.

> [!NOTE]
> As interrupções condicionais exigem `langchain>=1.3.3`.

```python
from deepagents import create_deep_agent
from langchain.agents.middleware import ToolCallRequest
from langgraph.checkpoint.memory import MemorySaver

def escreve_fora_do_workspace(request: ToolCallRequest) -> bool:
    """Gera interrupção apenas se o arquivo estiver fora da pasta /workspace/."""
    path = request.tool_call["args"].get("file_path", "")
    return not path.startswith("/workspace/")

agent = create_deep_agent(
    model="google_genai:gemini-3.5-flash",
    interrupt_on={
        "write_file": {
            "allowed_decisions": ["approve", "edit", "reject"],
            "when": escreve_fora_do_workspace,
        },
    },
    checkpointer=MemorySaver(),
)
```
Se o predicado retornar `False`, a chamada da ferramenta executa automaticamente sem interromper.

---

## 🔄 Manipulando e Retomando Execuções

Quando o agente atinge uma ferramenta configurada para interrupção, o método `.invoke()` ou `.astream_events()` é pausado e retorna o estado atual.

### 1. Detectando a Interrupção
Você pode checar se a execução parou devido a um interrupt analisando `result.interrupts`:

```python
from langchain_core.utils.uuid import uuid7

# Configuração contendo o thread_id único para persistir a conversa
config = {"configurable": {"thread_id": str(uuid7())}}

result = agent.invoke(
    {"messages": [{"role": "user", "content": "Deletar o arquivo temp.txt"}]},
    config=config,
    version="v2",
)

# Verifica se houve interrupção
if result.interrupts:
    interrupt_value = result.interrupts[0].value  
    action_requests = interrupt_value["action_requests"]
    review_configs = interrupt_value["review_configs"]
    
    print(f"Ferramenta solicitada: {action_requests[0]['name']}")
    print(f"Argumentos propostos: {action_requests[0]['args']}")
```

### 2. Retomando a Execução (Resuming)
Para responder à interrupção e continuar a execução do agente, você deve chamar o agente novamente usando a classe `Command` do LangGraph, passando as decisões tomadas.

> [!IMPORTANT]
> É obrigatório utilizar a **mesma configuração** (com o mesmo `thread_id`) ao chamar o agente para retomar a execução.

```python
from langgraph.types import Command

# Montando a decisão do usuário
decisions = [
    {
        "type": "reject",
        "message": "O usuário rejeitou a exclusão de temp.txt. Não tente deletar novamente.",
    }
]

# Retomando a execução
result = agent.invoke(
    Command(resume={"decisions": decisions}),
    config=config,  # O thread_id DEVE ser o mesmo da primeira chamada
    version="v2",
)
```

---

## 👥 Múltiplas Chamadas Simultâneas (Batching)

Se o agente solicitar a execução de mais de uma ferramenta na mesma etapa e ambas exigirem aprovação, elas serão agrupadas em uma única interrupção.
Neste caso, você deve fornecer uma decisão para cada uma das solicitações, mantendo exatamente a **mesma ordem** listada em `action_requests`:

```python
if result.interrupts:
    action_requests = result.interrupts[0].value["action_requests"]
    # Ex: Duas ferramentas dispararam interrupção
    assert len(action_requests) == 2
    
    decisions = [
        {"type": "approve"},  # Decisão para a primeira ferramenta (ex: delete_file)
        {                     # Decisão para a segunda ferramenta (ex: send_email)
            "type": "reject", 
            "message": "Envio de e-mail rejeitado pelo usuário.",
        }
    ]
    
    result = agent.invoke(Command(resume={"decisions": decisions}), config=config, version="v2")
```

---

## ✏️ Editando Argumentos de Ferramenta

Caso o usuário queira modificar os parâmetros propostos pelo agente antes de rodar a ferramenta (se `"edit"` estiver permitido), a decisão deve ser estruturada contendo o tipo `"edit"` e os novos argumentos no campo `edited_action`:

```python
decisions = [
    {
        "type": "edit",
        "edited_action": {
            "name": action_request["name"],  # O nome da ferramenta deve ser mantido
            "args": {
                "to": "equipe@empresa.com",   # O agente havia proposto "todos@empresa.com"
                "subject": "...",
                "body": "..."
            }
        }
    }
]
```

---

## 🤖 Interrupções em Subagentes

Quando estruturamos sistemas complexos com subagentes (Multi-Agent Systems), temos dois padrões principais de interrupção:

### 1. Interrupções na Chamada do Subagent (`interrupt_on` customizado)
Cada subagente definido na criação do agente principal pode ter sua própria política de `interrupt_on`. As configurações do subagente sobrescrevem as regras do agente pai para as ferramentas que ele gerencia:

```python
agent = create_deep_agent(
    model="google_genai:gemini-3.5-flash",
    tools=[delete_file, read_file],
    interrupt_on={
        "delete_file": True,
        "read_file": False,  # Agente pai não exige aprovação para leitura
    },
    subagents=[{
        "name": "file-manager",
        "tools": [delete_file, read_file],
        "interrupt_on": {
            "delete_file": True,
            "read_file": True,  # Subagente exige aprovação para leitura (Sobrescrita!)
        }
    }],
    checkpointer=checkpointer
)
```

### 2. Interrupções de Dentro de Ferramentas (`interrupt()` manual)
Uma ferramenta executada por um subagente pode chamar o primitivo `interrupt()` diretamente. Isso pausa o grafo imediatamente de forma imperativa:

```python
from langgraph.types import interrupt, Command
from langchain.tools import tool

@tool
def request_approval(action_description: str) -> str:
    """Solicita aprovação humana manualmente usando o primitivo interrupt()."""
    # Pausa e espera pelo Command(resume=...)
    approval = interrupt({
        "type": "approval_request",
        "action": action_description,
        "message": f"Por favor aprove ou rejeite: {action_description}",
    })
    
    if approval.get("approved"):
        return f"Ação '{action_description}' APROVADA."
    else:
        return f"Ação '{action_description}' REJEITADA. Motivo: {approval.get('reason', 'Não informado')}"
```

Ao retomar de uma chamada manual de `interrupt()`, você passa o valor esperado pelo código diretamente:
```python
# Retomando a interrupção imperativa
result = agent.invoke(
    Command(resume={"approved": True}),
    config=config,
    version="v2"
)
```

---

## 💾 Interrupções por Regra de Permissão de Arquivos

A partir da versão `deepagents>=0.6.8`, além do `interrupt_on`, é possível suspender o uso das ferramentas nativas de manipulação de arquivos usando regras de permissões com o modo `"interrupt"`.

Se o agente tentar ler ou gravar em caminhos que correspondam a essa regra, o fluxo é automaticamente pausado da mesma forma que um HITL configurado:

```python
from deepagents import FilesystemPermission, create_deep_agent

agent = create_deep_agent(
    model=model,
    permissions=[
        FilesystemPermission(
            path="/home/usuario/diretorio_critico/*",
            mode="interrupt",  # Bloqueia e gera interrupção de aprovação
        )
    ],
    checkpointer=checkpointer,
)
```

---

## 🌟 Melhores Práticas

1. **Sempre use um Checkpointer**: Sem um checkpointer configurado, as interrupções de HITL falharão ao tentar recuperar o estado da execução.
2. **Utilize Identificadores de Thread Únicos**: Certifique-se de gerar e gerenciar IDs de thread consistentes (`thread_id`) para cada sessão de chat.
3. **Mantenha a Ordem das Decisões**: Ao retomar execuções com múltiplas interrupções em batch, as decisões no array devem respeitar a ordem exata do array `action_requests`.
4. **Mensagens de Rejeição Claras**: Ao rejeitar, forneça uma mensagem explicando ao modelo o porquê da rejeição para evitar que ele tente reenviar a mesma ação em loop.
