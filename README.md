# Vitrix AI

Ferramenta web para prospecção de negócios locais usando a Google Places API. Busque por nicho e cidade, filtre por avaliação, número de reviews e presença de site, e exporte os resultados para Excel.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Route Handler (`/api/search`) que chama a Google Places API (New) no servidor, com streaming de progresso (NDJSON)
- `xlsx` para exportação em Excel

## Configuração

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um projeto no [Google Cloud Console](https://console.cloud.google.com/), habilite a **Places API (New)** e gere uma chave de API.

3. Copie `.env.local.example` para `.env.local` e cole sua chave:

   ```bash
   cp .env.local.example .env.local
   ```

   ```
   GOOGLE_PLACES_API_KEY=sua-chave-aqui
   ```

   A chave nunca é exposta ao frontend — todas as chamadas à Places API acontecem no Route Handler `src/app/api/search/route.ts`, executado no servidor.

4. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Abra [http://localhost:3000](http://localhost:3000).

## Como funciona

- O formulário (`SearchForm`) envia nicho, cidade/estado, faixa de avaliação (slider duplo), número mínimo de avaliações e filtro de site.
- A rota `/api/search` monta a query (`"<nicho> em <cidade>, <estado>"`), busca até 3 páginas (60 resultados) na Places API `searchText`, aplica os filtros e transmite eventos de progresso via streaming NDJSON enquanto busca.
- O frontend lê o stream e atualiza a barra de progresso em tempo real; ao final, exibe os cards de resumo e a tabela interativa (busca, ordenação por coluna, badge "SEM SITE").
- O botão "Exportar Excel" gera um `.xlsx` a partir dos resultados atualmente filtrados/ordenados na tabela.

## Deploy na Vercel

1. Suba o projeto para um repositório Git.
2. Importe o repositório na [Vercel](https://vercel.com/new).
3. Configure a variável de ambiente `GOOGLE_PLACES_API_KEY` nas configurações do projeto (Settings → Environment Variables).
4. Deploy.

## Limites e custos

- Cada busca consome chamadas da Places API `searchText` (até 3 páginas por busca). Consulte os [preços da Google Places API](https://mapsplatform.google.com/pricing/) e configure limites de faturamento no Google Cloud.
