# Plano 003: Implementar serviços transacionais, consultas e Server Actions

> **Instruções ao executor**: mantenha Server Actions finas e toda regra/transação nos serviços de aplicação. Execute cada gate. Correção ou reset nunca pode apagar dados sem preview e confirmação compatíveis. Atualize o índice ao concluir.
>
> **Verificação de drift**: `git diff --stat 7a6df45..HEAD -- lib/prisma.ts lib/championship app/actions prisma/schema.prisma SPEC.md docs/adr`
> Se o schema do Plan 001 ou a API do domínio do Plan 002 não corresponderem a este plano, pare e reporte.

## Status

- **Prioridade**: P1
- **Esforço**: L
- **Risco**: HIGH
- **Depende de**: `plans/001-evolve-prisma-domain-model.md`, `plans/002-build-pure-competition-engine.md`
- **Categoria**: correctness, architecture
- **Planejado em**: commit `7a6df45`, 2026-07-11

## Por que isso importa

Os onze contratos do SPEC combinam múltiplas escritas, conflitos de estado e resets destrutivos. Implementá-los diretamente em formulários deixaria check-then-act, sorteios parciais e confirmação obsoleta. Este plano cria a única fronteira de mutação, com erros discrimináveis e consultas projetadas para Server Components.

## Estado atual

- `lib/prisma.ts:1-28` fornece singleton Prisma com adapter PostgreSQL; preserve esse padrão.
- Não existem serviços, queries ou Server Actions.
- `SPEC.md:424-501` define os contratos conceituais obrigatórios.
- `docs/adr/0002-transactional-draws-and-phase-invalidation.md:12-17` exige sorteio/reset atômico e novo sorteio após correção.
- `docs/adr/0003-derived-live-standings.md:12-18` proíbe persistir totais da tabela.
- `docs/adr/0004-authoritative-score-independent-events.md:12-18` separa placar/eventos/pênaltis.
- A v1 deliberadamente não possui autenticação (`ADR 0001:12-17`); não reporte isso como falha nem crie usuários.

## Comandos necessários

| Finalidade | Comando                                         | Esperado                               |
| ---------- | ----------------------------------------------- | -------------------------------------- |
| Instalar   | `pnpm install --frozen-lockfile`                | exit 0                                 |
| Prisma     | `pnpm exec prisma validate && pnpm db:generate` | exit 0                                 |
| Lint       | `pnpm lint`                                     | exit 0                                 |
| Tipos      | `pnpm typecheck`                                | exit 0                                 |
| Build      | `pnpm build`                                    | exit 0                                 |
| Smoke DB   | `pnpm exec tsx -e '<script>'`                   | assertions passam em banco descartável |

## Ferramentas sugeridas

- Leia antes de codificar:
  - `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`;
  - `node_modules/next/dist/docs/01-app/01-getting-started/09-revalidating.md`;
  - `node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md`.
- Aplique `vercel-react-best-practices`: I/O paralelo em queries independentes, payloads serializáveis mínimos e nenhuma state global mutável no servidor.

## Escopo

**Em escopo**:

- `lib/championship/application/action-result.ts`
- `lib/championship/application/errors.ts`
- `lib/championship/application/transaction.ts`
- `lib/championship/application/group-service.ts`
- `lib/championship/application/match-service.ts`
- `lib/championship/application/tiebreak-service.ts`
- `lib/championship/application/knockout-service.ts`
- `lib/championship/application/queries.ts`
- `lib/championship/application/index.ts`
- `app/actions/groups.ts`
- `app/actions/matches.ts`
- `app/actions/knockout.ts`
- `package.json`/`pnpm-lock.yaml` somente para `zod`

**Fora de escopo**:

- schema/migration/seed, salvo corrigir import gerado após drift confirmado;
- alterar algoritmos puros do Plan 002 para acomodar I/O;
- UI/páginas/componentes;
- autenticação;
- testes persistentes;
- cache cross-request: o volume é pequeno e atualização deve ser imediata.

## Arquitetura obrigatória

```text
Server Component -> queries.ts -> Prisma (read-only projection)
Client form -> Server Action -> Zod -> application service -> Prisma transaction
                                               -> pure domain engine
```

