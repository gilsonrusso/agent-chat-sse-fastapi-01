# Skill: Melhores Práticas para FastAPI

Esta skill apresenta os padrões de desenvolvimento, organização de código e performance recomendados para construir APIs robustas, performáticas e escaláveis utilizando **FastAPI**.

---

## 1. Organização Arquitetural e Estrutura de Pastas

Siga uma arquitetura limpa modularizada por recursos (*domain-driven* ou por camadas claras):

```text
agent-service/app/
├── core/            # Configurações globais, segurança, variáveis de ambiente (Pydantic Settings)
├── db/              # Conexão com banco de dados, modelos ORM e schemas Pydantic
├── api/             # Routers e endpoints da API divididos por versão/módulo
├── services/        # Regra de negócio e integrações (ex: Agentes IA, LangChain)
└── main.py          # Ponto de entrada, middlewares e inicialização do app
```

---

## 2. Pydantic v2 e Validação de Dados

* Utilize as novas facilidades do Pydantic v2 (ex: `ConfigDict`, `field_validator`, `model_validator`).
* Separe estritamente DTOs de criação (`Create`), atualização (`Update`) e resposta (`Response`).
* Evite retornar modelos do ORM diretamente na resposta; utilize a configuração `model_config = ConfigDict(from_attributes=True)` nos schemas Pydantic para serialização automática.

---

## 3. Injeção de Dependência (`Depends`)

* Utilize o sistema de injeção de dependência nativo do FastAPI para gerenciamento de sessões de banco de dados (`get_db`), autenticação de usuários e configurações.
* Prefira utilizar geradores com `yield` para garanitir a limpeza de recursos (ex: fechamento de conexões ou arquivos).

---

## 4. Performance e Concorrência (Async vs Sync)

* **Endpoints `async def`:** Use quando a função realizar operações de I/O assíncronas nativas (ex: chamadas `httpx` assíncronas, consultas via drivers assíncronos como `asyncpg`).
* **Endpoints `def` padrão:** Use para operações síncronas de banco de dados (como SQLAlchemy síncrono padrão). O FastAPI executará automaticamente a rota em uma ThreadPool separada para não travar o Event Loop principal.

---

## 5. Middleware e Tratamento Global de Erros

* Configure o `CORSMiddleware` restringindo origens em produção.
* Crie manipuladores de exceção customizados (`@app.exception_handler`) para padronizar as respostas de erro em JSON em toda a aplicação.
