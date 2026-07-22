# Subir a correção no Railway

Esta versão elimina o erro `EBUSY /app/node_modules/.cache` usando um Dockerfile próprio.
Ela também permite conectar primeiro o Facebook sem bloquear o login pela permissão
`instagram_content_publish`. Depois do login, o sistema mostra as Páginas disponíveis
para você escolher a **OnePrimeSeg**.

## 1. Copiar os arquivos

Copie o conteúdo desta pasta para:

`C:\Users\wjtan\oneprime-social-ai`

Escolha **Substituir os arquivos no destino**. Não apague a pasta `.git` nem seus `.env` locais.

## 2. Enviar ao GitHub

Abra o PowerShell na pasta do projeto e execute:

```powershell
git add backend/Dockerfile backend/.dockerignore backend/railway.json backend/package.json backend/src/routes/metaAuthRoutes.js FAÇA-AGORA.md
git commit -m "Corrige build Railway e conexão de páginas Meta"
git push origin multiusuarios
```

## 3. Railway

Em `Settings > Source`, mantenha:

- Root Directory: `backend`
- Branch: `multiusuarios`

Em `Settings > Build`, remova o **Custom Build Command** e deixe o campo vazio.
O arquivo `backend/railway.json` fará o Railway usar o Dockerfile.

Depois faça um novo deploy. No log deve aparecer algo relacionado a `Dockerfile` e
não deve mais aparecer o comando automático `npm ci && npx prisma generate` do Railpack.

## 4. Escolher a Página correta

No OnePrime Social AI:

1. Desconecte a Página `Chica_Produtora`.
2. Clique em **Conectar Meta**.
3. Autorize as Páginas.
4. Na lista exibida pelo sistema, escolha **OnePrimeSeg**.
5. Confirme a conexão.

## Variáveis essenciais no Railway

- `META_APP_ID=1027991236303358`
- `META_APP_SECRET` com a chave real do aplicativo
- `META_REDIRECT_URI=https://carefree-patience-production.up.railway.app/api/meta/callback`
- `META_GRAPH_VERSION=v25.0`
- `FRONTEND_URL` com a URL real do frontend
