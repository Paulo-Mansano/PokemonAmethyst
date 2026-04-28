# Pokémon Amethyst

**Sistema web para administrar Pokémon e jogadores em um RPG de mesa próprio.**

Crie perfis de personagens, gerencie times de Pokémon, distribua pontos de status, desenvolva habilidades e gerencie mochilas em um ambiente colaborativo ideal para mestres (game masters) e jogadores.

---

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
- **Cadastro de Pokémon:** Adicione Pokémon selvagens ou de espécie, customize atributos, distribua pontos de experiência.
- **Sistema de Batalha:** Estrutura para registrar combates (em desenvolvimento).
- **Catálogos:** Explore Pokémon por geração, movimentos, habilidades, itens e personalidades.
- **Acesso Mestre:** Contas mestre (game master) podem listar todos os jogadores e modificar dados globais.
- **Sincronização Cloud:** Integração com Supabase para armazenar sprites customizados e sincronizar dados em tempo real.

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
│  Migrations via Flyway                                  │
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
| **Cloud DB** | Supabase (PostgreSQL) | optional |
| **Storage Cloud** | Supabase Storage | optional |

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
   - **Database Password:** invente uma senha segura e **anote-a** (você vai precisar).
   - **Region:** escolha a mais próxima (ex. `South America - São Paulo`).
4. Clique **"Create new project"** e aguarde ~2-3 minutos pela criação.

#### Passo 2: Extrair Dados de Conexão

1. No dashboard do projeto Supabase, clique no ícone de **engrenagem** (Project Settings) no canto inferior esquerdo.
2. No menu lateral, clique em **"Database"**.
3. Você verá **"Connection string"** — escolha a aba **"Connection pooling"** (recomendado para aplicações web).
4. Copie a URI no formato `postgresql://postgres.<PROJECT_REF>:PASSWORD@...` ou localize os componentes:
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
- Substitua `SEU_PROJECT_REF` pela referência do projeto (ex. `abcdefgh123` — encontra no link `https://app.supabase.com/project/abcdefgh123/...`).
- Use a porta `6543` para pooler ou `5432` para conexão direta.
- Deixe `DB_SSLMODE=require` para Supabase (obrigatório).

**Arquivo `.env.example`:** Um modelo vazio já existe no repositório; você pode copiar:
```powershell
# No PowerShell
Copy-Item .env.example .env
```

#### Passo 4: Validar Arquivo `.env`

Abra o PowerShell, navegue até a raiz do projeto e teste:

```powershell
Get-Content .env
```

Verifique que contém as três variáveis críticas: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`.

### Opção B: PostgreSQL Local

**Vantagens:** Sem conta cloud necessária, dev rápido, ideal para testes locais.

#### Passo 1: Instalar PostgreSQL

1. Download em [postgresql.org](https://www.postgresql.org/download/).
2. Execute o instalador:
   - **Port:** deixe como padrão `5432`.
   - **Superuser password:** use `postgres` (ou anote a senha).
3. Após instalação, verifique no terminal:
   ```bash
   psql --version
   ```

#### Passo 2: Criar Banco

Abra PowerShell e execute:

```powershell
psql -U postgres -h localhost
```

Na prompt do psql, execute:

```sql
CREATE DATABASE pokemon_amethyst;
\q
```

#### Passo 3: Configurar Projeto

O projeto já possui valores padrão para PostgreSQL local no arquivo `application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/pokemon_amethyst
    username: postgres
    password: postgres
```

**Você NÃO precisa criar arquivo `.env`** — o projeto usará esses defaults automaticamente.

Mas se quiser customizar (ex. usuário diferente), crie `.env`:

```plaintext
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/pokemon_amethyst
SPRING_DATASOURCE_USERNAME=SEU_USUARIO
SPRING_DATASOURCE_PASSWORD=SEU_PASSWORD
```

---

## Executar a Aplicação

### Backend (Spring Boot)

Abra um terminal PowerShell **na raiz do projeto** e execute um dos comandos abaixo:

#### Se você criou `.env` (Supabase ou customizado):

```powershell
.\run.ps1
```

Este script carrega as variáveis do `.env` e inicia o backend com `mvn spring-boot:run`.

#### Se está usando PostgreSQL local (sem `.env`):

```bash
mvn spring-boot:run
```

#### Esperado:

Você verá logs no terminal. Procure por:

```
Started PokemonAmethystApplication in X.XXX seconds
```

A API estará pronta em **`http://localhost:8080`**.

