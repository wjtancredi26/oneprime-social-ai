# Guia de desenvolvimento

## Pré-requisitos

- Node.js 20+
- Docker Desktop
- npm

## Inicialização

1. Copie o arquivo .env.example para .env
2. Instale as dependências com `npm install --workspaces`
3. Inicie os containers com `docker compose up --build`

## Serviços

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- PostgreSQL: localhost:5432
