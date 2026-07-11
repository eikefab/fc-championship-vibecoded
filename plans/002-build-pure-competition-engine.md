# Plano 002: Construir o motor esportivo puro e determinístico

> **Instruções ao executor**: siga cada passo e execute as verificações. Não acesse Prisma, React ou Next dentro do domínio. Pare nas condições indicadas, sem preencher lacunas com regras esportivas não documentadas. Atualize `plans/README.md` ao concluir.
>
> **Verificação de drift**: `git diff --stat 7a6df45..HEAD -- SPEC.md docs/adr docs/GLOSSARY.md lib/championship/domain`
> Mudanças normativas em classificação, desempate ou sorteio exigem STOP e revisão deste plano.

## Status

- **Prioridade**: P1
- **Esforço**: L
- **Risco**: MED
- **Depende de**: `plans/001-evolve-prisma-domain-model.md`
- **Categoria**: tech-debt, correctness
- **Planejado em**: commit `7a6df45`, 2026-07-11

## Por que isso importa

Classificação, mini-tabela, G4, geração circular e vencedores são o núcleo do produto. Se essas regras forem implementadas diretamente em páginas ou mutações, telas diferentes poderão tomar decisões esportivas diferentes. O motor deve receber DTOs simples, não acessar I/O e produzir sempre a mesma saída para a mesma entrada.

## Estado atual

- `lib/` contém apenas `prisma.ts` e `utils.ts`; não existe domínio.
- `SPEC.md:178-191` exige dois grupos de cinco, cinco rodadas e cada par uma vez.
- `SPEC.md:282-345` fixa pontuação, confronto direto completo, critérios globais, posições compartilhadas e desempate somente no corte.
- `SPEC.md:347-365` fixa quatro rankings Top 5 e desempate alfabético pt-BR.
- `docs/adr/0003-derived-live-standings.md:12-18` exige classificação derivada, com `ONGOING` provisório e sem totais persistidos.
- `docs/adr/0005-g4-tiebreak-and-phase-draws.md:12-19` fixa desempate e mata-mata fase a fase.

## Comandos necessários

| Finalidade       | Comando                       | Resultado esperado          |
| ---------------- | ----------------------------- | --------------------------- |
| Tipos            | `pnpm typecheck`              | exit 0                      |
| Lint             | `pnpm lint`                   | exit 0                      |
| Build            | `pnpm build`                  | exit 0                      |
| Smoke de domínio | `pnpm exec tsx -e '<script>'` | exit 0 sem lançar assertion |

## Escopo

**Em escopo**:

- `lib/championship/domain/types.ts`
- `lib/championship/domain/errors.ts`
- `lib/championship/domain/random.ts`
- `lib/championship/domain/round-robin.ts`
- `lib/championship/domain/standings.ts`
- `lib/championship/domain/tiebreak.ts`
- `lib/championship/domain/leaderboards.ts`
- `lib/championship/domain/knockout.ts`
- `lib/championship/domain/index.ts`

**Fora de escopo**:

- Prisma e banco;
- transações, Server Actions e cache;
- páginas/componentes;
- testes unitários ou de integração persistentes;
- saldo de gols, prorrogação, terceiro lugar, agenda ou novos critérios;
- otimização/cache: há no máximo dez participantes e 20 jogos regulares.

## Convenções

- Funções e tipos em inglês; mensagens para UI em português ficam na camada de aplicação.
- IDs são `string`; não importar tipos gerados do Prisma.
- Arrays recebidos não podem ser mutados; use cópias.
- Exporte resultados como discriminated unions ou lance apenas `DomainInvariantError` para entrada programaticamente impossível. Regras esperadas de negócio serão mapeadas pelo Plan 003.
- Ordenação alfabética usa `Intl.Collator("pt-BR", { sensitivity: "base" })` criado uma vez no módulo.

## Fluxo Git

- Branch: `codex/002-competition-engine`
- Commit: `feat: implementa motor esportivo`.
- Não faça push/PR sem instrução.

## Passos

### Passo 1: definir DTOs e erros puros

Em `types.ts`, defina DTOs mínimos para:

- participante e jogador;
- lado de partida com `participantId`, `role`, `score`, `penaltyScore`;
- partida com `id`, `type`, `status`, `groupCode`, `round`, `knockoutStage`, lados e eventos;
- linha de classificação com posição esportiva, estatísticas, flags `provisional`, `qualified` e `requiresTiebreak`;
- evento individual;
- entrada/saída de série de desempate;
- nó/vencedor de mata-mata;
- ranking individual.

Represente estados nulos explicitamente e use unions literais alinhadas aos enums do SPEC. Não replique entidades completas do Prisma.

Em `errors.ts`, crie `DomainInvariantError` com `code` discriminável para entrada estrutural inválida.

**Verifique**: `pnpm typecheck` → exit 0.

### Passo 2: implementar embaralhamento injetável e round-robin

Em `random.ts`:

- defina `RandomSource` com `nextInt(maxExclusive)`;
- implemente Fisher–Yates que recebe o source e retorna nova lista;
- forneça factory de produção usando `node:crypto.randomInt` sem estado global mutável.

Em `round-robin.ts`:

- receba exatamente cinco IDs distintos;
- use o método circular com um slot de folga;
- retorne cinco rodadas, duas partidas e um `byeParticipantId` por rodada;
- cada par aparece exatamente uma vez;
- distribua `HOME/AWAY` de forma estável a partir da ordem já embaralhada, sem alegar vantagem.

Falhe com código explícito para cardinalidade ou duplicidade incorreta.

**Verifique**: use `pnpm exec tsx -e` para gerar tabela com IDs A–E e assertions Node que confirmem 5 rodadas, 10 partidas, 5 folgas distintas e 10 pares únicos. Comando termina em exit 0.

