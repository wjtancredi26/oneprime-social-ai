# OnePrime — publicação direta

## Railway
- Source Repo: `wjtancredi26/oneprime-social-ai`
- Branch: `multiusuarios`
- Root Directory: `backend`
- Builder: o Railway deve ler `backend/railway.json` e usar `backend/Dockerfile`.
- Apague qualquer **Custom Build Command** e **Custom Start Command** da interface.

Variáveis obrigatórias:
- `DATABASE_URL`
- `JWT_SECRET`
- `META_APP_ID=1027991236303358`
- `META_APP_SECRET` (segredo real do app)
- `META_REDIRECT_URI=https://carefree-patience-production.up.railway.app/api/meta/callback`
- `META_GRAPH_VERSION=v25.0`
- `FRONTEND_URL` = URL pública real do frontend na Vercel, por exemplo `https://oneprime-social-ai.vercel.app`
- `META_TOKEN_ENCRYPTION_KEY`
- `OPENAI_API_KEY`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

A variável `FRONTEND_URL` não pode ser a URL do Railway. Se estiver errada, o callback da Meta termina em “Página não encontrada”.

## Git
```powershell
git add .
git commit -m "Versão final Railway e seleção de página Meta"
git push origin multiusuarios
```

## Depois do deploy
1. Abra `/health` no backend.
2. No sistema, desconecte a página atual.
3. Clique em Conectar Meta.
4. Autorize as Páginas.
5. Escolha `OnePrimeSeg` na lista.

O OAuth solicita primeiro as permissões válidas do Facebook. A permissão `instagram_content_publish` foi retirada do login inicial para não bloquear a conexão; ela deve ser habilitada no app Meta antes da publicação no Instagram.
