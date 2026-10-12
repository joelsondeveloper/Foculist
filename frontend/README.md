# Focuslist

Aplicação Next.js com autenticação por e-mail e senha ou Google, MongoDB e
verificação de e-mail pelo SendGrid.

## Desenvolvimento

```bash
npm ci
npm run dev
```

Crie `frontend/.env.local` com as variáveis abaixo. Configure as mesmas variáveis
no projeto da Vercel para cada ambiente publicado e faça uma nova implantação
após alterá-las. Não salve valores reais no Git.

| Variável | Uso |
| --- | --- |
| `MONGODB_URI` | Conexão com o banco MongoDB que contém `users`, `accounts` e as demais coleções. A instância precisa aceitar conexões da implantação. |
| `NEXTAUTH_URL` | Origem pública da aplicação, por exemplo `https://foculist-orcin.vercel.app`. |
| `NEXTAUTH_SECRET` | Segredo estável usado para as sessões. Alterá-lo invalida sessões existentes. |
| `GOOGLE_CLIENT_ID` | ID do cliente OAuth Web do Google. |
| `GOOGLE_CLIENT_SECRET` | Segredo do mesmo cliente OAuth. |
| `SENDGRID_API_KEY` | Chave ativa para enviar a ativação das contas por senha. |
| `SENDGRID_FROM_EMAIL` | Remetente verificado no SendGrid. Se omitido, o remetente legado `vicentejoelson80@gmail.com` é usado. |

No Google Cloud, inclua `https://foculist-orcin.vercel.app/api/auth/callback/google`
em **Authorized redirect URIs** e a origem `https://foculist-orcin.vercel.app`
em **Authorized JavaScript origins**. Para desenvolvimento local, inclua também
`http://localhost:3000/api/auth/callback/google` e `http://localhost:3000`.

O cadastro por senha exige que o e-mail de ativação seja entregue. Se a entrega
falhar, o cadastro informa o erro; a pessoa pode enviar o formulário novamente
com o mesmo e-mail e senha para receber outro link. Usuários já verificados
recebem a mensagem de conta existente.

## Conferir uma implantação

1. Verifique se `/api/auth/providers` mostra `google` e `credentials` com a URL
   pública correta.
2. Envie `{}` a `/api/auth/register`: deve retornar `400` e uma mensagem de
   campos obrigatórios. Um `500` nessa etapa aponta para erro de inicialização
   ou conexão; consulte os logs da função na Vercel e a conexão do MongoDB.
3. Cadastre um e-mail de teste, abra o link recebido e entre com a senha.
4. Entre com uma conta Google de teste nova e com uma que já tenha cadastro por
   senha com o mesmo e-mail. Ambas devem chegar à página de tarefas.
