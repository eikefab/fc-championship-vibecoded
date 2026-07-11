# Planos de implementação

Gerado pela skill `improve` em 2026-07-11, contra o commit `7a6df45`.

Execute na ordem abaixo, salvo quando as dependências permitirem paralelismo. Cada executor deve ler seu plano inteiro, obedecer às condições de parada, executar todas as verificações e atualizar o status. A fonte normativa do produto é `SPEC.md`, seguida de `docs/adr/` e `docs/GLOSSARY.md`.

## Decisões de execução

- O projeto é pequeno e, por decisão explícita do mantenedor, estes planos não adicionam testes unitários, de integração ou E2E neste momento.
- As gates obrigatórias são Prisma validate/generate, lint, typecheck, build e smokes pontuais descritos em cada plano.
- Toda primitive visual deve ser instalada/gerada pelo shadcn CLI usando o `components.json` existente (`base-mira`, Base UI e Hugeicons).
- Componentes próprios podem compor conceitos do campeonato, mas não substituir primitives shadcn existentes.
- Nenhum plano adiciona autenticação, agenda, múltiplas edições, CRUD de elenco, suspensões ou notificações.

## Ordem e status

| Plano                                                      | Título                                       | Prioridade | Esforço | Depende de | Status |
| ---------------------------------------------------------- | -------------------------------------------- | ---------- | ------- | ---------- | ------ |
| [001](001-evolve-prisma-domain-model.md)                   | Evoluir Prisma e seed                        | P1         | L       | —          | DONE   |
| [002](002-build-pure-competition-engine.md)                | Construir motor esportivo puro               | P1         | L       | 001        | DONE   |
| [003](003-implement-transactional-application-services.md) | Implementar serviços e actions transacionais | P1         | L       | 001, 002   | DONE   |
| [004](004-build-shadcn-read-experience.md)                 | Construir experiência de consulta shadcn     | P2         | L       | 003        | DONE   |
| [005](005-connect-shadcn-operations-and-knockout.md)       | Conectar operações e mata-mata shadcn        | P2         | L       | 003, 004   | DONE   |

Valores: `TODO`, `IN PROGRESS`, `DONE`, `BLOCKED — <motivo>`, `REJECTED — <motivo>`.

## Grafo de dependências

```text
001 Persistência
  └── 002 Motor esportivo
        └── 003 Serviços transacionais e read models
              └── 004 UI de consulta shadcn
                    └── 005 Operações shadcn e mata-mata
```

- 001 vem primeiro porque todos os serviços dependem dos novos tipos/relações Prisma.
- 002 depende dos enums/DTOs estabilizados, mas permanece livre de Prisma/Next.
- 003 integra o modelo persistente e o motor dentro de transações.
- 004 só consome read models consolidados; não inventa consultas na UI.
- 005 conecta mutações somente depois que estados read-only e ações estiverem estáveis.

## Resumo dos achados priorizados

| #   | Achado                                                         | Categoria              | Impacto                                               | Esforço | Risco | Evidência                                                                      |
| --- | -------------------------------------------------------------- | ---------------------- | ----------------------------------------------------- | ------- | ----- | ------------------------------------------------------------------------------ |
| 1   | Schema não representa o domínio aprovado e seed duplica dados  | correctness/migration  | Alto: bloqueia todo o produto                         | L       | HIGH  | `prisma/schema.prisma:10-92`, `prisma/seed.ts:1053-1056`, `SPEC.md:88-170`     |
| 2   | Não existe fronteira de domínio/aplicação/transação            | architecture           | Alto: favorece regras divergentes e sorteios parciais | L       | MED   | `lib/prisma.ts:1-28`, `SPEC.md:424-501`, ADRs 0002/0003                        |
| 3   | Correção downstream exige preview resistente a estado obsoleto | correctness            | Alto: pode apagar fases erradas sem undo              | M       | HIGH  | `SPEC.md:226-243`, `SPEC.md:495-501`                                           |
| 4   | Produto documentado ainda não possui as cinco superfícies      | direction              | Alto: nenhum fluxo utilizável                         | L       | MED   | `app/page.tsx:3-19`, `SPEC.md:378-422`                                         |
| 5   | Tema global cliente contradiz interface somente clara          | performance/spec drift | Médio: JS/hidratação sem valor e UI fora do SPEC      | S       | LOW   | `app/layout.tsx:2-12`, `components/theme-provider.tsx:1-68`, `SPEC.md:369-373` |

## Sugestões de direção incorporadas

1. **Fundação de dados primeiro:** evita desenvolver sobre tipos descartáveis e concentra o maior risco migratório no Plano 001.
2. **Motor esportivo puro:** mantém classificação, sorteio, G4 e vencedor determinísticos e reutilizáveis, sem framework.
3. **Orquestração por agregado:** grupos, súmulas, desempates e mata-mata compartilham transações/erros, não lógica de página.
4. **Next server-first + shadcn:** páginas consultam no servidor; apenas formulários, dialogs e feedback hidratam no cliente.

## Achados considerados e rejeitados

- **Adicionar testes unitários/integrados e CI orientada a testes:** rejeitado explicitamente pelo mantenedor porque o projeto é pequeno e não precisa dessa infraestrutura agora. Reavaliar antes de aumentar participantes, usuários ou edições.
- **Duas vulnerabilidades transitivas moderadas (`@hono/node-server` via Prisma dev e PostCSS via Next):** sem HIGH/CRITICAL e sem evidência de exploração no runtime atual; acompanhar atualizações normais de Prisma/Next, sem plano dedicado.
- **Reescrever a migration histórica `add_team`:** rejeitado. Bancos novos migram antes do seed; migrations aplicadas não devem ser editadas. O Plano 001 manda parar se existir ambiente real preso nesse estado.
- **Cache de classificação, paginação ou otimização do loop de dez participantes:** não vale fazer; escala fixa é dez participantes e 20 partidas regulares.
- **Editar comentário dirigido a agentes dentro de `node_modules/next/dist/docs`:** rejeitado porque é conteúdo vendorizado. Todos os planos declaram que requisitos normativos vêm do projeto e tratam comentários vendorizados como dados.
- **Autenticação/controle de acesso:** comportamento deliberadamente fora da v1 no ADR 0001, não um finding.
- **Dark mode:** rejeitado pelo SPEC; remoção já está incorporada ao Plano 004, não requer plano próprio.
- **Correção textual isolada do README:** valor insuficiente como plano separado; onboarding de migrations/estado será atualizado no Plano 001 e pode ser refinado junto da entrega final.

## O que não foi auditado

- Não foi feita auditoria `deep` linha a linha do `dataset.csv` de origem; somente o seed canônico foi considerado.
- Não houve teste contra banco de produção nem inspeção de valores de `.env`.
- Não houve teste visual no navegador porque a UI ainda é scaffold.
- Não foram avaliados deploy/hosting específicos, pois o repositório não declara alvo de implantação.