**Nota:** Na primeira execução, o **Flyway** criará todas as tabelas automaticamente (leva ~10-30 segundos).

### Frontend (React + Vite)

Abra um **novo terminal** PowerShell e navegue até o diretório `frontend`:

```powershell
cd frontend
npm install
npm run dev
```

**Esperado:**

```
➜  Local:   http://localhost:5173/
➜  press h + enter to show help
```

### Acessar a Aplicação

Abra o navegador e acesse:

```
http://localhost:5173
```

Você verá a tela de login. Clique em **"Registrar"** para criar uma conta.

**Fluxo inicial:**
1. **Registrar** — Crie um email e senha. Se usar a flag "Mestre", você terá acesso adicional.
2. **Ficha** — Crie seu personagem (nome, classe, atributos).
3. **Pokémon** — Adicione Pokémon ao seu time (até 6 ativos, o resto em box).
4. **Mochila** — Gerencie itens.

---

## Fluxo de Uso

### Usuário Comum (Jogador)

1. **Registra-se** com email e senha.
2. **Cria ficha** do personagem (nome, atributos HP, stamina, etc.).
3. **Adiciona Pokémon** ao time (até 6 no time ativo, resto na box).
4. **Gerencia mochila** — adiciona/remove itens.
5. **Participa de batalhas** — sistema em desenvolvimento.

### Usuário Mestre (Game Master)

1. Cria conta com flag **"Mestre"** durante o registro.
2. Acesso adicional:
   - **Aba Geração:** gera Pokémon selvagens aleatórios ou customizados.
   - **Aba Mestre Species:** cria novas espécies de Pokémon ou edita existentes.
   - **API /api/mestre/jogadores:** lista todos os jogadores do sistema.

---

## Variáveis de Ambiente

Todas as variáveis podem ser definidas em `.env` na raiz do projeto. Spring Boot as carrega automaticamente.

| Variável | Padrão | Descrição |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/pokemon_amethyst` | Connection string do PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | Usuário do banco |
| `SPRING_DATASOURCE_PASSWORD` | `postgres` | Senha do banco |
| `DB_SSLMODE` | `disable` | `disable` para local, `require` para Supabase |
| `SPRING_DATASOURCE_POOL_SIZE` | `3` | Máximo de conexões (reduzir para Neon Session mode) |
| `SPRING_DATASOURCE_POOL_MIN_IDLE` | `1` | Mínimo de conexões idle |
| `SESSION_TIMEOUT` | `8h` | Tempo de sessão antes de logout automático |
| `SESSION_COOKIE_SAME_SITE` | `lax` | `lax` para dev, `none` para produção com HTTPS |
| `SESSION_COOKIE_SECURE` | `false` | `false` para local, `true` para produção com HTTPS |
| `POKEMON_RUNTIME_STRICT_LOCAL` | `true` | Validações rigorosas em desenvolvimento |
| `VITE_SUPABASE_URL` | — | URL do projeto Supabase (ex. `https://abcdefgh.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | — | Chave pública do Supabase (encontra em Project Settings → API) |
| `JDBC_DEBUG` | `false` | Defina como `true` para ver debug de conexão JDBC (Hikari) |

**Para Produção (Render + Netlify):**

Defina essas variáveis no painel de cada serviço:
- Render: **Environment** → set variables.
- Netlify: **Site Settings** → **Build & Deploy** → **Environment**.

---

## Scripts Disponíveis

### `run.ps1` (Windows/PowerShell)

Carrega variáveis do `.env` e executa o backend com `mvn spring-boot:run`.

```powershell
.\run.ps1
```

**Quando usar:** Desenvolvimento rápido com variáveis de ambiente. O Maven compila e roda em modo watch.

**Por que existe:** No Windows, variáveis de processo filho do Maven podem não ser herdadas corretamente; este script garante.

### `run-with-env.ps1` (Windows/PowerShell)

Carrega `.env`, compila com `mvn package -DskipTests`, e executa o JAR compilado com `java -jar`.

```powershell
.\run-with-env.ps1
```

**Quando usar:** Após fazer deploy ou testar o JAR em produção sem Maven.

**Diferença:** Não usa `mvn spring-boot:run` (que mantém Maven em memória), mas constrói um JAR completo — mais perto do comportamento de produção.

---

## Deploy

### Docker (Recomendado)

O projeto inclui `Dockerfile` pronto para build e deploy em serviços como Render, Railway, ou Heroku.

