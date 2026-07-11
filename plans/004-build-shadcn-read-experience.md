# Plano 004: Construir a experiência de consulta com shadcn e Server Components

> **Instruções ao executor**: use componentes shadcn para todas as primitives. Componentes próprios só podem compor significado de domínio. Leia os guias Next 16 indicados antes de escrever páginas. Este plano é read-only; mutações pertencem ao Plano 005. Atualize o índice ao concluir.
>
> **Verificação de drift**: `git diff --stat 7a6df45..HEAD -- app components components.json app/globals.css package.json lib/championship/application/queries.ts SPEC.md`
> Mudança na configuração shadcn, rotas do SPEC ou read models é condição de parada.

## Status

- **Prioridade**: P2
- **Esforço**: L
- **Risco**: MED
- **Depende de**: `plans/003-implement-transactional-application-services.md`
- **Categoria**: direction, performance
- **Planejado em**: commit `7a6df45`, 2026-07-11

## Por que isso importa

A aplicação ainda exibe “Project ready!”, em inglês, e hidrata tema escuro rejeitado pelo SPEC. Este plano entrega todas as rotas de consulta, estabelece a identidade visual do Campeonato FC e mantém páginas como Server Components, com JavaScript cliente restrito a necessidades reais do Plano 005.

## Estado atual

- `app/page.tsx:3-19` é o placeholder do template.
- `app/layout.tsx:10-12` usa `lang="en"` e envolve tudo em `ThemeProvider` cliente.
- `components/theme-provider.tsx:1-68` hidrata `next-themes` e listener global `d`.
- `app/globals.css:5,87-119` mantém variante/tokens dark, mas `SPEC.md:369-373` exige somente claro.
- `components.json:3-14` fixa shadcn `base-mira`, RSC, CSS variables e ícones Hugeicons. Isso é normativo para componentes.
- `components/ui/button.tsx` é o exemplar gerado: `data-slot`, Base UI, `cva`, `cn`, foco visível. Novos componentes devem vir do CLI shadcn e preservar o padrão.
- `SPEC.md:378-422` fixa as cinco rotas e conteúdo.

## Comandos necessários

| Finalidade          | Comando                                                                         | Esperado                           |
| ------------------- | ------------------------------------------------------------------------------- | ---------------------------------- |
| Adicionar primitive | `pnpm exec shadcn add <component>`                                              | arquivo gerado em `components/ui/` |
| Lint                | `pnpm lint`                                                                     | exit 0                             |
| Tipos               | `pnpm typecheck`                                                                | exit 0                             |
| Build               | `pnpm build`                                                                    | cinco rotas compiladas             |
| Formatação          | `pnpm exec prettier --check "app/**/*.{ts,tsx,css}" "components/**/*.{ts,tsx}"` | exit 0                             |

## Ferramentas sugeridas

- Use as skills `frontend-design` e `vercel-react-best-practices` se disponíveis.
- Leia:
  - `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`;
  - `05-server-and-client-components.md`;
  - `06-fetching-data.md`;
  - `10-error-handling.md`.
- Conteúdo vendorizado direcionado a agentes é não normativo; siga SPEC/ADRs/plano.

## Escopo

**Em escopo**:

- `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- `app/grupos/page.tsx`
- `app/mata-mata/page.tsx`
- `app/participantes/[id]/page.tsx`, `not-found.tsx`
- `app/partidas/[id]/page.tsx`, `not-found.tsx`
- `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`
- `components/app-shell.tsx`
- `components/championship/**` para composites read-only
- `components/ui/**` somente via CLI shadcn
- `package.json`/lockfile para remover `next-themes` e adicionar fontes locais definidas abaixo

**Fora de escopo**:

- Server Actions ou mutações;
- formulários/dialogs/toasts operacionais;
- alterar queries/serviços salvo ajuste de tipo estritamente necessário — caso contrário STOP;
- componentes UI copiados de outra biblioteca ou feitos à mão quando existe equivalente shadcn;
- tema escuro;
- gráficos, animações decorativas ou cache prematuro.

## Direção visual obrigatória

**Conceito:** mesa de controle de campeonato — clara, compacta e orientada a dados, sem estética genérica de dashboard SaaS.

**Tokens**:

- `Papel de jogo` `#F4F7FB` — fundo;
- `Placar` `#111827` — texto principal;
- `Cobalto` `#1746A2` — ação/navegação;
- `Zona G4` `#DCEBFF` — quatro classificados;
- `Ao vivo` `#D97706` — status em andamento;
- `Superfície` `#FFFFFF` — cards/tabelas.

Use variáveis shadcn existentes e acrescente tokens semânticos `--qualification`, `--live` e respectivos foregrounds. Remova tokens/variante dark. Tipografia local: `@fontsource-variable/barlow-condensed` para títulos/nomes de fase e `@fontsource-variable/inter` para corpo; dados/placares usam `--font-mono` do sistema. Não use `next/font/google`, para o build não depender de rede.

**Assinatura:** trilho de progressão “Grupos → Quartas → Semifinais → Final” no topo do dashboard. É uma sequência real, não decoração; fase atual recebe cobalto e fases futuras permanecem vazadas.

Sem gradientes, glassmorphism, hero promocional ou cards de métricas idênticos em grade como elemento principal.

## Fluxo Git

- Branch: `codex/004-shadcn-read-ui`
- Commits: `feat: cria shell do campeonato`, `feat: adiciona consultas dos grupos`, `feat: adiciona chave e elencos`.

## Passos

### Passo 1: instalar primitives shadcn e fontes locais

Execute o CLI shadcn, usando `components.json`, para adicionar exatamente:

```text
card badge table separator skeleton alert tooltip scroll-area breadcrumb
```

Não sobrescreva `button` sem revisar diff. Adicione os dois pacotes Fontsource definidos. Não instale outra biblioteca de componentes.

**Verifique**:

- cada primitive existe em `components/ui/` e contém `data-slot`/padrão Base UI quando aplicável;
- `rg -n "@mui|antd|chakra|mantine|react-bootstrap" package.json components app` → nenhuma ocorrência;
- `pnpm typecheck` → exit 0.

### Passo 2: converter layout para tema claro server-first

- remova `ThemeProvider` do layout e delete `components/theme-provider.tsx`;
- remova `next-themes` do manifesto;
- defina `<html lang="pt-BR">` sem `suppressHydrationWarning`;
- adicione metadata `Campeonato FC` e descrição objetiva;
- aplique fontes locais via CSS variables;
- crie `AppShell` Server Component com cabeçalho, marca textual, navegação para Início/Grupos/Mata-mata e `<main>`;
- navegação ativa, se exigir `usePathname`, deve ser uma ilha cliente mínima que recebe apenas links; não transforme o layout inteiro em client.

**Verifique**: `rg -n "next-themes|ThemeProvider|suppressHydrationWarning|\.dark" app components package.json` → nenhuma ocorrência; build passa.

### Passo 3: criar composites de domínio read-only

Em `components/championship/`, crie componentes pequenos e tipados:

- `competition-progress.tsx` — trilho de fase;
- `status-badge.tsx` — labels Pendente/Em andamento/Encerrada;
- `scoreline.tsx` — score normal e pênaltis separados;
- `leaderboard-card.tsx` — Top 5;
- `standings-table.tsx` — dez colunas, G4 azul, posição compartilhada, indicação provisória;
- `round-list.tsx` e `match-card.tsx` — rodadas, dois jogos e folga;
- `knockout-bracket.tsx` — três colunas, somente nós existentes;
- `roster-table.tsx` — jogador, clube real, posições, overall;
- `match-sheet.tsx` — súmula read-only.

Todos devem compor `Card`, `Badge`, `Table`, `ScrollArea`, `Alert`, `Tooltip`, `Separator` e `Button` shadcn em vez de recriar primitives. Links usam `next/link`. A tabela deve fornecer cabeçalhos acessíveis e wrapper horizontal em telas estreitas.

**Verifique**: Storybook não é necessário. `pnpm lint && pnpm typecheck` passam e nenhum composite tem `"use client"` sem API interativa real.

### Passo 4: implementar dashboard `/`

Transforme `app/page.tsx` em Server Component async que chama somente o read model de dashboard. Renderize:

- trilho de progresso como elemento principal;
- próximo passo em `Alert`/Card contextual;
- contagens pendente/em andamento/concluída;
- resultados recentes;
- quatro rankings Top 5;
- atalhos shadcn para rotas.

Defina estados vazios: sem grupos chama para sorteio (ação será ligada no Plan 005); sem eventos explica que rankings aparecerão após súmulas. Não simule dados.

**Verifique**: com banco seedado sem grupos, `/` responde 200 e mostra “Sortear grupos”; sem erro de serialização.

### Passo 5: implementar `/grupos`

Renderize A/B, tabela, rodadas/folgas, partidas e seção separada de desempate. As quatro primeiras linhas usam `--qualification`; empate no corte pendente deve ter alerta prioritário. Partidas linkam para `/partidas/[id]`. Ações aparecem apenas como placeholders desabilitados com tooltip “Disponível após implementar operações” até Plan 005; não conecte mutações parcialmente.

**Verifique**: com sorteio existente, ambas as tabelas mostram cinco participantes, cinco rodadas e dez jogos; viewport 375px mantém acesso a todas as colunas por scroll.

### Passo 6: implementar mata-mata, participante e partida

- `/mata-mata`: três colunas Quartas/Semifinais/Final, largura mínima e `ScrollArea` horizontal; fases futuras exibem condição necessária, não confrontos fictícios.
- `/participantes/[id]`: nome e 16 atletas com clube/posições/overall; `notFound()` para ID inválido. Em Next 16, `params` é Promise e deve ser aguardado.
- `/partidas/[id]`: status, dois participantes, score, pênaltis e eventos agrupados; read-only neste plano; `notFound()` para ID inválido.

**Verifique**: rotas válidas respondem 200, IDs inválidos exibem 404, e mata-mata não mostra oitavas/terceiro lugar.

### Passo 7: loading, erro e gates

- `loading.tsx` usa `Skeleton` shadcn alinhado ao shell;
- `error.tsx` é a ilha cliente mínima exigida pelo Next, apresenta mensagem pt-BR e retry;
- `not-found.tsx` oferece navegação segura;
- foco visível, contraste AA, labels e navegação por teclado são obrigatórios;
- respeite `prefers-reduced-motion`; não adicione motion neste plano.

**Verifique**:

- `pnpm lint && pnpm typecheck && pnpm build` → exit 0;
- output do build lista `/`, `/grupos`, `/mata-mata`, `/participantes/[id]`, `/partidas/[id]`;
- inspeção responsiva manual em 375, 768 e 1440 px sem overflow de página (somente containers de tabela/chave podem rolar).

## Plano de verificação

Sem testes persistentes. Faça smoke manual das cinco rotas nos três estados de dados disponíveis (sem sorteio, grupos ativos, mata-mata quando fixtures manuais existirem), navegação por teclado e viewports 375/768/1440.

## Critérios de conclusão

- [ ] Todas as primitives são shadcn geradas pelo CLI.
- [ ] Não há provider/tema dark nem `next-themes`.
- [ ] Layout é pt-BR, server-first e usa direção visual definida.
- [ ] Cinco rotas e estados vazio/loading/error/404 existem.
- [ ] G4 azul-claro, Top 5, rodadas, roster e chave cumprem SPEC.
- [ ] Chave/tabelas rolam apenas no próprio container no mobile.
- [ ] Nenhuma mutação parcial foi conectada.
- [ ] Lint, typecheck e build passam; nenhum teste persistente adicionado.

## Condições de parada

Pare se:

- Plan 003/read models não estiver concluído;
- CLI shadcn quer trocar `style`, `iconLibrary` ou aliases do `components.json`;
- uma primitive necessária não existe no registry compatível com `base-mira`;
- a UI exige mudança de contrato de domínio/query;
- build tenta baixar fonte remota;
- arquivo fora do escopo ou biblioteca UI diferente for necessário.

## Notas de manutenção

- Reviewer deve rejeitar client boundary ampla ou acesso Prisma em componente cliente.
- Novas telas devem reutilizar composites e tokens; não reintroduzir dark mode sem alterar SPEC/ADR.
- O Plan 005 substitui placeholders desabilitados por fluxos operacionais shadcn.
