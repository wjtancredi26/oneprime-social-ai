# Correção da conexão Meta no Railway

## Causa encontrada

O Facebook recebeu `client_id=SEU_APP_ID`. O backend agora bloqueia valores de exemplo e retorna uma mensagem clara antes de abrir uma URL inválida.

A correção em produção exige que o Railway tenha o **ID numérico real** do aplicativo:

```env
META_APP_ID=123456789012345
META_APP_SECRET=valor_real_do_segredo
META_REDIRECT_URI=https://carefree-patience-production.up.railway.app/api/meta/callback
FRONTEND_URL=https://SEU-FRONTEND.vercel.app
META_GRAPH_VERSION=v25.0
```

Não use aspas, espaços ou textos como `SEU_APP_ID`.

## Configuração no painel da Meta

Em **Facebook Login > Configurações**, cadastre exatamente:

```text
https://carefree-patience-production.up.railway.app/api/meta/callback
```

A URL precisa ser idêntica ao valor de `META_REDIRECT_URI` no Railway.

## Publicação da correção

1. Substitua o projeto no repositório GitHub pela versão corrigida.
2. Faça commit e push.
3. Aguarde o novo deploy no Railway.
4. Confira os logs do deploy.
5. Entre no OnePrime, selecione uma empresa e clique em **Conectar Meta**.

## Segurança

O arquivo `.env` foi removido do pacote corrigido. Nunca envie ou faça commit desse arquivo. As chaves devem permanecer apenas no Railway/Vercel.
