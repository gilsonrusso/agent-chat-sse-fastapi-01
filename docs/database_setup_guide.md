# Guia Passo a Passo: Configuração de Banco de Dados SQL no FastAPI para Histórico de Conversas

Este documento apresenta o guia arquitetural e prático para criar, configurar e estruturar um banco de dados relacional no **FastAPI** utilizando **SQLAlchemy** e **Pydantic**, com foco no armazenamento e recuperação de sessões de chat e histórico de mensagens de usuários.

A implementação segue estritamente as melhores práticas descritas na [documentação oficial do FastAPI (SQL Databases)](https://fastapi.tiangolo.com/pt/tutorial/sql-databases/).

---

## 1. Arquitetura e Modelagem de Dados

Para permitir que o usuário retorne a conversas anteriores e visualize o histórico completo, a estrutura de dados deve ser organizada em duas entidades principais interligadas: **Sessões/Threads** (`threads`) e **Mensagens** (`messages`).

### Por que essa estrutura relacional?
1. **Identificação Única de Sessão (`thread_id`):** O LangGraph e os agentes baseados em IA usam um `thread_id` para identificar o estado da conversa. Usar o mesmo ID como Chave Primária da tabela de sessões garante sincronia perfeita.
2. **Histórico Ordenado por Sessão:** Relacionar mensagens a uma sessão específica via Chave Estrangeira (`foreign_key`) permite buscar todo o histórico de uma conversa de forma performática utilizando ordenação por data (`created_at`).
3. **Escalabilidade e Filtros por Usuário:** Guardar o `user_id` na tabela de sessões possibilita listar rapidamente todas as conversas anteriores de um determinado usuário na barra lateral da aplicação.

### Esquema do Banco de Dados

```mermaid
erDiagram
    ChatThread ||--o{ ChatMessage : "possui várias"
    ChatThread {
        string id PK "UUID / thread_id do LangGraph"
        string user_id "ID do usuário proprietário"
        string title "Título ou resumo da conversa"
        datetime created_at "Data de criação"
        datetime updated_at "Data da última mensagem"
    }
    ChatMessage {
        string id PK "UUID único da mensagem"
        string thread_id FK "Chave estrangeira para ChatThread"
        string role "user | assistant | system | tool"
        text content "Conteúdo em texto da mensagem"
        json metadata_info "Dados extras (ex: ferramentas chamadas)"
        datetime created_at "Data de envio da mensagem"
    }
```

---

## 2. Passo a Passo de Implementação no Backend

### Passo 2.1: Instalação das Dependências
Adicione o SQLAlchemy ao seu projeto. Se estiver utilizando SQLite (padrão para desenvolvimento local), o driver já faz parte do Python. Para PostgreSQL, instale o `psycopg2-binary` ou `asyncpg`.

```bash
uv add sqlalchemy
# Ou via pip: pip install sqlalchemy
```

---

### Passo 2.2: Configuração da Conexão com o Banco (`app/db/database.py`)
Crie o arquivo responsável por gerenciar o Engine do SQLAlchemy e as sessões de conexão.

**Por que cada coisa é necessária?**
* **`SQLALCHEMY_DATABASE_URL`:** A URL que define qual banco usar (ex: `sqlite:///./sql_app.db` ou PostgreSQL).
* **`create_engine`:** O objeto central que gerencia as conexões com o banco de dados.
* **`connect_args={"check_same_thread": False}`:** Necessário apenas para SQLite no FastAPI porque o FastAPI pode processar requisições em Threads diferentes.
* **`sessionmaker`:** Uma fábrica de sessões do banco de dados. O parâmetro `autocommit=False` evita alterações acidentais sem `db.commit()`, e `autoflush=False` evita que o SQLAlchemy envie alterações parciais antes da hora.
* **`DeclarativeBase` (ou `declarative_base()`):** Classe mãe da qual todos os nossos modelos ORM irão herdar para mapear tabelas Python em tabelas do banco.

```python
# app/db/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
# Para PostgreSQL seria: "postgresql://user:password@postgresserver/db_name"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False} # Apenas para SQLite!
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass
```

---

### Passo 2.3: Definição dos Modelos ORM (`app/db/models.py`)
Crie os modelos SQLAlchemy que representam as tabelas físicas no banco de dados.

**Por que cada campo é necessário?**
* **`relationship`:** Permite acessar `thread.messages` ou `message.thread` diretamente no Python como objetos navegáveis.
* **`index=True`:** Cria índices no banco para acelerar buscas frequentes por `user_id` e `thread_id`.

```python
# app/db/models.py
import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base

class ChatThreadModel(Base):
    __tablename__ = "chat_threads"

    id = Column(String, primary_key=True, index=True) # UUID da conversa (thread_id)
    user_id = Column(String, index=True, nullable=False) # Identificador do usuário
    title = Column(String, nullable=True, default="Nova Conversa")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relacionamento de 1 para N com mensagens
    messages = relationship("ChatMessageModel", back_populates="thread", cascade="all, delete-orphan")


class ChatMessageModel(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, index=True) # UUID da mensagem
    thread_id = Column(String, ForeignKey("chat_threads.id"), nullable=False, index=True)
    role = Column(String, nullable=False) # "user", "assistant", "system", "tool"
    content = Column(Text, nullable=False)
    metadata_info = Column(JSON, nullable=True) # Para salvar chamadas de ferramentas, etc.
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relacionamento inverso com a thread
    thread = relationship("ChatThreadModel", back_populates="messages")
```

---

### Passo 2.4: Schemas de Validação Pydantic (`app/db/schemas.py`)
Defina os schemas Pydantic para validação das entradas/saídas da API.

**Por que separar Models (SQLAlchemy) de Schemas (Pydantic)?**
* **Models (SQLAlchemy):** Lidam com a persistência de dados no banco físico.
* **Schemas (Pydantic):** Lidam com validação de formato, serialização em JSON e documentação no Swagger/OpenAPI.
* **`from_attributes = True`:** Permite que o Pydantic leia dados diretamente dos objetos do SQLAlchemy (antigo `orm_mode = True`).

```python
# app/db/schemas.py
import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict

# --- Schemas de Mensagem ---
class MessageBase(BaseModel):
    role: str
    content: str
    metadata_info: Optional[dict[str, Any]] = None

class MessageCreate(MessageBase):
    id: str
    thread_id: str

class MessageResponse(MessageBase):
    id: str
    thread_id: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Thread (Sessão) ---
class ThreadBase(BaseModel):
    title: Optional[str] = "Nova Conversa"

class ThreadCreate(ThreadBase):
    id: str
    user_id: str

class ThreadResponse(ThreadBase):
    id: str
    user_id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    messages: list[MessageResponse] = []

    model_config = ConfigDict(from_attributes=True)
```

---

### Passo 2.5: Operações no Banco de Dados - CRUD (`app/db/crud.py`)
Crie as funções utilitárias que executam consultas e gravações.

```python
# app/db/crud.py
from sqlalchemy.orm import Session
from app.db import models, schemas

def get_or_create_thread(db: Session, thread_id: str, user_id: str, title: str = "Nova Conversa"):
    db_thread = db.query(models.ChatThreadModel).filter(models.ChatThreadModel.id == thread_id).first()
    if not db_thread:
        db_thread = models.ChatThreadModel(id=thread_id, user_id=user_id, title=title)
        db.add(db_thread)
        db.commit()
        db.refresh(db_thread)
    return db_thread

def get_user_threads(db: Session, user_id: str, skip: int = 0, limit: int = 100):
    return db.query(models.ChatThreadModel)\
             .filter(models.ChatThreadModel.user_id == user_id)\
             .order_by(models.ChatThreadModel.updated_at.desc())\
             .offset(skip).limit(limit).all()

def get_thread_messages(db: Session, thread_id: str):
    return db.query(models.ChatMessageModel)\
             .filter(models.ChatMessageModel.thread_id == thread_id)\
             .order_by(models.ChatMessageModel.created_at.asc()).all()

def create_chat_message(db: Session, message: schemas.MessageCreate):
    db_msg = models.ChatMessageModel(
        id=message.id,
        thread_id=message.thread_id,
        role=message.role,
        content=message.content,
        metadata_info=message.metadata_info
    )
    db.add(db_msg)
    
    # Atualiza o timestamp da thread
    db_thread = db.query(models.ChatThreadModel).filter(models.ChatThreadModel.id == message.thread_id).first()
    if db_thread:
        import datetime
        db_thread.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(db_msg)
    return db_msg
```

---

### Passo 2.6: Injeção de Dependência de Conexão (`app/db/deps.py`)
Crie o gerador de sessões para injeção de dependência via FastAPI `Depends`.

**Por que a dependência `get_db` é fundamental?**
* O bloco `try ... finally` garante que cada requisição HTTP abra uma conexão limpa e que a conexão seja **obrigatoriamente fechada** no final, mesmo que ocorra algum erro durante a execução da rota. Isso evita vazamento de conexões (*connection leaks*).

```python
# app/db/deps.py
from typing import Generator
from app.db.database import SessionLocal

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

### Passo 2.7: Inicialização das Tabelas e Rotas no FastAPI (`app/main.py`)

No seu arquivo principal, crie as tabelas na inicialização e adicione as rotas para buscar o histórico de sessões do usuário.

```python
# app/main.py
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import engine, Base
from app.db.deps import get_db
from app.db import crud, schemas

# Criar tabelas no banco de dados na inicialização
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Rota para listar todas as sessões do usuário (para preencher a barra lateral no React)
@app.get("/users/{user_id}/threads", response_model=list[schemas.ThreadResponse])
def read_user_threads(user_id: str, db: Session = Depends(get_db)):
    return crud.get_user_threads(db, user_id=user_id)

# Rota para buscar todas as mensagens de uma sessão específica (quando o usuário clica em uma conversa antiga)
@app.get("/threads/{thread_id}/messages", response_model=list[schemas.MessageResponse])
def read_thread_messages(thread_id: str, db: Session = Depends(get_db)):
    return crud.get_thread_messages(db, thread_id=thread_id)
```

---

## 3. Fluxo Completo de Retorno de Conversa (Frontend <-> Backend)

1. **Listagem de Conversas:** Ao abrir a aplicação React, o frontend faz um `GET /users/{user_id}/threads` e exibe os títulos na barra lateral.
2. **Seleção de Conversa:** Quando o usuário clica em uma conversa antiga, o React obtém o `thread_id` correspondente e faz um `GET /threads/{thread_id}/messages`.
3. **Carregamento de Estado:** O estado local do React (`messages`) é preenchido com o histórico retornado.
4. **Continuação do Chat via SSE:** Quando o usuário envia uma nova mensagem nessa sessão, o `thread_id` existente é enviado no corpo da requisição POST para `/chat/stream`. O backend grava a nova pergunta do usuário e a resposta gerada pela IA no banco de dados SQLite/PostgreSQL.
