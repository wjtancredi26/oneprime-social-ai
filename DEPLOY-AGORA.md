# OnePrime AI — Publicação em produção

## 1. Backend no Railway

Crie um serviço apontando para a pasta `backend`.

Variáveis obrigatórias:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=uma-chave-forte
OPENAI_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
META_GRAPH_VERSION=v25.0
META_APP_ID=...
META_APP_SECRET=...
META_REDIRECT_URI=https://SEU-BACKEND.up.railway.app/api/meta/callback
META_TOKEN_ENCRYPTION_KEY=uma-chave-longa-com-no-minimo-24-caracteres
FRONTEND_URL=https://SEU-FRONTEND.vercel.app
ADMIN_NAME=Wilian
ADMIN_EMAIL=SEU_EMAIL
ADMIN_PASSWORD=UMA_SENHA_FORTE
```

> A variável correta para criptografar os tokens é `META_TOKEN_ENCRYPTION_KEY`.

O deploy executará:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
node src/server.js
```

## 2. Frontend no Vercel

Crie um projeto apontando para a pasta `frontend`.

Variável:

```env
VITE_API_URL=https://SEU-BACKEND.up.railway.app/api
```

Build:

```bash
npm run build
```

Diretório de saída:

```text
dist
```

## 3. Meta for Developers

Cadastre exatamente esta URI no produto Facebook Login:

```text
https://SEU-BACKEND.up.railway.app/api/meta/callback
```

Solicite/ative as permissões:

```text
pages_show_list
pages_read_engagement
pages_manage_posts
instagram_basic
instagram_content_publish
```

Durante o modo de desenvolvimento, o perfil que testa deve possuir função no aplicativo e acesso à Página.

## 4. Teste final

1. Entre no OnePrime AI.
2. Abra Redes Sociais.
3. Selecione uma empresa.
4. Clique em Conectar Meta.
5. Autorize todas as Páginas.
6. Escolha a Página na tela do OnePrime.
7. Confirme se o Instagram profissional foi identificado.
8. Gere texto e imagem.
9. Agende para 3 a 5 minutos à frente.
10. Confira o status PUBLICADO no histórico.
