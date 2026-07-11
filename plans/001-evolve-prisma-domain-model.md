# Plano 001: Evoluir o Prisma para o domínio completo e tornar o seed idempotente

> **Instruções ao executor**: siga o plano em ordem e execute todas as verificações. Se uma condição de parada ocorrer, pare e reporte; não improvise nem apague dados. Ao concluir, atualize a linha deste plano em `plans/README.md`, salvo se um revisor disser que manterá o índice.
>
> **Verificação de drift (execute primeiro)**: `git diff --stat 7a6df45..HEAD -- prisma/schema.prisma prisma/migrations prisma/seed.ts prisma.config.ts package.json README.md`
> Se algum arquivo em escopo mudou, compare o estado atual abaixo com o código vivo. Diferença material é condição de parada.

## Status

- **Prioridade**: P1
- **Esforço**: L
- **Risco**: HIGH
- **Depende de**: nenhum
- **Categoria**: migration, correctness
- **Planejado em**: commit `7a6df45`, 2026-07-11

## Por que isso importa

O banco atual não consegue persistir grupos, rodadas, desempates do G4, pênaltis ou progressão. Além disso, uma segunda execução do seed cria outros dez participantes e 160 jogadores. Este plano entrega a fundação persistente normativa e bloqueia explicitamente migrações ambíguas, preservando participantes e jogadores existentes.

## Estado atual

- `prisma/schema.prisma:11-29`: `Participant.name` e `(participantId, Player.name)` não são únicos.
- `prisma/schema.prisma:31-41`: `Match` ainda possui `startTime`/`endTime`, sem grupo, rodada, desempate ou `completedAt`.
- `prisma/schema.prisma:43-52`: `MatchParticipant` não impede participante ou papel duplicado e não possui `penaltyScore`.
- `prisma/schema.prisma:64-92`: existem `ROUND_OF_16`, `GROUP` e `SCHEDULED`, divergindo dos enums aprovados.
- `prisma/seed.ts:1053-1056`:

```ts
for (const data of participantData) {
  await prisma.participant.create({ data })
}
```

- `SPEC.md:124-170` define entidades, enums, campos e invariantes-alvo.
- `SPEC.md:503-511` exige nova migration, preservação de participantes/jogadores e seed idempotente.
- `docs/adr/0001-single-edition-trusted-application.md:12-17` proíbe criar entidade `Championship` e mantém elencos fixos.
- `docs/adr/0004-authoritative-score-independent-events.md:12-18` exige placar normal e pênaltis separados, eventos independentes e sem minuto.

## Comandos necessários

| Finalidade                   | Comando                                      | Resultado esperado                                  |
| ---------------------------- | -------------------------------------------- | --------------------------------------------------- |
| Gerar client                 | `pnpm db:generate`                           | exit 0                                              |
| Validar schema               | `pnpm exec prisma validate`                  | schema válido                                       |
| Criar migration              | `pnpm db:migrate --name championship_domain` | nova migration aplicada em banco de desenvolvimento |
| Aplicar migrations revisadas | `pnpm exec prisma migrate deploy`            | exit 0                                              |
| Seed                         | `pnpm db:seed`                               | exit 0                                              |
| Tipos                        | `pnpm typecheck`                             | exit 0                                              |
| Lint                         | `pnpm lint`                                  | exit 0                                              |
| Build                        | `pnpm build`                                 | exit 0                                              |

## Ferramentas sugeridas

- Use a skill `prisma-database-setup` se disponível para conferir padrões Prisma 7/PostgreSQL.
- Leia a documentação Prisma instalada/atual antes de usar recursos cuja sintaxe possa ter mudado.

## Escopo

**Em escopo**:

- `prisma/schema.prisma`
- uma nova pasta em `prisma/migrations/` criada por este plano
- `prisma/seed.ts`
- `package.json` e `pnpm-lock.yaml` somente para adicionar `db:migrate:deploy` se ainda ausente
- `README.md` somente para distinguir migration de desenvolvimento/deploy e seed idempotente

**Fora de escopo**:

