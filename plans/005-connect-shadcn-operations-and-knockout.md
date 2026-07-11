# Plano 005: Conectar operações shadcn, correções seguras e progressão do mata-mata

> **Instruções ao executor**: conecte somente as Server Actions do Plano 003 aos estados read-only do Plano 004. Toda primitive deve ser shadcn. Ações destrutivas exigem preview/confirm e nunca usam atualização otimista. Execute todos os smokes manuais e gates. Atualize o índice ao concluir.
>
> **Verificação de drift**: `git diff --stat 7a6df45..HEAD -- app components/championship components/ui app/actions lib/championship/application SPEC.md`
> Se actions, `ActionResult`, read models ou composites divergirem, pare e reporte.

## Status

- **Prioridade**: P2
- **Esforço**: L
- **Risco**: HIGH
- **Depende de**: `plans/003-implement-transactional-application-services.md`, `plans/004-build-shadcn-read-experience.md`
- **Categoria**: direction, correctness
- **Planejado em**: commit `7a6df45`, 2026-07-11

## Por que isso importa

O produto só cumpre seu objetivo quando um operador consegue sortear, registrar partidas e avançar fases sem acessar o banco. O maior risco está em confirmações destrutivas e estados concorrentes; a UI deve exibir exatamente o impacto devolvido pelo servidor e reagir a conflitos sem reconstruir regras no cliente.

## Estado atual esperado após dependências

- Plan 003 fornece ações de grupos, partidas e mata-mata com `ActionResult` discriminado.
- Plan 004 fornece as cinco rotas read-only e composites shadcn.
- `SPEC.md:172-243` fixa sorteios, redraw, progressão e reset downstream.
- `SPEC.md:245-280` fixa status manual, placar autoritativo, eventos e pênaltis.
- `SPEC.md:369-422` exige ações destrutivas confirmadas, erros claros e chave mobile horizontal.
- `docs/adr/0002-transactional-draws-and-phase-invalidation.md:12-17` proíbe preservar fase posterior inconsistente.

## Comandos necessários

| Finalidade | Comando                                         | Esperado                                    |
| ---------- | ----------------------------------------------- | ------------------------------------------- |
| Primitive  | `pnpm exec shadcn add <component>`              | componente gerado em `components/ui/`       |
| Prisma     | `pnpm exec prisma validate && pnpm db:generate` | exit 0                                      |
| Lint       | `pnpm lint`                                     | exit 0                                      |
| Tipos      | `pnpm typecheck`                                | exit 0                                      |
| Build      | `pnpm build`                                    | exit 0                                      |
| Dev smoke  | `pnpm dev`                                      | servidor inicia; fluxos manuais executáveis |

## Ferramentas sugeridas

- Use `frontend-design` para manter a direção visual e `vercel-react-best-practices` para boundaries/loading.
- Leia antes:
  - `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`;
  - `node_modules/next/dist/docs/01-app/02-guides/forms.md`;
  - `node_modules/next/dist/docs/01-app/01-getting-started/09-revalidating.md`.
- Use `useActionState` para erros esperados e `useFormStatus`/`useTransition` para pending, conforme Next 16/React 19.

## Escopo

**Em escopo**:

- páginas das cinco rotas para substituir placeholders e conectar actions;
- `components/championship/group-draw-form.tsx`
- `components/championship/destructive-confirmation.tsx`
- `components/championship/match-controls.tsx`
- `components/championship/score-form.tsx`
- `components/championship/event-form.tsx`
- `components/championship/correction-dialog.tsx`
- `components/championship/knockout-controls.tsx`
- `components/championship/action-feedback.tsx`
- `components/ui/**` somente via CLI shadcn

**Fora de escopo**:

- modificar regra, transaction ou schema para simplificar UI;
- biblioteca de componentes diferente de shadcn;
- autenticação, agenda, notificações, WebSocket/polling multiusuário;
- atualização otimista de sorteio, conclusão, correção ou reset;
- testes unitários/integrados/E2E persistentes;
- edição de participantes/elencos.

## Princípios de interação

