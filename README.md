# Pokémon Amethyst

**Sistema web para administrar Pokémon e jogadores em um RPG de mesa próprio.**

> [🇧🇷 Leia em Português](#pokémon-amethyst-pt) | [🇺🇸 Read in English](#pokémon-amethyst-en)

---

<a id="pokémon-amethyst-pt"></a>

## 📋 Tabela de Conteúdos

- [Descrição do Projeto](#descrição-do-projeto)
- [Arquitetura e Stack](#arquitetura-e-stack)
- [Pré-requisitos](#pré-requisitos)
- [Guia: Primeira Execução](#guia-primeira-execução)
  - [Opção A: Supabase (Recomendado)](#opção-a-supabase-recomendado)
  - [Opção B: PostgreSQL Local](#opção-b-postgresql-local)
- [Executar a Aplicação](#executar-a-aplicação)
- [Fluxo de Uso](#fluxo-de-uso)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Deploy](#deploy)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [API Principal](#api-principal)
- [Troubleshooting](#troubleshooting)

---

## Descrição do Projeto

**Pokémon Amethyst** é uma aplicação web full-stack para gerenciar personagens e Pokémon em um RPG de mesa. Recursos principais:

- **Gerenciamento de Perfis:** Crie e edite fichas de personagens (nome, classe, atributos).
- **Cadastro de Pokémon:** Adicione Pokémon de espécie ou selvagens, customize atributos e distribua pontos de experiência.
- **Formas Alternativas:** Suporte a megas, formas regionais (Alolan, Galarian, Hisuian, Paldean), Gigantamax e variações de gênero — cada forma importada como espécie separada, com sprite feminino automático.
- **Catálogos:** Explore espécies de Pokémon, movimentos, habilidades, itens e personalidades.
- **Acesso Mestre:** Contas mestre (game master) podem listar todos os jogadores, gerar Pokémon selvagens, gerenciar espécies e importar dados diretamente da PokéAPI.
- **Autocomplete de Espécies:** Na aba Geração, o mestre pode buscar espécies por nome ou número da Pokédex com sugestões em tempo real.
- **Pokémon Selvagens por Mestre:** Cada mestre vê e gerencia apenas os Pokémon selvagens que ele próprio gerou.
- **Armazenamento Cloud:** Integração com Supabase para sprites customizados.

**Públicos-alvo:**
- Mestres (game masters) que precisam gerenciar múltiplos jogadores e Pokémon.
- Jogadores que querem manter fichas digitais e times organizados.

---

## Arquitetura e Stack

```
┌─────────────────────────────────────────────────────────┐
│  Browser (React 18 + Vite)                              │
│  localhost:5173                                         │
├─────────────────────────────────────────────────────────┤
│  HTTP + Cookies (Session)                               │
├─────────────────────────────────────────────────────────┤
│  Backend (Spring Boot 3.2.5 + Java 17)                  │
│  localhost:8080                                         │
│  ├─ REST API                                            │
│  ├─ Spring Security (Session-based auth)               │
│  └─ JPA + Hibernate                                     │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL (Supabase ou local)                         │
│  Migrations via Flyway (V34 é a mais recente)           │
│  Armazenamento de sprites no Supabase Storage           │
└─────────────────────────────────────────────────────────┘
```

### Stack Técnico

| Componente | Tecnologia | Versão |
|---|---|---|
| **Backend** | Java + Spring Boot | 17 / 3.2.5 |
| **Banco de Dados** | PostgreSQL | 12+ |
| **Migrations** | Flyway | included |
| **Frontend** | React | 18+ |
| **Build Frontend** | Vite | 5+ |
| **Router Frontend** | React Router | 6+ |
| **Gerenciador Pacotes** | Maven (backend), npm (frontend) | 3.9+ / 18+ |
| **Cloud DB** | Supabase (PostgreSQL) | opcional |
| **Storage Cloud** | Supabase Storage | opcional |

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

| Ferramenta | Versão Mínima | Como Verificar |
|---|---|---|
| **Java** | 17+ | `java -version` |
| **Maven** | 3.9+ | `mvn -version` |
| **Node.js** | 18+ | `node --version` |
| **npm** | 9+ | `npm --version` |
| **PostgreSQL** | 12+ | `psql --version` *(só se usar local)* |
| **PowerShell** (Windows) | 5.1+ | `$PSVersionTable.PSVersion` *(recomendado para scripts)* |

**Nota para Windows:** Os scripts `run.ps1` e `run-with-env.ps1` requerem PowerShell (incluso no Windows 10+).

---

## Guia: Primeira Execução

Escolha um dos dois caminhos abaixo. **Recomendamos a Opção A (Supabase)** para evitar instalações locais.

### Opção A: Supabase (Recomendado)

**Vantagens:** Zero setup de banco local, backup automático, SSL automático, ideal para produção.

#### Passo 1: Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login (crie conta se necessário).
2. Clique em **"New project"**.
3. Preencha:
   - **Organization:** selecione ou crie uma.
   - **Name:** ex. `pokemon-amethyst` (qualquer nome).
   - **Database Password:** invente uma senha segura e **anote-a**.
   - **Region:** escolha a mais próxima (ex. `South America - São Paulo`).
4. Clique **"Create new project"** e aguarde ~2-3 minutos pela criação.

#### Passo 2: Extrair Dados de Conexão

1. No dashboard do projeto Supabase, clique no ícone de **engrenagem** (Project Settings) no canto inferior esquerdo.
2. No menu lateral, clique em **"Database"**.
3. Você verá **"Connection string"** — escolha a aba **"Connection pooling"** (recomendado para aplicações web).
4. Localize os componentes:
   - **Host:** ex. `aws-0-sa-east-1.pooler.supabase.com`
   - **Port:** ex. `6543` (pooler) ou `5432` (direct)
   - **User:** ex. `postgres.abcdefgh123` (note o prefixo `postgres.`)
   - **Password:** a senha que você definiu no passo 1.
   - **Database:** `postgres` (fixo)

#### Passo 3: Configurar Variáveis de Ambiente

Na raiz do projeto, crie um arquivo `.env` com:

```plaintext
# Banco de Dados
SPRING_DATASOURCE_URL=jdbc:postgresql://SEU_HOST:6543/postgres
SPRING_DATASOURCE_USERNAME=postgres.SEU_PROJECT_REF
SPRING_DATASOURCE_PASSWORD=SuaSenhaDoBanco
DB_SSLMODE=require

# Supabase Storage (opcional, para fazer upload de sprites)
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=SEU_ANON_KEY_DO_SUPABASE

# Sessão (opcional, apenas se deploy em produção)
SESSION_COOKIE_SAME_SITE=lax
SESSION_COOKIE_SECURE=false
```

**Como preencher:**
- Substitua `SEU_HOST` pelo host do Supabase (ex. `aws-0-sa-east-1.pooler.supabase.com`).
- Substitua `SEU_PROJECT_REF` pela referência do projeto (ex. `abcdefgh123`).
- Use a porta `6543` para pooler ou `5432` para conexão direta.
- Deixe `DB_SSLMODE=require` para Supabase (obrigatório).

**Arquivo `.env.example`:** Um modelo vazio já existe no repositório:
```powershell
Copy-Item .env.example .env
```

> **Importante:** O Spring Boot **não carrega `.env` automaticamente**. Use o script `run.ps1` para que as variáveis sejam injetadas corretamente no processo do Maven.

#### Passo 4: Validar Arquivo `.env`

```powershell
Get-Content .env
```

Verifique que contém as três variáveis críticas: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`.

### Opção B: PostgreSQL Local

**Vantagens:** Sem conta cloud necessária, dev rápido, ideal para testes locais.

#### Passo 1: Instalar PostgreSQL

1. Download em [postgresql.org](https://www.postgresql.org/download/).
2. Execute o instalador — deixe a porta padrão `5432`.
3. Verifique: `psql --version`

#### Passo 2: Criar Banco

```powershell
psql -U postgres -h localhost
```

Na prompt do psql:

```sql
CREATE DATABASE pokemon_amethyst;
\q
```

#### Passo 3: Configurar Projeto

O projeto já possui valores padrão em `application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/pokemon_amethyst
    username: postgres
    password: postgres
```

**Você NÃO precisa criar arquivo `.env`** — o projeto usará esses defaults automaticamente.

Se quiser customizar, crie `.env`:

```plaintext
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/pokemon_amethyst
SPRING_DATASOURCE_USERNAME=SEU_USUARIO
SPRING_DATASOURCE_PASSWORD=SEU_PASSWORD
```

---

## Executar a Aplicação

### Backend (Spring Boot)

Abra um terminal PowerShell **na raiz do projeto**:

#### Se você criou `.env` (Supabase ou customizado):

```powershell
.\run.ps1
```

Este script carrega as variáveis do `.env` e inicia o backend com `mvn spring-boot:run`.

#### Se está usando PostgreSQL local (sem `.env`):

```bash
mvn spring-boot:run
```

Procure por:

```
Started PokemonAmethystApplication in X.XXX seconds
```

A API estará pronta em **`http://localhost:8080`**.

**Nota:** Na primeira execução, o **Flyway** criará todas as tabelas automaticamente.

### Frontend (React + Vite)

Abra um **novo terminal** e execute:

```powershell
cd frontend
npm install
npm run dev
```

**Esperado:**

```
➜  Local:   http://localhost:5173/
```

### Acessar a Aplicação

Abra `http://localhost:5173` no navegador.

**Fluxo inicial:**
1. **Registrar** — Crie um usuário e senha.
2. **Ficha** — Crie seu personagem (nome, classe, atributos).
3. **Pokémon** — Peça para que um Mestre adicione seu Pokémon inicial; depois você capturará outros durante as sessões.
4. **Mochila** — Gerencie itens.

---

## Fluxo de Uso

### Usuário Comum (Jogador)

1. **Registra-se** com email e senha.
2. **Cria ficha** do personagem (nome, atributos HP, stamina, etc.).
3. **Gerencia time** — até 6 Pokémon no time ativo, resto na box.
4. **Gerencia mochila** — adiciona/remove itens.

### Usuário Mestre (Game Master)

Mestres recebem acesso através de outros mestres após um período como jogador.

Acesso adicional:
- **Aba Geração:** Gera Pokémon selvagens com espécie buscável por nome ou número da Pokédex (com autocomplete). Cada mestre vê apenas os selvagens que ele mesmo criou.
- **Aba Captura:** Aplica capturas de Pokémon selvagens usando pokébolas disponíveis no inventário do jogador.
- **Aba Espécies:** Configura habilidades e learnset de cada espécie. Permite importar dados da PokéAPI (espécies individuais ou todas de uma vez), gerenciar formas alternativas (megas, regionais, formas de gênero) e visualizar sprites femininos automáticos.

---

## Variáveis de Ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/pokemon_amethyst` | Connection string do PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | Usuário do banco |
| `SPRING_DATASOURCE_PASSWORD` | `postgres` | Senha do banco |
| `DB_SSLMODE` | `disable` | `disable` para local, `require` para Supabase |
| `SPRING_DATASOURCE_POOL_SIZE` | `3` | Máximo de conexões (reduzir para planos Supabase free) |
| `SPRING_DATASOURCE_POOL_MIN_IDLE` | `1` | Mínimo de conexões idle |
| `SESSION_TIMEOUT` | `8h` | Tempo de sessão antes de logout automático |
| `SESSION_COOKIE_SAME_SITE` | `lax` | `lax` para dev, `none` para produção com HTTPS |
| `SESSION_COOKIE_SECURE` | `false` | `false` para local, `true` para produção com HTTPS |
| `POKEMON_RUNTIME_STRICT_LOCAL` | `true` | Validações rigorosas em desenvolvimento |
| `VITE_SUPABASE_URL` | — | URL do projeto Supabase (ex. `https://abcdefgh.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | — | Chave pública do Supabase (Project Settings → API) |
| `JDBC_DEBUG` | `false` | `true` para ver debug de conexão JDBC (Hikari) |

**Para Produção (Render + Netlify):**

- Render: **Environment** → set variables.
- Netlify: **Site Settings** → **Build & Deploy** → **Environment**.

---

## Scripts Disponíveis

### `run.ps1` (Windows/PowerShell)

Carrega variáveis do `.env` e executa o backend com `mvn spring-boot:run`.

```powershell
.\run.ps1
```

**Quando usar:** Desenvolvimento com variáveis de ambiente (Supabase ou customizado).

**Por que existe:** No Windows, variáveis de processo filho do Maven podem não ser herdadas corretamente; este script garante a injeção correta.

### `run-with-env.ps1` (Windows/PowerShell)

Carrega `.env`, compila com `mvn package -DskipTests` e executa o JAR compilado com `java -jar`.

```powershell
.\run-with-env.ps1
```

**Quando usar:** Para testar o JAR final em comportamento próximo ao de produção.

---

## Deploy

### Docker (Recomendado)

O projeto inclui `Dockerfile` pronto para deploy em Render, Railway ou Heroku.

```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/pokemon-amethyst-*.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar -Dserver.port=${PORT:-8080} /app/app.jar"]
```

#### Deploy em Render

1. Push o projeto para GitHub.
2. Crie um novo **Web Service** em [render.com](https://render.com).
3. Conecte ao repositório GitHub.
4. Configure:
   - **Build/Start Command:** deixe em branco (usa Dockerfile).
   - **Environment Variables:** `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `DB_SSLMODE=require`, `SESSION_COOKIE_SAME_SITE=none`, `SESSION_COOKIE_SECURE=true`.

#### Deploy Frontend em Netlify

1. `cd frontend && npm run build`
2. Faça deploy da pasta `frontend/dist/` para Netlify.
3. **Build Settings:**
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Environment:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## Estrutura do Projeto

```
.
├── README.md
├── pom.xml                            # Dependências Maven (backend)
├── Dockerfile
├── .env.example                       # Modelo de variáveis de ambiente
├── run.ps1                            # Script: rodar backend com .env
├── run-with-env.ps1                   # Script: build JAR e rodar com .env
│
├── frontend/                          # Aplicação React
│   ├── package.json
│   ├── vite.config.js                 # Config Vite (porta 5173, proxy /api)
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx                   # React root
│   │   ├── App.jsx                    # Router principal
│   │   ├── Layout.jsx                 # Layout (navbar, sidebar)
│   │   ├── api.js                     # Cliente HTTP para o backend
│   │   ├── index.css                  # Estilos globais
│   │   ├── components/                # Componentes reutilizáveis (SearchableSelect, etc.)
│   │   ├── context/                   # React Context (PlayerTargetContext)
│   │   ├── pages/                     # Páginas (Login, Perfil, PokemonList, Geracao, Captura, MestreSpecies…)
│   │   ├── query/                     # React Query (queryClient, queryKeys)
│   │   └── lib/                       # Utilitários (supabaseStorage.js)
│   └── public/
│       └── _redirects                 # Config Netlify (SPA routing)
│
├── src/main/java/com/pokemonamethyst/
│   ├── config/                        # Spring Security, CORS, etc.
│   ├── web/controller/                # REST controllers (/api/...)
│   ├── service/                       # Lógica de negócio
│   ├── domain/                        # Entidades JPA
│   ├── repository/                    # Interfaces JPA
│   ├── exception/                     # Exceções customizadas
│   └── web/dto/                       # DTOs de request/response
│
├── src/main/resources/
│   ├── application.yml                # Configuração Spring
│   └── db/migration/                  # Migrations Flyway (V1__ … V34__)
│
└── supabase/
    └── storage/                       # Policies SQL do Supabase Storage
```

---

## API Principal

### Autenticação

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/auth/registro` | Registrar conta (`email`, `senha`, `mestre: boolean`) |
| `POST` | `/api/auth/login` | Login (`email`, `senha`) |
| `POST` | `/api/auth/logout` | Logout |

### Perfil do Jogador

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/perfis/meu` | Obter perfil do usuário logado |
| `PUT` | `/api/perfis/meu` | Criar/atualizar perfil |

### Pokémon

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/perfis/meu/pokemons` | Listar Pokémon do jogador |
| `POST` | `/api/perfis/meu/pokemons` | Criar novo Pokémon |
| `PUT` | `/api/perfis/meu/pokemons/{id}` | Atualizar Pokémon |
| `DELETE` | `/api/perfis/meu/pokemons/{id}` | Deletar Pokémon |

### Mochila

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/perfis/meu/mochila` | Listar itens na mochila |
| `PUT` | `/api/perfis/meu/mochila/itens` | Adicionar/atualizar item (`itemId`, `quantidade`) |

### Catálogos (Público)

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/movimentos` | Listar movimentos |
| `GET` | `/api/habilidades` | Listar habilidades |
| `GET` | `/api/itens` | Listar itens |
| `GET` | `/api/personalidades` | Listar personalidades (naturezas) |

### Endpoints Mestre

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/mestre/jogadores` | Listar todos os jogadores |
| `GET` | `/api/mestre/species` | Listar espécies (`nome`, `pokedexId`, `limit`, `incluirFormas`) |
| `GET` | `/api/mestre/species/{id}` | Buscar config completa de uma espécie (habilidades + learnset) |
| `PUT` | `/api/mestre/species/{id}` | Salvar config de uma espécie |
| `GET` | `/api/mestre/species/{id}/formas` | Listar formas alternativas vinculadas a uma espécie |
| `POST` | `/api/mestre/pokeapi/importar-species/{pokedexId}` | Importar espécie da PokéAPI pelo número |
| `POST` | `/api/mestre/pokeapi/importar-species-todas` | Importar em lote todas as espécies faltantes da PokéAPI |
| `GET` | `/api/mestre/selvagens` | Listar Pokémon selvagens do mestre logado |
| `POST` | `/api/mestre/selvagens` | Gerar Pokémon selvagem |

---

## Troubleshooting

### Backend não inicia

#### `Connection refused (localhost:5432)`

**Causa:** PostgreSQL não está rodando ou `.env` não configurado para Supabase.

**Solução:**
- Local: inicie o PostgreSQL (Windows: Services → PostgreSQL → Start).
- Supabase: verifique `.env` com `SPRING_DATASOURCE_URL`, `USERNAME`, `PASSWORD` e rode com `.\run.ps1`.

#### `max_connections reached` / `FATAL: sorry, too many clients`

**Causa:** Pool de conexões grande demais para o plano Supabase free.

**Solução:**
```plaintext
SPRING_DATASOURCE_POOL_SIZE=2
SPRING_DATASOURCE_POOL_MIN_IDLE=0
```

#### `SSL certificate problem`

**Causa:** Supabase exige SSL.

**Solução:**
```plaintext
DB_SSLMODE=require
```

### Frontend não conecta ao backend

#### `POST /api/... 404` ou CORS error

**Causa:** Backend não está rodando ou porta errada.

**Solução:**
1. Confirme que o backend está em `http://localhost:8080`.
2. Verifique proxy em `frontend/vite.config.js`: `'/api': { target: 'http://localhost:8080' }`.
3. Reinicie: `npm run dev`.

### Login não funciona

#### `Invalid email or password`

**Solução:** Clique em **"Registrar"** primeiro, depois **"Entrar"** com as mesmas credenciais.

#### `401 Unauthorized` após login

**Solução:**
1. Limpe cookies (DevTools → Application → Cookies → Delete).
2. Faça login novamente.
3. Em produção HTTPS: verifique `SESSION_COOKIE_SECURE=true`.

### Flyway migration falha

#### `Flyway migration pending` ou `Could not execute migration`

**Solução:**
1. Verifique arquivos em `src/main/resources/db/migration/`.
2. Em dev, recrie o banco:
   ```sql
   DROP DATABASE pokemon_amethyst;
   CREATE DATABASE pokemon_amethyst;
   ```
3. Reinicie `mvn spring-boot:run`.

---

---

<a id="pokémon-amethyst-en"></a>

# Pokémon Amethyst (English)

**Web system to manage Pokémon and players in a tabletop RPG.**

> [🇺🇸 English (you are here)](#pokémon-amethyst-en) | [🇧🇷 Português](#pokémon-amethyst-pt)

---

## Table of Contents

- [Project Description](#project-description)
- [Architecture & Stack](#architecture--stack)
- [Prerequisites](#prerequisites)
- [First Run Guide](#first-run-guide)
  - [Option A: Supabase (Recommended)](#option-a-supabase-recommended)
  - [Option B: Local PostgreSQL](#option-b-local-postgresql)
- [Running the App](#running-the-app)
- [Usage Flow](#usage-flow)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Deploy](#deploy-1)
- [Project Structure](#project-structure)
- [Main API](#main-api)
- [Troubleshooting](#troubleshooting-1)

---

## Project Description

**Pokémon Amethyst** is a full-stack web application to manage characters and Pokémon in a tabletop RPG. Key features:

- **Profile Management:** Create and edit character sheets (name, class, attributes).
- **Pokémon Registration:** Add species or wild Pokémon, customize attributes, distribute experience points.
- **Alternate Forms:** Support for mega evolutions, regional forms (Alolan, Galarian, Hisuian, Paldean), Gigantamax and gender variants — each form imported as a separate species entry, with automatic female sprites.
- **Catalogues:** Browse Pokémon species, moves, abilities, items and natures.
- **Master Access:** Game master accounts can list all players, generate wild Pokémon, manage species and import data directly from the PokéAPI.
- **Species Autocomplete:** On the Generation tab, the master can search species by name or Pokédex number with real-time suggestions.
- **Wild Pokémon per Master:** Each master sees and manages only the wild Pokémon they generated.
- **Cloud Storage:** Supabase integration for custom sprites.

**Target audiences:**
- Game masters who need to manage multiple players and Pokémon.
- Players who want digital character sheets and organized teams.

---

## Architecture & Stack

```
┌─────────────────────────────────────────────────────────┐
│  Browser (React 18 + Vite)                              │
│  localhost:5173                                         │
├─────────────────────────────────────────────────────────┤
│  HTTP + Cookies (Session)                               │
├─────────────────────────────────────────────────────────┤
│  Backend (Spring Boot 3.2.5 + Java 17)                  │
│  localhost:8080                                         │
│  ├─ REST API                                            │
│  ├─ Spring Security (Session-based auth)               │
│  └─ JPA + Hibernate                                     │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL (Supabase or local)                         │
│  Migrations via Flyway (V34 is the latest)              │
│  Sprite storage on Supabase Storage                     │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

| Component | Technology | Version |
|---|---|---|
| **Backend** | Java + Spring Boot | 17 / 3.2.5 |
| **Database** | PostgreSQL | 12+ |
| **Migrations** | Flyway | included |
| **Frontend** | React | 18+ |
| **Frontend Build** | Vite | 5+ |
| **Frontend Router** | React Router | 6+ |
| **Package Managers** | Maven (backend), npm (frontend) | 3.9+ / 18+ |
| **Cloud DB** | Supabase (PostgreSQL) | optional |
| **Cloud Storage** | Supabase Storage | optional |

---

## Prerequisites

| Tool | Minimum Version | How to Check |
|---|---|---|
| **Java** | 17+ | `java -version` |
| **Maven** | 3.9+ | `mvn -version` |
| **Node.js** | 18+ | `node --version` |
| **npm** | 9+ | `npm --version` |
| **PostgreSQL** | 12+ | `psql --version` *(only for local setup)* |
| **PowerShell** (Windows) | 5.1+ | `$PSVersionTable.PSVersion` |

---

## First Run Guide

### Option A: Supabase (Recommended)

**Benefits:** No local DB setup, automatic backups, SSL, ideal for production.

#### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and log in.
2. Click **"New project"**, fill in the name, password and region, then wait ~2-3 minutes.

#### Step 2: Get Connection Details

In Project Settings → Database → Connection pooling:
- **Host:** e.g. `aws-0-sa-east-1.pooler.supabase.com`
- **Port:** `6543` (pooler) or `5432` (direct)
- **User:** `postgres.<PROJECT_REF>`
- **Password:** the password you set
- **Database:** `postgres`

#### Step 3: Configure Environment Variables

Create `.env` at the project root:

```plaintext
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://YOUR_HOST:6543/postgres
SPRING_DATASOURCE_USERNAME=postgres.YOUR_PROJECT_REF
SPRING_DATASOURCE_PASSWORD=YourDatabasePassword
DB_SSLMODE=require

# Supabase Storage (optional, for sprite uploads)
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Session (optional, for production)
SESSION_COOKIE_SAME_SITE=lax
SESSION_COOKIE_SECURE=false
```

```powershell
# Or copy from the template
Copy-Item .env.example .env
```

> **Important:** Spring Boot does **not** load `.env` files automatically. Use the `run.ps1` script so variables are injected into the Maven process.

### Option B: Local PostgreSQL

#### Step 1: Install PostgreSQL

Download from [postgresql.org](https://www.postgresql.org/download/), keep the default port `5432`.

#### Step 2: Create the Database

```powershell
psql -U postgres -h localhost
```

```sql
CREATE DATABASE pokemon_amethyst;
\q
```

#### Step 3: No `.env` Needed

The project defaults in `application.yml` already point to `localhost:5432/pokemon_amethyst`. No `.env` required unless you want to customize credentials.

---

## Running the App

### Backend (Spring Boot)

Open a PowerShell terminal at the **project root**:

```powershell
# With .env (Supabase or custom)
.\run.ps1

# Without .env (local PostgreSQL)
mvn spring-boot:run
```

Wait for:
```
Started PokemonAmethystApplication in X.XXX seconds
```

API ready at **`http://localhost:8080`**.

> On first run, **Flyway** creates all tables automatically.

### Frontend (React + Vite)

Open a **new terminal**:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

**Initial flow:**
1. **Register** — Create a user and password.
2. **Profile** — Create your character sheet.
3. **Pokémon** — Ask a Master to add your starter Pokémon; you'll catch others during sessions.
4. **Bag** — Manage items.

---

## Usage Flow

### Regular User (Player)

1. Registers with email and password.
2. Creates character sheet (name, HP, stamina, etc.).
3. Manages team (up to 6 active Pokémon, rest in box).
4. Manages bag.

### Master User (Game Master)

Masters are granted access by existing masters after a period as a player.

Additional access:
- **Generation tab:** Generates wild Pokémon with a searchable species field (autocomplete by name or Pokédex number). Each master only sees wild Pokémon they created.
- **Capture tab:** Applies wild Pokémon captures using Poké Balls from the player's inventory.
- **Species tab:** Configures abilities and learnsets per species. Supports bulk import from PokéAPI, managing alternate forms (megas, regionals, gender variants) and automatic female sprites.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/pokemon_amethyst` | PostgreSQL connection string |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | `postgres` | DB password |
| `DB_SSLMODE` | `disable` | `disable` for local, `require` for Supabase |
| `SPRING_DATASOURCE_POOL_SIZE` | `3` | Max connections (reduce for Supabase free tier) |
| `SPRING_DATASOURCE_POOL_MIN_IDLE` | `1` | Min idle connections |
| `SESSION_TIMEOUT` | `8h` | Session timeout before auto-logout |
| `SESSION_COOKIE_SAME_SITE` | `lax` | `lax` for dev, `none` for production HTTPS |
| `SESSION_COOKIE_SECURE` | `false` | `false` for local, `true` for production HTTPS |
| `POKEMON_RUNTIME_STRICT_LOCAL` | `true` | Strict validation in development |
| `VITE_SUPABASE_URL` | — | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | — | Supabase public key (Project Settings → API) |
| `JDBC_DEBUG` | `false` | `true` to enable Hikari JDBC debug logs |

---

## Available Scripts

### `run.ps1` (Windows/PowerShell)

Loads `.env` variables and starts the backend with `mvn spring-boot:run`.

```powershell
.\run.ps1
```

### `run-with-env.ps1` (Windows/PowerShell)

Loads `.env`, compiles with `mvn package -DskipTests`, and runs the compiled JAR.

```powershell
.\run-with-env.ps1
```

**Use when:** Testing the final JAR in a production-like setup.

---

## Deploy

### Docker (Recommended)

```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/pokemon-amethyst-*.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar -Dserver.port=${PORT:-8080} /app/app.jar"]
```

#### Deploy on Render

1. Push to GitHub.
2. Create a **Web Service** on [render.com](https://render.com) connected to the repo.
3. Leave Build/Start commands blank (uses Dockerfile).
4. Add environment variables: `SPRING_DATASOURCE_URL`, `USERNAME`, `PASSWORD`, `DB_SSLMODE=require`, `SESSION_COOKIE_SAME_SITE=none`, `SESSION_COOKIE_SECURE=true`.

#### Deploy Frontend on Netlify

1. `cd frontend && npm run build`
2. Deploy `frontend/dist/` to Netlify.
3. Build settings: command `npm run build`, publish dir `dist`, env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## Project Structure

```
.
├── README.md
├── pom.xml
├── Dockerfile
├── .env.example
├── run.ps1
├── run-with-env.ps1
│
├── frontend/
│   └── src/
│       ├── components/        # Reusable components (SearchableSelect, etc.)
│       ├── context/           # React Context (PlayerTargetContext)
│       ├── pages/             # Pages (Login, Profile, PokemonList, Geracao, Captura, MestreSpecies…)
│       ├── query/             # React Query setup
│       └── lib/               # Utilities (supabaseStorage.js)
│
├── src/main/java/com/pokemonamethyst/
│   ├── config/                # Spring Security, CORS
│   ├── web/controller/        # REST controllers
│   ├── service/               # Business logic
│   ├── domain/                # JPA entities
│   ├── repository/            # JPA repositories
│   └── web/dto/               # Request/response DTOs
│
└── src/main/resources/
    ├── application.yml
    └── db/migration/          # Flyway migrations (V1__ … V34__)
```

---

## Main API

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/registro` | Register (`email`, `senha`, `mestre: boolean`) |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout |

### Player Profile

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/perfis/meu` | Get logged-in user's profile |
| `PUT` | `/api/perfis/meu` | Create/update profile |

### Pokémon

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/perfis/meu/pokemons` | List player's Pokémon |
| `POST` | `/api/perfis/meu/pokemons` | Create Pokémon |
| `PUT` | `/api/perfis/meu/pokemons/{id}` | Update Pokémon |
| `DELETE` | `/api/perfis/meu/pokemons/{id}` | Delete Pokémon |

### Bag

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/perfis/meu/mochila` | List bag items |
| `PUT` | `/api/perfis/meu/mochila/itens` | Add/update item quantity |

### Catalogues (Public)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/movimentos` | List moves |
| `GET` | `/api/habilidades` | List abilities |
| `GET` | `/api/itens` | List items |
| `GET` | `/api/personalidades` | List natures |

### Master Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/mestre/jogadores` | List all players |
| `GET` | `/api/mestre/species` | List species (`nome`, `pokedexId`, `limit`, `incluirFormas`) |
| `GET` | `/api/mestre/species/{id}` | Get full species config (abilities + learnset) |
| `PUT` | `/api/mestre/species/{id}` | Save species config |
| `GET` | `/api/mestre/species/{id}/formas` | List alternate forms linked to a species |
| `POST` | `/api/mestre/pokeapi/importar-species/{pokedexId}` | Import a species from PokéAPI by number |
| `POST` | `/api/mestre/pokeapi/importar-species-todas` | Bulk import all missing species from PokéAPI |
| `GET` | `/api/mestre/selvagens` | List wild Pokémon for the logged-in master |
| `POST` | `/api/mestre/selvagens` | Generate a wild Pokémon |

---

## Troubleshooting

### Backend won't start

#### `Connection refused (localhost:5432)`

- **Local:** Start PostgreSQL (Windows: Services → PostgreSQL → Start).
- **Supabase:** Check `.env` has `SPRING_DATASOURCE_URL`, `USERNAME`, `PASSWORD` and run with `.\run.ps1`.

#### `max_connections reached`

Add to `.env`:
```plaintext
SPRING_DATASOURCE_POOL_SIZE=2
SPRING_DATASOURCE_POOL_MIN_IDLE=0
```

#### `SSL certificate problem`

```plaintext
DB_SSLMODE=require
```

### Frontend won't connect to backend

#### `POST /api/... 404` or CORS error

1. Confirm backend is running at `http://localhost:8080`.
2. Check proxy in `frontend/vite.config.js`: `'/api': { target: 'http://localhost:8080' }`.
3. Restart: `npm run dev`.

### Login doesn't work

#### `Invalid email or password`

Click **"Registrar"** first, then **"Entrar"** with the same credentials.

#### `401 Unauthorized` after login

1. Clear cookies (DevTools → Application → Cookies → Delete).
2. Log in again.
3. On production HTTPS: verify `SESSION_COOKIE_SECURE=true`.

### Flyway migration fails

#### `Flyway migration pending`

1. Check files in `src/main/resources/db/migration/`.
2. In dev, recreate the database:
   ```sql
   DROP DATABASE pokemon_amethyst;
   CREATE DATABASE pokemon_amethyst;
   ```
3. Restart `mvn spring-boot:run`.
