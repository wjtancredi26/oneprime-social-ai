# Atualização da conexão Meta

Esta versão corrige o fluxo de conexão do Facebook e Instagram.

## O que mudou

- Busca todas as Páginas autorizadas, incluindo paginação.
- Confere as permissões realmente concedidas pela Meta.
- Não conecta mais automaticamente a primeira Página encontrada.
- Mostra uma tela para o usuário escolher a Página correta.
- Detecta automaticamente o Instagram profissional vinculado à Página.
- Valida se o usuário possui tarefa para criar conteúdo.
- Mantém tokens temporários protegidos no banco por uma sessão OAuth curta.
- Solicita novamente permissões que foram negadas anteriormente (`auth_type=rerequest`).

## Antes de publicar

No backend, execute:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

Variáveis obrigatórias no Railway:

```env
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=https://SEU-BACKEND.up.railway.app/api/meta/callback
META_GRAPH_VERSION=v25.0
FRONTEND_URL=https://SEU-FRONTEND.vercel.app
TOKEN_ENCRYPTION_KEY=
JWT_SECRET=
```

No painel Meta for Developers, a URI de redirecionamento OAuth válida deve ser exatamente igual ao `META_REDIRECT_URI`.

## Permissões do aplicativo

- pages_show_list
- pages_read_engagement
- pages_manage_posts
- instagram_basic
- instagram_content_publish

Para contas de clientes que não são administradores/testadores do aplicativo, essas permissões precisam de Acesso Avançado e aprovação na Análise do Aplicativo da Meta.