- “Ao vivo” significa que dados salvos em partida `ONGOING` entram imediatamente após a resposta/revalidação; não implica push entre navegadores.
- Botão usa verbo e resultado iguais: “Iniciar partida” → “Partida iniciada”.
- Erros esperados aparecem próximos ao formulário com `aria-live`; não usar alert genérico “Algo deu errado”.
- Pending desabilita somente a ação relacionada e mostra `Spinner`.
- Destrutivo usa `AlertDialog`, lista impacto e exige segundo clique; nunca `window.confirm`.
- IDs e regras não são reimplementados no cliente; options vêm do read model.

## Fluxo Git

- Branch: `codex/005-shadcn-operations`
- Commits por fluxo: grupos, súmula, mata-mata/correções.

## Passos

### Passo 1: instalar primitives operacionais shadcn

Use o CLI com `components.json` para adicionar:

```text
alert-dialog dialog field input select checkbox sonner spinner
```

Se `field` compuser label/description/error, use-o como padrão; não instale outro form framework. Monte `Toaster` shadcn uma vez no layout, mantendo layout server-first (o toaster é ilha cliente).

**Verifique**: componentes existem em `components/ui`, nenhum pacote UI alternativo foi adicionado e `pnpm typecheck` passa.

### Passo 2: conectar sorteio e redraw de grupos

`group-draw-form.tsx`:

- renderiza os dez participantes como cards com `Checkbox` shadcn;
- impede visualmente mais de dois, mas servidor continua validando;
- contador “2 de 2 selecionados”;
- ação “Sortear grupos” só habilita com exatamente dois;
- usa `useActionState` e exibe field/global errors.

Após sucesso, toast “Grupos sorteados” e atualização de `/`/`/grupos`. Para redraw, use `AlertDialog` com texto explícito de que grupos e 20 partidas pendentes serão substituídos. Se servidor retornar `STATE_CONFLICT`, mantenha dados e explique qual condição bloqueia.

**Verifique**: 0/1/3 IDs não acionam sucesso; 2 sorteiam; redraw limpo funciona; após iniciar jogo, redraw é bloqueado sem perda.

### Passo 3: conectar ciclo e placar da partida

Em `/partidas/[id]`:

- `PENDING`: botão “Iniciar partida”;
- `ONGOING`: dois `Input type=number` com `min=0`, salvar placar e concluir;
- decisiva empatada: campos separados “Pênaltis” aparecem antes de concluir;
- `COMPLETED`: modo leitura com ação “Corrigir súmula”.

Não sincronize score com eventos. Ao iniciar, mostrar 0–0 retornado pelo servidor. Concluir deve esperar a resposta; final automática é informada por toast quando aplicável.

**Verifique**: transições PENDING→ONGOING→COMPLETED, negativos rejeitados server-side, empate regular aceito, eliminatório empatado exige pênaltis diferentes.

### Passo 4: conectar eventos independentes

`event-form.tsx` usa:

- `Select` de tipo com Gol/Assistência/Amarelo/Vermelho;
- `Select` de jogador agrupado pelos dois participantes e limitado aos 32 do read model;
- ação “Adicionar evento”;
- lista de ocorrências com botão shadcn de remoção individual e nome/participante.

Permita múltiplas ocorrências idênticas. Não limite assistências por gols. Para segundo amarelo/expulsão, operador adiciona duas ocorrências amarelas e uma vermelha. Evento em partida pendente ou jogador adulterado no payload deve retornar erro e não aparecer.

**Verifique**: adicionar/remover cada tipo, múltiplos iguais, externo rejeitado, placar não muda, rankings/dashboard mudam após revalidação.

### Passo 5: implementar correção com preview resistente a drift

“Corrigir súmula” abre `Dialog` para editar score/eventos. Antes de gravar, chame análise server-side:

- sem dependências: confirmar alteração simples;
- com dependências: abrir `AlertDialog` listando exatamente fases/quantidade de partidas que serão apagadas e mostrar aviso sem auditoria/undo;
- enviar fingerprint devolvido pelo servidor;
- se `STALE_CONFIRMATION`, fechar pending, atualizar lista/fingerprint e exigir nova confirmação;
- se confirmado, aguardar transação e navegar ao estado recalculado.

Nunca esconda reset em toast posterior; impacto precisa estar visível antes do clique final.