```dockerfile
# Build backend
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

# Final image com JRE
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
   - **Build Command:** deixe em branco (usa Dockerfile).
   - **Start Command:** deixe em branco.
   - **Environment Variables:** adicione:
     - `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`.
     - `DB_SSLMODE=require` (para Supabase remoto).
     - `SESSION_COOKIE_SAME_SITE=none`, `SESSION_COOKIE_SECURE=true`.
5. Deploy!

#### Deploy Frontend em Netlify

1. Build local: `cd frontend && npm run build`.
2. Faça deploy da pasta `frontend/dist/` para Netlify.
3. Configure **Build Settings** em Netlify:
   - **Build command:** `npm run build`.
   - **Publish directory:** `dist`.
   - **Environment:** adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

---

## Estrutura do Projeto

```
.
├── README.md                          # Documentação (você está aqui)
├── pom.xml                            # Dependências Maven (backend)
├── Dockerfile                         # Build do backend
├── .env.example                       # Modelo de variáveis de ambiente
├── run.ps1                            # Script: rodar backend com .env
├── run-with-env.ps1                   # Script: build JAR e rodar com .env
│
├── frontend/                          # Aplicação React
│   ├── package.json                   # Dependências npm
│   ├── vite.config.js                 # Config Vite (porta 5173, proxy /api)
│   ├── index.html                     # HTML entry
│   ├── src/
│   │   ├── main.jsx                   # React root
│   │   ├── App.jsx                    # Router principal
│   │   ├── Layout.jsx                 # Layout comum (navbar, sidebar)
│   │   ├── api.js                     # Cliente HTTP para backend
│   │   ├── index.css                  # Estilos globais
│   │   ├── components/                # Componentes reutilizáveis
│   │   ├── context/                   # React Context (PlayerTargetContext)
│   │   ├── pages/                     # Páginas (Login, Perfil, PokemonList, etc.)
│   │   ├── query/                     # React Query setup (queryClient, queryKeys)
│   │   └── lib/                       # Libs (supabaseStorage.js)
│   └── public/
│       └── _redirects                 # Config Netlify (SPA routing)
│
├── src/main/java/com/pokemonamethyst/  # Código backend
│   ├── config/                        # Spring config (Security, etc.)
│   ├── controller/                    # REST controllers (/api/...)
│   ├── service/                       # Lógica de negócio (PokemonService, etc.)
│   ├── domain/                        # Entidades JPA (Usuario, Pokemon, etc.)
│   ├── repository/                    # Interfaces JPA (CrudRepository)
│   ├── exception/                     # Exceções customizadas
│   ├── web/                           # DTOs de request/response
│   └── PokemonAmethystApplication.java # Entry point Spring Boot
│
├── src/main/resources/
│   ├── application.yml                # Configuração Spring (BD defaults, etc.)
│   └── db/migration/                  # Migrations Flyway (V1__..., V2__..., etc.)
│
├── src/test/java/                     # Testes unitários e integração
│
└── supabase/
    └── storage/                       # Policies SQL do Supabase Storage (sprites)
```

### Diretórios Principais

| Diretório | Descrição |
|---|---|
| **frontend/** | Código React (componentes, páginas, estilos) |
| **src/main/java/** | Código Spring Boot (controllers, services, entities) |
| **src/main/resources/db/migration/** | Migrations SQL (Flyway) — criadas automaticamente |
| **target/** | Pasta de build Maven (gerada automaticamente) |
| **supabase/storage/** | Policies SQL para Supabase Storage (imagens de Pokémon) |

---

## API Principal

### Autenticação

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/auth/registro` | Registrar conta (body: `email`, `senha`, `mestre: boolean`) |
| `POST` | `/api/auth/login` | Login (body: `email`, `senha`) |
| `POST` | `/api/auth/logout` | Logout (limpa sessão) |

### Perfil do Jogador

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/perfis/meu` | Obter perfil do usuário logado |
| `PUT` | `/api/perfis/meu` | Criar/atualizar perfil (body: `nome`, `classe`, `hp`, `stamina`, etc.) |

### Pokémon

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/perfis/meu/pokemons` | Listar Pokémon do jogador |
| `POST` | `/api/perfis/meu/pokemons` | Criar novo Pokémon (body: `especie`, `nickname`, `nivel`, etc.) |
| `PUT` | `/api/perfis/meu/pokemons/{id}` | Atualizar Pokémon (status, movimentos, habilidade ativa) |
| `DELETE` | `/api/perfis/meu/pokemons/{id}` | Deletar Pokémon |

