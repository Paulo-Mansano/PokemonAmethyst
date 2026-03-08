# Pokémon Amethyst

Sistema web para administrar e criar fichas de Pokémon e jogadores em um RPG de mesa próprio.

## Stack

- **Backend:** Java 17, Spring Boot (Web, JPA, Security, Validation), PostgreSQL (Supabase ou local), Flyway
- **Frontend:** React 18, Vite, React Router

## Pré-requisitos

- Java 17+
- Maven
- Node.js 18+

## Banco de dados: Supabase (recomendado)

O projeto já está preparado para usar o **PostgreSQL do Supabase**. Assim você não precisa instalar PostgreSQL na máquina.

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login.
2. Clique em **New project**.
3. Escolha organização, nome do projeto (ex: `pokemon-amethyst`) e **senha do banco** (guarde essa senha).
4. Aguarde o projeto ser criado.

### 2. Pegar a connection string

1. No dashboard do projeto, vá em **Project Settings** (ícone de engrenagem).
2. No menu lateral, clique em **Database**.
3. Em **Connection string**, escolha a aba **URI** (ou **Connection pooling**).
4. A URI vem no formato:  
   `postgresql://USUARIO:SENHA@HOST:PORTA/postgres`  
   Exemplo (pooler):  
   `postgresql://postgres.abcdefgh:SuaSenhaSecreta@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`
5. Para o Spring Boot você usa os mesmos dados, mas em variáveis separadas (veja abaixo). O **usuário** no pooler costuma ser `postgres.` + o “Project reference” (ex.: `postgres.abcdefgh`).

### 3. Configurar no projeto

A partir da URI do Supabase, monte assim:

- **SPRING_DATASOURCE_URL:** troque o início `postgresql://` por `jdbc:postgresql://` e **remova** o usuário e a senha da URL.  
  Exemplo: `jdbc:postgresql://aws-0-sa-east-1.pooler.supabase.com:6543/postgres`
- **SPRING_DATASOURCE_USERNAME:** o usuário da URI (ex.: `postgres.abcdefgh`).
- **SPRING_DATASOURCE_PASSWORD:** a senha do banco que você definiu no Supabase.

Defina as variáveis **antes** de rodar o backend.

**PowerShell (Windows):**

```powershell
$env:SPRING_DATASOURCE_URL = "jdbc:postgresql://SEU_HOST:6543/postgres"
$env:SPRING_DATASOURCE_USERNAME = "postgres.SEU_PROJECT_REF"
$env:SPRING_DATASOURCE_PASSWORD = "SuaSenhaDoBanco"
```

**Git Bash / Linux / macOS:**

```bash
export SPRING_DATASOURCE_URL="jdbc:postgresql://SEU_HOST:6543/postgres"
export SPRING_DATASOURCE_USERNAME="postgres.SEU_PROJECT_REF"
export SPRING_DATASOURCE_PASSWORD="SuaSenhaDoBanco"
```

Substitua `SEU_HOST`, `SEU_PROJECT_REF` e a senha pelos valores do seu projeto no Supabase.

Na raiz do projeto há um arquivo **`.env.example`** com o nome das variáveis. Você pode copiá-lo para `.env`, preencher com seus dados do Supabase e carregar no terminal (em muitos sistemas: `set -a && source .env && set +a` antes de rodar o Maven). O `.env` já está no `.gitignore` para não subir senhas no Git.

**Importante:** nunca commite a senha do banco no repositório.

### 4. Rodar o backend

Depois de definir as variáveis, execute:

```bash
mvn spring-boot:run
```

Na primeira execução, o **Flyway** vai criar todas as tabelas no banco do Supabase automaticamente.

---

## Banco de dados: PostgreSQL local (opcional)

Se preferir rodar PostgreSQL na sua máquina:

1. Instale o PostgreSQL (porta 5432).
2. Crie o banco: `CREATE DATABASE pokemon_amethyst;`
3. Não defina as variáveis `SPRING_DATASOURCE_*` — o projeto usa por padrão `localhost:5432`, usuário e senha `postgres`.

## Executar o backend

```bash
mvn spring-boot:run
```

A API fica em `http://localhost:8080`.

## Executar o frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend sobe em `http://localhost:5173` e usa o proxy do Vite para chamar a API em 8080 (evita CORS e envia cookies de sessão).

## Fluxo de uso

1. Acesse `http://localhost:5173` e **Registrar** uma conta (ou **Entrar** se já tiver).
2. Na **Ficha**, crie/edite o perfil do jogador (nome, classe, atributos, HP, stamina, etc.).
3. Em **Pokémon**, adicione Pokémon (espécie, tipo, apelido, etc.), coloque até 6 no time e o restante na box.
4. Em **Mochila**, adicione itens (é necessário ter itens no catálogo; o mestre pode cadastrá-los via API ou scripts).

## API principal

- `POST /api/auth/registro` — registrar (body: email, senha, mestre)
- `POST /api/auth/login` — login (body: email, senha)
- `GET /api/perfis/meu` — perfil do jogador logado
- `PUT /api/perfis/meu` — criar/atualizar perfil
- `GET/POST /api/perfis/meu/pokemons` — listar/criar Pokémon
- `GET /api/perfis/meu/mochila` — mochila
- `PUT /api/perfis/meu/mochila/itens` — adicionar item (body: itemId, quantidade)
- `GET /api/itens`, `GET /api/movimentos`, `GET /api/habilidades` — catálogos (públicos)

Contas com flag **Mestre** podem acessar `GET /api/mestre/jogadores`.