**Verifique**: correção de grupo apaga QF/SF/F; correção de QF apaga SF/F; correção de SF apaga F; fingerprint obsoleto não grava; cancelamento não muda banco.

### Passo 6: conectar desempates do G4

Em `/grupos`, quando read model indicar `requiresTiebreak`:

- Alert prioritário informa envolvidos e vagas;
- ação “Criar desempate” chama servidor;
- dois envolvidos geram partida decisiva; 3+ mostram turno/rodadas;
- partidas de desempate reutilizam cards e súmula;
- concluída série, tabela mantém números regulares e exibe indicador de vaga resolvida;
- nova tentativa só aparece quando servidor detectar empate persistente.

**Verifique**: não há botão sem empate; formatos 2 e 3+ corretos; números da tabela não mudam; rankings contam eventos desses jogos.

### Passo 7: conectar quartas, semifinais, redraw e final

`knockout-controls.tsx` renderiza somente a ação permitida pelo read model:

- “Sortear quartas” após grupos/desempates;
- “Sortear semifinais” após quatro quartas;
- redraw da fase em `AlertDialog` apenas sem dados;
- nenhuma ação de sorteio da final; ela aparece automaticamente após a segunda semifinal.

Depois do sucesso, atualize `/mata-mata` e dashboard. Chave mantém colunas e scroll horizontal. Same-group não recebe alerta. Nunca renderize oitavas ou terceiro lugar.

**Verifique**: ações prematuras desabilitadas com tooltip; quartas 4 nós, semifinais 2, final 1; redraw com dados rejeitado sem perda; final única.

### Passo 8: acessibilidade, feedback e gates finais

- `aria-live="polite"` para feedback;
- foco retorna ao gatilho ao fechar Dialog e vai ao primeiro erro na falha;
- AlertDialog destrutivo identifica título/descrição;
- teclado opera checkbox/select/dialog;
- nenhum `useEffect` para derivar estado de formulário quando pode ser derivado no render;
- use `useTransition` somente para ação não urgente e preserve feedback.

**Verifique**:

- `pnpm exec prisma validate && pnpm db:generate && pnpm lint && pnpm typecheck && pnpm build` → exit 0;
- smoke manual completo em 375/768/1440 px;
- `rg -n "window\.confirm|@mui|antd|chakra|mantine" app components` → nenhuma ocorrência;
- `git status --short` → somente escopo e índice.

## Plano de verificação

Sem suíte persistente. Em banco de desenvolvimento descartável, execute manualmente um campeonato completo: seed, sorteio, ao menos um jogo com eventos, cenários de empate/desempate preparados, quartas, semis, final, redraw limpo e correção downstream. Registre checklist e screenshots na entrega; limpe somente o banco descartável, nunca dados reais.

## Critérios de conclusão

- [ ] Todos os controles usam primitives shadcn.
- [ ] Sorteio/redraw de grupos funciona com validação e confirmação.
- [ ] Súmula cobre iniciar, score, eventos, pênaltis, concluir e corrigir.
- [ ] Correção apresenta impacto e rejeita fingerprint stale.
- [ ] Desempates cobrem 2 e 3+ sem contaminar tabela.
- [ ] Quartas/semis/redraw/final automática cumprem SPEC.
- [ ] Feedback é específico, acessível e não otimista em destrutivos.
- [ ] Mobile preserva tabela/chave por scroll local.
- [ ] Prisma, lint, typecheck e build passam; nenhum teste persistente adicionado.

## Condições de parada

Pare se:

- qualquer plano dependente não estiver `DONE`;
- a UI precisar reconstruir regra/impacto não presente no retorno servidor;
- ação destrutiva não puder ser revalidada na transação;
- CLI shadcn quiser mudar estilo/aliases/icon library;
- houver necessidade de WebSocket/auth/agenda;
- smoke estiver apontando para banco não descartável;
- gate falhar duas vezes ou arquivo fora do escopo for necessário.

## Notas de manutenção

- Se uso simultâneo por múltiplos navegadores crescer, avaliar revalidação periódica/push em plano separado; não antecipar agora.
- Reviewer deve simular confirmação obsoleta e verificar que o servidor, não o Dialog, decide impacto.
- Toda nova primitive deve ser instalada pelo shadcn CLI e composta segundo `components.json`.