Use este retorno público:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false
      error: {
        code: DomainErrorCode
        message: string
        confirmation?: { fingerprint: string; affectedStages: string[] }
        fieldErrors?: Record<string, string[]>
      }
    }
```

Erros esperados são valores; exceções inesperadas continuam lançando para error boundary/log. Nunca retorne stack trace.

## Fluxo Git

- Branch: `codex/003-application-services`
- Commits por agregado: `feat: implementa servicos de grupos`, `feat: implementa sumulas`, `feat: implementa progressao`.

## Passos

### Passo 1: criar contratos de erro, validação e transação

- Adicione `zod` como dependência de produção.
- Defina códigos: `VALIDATION_ERROR`, `NOT_FOUND`, `STATE_CONFLICT`, `CONFIRMATION_REQUIRED`, `STALE_CONFIRMATION`, `INVARIANT_VIOLATION`.
- Crie helper de transação Prisma `Serializable` com no máximo três tentativas apenas para conflito serializável/deadlock reconhecido pelo código Prisma; outros erros não são repetidos.
- Nenhum serviço deve receber `FormData`; ações fazem parsing Zod e passam DTO tipado.
- Use `import "server-only"` nos módulos que acessam Prisma.

**Verifique**: `pnpm typecheck && pnpm lint` → exit 0.

### Passo 2: implementar sorteio e novo sorteio de grupos

`group-service.ts` deve expor `drawGroups` e `redrawGroups`:

- validar exatamente dez participantes e dois cabeças distintos existentes;
- dentro de uma transação serializável, revalidar ausência/estado dos grupos;
- usar `RandomSource` de produção do domínio;
- sortear cabeça A/B, restantes e gerar rodadas para ambos;
- criar grupos, memberships e 20 partidas `PENDING` atomicamente;
- no redraw, exigir confirmação booleana explícita e verificar todas as partidas `PENDING`, scores nulos e zero eventos antes de deletar;
- mapear violação de unicidade concorrente para `STATE_CONFLICT`.

**Verifique**: em banco descartável seedado, smoke chama draw e consulta: A/B com 5, um seed cada, 10 jogos/5 rodadas por grupo, 20 partidas totais. Segunda tentativa sem redraw retorna conflito. Redraw antes de dados substitui tudo; depois de iniciar um jogo é rejeitado.

### Passo 3: implementar ciclo de partida e eventos

`match-service.ts` deve expor:

- `startMatch`: lock/releitura de `PENDING`, dois lados, inicialização 0–0;
- `updateMatchScore`: inteiros não negativos, somente `ONGOING` ou correção confirmada; pênaltis apenas em decisiva empatada e nunca iguais;
- `addMatchEvent`/`removeMatchEvent`: partida não `PENDING`, jogador pertencente a um dos elencos, uma ocorrência por chamada, sem alterar score;
- `completeMatch`: scores presentes; pênaltis quando exigidos; status/completedAt; criação automática da final ao concluir a segunda semifinal;
- `analyzeCorrection`: calcular fases posteriores afetadas sem escrever;
- `correctMatch`: recomputar impacto dentro da transação, validar confirmação e aplicar reset + correção atomicamente.

O fingerprint de confirmação deve ser hash estável de `matchId`, mudanças normalizadas, `match.updatedAt` e IDs/`updatedAt` das partidas dependentes. Se mudar, retorne `STALE_CONFIRMATION` com novo preview; nunca aceite fingerprint só do cliente.

Delete dependências em ordem final→semifinal→quartas. Cascades removem lados/eventos, não participantes/jogadores.

**Verifique**: smokes DB para iniciar 0–0, rejeitar evento de elenco externo, aceitar divergência placar/gols, exigir pênaltis, completar, preview de correção, fingerprint obsoleto rejeitado e reset confirmado sem órfãos.

### Passo 4: implementar desempates do G4

`tiebreak-service.ts` deve:

- exigir 20 partidas regulares `COMPLETED`;
- carregar dados do grupo em lote e usar engine puro;
- rejeitar quando não há empate absoluto no corte;
- criar `GroupTiebreak`, participantes e confrontos em uma transação;
- evitar segunda série ativa concorrente;
- ao concluir a série, persistir status/resolução necessária à qualificação, sem copiar números para tabela regular;
- criar nova tentativa só para subconjunto ainda empatado, usando `attempt + 1`;
- usar partida decisiva com pênaltis quando restarem dois.

**Verifique**: smokes para ausência de empate, dois envolvidos, três envolvidos/duas vagas e repetição. Consultar tabela regular antes/depois mostra totais idênticos e qualificação resolvida.

### Passo 5: implementar sorteios e progressão do mata-mata

`knockout-service.ts` deve:

- quartas: exigir grupos/regulares/desempates resolvidos e exatamente oito classificados;
- semifinais: exigir quatro quartas concluídas e quatro vencedores;
- parear livremente via engine e criar fase inteira em uma transação;
- redraw somente com todos os jogos da fase `PENDING`, sem score/evento, com confirmação;
- final criada por `completeMatch` somente após duas semifinais e idempotentemente;
- nunca criar oitavas/terceiro lugar.

**Verifique**: smokes para bloqueios prematuros, 8→4, same-group permitido, redraw limpo, redraw com dados rejeitado, 4→2 e final única após duas semis.

### Passo 6: criar queries projetadas

`queries.ts` deve fornecer DTOs serializáveis mínimos para:

- dashboard: fase/próximo passo, contagens, resultados recentes, quatro rankings;
- grupos: memberships, standings derivados, rodadas/folgas, desempates;
- mata-mata: nós existentes por fase e eligibility/ação seguinte;
- participante: perfil e 16 jogadores;
- partida: lados, elencos agrupados, score, eventos, permissões de estado e preview de dependência.

Evite N+1: cada página deve usar poucas queries com `include/select` e executar blocos independentes em `Promise.all`. Não serialize instâncias Prisma para Client Components.

**Verifique**: smokes de query retornam JSON serializável (`JSON.stringify` sem erro), sem campos de conexão/segredos e cardinalidades esperadas.

### Passo 7: criar Server Actions finas

Em `app/actions/*.ts`:

- declare `"use server"`;
- valide inputs com schemas Zod locais/exportados;
- chame exatamente um serviço por ação;
- converta erros esperados para `ActionResult`;
- após sucesso, use `updateTag` ou `revalidatePath` de forma precisa para `/`, `/grupos`, `/mata-mata`, participante/partida afetados;
- não contenha regras esportivas, loops de persistência ou acesso Prisma direto.

**Verifique**:

- `rg -n "@/lib/prisma|prisma\." app/actions` → nenhuma ocorrência;
- `pnpm exec prisma validate && pnpm db:generate && pnpm lint && pnpm typecheck && pnpm build` → todos passam.

## Plano de verificação

Não criar testes persistentes. Execute os smokes transacionais nomeados em banco descartável, cada um dentro de setup/cleanup explícito, e registre comandos/resultados na entrega. Verifique depois que não restaram dados de smoke no banco usado.

## Critérios de conclusão

- [ ] Todos os contratos do SPEC possuem serviço e ação/consulta correspondente.
- [ ] Sorteios/resets/correções são serializáveis e atômicos.
- [ ] Fingerprint obsoleto nunca autoriza reset.
- [ ] Eventos validam pertencimento de elenco e não alteram placar.
- [ ] Classificação/rankings vêm do motor, não de totais persistidos.
- [ ] Queries evitam N+1 e retornam DTOs serializáveis.
- [ ] Server Actions só validam, delegam, mapeiam e invalidam.
- [ ] Prisma, lint, typecheck e build passam; nenhum teste persistente adicionado.

## Condições de parada

Pare se:

- Planos 001/002 não estiverem concluídos ou APIs divergirem;
- existirem dados competitivos reais que os smokes/reset possam atingir;
- Prisma não suportar isolamento/retry como planejado;
- uma correção não puder determinar dependências sem nova decisão de produto;
- for necessário autenticação, audit log ou campos fora do SPEC;
- um gate falhar duas vezes ou arquivo fora do escopo for necessário.

## Notas de manutenção

- Reviewer deve procurar check-then-act fora da transação e regras duplicadas nas ações.
- Não adicione cache cross-request até haver medição; read-your-own-writes é prioritário.
- Se autenticação entrar no futuro, todas as Server Actions deverão ganhar autorização server-side antes de exposição pública.
