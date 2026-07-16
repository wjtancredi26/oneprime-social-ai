# Sprint 1 — Conexão Meta persistente por empresa

## O que foi alterado

- Criada a tabela `SocialConnection` no PostgreSQL.
- Tokens da Meta passam a ser criptografados antes de serem gravados.
- A conexão é vinculada à empresa selecionada.
- O arquivo temporário `metaConnection.json` deixou de ser usado.
- Publicação manual e scheduler passam a buscar a conexão da empresa do post.
- A tela Redes Sociais permite selecionar empresa, conectar, reconectar e desconectar.
- O login do frontend agora usa o endpoint real `/api/auth/login` e mantém a sessão.
- O agendamento converte data e hora local para ISO, evitando diferença de fuso no Railway.

## Railway — novas variáveis

```env
META_APP_ID=...
META_APP_SECRET=...
META_REDIRECT_URI=https://carefree-patience-production.up.railway.app/api/meta/callback
META_TOKEN_ENCRYPTION_KEY=uma-chave-longa-e-secreta-com-pelo-menos-24-caracteres
```

Mantenha também `META_GRAPH_VERSION=v25.0`.

## Deploy

O Railway deve executar:

- Build: `npm install && npm run prisma:generate`
- Pre-deploy: `npx prisma migrate deploy`
- Start: `npm start`

A migration nova é:

`20260716150000_add_social_connections`

## Limitação desta primeira entrega

Quando a conta administra mais de uma Página, o callback conecta a primeira Página retornada pela Meta. A próxima entrega adicionará a tela de seleção de Página antes de concluir a conexão.
