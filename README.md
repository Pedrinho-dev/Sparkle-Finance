# Sparkle Finance

Aplicação React/Vite mobile-first, PWA e offline-first. A fonte operacional é o IndexedDB via Dexie; Supabase é opcional e usado apenas pelo serviço de sincronização.

## Mapeamento atual

- `src/App.tsx`: shell da aplicação, navegação, tema, splash e estado de sincronização.
- `src/pages/DashboardPage.tsx`: visão do mês, receita mensal, resumo, extrato e planejamento por orçamento.
- `src/pages/HistoryPage.tsx`: histórico pesquisável de despesas e exportação CSV.
- `src/pages/BackupPage.tsx`: conta opcional, exportação/importação JSON e preferência de tema.
- `src/repositories/financeRepository.ts`: regras de negócio e persistência de receitas, orçamentos e despesas.
- `src/db/db.ts`: banco local IndexedDB/Dexie.
- `src/sync/`: fila offline e sincronização opcional com Supabase.
- `src/components/FloralAccent.tsx` e `src/components/BrandLockup.tsx`: lírios decorativos e assinatura visual Sparkle Finance.

### Como funciona hoje

1. A pessoa abre o app e uma conta local é criada automaticamente.
2. A receita do mês e os gastos são gravados localmente no IndexedDB.
3. O saldo é calculado a partir da receita menos as despesas ativas.
4. O PWA instala o app e mantém os arquivos da interface disponíveis sem internet.
5. Se Supabase estiver configurado e houver internet, uma fila sincroniza os registros entre dispositivos.

Os dados locais ficam no navegador/dispositivo. Para evitar perda de dados, use **Ajustes → Exportar JSON completo**. Para usar a mesma conta em mais de um dispositivo, configure o Supabase.

## Desenvolvimento

```bash
npm install
npm run dev
```

Para sincronização entre dispositivos, copie `.env.example` para `.env.local`, preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, execute `supabase/schema.sql` no SQL Editor e crie as contas em **Backup / conta**. Sem essas variáveis o app continua local e offline.

## Hospedagem gratuita recomendada

Para esta aplicação, a opção mais simples é **Cloudflare Pages**:

- conecte o projeto ao repositório Git;
- use `npm run build` como comando de build;
- use `dist` como diretório publicado;
- mantenha o front-end estático servido por CDN;
- adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` somente se quiser sincronização entre dispositivos.

O offline não depende da hospedagem depois do primeiro carregamento: o service worker do Vite PWA cacheia a interface. A primeira abertura precisa ser online para instalar esse cache. No modo offline, o app continua salvando no dispositivo atual e sincroniza pendências quando a conexão voltar.

### Publicação no Cloudflare Pages

1. Crie um projeto Pages conectado ao GitHub.
2. Informe `npm run build` em **Build command**.
3. Informe `dist` em **Build output directory**.
4. Adicione as variáveis do Supabase em **Environment variables** se for usar sincronização.
5. Publique e abra a URL uma vez com internet para instalar o PWA.

O front-end não depende de funções server-side, então não há necessidade de contratar um servidor para hospedar esta versão.

## Regras importantes

- Valores persistidos são inteiros em centavos.
- Saldo restante e percentuais são sempre derivados dos gastos ativos.
- Exclusões usam `deletedAt`; não há exclusão física no fluxo da aplicação.
- Conflitos remotos usam Last Write Wins pelo `updatedAt` ISO.
