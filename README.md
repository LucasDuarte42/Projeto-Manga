# 📚 Projeto Coleção de Mangás e HQs
<<<<<<< HEAD

Bem-vindo ao seu sistema de gerenciamento de coleção de mangás e HQs! Este projeto foi desenvolvido para ajudar você a organizar, acompanhar e visualizar seu progresso de leitura de forma intuitiva e eficiente.

## ✨ Funcionalidades Principais

Este sistema oferece uma série de recursos para enriquecer sua experiência de colecionador:

-   **Gerenciamento de Coleção:** Adicione, edite e organize seus mangás e HQs.
-   **Suporte a Múltiplos Tipos:** Classifique suas obras como `Mangá` ou `HQ`, com buscas dedicadas para cada tipo.
-   **Busca Inteligente:**
    -   Para `Mangás`: Integração com a API Jikan (MyAnimeList) para busca automática de títulos, capas e informações.
    -   Para `HQs`: Integração com a Open Library API para busca de títulos e capas, sem necessidade de chave de API.
-   **Dashboard Avançado:** Visualize estatísticas detalhadas sobre sua coleção:
    -   **Total de Obras:** Quantidade total de mangás/HQs na sua coleção.
    -   **Volumes Lidos:** Soma de todos os volumes que você avaliou individualmente (indicando leitura).
    -   **Lendo:** Obras atualmente em progresso de leitura.
    -   **Quero Ler:** Obras que você planeja ler.
    -   **Volumes que tenho:** Contagem exata dos volumes que você marcou como possuídos.
    -   **Coleção em Andamento:** Obras que ainda não foram completadas.
    -   **Coleção Lida:** Obras que você completou 100% (volume atual >= total de volumes).
    -   **Média de Notas:** Sua nota média para as obras avaliadas.
-   **Edição Rápida:** Edite informações essenciais (título, autor, volume atual, nota, status e volumes possuídos) diretamente do card da coleção, sem sair da página de listagem.
-   **Automação de Status:** Ao atribuir uma nota a uma obra, ela é automaticamente marcada como `Lido`.
-   **Skeleton Loading:** Animações de carregamento que proporcionam uma experiência de usuário mais fluida enquanto os dados são buscados.
-   **Responsividade Mobile:** Interface otimizada para funcionar perfeitamente em dispositivos móveis, garantindo uma experiência consistente em qualquer tela.

## 🚀 Como Rodar o Projeto Localmente

Siga os passos abaixo para configurar e executar o projeto em sua máquina local.

### Pré-requisitos

Certifique-se de ter o seguinte instalado:

