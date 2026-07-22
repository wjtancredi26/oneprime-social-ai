# OnePrime Social AI — atualização do fluxo automático

## Alterações principais

- Cloudinary configurado no momento do uso, com validação clara das variáveis.
- Imagens geradas pela OpenAI sempre são persistidas no Cloudinary, inclusive quando a API retorna URL temporária.
- Upload manual protegido por autenticação.
- Rotas de geração de texto e imagem protegidas por autenticação.
- Validação de URL pública HTTPS antes de salvar ou publicar.
- Postagens para Instagram não podem ser agendadas sem imagem.
- Chamadas à Meta com timeout, identificação de erros temporários e dados para retentativa.
- Publicação Meta usando formulário URL encoded.
- Espera do container do Instagram ampliada e com tratamento de expiração/erro.
- OAuth Meta tenta trocar o token curto por token de longa duração.
- Administrador precisa selecionar explicitamente a empresa ao conectar a Meta.
- Scheduler reconhece falhas temporárias por status HTTP e sinal de retentativa.
- Encerramento seguro do scheduler e servidor em deploy/restart.
- Carregamento do `.env` corrigido antes da inicialização da aplicação.

## Como substituir

1. Faça backup do backend atual.
2. Preserve o seu arquivo `.env`; ele não foi incluído neste pacote.
3. Substitua os arquivos do backend pelos deste pacote.
4. Na pasta do backend, execute:

```bash
npm install
npx prisma generate
npm run dev
```

## Variáveis obrigatórias

Confira o arquivo `.env.example`. Para o fluxo de publicação são essenciais:

- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `META_APP_ID`
- `META_APP_SECRET`
- `META_REDIRECT_URI`
- `META_TOKEN_ENCRYPTION_KEY`
- `FRONTEND_URL`

## Teste recomendado

1. Entre no sistema.
2. Selecione uma empresa.
3. Conecte Facebook/Instagram.
4. Gere uma imagem.
5. Confirme que a URL começa com `https://res.cloudinary.com/`.
6. Crie um post para 3 a 5 minutos à frente.
7. Aguarde o scheduler mudar o status para `PUBLICADO`.
8. Em caso de falha, consulte `lastError` no post.

## Observação de validação

Todos os arquivos JavaScript foram verificados com `node --check`. A validação Prisma não foi executada neste ambiente porque o binário do Prisma exigiu acesso externo durante o teste.