### Passo 3: implementar classificação e confronto direto

Em `standings.ts`:

1. inicialize os cinco participantes com zeros;
2. ignore `PENDING`;
3. inclua `ONGOING` como provisório e `COMPLETED` como consolidado;
4. derive vitória/empate/derrota, pontos e gols exclusivamente do placar;
5. derive amarelos/vermelhos dos eventos de partidas `REGULAR_GROUP` para o dono do jogador;
6. ordene primeiro por pontos;
7. para cada bloco empatado, construa uma única mini-tabela com jogos entre todos do bloco e compare pontos, vitórias, gols marcados e menos gols sofridos;
8. para os ainda iguais, compare vitórias, gols marcados e menos gols sofridos globais;
9. se a igualdade absoluta não cruzar 4º/5º, atribua a mesma posição esportiva e ordene nomes alfabeticamente só para apresentação;
10. se cruzar o corte, marque todos os envolvidos e calcule `slotsAtStake`.

Nunca calcule ou compare saldo de gols. Partidas `GROUP_TIEBREAK` não entram nos totais.

**Verifique**: execute smokes inline para: vitória 3/0; empate 1/1; `ONGOING` provisório 0–0; confronto direto de dois; mini-tabela de três; critério de menos gols sofridos; empate compartilhado fora do corte; empate absoluto cruzando o G4. Cada script usa `node:assert/strict` e termina exit 0.

### Passo 4: implementar planejamento de desempate

Em `tiebreak.ts`, receba a saída da classificação e devolva:

- `none` quando não há igualdade no corte;
- partida decisiva para exatamente dois envolvidos;
- turno único gerado pelo mesmo algoritmo circular generalizado para três ou mais, com `slotsAtStake` e `attempt`;
- próxima tentativa somente com o subconjunto ainda empatado depois de uma série concluída;
- partida decisiva quando restarem dois.

O módulo planeja confrontos e resolve posições; não persiste nada. Resultados do desempate não podem alterar a linha estatística regular.

**Verifique**: smokes inline para 2 envolvidos/1 vaga, 3 envolvidos/1 vaga, 3 envolvidos/2 vagas e repetição por empate persistente → shapes e `slotsAtStake` esperados.

### Passo 5: implementar rankings

Em `leaderboards.ts`:

- conte eventos de partidas `ONGOING`/`COMPLETED` de todos os tipos;
- ignore `PENDING`;
- gere quatro listas separadas por tipo;
- omita zero, ordene contagem desc/nome pt-BR asc e limite a cinco;
- inclua nome/ID do participante para desambiguação;
- não derive gols de placar nem pênaltis.

**Verifique**: smoke com seis jogadores, empates de contagem, nomes acentuados, partida pendente e eventos de desempate → Top 5 e ordem esperados.

### Passo 6: implementar utilidades de mata-mata

Em `knockout.ts`:

- `getDecisiveWinner` exige placar concluído; empate normal exige pênaltis diferentes;
- `pairKnockoutEntrants` embaralha com `RandomSource` e cria pares livres;
- quartas exigem 8 IDs únicos e retornam 4 pares;
- semifinais exigem 4 IDs únicos e retornam 2 pares;
- final recebe 2 vencedores e retorna um par sem embaralhamento;
- não filtre mesmo grupo e não crie oitavas/terceiro lugar.

**Verifique**: smokes inline para vitória normal, empate sem pênalti rejeitado, vitória nos pênaltis, 8→4, 4→2 e 2→1.

### Passo 7: consolidar exports e gates

Exporte somente a API pública de domínio em `index.ts`. Verifique que nenhum arquivo importa `@/lib/prisma`, `next/*`, React ou client Prisma.

**Verifique**:

- `rg -n "@/lib/prisma|from ['\"]next|from ['\"]react|generated/prisma" lib/championship/domain` → nenhuma ocorrência;
- `pnpm lint && pnpm typecheck && pnpm build` → exit 0;
- `git status --short` → apenas arquivos em escopo e atualização do índice.

## Plano de verificação

Não adicionar suíte persistente. Os smokes com `tsx -e` devem cobrir todos os casos nomeados em cada passo e ser registrados na descrição do PR/entrega para revisão. Lint, tipos e build são obrigatórios.

## Critérios de conclusão

- [ ] Round-robin gera 5 rodadas/10 pares/5 folgas.
- [ ] Classificação implementa exatamente a ordem normativa, sem saldo.
- [ ] `ONGOING` entra provisoriamente e `PENDING` é ignorado.
- [ ] Empates compartilhados e corte do G4 são distinguidos.
- [ ] Desempate planeja dois ou múltiplos envolvidos sem contaminar a tabela.
- [ ] Rankings Top 5 seguem evento/status/ordem pt-BR.
- [ ] Vencedores e pareamentos do mata-mata seguem as regras.
- [ ] Domínio não importa I/O/framework/Prisma.
- [ ] Nenhum arquivo de teste foi criado.
- [ ] Lint, typecheck e build passam.

## Condições de parada

Pare se:

- SPEC/ADR mudou nas regras citadas;
- um algoritmo exigir informação não definida pelos DTOs normativos;
- for necessário persistir totais derivados;
- for necessário importar Prisma/Next/React;
- qualquer gate falhar duas vezes;
- a implementação exigir arquivo fora do escopo.

## Notas de manutenção

- Mantenha a aleatoriedade injetável: ela viabiliza reprodução de problemas sem persistir seed de sorteio.
- Se a escala crescer além deste torneio fixo, só então medir e considerar cache/índices adicionais.
- Toda nova regra esportiva deve entrar primeiro neste motor e na documentação normativa, nunca apenas numa tela.