-   [Node.js](https://nodejs.org/en/) (versão 18 ou superior)
-   [npm](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/)
-   [Git](https://git-scm.com/)
-   Um banco de dados PostgreSQL (pode ser local ou um serviço como [ElephantSQL](https://www.elephantsql.com/))

### 1. Clonar o Repositório

```bash
git clone https://github.com/LucasDuarte42/Projeto-Manga.git
cd Projeto-Manga
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
NEXTAUTH_SECRET="sua_chave_secreta_para_nextauth"
NEXTAUTH_URL="http://localhost:3000"

# Opcional: Chave da API Comic Vine (se decidir usar no futuro)
# COMIC_VINE_API_KEY="sua_chave_da_comic_vine"
```

-   `DATABASE_URL`: Conexão com seu banco de dados PostgreSQL.
-   `NEXTAUTH_SECRET`: Uma string aleatória e longa para segurança do NextAuth. Você pode gerar uma com `openssl rand -base64 32`.
-   `NEXTAUTH_URL`: A URL base da sua aplicação (para desenvolvimento local, `http://localhost:3000`).

### 3. Instalar Dependências

```bash
npm install
# ou
yarn install
```

### 4. Configurar o Banco de Dados

Execute os comandos do Prisma para gerar o cliente e aplicar as migrações no seu banco de dados:

```bash
npx prisma generate
npx prisma db push
```

### 5. Rodar o Servidor de Desenvolvimento

```bash
npm run dev
# ou
yarn dev
```

O aplicativo estará disponível em `http://localhost:3000`.



## 📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

=======
>>>>>>> feat/suporte-comics

Bem-vindo ao seu sistema de gerenciamento de coleção de mangás e HQs! Este projeto foi desenvolvido para ajudar você a organizar, acompanhar e visualizar seu progresso de leitura de forma intuitiva e eficiente.

## ✨ Funcionalidades Principais

Este sistema oferece uma série de recursos para enriquecer sua experiência de colecionador:

-   **Gerenciamento de Coleção:** Adicione, edite e organize seus mangás e HQs.
-   **Suporte a Múltiplos Tipos:** Classifique suas obras como `Mangá` ou `HQ`, com buscas dedicadas para cada tipo.
-   **Busca Inteligente:**
    -   Para `Mangás`: Integração com a API Jikan (MyAnimeList) para busca automática de títulos, capas e informações.
    -   Para `HQs`: Integração com a Open Library API para busca de títulos e capas, sem necessidade de chave de API.
-   **Dashboard Avançado:** Visualize estatísticas detalhadas sobre sua coleção:
    -   **Total de Obras:** Quantidade total de mangás/HQs na sua coleção.
    -   **Volumes Lidos:** Soma de todos os volumes que você avaliou individualmente (indicando leitura).
    -   **Lendo:** Obras atualmente em progresso de leitura.
    -   **Quero Ler:** Obras que você planeja ler.
    -   **Volumes que tenho:** Contagem exata dos volumes que você marcou como possuídos.
    -   **Coleção em Andamento:** Obras que ainda não foram completadas.
    -   **Coleção Lida:** Obras que você completou 100% (volume atual >= total de volumes).
    -   **Média de Notas:** Sua nota média para as obras avaliadas.
-   **Edição Rápida:** Edite informações essenciais (título, autor, volume atual, nota, status e volumes possuídos) diretamente do card da coleção, sem sair da página de listagem.
-   **Automação de Status:** Ao atribuir uma nota a uma obra, ela é automaticamente marcada como `Lido`.
-   **Skeleton Loading:** Animações de carregamento que proporcionam uma experiência de usuário mais fluida enquanto os dados são buscados.
-   **Responsividade Mobile:** Interface otimizada para funcionar perfeitamente em dispositivos móveis, garantindo uma experiência consistente em qualquer tela.

## 🚀 Como Rodar o Projeto Localmente

Siga os passos abaixo para configurar e executar o projeto em sua máquina local.

### Pré-requisitos

Certifique-se de ter o seguinte instalado:

-   [Node.js](https://nodejs.org/en/) (versão 18 ou superior)
-   [npm](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/)
-   [Git](https://git-scm.com/)
-   Um banco de dados PostgreSQL (pode ser local ou um serviço como [ElephantSQL](https://www.elephantsql.com/))

### 1. Clonar o Repositório

```bash
git clone https://github.com/LucasDuarte42/Projeto-Manga.git
cd Projeto-Manga
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
NEXTAUTH_SECRET="sua_chave_secreta_para_nextauth"
NEXTAUTH_URL="http://localhost:3000"

# Opcional: Chave da API Comic Vine (se decidir usar no futuro)
# COMIC_VINE_API_KEY="sua_chave_da_comic_vine"
```

-   `DATABASE_URL`: Conexão com seu banco de dados PostgreSQL.
-   `NEXTAUTH_SECRET`: Uma string aleatória e longa para segurança do NextAuth. Você pode gerar uma com `openssl rand -base64 32`.
-   `NEXTAUTH_URL`: A URL base da sua aplicação (para desenvolvimento local, `http://localhost:3000`).

### 3. Instalar Dependências

```bash
npm install
# ou
yarn install
```

### 4. Configurar o Banco de Dados

Execute os comandos do Prisma para gerar o cliente e aplicar as migrações no seu banco de dados:

```bash
npx prisma generate
npx prisma db push
```

### 5. Rodar o Servidor de Desenvolvimento

```bash
npm run dev
# ou
yarn dev
```

O aplicativo estará disponível em `http://localhost:3000`.



## 📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---