### Mochila

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/perfis/meu/mochila` | Listar itens na mochila |
| `PUT` | `/api/perfis/meu/mochila/itens` | Adicionar/atualizar quantidade de item (body: `itemId`, `quantidade`) |

### Catálogos (Público)

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/pokemons?geracao=1` | Listar Pokémon por geração |
| `GET` | `/api/movimentos` | Listar movimentos (ataques) |
| `GET` | `/api/habilidades` | Listar habilidades de Pokémon |
| `GET` | `/api/itens` | Listar itens do jogo |
| `GET` | `/api/personalidades` | Listar personalidades (naturezas) de Pokémon |

### Endpoints Mestre

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/mestre/jogadores` | Listar todos os jogadores (requer flag `mestre=true`) |
| `POST` | `/api/mestre/pokemons` | Gerar Pokémon selvagem aleatório |
| `PUT` | `/api/mestre/especies` | Criar/editar espécie de Pokémon |

---

## Troubleshooting

### Backend não inicia

#### Erro: `Connection refused (localhost:5432)`

**Causa:** PostgreSQL não está rodando (ou você esqueceu `.env` para Supabase).

**Solução:**
- Se usar **local:** Inicie PostgreSQL (Windows: Services → PostgreSQL → Start).
- Se usar **Supabase:** Crie `.env` com `SPRING_DATASOURCE_URL`, `USERNAME`, `PASSWORD`.

#### Erro: `max_connections reached` ou `FATAL: sorry, too many clients`

**Causa:** Pool de conexões muito grande para o plano Supabase (ex. Neon free tier).

**Solução:** No `.env`, defina:
```plaintext
SPRING_DATASOURCE_POOL_SIZE=2
SPRING_DATASOURCE_POOL_MIN_IDLE=0
```

#### Erro: `SSL certificate problem`

**Causa:** SSL desabilitado localmente mas você tenta conectar a Supabase.

**Solução:** No `.env`, defina:
```plaintext
DB_SSLMODE=require
```

### Frontend não conecta ao backend

#### Erro: `POST /api/... 404` ou CORS error

**Causa:** Backend não está rodando, ou porta errada.

**Solução:**
1. Verifique se backend está em `http://localhost:8080` (veja logs).
2. No `frontend/vite.config.js`, confirme proxy: `'/api': { target: 'http://localhost:8080' }`.
3. Reinicie: `npm run dev` no diretório `frontend/`.

### Login não funciona

#### Erro: `Invalid email or password`

**Causa:** Banco vazio (sem usuários criados) ou credenciais erradas.

**Solução:**
1. Clique em **"Registrar"** na tela de login.
2. Preencha email e senha.
3. Clique em **"Registrar"** (cria usuário).
4. Agora tente **"Entrar"** com as mesmas credenciais.

#### Erro: `401 Unauthorized` após login

**Causa:** Sessão expirada (timeout 8 horas por padrão) ou cookies desabilitados.

**Solução:**
1. Limpe cookies do navegador (Devtools → Application → Cookies → Delete).
2. Faça login novamente.
3. Se usando produção HTTPS, verifique `SESSION_COOKIE_SECURE=true` no .env.

### npm install falha

#### Erro: `npm ERR! Could not resolve dependency`

**Causa:** Versão de Node/npm antiga ou cache corrompido.

**Solução:**
```bash
# Atualizar npm
npm install -g npm@latest

# Limpar cache
npm cache clean --force

# Tentar novamente
cd frontend
npm install
```

### Flyway migration falha

#### Erro: `Flyway migration pending` ou `Could not execute migration`

**Causa:** Arquivo migration SQL corrompido ou conflito de versão.

**Solução:**
1. Verifique arquivos em `src/main/resources/db/migration/` (V1__, V2__, etc.).
2. Se em dev, limpe o banco e deixe Flyway recriar:
   ```sql
   DROP DATABASE pokemon_amethyst;
   CREATE DATABASE pokemon_amethyst;
   ```
3. Reinicie `mvn spring-boot:run`.

---

## Próximos Passos

- **Documentação de API:** Detalhes de cada endpoint com exemplos.
- **Guia de Contribuição:** Como reportar bugs, submeter features.
- **Documentação Interna:** Arquitetura de serviços, padrões de código.

Para dúvidas ou bugs, abra uma issue no repositório.
