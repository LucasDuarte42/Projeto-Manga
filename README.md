# Pinakes Mangá

Sistema para organizar uma coleção de mangás e HQs, acompanhar o progresso de leitura e visualizar estatísticas pessoais.

## Funcionalidades

- Gerenciamento de mangás e HQs.
- Cadastro, edição, exclusão e avaliação por volume.
- Dashboard com estatísticas da coleção.
- Busca de mangás e HQs em serviços externos.
- Autenticação com credenciais e recuperação de senha.
- Rate limiting distribuído com Upstash Redis quando configurado.
- Interface responsiva com suporte a logout nos headers autenticados.

## Pré-requisitos

Instale o Node.js 20 ou superior, Git e tenha acesso a um banco PostgreSQL local ou hospedado.

Para o rate limiting distribuído, crie um banco Redis no Upstash, pelo [Upstash](https://upstash.com/) ou pelo Marketplace da Vercel. A aplicação também pode iniciar localmente sem as credenciais do Upstash; nesse caso, o rate limiting fica liberado apenas em desenvolvimento e bloqueado em produção até a configuração ser feita.

## Instalação

Clone a branch atual do recurso:

```bash
git clone -b feature/logout-header https://github.com/LucasDuarte42/Projeto-Manga.git
cd Projeto-Manga
npm install
npx prisma generate
```

Crie um arquivo `.env.local` na raiz:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
NEXTAUTH_SECRET="gere-uma-chave-longa-e-aleatoria"
NEXTAUTH_URL="http://localhost:3000"

# Upstash Redis
KV_REST_API_URL="https://seu-banco.upstash.io"
KV_REST_API_TOKEN="seu-token"

# Necessário para enviar e-mails de recuperação
RESEND_API_KEY="re_sua_chave"

# Opcional: monitoramento de erros com Sentry
SENTRY_DSN="https://...@sentry.io/..."
NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
```

Gere uma chave segura para o NextAuth com:

```bash
openssl rand -base64 32
```

Nunca publique `.env.local` no GitHub. O arquivo já está incluído no `.gitignore`.

## Banco de dados

Aplique o schema Prisma ao banco de desenvolvimento:

```bash
npx prisma db push
```

Em produção, prefira migrations versionadas quando o schema estiver estabilizado:

```bash
npx prisma migrate dev --name initial
```

## Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Rate limiting com Upstash

As rotas de cadastro, recuperação e redefinição de senha usam `@upstash/ratelimit` com janela deslizante de 5 tentativas a cada 15 minutos. Todas as instâncias da aplicação compartilham os contadores pelo Redis.

Na Vercel, configure `KV_REST_API_URL` e `KV_REST_API_TOKEN` nos ambientes Preview e Production. O token somente leitura (`KV_REST_API_READ_ONLY_TOKEN`) não deve ser usado, porque o rate limiting precisa gravar contadores. Após salvar as variáveis, faça um novo deploy. Sem Redis configurado, o projeto não deve ser considerado pronto para produção porque as rotas sensíveis serão bloqueadas pelo mecanismo fail-closed. Para receber alertas de erros, configure também `SENTRY_DSN` no servidor e `NEXT_PUBLIC_SENTRY_DSN` no ambiente público do frontend.

## Validação

```bash
npx tsc --noEmit
npm run test
npm run build
npm audit --omit=dev
```

## Licença

Este projeto está licenciado sob a licença MIT. Consulte o arquivo `LICENSE` para mais detalhes.