- editar migrations já existentes;
- criar `Championship`, autenticação, agenda, auditoria ou suspensões;
- algoritmos de sorteio/classificação;
- Server Actions, páginas ou componentes;
- suíte de testes unitários ou de integração, rejeitada pelo mantenedor neste estágio;
- deduplicar ou apagar automaticamente dados ambíguos de ambientes existentes.

## Fluxo Git

- Branch: `codex/001-prisma-domain-model`
- Commits sugeridos: `feat: evolui modelo do campeonato` e `fix: torna seed idempotente`.
- Não faça push nem abra PR sem instrução.

## Passos

### Passo 1: executar preflight de dados

Antes de alterar o schema, consulte o banco de desenvolvimento e registre apenas contagens, nunca credenciais:

- total de participantes e jogadores;
- nomes de participantes duplicados;
- pares `(participantId, player.name)` duplicados;
- total de partidas, participantes de partidas e eventos.

Se houver nomes duplicados ou qualquer partida/evento existente, pare e reporte as contagens. A especificação só autoriza preservar participantes/jogadores e não define conversão segura de dados competitivos antigos.

**Verifique**: consultas retornam zero duplicatas, exatamente 10 participantes/160 jogadores (ou banco vazio antes do seed) e zero partidas/eventos. Qualquer outro resultado ativa STOP.

### Passo 2: modelar grupos e desempates

Em `prisma/schema.prisma`, implemente:

- `GroupCode { A B }`;
- `Group` com `id`, `code @unique`, `createdAt`, `updatedAt`, memberships, partidas e desempates;
- `GroupParticipant` com `id`, `groupId`, `participantId`, `isSeeded`, relações, `participantId @unique` e `@@unique([groupId, participantId])`;
- `GroupTiebreak` com `id`, `groupId`, `attempt`, `slotsAtStake`, `status`, timestamps, participantes e partidas, `@@unique([groupId, attempt])`;
- `GroupTiebreakParticipant` com associação única `@@unique([groupTiebreakId, participantId])`;
- `TiebreakStatus { PENDING ONGOING COMPLETED }`.

Adicione relações reversas a `Participant`. Use `onDelete: Cascade` somente para filhos pertencentes ao agregado (`GroupParticipant`, participantes do desempate, partidas/eventos); mantenha referências de `Participant`/`Player` protegidas contra remoção acidental.

A migration SQL deve criar um índice único parcial que permita no máximo um `GroupParticipant.isSeeded = true` por grupo. Exatamente cinco membros e pelo menos um cabeça são invariantes da transação de sorteio, não de uma linha isolada.

**Verifique**: `pnpm exec prisma validate` → schema válido.

### Passo 3: evoluir partidas e enums

Substitua os enums por:

```text
MatchType = REGULAR_GROUP | GROUP_TIEBREAK | KNOCKOUT
MatchStatus = PENDING | ONGOING | COMPLETED
MatchKnockoutStage = QUARTER_FINALS | SEMI_FINALS | FINAL
```

Em `Match`:

- remova `startTime` e `endTime`;
- adicione `groupId?`, `groupTiebreakId?`, `round?`, `completedAt?`, `createdAt`, `updatedAt`;
- mantenha `knockoutStage?`;
- adicione índices para consultas por `(type, status)`, `(groupId, round)` e `(knockoutStage, status)`.

Em `MatchParticipant`:

- adicione `penaltyScore Int?`;
- adicione `@@unique([matchId, participantId])` e `@@unique([matchId, role])`;
- indexe `participantId`.

Em `MatchEvent`, indexe `(matchId, eventType)` e `playerId`.

Inclua checks PostgreSQL na migration para `score >= 0`, `penaltyScore >= 0`, rodada regular entre 1 e 5 e coerência estrutural mínima entre tipo e campos associados. Não tente expressar no banco “exatamente dois participantes” ou “jogador pertence ao elenco da partida”; Plan 003 validará essas invariantes transacionalmente.

**Verifique**: `pnpm exec prisma validate && pnpm db:generate && pnpm typecheck` → todos exit 0.

### Passo 4: criar migration preservando dados canônicos

