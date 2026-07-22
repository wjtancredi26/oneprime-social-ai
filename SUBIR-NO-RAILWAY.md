# OnePrime Social AI — versão pronta para Railway

## Correção principal
O backend agora valida `META_APP_ID` antes de montar a URL do Facebook. Valores como `SEU_APP_ID`, `YOUR_APP_ID`, vazios ou não numéricos são bloqueados com uma mensagem clara, em vez de abrir uma URL inválida.

## Arquivos importantes alterados/revisados
- `backend/src/config/env.js`
- `backend/src/routes/metaAuthRoutes.js`
- `backend/src/services/metaOAuthService.js`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260721173000_add_meta_oauth_session/migration.sql`
- `frontend/src/pages/Social.jsx`
- `frontend/src/services/api.js`
- `backend/railway.json`
- `railway.json`

## Variáveis obrigatórias no Railway
- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `FRONTEND_URL`
- `META_APP_ID` — somente o número real do aplicativo
- `META_APP_SECRET`
- `META_REDIRECT_URI`
- `META_GRAPH_VERSION=v25.0`
- `META_TOKEN_ENCRYPTION_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Para o backend atual:

`META_REDIRECT_URI=https://carefree-patience-production.up.railway.app/api/meta/callback`

A mesma URL deve estar cadastrada no Meta for Developers em **URIs de redirecionamento OAuth válidos**.

## Publicação pelo GitHub
Substitua os arquivos do projeto local por estes, preservando seu `.env` local e a pasta `.git`. Depois execute:

```powershell
git status
git add .
git commit -m "Corrige OAuth Meta e prepara Railway"
git push origin multiusuarios
```

O Railway deve iniciar um novo deploy automaticamente.

## Validação
1. Aguarde o deploy ficar `Successful`.
2. Abra `/health` no domínio do Railway.
3. Entre no sistema e clique em **Conectar Meta**.
4. A URL deve conter `client_id=` seguido apenas do número real do App ID.
