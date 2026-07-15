# Deploy de producao - OnePrime Social AI

## Railway (backend)
- Root Directory: `backend`
- Build Command: `npm install && npm run prisma:generate`
- Pre-deploy Command: `npx prisma migrate deploy`
- Start Command: `npm start`
- Public target port: `8080` (ou a porta exibida no log)

Variaveis obrigatorias:
`NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`,
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
`META_GRAPH_VERSION`, `META_PAGE_ID`, `META_IG_USER_ID`,
`META_PAGE_ACCESS_TOKEN`, `FRONTEND_URL` e `PUBLIC_BASE_URL`.

OAuth Meta:
`META_APP_ID`, `META_APP_SECRET` e
`META_REDIRECT_URI=https://carefree-patience-production.up.railway.app/api/meta/callback`.

## Vercel (frontend)
- Root Directory: `frontend`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- `VITE_API_URL=https://carefree-patience-production.up.railway.app`

Depois de alterar `VITE_API_URL`, faca redeploy sem cache.