Gere uma nova migration; não edite as quatro migrations anteriores. Revise o SQL gerado manualmente e ajuste a nova migration para:

1. abortar com mensagem clara se `Match`, `MatchParticipant` ou `MatchEvent` não estiverem vazias;
2. abortar se existirem duplicatas incompatíveis com as novas unicidades;
3. preservar IDs e todas as colunas de `Participant`/`Player`;
4. converter/recriar enums de partida somente depois do preflight;
5. criar tabelas, FKs, checks e índices na ordem segura;
6. remover campos obsoletos apenas depois das validações.

Não “conserte” a migration histórica `add_team`: num banco novo ela roda antes do seed; num banco já migrado ela não roda novamente. Se um ambiente real estiver parado antes dela com jogadores existentes, pare e peça um procedimento específico.

**Verifique**: em banco vazio descartável, `pnpm exec prisma migrate reset --force --skip-seed` → todas as migrations aplicadas. Em seguida `pnpm exec prisma migrate status` → database schema up to date.

### Passo 5: tornar o seed idempotente

Preserve `participantData` e os 160 registros. Troque criação cega por upserts baseados em:

- `Participant.name`;
- chave composta `(participantId, Player.name)`.

Para cada participante, faça upsert e depois upsert dos 16 jogadores, atualizando `team`, `positions` e `overall`. Não apague jogadores ausentes e não toque em grupos, partidas, desempates ou eventos. Envolva o bootstrap de cada participante em transação; erro deve interromper o seed com exit não zero.

**Verifique**:

1. `pnpm db:seed` → exit 0;
2. execute novamente `pnpm db:seed` → exit 0;
3. consulte o banco → exatamente 10 participantes, 160 jogadores e 16 por participante;
4. consulte grupos/partidas/eventos → contagens inalteradas entre as duas execuções.

### Passo 6: documentar e executar gates

Adicione `db:migrate:deploy` sem alterar `db:migrate`. Atualize o README para explicar desenvolvimento, deploy e idempotência do seed sem afirmar que funcionalidades de aplicação já existem.

**Verifique**: `pnpm exec prisma validate && pnpm db:generate && pnpm lint && pnpm typecheck && pnpm build` → todos exit 0; `git status --short` mostra somente arquivos em escopo e `plans/README.md`.

## Plano de verificação

Não criar testes persistentes. Verificar com banco descartável e comandos acima:

- migrations desde zero;
- duas execuções do seed;
- cardinalidades 10/160/16;
- preflight rejeitando duplicidade/dados competitivos ambíguos;
- checks de score/rodada por tentativa SQL controlada dentro de transação revertida.

## Critérios de conclusão

- [ ] Schema representa grupos, memberships, desempates, pênaltis, rodadas e fases aprovadas.
- [ ] Campos de agenda e oitavas não existem.
- [ ] Unicidades, FKs, índices e checks descritos existem.
- [ ] Nova migration aplica desde zero sem editar histórico.
- [ ] Participantes/jogadores existentes preservam IDs.
- [ ] Duas execuções do seed resultam em 10/160, sem tocar dados competitivos.
- [ ] Prisma validate/generate, lint, typecheck e build passam.
- [ ] Nenhum teste unitário/integrado foi adicionado.
- [ ] Plano 001 marcado `DONE` no índice.

## Condições de parada

Pare se:

- houver duplicatas ou partidas/eventos existentes no preflight;
- a migration gerada propuser perda de participantes/jogadores;
- for necessário editar migration histórica;
- a versão Prisma instalada não suportar a sintaxe planejada;
- for preciso tocar arquivo fora do escopo;
- qualquer gate falhar duas vezes após correção razoável.

## Notas de manutenção

- Todas as invariantes relacionais não expressáveis no banco pertencem aos serviços do Plan 003.
- Se múltiplas edições forem adicionadas no futuro, as unicidades de grupo precisarão incorporar campeonato; isso está deliberadamente fora da v1.
- Revise com atenção cascades: reset esportivo pode apagar filhos, mas nunca participantes/jogadores.
